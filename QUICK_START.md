# ⚡ InfoTest - Tez Boshlash

5 daqiqada platformani ishga tushiring!

## 🎯 3 ta oddiy qadam

### 1️⃣ Backend (2 daqiqa)

```bash
cd backend
npm install
npm run init-db
npm run seed
npm run dev
```

✅ Backend tayyor: http://localhost:5000

### 2️⃣ Frontend (2 daqiqa)

**Yangi terminal oyna ochib:**

```bash
cd frontend
npm install
npm start
```

✅ Frontend tayyor: http://localhost:3000

### 3️⃣ Kirish (1 daqiqa)

Browser avtomatik ochiladi. Login qiling:

**O'quvchi:**
- Username: `akmal_yusupov`
- Parol: `student123`

**O'qituvchi:**
- Username: `o_qituvchi`
- Parol: `teacher123`

## 🎉 Tayyor!

Platformadan foydalanishingiz mumkin!

---

## 🔧 Muammo bo'lsa?

### Backend ishlamayapti?
```bash
cd backend
rm -rf node_modules
npm install
```

### Frontend ishlamayapti?
```bash
cd frontend
rm -rf node_modules
npm install
```

### Port band?
Backend `.env` faylida:
```
PORT=5001
```

Frontend `package.json` da:
```json
"start": "PORT=3001 react-scripts start"
```

---

📖 **Batafsil:** [SETUP.md](./SETUP.md)  
📁 **Struktura:** [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)  
📚 **README:** [README.md](./README.md)

**InfoTest © 2024**
