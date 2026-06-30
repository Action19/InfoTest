const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const LessonProgress = require('../models/LessonProgress');
const database = require('../config/database');

const router = express.Router();

// GET /api/lesson-progress/:lessonId — o'quvchining dars progressini olish
router.get('/:lessonId', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.role === 'student'
      ? req.user.id
      : parseInt(req.query.student_id || 0);

    if (!studentId) return res.status(400).json({ error: 'student_id kerak' });

    const progress = await LessonProgress.recalculate(req.params.lessonId, studentId);

    res.json({
      lesson_id: parseInt(req.params.lessonId),
      student_id: studentId,
      total_possible: progress.totalPossible,
      earned_score: progress.earnedScore,
      test_score: progress.testScore,
      assign_score: progress.assignScore,
      percent: progress.percent,
      grade: progress.grade,
      medal: LessonProgress.getMedal(progress.grade),
      medal_label: LessonProgress.getMedalLabel(progress.grade)
    });
  } catch (err) {
    console.error('Lesson progress error:', err);
    res.status(500).json({ error: 'Progressni olishda xatolik: ' + err.message });
  }
});

// GET /api/lesson-progress/student/all — barcha darslar + batafsil test/topshiriq natijalari
router.get('/student/all', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.role === 'student'
      ? req.user.id
      : parseInt(req.query.student_id || req.user.id);

    const progresses = await LessonProgress.getAllForStudent(studentId);

    // Har bir dars uchun test natijalari va topshiriq natijalari
    for (const p of progresses) {
      // Dars testlari va o'quvchi natijalari
      p.test_results = await database.all(`
        SELECT
          t.id AS test_id, t.title AS test_title,
          t.questions_count,
          r.id AS result_id, r.correct_answers, r.total_questions,
          r.percentage, r.passed, r.created_at AS submitted_at
        FROM tests t
        LEFT JOIN results r ON r.test_id = t.id AND r.user_id = ?
        WHERE t.lesson_id = ? AND t.is_published = TRUE
        ORDER BY t.created_at ASC
      `, [studentId, p.lesson_id]);

      // Dars topshiriqlari va o'quvchi natijalari
      p.assignment_results = await database.all(`
        SELECT
          a.id AS assignment_id, a.title AS assignment_title,
          a.task_type, a.max_score,
          s.id AS submission_id, s.score, s.status,
          s.feedback, s.graded_by, s.submitted_at
        FROM assignments a
        LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = ?
        WHERE a.lesson_id = ?
        ORDER BY a.created_at ASC
      `, [studentId, p.lesson_id]);
    }

    // Yillik statistika
    const totalGradePoints = progresses.reduce((s, p) => s + (p.grade || 0), 0);
    const medals = {
      gold:   progresses.filter(p => p.grade === 5).length,
      silver: progresses.filter(p => p.grade === 4).length,
      bronze: progresses.filter(p => p.grade === 3).length,
      red:    progresses.filter(p => p.grade === 2).length,
    };

    res.json({
      progresses: progresses.map(p => ({
        ...p,
        medal: LessonProgress.getMedal(p.grade),
        medal_label: LessonProgress.getMedalLabel(p.grade)
      })),
      summary: {
        total_lessons: progresses.length,
        total_grade_points: totalGradePoints,
        medals
      }
    });
  } catch (err) {
    console.error('Student all progress error:', err);
    res.status(500).json({ error: 'Progresslarni olishda xatolik' });
  }
});

// GET /api/lesson-progress/journal — o'qituvchi jurnali (barcha o'quvchilar × darslar)
router.get('/journal/teacher', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ error: 'Ruxsat yo\'q' });

    // O'qituvchining darslari
    const lessons = await database.all(
      `SELECT id, title, grade, subject, created_at
       FROM lessons WHERE created_by = ? ORDER BY created_at ASC`,
      [req.user.id]
    );

    // Har dars uchun o'quvchilar progressi
    const journal = [];
    for (const lesson of lessons) {
      const students = await database.all(`
        SELECT
          lp.student_id, lp.earned_score, lp.total_possible,
          lp.percent, lp.grade, lp.updated_at,
          u.full_name, u.class_name, u.username
        FROM lesson_progress lp
        JOIN users u ON lp.student_id = u.id
        WHERE lp.lesson_id = ?
        ORDER BY u.class_name, u.full_name
      `, [lesson.id]);

      journal.push({
        ...lesson,
        students: students.map(s => ({
          ...s,
          medal: LessonProgress.getMedal(s.grade),
          medal_label: LessonProgress.getMedalLabel(s.grade)
        }))
      });
    }

    res.json({ journal });
  } catch (err) {
    console.error('Journal error:', err);
    res.status(500).json({ error: 'Jurnalni olishda xatolik' });
  }
});

module.exports = router;
