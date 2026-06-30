/**
 * fileReader.js
 * Binary va matn fayllarning tarkibini AI uchun o'qiladigan matnga aylantiradi.
 * Excel → jadval matni, Word → paragraflar, Matn → to'g'ridan, Rasm → base64
 */
const fs = require('fs');
const path = require('path');

/**
 * Faylni o'qib, AI uchun content qaytaradi.
 * @returns { type: 'text'|'image'|'binary_unreadable', content, mimeType? }
 */
async function readFileForAI(filePath, fileName) {
  const ext = path.extname(fileName).toLowerCase();

  // ── Matn fayllari ──────────────────────────────────────────
  const textExts = ['.py', '.js', '.css', '.html', '.htm', '.txt', '.csv', '.json', '.xml', '.sb3'];
  if (textExts.includes(ext)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return { type: 'text', content: content.slice(0, 6000) };
    } catch (e) {
      return { type: 'text', content: `(Faylni o'qib bo'lmadi: ${e.message})` };
    }
  }

  // ── Rasm fayllari ──────────────────────────────────────────
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
  if (imageExts.includes(ext)) {
    try {
      const data = fs.readFileSync(filePath);
      const base64 = data.toString('base64');
      const mime = { '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
                     '.gif':'image/gif', '.webp':'image/webp', '.bmp':'image/bmp' }[ext] || 'image/png';
      return { type: 'image', content: base64, mimeType: mime };
    } catch (e) {
      return { type: 'text', content: `(Rasm o'qilmadi: ${e.message})` };
    }
  }

  // ── Excel fayllari ─────────────────────────────────────────
  if (ext === '.xlsx' || ext === '.xls') {
    try {
      const XLSX = require('xlsx');
      const workbook = XLSX.readFile(filePath);
      let output = `📊 Excel fayl: "${fileName}"\n`;
      output += `Varaqlar soni: ${workbook.SheetNames.length}\n\n`;

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        output += `═══ Varaq: "${sheetName}" ═══\n`;

        // Hujayra ma'lumotlari — formulalar ham
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
        const rows = [];
        for (let r = range.s.r; r <= Math.min(range.e.r, 49); r++) {
          const row = [];
          for (let c = range.s.c; c <= Math.min(range.e.c, 19); c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            const cell = sheet[addr];
            if (!cell) { row.push(''); continue; }
            // Formulani ham ko'rsat
            if (cell.f) {
              row.push(`[Formula: =${cell.f} → ${cell.v ?? ''}]`);
            } else {
              row.push(String(cell.v ?? ''));
            }
          }
          rows.push(row.join('\t'));
        }
        output += rows.join('\n');

        // Diagrammalar
        if (sheet['!charts'] || workbook.Custprops) {
          output += '\n\n[Diagrammalar mavjud bo\'lishi mumkin]';
        }

        // Aslida diagrammalar xlsx ichidagi drawing XML da — tekshirish
        const chartCheck = checkExcelCharts(filePath, workbook);
        if (chartCheck.hasCharts) {
          output += `\n✅ Diagrammalar topildi: ${chartCheck.chartCount} ta`;
        } else {
          output += `\n❌ Diagramma topilmadi`;
        }

        // Formulalar soni
        const formulaCount = countFormulas(sheet);
        output += `\nFormulalar soni: ${formulaCount}`;
        if (formulaCount === 0) output += ` ← ❌ Hech qanday formula yo'q!`;

        output += '\n\n';
        if (output.length > 5000) break;
      }
      return { type: 'text', content: output.slice(0, 6000) };
    } catch (e) {
      return { type: 'text', content: `(Excel o'qilmadi: ${e.message})` };
    }
  }

  // ── Word fayllari ──────────────────────────────────────────
  if (ext === '.docx') {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value || '';
      let output = `📝 Word fayl: "${fileName}"\n\n`;
      output += `Matn tarkibi:\n${text.slice(0, 5000)}`;
      if (text.length === 0) output += '(Hujjat bo\'sh yoki matn topilmadi)';
      return { type: 'text', content: output };
    } catch (e) {
      return { type: 'text', content: `(Word o'qilmadi: ${e.message})` };
    }
  }

  // ── .doc (eski Word) ───────────────────────────────────────
  if (ext === '.doc') {
    return {
      type: 'text',
      content: `📝 Word fayl (eski format .doc): "${fileName}"\nFayl hajmi: ${Math.round((fs.statSync(filePath).size || 0)/1024)} KB\n\nEslatma: .doc format to'liq o'qilmadi, lekin fayl yuklangan. Qo'lda tekshirish tavsiya etiladi.`
    };
  }

  // ── Access, Scratch va boshqalar ───────────────────────────
  return {
    type: 'binary_unreadable',
    content: `Fayl: "${fileName}" (${ext})\nHajm: ${Math.round((fs.existsSync(filePath) ? fs.statSync(filePath).size : 0)/1024)} KB\n\nBu fayl turi avtomatik o'qilmaydi. Fayl to'g'ri formatda yuklangan, lekin tarkibini to'liq baholash uchun qo'lda tekshirish tavsiya etiladi.`
  };
}

// Excel da formulalar sonini hisoblash
function countFormulas(sheet) {
  let count = 0;
  for (const key in sheet) {
    if (key.startsWith('!')) continue;
    if (sheet[key] && sheet[key].f) count++;
  }
  return count;
}

// Excel da diagramma borligini tekshirish (zip ichidagi xl/charts/ papkasi)
function checkExcelCharts(filePath, workbook) {
  try {
    // SheetJS workbook da chartlar to'g'ridan saqlanmaydi
    // Lekin workbook.Sheets da '!drawings' yoki workbook.Workbook.Sheets da SheetId tekshirish mumkin
    // Oddiy usul: zip sifatida o'qib xl/charts/ papkasini tekshirish
    const AdmZip = (() => { try { return require('adm-zip'); } catch { return null; } })();
    if (!AdmZip) {
      // adm-zip yo'q — workbook metadata tekshir
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (sheet['!drawings']) return { hasCharts: true, chartCount: 1 };
      }
      return { hasCharts: false, chartCount: 0 };
    }
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries().map(e => e.entryName);
    const chartFiles = entries.filter(e => e.startsWith('xl/charts/') && e.endsWith('.xml'));
    return { hasCharts: chartFiles.length > 0, chartCount: chartFiles.length };
  } catch {
    return { hasCharts: false, chartCount: 0 };
  }
}

module.exports = { readFileForAI };
