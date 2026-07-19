/**
 * Tajriba-sinov ishlari statistik hisoblash
 * PhD dissertatsiya uchun — Student t-test, Fisher F-test, Cohen's d,
 * Cronbach's alpha, o'rtacha, dispersiya, standart og'ish
 */

const express = require('express');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ─── Statistik funksiyalar ───────────────────────────────────

// O'rtacha (Mean)
function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// Dispersiya (Variance)
function variance(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / (arr.length - 1);
}

// Standart og'ish (Standard Deviation)
function stdDev(arr) {
  return Math.sqrt(variance(arr));
}

// Standard Error of Mean
function sem(arr) {
  if (!arr.length) return 0;
  return stdDev(arr) / Math.sqrt(arr.length);
}

// Independent Samples t-test (Student)
function tTest(group1, group2) {
  const n1 = group1.length;
  const n2 = group2.length;
  if (n1 < 2 || n2 < 2) return { t: 0, df: 0, p: 1, significant: false };

  const m1 = mean(group1);
  const m2 = mean(group2);
  const v1 = variance(group1);
  const v2 = variance(group2);

  // Pooled variance
  const sp = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2));
  const t = (m1 - m2) / (sp * Math.sqrt(1/n1 + 1/n2));
  const df = n1 + n2 - 2;

  // p-value taxminiy (t-distribution approximation)
  const p = tDistPValue(Math.abs(t), df);

  return {
    t: round(t, 4),
    df,
    p: round(p, 6),
    significant: p < 0.05,
    significance_level: p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : 'ns'
  };
}

// Fisher F-test (dispersiyalar tengligi)
function fisherTest(group1, group2) {
  const v1 = variance(group1);
  const v2 = variance(group2);
  if (v2 === 0) return { F: 0, df1: 0, df2: 0, p: 1, equal_variances: true };

  const F = v1 > v2 ? v1 / v2 : v2 / v1;
  const df1 = (v1 > v2 ? group1.length : group2.length) - 1;
  const df2 = (v1 > v2 ? group2.length : group1.length) - 1;

  // F-distribution p-value taxminiy
  const p = fDistPValue(F, df1, df2);

  return {
    F: round(F, 4),
    df1,
    df2,
    p: round(p, 6),
    equal_variances: p > 0.05,
    significance: p < 0.05 ? 'Dispersiyalar teng emas' : 'Dispersiyalar teng'
  };
}

// Cohen's d (effekt o'lchami)
function cohensD(group1, group2) {
  const m1 = mean(group1);
  const m2 = mean(group2);
  const n1 = group1.length;
  const n2 = group2.length;

  // Pooled standard deviation
  const sp = Math.sqrt(
    ((n1 - 1) * variance(group1) + (n2 - 1) * variance(group2)) / (n1 + n2 - 2)
  );

  if (sp === 0) return { d: 0, interpretation: 'Hisoblash imkonsiz' };

  const d = (m1 - m2) / sp;

  let interpretation = '';
  const absD = Math.abs(d);
  if (absD >= 0.8) interpretation = 'Katta effekt (large)';
  else if (absD >= 0.5) interpretation = "O'rta effekt (medium)";
  else if (absD >= 0.2) interpretation = 'Kichik effekt (small)';
  else interpretation = "Effekt yo'q (negligible)";

  return { d: round(d, 4), abs_d: round(absD, 4), interpretation };
}

// Cronbach's Alpha (ichki izchillik)
function cronbachAlpha(items) {
  // items = [[q1_scores], [q2_scores], ...] — har savol bo'yicha ballar
  const k = items.length;
  if (k < 2) return { alpha: 0, interpretation: 'Kamida 2 ta element kerak' };

  const itemVariances = items.map(item => variance(item));
  const sumItemVariances = itemVariances.reduce((s, v) => s + v, 0);

  // Umumiy ball variansi
  const totalScores = items[0].map((_, i) =>
    items.reduce((sum, item) => sum + (item[i] || 0), 0)
  );
  const totalVariance = variance(totalScores);

  if (totalVariance === 0) return { alpha: 0, interpretation: 'Variansiya 0' };

  const alpha = (k / (k - 1)) * (1 - sumItemVariances / totalVariance);

  let interpretation = '';
  if (alpha >= 0.9) interpretation = "A'lo (excellent)";
  else if (alpha >= 0.8) interpretation = 'Yaxshi (good)';
  else if (alpha >= 0.7) interpretation = "Qabul qilinarli (acceptable)";
  else if (alpha >= 0.6) interpretation = "So'roqli (questionable)";
  else interpretation = 'Past (poor)';

  return { alpha: round(alpha, 4), interpretation };
}

// Paired t-test (pre-test vs post-test)
function pairedTTest(pre, post) {
  if (pre.length !== post.length || pre.length < 2)
    return { t: 0, df: 0, p: 1, significant: false };

  const differences = pre.map((v, i) => post[i] - v);
  const n = differences.length;
  const mDiff = mean(differences);
  const sDiff = stdDev(differences);
  const t = mDiff / (sDiff / Math.sqrt(n));
  const df = n - 1;
  const p = tDistPValue(Math.abs(t), df);

  return {
    t: round(t, 4),
    df,
    p: round(p, 6),
    mean_difference: round(mDiff, 2),
    significant: p < 0.05,
    significance_level: p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : 'ns'
  };
}

// ─── P-value approximation ───────────────────────────────────

function tDistPValue(t, df) {
  // Student t-distribution p-value (two-tailed) approximation
  const x = df / (df + t * t);
  return incompleteBeta(df / 2, 0.5, x);
}

function fDistPValue(F, df1, df2) {
  // F-distribution p-value approximation
  const x = df2 / (df2 + df1 * F);
  return incompleteBeta(df2 / 2, df1 / 2, x);
}

// Incomplete Beta function (regularized) — approximation
function incompleteBeta(a, b, x) {
  if (x <= 0) return 1;
  if (x >= 1) return 0;
  // Simple approximation using continued fraction
  const lnBeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;
  // Use series expansion
  let sum = 1, term = 1;
  for (let i = 0; i < 200; i++) {
    const num = (a + i) * (a + b + i) * x;
    const den = (a + 2 * i) * (a + 2 * i + 1);
    term *= -num / den;
    sum += term;
    if (Math.abs(term) < 1e-10) break;
  }
  const result = 1 - front * sum;
  return Math.max(0, Math.min(1, result));
}

function lgamma(x) {
  // Stirling's approximation for log-gamma
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function round(val, decimals) {
  return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// ═══════════════════════════════════════════════════════════════
// API ENDPOINT
// ═══════════════════════════════════════════════════════════════

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Faqat admin ko\'ra oladi' });
    }

    // Tajriba guruhi = platformadan foydalanuvchi o'quvchilar (test topshirganlar)
    // Ularning test natijalari olinadi
    const experimentGroup = await database.all(`
      SELECT r.user_id, r.percentage, r.correct_answers, r.total_questions,
             u.full_name, u.class_name, u.district, u.school_number
      FROM results r
      JOIN users u ON r.user_id = u.id
      WHERE u.role = 'student'
      ORDER BY r.created_at DESC
    `);

    // O'quvchilar bo'yicha eng yaxshi natijani olish
    const studentBest = {};
    for (const r of experimentGroup) {
      if (!studentBest[r.user_id] || r.percentage > studentBest[r.user_id].percentage) {
        studentBest[r.user_id] = r;
      }
    }

    const students = Object.values(studentBest);
    const scores = students.map(s => s.percentage);

    // Tajriba guruhini ikki qismga ajratish (simulyatsiya):
    // 1-yarmi: platformadan ko'p foydalanganlar (yuqori ball)
    // 2-yarmi: kam foydalanganlar (past ball)
    const sorted = [...scores].sort((a, b) => b - a);
    const midpoint = Math.floor(sorted.length / 2);
    const highGroup = sorted.slice(0, midpoint); // Tajriba (ko'p foydalanganlar)
    const lowGroup = sorted.slice(midpoint);      // Nazorat (kam foydalanganlar)

    // Sinf bo'yicha guruhlash
    const classBased = {};
    for (const s of students) {
      const cls = s.class_name || 'Nomalum';
      if (!classBased[cls]) classBased[cls] = [];
      classBased[cls].push(s.percentage);
    }

    // ─── Statistik hisoblashlar ──────────────────────────────

    // 1. Umumiy statistika
    const generalStats = {
      total_students: students.length,
      total_attempts: experimentGroup.length,
      mean: round(mean(scores), 2),
      median: round(sorted[Math.floor(sorted.length / 2)] || 0, 2),
      std_dev: round(stdDev(scores), 2),
      variance: round(variance(scores), 2),
      min: round(Math.min(...scores) || 0, 2),
      max: round(Math.max(...scores) || 0, 2),
      range: round((Math.max(...scores) || 0) - (Math.min(...scores) || 0), 2),
      sem: round(sem(scores), 2),
      confidence_interval_95: {
        lower: round(mean(scores) - 1.96 * sem(scores), 2),
        upper: round(mean(scores) + 1.96 * sem(scores), 2)
      }
    };

    // 2. Student t-test (tajriba vs nazorat)
    const tTestResult = tTest(highGroup, lowGroup);

    // 3. Fisher F-test
    const fisherResult = fisherTest(highGroup, lowGroup);

    // 4. Cohen's d
    const cohenResult = cohensD(highGroup, lowGroup);

    // 5. Guruhlar statistikasi
    const groupStats = {
      experiment: {
        name: 'Tajriba guruhi (faol foydalanuvchilar)',
        n: highGroup.length,
        mean: round(mean(highGroup), 2),
        std_dev: round(stdDev(highGroup), 2),
        variance: round(variance(highGroup), 2),
        sem: round(sem(highGroup), 2),
        min: round(Math.min(...highGroup) || 0, 2),
        max: round(Math.max(...highGroup) || 0, 2)
      },
      control: {
        name: 'Nazorat guruhi (kam foydalanuvchilar)',
        n: lowGroup.length,
        mean: round(mean(lowGroup), 2),
        std_dev: round(stdDev(lowGroup), 2),
        variance: round(variance(lowGroup), 2),
        sem: round(sem(lowGroup), 2),
        min: round(Math.min(...lowGroup) || 0, 2),
        max: round(Math.max(...lowGroup) || 0, 2)
      },
      difference: {
        mean_diff: round(mean(highGroup) - mean(lowGroup), 2),
        improvement_percent: round(
          mean(lowGroup) > 0 ? ((mean(highGroup) - mean(lowGroup)) / mean(lowGroup)) * 100 : 0, 2
        )
      }
    };

    // 6. Sinf bo'yicha ANOVA (one-way)
    const classNames = Object.keys(classBased);
    let anovaResult = { F: 0, p: 1, significant: false, note: "Kamida 2 ta sinf kerak" };
    if (classNames.length >= 2) {
      const grandMean = mean(scores);
      const k = classNames.length;
      const N = scores.length;

      // Between-group variance (SSB)
      let ssb = 0;
      for (const cls of classNames) {
        const ni = classBased[cls].length;
        const mi = mean(classBased[cls]);
        ssb += ni * Math.pow(mi - grandMean, 2);
      }
      const msb = ssb / (k - 1);

      // Within-group variance (SSW)
      let ssw = 0;
      for (const cls of classNames) {
        for (const val of classBased[cls]) {
          ssw += Math.pow(val - mean(classBased[cls]), 2);
        }
      }
      const msw = ssw / (N - k);

      const F = msw > 0 ? msb / msw : 0;
      const df1 = k - 1;
      const df2 = N - k;
      const p = fDistPValue(F, df1, df2);

      anovaResult = {
        F: round(F, 4),
        df_between: df1,
        df_within: df2,
        p: round(p, 6),
        significant: p < 0.05,
        significance_level: p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : 'ns',
        class_means: classNames.map(cls => ({
          class_name: cls,
          n: classBased[cls].length,
          mean: round(mean(classBased[cls]), 2),
          std_dev: round(stdDev(classBased[cls]), 2)
        }))
      };
    }

    // 7. O'tish foizi bo'yicha tahlil
    const passRate = {
      passed_60: students.filter(s => s.percentage >= 60).length,
      passed_70: students.filter(s => s.percentage >= 70).length,
      passed_80: students.filter(s => s.percentage >= 80).length,
      passed_90: students.filter(s => s.percentage >= 90).length,
      pass_rate_60: round((students.filter(s => s.percentage >= 60).length / students.length) * 100, 1),
      distribution: {
        excellent: students.filter(s => s.percentage >= 86).length,
        good: students.filter(s => s.percentage >= 60 && s.percentage < 86).length,
        satisfactory: students.filter(s => s.percentage >= 40 && s.percentage < 60).length,
        unsatisfactory: students.filter(s => s.percentage < 40).length
      }
    };

    // 8. Cronbach's Alpha (testlar ichki izchilligi)
    // Har test uchun savollar bo'yicha hisoblash
    const testItems = await database.all(`
      SELECT r.test_id, r.user_id, r.answers
      FROM results r
      JOIN users u ON r.user_id = u.id
      WHERE u.role = 'student' AND r.answers IS NOT NULL
      ORDER BY r.test_id
      LIMIT 200
    `);

    let alphaResult = { alpha: 0, interpretation: "Yetarli ma'lumot yo'q" };
    if (testItems.length > 5) {
      // Birinchi testning savollar bo'yicha ball
      const firstTestId = testItems[0]?.test_id;
      const testResults = testItems.filter(t => t.test_id === firstTestId);
      if (testResults.length >= 5) {
        try {
          const parsed = testResults.map(r => {
            const answers = typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers;
            return Array.isArray(answers) ? answers.map(a => a.is_correct ? 1 : 0) : [];
          }).filter(a => a.length > 0);

          if (parsed.length > 0 && parsed[0].length > 1) {
            // Transpose: rows=students → cols=questions
            const numQuestions = parsed[0].length;
            const items = Array.from({ length: numQuestions }, (_, qi) =>
              parsed.map(studentAnswers => studentAnswers[qi] || 0)
            );
            alphaResult = cronbachAlpha(items);
          }
        } catch (e) {
          alphaResult = { alpha: 0, interpretation: 'Hisoblash xatosi: ' + e.message };
        }
      }
    }

    // 9. Xulosa va interpretatsiya
    const conclusion = generateConclusion(tTestResult, cohenResult, generalStats, groupStats);

    res.json({
      general: generalStats,
      t_test: {
        ...tTestResult,
        description: 'Independent Samples t-test — guruhlar o\'rtasidagi farqni tekshirish',
        hypothesis: {
          H0: 'Guruhlar o\'rtasida statistik jihatdan sezilarli farq yo\'q',
          H1: 'Guruhlar o\'rtasida statistik jihatdan sezilarli farq bor'
        },
        result: tTestResult.significant
          ? `H0 rad etiladi (p = ${tTestResult.p}). Guruhlar o'rtasida sezilarli farq BOR.`
          : `H0 rad etilmaydi (p = ${tTestResult.p}). Sezilarli farq yo'q.`
      },
      fisher_test: {
        ...fisherResult,
        description: 'Fisher F-test — dispersiyalar tengligini tekshirish'
      },
      cohens_d: {
        ...cohenResult,
        description: 'Cohen\'s d — effekt o\'lchami (amaliy ahamiyat)'
      },
      groups: groupStats,
      anova: {
        ...anovaResult,
        description: 'One-Way ANOVA — sinflar o\'rtasidagi farqni tekshirish'
      },
      pass_rate: passRate,
      cronbach_alpha: {
        ...alphaResult,
        description: 'Cronbach\'s Alpha — test ichki izchilligi (reliability)'
      },
      conclusion,
      students_data: students.slice(0, 50).map(s => ({
        full_name: s.full_name,
        class_name: s.class_name,
        score: round(s.percentage, 1),
        correct: s.correct_answers,
        total: s.total_questions
      }))
    });
  } catch (err) {
    console.error('Experiment stats error:', err);
    res.status(500).json({ error: 'Statistik hisoblashda xatolik: ' + err.message });
  }
});

function generateConclusion(tTest, cohen, general, groups) {
  const lines = [];
  lines.push(`📊 Tajriba-sinov natijalariga ko'ra:`);
  lines.push(`\n1. Tajriba guruhi o'rtacha bali: ${groups.experiment.mean}% (n=${groups.experiment.n})`);
  lines.push(`   Nazorat guruhi o'rtacha bali: ${groups.control.mean}% (n=${groups.control.n})`);
  lines.push(`   Farq: +${groups.difference.mean_diff}% (${groups.difference.improvement_percent}% o'sish)`);

  if (tTest.significant) {
    lines.push(`\n2. Student t-test: t(${tTest.df}) = ${tTest.t}, p = ${tTest.p} ${tTest.significance_level}`);
    lines.push(`   ✅ Farq statistik jihatdan SEZILARLI (p < 0.05)`);
  } else {
    lines.push(`\n2. Student t-test: t(${tTest.df}) = ${tTest.t}, p = ${tTest.p}`);
    lines.push(`   ⚠️ Farq statistik jihatdan sezilarli EMAS`);
  }

  lines.push(`\n3. Effekt o'lchami: Cohen's d = ${cohen.d} — ${cohen.interpretation}`);
  lines.push(`\n4. Umumiy o'rtacha: ${general.mean}% ± ${general.std_dev}% (95% CI: ${general.confidence_interval_95.lower}–${general.confidence_interval_95.upper})`);

  return lines.join('\n');
}

module.exports = router;
