/**
 * Telegram Bot integratsiya — ota-onalarga haftalik hisobot
 * Bot: @InfoBahoBot
 * 
 * Oqim:
 * 1. O'quvchi profilida "Ota-ona Telegram" bo'limida maxsus havola oladi
 * 2. Ota-ona havolani bosib botga /start yozadi
 * 3. Bot chat_id ni saqlaydi va o'quvchiga bog'laydi
 * 4. Haftada 1 marta bot ota-onaga farzandining natijalari + AI tavsiya yuboradi
 */

const express = require('express');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { chat } = require('../utils/ai');

const router = express.Router();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// ─── Telegram API helper ─────────────────────────────────────
async function sendTelegramMessage(chatId, text, parseMode = 'HTML', replyMarkup = null) {
  if (!BOT_TOKEN) return null;
  try {
    const body = {
      chat_id: chatId,
      text,
      parse_mode: parseMode
    };
    if (replyMarkup) body.reply_markup = replyMarkup;

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await response.json();
  } catch (err) {
    console.error('Telegram send error:', err.message);
    return null;
  }
}

// Asosiy tugmalar (har xabardan keyin ko'rsatiladi)
const mainKeyboard = {
  keyboard: [
    [{ text: '📊 Farzandim natijalari' }],
    [{ text: '❌ Obunani bekor qilish' }]
  ],
  resize_keyboard: true,
  one_time_keyboard: false
};

// ─── GET /api/telegram/link — o'quvchi uchun ulanish havolasini olish ───
router.get('/link', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Faqat o\'quvchilar uchun' });
    }

    // Unikal token yaratish (o'quvchi ID + random)
    const linkToken = `connect_${req.user.id}_${Date.now().toString(36)}`;

    // Tokenni DB ga saqlash (10 daqiqa amal qiladi)
    await database.run(`
      INSERT INTO telegram_links (student_id, link_token, expires_at)
      VALUES (?, ?, NOW() + INTERVAL '10 minutes')
      ON CONFLICT (student_id) DO UPDATE SET
        link_token = EXCLUDED.link_token,
        expires_at = NOW() + INTERVAL '10 minutes'
    `, [req.user.id, linkToken]);

    // Mavjud ulanishni tekshirish
    const existing = await database.get(
      'SELECT chat_id, parent_name, connected_at FROM telegram_parents WHERE student_id = ?',
      [req.user.id]
    );

    const botUsername = 'InfoBahoBot';
    const link = `https://t.me/${botUsername}?start=${linkToken}`;

    res.json({
      link,
      connected: !!existing,
      parent_name: existing?.parent_name || null,
      connected_at: existing?.connected_at || null
    });
  } catch (err) {
    console.error('Telegram link error:', err);
    res.status(500).json({ error: 'Havola yaratishda xatolik' });
  }
});

// ─── POST /api/telegram/webhook — Telegram webhook (bot xabarlarini qabul qilish) ───
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body;

    if (!update.message) return res.json({ ok: true });

    const chatId = update.message.chat.id;
    const text = update.message.text || '';
    const firstName = update.message.from.first_name || '';
    const lastName = update.message.from.last_name || '';
    const parentName = `${firstName} ${lastName}`.trim();

    // /start connect_XXX — ulanish
    if (text.startsWith('/start connect_')) {
      const linkToken = text.replace('/start ', '');

      // Tokenni tekshirish
      const linkRow = await database.get(
        `SELECT student_id FROM telegram_links WHERE link_token = ? AND expires_at > NOW()`,
        [linkToken]
      );

      if (!linkRow) {
        await sendTelegramMessage(chatId,
          '❌ <b>Havola muddati o\'tgan yoki noto\'g\'ri.</b>\n\nIltimos, platformadan yangi havola oling.'
        );
        return res.json({ ok: true });
      }

      // O'quvchi ma'lumotlarini olish
      const student = await database.get(
        'SELECT full_name, class_name FROM users WHERE id = ?',
        [linkRow.student_id]
      );

      // Ota-onani bog'lash
      await database.run(`
        INSERT INTO telegram_parents (student_id, chat_id, parent_name, connected_at)
        VALUES (?, ?, ?, NOW())
        ON CONFLICT (student_id) DO UPDATE SET
          chat_id = EXCLUDED.chat_id,
          parent_name = EXCLUDED.parent_name,
          connected_at = NOW()
      `, [linkRow.student_id, chatId, parentName]);

      // Tokenni o'chirish
      await database.run('DELETE FROM telegram_links WHERE student_id = ?', [linkRow.student_id]);

      await sendTelegramMessage(chatId,
        `✅ <b>Muvaffaqiyatli ulandi!</b>\n\n` +
        `👤 Farzandingiz: <b>${student?.full_name || 'Noma\'lum'}</b>\n` +
        `🏫 Sinf: ${student?.class_name || ''}\n\n` +
        `📊 Har hafta farzandingizning o'zlashtirish natijalari va AI tavsiyalari shu yerga yuboriladi.\n\n` +
        `Quyidagi tugmalardan foydalaning 👇`,
        'HTML', mainKeyboard
      );
      return res.json({ ok: true });
    }

    // /start (oddiy)
    if (text === '/start') {
      await sendTelegramMessage(chatId,
        `🎓 <b>InfoBaho — Ota-onalar uchun</b>\n\n` +
        `Bu bot farzandingizning informatika fanidan o'zlashtirish natijalarini haftalik hisobot sifatida yuboradi.\n\n` +
        `<b>Qanday ulash:</b>\n` +
        `1. Farzandingiz InfoBaho platformasiga kirsin\n` +
        `2. Profil → "Ota-ona Telegram" bo'limidan havolani olsin\n` +
        `3. Shu havolani sizga yuborsin — bosing va "Start" bosing\n\n` +
        `✅ Shundan keyin har hafta hisobot keladi!`,
        'HTML', mainKeyboard
      );
      return res.json({ ok: true });
    }

    // "Farzandim natijalari" tugmasi yoki /status
    if (text === '/status' || text === '📊 Farzandim natijalari') {
      const parent = await database.get(
        'SELECT tp.*, u.full_name, u.class_name, u.mastery_percent, u.level, u.id AS student_id FROM telegram_parents tp JOIN users u ON tp.student_id = u.id WHERE tp.chat_id = ?',
        [chatId]
      );

      if (!parent) {
        await sendTelegramMessage(chatId, '❌ Siz hali hech qaysi o\'quvchiga ulanmagansiz.\n\nFarzandingizdan InfoBaho platformasidan havola oling.', 'HTML', mainKeyboard);
        return res.json({ ok: true });
      }

      // To'liq tahlil uchun ma'lumotlarni yig'ish
      const progress = await database.all(`
        SELECT lp.percent, lp.grade, l.title AS lesson_title, l.subject
        FROM lesson_progress lp
        JOIN lessons l ON lp.lesson_id = l.id
        WHERE lp.student_id = ? AND l.taught_at IS NOT NULL
        ORDER BY lp.updated_at DESC LIMIT 6
      `, [parent.student_id]);

      const testResults = await database.all(`
        SELECT r.percentage, t.title AS test_title
        FROM results r JOIN tests t ON r.test_id = t.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC LIMIT 5
      `, [parent.student_id]);

      const assignResults = await database.all(`
        SELECT s.score, a.max_score, a.title
        FROM assignment_submissions s
        JOIN assignments a ON s.assignment_id = a.id
        WHERE s.student_id = ? AND s.status = 'graded'
        ORDER BY s.submitted_at DESC LIMIT 5
      `, [parent.student_id]);

      // AI tavsiya yaratish
      let aiAdvice = '';
      try {
        const avgPercent = progress.length > 0
          ? Math.round(progress.reduce((s, p) => s + (p.percent || 0), 0) / progress.length)
          : parent.mastery_percent || 0;

        const weakLessons = progress.filter(p => p.percent < 60).map(p => p.lesson_title).join(', ');
        const strongLessons = progress.filter(p => p.percent >= 80).map(p => p.lesson_title).join(', ');

        const aiPrompt = `Siz ota-onalarga farzandining o'qish natijalari haqida maslahat beradigan AI mentorsiz.

O'quvchi: ${parent.full_name}, ${parent.class_name}
Umumiy o'zlashtirish: ${parent.mastery_percent || 0}%
${strongLessons ? `Kuchli darslar: ${strongLessons}` : ''}
${weakLessons ? `Zaif darslar: ${weakLessons}` : ''}
Oxirgi testlar: ${testResults.map(t => `${t.test_title}: ${Math.round(t.percentage)}%`).join(', ') || 'hali yo\'q'}

Ota-onaga 3-4 gapda QISQA maslahat bering:
1. Farzandining hozirgi holati haqida 1 gap xulosa
2. Uyda qanday yordam berishi mumkin (1 aniq maslahat)
3. 1 motivatsion gap

MUHIM: Javob 200 so'zdan OSHMASIN. Qisqa va aniq yozing. O'zbek tilida.`;

        aiAdvice = await chat(aiPrompt, { max_tokens: 500 });
      } catch (e) {
        aiAdvice = "Farzandingizni rag'batlantiring va muntazam mashq qilishiga yordam bering.";
      }

      // Xabar formatlash
      const levelNames = ['🥉 Bronza', '🥈 Kumush', '🥇 Oltin', '💎 Platina', '💠 Brilliant'];
      const gradeEmoji = (g) => ({ 5: '🥇', 4: '🥈', 3: '🥉', 2: '😢' }[g] || '—');

      let message = `📊 <b>Farzandingiz natijalari</b>\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `👤 <b>${parent.full_name}</b>\n`;
      message += `🏫 Sinf: ${parent.class_name}\n`;
      message += `📈 O'zlashtirish: <b>${parent.mastery_percent || 0}%</b>\n`;
      message += `🏆 Daraja: ${levelNames[(parent.level || 1) - 1]}\n\n`;

      // Dars natijalari
      if (progress.length > 0) {
        message += `📚 <b>Darslar bo'yicha:</b>\n`;
        for (const p of progress) {
          message += `  ${gradeEmoji(p.grade)} ${p.lesson_title}: <b>${Math.round(p.percent)}%</b>\n`;
        }
        message += '\n';
      }

      // Testlar
      if (testResults.length > 0) {
        message += `📝 <b>Oxirgi testlar:</b>\n`;
        for (const t of testResults.slice(0, 4)) {
          const emoji = t.percentage >= 81 ? '✅' : t.percentage >= 60 ? '📗' : '⚠️';
          message += `  ${emoji} ${t.test_title}: ${Math.round(t.percentage)}%\n`;
        }
        message += '\n';
      }

      // Amaliy topshiriqlar
      if (assignResults.length > 0) {
        message += `🖥️ <b>Amaliy ishlar:</b>\n`;
        for (const a of assignResults.slice(0, 4)) {
          const pct = Math.round((a.score / a.max_score) * 100);
          const emoji = pct >= 81 ? '✅' : pct >= 60 ? '📗' : '⚠️';
          message += `  ${emoji} ${a.title}: ${a.score}/${a.max_score} (${pct}%)\n`;
        }
        message += '\n';
      }

      // Agar hech narsa yo'q bo'lsa
      if (progress.length === 0 && testResults.length === 0 && assignResults.length === 0) {
        message += `ℹ️ Hozircha natijalar yo'q — farzandingiz hali darslarni boshlamagan.\n\n`;
      }

      // AI tavsiya
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `💡 <b>AI tavsiya (ota-onalar uchun):</b>\n\n`;
      message += `${aiAdvice}\n\n`;
      message += `🌐 <a href="https://infobaho.netlify.app">Platformaga kirish</a>`;

      await sendTelegramMessage(chatId, message, 'HTML', mainKeyboard);
      return res.json({ ok: true });
    }

    // "Obunani bekor qilish" tugmasi yoki /disconnect
    if (text === '/disconnect' || text === '❌ Obunani bekor qilish') {
      const parent = await database.get('SELECT * FROM telegram_parents WHERE chat_id = ?', [chatId]);
      if (!parent) {
        await sendTelegramMessage(chatId, 'Siz hali ulanmagansiz.', 'HTML', mainKeyboard);
        return res.json({ ok: true });
      }
      await database.run('DELETE FROM telegram_parents WHERE chat_id = ?', [chatId]);
      await sendTelegramMessage(chatId,
        '✅ Obuna bekor qilindi.\n\nEndi haftalik hisobot kelmaydi.\nQayta ulash uchun farzandingizdan yangi havola oling.',
        'HTML', { remove_keyboard: true }
      );
      return res.json({ ok: true });
    }

    // Boshqa xabar
    await sendTelegramMessage(chatId,
      `ℹ️ Men InfoBaho platformasining botiman.\n\nQuyidagi tugmalardan foydalaning 👇`,
      'HTML', mainKeyboard
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    res.json({ ok: true }); // Telegram 200 kutadi
  }
});

// ─── POST /api/telegram/send-weekly — haftalik hisobot yuborish (admin/cron) ───
router.post('/send-weekly', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Faqat admin' });
    }

    const parents = await database.all(`
      SELECT tp.chat_id, tp.student_id, tp.parent_name,
             u.full_name, u.class_name, u.mastery_percent, u.level, u.bonus_points
      FROM telegram_parents tp
      JOIN users u ON tp.student_id = u.id
    `);

    let sent = 0;
    let failed = 0;

    for (const parent of parents) {
      try {
        // O'quvchi natijalari
        const progress = await database.all(`
          SELECT lp.percent, lp.grade, l.title AS lesson_title, l.subject
          FROM lesson_progress lp
          JOIN lessons l ON lp.lesson_id = l.id
          WHERE lp.student_id = ? AND l.taught_at IS NOT NULL
          ORDER BY lp.updated_at DESC LIMIT 5
        `, [parent.student_id]);

        const testResults = await database.all(`
          SELECT r.percentage, t.title AS test_title
          FROM results r JOIN tests t ON r.test_id = t.id
          WHERE r.user_id = ?
          ORDER BY r.created_at DESC LIMIT 5
        `, [parent.student_id]);

        const assignResults = await database.all(`
          SELECT s.score, a.max_score, a.title AS title
          FROM assignment_submissions s
          JOIN assignments a ON s.assignment_id = a.id
          WHERE s.student_id = ? AND s.status = 'graded'
          ORDER BY s.submitted_at DESC LIMIT 5
        `, [parent.student_id]);

        // AI tavsiya (qisqa)
        let aiTip = '';
        try {
          const avgPercent = progress.length > 0
            ? Math.round(progress.reduce((s, p) => s + (p.percent || 0), 0) / progress.length)
            : 0;

          const aiPrompt = `Siz ota-onalarga farzandining o'qish natijalari haqida maslahat beradigan mentorsiz.
O'quvchi: ${parent.full_name}, ${parent.class_name}
O'zlashtirish: ${parent.mastery_percent || 0}%
Oxirgi darslar: ${progress.map(p => `${p.lesson_title}: ${p.percent}%`).join(', ') || 'hali yo\'q'}

Ota-onaga 2-3 gapda QISQA, ANIQ maslahat bering — uyda farzandiga qanday yordam berishi mumkin.
Faqat matn qaytaring (JSON emas), o'zbek tilida.`;

          aiTip = await chat(aiPrompt, { max_tokens: 300 });
        } catch (e) {
          aiTip = "Farzandingizni rag'batlantiring va muntazam mashq qilishiga yordam bering.";
        }

        // Xabar formatlash
        const levelNames = ['🥉 Bronza', '🥈 Kumush', '🥇 Oltin', '💎 Platina', '💠 Brilliant'];
        const gradeEmoji = (g) => ({ 5: '🥇', 4: '🥈', 3: '🥉', 2: '😢' }[g] || '—');

        let message = `📊 <b>InfoBaho — Haftalik hisobot</b>\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `👤 <b>${parent.full_name}</b> | ${parent.class_name}\n`;
        message += `🏆 Daraja: ${levelNames[(parent.level || 1) - 1]}\n`;
        message += `📈 O'zlashtirish: <b>${parent.mastery_percent || 0}%</b>\n\n`;

        // Oxirgi dars natijalari
        if (progress.length > 0) {
          message += `📚 <b>Oxirgi darslar:</b>\n`;
          for (const p of progress.slice(0, 4)) {
            message += `  ${gradeEmoji(p.grade)} ${p.lesson_title}: <b>${Math.round(p.percent)}%</b>\n`;
          }
          message += '\n';
        }

        // Oxirgi testlar
        if (testResults.length > 0) {
          message += `📝 <b>Testlar:</b>\n`;
          for (const t of testResults.slice(0, 3)) {
            message += `  • ${t.test_title}: ${Math.round(t.percentage)}%\n`;
          }
          message += '\n';
        }

        // Amaliy topshiriqlar
        if (assignResults.length > 0) {
          message += `🖥️ <b>Amaliy ishlar:</b>\n`;
          for (const a of assignResults.slice(0, 3)) {
            message += `  • ${a.title}: ${a.score}/${a.max_score}\n`;
          }
          message += '\n';
        }

        // AI tavsiya
        message += `━━━━━━━━━━━━━━━━━━━━\n`;
        message += `💡 <b>AI tavsiya:</b>\n`;
        message += `${aiTip}\n\n`;
        message += `🌐 <a href="https://infobaho.netlify.app">Platformaga kirish</a>`;

        const result = await sendTelegramMessage(parent.chat_id, message);
        if (result?.ok) sent++;
        else failed++;

      } catch (e) {
        console.error(`Telegram send to ${parent.chat_id} failed:`, e.message);
        failed++;
      }
    }

    res.json({
      message: `Haftalik hisobot yuborildi`,
      sent,
      failed,
      total: parents.length
    });
  } catch (err) {
    console.error('Send weekly error:', err);
    res.status(500).json({ error: 'Yuborishda xatolik: ' + err.message });
  }
});

// ─── DELETE /api/telegram/disconnect — o'quvchi o'zi uzishi ───
router.delete('/disconnect', authenticateToken, async (req, res) => {
  try {
    await database.run('DELETE FROM telegram_parents WHERE student_id = ?', [req.user.id]);
    res.json({ message: 'Telegram uzildi' });
  } catch (err) {
    res.status(500).json({ error: 'Uzishda xatolik' });
  }
});

module.exports = router;
