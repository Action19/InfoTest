const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const LessonProgress = require('../models/LessonProgress');

const router = express.Router();

// GET /api/lesson-progress/:lessonId — o'quvchining dars progressini olish
router.get('/:lessonId', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.role === 'student'
      ? req.user.id
      : parseInt(req.query.student_id || 0);

    if (!studentId) return res.status(400).json({ error: 'student_id kerak' });

    // Avval progress qayta hisoblanadi (real-time)
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

// GET /api/lesson-progress/student/all — o'quvchining barcha darslar progressi
router.get('/student/all', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.role === 'student'
      ? req.user.id
      : parseInt(req.query.student_id || req.user.id);

    const progresses = await LessonProgress.getAllForStudent(studentId);

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

module.exports = router;
