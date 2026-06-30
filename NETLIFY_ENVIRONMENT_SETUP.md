# 🚀 Netlify Environment Variable Sozlash

## ❗ MUHIM: Bu qadamlarni NETLIFY DASHBOARD da bajarish kerak!

---

## 📋 Qadamlar

### 1️⃣ Netlify ga kiring

**URL:** https://app.netlify.com

**Login qiling** (agar kirilmagan bo'lsa)

---

### 2️⃣ Site ni toping

**Site nomi:** `info-test-web-sandbox`

Yoki URL orqali: https://app.netlify.com/sites/info-test-web-sandbox

---

### 3️⃣ Site Settings ga kiring

1. Ochilgan sahifada **Site settings** tugmasini bosing (o'ng yuqori burchakda)
   
   YOKI
   
2. To'g'ridan-to'g'ri URL orqali: 
   ```
   https://app.netlify.com/sites/info-test-web-sandbox/configuration/env
   ```

---

### 4️⃣ Environment Variables ga o'ting

Chap sidebar da quyidagi bo'limlarni ko'rasiz:
- General
- Domain management
- Build & deploy
- **Environment variables** ← SHU YERNI BOSING

---

### 5️⃣ Variable qo'shing

**"Add a variable" tugmasini bosing**

Ko'rinadigan formada quyidagilarni kiriting:

```
┌─────────────────────────────────────────────┐
│ Key                                         │
│ ┌─────────────────────────────────────────┐ │
│ │ REACT_APP_API_URL                       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Value                                       │
│ ┌─────────────────────────────────────────┐ │
│ │ https://infotest-7476.onrender.com/api  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Scopes:                                     │
│ [x] All                                     │
│                                             │
│ [Create variable]                           │
└─────────────────────────────────────────────┘
```

**To'g'ri yozing:**
- **Key:** `REACT_APP_API_URL` (katta-kichik harf muhim!)
- **Value:** `https://infotest-7476.onrender.com/api` (https:// bilan!)

**"Create variable" tugmasini bosing**

---

### 6️⃣ Deploy qiling

Variable yaratgandan keyin:

1. Yuqoridagi menuda **"Deploys"** tab ga o'ting
2. **"Trigger deploy"** tugmasini bosing (o'ng yuqori burchakda)
3. **"Clear cache and deploy site"** ni tanlang

**Kuting:** 2-3 daqiqa

---

### 7️⃣ Test qiling

Deploy tugagandan keyin:

1. Ochiq: https://info-test-web-sandbox.netlify.app/register
2. **Login** qismiga yozing: `test123`
3. **Ko'rishingiz kerak:** 
   - Input borderi **yashil** bo'ladi
   - Ostida paydo bo'ladi: **"✅ Bu login bo'sh"** (yashil rangda)

4. **Login** qismiga yozing: `admin`
5. **Ko'rishingiz kerak:**
   - Input borderi **qizil** bo'ladi
   - Ostida paydo bo'ladi: **"❌ Bu login band"** (qizil rangda)

---

## 🔍 Tekshirish

### Browser Console da tekshiring

1. **Saytni ochiq:** https://info-test-web-sandbox.netlify.app/register
2. **F12** bosing (Developer Tools)
3. **Console** tab ga o'ting
4. Login qismiga biror narsa yozing
5. **Ko'rishingiz kerak:**

```
🔍 Checking username: test123
✅ Username check response: {available: true, message: "✅ Bu login bo'sh"}
```

**Agar ko'rmasangiz:**
- ❌ Network error
- ❌ 400 Bad Request
- ❌ Server bilan aloqa yo'q

**SABAB:** Environment variable to'g'ri sozlanmagan!

---

## 📸 Qanday ko'rinadi

### Netlify Dashboard

```
┌───────────────────────────────────────────────────┐
│ info-test-web-sandbox                    Settings │
├───────────────────────────────────────────────────┤
│                                                   │
│ Site settings                                     │
│   ├─ General                                      │
│   ├─ Domain management                            │
│   ├─ Build & deploy                               │
│   └─ Environment variables ← BOSING               │
│                                                   │
│ Environment variables                             │
│                                                   │
│ [Add a variable]                                  │
│                                                   │
│ REACT_APP_API_URL                                 │
│ https://infotest-7476.onrender.com/api            │
│ Scopes: All                                       │
│ [Edit] [Delete]                                   │
│                                                   │
└───────────────────────────────────────────────────┘
```

### Register sahifasi (to'g'ri ishlasa)

```
┌─────────────────────────────────────────┐
│  Ro'yxatdan o'tish                      │
│                                         │
│  Login *                                │
│  ┌───────────────────────────────────┐  │
│  │ test123                          │  │ <- Yashil border
│  └───────────────────────────────────┘  │
│  ✅ Bu login bo'sh                      │ <- Yashil message
│                                         │
│  Email *                                │
│  ┌───────────────────────────────────┐  │
│  │ newuser@test.com                 │  │ <- Yashil border
│  └───────────────────────────────────┘  │
│  ✅ Bu pochta bo'sh                     │ <- Yashil message
│                                         │
│  [Ro'yxatdan o'tish]                    │ <- Enabled
│                                         │
└─────────────────────────────────────────┘
```

---

## ❓ Savol-Javob

### S: Nima uchun .env.production ishlamayapti?

**J:** Netlify `.env.production` faylini o'qimaydi. U faqat Netlify Dashboard dagi environment variables ni ishlatadi.

### S: Variable qo'shganimdan keyin nima qilish kerak?

**J:** Deploy qilish kerak: **Deploys → Trigger deploy → Clear cache and deploy site**

### S: Qancha vaqt kutish kerak?

**J:** 2-3 daqiqa. Netlify build qilib, deploy qiladi.

### S: Test qilganimda hali ham ishlamasa?

**J:** 
1. Environment variable to'g'ri yozilganini tekshiring (katta-kichik harf!)
2. Value da `https://` borligini tekshiring
3. Browser cache ni tozalang (Ctrl + Shift + Delete)
4. Hard refresh qiling (Ctrl + Shift + R)

### S: Console da qanday xato ko'rsatiladi?

**J:** Agar environment variable yo'q bo'lsa:
```
POST http://localhost:5000/api/auth/check-username
net::ERR_CONNECTION_REFUSED
```

Agar to'g'ri sozlangan bo'lsa:
```
POST https://infotest-7476.onrender.com/api/auth/check-username
✅ 200 OK
```

---

## 🎯 Maqsad

**Oxirgi natija:**

✅ Foydalanuvchi login yozadi → Darhol tekshiriladi → "Bo'sh" yoki "Band" message ko'rinadi  
✅ Foydalanuvchi email yozadi → Darhol tekshiriladi → "Bo'sh" yoki "Ro'yxatdan o'tgan" message ko'rinadi  
✅ Agar login/email band bo'lsa → Submit button disabled  
✅ Agar login/email bo'sh bo'lsa → Submit button enabled  

---

## 📞 Yordam

Agar hali ham ishlamasa:

1. **Screenshot oling** Netlify Environment Variables sahifasidan
2. **Console log** ko'rsating (F12 → Console)
3. **Network tab** tekshiring (F12 → Network → check-username request)

Men yordam beraman! ✅

---

**Created:** June 30, 2026  
**Author:** Kiro AI  
**Status:** ⏳ Waiting for user to configure Netlify  
**Priority:** 🚨 CRITICAL
