# InfoBaho — Texnik Qo'llanma
## Platformani 0 dan qanday qilinganligini to'liq tushuntirish

---

## MUNDARIJA

1. [Platforma haqida umumiy ma'lumot](#1-platforma-haqida)
2. [Texnologiyalar tanlash sabablari](#2-texnologiyalar)
3. [Loyiha tuzilmasi](#3-loyiha-tuzilmasi)
4. [Backend — Server tomoni](#4-backend)
5. [Frontend — Foydalanuvchi interfeysi](#5-frontend)
6. [Ma'lumotlar bazasi](#6-malumotlar-bazasi)
7. [Autentifikatsiya va xavfsizlik](#7-xavfsizlik)
8. [AI integratsiya](#8-ai-integratsiya)
9. [Firebase Storage](#9-firebase-storage)
10. [PWA — Offline rejim](#10-pwa)
11. [Deploy jarayoni](#11-deploy)

---

## 1. PLATFORMA HAQIDA

**InfoBaho** — informatika fanidan o'quvchilar bilimini baholash platformasi.

### Asosiy imkoniyatlar:
- Test yaratish va topshirish (6 xil savol turi)
- AI orqali savol generatsiya va avtomatik baholash
- Amaliy topshiriqlar (Python, HTML, JS, CSS kod yozish)
- Gamifikatsiya (ball, daraja, medal, reyting)
- O'qituvchi uchun AI tahlil
- Forum (savol-javob, voting, AI yordamchi)
- Portfolio (ish yuklash, o'qituvchi baholash)
- Parolni tiklash (email orqali)
- PWA (offline test topshirish)


---

## 2. TEXNOLOGIYALAR VA TANLASH SABABLARI

| Texnologiya | Nima uchun tanlangan |
|-------------|---------------------|
| **React.js 18** | Komponent-asosli arxitektura, tez ishlovchi Virtual DOM, katta ekosistema |
| **Express.js** | Yengil, tez, Node.js uchun eng mashhur backend framework |
| **PostgreSQL** | Ishonchli, SQL standart, Render.com da bepul |
| **JWT** | Stateless autentifikatsiya, serverda sessiya saqlamaymiz |
| **OpenAI API** | GPT-4o-mini — arzon, tez, o'zbek tilida yaxshi ishlaydi |
| **Firebase Storage** | Bepul 5GB, CDN, fayllar serverda saqlanmaydi |
| **Resend.com** | Email API — SMTP portlari bloklanmaydi |
| **Render.com** | Backend hosting — bepul, PostgreSQL bor |
| **Netlify** | Frontend hosting — bepul, avtomatik deploy |

### Nima uchun React (Angular/Vue emas)?
- O'rganish oson
- Komponentlar qayta ishlatiladi
- Katta community va kutubxonalar
- React Router — SPA navigatsiya

### Nima uchun PostgreSQL (MongoDB emas)?
- Strukturali ma'lumotlar (users, tests, questions — aniq sxema)
- SQL — kuchli so'rovlar (JOIN, GROUP BY, subquery)
- ACID tranzaksiyalar — ma'lumot yo'qolmaydi


---

## 3. LOYIHA TUZILMASI

```
InfoBaho/
├── backend/                    # Server tomoni
│   ├── server.js               # Asosiy server fayli (Express app)
│   ├── package.json            # Dependencies ro'yxati
│   ├── config/
│   │   ├── database.js         # PostgreSQL ulanish
│   │   └── firebase.js         # Firebase Admin SDK
│   ├── middleware/
│   │   ├── auth.js             # JWT tekshirish
│   │   └── rateLimiter.js      # Rate limiting (DDoS himoya)
│   ├── models/
│   │   ├── User.js             # Foydalanuvchi modeli
│   │   ├── Test.js             # Test modeli
│   │   ├── Question.js         # Savol modeli
│   │   ├── Assignment.js       # Topshiriq modeli
│   │   ├── Lesson.js           # Dars modeli
│   │   └── LessonProgress.js   # O'zlashtirish modeli
│   ├── routes/
│   │   ├── auth.js             # Login, Register, Parol tiklash
│   │   ├── users.js            # Foydalanuvchilar CRUD
│   │   ├── tests.js            # Testlar CRUD
│   │   ├── questions.js        # Savollar CRUD + AI generatsiya
│   │   ├── results.js          # Test natijalari
│   │   ├── lessons.js          # Darslar + materiallar
│   │   ├── assignments.js      # Amaliy topshiriqlar + AI baholash
│   │   ├── portfolio.js        # Portfolio + baholash
│   │   ├── statistics.js       # Statistika
│   │   ├── lessonProgress.js   # Dars progressi + jurnal
│   │   ├── aiAnalytics.js      # AI tahlil
│   │   └── forum.js            # Forum (post, comment, vote)
│   ├── utils/
│   │   ├── fileReader.js       # Fayl o'qish (AI baholash uchun)
│   │   └── firebaseStorage.js  # Firebase yuklash utility
│   └── uploads/                # Local fayllar (endi Firebase'da)
│
├── frontend/                   # Foydalanuvchi interfeysi
│   ├── public/
│   │   ├── index.html          # Asosiy HTML
│   │   ├── manifest.json       # PWA sozlamalari
│   │   └── sw.js               # Service Worker (offline)
│   ├── src/
│   │   ├── App.js              # Asosiy komponent (routing)
│   │   ├── index.js            # Entry point + SW register
│   │   ├── context/
│   │   │   └── AuthContext.js  # Autentifikatsiya holati
│   │   ├── components/
│   │   │   ├── Navbar.js       # Navigatsiya (desktop + mobile)
│   │   │   ├── PrivateRoute.js # Himoyalangan route
│   │   │   └── OfflineIndicator.js # Internet holati
│   │   ├── pages/              # 16+ sahifa
│   │   ├── services/
│   │   │   └── api.js          # Axios instance + API funksiyalar
│   │   ├── utils/
│   │   │   └── offlineStorage.js # IndexedDB (offline)
│   │   └── assets/css/         # Stillar (Hi-Tech dark theme)
│   └── package.json
│
├── ARTICLE_1.md                # Ilmiy maqola 1
├── ARTICLE_2.md                # Ilmiy maqola 2
└── TECHNICAL_GUIDE.md          # Shu fayl
```


---

## 4. BACKEND — SERVER TOMONI

### 4.1. server.js — Asosiy fayl

```javascript
const express = require('express');   // Web framework
const cors = require('cors');         // Cross-Origin so'rovlar ruxsati
const compression = require('compression'); // Gzip siqish (tezlik uchun)

const app = express();
app.set('trust proxy', 1);           // Render.com proxy uchun

// Middleware ketma-ketligi MUHIM:
app.use(cors({...}));                 // 1. CORS
app.use(express.json());              // 2. JSON parse
app.use(compression());               // 3. Gzip (javoblar 70% kichrayadi)
app.use('/api', apiLimiter);          // 4. Rate limit (DDoS himoya)

// Routelar ulash
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
// ...
```

**Nima uchun bu ketma-ketlik:**
- CORS birinchi — brauzer preflight so'rovi javob olishi kerak
- JSON parse — keyin body o'qiladi
- Compression — javoblar siqiladi
- Rate limit — ortiqcha so'rovlar bloklanadi

### 4.2. config/database.js — PostgreSQL ulanish

```javascript
const { Pool } = require('pg');

// SQLite → PostgreSQL o'tkazish uchun adapter
function fixSql(sql) {
  let s = convertPlaceholders(sql);  // ? → $1, $2
  s = s.replace(/AUTOINCREMENT/gi, 'SERIAL');
  s = s.replace(/DATETIME/gi, 'TIMESTAMPTZ');
  return s;
}
```

**Nima uchun adapter kerak:**
Loyiha dastlab SQLite'da yaratilgan. PostgreSQL'ga o'tkazilganda
barcha SQL so'rovlarni qayta yozmaslik uchun adapter yozildi.
U `?` → `$1`, `DATETIME` → `TIMESTAMPTZ` ga avtomatik o'zgartiradi.

### 4.3. middleware/auth.js — Autentifikatsiya

```javascript
const authenticateToken = async (req, res, next) => {
  // 1. Headerdan token olish
  const token = authHeader.split(' ')[1]; // "Bearer TOKEN"
  
  // 2. Token dekodlash
  const decoded = jwt.verify(token, secret);
  
  // 3. Foydalanuvchini topish
  const user = await User.findById(decoded.userId);
  
  // 4. req.user ga biriktirish (keyingi middleware'lar ishlatadi)
  req.user = { id: user.id, role: user.role, ... };
  
  next(); // Davom etish
};
```

**Nima uchun JWT:**
- Server sessiya saqlamaydi (stateless)
- Token 7 kun amal qiladi
- Har so'rovda token headerda yuboriladi
- Server faqat imzoni tekshiradi

### 4.4. middleware/rateLimiter.js — DDoS himoya

```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 daqiqa oyna
  max: 5,                      // max 5 ta urinish
  message: { error: 'Juda ko\'p urinish...' }
});
```

**Nima uchun rate limit:**
- Login: 15 daqiqada 5 urinish (brute force himoya)
- Register: 1 soatda 3 akkaunt (spam himoya)
- API: 1 daqiqada 100 so'rov (DDoS himoya)
- AI: 1 daqiqada 5 so'rov (OpenAI xarajat nazorati)


### 4.5. routes/auth.js — Autentifikatsiya endpointlari

| Endpoint | Vazifasi |
|----------|----------|
| `POST /register` | Yangi foydalanuvchi yaratish (parol hash'lanadi) |
| `POST /login` | Login (JWT token qaytaradi) |
| `GET /me` | Joriy foydalanuvchi ma'lumotlari |
| `PUT /profile` | Profilni tahrirlash |
| `PUT /change-password` | Parolni o'zgartirish |
| `POST /forgot-password` | Email ga 6 xonali kod yuborish |
| `POST /verify-reset-code` | Kodni tekshirish |
| `POST /reset-password` | Yangi parol o'rnatish |

**Parolni tiklash jarayoni:**
```
1. Foydalanuvchi email kiritadi
2. Server 6 xonali kod yaratadi (crypto.randomInt)
3. Kod bazaga saqlanadi (15 daqiqa muddatli)
4. Resend.com API orqali email yuboriladi
5. Foydalanuvchi kodni kiritadi → server tekshiradi
6. Yangi parol bcrypt bilan hash'lanib saqlanadi
```

### 4.6. routes/tests.js — Test boshqaruvi

```javascript
// Testlar ro'yxati — rolga qarab filtr
router.get('/', authenticateToken, async (req, res) => {
  if (req.user.role === 'student') {
    // O'quvchi: faqat nashr qilingan + o'z maktabining testlari
    filters.is_published = true;
    filters.student_district = currentUser.district;
    filters.student_school = currentUser.school_number;
  } else if (req.user.role === 'teacher') {
    // O'qituvchi: faqat o'zi yaratgan testlar
    filters.created_by = req.user.id;
  }
  // Admin: hammani ko'radi
});
```

**Nima uchun filtr:**
Xavfsizlik — o'quvchi boshqa maktab testlarini ko'rmasligi kerak.
O'qituvchi faqat o'z testlarini boshqaradi.

### 4.7. routes/results.js — Test natijasi

```javascript
router.post('/submit', async (req, res) => {
  // 1. Avval topshirganmi tekshirish (1 marta ruxsat)
  const existing = await database.get(
    'SELECT id FROM results WHERE user_id = ? AND test_id = ?', ...
  );
  if (existing) return res.status(403).json({...});

  // 2. Har savol tekshiriladi
  const detailedAnswers = questions.map(question => {
    const isCorrect = Question.checkAnswer(question, userAnswer);
    if (isCorrect) correctCount++;
    return { question_id, user_answer, correct_answer, is_correct };
  });

  // 3. Foiz va o'tish hisoblanadi
  const percentage = (earnedPoints / totalPoints) * 100;
  const passed = percentage >= test.passing_score;

  // 4. Natija saqlanadi
  // 5. Statistika yangilanadi
  // 6. LessonProgress qayta hisoblanadi
});
```

### 4.8. routes/assignments.js — Amaliy topshiriqlar

**AI bilan avtomatik baholash jarayoni:**
```
1. O'quvchi kod yozib yuboradi (Python/HTML/JS/CSS)
2. Kod Firebase Storage'ga saqlanadi
3. buildAIGradePrompt() — baholash mezoni yaratiladi
4. GPT-4o-mini kodni tahlil qiladi
5. JSON natija qaytaradi: {score_percent, feedback, strengths, improvements}
6. Ball hisoblanadi va saqlanadi
7. LessonProgress yangilanadi
```

**Nima uchun AI baholash:**
- O'qituvchi vaqtini tejaydi
- Ob'ektiv (subjektiv emas)
- Darhol natija (o'quvchi kutmasligi kerak)
- Batafsil feedback (nima to'g'ri, nima noto'g'ri)


### 4.9. routes/forum.js — Forum tizimi

**Gamifikatsiya integratsiyasi:**
```javascript
async function addPoints(userId, points) {
  // 1. Ball qo'shish
  await database.run('UPDATE users SET points = points + ? WHERE id = ?', ...);
  
  // 2. Level yangilash (avtomatik)
  await database.run(`
    UPDATE users SET level = CASE 
      WHEN points >= 1000 THEN 5   -- Brilliant
      WHEN points >= 500 THEN 4    -- Platina
      WHEN points >= 200 THEN 3    -- Oltin
      WHEN points >= 50 THEN 2     -- Kumush
      ELSE 1                        -- Bronza
    END WHERE id = ?
  `, [userId]);
}
```

**Voting tizimi:**
```javascript
// Toggle mexanizmi: qayta bossa — olib tashlanadi
if (existing.vote_type === vote_type) {
  // Bir xil tugma qayta bosildi → ovoz olib tashlash
  await database.run('DELETE FROM forum_votes WHERE id = ?', ...);
} else {
  // Boshqa tugma bosildi → o'zgartirish (up → down)
  await database.run('UPDATE forum_votes SET vote_type = ?', ...);
}
```

### 4.10. routes/aiAnalytics.js — AI tahlil

**Jarayon:**
```
1. O'qituvchining barcha darslari, testlari va topshiriqlari olinadi
2. Har test uchun: o'rtacha ball, o'tish foizi, zaif o'quvchilar
3. Har savol uchun: necha % o'quvchi xato qilgan
4. Amaliy topshiriqlar: kam ball olganlar
5. Barcha ma'lumot GPT-4o-mini ga uzatiladi
6. AI quyidagilarni qaytaradi:
   - Qiyin mavzular + sabablar + tavsiyalar
   - Yordam kerak o'quvchilar (ism, sinf, zaif tomonlar)
   - O'qitish tavsiyalari (prioritet bo'yicha)
   - Sinflar solishtiruvi
   - Haftalik fokus
   - Motivatsiya maslahatlari
```

---

## 5. FRONTEND — FOYDALANUVCHI INTERFEYSI

### 5.1. App.js — Routing va Lazy Loading

```javascript
// Lazy loading — sahifalar kerak bo'lgandagina yuklanadi
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Forum = lazy(() => import('./pages/Forum'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
      </Routes>
    </Suspense>
  );
}
```

**Nima uchun Lazy Loading:**
- Oldin: BARCHA 16 sahifa bir vaqtda yuklanardi (~500KB)
- Endi: Faqat kerakli sahifa yuklanadi (~30-50KB)
- Natija: Birinchi yuklanish 3x tezroq

### 5.2. context/AuthContext.js — Global holat

```javascript
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Sahifa ochilganda token tekshirish
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getMe()
        .then(response => setUser(response.data.user))
        .catch(() => {
          // Token eskirgan — tozalash
          localStorage.removeItem('token');
          setUser(null);
        });
    }
  }, []);

  const login = async (username, password) => {
    const response = await authAPI.login({username, password});
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
  };
};
```

**Nima uchun Context API (Redux emas):**
- Oddiy loyiha — global state faqat `user` va `loading`
- Redux ortiqcha murakkablik qo'shardi
- Context API React'ning o'zi bilan keladi (qo'shimcha package yo'q)

### 5.3. services/api.js — API bilan aloqa

```javascript
// Axios instance — barcha so'rovlar uchun bazaviy sozlamalar
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor: har so'rovga token qo'shish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: 401 xatolikda avtomatik logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Nima uchun interceptor:**
- Har sahifada token qo'shishni yozmaslik uchun
- Token eskirganda avtomatik logout qilinadi
- DRY printsipi — bir joyda yoziladi, hamma joyda ishlaydi


### 5.4. components/Navbar.js — Navigatsiya

```javascript
// Linklar massivda — DRY (Don't Repeat Yourself)
const navLinks = [
  { path: '/dashboard', icon: '🏠', label: 'Bosh sahifa', roles: ['student','teacher','admin'] },
  { path: '/forum', icon: '💬', label: 'Forum', roles: ['student','teacher','admin'] },
  { path: '/ai-analytics', icon: '🤖', label: 'AI Tahlil', roles: ['teacher','admin'] },
];

// Rolga qarab filtr
const filteredLinks = navLinks.filter(link => link.roles.includes(user.role));
```

**Mobile hamburger menu:**
- 900px dan kichik ekranda hamburger ko'rinadi
- O'ngdan slide-in sidebar (animatsiya bilan)
- Body scroll bloklanadi (menu ochiq payt)

### 5.5. Sahifalar arxitekturasi

Har bir sahifa bir xil pattern'da yozilgan:

```javascript
const SomePage = () => {
  // 1. State'lar
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Ma'lumot yuklash
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/endpoint');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Loading holati
  if (loading) return <Spinner />;

  // 4. UI renderning
  return <div>...</div>;
};
```

---

## 6. MA'LUMOTLAR BAZASI

### 6.1. Jadvallar va munosabatlar

```
users (id, username, email, password, role, points, level, district, school_number, class_name)
  │
  ├── lessons (id, title, grade, subject, created_by → users.id)
  │     ├── tests (id, title, lesson_id, duration, is_published, created_by)
  │     │     └── questions (id, test_id, question_text, options, correct_answer)
  │     ├── assignments (id, lesson_id, task_type, instructions, max_score)
  │     │     └── assignment_submissions (id, assignment_id, student_id, score, status)
  │     └── lesson_progress (id, lesson_id, student_id, percent, grade)
  │
  ├── results (id, user_id, test_id, percentage, correct_answers, passed, answers)
  ├── portfolio_items (id, user_id, title, item_type, file_url)
  │     ├── portfolio_ratings (id, item_id, teacher_id, score, comment)
  │     └── portfolio_likes (id, item_id, user_id)
  │
  ├── forum_posts (id, user_id, category_id, title, content, tags, pinned)
  │     ├── forum_comments (id, post_id, user_id, content, is_best_answer, is_ai_answer)
  │     └── forum_votes (id, user_id, post_id/comment_id, vote_type)
  │
  ├── statistics (id, user_id, total_tests_taken, average_score)
  └── password_resets (id, user_id, email, code, expires_at)
```

### 6.2. Muhim dizayn qarorlari

**1. `class_name` va `teaching_classes` — maktab filtrlash:**
```sql
-- O'quvchi faqat O'Z maktabi va O'Z sinfi testlarini ko'radi
WHERE u.district = ? AND u.school_number = ?
  AND u.teaching_classes LIKE '%10-A%'
```

**2. `answers` — JSON formatda saqlash:**
```sql
-- Batafsil javoblar JSON sifatida saqlanadi
INSERT INTO results (..., answers) VALUES (..., '[{"question_id":1,"is_correct":true}]')
```
Nima uchun: Har savol uchun alohida jadval yaratish ortiqcha. JSON ichida barcha ma'lumot bor.

**3. O'zlashtirish hisob-kitobi:**
```
Dars bali = (To'g'ri javoblar × 2) + (Topshiriq ballari)
Foiz = Dars bali / Maksimal bal × 100
Baho: 86%+ → 5, 60%+ → 4, 40%+ → 3, <40% → 2
```


---

## 7. AUTENTIFIKATSIYA VA XAVFSIZLIK

### 7.1. JWT Token oqimi

```
Login → Server JWT yaratadi → Client localStorage'ga saqlaydi
  ↓
Har so'rov: Header: "Authorization: Bearer eyJhbG..."
  ↓
Server: jwt.verify() → req.user = {id, role}
  ↓
7 kun keyin: token eskiradi → 401 → avtomatik logout
```

### 7.2. Parol xavfsizligi

```javascript
// Saqlashda: bcrypt hash (10 round)
const hashedPassword = await bcrypt.hash(password, 10);
// Tekshirishda: hash solishtirish
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

**Nima uchun bcrypt:** Hash'dan asl parolni tiklash MUMKIN EMAS.

### 7.3. Rol-based access control

```javascript
// middleware
const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Ruxsat yo\'q' });
  }
  next();
};

// Ishlatish
router.post('/tests', authenticateToken, requireRole(['teacher','admin']), ...)
```

---

## 8. AI INTEGRATSIYA

### 8.1. OpenAI GPT-4o-mini ishlatish

```javascript
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',     // Arzon va tez model
  messages: [
    { role: 'system', content: 'Sen informatika o\'qituvchisisisan...' },
    { role: 'user', content: prompt }
  ],
  temperature: 0.4,          // 0=aniq, 1=ijodiy
  max_tokens: 3000
});
```

### 8.2. AI ishlatilgan joylar

| Funksiya | Nima qiladi |
|----------|-------------|
| Test savol generatsiya | Mavzu + qiyinlik → 5-20 ta savol |
| Amaliy topshiriq yaratish | Mavzu + sinf → to'liq ko'rsatma |
| Kod baholash | O'quvchi kodi → ball + feedback |
| AI Tahlil | Barcha natijalar → tavsiya va xulosa |
| Forum AI javob | Savol → tushuntirish + kod misol |

---

## 9. FIREBASE STORAGE

### 9.1. Arxitektura

```
Oldin: Fayl → Server disk → URL: /uploads/file.pdf
Endi:  Fayl → Firebase Cloud → URL: https://storage.googleapis.com/.../file.pdf
```

### 9.2. Ishlash jarayoni

```javascript
// 1. Multer faylni MEMORY'ga oladi (diskka emas)
const upload = multer({ storage: multer.memoryStorage() });

// 2. Firebase'ga yuklash
async function uploadMulterFile(multerFile, folder) {
  const destination = `${folder}/${Date.now()}_${safeName}`;
  const file = bucket.file(destination);
  
  // Stream orqali yuklash
  const stream = file.createWriteStream({ contentType });
  stream.end(multerFile.buffer);
  
  // Public URL qaytarish
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${destination}`;
}
```

**Nima uchun Firebase (lokal emas):**
- Render.com restart qilganda fayllar YO'QOLADI
- Disk to'lib qolishi mumkin
- Firebase — cheksiz, CDN orqali tez yuklanadi

---

## 10. PWA — OFFLINE REJIM

### 10.1. Service Worker (sw.js)

```javascript
// Strategiya:
// Statik fayllar → Cache First (keshdan, keyin network)
// API GET → Network First (networkdan, keyin kesh)
// API POST (test submit) → Offline bo'lsa IndexedDB ga saqlash

self.addEventListener('fetch', (event) => {
  if (url.pathname.startsWith('/api/')) {
    // API so'rov
    if (request.method === 'POST' && url.includes('/results/submit')) {
      // Test topshirish — offline saqlash
      try { return fetch(request); }
      catch { saveOfflineSubmission(body); }
    }
  } else {
    // Statik fayl — keshdan
    const cached = await caches.match(request);
    if (cached) return cached;
  }
});
```

### 10.2. Background Sync

```
Internet yo'q → Javob IndexedDB ga saqlanadi
Internet qaytdi → sync event → javoblar serverga yuboriladi
```

---

## 11. DEPLOY JARAYONI

### 11.1. Backend (Render.com)

```
GitHub push → Render avtomatik build → npm install → node server.js
```

Environment variables:
- DATABASE_URL, JWT_SECRET, OPENAI_API_KEY
- FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET
- RESEND_API_KEY

### 11.2. Frontend (Netlify)

```
GitHub push → Netlify avtomatik build → npm run build → static files
```

Environment variables:
- REACT_APP_API_URL = https://infotest-xxxx.onrender.com/api

### 11.3. Arxitektura diagrammasi

```
[Foydalanuvchi brauzeri]
        │
        ├── Netlify (Frontend: React SPA)
        │     └── infobaho.netlify.app
        │
        └── Render.com (Backend: Express API)
              ├── PostgreSQL (Ma'lumotlar bazasi)
              ├── Firebase Storage (Fayllar)
              ├── OpenAI API (AI funksiyalar)
              └── Resend.com (Email yuborish)
```

---

## XULOSA

InfoBaho platformasi 12+ moduldan iborat to'liq ta'lim ekotizimi.
Har bir texnologik qaror aniq sabab bilan tanlangan:
- **Tezlik** uchun: Lazy loading, gzip, CDN
- **Xavfsizlik** uchun: JWT, bcrypt, rate limit, CORS
- **Foydalanuvchi tajribasi** uchun: PWA, Hi-Tech dizayn, real-time feedback
- **O'qituvchi** uchun: AI tahlil, avtomatik baholash, jurnal
- **O'quvchi** uchun: Gamifikatsiya, forum, portfolio, offline
