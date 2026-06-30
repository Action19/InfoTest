const express = require('express');
const database = require('../config/database');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/statistics/user/:userId ────────────────────────
// O'quvchi/foydalanuvchi shaxsiy statistikasi
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== parseInt(userId) && req.user.role === 'student') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [stats, user, achievements, recentResults, subjectStats,
           assignStats, lessonStats] = await Promise.all([

      // statistics jadvalidagi asosiy ma'lumot
      database.get('SELECT * FROM statistics WHERE user_id = ?', [userId]),

      // foydalanuvchi ma'lumoti
      User.findById(userId),

      // yutuqlar
      database.all(`
        SELECT a.*, ua.earned_at
        FROM user_achievements ua
        LEFT JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = ?
        ORDER BY ua.earned_at DESC
      `, [userId]),

      // so'nggi test natijalari
      database.all(`
        SELECT r.*, t.title as test_title, t.subject,
               t.lesson_id, l.title as lesson_title
        FROM results r
        LEFT JOIN tests t ON r.test_id = t.id
        LEFT JOIN lessons l ON t.lesson_id = l.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
        LIMIT 5
      `, [userId]),

      // fan bo'yicha statistika
      database.all(`
        SELECT t.subject,
               COUNT(r.id) as tests_taken,
               AVG(r.percentage) as average_score,
               SUM(CASE WHEN r.passed = TRUE THEN 1 ELSE 0 END) as tests_passed
        FROM results r
        LEFT JOIN tests t ON r.test_id = t.id
        WHERE r.user_id = ?
        GROUP BY t.subject
      `, [userId]),

      // amaliy topshiriqlar statistikasi
      database.get(`
        SELECT
          COUNT(DISTINCT a.id)                                        AS total_assignments,
          COUNT(DISTINCT s.id)                                        AS submitted_assignments,
          COUNT(DISTINCT CASE WHEN s.status='graded' THEN s.id END)  AS graded_assignments,
          COALESCE(AVG(CASE WHEN s.status='graded' THEN
            (s.score::REAL / GREATEST(a.max_score,1)) * 100 END), 0) AS avg_assignment_pct
        FROM lessons l
        JOIN assignments a ON a.lesson_id = l.id
        LEFT JOIN assignment_submissions s
               ON s.assignment_id = a.id AND s.student_id = ?
        WHERE l.grade IN (
          SELECT DISTINCT CAST(SPLIT_PART(class_name, '-', 1) AS INTEGER)
          FROM users WHERE id = ?
        )
      `, [userId, userId]),

      // dars o'zlashtirish statistikasi
      database.get(`
        SELECT
          COUNT(*)                                  AS total_lessons,
          COUNT(CASE WHEN grade > 0 THEN 1 END)    AS graded_lessons,
          COALESCE(AVG(CASE WHEN grade > 0
            THEN percent END), 0)                  AS avg_lesson_pct,
          COUNT(CASE WHEN grade = 5 THEN 1 END)    AS grade5_count,
          COUNT(CASE WHEN grade = 4 THEN 1 END)    AS grade4_count,
          COUNT(CASE WHEN grade = 3 THEN 1 END)    AS grade3_count,
          COUNT(CASE WHEN grade = 2 THEN 1 END)    AS grade2_count
        FROM lesson_progress
        WHERE student_id = ?
      `, [userId])
    ]);

    res.json({
      // Test statistikasi
      totalAttempts:      stats?.total_tests_taken  || 0,
      totalPassed:        stats?.total_tests_passed || 0,
      averageScore:       stats?.average_score      || 0,

      // Amaliy topshiriq statistikasi
      totalAssignments:    parseInt(assignStats?.total_assignments   || 0),
      submittedAssignments:parseInt(assignStats?.submitted_assignments || 0),
      gradedAssignments:   parseInt(assignStats?.graded_assignments  || 0),
      avgAssignmentPct:    parseFloat((assignStats?.avg_assignment_pct || 0).toFixed(1)),

      // Dars statistikasi
      totalLessons:        parseInt(lessonStats?.total_lessons   || 0),
      gradedLessons:       parseInt(lessonStats?.graded_lessons  || 0),
      avgLessonPct:        parseFloat((lessonStats?.avg_lesson_pct || 0).toFixed(1)),
      medalCounts: {
        gold:   parseInt(lessonStats?.grade5_count || 0),
        silver: parseInt(lessonStats?.grade4_count || 0),
        bronze: parseInt(lessonStats?.grade3_count || 0),
        red:    parseInt(lessonStats?.grade2_count || 0),
      },

      // Foydalanuvchi ma'lumoti
      user: user ? {
        id: user.id, username: user.username,
        full_name: user.full_name, points: user.points,
        level: user.level, avatar: user.avatar
      } : null,

      statistics:    stats,
      achievements,
      recent_results: recentResults,
      subject_stats:  subjectStats
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// ─── GET /api/statistics/leaderboard ─────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await User.getLeaderboard(limit);
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// ─── GET /api/statistics/overall ─────────────────────────────
// O'qituvchi / Admin umumiy statistikasi
router.get('/overall', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ error: "Faqat o'qituvchi va administrator ko'ra oladi" });
    }

    let data = {};

    if (req.user.role === 'admin') {
      // ── Admin: hamma narsani ko'radi ──
      const [users, tests, lessons, assignments, results,
             avgScore, submittedAssign, recentActivity] = await Promise.all([

        database.get("SELECT COUNT(*) AS count FROM users WHERE role='student'"),
        database.get('SELECT COUNT(*) AS count FROM tests'),
        database.get('SELECT COUNT(*) AS count FROM lessons'),
        database.get('SELECT COUNT(*) AS count FROM assignments'),
        database.get('SELECT COUNT(*) AS count FROM results'),
        database.get('SELECT AVG(percentage) AS avg FROM results'),
        database.get("SELECT COUNT(*) AS count FROM assignment_submissions WHERE status='graded'"),

        database.all(`
          SELECT r.created_at, u.full_name, t.title AS test_title, r.percentage
          FROM results r
          LEFT JOIN users u ON r.user_id = u.id
          LEFT JOIN tests t ON r.test_id = t.id
          ORDER BY r.created_at DESC LIMIT 10
        `)
      ]);

      data = {
        totalStudents:      parseInt(users?.count       || 0),
        totalTests:         parseInt(tests?.count       || 0),
        totalLessons:       parseInt(lessons?.count     || 0),
        totalAssignments:   parseInt(assignments?.count || 0),
        totalAttempts:      parseInt(results?.count     || 0),
        gradedAssignments:  parseInt(submittedAssign?.count || 0),
        averageScore:       parseFloat((avgScore?.avg   || 0).toFixed(2)),
        recent_activity:    recentActivity || []
      };

    } else {
      // ── Teacher: faqat o'z o'quvchilari va darslari ──
      const teacher = await User.findById(req.user.id);
      const classes = teacher.teaching_classes
        ? teacher.teaching_classes.split(',').map(c => c.trim()).filter(Boolean)
        : [];
      const placeholders = classes.map(() => '?').join(',') || 'NULL';

      const [students, tests, lessons, assignments, results,
             avgScore, submittedAssigns, gradedAssigns,
             lessonProgress, recentActivity] = await Promise.all([

        // O'quvchilar (faqat o'qituvchi sinfidagi)
        classes.length > 0
          ? database.get(
              `SELECT COUNT(*) AS count FROM users
               WHERE role='student' AND district=? AND school_number=?
               AND class_name IN (${placeholders})`,
              [teacher.district, teacher.school_number, ...classes]
            )
          : Promise.resolve({ count: 0 }),

        // O'qituvchi testlari
        database.get('SELECT COUNT(*) AS count FROM tests WHERE created_by=?', [req.user.id]),

        // O'qituvchi darslari
        database.get('SELECT COUNT(*) AS count FROM lessons WHERE created_by=?', [req.user.id]),

        // O'qituvchi topshiriqlari (o'z darslari orqali)
        database.get(
          'SELECT COUNT(*) AS count FROM assignments a JOIN lessons l ON a.lesson_id=l.id WHERE l.created_by=?',
          [req.user.id]
        ),

        // O'qituvchi testlariga urinishlar
        database.get(
          'SELECT COUNT(*) AS count FROM results WHERE test_id IN (SELECT id FROM tests WHERE created_by=?)',
          [req.user.id]
        ),

        // O'rtacha ball (o'qituvchi testlari)
        database.get(
          'SELECT AVG(percentage) AS avg FROM results WHERE test_id IN (SELECT id FROM tests WHERE created_by=?)',
          [req.user.id]
        ),

        // Yuborilgan topshiriqlar (o'qituvchi darslari orqali)
        database.get(`
          SELECT COUNT(*) AS count
          FROM assignment_submissions s
          JOIN assignments a ON s.assignment_id=a.id
          JOIN lessons l ON a.lesson_id=l.id
          WHERE l.created_by=?
        `, [req.user.id]),

        // Baholangan topshiriqlar
        database.get(`
          SELECT COUNT(*) AS count
          FROM assignment_submissions s
          JOIN assignments a ON s.assignment_id=a.id
          JOIN lessons l ON a.lesson_id=l.id
          WHERE l.created_by=? AND s.status='graded'
        `, [req.user.id]),

        // O'quvchilar dars o'zlashtirish o'rtachasi
        database.get(`
          SELECT AVG(percent) AS avg_pct,
                 COUNT(*) AS total_progress,
                 COUNT(CASE WHEN grade=5 THEN 1 END) AS g5,
                 COUNT(CASE WHEN grade=4 THEN 1 END) AS g4,
                 COUNT(CASE WHEN grade=3 THEN 1 END) AS g3,
                 COUNT(CASE WHEN grade=2 THEN 1 END) AS g2
          FROM lesson_progress lp
          JOIN lessons l ON lp.lesson_id=l.id
          WHERE l.created_by=?
        `, [req.user.id]),

        // So'nggi faoliyat
        database.all(`
          SELECT r.created_at, u.full_name, t.title AS test_title, r.percentage
          FROM results r
          LEFT JOIN users u ON r.user_id=u.id
          LEFT JOIN tests t ON r.test_id=t.id
          WHERE t.created_by=?
          ORDER BY r.created_at DESC LIMIT 10
        `, [req.user.id])
      ]);

      data = {
        // Asosiy ko'rsatkichlar
        totalStudents:     parseInt(students?.count        || 0),
        totalTests:        parseInt(tests?.count           || 0),
        totalLessons:      parseInt(lessons?.count         || 0),
        totalAssignments:  parseInt(assignments?.count     || 0),
        totalAttempts:     parseInt(results?.count         || 0),
        submittedAssigns:  parseInt(submittedAssigns?.count|| 0),
        gradedAssignments: parseInt(gradedAssigns?.count   || 0),
        averageScore:      parseFloat((avgScore?.avg       || 0).toFixed(2)),

        // Dars o'zlashtirish
        avgLessonPct:  parseFloat((lessonProgress?.avg_pct || 0).toFixed(1)),
        totalProgress: parseInt(lessonProgress?.total_progress || 0),
        gradeCounts: {
          5: parseInt(lessonProgress?.g5 || 0),
          4: parseInt(lessonProgress?.g4 || 0),
          3: parseInt(lessonProgress?.g3 || 0),
          2: parseInt(lessonProgress?.g2 || 0),
        },

        // Eski nomlar (moslik uchun)
        totalUsers: parseInt(students?.count || 0),
        recent_activity: recentActivity || []
      };
    }

    res.json(data);
  } catch (error) {
    console.error('Get overall statistics error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// ─── GET /api/statistics/progress/:userId ────────────────────
router.get('/progress/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== parseInt(userId) && req.user.role === 'student') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const progress = await database.all(`
      SELECT DATE(created_at::timestamp) AS date,
             COUNT(*) AS tests_taken,
             AVG(percentage) AS average_score,
             SUM(CASE WHEN passed = TRUE THEN 1 ELSE 0 END) AS tests_passed
      FROM results
      WHERE user_id = ?
      GROUP BY DATE(created_at::timestamp)
      ORDER BY date ASC
    `, [userId]);

    res.json({ progress });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

module.exports = router;
