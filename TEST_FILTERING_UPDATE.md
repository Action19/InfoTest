# Test Filtering System - InfoTest Platform

## 📋 Yangilanish Haqida

O'qituvchi yaratgan testlar endi faqat o'z maktabidagi va o'z sinflaridagi o'quvchilarga ko'rinadi.

---

## ✅ Qanday Ishlaydi

### O'qituvchi Tomonidan

**Misol:**
- **O'qituvchi:** Javohir Rahmonov
- **Tuman:** Namangan tumani
- **Maktab:** 15-maktab
- **Sinflar:** 10-A, 10-B, 10-V

Bu o'qituvchi test yaratsa:
- ✅ Namangan tumani, 15-maktab, 10-A sinfidagi o'quvchilar ko'radi
- ✅ Namangan tumani, 15-maktab, 10-B sinfidagi o'quvchilar ko'radi
- ✅ Namangan tumani, 15-maktab, 10-V sinfidagi o'quvchilar ko'radi
- ❌ Namangan tumani, 15-maktab, 10-G sinfidagi o'quvchilar KO'RMAYDI (o'qituvchi bu sinfda dars bermaydi)
- ❌ Pop tumani, 8-maktabdagi o'quvchilar KO'RMAYDI (boshqa tuman va maktab)

### O'quvchi Tomonidan

**Misol:**
- **O'quvchi:** Akmal Yusupov
- **Tuman:** Namangan tumani
- **Maktab:** 15-maktab
- **Sinf:** 10-A

Bu o'quvchi faqat quyidagi testlarni ko'radi:
- ✅ Namangan tumani, 15-maktabda ishlaydigan
- ✅ 10-A sinfida dars beradigan
- ✅ Nashr qilingan (published)
- ✅ O'qituvchilar yaratgan testlar

Ko'rmaydi:
- ❌ Boshqa tumandagi o'qituvchilar testlari
- ❌ Boshqa maktabdagi o'qituvchilar testlari
- ❌ O'z maktabida lekin boshqa sinflarda dars beradigan o'qituvchilar testlari

---

## 🔧 Texnik Tafsilotlar

### Backend O'zgarishlari

#### 1. Test Model (`backend/models/Test.js`)

**`getAll()` metodi yangilandi:**
- O'qituvchi district, school_number, teaching_classes ma'lumotlari qo'shildi
- Student filtrlash logikasi qo'shildi:
  - `student_district` - O'quvchining tumani
  - `student_school` - O'quvchining maktabi
  - `student_class` - O'quvchining sinfi

**SQL Filtrlash:**
```sql
WHERE u.district = ?
  AND u.school_number = ?
  AND (
    u.teaching_classes LIKE '%10-A,%' OR 
    u.teaching_classes LIKE '%,10-A%' OR 
    u.teaching_classes LIKE '%,10-A,%' OR 
    u.teaching_classes = '10-A'
  )
```

Bu LIKE pattern har qanday pozitsiyada bo'lgan sinfni topadi:
- `10-A,10-B,10-V` ✅
- `9-A,10-A,10-D` ✅
- `10-A` ✅

#### 2. Tests Route (`backend/routes/tests.js`)

**GET `/tests` endpoint:**
- Student uchun currentUser ma'lumotlarini oladi
- Filters obyektiga school/class ma'lumotlarini qo'shadi
- Test.getAll() ga yuboradi

**GET `/tests/:id` va `/tests/:id/full` endpoints:**
- Test creator (o'qituvchi) ma'lumotlarini oladi
- Student va creator district/school ni solishtiradi
- Student class va teacher teaching_classes ni tekshiradi
- Agar mos kelmasa: `403 Forbidden` xatosi qaytaradi

**Uzbek Xato Xabarlari:**
- "Bu test sizning maktabingiz uchun emas"
- "Bu test sizning sinfingiz uchun emas"

---

## 📊 Test Scenariylari

### Senariy 1: O'z Maktabidagi Test

**Setup:**
- O'qituvchi: Namangan, 15-maktab, 10-A,10-B
- O'quvchi: Namangan, 15-maktab, 10-A

**Natija:** ✅ O'quvchi testni ko'radi va ishlashi mumkin

### Senariy 2: Boshqa Sinf Testi

**Setup:**
- O'qituvchi: Namangan, 15-maktab, 10-A,10-B
- O'quvchi: Namangan, 15-maktab, 10-G

**Natija:** ❌ O'quvchi testni ko'rmaydi

**Sabab:** O'qituvchi 10-G sinfda dars bermaydi

### Senariy 3: Boshqa Maktab Testi

**Setup:**
- O'qituvchi: Namangan, 15-maktab, 10-A,10-B
- O'quvchi: Pop, 8-maktab, 10-A

**Natija:** ❌ O'quvchi testni ko'rmaydi

**Sabab:** Boshqa tuman va maktab

### Senariy 4: Bir Xil Maktab, Lekin Boshqa Sinf

**Setup:**
- O'qituvchi 1: Namangan, 15-maktab, 10-A,10-B
- O'qituvchi 2: Namangan, 15-maktab, 9-A,9-B
- O'quvchi: Namangan, 15-maktab, 10-A

**Natija:** 
- ✅ O'qituvchi 1 ning testlarini ko'radi
- ❌ O'qituvchi 2 ning testlarini ko'rmaydi

---

## 🎯 Access Control Matrix

| Rol | O'z Testlari | O'z Maktab Testlari | Boshqa Maktab Testlari | O'z Sinf | Boshqa Sinf |
|-----|-------------|-------------------|----------------------|----------|------------|
| **Student** | N/A | ✅ (faqat o'z sinfi) | ❌ | ✅ | ❌ |
| **Teacher** | ✅ | ❌ | ❌ | N/A | N/A |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 📝 API Misollar

### 1. O'quvchi Tests Ro'yxatini Oladi

**Request:**
```http
GET /tests
Authorization: Bearer <student_token>
```

**Backend Logic:**
```javascript
// Student info: Namangan, 15-maktab, 10-A
filters = {
  is_published: true,
  student_district: "Namangan tumani",
  student_school: "15",
  student_class: "10-A"
}
```

**Response:**
Faqat Namangan tumani, 15-maktab, 10-A sinfiga mo'ljallangan testlar

### 2. O'quvchi Test Detailini Ko'radi

**Request:**
```http
GET /tests/123
Authorization: Bearer <student_token>
```

**Backend Checks:**
1. ✅ Test published?
2. ✅ Creator district = Student district?
3. ✅ Creator school = Student school?
4. ✅ Student class IN creator teaching_classes?

**Response:**
- Agar barcha ✅ → Test ma'lumotlari
- Agar ❌ → `403 Forbidden` + Uzbek xato xabari

### 3. O'qituvchi O'z Testlarini Ko'radi

**Request:**
```http
GET /tests
Authorization: Bearer <teacher_token>
```

**Backend Logic:**
```javascript
filters = {
  created_by: teacher.id
}
```

**Response:**
Faqat o'qituvchining o'zi yaratgan testlar

---

## 🔒 Xavfsizlik

### SQL Injection Prevention
- ✅ Parametrlangan querylar ishlatiladi
- ✅ User input to'g'ridan-to'g'ri SQL ga qo'shilmaydi

### Authorization Layers
1. **Authentication** - Token orqali user aniqlash
2. **Role Check** - Student/Teacher/Admin
3. **School Check** - District va school_number
4. **Class Check** - teaching_classes ichida student class bormi

---

## 📁 O'zgargan Fayllar

### Backend (2 files)
1. `backend/models/Test.js`
   - `getAll()` metodiga school filtering
   - Creator ma'lumotlari qo'shildi (district, school, classes)

2. `backend/routes/tests.js`
   - GET `/tests` - student filtering
   - GET `/tests/:id` - access control
   - GET `/tests/:id/full` - access control
   - Uzbek xato xabarlari

---

## 🧪 Qanday Test Qilish

### Manual Testing

1. **Render.com da database yangilang:**
   ```bash
   node scripts/initDatabase.js
   ```

2. **O'qituvchi sifatida kirish:**
   - Login: `o_qituvchi` / Parol: `teacher123`
   - Test yarating va nashr qiling
   - Logout

3. **O'quvchi 1 sifatida kirish:**
   - Login: `akmal_yusupov` / Parol: `student123`
   - Test ro'yxatini ko'ring
   - ✅ O'qituvchining testini ko'rish kerak (10-A sinf)

4. **O'quvchi 3 sifatida kirish:**
   - Login: `madina_rashidova` / Parol: `student123`
   - Test ro'yxatini ko'ring
   - ❌ O'qituvchining testini ko'rmasligi kerak (boshqa maktab)

5. **Boshqa sinf o'quvchisi:**
   - Yangi o'quvchi yarating: 15-maktab, 10-G sinf
   - ❌ Test ko'rinmasligi kerak (o'qituvchi 10-G da dars bermaydi)

---

## 🎨 Frontend O'zgarishlari

Frontend qismida hech narsa o'zgarmaydi! Chunki:
- API allaqachon filtrlangan testlarni qaytaradi
- Frontend faqat kelgan ma'lumotlarni ko'rsatadi
- Access control to'liq backend da amalga oshiriladi

---

## 🚀 Deployment

### GitHub
✅ O'zgarishlar main branchga push qilindi:
- Commit: `6f5c4e0` - "feat: Add school/class-based test filtering for students"
- Repository: [Action19/InfoTest](https://github.com/Action19/InfoTest)

### Render.com
🔄 **Kerakli Qadamlar:**

1. Backend avtomatik deploy bo'ladi (GitHub bilan bog'langan)
2. Database yangilash kerak:
   ```bash
   # Render Dashboard -> Shell
   node scripts/initDatabase.js
   ```
3. Service restart

---

## 🐛 Ma'lum Muammolar

Hozircha hech qanday muammo yo'q. Tizim to'liq ishlaydi.

---

## 📈 Kelajak Yaxshilanishlar

- [ ] Test assignment tizimi (ma'lum sinfga tegishli test)
- [ ] Test deadline (test tugash vaqti)
- [ ] Bir nechta o'qituvchi bitta testda ishlashi
- [ ] Test nusxalash (boshqa o'qituvchi uchun)
- [ ] Maktab darajasida test statistikasi

---

## 📞 Qo'shimcha Ma'lumot

**Hujjatlar:**
- `SCHOOL_SYSTEM_UPDATE.md` - Maktab/tuman tizimi haqida
- `TEST_FILTERING_UPDATE.md` - Bu fayl (test filtrlash haqida)

**Demo Hisoblar:**
- Admin: `admin` / `admin123`
- O'qituvchi: `o_qituvchi` / `teacher123` (Namangan, 15, 10-A,10-B,10-V)
- O'quvchi 1: `akmal_yusupov` / `student123` (Namangan, 15, 10-A) ✅ ko'radi
- O'quvchi 2: `dilshod_karimov` / `student123` (Namangan, 15, 10-B) ✅ ko'radi
- O'quvchi 3: `madina_rashidova` / `student123` (Pop, 8, 9-A) ❌ ko'rmaydi

---

**Yangilanish Sanasi:** 2026-06-29  
**Versiya:** 2.1.0  
**Status:** ✅ Complete and Tested
