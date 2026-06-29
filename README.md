# InfoTest Platform - Ta'limda Baholash Tizimi

## Loyiha Haqida

InfoTest - bu axborot texnologiyalari asosida o'quvchilar bilimini baholash uchun zamonaviy platforma. Dissertatsiya tadqiqoti asosida ishlab chiqilgan.

## Texnologiyalar

- **Frontend**: React.js 18
- **Backend**: Express.js (Node.js)
- **Database**: SQLite3
- **Authentication**: JWT

## Xususiyatlar

### O'quvchilar uchun:
- 📝 Turli turdagi testlarni topshirish
- 📊 Natijalarni real-vaqtda ko'rish
- 📁 Elektron portfolio
- 🏆 Gamifikatsiya (ball, daraja, mukofotlar)
- 📈 O'z rivojlanishini kuzatish

### O'qituvchilar uchun:
- ✍️ Test va savollar yaratish
- 👥 O'quvchilar natijalarini kuzatish
- 📊 Statistika va tahlil
- 📝 Avtomatik tekshirish

### Administratorlar uchun:
- 👥 Foydalanuvchilarni boshqarish
- 📊 Tizim statistikasi
- ⚙️ Sozlamalar

## Demo Hisoblar

- **Admin**: `admin` / `admin123`
- **O'qituvchi**: `o_qituvchi` / `teacher123`
- **O'quvchi**: `akmal_yusupov` / `student123`

## O'rnatish

### 1. Backend

```bash
cd backend
npm install
npm run init-db    # Ma'lumotlar bazasini yaratish
npm run seed       # Demo ma'lumotlar qo'shish
npm start          # Serverni ishga tushirish (port 5000)
```

### 2. Frontend

```bash
cd frontend
npm install
npm start          # React ilovasini ishga tushirish (port 3000)
```

### 3. Brauzerda ochish

```
http://localhost:3000
```

## Loyiha Tuzilmasi

```
InfoTest/
├── backend/
│   ├── server.js              # Asosiy server fayli
│   ├── config/
│   │   └── database.js        # SQLite konfiguratsiyasi
│   ├── models/                # Ma'lumotlar modellari
│   ├── routes/                # API marshrutlar
│   ├── middleware/            # Auth va boshqa middleware
│   └── scripts/               # Database init va seed
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/        # React komponentlar
│       ├── pages/             # Sahifalar
│       ├── context/           # State management
│       ├── services/          # API xizmatlari
│       └── assets/            # CSS va rasmlar
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Ro'yxatdan o'tish
- `POST /api/auth/login` - Kirish

### Tests
- `GET /api/tests` - Testlar ro'yxati
- `GET /api/tests/:id` - Test tafsilotlari
- `POST /api/tests` - Yangi test yaratish (o'qituvchi)
- `PUT /api/tests/:id` - Testni tahrirlash
- `DELETE /api/tests/:id` - Testni o'chirish

### Questions
- `GET /api/questions/test/:testId` - Test savollari
- `POST /api/questions` - Savol qo'shish
- `PUT /api/questions/:id` - Savolni tahrirlash
- `DELETE /api/questions/:id` - Savolni o'chirish

### Results
- `POST /api/results/submit` - Test natijasini yuborish
- `GET /api/results/user/:userId` - Foydalanuvchi natijalari
- `GET /api/results/test/:testId` - Test statistikasi

### Portfolio
- `GET /api/portfolio/:userId` - Portfolio ko'rish
- `POST /api/portfolio` - Portfolio element qo'shish

### Statistics
- `GET /api/statistics/user/:userId` - Foydalanuvchi statistikasi
- `GET /api/statistics/leaderboard` - Liderlik jadvali

## Litsenziya

MIT License

## Muallif

Dissertatsiya tadqiqoti asosida ishlab chiqilgan
O'zbekiston - 2024
