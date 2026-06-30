const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/materials');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Allowed file types
    const allowedTypes = /pdf|ppt|pptx|doc|docx|xls|xlsx|txt|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Faqat PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX, TXT va rasm fayllari qabul qilinadi!'));
    }
  }
});

// Get all lessons
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    let lessons;

    if (user.role === 'student') {
      // Students see lessons from their grade, district, and school
      const grade = parseInt(user.class_name.split('-')[0]); // Extract grade from class (e.g., "10-A" -> 10)
      lessons = await Lesson.getByGrade(grade, user.district, user.school_number);
    } else if (user.role === 'teacher' || user.role === 'admin') {
      // Teachers and admins see all lessons (can filter)
      const filters = {
        grade: req.query.grade ? parseInt(req.query.grade) : null,
        subject: req.query.subject,
        search: req.query.search,
        created_by: user.role === 'teacher' ? user.id : req.query.created_by
      };

      lessons = await Lesson.getAll(filters);
    }

    res.json(lessons);
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ error: 'Darslarni olishda xatolik yuz berdi' });
  }
});

// Get lesson by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    // O'quvchi bo'lsa my_attempt ma'lumotlari ham qo'shiladi
    const student_id = user.role === 'student' ? user.id : null;
    const lesson = await Lesson.findById(req.params.id, student_id);

    if (!lesson) {
      return res.status(404).json({ error: 'Dars topilmadi' });
    }

    // Check if student has access to this lesson
    if (user.role === 'student') {
      const grade = parseInt(user.class_name.split('-')[0]);
      if (lesson.grade !== grade) {
        return res.status(403).json({ error: 'Bu darsga ruxsatingiz yo\'q' });
      }
      // Students only see published tests
      lesson.tests = (lesson.tests_published || lesson.tests.filter(t => t.is_published));
    }
    // Teachers and admins see all tests (published + drafts)

    res.json(lesson);
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ error: 'Darsni olishda xatolik yuz berdi' });
  }
});

// Create new lesson
router.post('/', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { title, description, grade, subject, content } = req.body;

    // Validation
    if (!title || !grade || !subject) {
      return res.status(400).json({ 
        error: 'Dars nomi, sinf va fan kiritilishi shart' 
      });
    }

    if (![9, 10].includes(parseInt(grade))) {
      return res.status(400).json({ error: 'Sinf 9 yoki 10 bo\'lishi kerak' });
    }

    const lessonId = await Lesson.create({
      title,
      description,
      grade: parseInt(grade),
      subject,
      content: content || '',
      created_by: req.user.id
    });

    const lesson = await Lesson.findById(lessonId);

    res.status(201).json({
      message: 'Dars muvaffaqiyatli yaratildi',
      lesson
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Dars yaratishda xatolik yuz berdi' });
  }
});

// Update lesson
router.put('/:id', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ error: 'Dars topilmadi' });
    }

    // Check if user owns this lesson
    if (req.user.role !== 'admin' && lesson.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Bu darsni tahrirlash huquqingiz yo\'q' });
    }

    const { title, description, subject, content } = req.body;

    await Lesson.update(req.params.id, {
      title,
      description,
      subject,
      content
    });

    const updatedLesson = await Lesson.findById(req.params.id);

    res.json({
      message: 'Dars muvaffaqiyatli yangilandi',
      lesson: updatedLesson
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ error: 'Darsni yangilashda xatolik yuz berdi' });
  }
});

// Delete lesson
router.delete('/:id', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ error: 'Dars topilmadi' });
    }

    // Check if user owns this lesson
    if (req.user.role !== 'admin' && lesson.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Bu darsni o\'chirish huquqingiz yo\'q' });
    }

    // Delete associated material files
    const materials = await Lesson.getMaterials(req.params.id);
    for (const material of materials) {
      const filePath = path.join(__dirname, '../uploads/materials', path.basename(material.file_path));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Lesson.delete(req.params.id);

    res.json({ message: 'Dars muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: 'Darsni o\'chirishda xatolik yuz berdi' });
  }
});

// Upload material to lesson
router.post('/:id/materials', authenticateToken, requireRole(['teacher', 'admin']), upload.single('file'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ error: 'Dars topilmadi' });
    }

    // Check if user owns this lesson
    if (req.user.role !== 'admin' && lesson.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Bu darsga material qo\'shish huquqingiz yo\'q' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Fayl yuborilmadi' });
    }

    const materialId = await Lesson.addMaterial({
      lesson_id: req.params.id,
      file_name: req.file.originalname,
      file_path: `/uploads/materials/${req.file.filename}`,
      file_type: req.file.mimetype,
      file_size: req.file.size
    });

    const material = await Lesson.getMaterialById(materialId);

    res.status(201).json({
      message: 'Material muvaffaqiyatli yuklandi',
      material
    });
  } catch (error) {
    console.error('Upload material error:', error);
    res.status(500).json({ error: error.message || 'Materialni yuklashda xatolik yuz berdi' });
  }
});

// Delete material
router.delete('/:lessonId/materials/:materialId', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);

    if (!lesson) {
      return res.status(404).json({ error: 'Dars topilmadi' });
    }

    // Check if user owns this lesson
    if (req.user.role !== 'admin' && lesson.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Bu materiallarni o\'chirish huquqingiz yo\'q' });
    }

    const material = await Lesson.getMaterialById(req.params.materialId);

    if (!material) {
      return res.status(404).json({ error: 'Material topilmadi' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', material.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Lesson.deleteMaterial(req.params.materialId);

    res.json({ message: 'Material muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Materialni o\'chirishda xatolik yuz berdi' });
  }
});

module.exports = router;
