# InfoTest Platform - O'rnatish va Ishga Tushirish

## Tizim Talablari

- Node.js (v14 yoki yuqori)
- npm (v6 yoki yuqori)
- 500MB bo'sh joy

## Tezkor Ishga Tushirish

### 1. Backend o'rnatish

```bash
cd backend
npm install
```

Kerakli paketlar:
- express
- sqlite3
- bcryptjs
- jsonwebtoken
- cors
- dotenv

### 2. Ma'lumotlar bazasini yaratish

```bash
npm run init-db
```

Bu buyruq:
- `infotest.db` faylini yaratadi
- 9 ta jadval yaratadi (users, tests, questions, test_attempts, results, portfolio_items, achievements, user_achievements, statistics)
- Indekslarni qo'shadi

### 3. Demo ma'lumotlarni yuklash

```bash
npm run seed
```

Bu buyruq quyidagilarni yaratadi:
- 1 ta admin foydalanuvchi
- 1 ta o'qituvchi
- 3 ta talaba
- 2 ta nashr qilingan test (Python, Algoritmlar)
- 1 ta qoralama test (Web dasturlash)
- Namuna test natijalari
- Yutuqlar
- Portfolio elementlari

### 4. Backend serverni ishga tushirish

```bash
npm start
```

Yoki development rejimida:

```bash
npm run dev
```

Server http://localhost:5000 da ishga tushadi.

### 5. Frontend o'rnatish

Yangi terminal oynasida:

```bash
cd ../frontend
npm install
```

Kerakli paketlar:
- react
- react-dom
- react-router-dom
- axios

### 6. Frontend ishga tushirish

```bash
npm start
```

Brauzer avtomatik ochiladi: http://localhost:3000

## Demo Hisoblar

### Administrator
- **Login:** admin
- **Parol:** admin123
- **Imkoniyatlar:** Barcha foydalanuvchilar va testlarni boshqarish, statistikalarni ko'rish

### O'qituvchi
- **Login:** o_qituvchi
- **Parol:** teacher123
- **Imkoniyatlar:** Testlar yaratish, savollar qo'shish, natijalarni ko'rish

### Talabalar

1. **Akmal Yusupov**
   - Login: akmal_yusupov
   - Parol: student123
   - Daraja: 2, Ballar: 150

2. **Malika Azimova**
   - Login: malika_azimova
   - Parol: student123
   - Daraja: 1, Ballar: 80

3. **Sardor Karimov**
   - Login: sardor_karimov
   - Parol: student123
   - Daraja: 2, Ballar: 220

## API Endpoints

### Authentication
- POST `/api/auth/register` - Ro'yxatdan o'tish
- POST `/api/auth/login` - Kirish
- GET `/api/auth/me` - Joriy foydalanuvchi
- PUT `/api/auth/profile` - Profilni yangilash
- PUT `/api/auth/change-password` - Parolni o'zgartirish

### Tests
- GET `/api/tests` - Barcha testlar
- GET `/api/tests/:id` - Bitta test
- POST `/api/tests` - Yangi test yaratish (Teacher/Admin)
- PUT `/api/tests/:id` - Testni yangilash (Teacher/Admin)
- DELETE `/api/tests/:id` - Testni o'chirish (Teacher/Admin)
- PUT `/api/tests/:id/publish` - Testni nashr qilish
- PUT `/api/tests/:id/unpublish` - Testni yashirish
- GET `/api/tests/:id/statistics` - Test statistikasi

### Questions
- GET `/api/questions/test/:testId` - Test savollari
- POST `/api/questions` - Savol qo'shish (Teacher/Admin)
- PUT `/api/questions/:id` - Savolni yangilash (Teacher/Admin)
- DELETE `/api/questions/:id` - Savolni o'chirish (Teacher/Admin)

### Results
- POST `/api/results/submit` - Test topshirish
- GET `/api/results/my-results` - Mening natijalarim (Student)
- GET `/api/results/test/:testId` - Test bo'yicha natijalar (Teacher/Admin)

### Portfolio
- GET `/api/portfolio` - Portfolio elementlari
- POST `/api/portfolio` - Element qo'shish
- PUT `/api/portfolio/:id` - Elementni yangilash
- DELETE `/api/portfolio/:id` - Elementni o'chirish

### Statistics
- GET `/api/statistics/user/:id` - Foydalanuvchi statistikasi
- GET `/api/statistics/user/:id/achievements` - Yutuqlar
- GET `/api/statistics/overall` - Umumiy statistika (Admin)

### Users
- GET `/api/users` - Barcha foydalanuvchilar (Admin)
- GET `/api/users/leaderboard/top` - Reyting jadvali
- DELETE `/api/users/:id` - Foydalanuvchini o'chirish (Admin)

## Loyiha Tuzilmasi

```
InfoTest/
├── backend/
│   ├── config/
│   │   └── database.js          # SQLite konfiguratsiyasi
│   ├── middleware/
│   │   └── auth.js              # JWT autentifikatsiya
│   ├── models/
│   │   ├── User.js              # Foydalanuvchi modeli
│   │   ├── Test.js              # Test modeli
│   │   └── Question.js          # Savol modeli
│   ├── routes/
│   │   ├── auth.js              # Autentifikatsiya marshrutlari
│   │   ├── users.js             # Foydalanuvchilar
│   │   ├── tests.js             # Testlar
│   │   ├── questions.js         # Savollar
│   │   ├── results.js           # Natijalar
│   │   ├── portfolio.js         # Portfolio
│   │   └── statistics.js        # Statistika
│   ├── scripts/
│   │   ├── initDatabase.js      # DB yaratish
│   │   └── seedData.js          # Demo ma'lumotlar
│   ├── server.js                # Express server
│   ├── .env                     # Muhit o'zgaruvchilari
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/css/
│   │   │   ├── index.css        # Global uslublar
│   │   │   └── App.css          # Komponent uslublari
│   │   ├── components/
│   │   │   ├── Navbar.js        # Navigatsiya
│   │   │   └── PrivateRoute.js  # Himoyalangan marshrutlar
│   │   ├── context/
│   │   │   └── AuthContext.js   # Autentifikatsiya holati
│   │   ├── pages/
│   │   │   ├── Login.js         # Kirish sahifasi
│   │   │   ├── Register.js      # Ro'yxatdan o'tish
│   │   │   ├── Dashboard.js     # Bosh sahifa
│   │   │   ├── Tests.js         # Testlar ro'yxati
│   │   │   ├── TestDetail.js    # Test tafsilotlari
│   │   │   ├── TakeTest.js      # Test topshirish
│   │   │   ├── Results.js       # Natijalar
│   │   │   ├── Portfolio.js     # Portfolio
│   │   │   ├── Profile.js       # Profil
│   │   │   └── Leaderboard.js   # Reyting
│   │   ├── services/
│   │   │   └── api.js           # API xizmatlar
│   │   ├── App.js               # Asosiy komponent
│   │   └── index.js             # Kirish nuqtasi
│   └── package.json
├── README.md
└── SETUP.md                     # Bu fayl
```

## Xususiyatlar

### Talaba uchun:
- ✅ Testlarni ko'rish va topshirish
- ✅ Vaqt hisoblagichi
- ✅ Avtomatik baholash
- ✅ Batafsil natijalar
- ✅ Portfolio yaratish
- ✅ Yutuqlarga erishish
- ✅ Ballar va daraja tizimi (5 daraja: Bronze, Silver, Gold, Platinum, Diamond)
- ✅ Reyting jadvali
- ✅ Profil boshqaruvi

### O'qituvchi uchun:
- ✅ Testlar yaratish va tahrirlash
- ✅ 6 turdagi savollar (bir tanlovli, ko'p tanlovli, to'g'ri/noto'g'ri, qisqa javob, kod yozish, moslashtirish)
- ✅ Testlarni nashr qilish/yashirish
- ✅ Talabalar natijalarini ko'rish
- ✅ Statistika va tahlil
- ✅ Test o'tish balini belgilash

### Administrator uchun:
- ✅ Barcha foydalanuvchilarni boshqarish
- ✅ Umumiy statistika
- ✅ Tizim nazorati

## Texnologiyalar

### Backend:
- Node.js + Express.js
- SQLite3
- JWT (JSON Web Tokens)
- bcryptjs (Parollarni shifrlash)

### Frontend:
- React 18
- React Router v6
- Axios
- Context API
- CSS3 (Custom design, responsive)

## Muammolarni Hal Qilish

### Backend ishlamasa:
1. `.env` faylini tekshiring
2. Port 5000 band emasligini tekshiring: `lsof -i :5000`
3. Ma'lumotlar bazasi yaratilganligini tekshiring: `ls infotest.db`
4. Loglarni ko'ring: `npm run dev`

### Frontend ishlamasa:
1. Backend ishlab turganligini tekshiring
2. `package.json` dagi proxy tekshiring
3. Browser console'ni tekshiring (F12)
4. `npm cache clean --force && npm install`

### CORS xatosi:
Backend `server.js` faylida CORS sozlamalari tekshiring

### Database xatosi:
```bash
rm infotest.db
npm run init-db
npm run seed
```

## Yangilanishlar

Kelajakda qo'shilishi rejalashtirilgan:
- Real-time test natijalar (Socket.io)
- File upload (Talabalar ish yuklashi)
- Grafik statistika (Charts.js)
- Email bildirishnomalar
- Testlarni eksport/import qilish
- Video darslar integratsiyasi
- Mobile ilova (React Native)

## Litsenziya

Bu loyiha o'quv maqsadlarida yaratilgan.

## Muallif

Informatika Kafedras 
Dissertatsiya loyihasi - 2026
