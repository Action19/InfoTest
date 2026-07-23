import React, { useState, useEffect } from 'react';
import '../assets/css/Pages.css';
import { useAuth } from '../context/AuthContext';
import '../assets/css/Pages.css';
import api from '../services/api';
import '../assets/css/Pages.css';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, level1, level2, etc.

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/leaderboard/top');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const colors = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    return colors[level - 1] || 'bronze';
  };

  const getLevelName = (level) => {
    const names = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    return names[level - 1] || 'Bronze';
  };

  const filteredLeaderboard = filter === 'all' 
    ? leaderboard 
    : leaderboard.filter(u => u.level === parseInt(filter.replace('level', '')));

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🏆 Reyting jadvali</h1>
        <p className="subtitle">Eng yaxshi o'quvchilar reytingi</p>
      </div>

      <div className="leaderboard-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Barchasi
        </button>
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            className={`filter-btn level-${getLevelColor(level)} ${filter === `level${level}` ? 'active' : ''}`}
            onClick={() => setFilter(`level${level}`)}
          >
            Daraja {level}
          </button>
        ))}
      </div>

      {filteredLeaderboard.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h3>Reyting bo'sh</h3>
          <p>Hozircha hech kim yo'q</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {filter === 'all' && filteredLeaderboard.length >= 3 && (
            <div className="podium">
              {/* Second Place */}
              <div className="podium-item podium-second">
                <div className="podium-rank">🥈</div>
                <div className="podium-avatar">
                  {filteredLeaderboard[1].full_name.charAt(0).toUpperCase()}
                </div>
                <h3 className="podium-name">{filteredLeaderboard[1].full_name}</h3>
                <div className={`level-badge level-${getLevelColor(filteredLeaderboard[1].level)}`}>
                  {getLevelName(filteredLeaderboard[1].level)}
                </div>
                <div className="podium-points">{filteredLeaderboard[1].mastery_percent || 0}%</div>
                <div className="podium-stand podium-stand-2">2</div>
              </div>

              {/* First Place */}
              <div className="podium-item podium-first">
                <div className="podium-rank">🥇</div>
                <div className="podium-crown">👑</div>
                <div className="podium-avatar">
                  {filteredLeaderboard[0].full_name.charAt(0).toUpperCase()}
                </div>
                <h3 className="podium-name">{filteredLeaderboard[0].full_name}</h3>
                <div className={`level-badge level-${getLevelColor(filteredLeaderboard[0].level)}`}>
                  {getLevelName(filteredLeaderboard[0].level)}
                </div>
                <div className="podium-points">{filteredLeaderboard[0].mastery_percent || 0}%</div>
                <div className="podium-stand podium-stand-1">1</div>
              </div>

              {/* Third Place */}
              <div className="podium-item podium-third">
                <div className="podium-rank">🥉</div>
                <div className="podium-avatar">
                  {filteredLeaderboard[2].full_name.charAt(0).toUpperCase()}
                </div>
                <h3 className="podium-name">{filteredLeaderboard[2].full_name}</h3>
                <div className={`level-badge level-${getLevelColor(filteredLeaderboard[2].level)}`}>
                  {getLevelName(filteredLeaderboard[2].level)}
                </div>
                <div className="podium-points">{filteredLeaderboard[2].mastery_percent || 0}%</div>
                <div className="podium-stand podium-stand-3">3</div>
              </div>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="leaderboard-table">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Talaba</th>
                  <th>Daraja</th>
                  <th>O'zlashtirish</th>
                  <th>Testlar</th>
                  <th>O'rtacha</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((student, index) => (
                  <tr 
                    key={student.id} 
                    className={student.id === user.id ? 'current-user' : ''}
                  >
                    <td className="rank-cell">
                      <div className={`rank-badge rank-${index + 1}`}>
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </div>
                    </td>
                    <td className="student-cell">
                      <div className="student-info">
                        <div className="student-avatar">
                          {student.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="student-details">
                          <span className="student-name">
                            {student.full_name}
                            {student.id === user.id && (
                              <span className="badge badge-primary badge-sm">Siz</span>
                            )}
                          </span>
                          <span className="student-username">@{student.username}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={`level-badge level-${getLevelColor(student.level)}`}>
                        Daraja {student.level}
                      </div>
                    </td>
                    <td className="points-cell">
                      <strong>📊 {student.mastery_percent || 0}%</strong>
                    </td>
                    <td>{student.total_tests || 0}</td>
                    <td>
                      {student.average_score 
                        ? `${student.average_score.toFixed(1)}%` 
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Current User Position (if not in top visible) */}
          {user.role === 'student' && !filteredLeaderboard.find(s => s.id === user.id) && (
            <div className="current-user-card">
              <h3>Sizning pozitsiyangiz</h3>
              <div className="user-position">
                <div className="position-rank">#{leaderboard.findIndex(s => s.id === user.id) + 1}</div>
                <div className="position-info">
                  <h4>{user.full_name}</h4>
                  <p>{user.mastery_percent || 0}% • Daraja {user.level}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;
