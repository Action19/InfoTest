const express = require('express');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user portfolio
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only see their own portfolio unless they're teacher/admin
    if (req.user.id !== parseInt(userId) && req.user.role === 'student') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const sql = `
      SELECT * FROM portfolio_items
      WHERE user_id = ? AND (is_public = 1 OR ? = user_id)
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
      is_public ? 1 : 0
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
