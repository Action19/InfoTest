const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ─── Portfolio fayl yuklash config ───────────────────────────
const PORTFOLIO_DIR = path.join(__dirname, '..', 'uploads', 'portfolio');
if (!fs.existsSync(PORTFOLIO_DIR)) fs.mkdirSync(PORTFOLIO_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PORTFOLIO_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_u${req.user.id}_${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpg|jpeg|png|gif|webp|pdf|doc|docx|zip|txt|mp4|mov/i;
    const ext = path.extname(file.originalname).slice(1);
    allowed.test(ext) ? cb(null, true) : cb(new Error('Fayl turi qabul qilinmaydi'));
  }
});

// ─── Fayl turi aniqlovchi ────────────────────────────────────
function getFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (['.jpg','.jpeg','.png','.gif','.webp'].includes(ext)) return 'image';
  if (ext === '.pdf') return 'pdf';
  if (['.doc','.docx'].includes(ext)) return 'doc';
  if (['.mp4','.mov'].includes(ext)) return 'video';
  if (ext === '.zip') return 'zip';
  return 'file';
}


// Get current user's portfolio
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const sql = `
      SELECT * FROM portfolio_items
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
    
    const items = await database.all(sql, [userId]);
    
    // Parse tags
    items.forEach(item => {
      if (item.tags) {
        try {
          item.tags = JSON.parse(item.tags);
        } catch (e) {
          item.tags = [];
        }
      }
    });
    
    res.json(items);
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: 'Failed to get portfolio' });
  }
});

// Get user portfolio by ID
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only see their own portfolio unless they're teacher/admin
    if (req.user.id !== parseInt(userId) && req.user.role === 'student') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const sql = `
      SELECT * FROM portfolio_items
      WHERE user_id = ? AND (is_public = TRUE OR ? = user_id)
      ORDER BY created_at DESC
    `;
    
    const items = await database.all(sql, [userId, req.user.id]);
    
    // Parse tags
    items.forEach(item => {
      if (item.tags) {
        item.tags = JSON.parse(item.tags);
      }
    });
    
    res.json({ portfolio: items, count: items.length });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: 'Failed to get portfolio' });
  }
});

// Get portfolio item
router.get('/item/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await database.get(
      'SELECT * FROM portfolio_items WHERE id = ?',
      [id]
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }
    
    // Check permissions
    if (!item.is_public && item.user_id !== req.user.id && req.user.role === 'student') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Parse tags
    if (item.tags) {
      item.tags = JSON.parse(item.tags);
    }
    
    res.json({ item });
  } catch (error) {
    console.error('Get portfolio item error:', error);
    res.status(500).json({ error: 'Failed to get portfolio item' });
  }
});

// POST /api/portfolio/upload — fayl yuklash (rasm, PDF va h.k.)
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fayl yuklanmadi' });

    const fileType = getFileType(req.file.originalname);
    const filePath = `/uploads/portfolio/${req.file.filename}`;

    res.json({
      file_url: filePath,
      file_name: req.file.originalname,
      file_size: req.file.size,
      file_type: fileType,
      is_image: fileType === 'image'
    });
  } catch (err) {
    console.error('Portfolio upload error:', err);
    res.status(500).json({ error: 'Fayl yuklashda xatolik: ' + err.message });
  }
});

// Create portfolio item
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      item_type,
      content,
      file_url,
      tags,
      is_public
    } = req.body;
    
    // Validation
    if (!title || !item_type) {
      return res.status(400).json({ error: 'title and item_type are required' });
    }
    
    const validTypes = ['project', 'achievement', 'test_result', 'certificate'];
    if (!validTypes.includes(item_type)) {
      return res.status(400).json({ 
        error: 'Invalid item type',
        valid_types: validTypes
      });
    }
    
    const sql = `
      INSERT INTO portfolio_items (
        user_id, title, description, item_type, content,
        file_url, tags, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await database.run(sql, [
      req.user.id,
      title,
      description,
      item_type,
      content,
      file_url,
      tags ? JSON.stringify(tags) : null,
      is_public ? true : false
    ]);
    
    const item = await database.get(
      'SELECT * FROM portfolio_items WHERE id = ?',
      [result.id]
    );
    
    if (item.tags) {
      item.tags = JSON.parse(item.tags);
    }
    
    res.status(201).json({
      message: 'Portfolio item created successfully',
      item
    });
  } catch (error) {
    console.error('Create portfolio item error:', error);
    res.status(500).json({ error: 'Failed to create portfolio item' });
  }
});

// Update portfolio item
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await database.get(
      'SELECT * FROM portfolio_items WHERE id = ?',
      [id]
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }
    
    // Check ownership
    if (item.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updates = {};
    const allowedFields = [
      'title', 'description', 'item_type', 'content',
      'file_url', 'tags', 'is_public'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'tags') {
          updates[field] = JSON.stringify(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const fields = Object.keys(updates).map(f => `${f} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    
    await database.run(
      `UPDATE portfolio_items SET ${fields} WHERE id = ?`,
      values
    );
    
    const updatedItem = await database.get(
      'SELECT * FROM portfolio_items WHERE id = ?',
      [id]
    );
    
    if (updatedItem.tags) {
      updatedItem.tags = JSON.parse(updatedItem.tags);
    }
    
    res.json({
      message: 'Portfolio item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Update portfolio item error:', error);
    res.status(500).json({ error: 'Failed to update portfolio item' });
  }
});

// Delete portfolio item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await database.get(
      'SELECT * FROM portfolio_items WHERE id = ?',
      [id]
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }
    
    // Check ownership
    if (item.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await database.run('DELETE FROM portfolio_items WHERE id = ?', [id]);
    
    res.json({ message: 'Portfolio item deleted successfully' });
  } catch (error) {
    console.error('Delete portfolio item error:', error);
    res.status(500).json({ error: 'Failed to delete portfolio item' });
  }
});

module.exports = router;
