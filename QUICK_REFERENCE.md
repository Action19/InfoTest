# InfoTest - Tezkor Ma'lumotnoma

## 🚀 Tezkor Ishga Tushirish

```bash
# Backend
cd backend
npm install
npm run init-db && npm run seed
npm start        # Port: 5000

# Frontend (yangi terminal)
cd frontend
npm install
npm start        # Port: 3000
```

**Yoki bitta buyruq:**
```bash
./start.sh
```

---

## 👥 Demo Hisoblar

| Rol | Login | Parol | Imkoniyatlar |
|-----|-------|-------|--------------|
| 🔧 **Admin** | `admin` | `admin123` | Hammasi |
| 👨‍🏫 **Teacher** | `o_qituvchi` | `teacher123` | Test boshqaruv |
| 👨‍🎓 **Student** | `akmal_yusupov` | `student123` | Test topshirish |

---

## 🔌 API Cheat Sheet

### Auth
```bash
POST /api/auth/register    # Ro'yxat
POST /api/auth/login       # Kirish
GET  /api/auth/me          # Profil
```

### Tests
```bash
GET    /api/tests          # Ro'yxat
GET    /api/tests/:id      # Bitta
POST   /api/tests          # Yaratish
PUT    /api/tests/:id      # O'zgartirish
DELETE /api/tests/:id      # O'chirish
```

### Results
```bash
POST /api/results/submit      # Topshirish
GET  /api/results/my-results  # Natijalar
```

---

## 📁 Muhim Fayllar

| Fayl | Maqsad |
|------|--------|
| `backend/server.js` | Backend kirish |
| `backend/.env` | Konfiguratsiya |
| `backend/config/database.js` | Database |
| `frontend/src/App.js` | Frontend kirish |
| `frontend/src/services/api.js` | API client |

---

## 🗄️ Database Buyruqlari

```bash
# Initialize
npm run init-db

# Seed demo data
npm run seed

# Reset database
rm infotest.db && npm run init-db && npm run seed
```

---

## 🎮 Daraja Tizimi

| Daraja | Nomi | Ball | Emoji |
|--------|------|------|-------|
| 1 | Bronze | 0-99 | 🥉 |
| 2 | Silver | 100-249 | 🥈 |
| 3 | Gold | 250-499 | 🥇 |
| 4 | Platinum | 500-999 | 💎 |
| 5 | Diamond | 1000+ | 💠 |

---

## 📝 Savol Turlari

1. `single_choice` - Bitta to'g'ri ✅
2. `multiple_choice` - Ko'p to'g'ri ☑️
3. `true_false` - Ha/Yo'q ✓/✗
4. `short_answer` - Qisqa matn 📝
5. `code_writing` - Kod yozish 💻
6. `matching` - Moslashtirish 🔗

---

## 🐛 Tezkor Tuzatish

### Backend ishlamasa
```bash
lsof -i :5000          # Port tekshirish
rm infotest.db         # Database reset
npm run init-db
```

### Frontend ishlamasa
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### CORS xatosi
Backend `server.js`:
```javascript
cors({
  origin: 'http://localhost:3000',
  credentials: true
})
```

---

## 📊 Loyiha Statistika

- **Files:** 43+
- **Code:** 8,000+ lines
- **API:** 35+ endpoints
- **Pages:** 10 React pages
- **Tables:** 9 database tables

---

## 🔐 JWT Token

**Header:**
```javascript
{
  Authorization: 'Bearer YOUR_JWT_TOKEN'
}
```

**Storage:** localStorage.getItem('token')

---

## 📱 Responsive Breakpoints

- **Desktop:** 1200px+
- **Tablet:** 768px - 1200px
- **Mobile:** < 768px

---

## 🎨 CSS Variables

```css
--primary-color: #4F46E5
--success-color: #10B981
--danger-color: #EF4444
--warning-color: #F59E0B
```

---

## ⚡ npm Scripts

### Backend
```bash
npm start              # Production
npm run dev            # Development
npm run init-db        # DB yaratish
npm run seed           # Demo data
```

### Frontend
```bash
npm start              # Development
npm run build          # Production build
npm test               # Tests
```

---

## 🔄 Git Commands

```bash
git status
git add .
git commit -m "message"
git push origin main
```

---

## 📞 Port Reference

| Service | Port | URL |
|---------|------|-----|
| Backend | 5000 | http://localhost:5000 |
| Frontend | 3000 | http://localhost:3000 |
| Database | - | infotest.db |

---

## 🎯 Testing Quick Commands

```bash
# Login test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get tests
curl http://localhost:5000/api/tests \
  -H "Authorization: Bearer TOKEN"
```

---

## 📚 Hujjatlar

- 📖 [README.md](README.md) - Asosiy
- ⚙️ [SETUP.md](SETUP.md) - O'rnatish
- ✅ [TESTING.md](TESTING.md) - Testing
- 📊 [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Xulosa

---

## 💡 Pro Tips

1. **Always read files before editing**
2. **Use demo accounts for testing**
3. **Check console for errors (F12)**
4. **Database reset if corrupted**
5. **Clear browser cache if styling issues**

---

## 🆘 Yordam Kerakmi?

1. Hujjatlarni o'qing
2. Console'ni tekshiring
3. Database'ni reset qiling
4. Cache'ni tozalang
5. Dependencies'ni qayta o'rnating

---

**Omad! 🚀**

*InfoTest Platform - 2026*
