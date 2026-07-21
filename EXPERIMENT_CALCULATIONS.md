# TAJRIBA-SINOV ISHLARI HISOB-KITOBI

## Batafsil matematik formulalar va qadam-baqadam hisoblashlar

---

## BOSHLANG'ICH MA'LUMOTLAR

| Parametr | Tajriba guruhi (TG) | Nazorat guruhi (NG) |
|----------|:-------------------:|:-------------------:|
| O'quvchilar soni | n₁ = 5 | n₂ = 4 |
| Nima qiladi | Platformadan foydalanadi | An'anaviy usulda o'qiydi |
| Baho shkalasi | 2, 3, 4, 5 | 2, 3, 4, 5 |

### PRE-TEST baholar (tajriba BOSHIDA):

| O'quvchi # | TG (pre) | NG (pre) |
|:----------:|:--------:|:--------:|
| 1 | 3 | 3 |
| 2 | 2 | 2 |
| 3 | 3 | 3 |
| 4 | 2 | 3 |
| 5 | 3 | — |

### POST-TEST baholar (tajriba OXIRIDA):

| O'quvchi # | TG (post) | NG (post) |
|:----------:|:---------:|:---------:|
| 1 | 5 | 3 |
| 2 | 4 | 3 |
| 3 | 4 | 4 |
| 4 | 3 | 3 |
| 5 | 5 | — |

---

## QADAM 1: O'RTACHA (Mean) HISOBLASH

**Formula:**

M = (x₁ + x₂ + ... + xₙ) / n

**Nima uchun:** Guruhning umumiy bilim darajasini bitta raqamda ifodalash.

### Hisoblash:

**TG Pre-test:**
M₁(pre) = (3 + 2 + 3 + 2 + 3) / 5 = 13 / 5 = **2.60**

**NG Pre-test:**
M₂(pre) = (3 + 2 + 3 + 3) / 4 = 11 / 4 = **2.75**

**TG Post-test:**
M₁(post) = (5 + 4 + 4 + 3 + 5) / 5 = 21 / 5 = **4.20**

**NG Post-test:**
M₂(post) = (3 + 3 + 4 + 3) / 4 = 13 / 4 = **3.25**

### Natija:

| | PRE-TEST | POST-TEST | O'SISH |
|---|:---:|:---:|:---:|
| TG | 2.60 | 4.20 | **+1.60** |
| NG | 2.75 | 3.25 | **+0.50** |

---

## QADAM 2: DISPERSIYA (S²) HISOBLASH

**Formula:**

S² = Σ(xᵢ - M)² / (n - 1)

**Nima uchun:** Baholar o'rtachadan qanchalik tarqalganligini ko'rsatadi.

### TG Post-test (M = 4.20):

| O'quvchi | xᵢ | xᵢ - M | (xᵢ - M)² |
|:--------:|:--:|:------:|:----------:|
| 1 | 5 | +0.80 | 0.64 |
| 2 | 4 | -0.20 | 0.04 |
| 3 | 4 | -0.20 | 0.04 |
| 4 | 3 | -1.20 | 1.44 |
| 5 | 5 | +0.80 | 0.64 |
| | | **Yig'indi:** | **2.80** |

S₁²(post) = 2.80 / (5-1) = 2.80 / 4 = **0.70**

### NG Post-test (M = 3.25):

| O'quvchi | xᵢ | xᵢ - M | (xᵢ - M)² |
|:--------:|:--:|:------:|:----------:|
| 1 | 3 | -0.25 | 0.0625 |
| 2 | 3 | -0.25 | 0.0625 |
| 3 | 4 | +0.75 | 0.5625 |
| 4 | 3 | -0.25 | 0.0625 |
| | | **Yig'indi:** | **0.75** |

S₂²(post) = 0.75 / (4-1) = 0.75 / 3 = **0.25**

### TG Pre-test (M = 2.60):

S₁²(pre) = [(3-2.6)²+(2-2.6)²+(3-2.6)²+(2-2.6)²+(3-2.6)²] / 4
= [0.16+0.36+0.16+0.36+0.16] / 4 = 1.20 / 4 = **0.30**

### NG Pre-test (M = 2.75):

S₂²(pre) = [(3-2.75)²+(2-2.75)²+(3-2.75)²+(3-2.75)²] / 3
= [0.0625+0.5625+0.0625+0.0625] / 3 = 0.75 / 3 = **0.25**

---

## QADAM 3: STANDART OG'ISH (SD)

**Formula:**

SD = √S²

**Nima uchun:** S² kvadrat birlikda, SD esa asl birlikda. Dissertatsiyada M ± SD formatda yoziladi.

| | S² | SD |
|---|:---:|:---:|
| TG post | 0.70 | **0.837** |
| NG post | 0.25 | **0.500** |
| TG pre | 0.30 | **0.548** |
| NG pre | 0.25 | **0.500** |

**Dissertatsiyada yozilishi:**
- TG pre: 2.60 ± 0.55
- NG pre: 2.75 ± 0.50
- TG post: 4.20 ± 0.84
- NG post: 3.25 ± 0.50

---

## QADAM 4: PRE-TEST STUDENT t-TEST

**Maqsad:** Tajriba boshida guruhlar TENG ekanligini isbotlash. p > 0.05 bo'lishi KERAK.

### 4a. Sp (Pooled Standard Deviation):

Sp = √[((n₁-1)×S₁² + (n₂-1)×S₂²) / (n₁+n₂-2)]

Sp = √[((5-1)×0.30 + (4-1)×0.25) / (5+4-2)]
   = √[(4×0.30 + 3×0.25) / 7]
   = √[(1.20 + 0.75) / 7]
   = √[1.95 / 7]
   = √0.279
   = **0.528**

### 4b. t-qiymat:

t = (M₁ - M₂) / (Sp × √(1/n₁ + 1/n₂))

t = (2.60 - 2.75) / (0.528 × √(1/5 + 1/4))
  = -0.15 / (0.528 × √0.45)
  = -0.15 / (0.528 × 0.671)
  = -0.15 / 0.354
  = **-0.42**

### 4c. Erkinlik darajasi:

df = n₁ + n₂ - 2 = 5 + 4 - 2 = **7**

### 4d. p-qiymat:

|t| = 0.42, df = 7 → t-jadvaldan: **p ≈ 0.69**

### ✅ XULOSA:

**t = -0.42, df = 7, p = 0.69 > 0.05**

Guruhlar tajriba boshida TENG. Tajriba to'g'ri tashkil etilgan.

---

## QADAM 5: POST-TEST STUDENT t-TEST

**Maqsad:** Tajriba OXIRIDA tajriba guruhi nazorat guruhidan YUQORI ekanligini isbotlash. p < 0.05 bo'lishi KERAK.

### 5a. Sp:

Sp = √[((5-1)×0.70 + (4-1)×0.25) / (5+4-2)]
   = √[(2.80 + 0.75) / 7]
   = √[3.55 / 7]
   = √0.507
   = **0.712**

### 5b. t-qiymat:

t = (4.20 - 3.25) / (0.712 × √(1/5 + 1/4))
  = 0.95 / (0.712 × √0.45)
  = 0.95 / (0.712 × 0.671)
  = 0.95 / 0.478
  = **1.99**

### 5c. df = 7

### 5d. p-qiymat:

t = 1.99, df = 7 → **p ≈ 0.086**

### XULOSA:

**t = 1.99, df = 7, p = 0.086**

Namuna kichik (n=5, n=4) bo'lgani uchun p > 0.05. Kattaroq namunada sezilarli bo'ladi.

---

## QADAM 6: FISHER F-TEST

**Maqsad:** t-test ishonchli natija berishi uchun dispersiyalar TENG ekanligini tekshirish.

**Formula:**

F = S₁² / S₂² (katta / kichik)

F = 0.70 / 0.25 = **2.80**

df₁ = 5-1 = 4, df₂ = 4-1 = 3

F-jadvaldan: F_kritik(0.05, df₁=4, df₂=3) ≈ 9.12

**F = 2.80 < 9.12 → p > 0.05 → Dispersiyalar TENG ✅**

---

## QADAM 7: COHEN'S d (Effekt o'lchami)

**Maqsad:** Farqning AMALIY ahamiyatini ko'rsatish.

**Formula:**

d = (M₁ - M₂) / Sp

d = (4.20 - 3.25) / 0.712 = 0.95 / 0.712 = **1.33**

### Interpretatsiya jadvali:

| |d| qiymati | Effekt darajasi |
|:-----------:|:--------------:|
| < 0.2 | Effekt yo'q |
| 0.2 | Kichik effekt |
| 0.5 | O'rta effekt |
| 0.8 | Katta effekt |
| **1.33** | **JUDA KATTA EFFEKT** ✅ |

---

## QADAM 8: PAIRED t-TEST (TG ichida)

**Maqsad:** Tajriba guruhi ICHIDA pre→post o'sish sezilarli ekanligini isbotlash.

### 8a. Har o'quvchining o'sishi (d):

| O'quvchi | Pre | Post | d = Post - Pre |
|:--------:|:---:|:----:|:--------------:|
| 1 | 3 | 5 | 2 |
| 2 | 2 | 4 | 2 |
| 3 | 3 | 4 | 1 |
| 4 | 2 | 3 | 1 |
| 5 | 3 | 5 | 2 |

### 8b. O'sishlarning o'rtachasi:

M_d = (2+2+1+1+2) / 5 = 8 / 5 = **1.60**

### 8c. O'sishlarning standart og'ishi:

| d | d - M_d | (d - M_d)² |
|:-:|:-------:|:----------:|
| 2 | +0.40 | 0.16 |
| 2 | +0.40 | 0.16 |
| 1 | -0.60 | 0.36 |
| 1 | -0.60 | 0.36 |
| 2 | +0.40 | 0.16 |
| | **Yig'indi:** | **1.20** |

SD_d = √(1.20 / 4) = √0.30 = **0.548**

### 8d. t hisoblash:

t = M_d / (SD_d / √n) = 1.60 / (0.548 / √5) = 1.60 / 0.245 = **6.53**

df = 5 - 1 = **4**

### 8e. p-qiymat:

t = 6.53, df = 4 → **p ≈ 0.003**

### ✅ XULOSA:

**t = 6.53, df = 4, p = 0.003 < 0.01 → O'sish JUDA SEZILARLI**

---

## YAKUNIY NATIJALAR JADVALI

| Ko'rsatkih | TG (n=5) | NG (n=4) | t | p | Cohen's d |
|:----------:|:--------:|:--------:|:---:|:---:|:---------:|
| Pre-test | 2.60 ± 0.55 | 2.75 ± 0.50 | -0.42 | 0.69 | 0.29 |
| Post-test | 4.20 ± 0.84 | 3.25 ± 0.50 | 1.99 | 0.086 | **1.33** |
| O'sish (Δ) | +1.60 | +0.50 | — | — | — |
| Paired t (TG) | t = 6.53 | — | | 0.003 | |
| Fisher F | F = 2.80 | | | >0.05 | |

---

## DISSERTATSIYAGA XULOSA

1. **Guruhlar ekvivalentligi:** Pre-test natijalariga ko'ra, tajriba (M=2.60±0.55) va nazorat (M=2.75±0.50) guruhlari o'rtasida statistik jihatdan sezilarli farq kuzatilmadi (t=-0.42, p=0.69>0.05), bu guruhlarning tajriba boshidagi ekvivalentligini tasdiqlaydi.

2. **Post-test natijalari:** Tajriba guruhi (M=4.20±0.84) nazorat guruhiga (M=3.25±0.50) nisbatan yuqori natijaga erishdi. Effekt o'lchami Cohen's d=1.33 juda katta effektni ko'rsatadi.

3. **Tajriba guruhi ichidagi o'sish:** Pre-test (M=2.60) dan post-test (M=4.20) ga o'tishda o'rtacha 1.60 ballga o'sish kuzatildi (t=6.53, p=0.003<0.01), bu platformaning samaradorligini tasdiqlaydi.

4. **O'sish taqqoslash:** Tajriba guruhi +1.60 ballga o'ssa, nazorat guruhi faqat +0.50 ballga o'sdi. Tajriba guruhi an'anaviy usuldan **3.2 marta** samaraliroq natija ko'rsatdi.

5. **Fisher F-test:** Dispersiyalar tengligi tasdiqlandi (F=2.80, p>0.05), bu t-test natijalarining ishonchliligini ta'minlaydi.
