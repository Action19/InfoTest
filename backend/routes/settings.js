/**
 * O'qituvchi Sozlamalar — yangi o'quv yili, baholash, AI, Telegram sozlamalari
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const database = require('../config/database');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// ═══════════════════════════════════════════════════════════════
// GET /api/settings — o'qituvchining sozlamalarini olish
// ═══════════════════════════════════════════════════════════════
router.get('/', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const settings = await database.get(
      'SELECT * FROM teacher_settings WHERE teacher_id = ?',
      [req.user.id]
    );

    // Arxivlar ro'yxati
    const archives = await database.all(
      'SELECT * FROM year_archives WHERE teacher_id = ? ORDER BY archived_at DESC',
      [req.user.id]
    );

    // Telegram statistikasi
    const teacher = await User.findById(req.user.id);
    const teachingClasses = (teacher.teaching_classes || '').split(',').map(c => c.trim()).filter(Boolean);

    let telegramStats = { total: 0, connected: 0 };
    if (teachingClasses.length > 0 && teacher.district && teacher.school_number) {
      const students = await database.all(
        `SELECT u.id FROM users u WHERE u.role = 'student' AND u.district = ? AND u.school_number = ? AND u.class_name IN (${teachingClasses.map(() => '?').join(',')})`,
        [teacher.district, teacher.school_number, ...teachingClasses]
      );
      const connectedCount = await database.get(
        `SELECT COUNT(*) as cnt FROM telegram_parents WHERE student_id IN (${students.map(() => '?').join(',') || '0'})`,
        students.map(s => s.id)
      );
      telegramStats = { total: students.length, connected: parseInt(connectedCount?.cnt || 0) };
    }

    // O'quv yili statistikasi
    const taughtLessons = await database.get(
      'SELECT COUNT(*) as cnt FROM lessons WHERE created_by = ? AND taught_at IS NOT NULL',
      [req.user.id]
    );

    res.json({
      settings: settings || {
        grade_excellent: 81,
        grade_good: 60,
        grade_satisfactory: 40,
        test_max_score: 20,
        adaptive_questions: 15,
        ai_auto_grade: true,
        ai_level: '9-10',
        telegram_day: 'monday'
      },
      archives,
      telegramStats,
      currentYear: {
        taught_lessons: parseInt(taughtLessons?.cnt || 0),
        teaching_classes: teachingClasses
      }
    });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Sozlamalarni olishda xatolik' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PUT /api/settings — sozlamalarni saqlash
// ═══════════════════════════════════════════════════════════════
router.put('/', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const {
      grade_excellent = 81,
      grade_good = 60,
      grade_satisfactory = 40,
      test_max_score = 20,
      adaptive_questions = 15,
      ai_auto_grade = true,
      ai_level = '9-10',
      telegram_day = 'monday',
      teaching_classes = ''
    } = req.body;

    await database.run(`
      INSERT INTO teacher_settings (teacher_id, grade_excellent, grade_good, grade_satisfactory, test_max_score, adaptive_questions, ai_auto_grade, ai_level, telegram_day)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (teacher_id) DO UPDATE SET
        grade_excellent = EXCLUDED.grade_excellent,
        grade_good = EXCLUDED.grade_good,
        grade_satisfactory = EXCLUDED.grade_satisfactory,
        test_max_score = EXCLUDED.test_max_score,
        adaptive_questions = EXCLUDED.adaptive_questions,
        ai_auto_grade = EXCLUDED.ai_auto_grade,
        ai_level = EXCLUDED.ai_level,
        telegram_day = EXCLUDED.telegram_day,
        updated_at = NOW()
    `, [req.user.id, grade_excellent, grade_good, grade_satisfactory, test_max_score, adaptive_questions, ai_auto_grade, ai_level, telegram_day]);

    // O'tiladigan sinflarni yangilash (agar o'zgartirilsa)
    if (teaching_classes !== undefined) {
      await database.run(
        'UPDATE users SET teaching_classes = ? WHERE id = ?',
        [teaching_classes, req.user.id]
      );
    }

    res.json({ message: 'Sozlamalar saqlandi' });
  } catch (err) {
    console.error('Save settings error:', err);
    res.status(500).json({ error: 'Saqlashda xatolik' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/settings/new-year — Yangi o'quv yiliga o'tish
// ═══════════════════════════════════════════════════════════════
router.post('/new-year', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { password, year_name } = req.body;

    if (!password) return res.status(400).json({ error: 'Parolingizni kiriting' });

    // Parolni tekshirish
    const userRow = await database.get('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (!userRow) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    const isValid = await bcrypt.compare(password, userRow.password);
    if (!isValid) return res.status(401).json({ error: 'Parol noto\'g\'ri' });

    // O'qituvchining sinflari
    const teacher = await User.findById(req.user.id);
    const teachingClasses = (teacher.teaching_classes || '').split(',').map(c => c.trim()).filter(Boolean);

    if (teachingClasses.length === 0) {
      return res.status(400).json({ error: 'Sizga tegishli sinflar topilmadi' });
    }

    // Shu sinflardagi o'quvchilar
    const students = await database.all(
      `SELECT id FROM users WHERE role = 'student' AND district = ? AND school_number = ? AND class_name IN (${teachingClasses.map(() => '?').join(',')})`,
      [teacher.district, teacher.school_number, ...teachingClasses]
    );
    const studentIds = students.map(s => s.id);

    if (studentIds.length === 0) {
      return res.status(400).json({ error: 'Sinflaringizda o\'quvchilar topilmadi' });
    }

    // ═══ ARXIVLASH ═══
    const archiveYear = year_name || `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;

    // 1. lesson_progress arxivlash
    const progressData = await database.all(
      `SELECT lp.* FROM lesson_progress lp WHERE lp.student_id IN (${studentIds.map(() => '?').join(',')})`,
      studentIds
    );

    // 2. results arxivlash
    const resultsData = await database.all(
      `SELECT r.* FROM results r WHERE r.user_id IN (${studentIds.map(() => '?').join(',')})`,
      studentIds
    );

    // 3. assignment_submissions arxivlash
    const submissionsData = await database.all(
      `SELECT s.* FROM assignment_submissions s WHERE s.student_id IN (${studentIds.map(() => '?').join(',')})`,
      studentIds
    );

    // 4. adaptive_attempts arxivlash
    const adaptiveData = await database.all(
      `SELECT aa.* FROM adaptive_attempts aa WHERE aa.user_id IN (${studentIds.map(() => '?').join(',')})`,
      studentIds
    );

    // Arxiv jadvaliga saqlash
    await database.run(`
      INSERT INTO year_archives (teacher_id, year_name, students_count, classes, progress_data, results_data, submissions_data, adaptive_data, archived_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      req.user.id,
      archiveYear,
      studentIds.length,
      teachingClasses.join(','),
      JSON.stringify(progressData),
      JSON.stringify(resultsData),
      JSON.stringify(submissionsData),
      JSON.stringify(adaptiveData)
    ]);

    // ═══ TOZALASH (faqat shu o'qituvchining o'quvchilari) ═══

    // lesson_progress tozalash
    if (studentIds.length > 0) {
      await database.run(
        `DELETE FROM lesson_progress WHERE student_id IN (${studentIds.map(() => '?').join(',')})`,
        studentIds
      );
    }

    // adaptive_attempts tozalash
    if (studentIds.length > 0) {
      await database.run(
        `DELETE FROM adaptive_attempts WHERE user_id IN (${studentIds.map(() => '?').join(',')})`,
        studentIds
      );
    }

    // ai_mentor_cache tozalash
    if (studentIds.length > 0) {
      await database.run(
        `DELETE FROM ai_mentor_cache WHERE student_id IN (${studentIds.map(() => '?').join(',')})`,
        studentIds
      );
    }

    // O'quvchilar mastery/level/bonus tozalash
    if (studentIds.length > 0) {
      await database.run(
        `UPDATE users SET mastery_percent = 0, level = 1, bonus_points = 0 WHERE id IN (${studentIds.map(() => '?').join(',')})`,
        studentIds
      );
    }

    // O'qituvchining darslari taught_at tozalash
    await database.run(
      'UPDATE lessons SET taught_at = NULL WHERE created_by = ?',
      [req.user.id]
    );

    res.json({
      message: `${archiveYear} o'quv yili arxivlandi. Yangi yil boshlandi!`,
      archived: {
        year: archiveYear,
        students: studentIds.length,
        classes: teachingClasses,
        progress_records: progressData.length,
        results_records: resultsData.length,
        submissions_records: submissionsData.length
      }
    });
  } catch (err) {
    console.error('New year error:', err);
    res.status(500).json({ error: 'Yangi o\'quv yiliga o\'tishda xatolik: ' + err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/settings/archives/:id — arxiv tafsilotlari
// ═══════════════════════════════════════════════════════════════
router.get('/archives/:id', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const archive = await database.get(
      'SELECT * FROM year_archives WHERE id = ? AND teacher_id = ?',
      [req.params.id, req.user.id]
    );
    if (!archive) return res.status(404).json({ error: 'Arxiv topilmadi' });

    res.json({
      ...archive,
      progress_data: JSON.parse(archive.progress_data || '[]'),
      results_data: JSON.parse(archive.results_data || '[]'),
      submissions_data: JSON.parse(archive.submissions_data || '[]'),
      adaptive_data: JSON.parse(archive.adaptive_data || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: 'Arxivni olishda xatolik' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PATCH /api/settings/move-students — O'quvchilarni yangi sinfga ko'chirish
// ═══════════════════════════════════════════════════════════════
router.patch('/move-students', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { from_class, to_class } = req.body;
    if (!from_class || !to_class) return res.status(400).json({ error: 'from_class va to_class kerak' });

    const teacher = await User.findById(req.user.id);
    const result = await database.run(
      `UPDATE users SET class_name = ? WHERE role = 'student' AND class_name = ? AND district = ? AND school_number = ?`,
      [to_class, from_class, teacher.district, teacher.school_number]
    );

    res.json({ message: `${from_class} → ${to_class} ko'chirildi`, moved: result.changes || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Ko\'chirishda xatolik' });
  }
});

module.exports = router;
