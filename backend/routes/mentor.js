/**
 * AI Shaxsiy Mentor — har o'quvchi uchun individual AI maslahatchi
 * Haftada 1 marta yangilanadi, qolganda keshdan ko'rsatiladi
 */
const express = require('express');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { chat } = require('../utils/ai');

const router = express.Router();

// ─── GET /api/mentor — keshdan oxirgi maslahatni olish ──────
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Faqat o\'quvchilar uchun' });
    }

    const cached = await database.get(
      'SELECT * FROM ai_mentor_cache WHERE student_id = ?',
      [req.user.id]
    );

    if (!cached) {
      return res.json({ exists: false });
    }

    res.json({
      exists: true,
      advice: JSON.parse(cached.advice_json || '{}'),
      generated_at: cached.generated_at
    });
  } catch (err) {
    console.error('Get mentor error:', err);
    res.status(500).json({ error: 'Mentor ma\'lumotini olishda xatolik' });
  }
});

// ─── POST /api/mentor/generate — AI mentor maslahat yaratish ─
router.post('/generate', authenticateToken, aiLimiter, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Faqat o\'quvchilar uchun' });
    }

    const studentId = req.user.id;

    // Haftada 1 martadan ko'p yangilanmasligi (7 kun)
    const cached = await database.get(
      'SELECT generated_at FROM ai_mentor_cache WHERE student_id = ?',
      [studentId]
    );
    if (cached && cached.generated_at) {
      const lastGenerated = new Date(cached.generated_at);
      const now = new Date();
      const daysDiff = (now - lastGenerated) / (1000 * 60 * 60 * 24);
      if (daysDiff < 7 && !req.body.force) {
        return res.status(429).json({
          error: 'Mentor maslahat haftada 1 marta yangilanadi',
          next_available: new Date(lastGenerated.getTime() + 7 * 24 * 60 * 60 * 1000),
          days_remaining: Math.ceil(7 - daysDiff)
        });
      }
    }

    // ═══ O'quvchi haqida barcha ma'lumotlarni yig'ish ═══

    const student = await database.get(
      'SELECT id, full_name, class_name, district, school_number, mastery_percent, level, points, bonus_points, created_at FROM users WHERE id = ?',
      [studentId]
    );

    // 1. Dars progresslari (har dars bo'yicha ball/baho)
    const lessonProgress = await database.all(`
      SELECT lp.*, l.title AS lesson_title, l.subject
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      WHERE lp.student_id = ? AND l.taught_at IS NOT NULL
      ORDER BY lp.percent DESC
    `, [studentId]);

    // 2. Test natijalari (oxirgi 20 ta)
    const testResults = await database.all(`
      SELECT r.percentage, r.correct_answers, r.total_questions, r.created_at,
             t.title AS test_title, t.subject
      FROM results r
      JOIN tests t ON r.test_id = t.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC LIMIT 20
    `, [studentId]);

    // 3. Amaliy topshiriq natijalari
    const assignmentResults = await database.all(`
      SELECT s.score, a.max_score, a.task_type, a.title AS assignment_title, s.submitted_at
      FROM assignment_submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.student_id = ? AND s.status = 'graded'
      ORDER BY s.submitted_at DESC LIMIT 15
    `, [studentId]);

    // 4. Adaptiv test natijalari (concept_scores)
    const adaptiveAttempts = await database.all(`
      SELECT aa.concept_scores, aa.answers, aa.completed_at,
             at2.lesson_id
      FROM adaptive_attempts aa
      JOIN adaptive_tests at2 ON aa.adaptive_test_id = at2.id
      WHERE aa.user_id = ? AND aa.status = 'completed'
      ORDER BY aa.completed_at DESC LIMIT 5
    `, [studentId]);

    // 5. Forum faoliyati
    const forumStats = await database.get(`
      SELECT
        (SELECT COUNT(*) FROM forum_posts WHERE user_id = ?) AS posts_count,
        (SELECT COUNT(*) FROM forum_comments WHERE user_id = ?) AS comments_count,
        (SELECT COUNT(*) FROM forum_posts WHERE user_id = ? AND is_approved = TRUE) AS approved_posts,
        (SELECT COUNT(*) FROM forum_comments WHERE user_id = ? AND is_approved = TRUE) AS approved_comments
    `, [studentId, studentId, studentId, studentId]);

    // 6. O'sish dinamikasi (oxirgi 30 kundagi o'zgarish)
    const recentProgress = await database.all(`
      SELECT lp.percent, lp.updated_at
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      WHERE lp.student_id = ? AND l.taught_at IS NOT NULL
      ORDER BY lp.updated_at DESC LIMIT 10
    `, [studentId]);

    // ═══ Ma'lumotlarni matn sifatida tayyorlash ═══
    let dataContext = `O'QUVCHI: ${student.full_name}, ${student.class_name || ''}, `;
    dataContext += `Daraja: ${student.level}, O'zlashtirish: ${student.mastery_percent || 0}%\n\n`;

    // Dars progresslari
    if (lessonProgress.length > 0) {
      dataContext += `DARS NATIJALARI (${lessonProgress.length} ta dars):\n`;
      for (const lp of lessonProgress.slice(0, 10)) {
        dataContext += `- "${lp.lesson_title}" (${lp.subject}): ${lp.percent}% — Baho: ${lp.grade}\n`;
      }
      dataContext += '\n';
    }

    // Test natijalari
    if (testResults.length > 0) {
      const avgTest = Math.round(testResults.reduce((s, r) => s + r.percentage, 0) / testResults.length);
      dataContext += `TEST NATIJALARI (oxirgi ${testResults.length} ta, o'rtacha: ${avgTest}%):\n`;
      for (const tr of testResults.slice(0, 8)) {
        dataContext += `- "${tr.test_title}": ${Math.round(tr.percentage)}% (${tr.correct_answers}/${tr.total_questions})\n`;
      }
      dataContext += '\n';
    }

    // Amaliy topshiriqlar
    if (assignmentResults.length > 0) {
      dataContext += `AMALIY TOPSHIRIQLAR (${assignmentResults.length} ta baholangan):\n`;
      for (const ar of assignmentResults.slice(0, 8)) {
        const pct = Math.round((ar.score / ar.max_score) * 100);
        dataContext += `- "${ar.assignment_title}" (${ar.task_type}): ${ar.score}/${ar.max_score} = ${pct}%\n`;
      }
      dataContext += '\n';
    }

    // Adaptiv test zaif tushunchalar
    if (adaptiveAttempts.length > 0) {
      dataContext += 'ADAPTIV TEST — TUSHUNCHALAR BO\'YICHA:\n';
      for (const att of adaptiveAttempts.slice(0, 3)) {
        const scores = att.concept_scores || {};
        for (const [concept, data] of Object.entries(scores)) {
          const pct = Math.round((data.correct / data.total) * 100);
          dataContext += `- ${concept}: ${data.correct}/${data.total} (${pct}%)\n`;
        }
      }
      dataContext += '\n';
    }

    // Forum
    dataContext += `FORUM FAOLIYATI: ${forumStats?.posts_count || 0} ta post, ${forumStats?.comments_count || 0} ta javob, `;
    dataContext += `${forumStats?.approved_posts || 0} ta tasdiqlangan post, ${forumStats?.approved_comments || 0} ta tasdiqlangan javob\n\n`;

    // O'sish trendi
    if (recentProgress.length >= 2) {
      const recent = recentProgress.slice(0, 5).reduce((s, p) => s + p.percent, 0) / Math.min(5, recentProgress.length);
      const older = recentProgress.slice(5).reduce((s, p) => s + p.percent, 0) / Math.max(1, recentProgress.length - 5);
      const trend = recent > older + 5 ? 'o\'sish' : recent < older - 5 ? 'pasayish' : 'barqaror';
      dataContext += `O'SISH TRENDI: ${trend} (so'nggi o'rtacha: ${Math.round(recent)}%, avvalgi: ${Math.round(older || recent)}%)\n`;
    }

    // ═══ AI Prompt ═══
    const prompt = `Sen 9-10 sinf informatika o'quvchisi uchun shaxsiy AI mentorisisan.
Quyida o'quvchining platformadagi barcha faoliyati haqida ma'lumot berilgan.
Bu ma'lumotlarni tahlil qilib, INDIVIDUAL maslahat ber.

${dataContext}

Quyidagi JSON formatda javob ber (boshqa hech narsa yozma):
{
  "strengths": ["Kuchli tomonlar — 2-4 ta aniq mavzu/ko'nikma nomi"],
  "weaknesses": ["Zaif tomonlar — 2-4 ta aniq mavzu/ko'nikma nomi"],
  "next_steps": [
    "Bu hafta qilish kerak bo'lgan 3 ta ANIQ vazifa (qaysi dars, qaysi test, nima qilish)",
    "...",
    "..."
  ],
  "motivation": "O'quvchiga 2-3 gaplik motivatsion xabar — uning haqiqiy natijalariga asoslangan, samimiy va dalda beruvchi",
  "weekly_focus": "Bu hafta e'tibor qaratilishi kerak bo'lgan 1 ta asosiy mavzu",
  "progress_trend": "rising/stable/declining",
  "study_tip": "O'quvchining zaif tomoniga mos 1 ta amaliy o'rganish maslahati"
}`;

    const raw = await chat(prompt, { max_tokens: 2000 });
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonStr = cleaned.match(/\{[\s\S]*\}/)?.[0] || cleaned;

    let advice;
    try {
      advice = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('Mentor AI parse error:', parseErr.message);
      return res.status(500).json({ error: 'AI javobini o\'qib bo\'lmadi. Qayta urinib ko\'ring.' });
    }

    // Keshga saqlash
    await database.run(`
      INSERT INTO ai_mentor_cache (student_id, advice_json, generated_at)
      VALUES (?, ?, NOW())
      ON CONFLICT (student_id) DO UPDATE SET
        advice_json = EXCLUDED.advice_json,
        generated_at = NOW()
    `, [studentId, JSON.stringify(advice)]);

    res.json({
      exists: true,
      advice,
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Mentor generate error:', err);
    res.status(500).json({ error: 'Mentor maslahat yaratishda xatolik: ' + err.message });
  }
});

module.exports = router;
