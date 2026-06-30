/**
 * LessonProgress — dars bo'yicha o'quvchi o'zlashtirish tizimi
 *
 * BALLAR:
 *   Test savoli to'g'ri javobi  → 2 ball
 *   Amaliy topshiriq (1 ta)     → 20 ball (max)
 *   Darsning umumiy bali = (testlar × 2) + (topshiriqlar × 20)
 *
 * BAHOLAR:
 *   0–39%  → 2 (qoniqarsiz)
 *   40–59% → 3 (qoniqarli)
 *   60–85% → 4 (yaxshi)
 *   86–100% → 5 (a'lo)
 *
 * MEDALLAR (Results sahifasida):
 *   5 → 🥇 oltin medal
 *   4 → 🥈 kumush medal
 *   3 → 🥉 bronza medal
 *   2 → 😢 qizil hafa stiker
 */
const database = require('../config/database');

const POINTS_PER_CORRECT_ANSWER = 2;
const POINTS_PER_ASSIGNMENT = 20;

class LessonProgress {
  // ─── Darsning maksimal balini hisoblash ───────────────────
  static async calcTotalPossible(lessonId) {
    // Test savollar soni (nashr qilingan testlar)
    const qRow = await database.get(`
      SELECT COALESCE(SUM(q.cnt), 0) AS total_q
      FROM (
        SELECT (SELECT COUNT(*) FROM questions WHERE test_id = t.id) AS cnt
        FROM tests t
        WHERE t.lesson_id = ? AND t.is_published = TRUE
      ) q
    `, [lessonId]);

    // Topshiriqlar soni
    const aRow = await database.get(
      'SELECT COUNT(*) AS cnt FROM assignments WHERE lesson_id = ?',
      [lessonId]
    );

    const totalQ = parseInt(qRow?.total_q || 0);
    const totalA = parseInt(aRow?.cnt || 0);

    return (totalQ * POINTS_PER_CORRECT_ANSWER) + (totalA * POINTS_PER_ASSIGNMENT);
  }

  // ─── O'quvchining to'plagan balini hisoblash ─────────────
  static async calcEarnedScore(lessonId, studentId) {
    // Testdan to'plangan ball (har to'g'ri javob = 2 ball)
    // Bir test uchun eng yuqori natija olinadi
    const testRow = await database.get(`
      SELECT COALESCE(SUM(best.earned), 0) AS test_score
      FROM (
        SELECT r.test_id,
               MAX(r.correct_answers) * ${POINTS_PER_CORRECT_ANSWER} AS earned
        FROM results r
        JOIN tests t ON r.test_id = t.id
        WHERE t.lesson_id = ? AND r.user_id = ?
        GROUP BY r.test_id
      ) best
    `, [lessonId, studentId]);

    // Amaliy topshiriqlardan to'plangan ball
    // Har topshiriq max 20 ball, o'quvchi necha % olgan bo'lsa shuncha proportsional
    const assignRow = await database.get(`
      SELECT COALESCE(SUM(
        LEAST(
          ROUND(
            (s.score::REAL / GREATEST(a.max_score, 1)) * ${POINTS_PER_ASSIGNMENT}
          ),
          ${POINTS_PER_ASSIGNMENT}
        )
      ), 0) AS assign_score
      FROM assignment_submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE a.lesson_id = ? AND s.student_id = ? AND s.status = 'graded'
    `, [lessonId, studentId]);

    return {
      testScore: parseInt(testRow?.test_score || 0),
      assignScore: parseInt(assignRow?.assign_score || 0),
      total: parseInt(testRow?.test_score || 0) + parseInt(assignRow?.assign_score || 0)
    };
  }

  // ─── Baho hisoblash ───────────────────────────────────────
  static calcGrade(percent) {
    if (percent >= 86) return 5;
    if (percent >= 60) return 4;
    if (percent >= 40) return 3;
    return 2;
  }

  // ─── Medal/stiker ─────────────────────────────────────────
  static getMedal(grade) {
    return { 5: '🥇', 4: '🥈', 3: '🥉', 2: '😢' }[grade] || '😢';
  }

  static getMedalLabel(grade) {
    return {
      5: 'Oltin medal',
      4: 'Kumush medal',
      3: 'Bronza medal',
      2: 'Qizil stiker'
    }[grade] || '';
  }

  // ─── Progressni qayta hisoblash va saqlash ────────────────
  static async recalculate(lessonId, studentId) {
    const totalPossible = await this.calcTotalPossible(lessonId);
    const earned = await this.calcEarnedScore(lessonId, studentId);
    const earnedTotal = earned.total;

    const percent = totalPossible > 0
      ? Math.min(100, Math.round((earnedTotal / totalPossible) * 100 * 10) / 10)
      : 0;

    const grade = totalPossible > 0 ? this.calcGrade(percent) : 0;

    // Upsert
    const existing = await database.get(
      'SELECT id, grade, grade_awarded FROM lesson_progress WHERE lesson_id = ? AND student_id = ?',
      [lessonId, studentId]
    );

    if (existing) {
      await database.run(`
        UPDATE lesson_progress
        SET total_possible = ?, earned_score = ?, percent = ?, grade = ?, updated_at = NOW()
        WHERE lesson_id = ? AND student_id = ?
      `, [totalPossible, earnedTotal, percent, grade, lessonId, studentId]);

      // Agar baho ko'tarilgan bo'lsa va avval award qilinmagan bo'lsa — ball qo'sh
      if (!existing.grade_awarded && grade >= 2 && totalPossible > 0) {
        await this._awardGradePoints(studentId, grade, lessonId);
        await database.run(
          'UPDATE lesson_progress SET grade_awarded = TRUE WHERE lesson_id = ? AND student_id = ?',
          [lessonId, studentId]
        );
      }
    } else {
      await database.run(`
        INSERT INTO lesson_progress (lesson_id, student_id, total_possible, earned_score, percent, grade)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [lessonId, studentId, totalPossible, earnedTotal, percent, grade]);

      // Yangi yozuv bo'lsa va ball bor bo'lsa award qil
      if (grade >= 2 && totalPossible > 0) {
        await this._awardGradePoints(studentId, grade, lessonId);
        await database.run(
          'UPDATE lesson_progress SET grade_awarded = TRUE WHERE lesson_id = ? AND student_id = ?',
          [lessonId, studentId]
        );
      }
    }

    return { totalPossible, earnedScore: earnedTotal, percent, grade, ...earned };
  }

  // ─── Baho ballini users.points ga qo'shish ───────────────
  static async _awardGradePoints(studentId, grade, lessonId) {
    try {
      await database.run(
        'UPDATE users SET points = points + ? WHERE id = ?',
        [grade, studentId]
      );
      console.log(`✅ Lesson ${lessonId}: student ${studentId} → +${grade} points (grade ${grade})`);
    } catch (err) {
      console.error('Award points error:', err.message);
    }
  }

  // ─── O'quvchining dars progressini olish ─────────────────
  static async get(lessonId, studentId) {
    return await database.get(
      'SELECT * FROM lesson_progress WHERE lesson_id = ? AND student_id = ?',
      [lessonId, studentId]
    );
  }

  // ─── O'quvchining barcha darslar progressini olish ───────
  static async getAllForStudent(studentId) {
    return await database.all(`
      SELECT lp.*,
        l.title AS lesson_title,
        l.subject,
        l.grade AS lesson_grade
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      WHERE lp.student_id = ?
      ORDER BY lp.updated_at DESC
    `, [studentId]);
  }
}

module.exports = LessonProgress;
module.exports.POINTS_PER_CORRECT_ANSWER = POINTS_PER_CORRECT_ANSWER;
module.exports.POINTS_PER_ASSIGNMENT = POINTS_PER_ASSIGNMENT;
