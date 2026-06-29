const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'infotest-default-secret-key-change-in-production';
  return jwt.sign(
    { userId },
    secret,
    { expiresIn: '7d' }
  );
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    // Validation
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ 
        error: 'All fields are required',
        fields: ['username', 'email', 'password', 'full_name']
      });
    }

    // Username validation
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if username already exists
    if (await User.usernameExists(username)) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Check if email already exists
    if (await User.emailExists(email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Validate role
    const validRoles = ['student', 'teacher', 'admin'];
    const userRole = role || 'student';
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Create user
    const userId = await User.create({
      username,
      email,
      password,
      full_name,
      role: userRole
    });

    // Generate token
    const token = generateToken(userId);

    // Get user data (without password)
    const user = await User.findById(userId);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        points: user.points,
        level: user.level
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', { username: req.body.username });
    
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      console.log('Login validation failed: missing fields');
      return res.status(400).json({ error: 'Username and password are required' });
    }

    console.log('Finding user...');
    // Find user
    const user = await User.findByUsername(username);
    console.log('User found:', user ? 'yes' : 'no');
    
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Verifying password...');
    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Generating token...');
    // Generate token
    const token = generateToken(user.id);
    console.log('Login successful for user:', user.username);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar: user.avatar,
        points: user.points,
        level: user.level,
        bio: user.bio
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Login failed', details: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  }
});

// Get current user (verify token)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar: user.avatar,
        points: user.points,
        level: user.level,
        bio: user.bio,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, email, bio } = req.body;
    const updates = {};

    if (full_name) updates.full_name = full_name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      updates.email = email;
    }
    if (bio !== undefined) updates.bio = bio;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await User.update(req.user.id, updates);

    const updatedUser = await User.findById(req.user.id);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        points: updatedUser.points,
        level: updatedUser.level,
        bio: updatedUser.bio
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Verify current password
    const user = await User.findById(req.user.id);
    const isValidPassword = await User.verifyPassword(current_password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    await User.updatePassword(req.user.id, new_password);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
