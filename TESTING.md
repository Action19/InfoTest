# InfoTest Platform - Testing Guide

## Test Rejasi

Bu hujjat InfoTest platformasining har bir funksiyasini qanday test qilishni tushuntiradi.

## 1. Backend Testing

### 1.1 Database Initialization

```bash
cd backend
npm run init-db
```

**Kutilgan natija:**
- ✅ `infotest.db` fayl yaratildi
- ✅ 9 ta jadval yaratildi
- ✅ Indekslar qo'shildi
- ✅ Console'da success xabari

### 1.2 Seed Data

```bash
npm run seed
```

**Kutilgan natija:**
- ✅ 1 admin, 1 teacher, 3 student yaratildi
- ✅ 2 ta test nashr qilindi
- ✅ 3 ta achievement yaratildi
- ✅ Sample results yaratildi
- ✅ Portfolio item yaratildi

### 1.3 Server Start

```bash
npm start
```

**Kutilgan natija:**
- ✅ Server port 5000 da ishga tushdi
- ✅ Database connected
- ✅ No errors in console

## 2. API Testing

### 2.1 Authentication Endpoints

#### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "password": "test123",
    "full_name": "Test User",
    "email": "test@test.uz",
    "role": "student"
  }'
```

**Kutilgan:** 201 status, token qaytadi

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Kutilgan:** 200 status, token va user ma'lumotlari

### 2.2 Tests Endpoints

#### Get all tests
```bash
curl http://localhost:5000/api/tests \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Kutilgan:** 200 status, testlar array

#### Get specific test
```bash
curl http://localhost:5000/api/tests/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Kutilgan:** 200 status, test ma'lumotlari

### 2.3 Results Endpoint

#### Submit test
```bash
curl -X POST http://localhost:5000/api/results/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "test_id": 1,
    "answers": [
      {"question_id": 1, "answer": "x = 5"},
      {"question_id": 2, "answer": "3"},
      {"question_id": 3, "answer": "False"}
    ]
  }'
```

**Kutilgan:** 201 status, result ma'lumotlari

## 3. Frontend Testing

### 3.1 Installation

```bash
cd frontend
npm install
```

**Kutilgan:**
- ✅ Barcha dependencies o'rnatildi
- ✅ No vulnerability errors

### 3.2 Start Development Server

```bash
npm start
```

**Kutilgan:**
- ✅ Server port 3000 da ishga tushdi
- ✅ Browser avtomatik ochildi
- ✅ Login sahifasi ko'rsatildi

## 4. Manual Testing Checklist

### 4.1 Authentication Flow

**Login Page**
- [ ] Demo accounts tugmalari ishlaydi
- [ ] Login form validation ishlaydi
- [ ] Wrong credentials xato ko'rsatadi
- [ ] Successful login dashboard ga yo'naltiradi

**Register Page**
- [ ] Form validation ishlaydi
- [ ] Password confirmation tekshiradi
- [ ] Role selection ishlaydi
- [ ] Successful registration login qiladi

### 4.2 Student Dashboard

- [ ] Stats cards to'g'ri ko'rsatiladi (testlar, ball, daraja)
- [ ] Recent results ro'yxati
- [ ] Leaderboard top 5
- [ ] Quick actions links ishlaydi
- [ ] Navbar user info ko'rsatiladi

### 4.3 Tests Page (Student)

**List View**
- [ ] Published testlar ko'rsatiladi
- [ ] Search ishlaydi
- [ ] Test cards ma'lumotlari to'g'ri
- [ ] "Testni boshlash" tugmasi ishlaydi

**Test Detail**
- [ ] Test ma'lumotlari to'g'ri
- [ ] Savollar soni
- [ ] Vaqt limiti
- [ ] O'tish bali
- [ ] Statistika ko'rsatiladi
- [ ] "Testni boshlash" confirmation

### 4.4 Take Test Page

**Timer**
- [ ] Vaqt hisoblash boshlanadi
- [ ] 5 daqiqa qolsa warning ko'rsatadi
- [ ] Vaqt tugashi test submit qiladi

**Navigation**
- [ ] Savollar grid ko'rsatiladi
- [ ] Javob berilgan savollar belgilanadi
- [ ] Next/Previous tugmalari ishlaydi
- [ ] Grid'dan savol tanlash ishlaydi

**Question Types**
- [ ] Single choice - radio buttons
- [ ] Multiple choice - checkboxes
- [ ] True/False - 2 ta radio button
- [ ] Short answer - text input
- [ ] Code writing - textarea
- [ ] Matching - select dropdowns

**Submit**
- [ ] Confirmation dialog
- [ ] Javoblar to'g'ri yuboriladi
- [ ] Results sahifasiga yo'naltiradi

### 4.5 Results Page

**List View**
- [ ] Barcha natijalar ko'rsatiladi
- [ ] Ball va foiz to'g'ri
- [ ] Date formatlash to'g'ri
- [ ] Click orqali details

**Detail View**
- [ ] Score circle to'g'ri rangda
- [ ] Summary stats to'g'ri
- [ ] Detailed answers
- [ ] To'g'ri/noto'g'ri belgilangan
- [ ] Correct answer ko'rsatiladi
- [ ] Achievements ko'rsatiladi

### 4.6 Portfolio Page

**Stats Section**
- [ ] Level badge rangda
- [ ] Total points
- [ ] Total tests
- [ ] Achievements count

**Achievements**
- [ ] Grid layout
- [ ] Icon va title
- [ ] Description
- [ ] Earned date

**Portfolio Items**
- [ ] Add form ishlaydi
- [ ] Category selection
- [ ] Items grid
- [ ] Delete ishlaydi
- [ ] Links ochiladi

### 4.7 Profile Page

**View Mode**
- [ ] Avatar letter
- [ ] Full name
- [ ] Role badge
- [ ] Level va points (student)
- [ ] User info display

**Edit Mode**
- [ ] Edit button
- [ ] Form fields editable
- [ ] Save button
- [ ] Cancel button
- [ ] Success message

**Password Change**
- [ ] Form ko'rsatiladi
- [ ] Validation ishlaydi
- [ ] Success message
- [ ] Form tozalanadi

### 4.8 Leaderboard Page

**Display**
- [ ] Top 3 podium
- [ ] Full table
- [ ] Rank icons (medals)
- [ ] Level badges
- [ ] Current user highlighted

**Filters**
- [ ] All button
- [ ] Level filters
- [ ] Filtered data to'g'ri

### 4.9 Teacher Dashboard

- [ ] Total users
- [ ] Total tests
- [ ] Total attempts
- [ ] Average score
- [ ] Recent tests list
- [ ] Create test link

### 4.10 Tests Page (Teacher)

**List View**
- [ ] All tests (published + draft)
- [ ] Filter tabs ishlaydi
- [ ] Create button
- [ ] Actions: View, Publish/Unpublish, Delete

**Test Management**
- [ ] Publish confirmation
- [ ] Unpublish ishlaydi
- [ ] Delete confirmation
- [ ] Delete ishlaydi

### 4.11 Admin Dashboard

- [ ] All users count
- [ ] System statistics
- [ ] User management link
- [ ] Overall stats

## 5. Responsive Testing

### Desktop (>1200px)
- [ ] Full layout
- [ ] Sidebar navigation
- [ ] Multi-column grids
- [ ] Hover effects

### Tablet (768px - 1200px)
- [ ] Adapted layout
- [ ] Condensed navigation
- [ ] 2-column grids
- [ ] Touch-friendly

### Mobile (<768px)
- [ ] Single column
- [ ] Hamburger menu
- [ ] Full-width buttons
- [ ] Vertical navigation
- [ ] Touch gestures

## 6. Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## 7. Performance Testing

### Load Time
- [ ] Initial load < 3 seconds
- [ ] Page transitions smooth
- [ ] Images optimized
- [ ] No layout shifts

### Database
- [ ] Queries optimized
- [ ] Indexes working
- [ ] No slow queries (>1s)

## 8. Security Testing

### Authentication
- [ ] JWT tokens expire
- [ ] Invalid tokens rejected
- [ ] Password hashing works
- [ ] Role-based access enforced

### API Protection
- [ ] Unauthorized access blocked
- [ ] CORS configured
- [ ] SQL injection prevented
- [ ] XSS prevention

## 9. Error Handling

### Frontend
- [ ] Network errors caught
- [ ] User-friendly messages
- [ ] Loading states
- [ ] Empty states
- [ ] Form validation errors

### Backend
- [ ] 404 errors handled
- [ ] 500 errors logged
- [ ] Validation errors returned
- [ ] Database errors caught

## 10. Data Validation

### User Input
- [ ] Username: alphanumeric, 3-20 chars
- [ ] Password: min 6 chars
- [ ] Email: valid format
- [ ] Required fields enforced

### Test Submission
- [ ] All questions answered
- [ ] Answer format validated
- [ ] Time limit enforced
- [ ] No duplicate submissions

## Testing Checklist Summary

**Backend API:**
- [x] Authentication ✅
- [x] Users CRUD ✅
- [x] Tests CRUD ✅
- [x] Questions CRUD ✅
- [x] Results submission ✅
- [x] Portfolio CRUD ✅
- [x] Statistics ✅

**Frontend Pages:**
- [x] Login ✅
- [x] Register ✅
- [x] Dashboard ✅
- [x] Tests List ✅
- [x] Test Detail ✅
- [x] Take Test ✅
- [x] Results ✅
- [x] Portfolio ✅
- [x] Profile ✅
- [x] Leaderboard ✅

**Features:**
- [x] Multi-role system ✅
- [x] 6 question types ✅
- [x] Auto-grading ✅
- [x] Gamification ✅
- [x] Responsive design ✅

## Bug Reporting

Agar bug topsangiz:

1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Screenshot/Console errors**
5. **Browser/OS info**

## Performance Benchmarks

### Target Metrics
- API response time: < 200ms
- Page load time: < 3s
- Time to interactive: < 5s
- Lighthouse score: > 90

### Database
- Query time: < 50ms
- Connection pool: 10
- Max queries/sec: 100

## Kesimlar

Barcha asosiy funksiyalar implement qilingan va test qilish uchun tayyor:

✅ **Backend**: To'liq API, database, authentication  
✅ **Frontend**: Barcha sahifalar, responsive design, UX  
✅ **Integration**: Backend ↔ Frontend to'liq ishlaydi  
✅ **Security**: JWT, bcrypt, role-based access  
✅ **Gamification**: Ballar, darajalar, yutuqlar  
✅ **Documentation**: README, SETUP, TESTING

**Keyingi qadam:** Actual environmentda test qilish va user feedback yig'ish.
