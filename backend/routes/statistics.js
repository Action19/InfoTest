const express = require('express');
const database = require('../config/database');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user statistics
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only see their own stats unless they're teacher/admin
    if (req.user.id !== parseInt(userId) && req.user.role === 'student') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get basic statistics
    const stats = await database.get(
      'SELECT * FROM statistics WHERE user_id = ?',
      [userId]
    );
    
    // Get user info
    const user = await User.findById(userId);
    
    // Get achievements
    const achievements = await database.all(`
      SELECT 
        a.*,
        ua.earned_at
      FROM user_achievements ua
      LEFT JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
      ORDER BY ua.earned_at DESC
    `, [userId]);
    
    // Get recent results
    const recentResults = await database.all(`
      SELECT 
        r.*,
        t.title as test_title,
        t.subject
      FROM results r
      LEFT JOIN tests t ON r.test_id = t.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 5
    `, [userId]);
    
    // Get subject breakdown
    const subjectStats = await database.all(`
      SELECT 
        t.subject,
        COUNT(r.id) as tests_taken,
        AVG(r.percentage) as average_score,
        SUM(CASE WHEN r.passed = 1 THEN 1 ELSE 0 END) as tests_passed
      FROM results r
      LEFT JOIN tests t ON r.test_id = t.id
      WHERE r.user_id = ?
      GROUP BY t.subject
    `, [userId]);
    
    res.json({
      totalAttempts: stats?.total_tests_taken || 0,
      averageScore: stats?.average_score || 0,
      totalPassed: stats?.total_tests_passed || 0,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        points: user.points,
        level: user.level,
        avatar: user.avatar
      },
      statistics: stats,
      achievements,
      recent_results: recentResults,
      subject_stats: subjectStats
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await User.getLeaderboard(limit);
    res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Get overall statistics (admin only)
router.get('/overall', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Total users
    const userCount = await database.get(
      'SELECT COUNT(*) as count FROM users'
    );
    
    // Users by role
    const usersByRole = await database.all(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);
    
    // Total tests
    const testCount = await database.get(
      'SELECT COUNT(*) as count FROM tests'
    );
    
    // Published tests
    const publishedTests = await database.get(
      'SELECT COUNT(*) as count FROM tests WHERE is_published = 1'
    );
    
    // Total test attempts
    const attemptCount = await database.get(
      'SELECT COUNT(*) as count FROM results'
    );
    
    // Average score
    const avgScore = await database.get(
      'SELECT AVG(percentage) as average FROM results'
    );
    
    // Tests by subject
    const testsBySubject = await database.all(`
      SELECT subject, COUNT(*) as count
      FROM tests
      GROUP BY subject
      ORDER BY count DESC
    `);
    
    // Recent activity
    const recentActivity = await database.all(`
      SELECT 
        r.created_at,
        u.username,
        u.full_name,
        t.title as test_title,
        r.percentage
      FROM results r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN tests t ON r.test_id = t.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `);
    
    res.json({
      totalUsers: userCount.count,
      totalTests: testCount.count,
      totalAttempts: attemptCount.count,
      averageScore: avgScore.average ? parseFloat(avgScore.average.toFixed(2)) : 0,
      users: {
        total: userCount.count,
        by_role: usersByRole
      },
      tests: {
        total: testCount.count,
        published: publishedTests.count
      },
      tests_by_subject: testsBySubject,
      recent_activity: recentActivity
    });
  } catch (error) {
    console.error('Get overall statistics error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get user progress over time
router.get('/progress/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check permissions
    if (req.user.id !== parseInt(userId) && req.user.role === 'student') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get results over time
    const progress = await database.all(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as tests_taken,
        AVG(percentage) as average_score,
        SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as tests_passed
      FROM results
      WHERE user_id = ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [userId]);
    
    res.json({ progress });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

module.exports = router;
