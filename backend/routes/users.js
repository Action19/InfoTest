const express = require('express');
const User = require('../models/User');
const database = require('../config/database');
const { authenticateToken, isAdmin, isTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { role } = req.query;
    const users = await User.getAll(role);
    res.json({ users, count: users.length });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get students (for teachers - filtered by school and classes)
router.get('/students/list', authenticateToken, isTeacherOrAdmin, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    let students;
    
    if (currentUser.role === 'teacher') {
      // Teacher sees only students from their school and classes
      const teaching_classes = currentUser.teaching_classes 
        ? currentUser.teaching_classes.split(',').map(c => c.trim())
        : [];
      
      students = await User.getStudentsBySchool(
        currentUser.district,
        currentUser.school_number,
        teaching_classes
      );
    } else if (currentUser.role === 'admin') {
      // Admin sees all students
      students = await User.getAll('student');
    }
    
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Users can only view their own profile, unless they're teacher/admin
    if (req.user.id !== parseInt(id) && req.user.role === 'student') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get leaderboard (filtered by school for students)
router.get('/leaderboard/top', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const user = await User.findById(req.user.id);
    
    let leaderboard;
    
    // Filter by school for students
    if (user.role === 'student' && user.district && user.school_number) {
      leaderboard = await User.getLeaderboard(limit, user.district, user.school_number);
    } else {
      // Admins and teachers see all
      leaderboard = await User.getLeaderboard(limit);
    }
    
    res.json(leaderboard); // Return array directly
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Block/Unblock user (admin only)
router.patch('/:id/block', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'O\'zingizni bloklashingiz mumkin emas' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    const currentStatus = user.is_blocked || false;
    await database.run('UPDATE users SET is_blocked = ? WHERE id = ?', [!currentStatus, id]);

    res.json({
      message: !currentStatus ? 'Foydalanuvchi BLOKLANDI' : 'Blok olib tashlandi',
      is_blocked: !currentStatus
    });
  } catch (err) {
    res.status(500).json({ error: 'Xatolik: ' + err.message });
  }
});

// Reset user password (admin only)
router.patch('/:id/reset-password', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 4) {
      return res.status(400).json({ error: 'Parol kamida 4 belgidan iborat bo\'lishi kerak' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    await User.updatePassword(id, new_password);

    res.json({ message: `${user.full_name} paroli yangilandi` });
  } catch (err) {
    res.status(500).json({ error: 'Xatolik: ' + err.message });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Cannot delete yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.delete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
