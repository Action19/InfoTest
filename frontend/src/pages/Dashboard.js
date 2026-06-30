import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../assets/css/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (user.role === 'student') {
        // Fetch student statistics
        try {
          const statsRes = await api.get(`/statistics/user/${user.id}`);
          setStats(statsRes.data);
        } catch (err) {
          console.error('Stats error:', err);
        }

        // Fetch recent test results
        try {
          const resultsRes = await api.get('/results/my-results');
          const results = Array.isArray(resultsRes.data) ? resultsRes.data : [];
          setRecentTests(results.slice(0, 5));
        } catch (err) {
          console.error('Results error:', err);
          setRecentTests([]);
        }
      } else if (user.role === 'teacher' || user.role === 'admin') {
        // Fetch teacher/admin statistics
        try {
          const statsRes = await api.get('/statistics/overall');
          setStats(statsRes.data);
        } catch (err) {
          console.error('Stats error:', err);
        }

        // Fetch all tests
        try {
          const testsRes = await api.get('/tests');
          const tests = Array.isArray(testsRes.data) ? testsRes.data : [];
          setRecentTests(tests.slice(0, 5));
        } catch (err) {
          console.error('Tests error:', err);
          setRecentTests([]);
        }
      }

      // Fetch leaderboard
      try {
        const leaderboardRes = await api.get('/users/leaderboard/top');
        const leaders = Array.isArray(leaderboardRes.data) ? leaderboardRes.data : [];
        setLeaderboard(leaders.slice(0, 5));
      } catch (err) {
        console.error('Leaderboard error:', err);
        setLeaderboard([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const colors = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    return colors[level - 1] || 'bronze';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Xush kelibsiz, {user.full_name}! 👋</h1>
        <p className="subtitle">
          {user.role === 'student' && 'Bilimlaringizni sinab ko\'ring va yutuqlarga erishing!'}
          {user.role === 'teacher' && 'Talabalar natijalarini kuzating va testlar yarating'}
          {user.role === 'admin' && 'Platformani boshqaring va statistikalarni ko\'ring'}
        </p>
      </div>

      {user.role === 'student' && stats && (
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.totalAttempts}</h3>
              <p>Jami testlar</p>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.averageScore ? `${stats.averageScore.toFixed(1)}%` : '0%'}</h3>
              <p>O'rtacha ball</p>
            </div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>{user.points}</h3>
              <p>Ballar</p>
            </div>
          </div>
          <div className={`stat-card stat-level level-${getLevelColor(user.level)}`}>
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <h3>Daraja {user.level}</h3>
              <p>{getLevelColor(user.level).toUpperCase()}</p>
            </div>
          </div>
        </div>
      )}

      {(user.role === 'teacher' || user.role === 'admin') && stats && (
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.totalUsers || 0}</h3>
              <p>Jami foydalanuvchilar</p>
            </div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>{stats.totalTests || 0}</h3>
              <p>Jami testlar</p>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <h3>{stats.totalAttempts || 0}</h3>
              <p>Bajarilgan testlar</p>
            </div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>{stats.averageScore ? `${stats.averageScore.toFixed(1)}%` : '0%'}</h3>
              <p>O'rtacha natija</p>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>
              {user.role === 'student' ? "So'nggi natijalar" : "So'nggi testlar"}
            </h2>
            <Link to={user.role === 'student' ? '/results' : '/tests'} className="btn btn-sm btn-outline">
              Barchasi
            </Link>
          </div>
          <div className="items-list">
            {recentTests.length === 0 ? (
              <div className="empty-state">
                <p>
                  {user.role === 'student' 
                    ? "Hali hech qanday test topshirilmagan" 
                    : "Hali hech qanday test yaratilmagan"}
                </p>
                {user.role !== 'student' && (
                  <Link to="/tests" className="btn btn-primary">
                    Test yaratish
                  </Link>
                )}
              </div>
            ) : (
              recentTests.map((item) => (
                <div key={item.id} className="list-item">
                  <div className="item-content">
                    <h4>{item.test_title || item.title}</h4>
                    {user.role === 'student' ? (
                      <>
                        <p className="item-meta">
                          Ball: <strong>{item.score_percentage?.toFixed(1)}%</strong>
                          {' • '}
                          {new Date(item.submitted_at).toLocaleDateString('uz-UZ')}
                        </p>
                        <div className={`score-badge ${item.score_percentage >= 70 ? 'badge-success' : item.score_percentage >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                          {item.score}/{item.total_questions}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="item-meta">
                          {item.questions_count || 0} savol • {item.time_limit} daqiqa
                        </p>
                        <span className={`badge ${item.is_published ? 'badge-success' : 'badge-secondary'}`}>
                          {item.is_published ? 'Nashr qilingan' : 'Qoralama'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>🏆 Reyting</h2>
            <Link to="/leaderboard" className="btn btn-sm btn-outline">
              To'liq reyting
            </Link>
          </div>
          <div className="leaderboard-list">
            {leaderboard.map((leader, index) => (
              <div key={leader.id} className="leaderboard-item">
                <div className={`rank rank-${index + 1}`}>
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </div>
                <div className="leader-avatar">{leader.full_name.charAt(0).toUpperCase()}</div>
                <div className="leader-info">
                  <h4>{leader.full_name}</h4>
                  <p>{leader.points} ball • Daraja {leader.level}</p>
                </div>
                <div className={`level-badge level-${getLevelColor(leader.level)}`}>
                  {getLevelColor(leader.level)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {user.role === 'student' && (
        <div className="quick-actions">
          <h2>Tezkor harakatlar</h2>
          <div className="action-cards">
            <Link to="/tests" className="action-card">
              <span className="action-icon">📝</span>
              <h3>Testlar</h3>
              <p>Mavjud testlarni ko'rish va topshirish</p>
            </Link>
            <Link to="/results" className="action-card">
              <span className="action-icon">📊</span>
              <h3>Natijalar</h3>
              <p>Topshirilgan testlar natijalarini ko'rish</p>
            </Link>
            <Link to="/portfolio" className="action-card">
              <span className="action-icon">💼</span>
              <h3>Portfolio</h3>
              <p>Mening yutuqlarim va ishlarim</p>
            </Link>
          </div>
        </div>
      )}

      {(user.role === 'teacher' || user.role === 'admin') && (
        <div className="quick-actions">
          <h2>Tezkor harakatlar</h2>
          <div className="action-cards">
            <Link to="/tests" className="action-card">
              <span className="action-icon">➕</span>
              <h3>Yangi test</h3>
              <p>Test yaratish va savollar qo'shish</p>
            </Link>
            <Link to="/leaderboard" className="action-card">
              <span className="action-icon">📊</span>
              <h3>Statistika</h3>
              <p>Talabalar natijalarini tahlil qilish</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
