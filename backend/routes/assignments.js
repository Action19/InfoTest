const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Assignment = require('../models/Assignment');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { readFileForAI } = require('../utils/fileReader');

const router = express.Router();

// ─── File upload config ───────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'submissions');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_u${req.user.id}_${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /docx?|xlsx?|accdb|mdb|py|sb3|html?|css|js|txt|zip|rar|pdf|png|jpe?g/i;
    const ext = path.extname(file.originalname).slice(1);
    allowed.test(ext) ? cb(null, true) : cb(new Error('Fayl turi qabul qilinmaydi'));
  }
});

// ─── Task type labels & AI prompts ────────────────────────────
const TASK_TYPES = {
  word:       { label: 'Word',             ext: '.docx/.doc',    icon: '📝' },
  excel:      { label: 'Excel',            ext: '.xlsx/.xls',    icon: '📊' },
  access:     { label: 'Access',           ext: '.accdb/.mdb',   icon: '🗄️' },
  python:     { label: 'Python',           ext: '.py',           icon: '🐍' },
  scratch:    { label: 'Scratch',          ext: '.sb3',          icon: '🐱' },
  html:       { label: 'HTML',             ext: '.html/.htm',    icon: '🌐' },
  javascript: { label: 'JavaScript',       ext: '.js',           icon: '💛' },
  css:        { label: 'CSS',              ext: '.css',          icon: '🎨' },
  other:      { label: 'Boshqa',           ext: '*',             icon: '📁' }
};

function buildAIInstructionPrompt(task_type, topic, grade, level) {
  const prompts = {
    word:       `${grade}-sinf o'quvchisi uchun Microsoft Word dasturida "${topic}" mavzusida amaliy topshiriq yarat. Topshiriqda: hujjat formatlash, sarlavhalar, jadval, rasmlar qo'shish kabi vazifalar bo'lsin.`,
    excel:      `${grade}-sinf o'quvchisi uchun Microsoft Excel dasturida "${topic}" mavzusida amaliy topshiriq yarat. Formulalar, jadvallar, diagrammalar, filtrlash kabi vazifalar bo'lsin.`,
    access:     `${grade}-sinf o'quvchisi uchun Microsoft Access dasturida "${topic}" mavzusida amaliy topshiriq yarat. Ma'lumotlar bazasi yaratish, jadval, so'rov, forma kabi vazifalar bo'lsin.`,
    python:     `${grade}-sinf o'quvchisi uchun Python dasturlash tilida "${topic}" mavzusida amaliy topshiriq yarat. Dastur kodi yozish kerak bo'lsin. Qiyinlik: ${level}.`,
    scratch:    `${grade}-sinf o'quvchisi uchun Scratch dasturlash muhitida "${topic}" mavzusida amaliy topshiriq yarat. Animatsiya yoki oddiy o'yin yaratish kerak bo'lsin.`,
    html:       `${grade}-sinf o'quvchisi uchun HTML da "${topic}" mavzusida veb-sahifa yaratish topshirig'i yarat. Teglar, struktura, multimedia kabi elementlar bo'lsin.`,
    javascript: `${grade}-sinf o'quvchisi uchun JavaScript da "${topic}" mavzusida dastur yozish topshirig'i yarat. Funksiyalar, hodisalar, DOM bilan ishlash bo'lsin.`,
    css:        `${grade}-sinf o'quvchisi uchun CSS da "${topic}" mavzusida stil yaratish topshirig'i yarat. Selektorlar, ranglar, animatsiyalar, responsive dizayn bo'lsin.`,
    other:      `${grade}-sinf o'quvchisi uchun "${topic}" mavzusida amaliy topshiriq yarat.`
  };
  return (prompts[task_type] || prompts.other) +
    `\n\nTopshiriqni quyidagi JSON formatda qaytar (boshqa hech narsa yozma):
{
  "title": "Topshiriq sarlavhasi",
  "description": "Topshiriq haqida qisqacha (1-2 jumla)",
  "instructions": "Bajarish bo'yicha to'liq ko'rsatma (nima qilish kerak, qanday, qanday talablar bor, qanday topshirish kerak — batafsil yoz)"
}`;
}

function buildAIGradePrompt(task_type, instructions, fileContent) {
  // Har bir til/dastur turi uchun alohida baholash mezonlari
  const criteria = {
    python: `BAHOLASH MEZONLARI (Python):
- Kod ishlaydimi va sintaksis to'g'rimi
- Topshiriqda so'ralgan funksiyalar, sikllar, shartlar, input/output to'g'ri ishlatilganmi
- Dastur topshiriq talablariga to'liq javob beradi yoki yo'q
- Kod o'qilishi va toza yozilishi
❌ QOIDALAR: Python dasturida diagramma yoki Excel formulalari so'RALMAYDI! Faqat Python kodi tekshirilsin.`,

    html: `BAHOLASH MEZONLARI (HTML):
- HTML strukturasi to'g'rimi (DOCTYPE, html, head, body)
- Topshiriqda so'ralgan teglar mavjudmi
- Sahifa tarkibi va semantika to'g'rimi
❌ QOIDALAR: HTML faylda Excel formulalari yoki Python kodi so'RALMAYDI!`,

    javascript: `BAHOLASH MEZONLARI (JavaScript):
- Kod sintaksisi to'g'rimi
- Topshiriqda so'ralgan funksiyalar, voqealar, DOM operatsiyalari bajarilganmi
- Dastur ishlayaptimi (logika to'g'rimi)
❌ QOIDALAR: JS faylda Excel formulalari yoki diagrammalar so'RALMAYDI!`,

    css: `BAHOLASH MEZONLARI (CSS):
- Selektorlar to'g'ri ishlatilganmi
- Topshiriqda so'ralgan xususiyatlar (ranglar, o'lchamlar, animatsiyalar) qo'llanilganmi
- Responsive dizayn yoki boshqa talablar bajarilganmi
❌ QOIDALAR: CSS faylda Excel formulalari yoki diagrammalar so'RALMAYDI!`,

    excel: `BAHOLASH MEZONLARI (Excel):
- Jadval tuzilmasi to'g'rimi
- Formulalar ishlatilganmi (faqat qiymat yozilgan bo'lsa — bu xato)
- Talabda diagramma so'ralgan bo'lsa — mavjudmi
- Filtrlash, formatlash talablari bajarilganmi
MUHIM: "❌ Diagramma topilmadi" yoki "Formulalar soni: 0" ko'rsatilsa — jiddiy kamchilik!`,

    word: `BAHOLASH MEZONLARI (Word):
- Hujjat tuzilmasi va formatlash
- Sarlavhalar, jadvallar, rasmlar talabga muvofiqmi
- Mazmun to'liqmi
❌ QOIDALAR: Word hujjatda Excel formulalari so'RALMAYDI!`,

    access: `BAHOLASH MEZONLARI (Access):
- Jadvallar yaratilganmi
- So'rovlar, formalar, hisobotlar talabga muvofiqmi`,

    scratch: `BAHOLASH MEZONLARI (Scratch):
- Loyiha ishlayaptimi
- Topshiriqda so'ralgan animatsiya yoki o'yin elementlari bajarilganmi`,

    other: `BAHOLASH MEZONLARI:
- Topshiriq talablariga umumiy muvofiqlik`
  };

  const taskCriteria = criteria[task_type] || criteria.other;

  return `Sen informatika o'qituvchisisisan. O'quvchi quyidagi amaliy topshiriqni bajardi.

TOPSHIRIQ TURI: ${TASK_TYPES[task_type]?.label || task_type}

TOPSHIRIQ TALABLARI (o'qituvchi bergan):
${instructions}

O'QUVCHI TOPSHIRGAN FAYL TARKIBI:
${fileContent}

${taskCriteria}

UMUMIY QOIDALAR:
- FAQAT topshiriq turiga mos mezonlar bilan baholagin
- Topshiriq talablarida YO'Q narsani so'ramagani uchun ball kesmaysan
- Fayl tarkibida KO'RSATILGAN ma'lumotlar asosida baho, taxmin qilma
- Topshiriq talabidagi HAR BIR band bajarilganmi tekshir

Quyidagi JSON formatda javob ber (boshqa hech narsa yozma):
{
  "score_percent": 85,
  "feedback": "O'quvchining ishi haqida batafsil fikr — nima bajarilgan, nima bajarilmagan",
  "strengths": "Bajarilgan ijobiy tomonlar",
  "improvements": "Yaxshilash kerak bo'lgan tomonlar (topshiriq talabiga asosan)"
}

score_percent 0 dan 100 gacha bo'lsin. Faqat topshiriq talablaridagi KAMCHILIKLARNI ko'rsat.`;
}

// ─── ROUTES ──────────────────────────────────────────────────

// GET /api/assignments/lesson/:lessonId
router.get('/lesson/:lessonId', authenticateToken, async (req, res) => {
  try {
    const student_id = req.user.role === 'student' ? req.user.id : null;
    const assignments = await Assignment.getByLesson(req.params.lessonId, student_id);
    res.json(assignments);
  } catch (err) {
    console.error('Get assignments error:', err);
    res.status(500).json({ error: 'Topshiriqlarni olishda xatolik' });
  }
});

// GET /api/assignments/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ error: 'Topshiriq topilmadi' });
    res.json(a);
  } catch (err) {
    res.status(500).json({ error: 'Topshiriqni olishda xatolik' });
  }
});

// POST /api/assignments — create (teacher/admin)
router.post('/', authenticateToken, requireRole(['teacher','admin']), async (req, res) => {
  try {
    const { lesson_id, title, description, task_type, instructions, max_score, deadline } = req.body;
    if (!lesson_id || !title || !task_type || !instructions) {
      return res.status(400).json({ error: 'lesson_id, title, task_type, instructions majburiy' });
    }
    const id = await Assignment.create({
      lesson_id, created_by: req.user.id,
      title, description: description || '',
      task_type, instructions,
      max_score: max_score || 100,
      deadline: deadline || null,
      ai_generated: false
    });
    const assignment = await Assignment.findById(id);
    res.status(201).json({ message: 'Topshiriq yaratildi', assignment });
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ error: 'Topshiriq yaratishda xatolik' });
  }
});

// POST /api/assignments/ai-generate — AI bilan yaratish
router.post('/ai-generate', authenticateToken, requireRole(['teacher','admin']), async (req, res) => {
  try {
    const { lesson_id, task_type, topic, grade = 10, level = 'medium', save = true } = req.body;
    if (!lesson_id || !task_type || !topic) {
      return res.status(400).json({ error: 'lesson_id, task_type, topic majburiy' });
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = buildAIInstructionPrompt(task_type, topic, grade, level);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    let generated;
    try {
      const raw = completion.choices[0].message.content.trim();
      const jsonStr = raw.match(/\{[\s\S]*\}/)?.[0] || raw;
      generated = JSON.parse(jsonStr);
    } catch {
      return res.status(500).json({ error: 'AI javobini parse qilishda xatolik' });
    }

    if (!save) {
      return res.json({ generated });
    }

    const id = await Assignment.create({
      lesson_id, created_by: req.user.id,
      title: generated.title,
      description: generated.description || '',
      task_type, instructions: generated.instructions,
      max_score: 100, deadline: null,
      ai_generated: true
    });
    const assignment = await Assignment.findById(id);
    res.status(201).json({ message: 'AI topshiriq yaratildi', assignment, generated });
  } catch (err) {
    console.error('AI generate error:', err);
    res.status(500).json({ error: 'AI topshiriq yaratishda xatolik: ' + err.message });
  }
});

// PUT /api/assignments/:id — update
router.put('/:id', authenticateToken, requireRole(['teacher','admin']), async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ error: 'Topshiriq topilmadi' });
    if (req.user.role === 'teacher' && a.created_by !== req.user.id)
      return res.status(403).json({ error: 'Ruxsat yo\'q' });
    await Assignment.update(req.params.id, req.body);
    res.json({ message: 'Yangilandi', assignment: await Assignment.findById(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: 'Yangilashda xatolik' });
  }
});

// DELETE /api/assignments/:id
router.delete('/:id', authenticateToken, requireRole(['teacher','admin']), async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ error: 'Topshiriq topilmadi' });
    if (req.user.role === 'teacher' && a.created_by !== req.user.id)
      return res.status(403).json({ error: 'Ruxsat yo\'q' });
    await Assignment.delete(req.params.id);
    res.json({ message: "O'chirildi" });
  } catch (err) {
    res.status(500).json({ error: "O'chirishda xatolik" });
  }
});

// POST /api/assignments/:id/submit — o'quvchi fayl yuklash
router.post('/:id/submit', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'student')
      return res.status(403).json({ error: 'Faqat o\'quvchilar topshiriq yuklaydi' });
    if (!req.file)
      return res.status(400).json({ error: 'Fayl yuklanmadi' });

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Topshiriq topilmadi' });

    const subId = await Assignment.submitFile({
      assignment_id: parseInt(req.params.id),
      student_id: req.user.id,
      file_name: req.file.originalname,
      file_path: `/uploads/submissions/${req.file.filename}`,
      file_size: req.file.size
    });

    res.status(201).json({ message: 'Topshiriq yuklandi', submission_id: subId });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Fayl yuklashda xatolik: ' + err.message });
  }
});

// POST /api/assignments/:id/submit-code — o'quvchi kodni matn sifatida yuboradi (python/html/js/css)
// Avtomatik AI baholash ham shu yerda amalga oshiriladi
const CODE_TYPES = ['python', 'html', 'javascript', 'css'];
const CODE_EXTENSIONS = { python: '.py', html: '.html', javascript: '.js', css: '.css' };

router.post('/:id/submit-code', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student')
      return res.status(403).json({ error: 'Faqat o\'quvchilar topshiriq yuboradi' });

    const { code } = req.body;
    if (!code || !code.trim())
      return res.status(400).json({ error: 'Kod bo\'sh bo\'lishi mumkin emas' });

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Topshiriq topilmadi' });

    if (!CODE_TYPES.includes(assignment.task_type)) {
      return res.status(400).json({ error: 'Bu topshiriq turi kod yozishni qo\'llab-quvvatlamaydi' });
    }

    // Kodni faylga yozish
    const ext = CODE_EXTENSIONS[assignment.task_type] || '.txt';
    const safeName = `code_${Date.now()}_u${req.user.id}${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeName);
    fs.writeFileSync(filePath, code, 'utf8');

    // Submission saqla
    const subId = await Assignment.submitFile({
      assignment_id: parseInt(req.params.id),
      student_id: req.user.id,
      file_name: `kod${ext}`,
      file_path: `/uploads/submissions/${safeName}`,
      file_size: Buffer.byteLength(code, 'utf8')
    });

    // ── Avtomatik AI baholash ────────────────────────────────
    let aiResult = null;
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const codeContent = `Fayl: kod${ext}\n\nO'quvchi yozgan kod:\n\`\`\`${assignment.task_type}\n${code.slice(0, 5000)}\n\`\`\``;
      const prompt = buildAIGradePrompt(assignment.task_type, assignment.instructions, codeContent);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1000
      });

      const raw = completion.choices[0].message.content.trim();
      const jsonStr = raw.match(/\{[\s\S]*\}/)?.[0] || raw;
      aiResult = JSON.parse(jsonStr);

      const score = Math.round(((aiResult.score_percent || 0) / 100) * (assignment.max_score || 100));
      await Assignment.gradeSubmission(subId, {
        score,
        feedback: aiResult.feedback || '',
        graded_by: 'ai',
        ai_report: JSON.stringify(aiResult)
      });

      aiResult.score = score;
      // Lesson progress yangilash (kod submit + AI grade)
      await triggerLessonProgress(parseInt(req.params.id), req.user.id);
    } catch (aiErr) {
      console.error('Auto AI grade error (non-fatal):', aiErr.message);
      // AI baholash muvaffaqiyatsiz bo'lsa ham, submission saqlangan
    }

    res.status(201).json({
      message: 'Kod yuborildi va baholandi',
      submission_id: subId,
      ai_result: aiResult
    });
  } catch (err) {
    console.error('Submit code error:', err);
    res.status(500).json({ error: 'Kod yuborishda xatolik: ' + err.message });
  }
});

// GET /api/assignments/:id/submissions — o'qituvchi barcha javoblarni ko'radi
router.get('/:id/submissions', authenticateToken, requireRole(['teacher','admin']), async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ error: 'Topshiriq topilmadi' });
    if (req.user.role === 'teacher' && a.created_by !== req.user.id)
      return res.status(403).json({ error: 'Ruxsat yo\'q' });
    const submissions = await Assignment.getAllSubmissions(req.params.id);
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Javoblarni olishda xatolik' });
  }
});

// Lesson progress triggerini chaqiruvchi helper
async function triggerLessonProgress(assignmentId, studentId) {
  try {
    const LessonProgress = require('../models/LessonProgress');
    const a = await Assignment.findById(assignmentId);
    if (a && a.lesson_id) {
      await LessonProgress.recalculate(a.lesson_id, studentId);
    }
  } catch (err) {
    console.error('LessonProgress trigger error (non-fatal):', err.message);
  }
}

// POST /api/assignments/submissions/:subId/grade — qo'lda baholash
router.post('/submissions/:subId/grade', authenticateToken, requireRole(['teacher','admin']), async (req, res) => {
  try {
    const { score, feedback } = req.body;
    if (score === undefined || score === null)
      return res.status(400).json({ error: 'Ball kiritilishi shart' });

    const sub = await Assignment.getSubmissionById(req.params.subId);
    if (!sub) return res.status(404).json({ error: 'Topshirma topilmadi' });

    const a = await Assignment.findById(sub.assignment_id);
    if (req.user.role === 'teacher' && a.created_by !== req.user.id)
      return res.status(403).json({ error: 'Ruxsat yo\'q' });

    const clampedScore = Math.min(Math.max(parseInt(score), 0), sub.max_score || 100);
    await Assignment.gradeSubmission(req.params.subId, {
      score: clampedScore,
      feedback: feedback || '',
      graded_by: 'teacher'
    });

    // Lesson progress yangilash
    await triggerLessonProgress(sub.assignment_id, sub.student_id);

    res.json({ message: 'Baholandi', score: clampedScore });
  } catch (err) {
    console.error('Grade error:', err);
    res.status(500).json({ error: 'Baholashda xatolik' });
  }
});

// Fayl turini topshiriq turiga mosligini tekshirish
function checkFileType(task_type, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const allowed = {
    word:       ['.doc', '.docx'],
    excel:      ['.xls', '.xlsx'],
    access:     ['.mdb', '.accdb'],
    python:     ['.py'],
    scratch:    ['.sb3', '.sb2'],
    html:       ['.html', '.htm'],
    javascript: ['.js'],
    css:        ['.css'],
    other:      [] // har qanday fayl qabul
  };
  const list = allowed[task_type];
  if (!list || list.length === 0) return { ok: true };
  if (!list.includes(ext)) {
    return {
      ok: false,
      expected: list.join(' yoki '),
      got: ext || '(noma\'lum)'
    };
  }
  return { ok: true };
}

// POST /api/assignments/submissions/:subId/ai-grade — AI baholash
router.post('/submissions/:subId/ai-grade', authenticateToken, requireRole(['teacher','admin']), async (req, res) => {
  try {
    const sub = await Assignment.getSubmissionById(req.params.subId);
    if (!sub) return res.status(404).json({ error: 'Topshirma topilmadi' });

    const a = await Assignment.findById(sub.assignment_id);
    if (req.user.role === 'teacher' && a.created_by !== req.user.id)
      return res.status(403).json({ error: 'Ruxsat yo\'q' });

    // ── 1. Fayl turini tekshirish ──────────────────────────────
    const fileCheck = checkFileType(a.task_type, sub.file_name);
    if (!fileCheck.ok) {
      const feedback = `❌ Noto'g'ri fayl turi yuklangan!\n\nTopshiriq: ${TASK_TYPES[a.task_type]?.label} (${fileCheck.expected})\nYuklangan fayl: "${sub.file_name}" (${fileCheck.got})\n\nO'quvchi topshiriq talablariga mos fayl yuklamagan. Iltimos, to'g'ri formatdagi faylni qaytadan yuklang.`;

      await Assignment.gradeSubmission(req.params.subId, {
        score: 0,
        feedback,
        graded_by: 'ai',
        ai_report: JSON.stringify({ score_percent: 0, reason: 'wrong_file_type', expected: fileCheck.expected, got: fileCheck.got })
      });

      return res.json({
        message: 'AI baholadi',
        score: 0, score_percent: 0,
        feedback,
        strengths: '',
        improvements: `To'g'ri fayl turini yuklang: ${fileCheck.expected}`
      });
    }

    // ── 2. Faylni o'qish ──────────────────────────────────────
    const filePath = path.join(__dirname, '..', sub.file_path);
    const fileData = await readFileForAI(filePath, sub.file_name);

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let result;

    if (fileData.type === 'image') {
      // ── 3a. Rasm — Vision API ─────────────────────────────
      // task_type ga mos mezonlarni olamiz
      const taskCriteriaForVision = {
        python: 'Bu Python dasturining screenshoti. Kod sintaksisi, funksiyalar, shartlar, input/output ko\'rib chiqilsin. Diagramma yoki Excel formulalari TALAB QILINMAYDI.',
        html: 'Bu HTML sahifaning screenshoti. Tuzilma, teglar, vizual ko\'rinish ko\'rib chiqilsin.',
        javascript: 'Bu JavaScript dasturining screenshoti. Kod logikasi va natija ko\'rib chiqilsin.',
        css: 'Bu CSS stilning screenshoti. Vizual dizayn va stillar ko\'rib chiqilsin.',
        excel: 'Bu Excel fayl screenshoti. Jadvallar, formulalar, diagrammalar ko\'rib chiqilsin.',
        word: 'Bu Word hujjat screenshoti. Formatlash, tuzilma va mazmun ko\'rib chiqilsin.',
        scratch: 'Bu Scratch loyihasining screenshoti. Bloklar, animatsiya ko\'rib chiqilsin.',
      }[a.task_type] || 'Topshiriq talablariga umumiy moslik ko\'rib chiqilsin.';

      const visionPrompt = `Sen informatika o'qituvchisisisan. O'quvchi quyidagi topshiriqni bajardi.

TOPSHIRIQ TURI: ${TASK_TYPES[a.task_type]?.label || a.task_type}
TOPSHIRIQ TALABLARI:
${a.instructions}

BAHOLASH KO'RSATMASI: ${taskCriteriaForVision}

O'quvchi "${sub.file_name}" nomli rasm yubordi. Rasmni diqqat bilan ko'rib, FAQAT topshiriq talablariga mosligini baholabing.

Quyidagi JSON formatda javob ber (boshqa hech narsa yozma):
{
  "score_percent": 60,
  "feedback": "Rasmda ko'rinadiganlarga asoslanib batafsil tahlil",
  "strengths": "Ijobiy tomonlar",
  "improvements": "Yaxshilash kerak bo'lgan tomonlar"
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: visionPrompt },
            { type: 'image_url', image_url: { url: `data:${fileData.mimeType};base64,${fileData.content}`, detail: 'high' } }
          ]
        }],
        temperature: 0.2,
        max_tokens: 1000
      });

      const raw = completion.choices[0].message.content.trim();
      const jsonStr = raw.match(/\{[\s\S]*\}/)?.[0] || raw;
      result = JSON.parse(jsonStr);

    } else {
      // ── 3b. Matn yoki binary — to'liq tarkib bilan ────────
      // binary_unreadable bo'lsa ham — aniq "o'qilmadi" xabari bilan AI ga beramiz
      const prompt = buildAIGradePrompt(a.task_type, a.instructions, fileData.content);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1000
      });

      const raw = completion.choices[0].message.content.trim();
      const jsonStr = raw.match(/\{[\s\S]*\}/)?.[0] || raw;
      result = JSON.parse(jsonStr);
    }

    // ── 4. Natijani saqlash ───────────────────────────────────
    const score = Math.round(((result.score_percent || 0) / 100) * (sub.max_score || 100));
    await Assignment.gradeSubmission(req.params.subId, {
      score,
      feedback: result.feedback || '',
      graded_by: 'ai',
      ai_report: JSON.stringify(result)
    });

    // Lesson progress yangilash
    await triggerLessonProgress(sub.assignment_id, sub.student_id);

    res.json({
      message: 'AI baholadi',
      score,
      score_percent: result.score_percent,
      feedback: result.feedback,
      strengths: result.strengths,
      improvements: result.improvements
    });

  } catch (err) {
    console.error('AI grade error:', err);
    res.status(500).json({ error: 'AI baholashda xatolik: ' + err.message });
  }
});

module.exports = router;
module.exports.TASK_TYPES = TASK_TYPES;
