# 📁 InfoTest - Loyiha Strukturasi

## Umumiy ko'rinish

```
InfoTest/
│
├── 📄 README.md                 # Asosiy hujjat
├── 📄 SETUP.md                  # O'rnatish qo'llanmasi
├── 📄 PROJECT_STRUCTURE.md      # Ushbu fayl
│
├── 📁 backend/                  # Backend (Express.js + SQLite)
│   ├── 📁 config/
│   │   └── 📄 database.js       # Ma'lumotlar bazasi konfiguratsiyasi
│   │
│   ├── 📁 database/
│   │   └── 📄 infotest.db       # SQLite database (yaratilgandan keyin)
│   │
│   ├── 📁 middleware/
│   │   └── 📄 auth.js           # JWT autentifikatsiya middleware
│   │
│   ├── 📁 models/
│   │   ├── 📄 User.js           # User modeli
│   │   └── 📄 Test.js           # Test modeli
│   │
│   ├── 📁 routes/
│   │   ├── 📄 auth.js           # Auth endpoints (login, register)
│   │   ├── 📄 users.js          # User endpoints
│   │   ├── 📄 tests.js          # Test endpoints
│   │   ├── 📄 questions.js      # Question endpoints
│   │   ├── 📄 results.js        # Result endpoints
│   │   ├── 📄 portfolio.js      # Portfolio endpoints
│   │   └── 📄 statistics.js     # Statistics endpoints
│   │
│   ├── 📁 scripts/
│   │   ├── 📄 initDatabase.js   # Database yaratish skripti
│   │   └── 📄 seedData.js       # Demo ma'lumotlar yuklash
│   │
│   ├── 📁 uploads/              # Yuklangan fayllar
│   │   └── 📄 .gitkeep
│   │
│   ├── 📄 .env                  # Environment o'zgaruvchilari
│   ├── 📄 .env.example          # .env namunasi
│   ├── 📄 .gitignore            # Git ignore
│   ├── 📄 package.json          # NPM dependencies
│   ├── 📄 README.md             # Backend README
│   └── 📄 server.js             # Asosiy server fayli
│
└── 📁 frontend/                 # Frontend (React)
    ├── 📁 public/
    │   └── 📄 index.html        # HTML shablon
    │
    ├── 📁 src/
    │   ├── 📁 assets/
    │   │   └── 📁 css/
    │   │       ├── 📄 index.css      # Global CSS
    │   │       └── 📄 App.css        # App CSS
    │   │
    │   ├── 📁 components/
    │   │   ├── 📄 Navbar.js          # Navigation bar
    │   │   └── 📄 PrivateRoute.js    # Private route wrapper
    │   │
    │   ├── 📁 context/
    │   │   └── 📄 AuthContext.js     # Authentication context
    │   │
    │   ├── 📁 pages/
    │   │   ├── 📄 Login.js           # Login sahifasi
    │   │   ├── 📄 Register.js        # Ro'yxatdan o'tish
    │   │   ├── 📄 Dashboard.js       # Bosh sahifa
    │   │   ├── 📄 Tests.js           # Testlar ro'yxati
    │   │   ├── 📄 TestDetail.js      # Test batafsil
    │   │   ├── 📄 TakeTest.js        # Test topshirish
    │   │   ├── 📄 Results.js         # Natijalar
    │   │   ├── 📄 Portfolio.js       # Portfolio
    │   │   ├── 📄 Leaderboard.js     # Liderlar jadvali
    │   │   └── 📄 Profile.js         # Profil
    │   │
    │   ├── 📁 services/
    │   │   └── 📄 api.js             # API service
    │   │
    │   ├── 📁 utils/               # Utility funksiyalar
    │   │
    │   ├── 📄 App.js                # Asosiy App komponenti
    │   └── 📄 index.js              # Entry point
    │
    ├── 📄 .gitignore               # Git ignore
    ├── 📄 package.json             # NPM dependencies
    └── 📄 README.md                # Frontend README
```

## 🗂️ Fayl va Papkalar Tavsifi

### Backend Fayllari

#### `server.js`
Asosiy server fayli. Express app yaratadi, middleware'larni ulaydi, routelarni configure qiladi.

#### `config/database.js`
SQLite database bilan ishlash uchun wrapper sinf. CRUD operatsiyalari uchun metodlar.

#### `models/`
Ma'lumotlar modellari. Har bir model o'z jadvalini boshqaradi:
- `User.js` - Foydalanuvchilar (o'quvchi, o'qituvchi, admin)
- `Test.js` - Testlar

#### `routes/`
API endpointlar. Har bir fayl bitta resource uchun routelarni o'z ichiga oladi.

#### `middleware/auth.js`
JWT token asosida autentifikatsiya. `auth`, `isStudent`, `isTeacher`, `isAdmin` middleware'lar.

#### `scripts/`
- `initDatabase.js` - Ma'lumotlar bazasi jadvallarini yaratadi
- `seedData.js` - Demo ma'lumotlarni yuklaydi

### Frontend Fayllari

#### `App.js`
Asosiy App komponenti. Router, routes va global state.

#### `context/AuthContext.js`
Authentication state management. Login, register, logout funksiyalari.

#### `services/api.js`
Backend API bilan ishlash uchun Axios wrapper. Barcha API calls shu yerda.

#### `components/`
Qayta ishlatiluvchi UI komponentlar.

#### `pages/`
Har bir sahifa alohida komponent.

## 🎨 Dizayn Struktura

### Ranglar (CSS Variables)
```css
--primary-color: #4F46E5    /* Asosiy rang (indigo) */
--secondary-color: #7C3AED   /* Ikkinchi rang (purple) */
--success-color: #10B981     /* Muvaffaqiyat (green) */
--danger-color: #EF4444      /* Xato (red) */
--warning-color: #F59E0B     /* Ogohlantirish (yellow) */
```

### Layout
- **Navbar**: Fixed top, logo + menu + user info
- **Main Content**: Max-width 1200px, centered
- **Responsive**: Mobile-first approach

## 📊 Ma'lumotlar Bazasi Strukturasi

### Tables

1. **users** - Foydalanuvchilar
   - id, username, email, password, full_name, role, school, class_number
   - points, level, badges (gamification)

2. **tests** - Testlar
   - id, title, description, subject, topic, class_number
   - duration_minutes, passing_score, difficulty
   - is_adaptive, is_published, created_by

3. **questions** - Savollar
   - id, test_id, question_type, question_text
   - options, correct_answer, explanation
   - points, difficulty, order_number

4. **test_attempts** - Test urinishlari
   - id, test_id, student_id
   - start_time, end_time, duration_seconds
   - total_score, percentage, status

5. **results** - Batafsil natijalar (har bir savol uchun)
   - id, attempt_id, question_id
   - student_answer, is_correct, points_earned

6. **portfolio_items** - Portfolio elementlari
   - id, student_id, item_type, title, description
   - file_path, score, date

7. **achievements** - Mukofotlar/Badgelar
   - id, name, description, icon
   - requirement_type, requirement_value, points_reward

8. **user_achievements** - Foydalanuvchi olgan mukofotlar
   - id, user_id, achievement_id, earned_at

9. **statistics** - Statistika
   - id, user_id, stat_type, stat_value, date

## 🔐 Autentifikatsiya Flow

1. Foydalanuvchi login/register qiladi
2. Backend JWT token yaratadi
3. Token localStorage'ga saqlanadi
4. Har bir request'da token header'da yuboriladi
5. Backend middleware token'ni tekshiradi
6. Agar valid bo'lsa, request davom etadi

## 📡 API Request Flow

```
Frontend (React) 
    ↓ (axios)
    ↓
Backend (Express)
    ↓ (auth middleware)
    ↓
Route Handler
    ↓
Model
    ↓
Database (SQLite)
    ↓
Response
    ↓
Frontend (update state)
```

## 🚀 Development Workflow

1. **Backend ishlab chiqish:**
   - `cd backend`
   - `npm run dev` (nodemon bilan)
   - Kod o'zgarsa, avtomatik restart

2. **Frontend ishlab chiqish:**
   - `cd frontend`
   - `npm start` (react-scripts bilan)
   - Kod o'zgarsa, avtomatik reload

3. **Testing:**
   - Postman/Insomnia - API testing
   - Browser - Frontend testing

4. **Deployment:**
   - Backend: Heroku, Railway, Render
   - Frontend: Vercel, Netlify, GitHub Pages
   - Database: Heroku Postgres yoki cloud SQLite

## 📚 Qo'shimcha Ma'lumot

- [Setup Guide](./SETUP.md) - Batafsil o'rnatish qo'llanmasi
- [Backend README](./backend/README.md) - Backend hujjatlari
- [Frontend README](./frontend/README.md) - Frontend hujjatlari
- [Main README](./README.md) - Umumiy ma'lumot

---

**InfoTest © 2024**
