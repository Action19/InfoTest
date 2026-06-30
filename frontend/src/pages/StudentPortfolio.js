import React, { useState, useEffect } from 'react';
import '../assets/css/Pages.css';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../assets/css/Pages.css';
import { useAuth } from '../context/AuthContext';
import '../assets/css/Pages.css';
import api from '../services/api';
import '../assets/css/Pages.css';

const StudentPortfolio = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (user.role === 'student') {
      navigate('/portfolio');
      return;
    }
    fetchStudentData();
  }, [userId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [userRes, portfolioRes, statsRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/portfolio/${userId}`),
        api.get(`/statistics/user/${userId}`)
      ]);

      setStudent(userRes.data);
      
      const items = Array.isArray(portfolioRes.data.portfolio) 
        ? portfolioRes.data.portfolio 
        : [];
      setPortfolioItems(items);
      
      if (statsRes.data && statsRes.data.achievements) {
        setAchievements(statsRes.data.achievements);
      }
      
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching student data:', error);
      alert('Talaba ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const getLevelColor = (level) => {
    const colors = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    return colors[level - 1] || 'bronze';
  };

  const getCategoryIcon = (itemType) => {
    const icons = {
      project: '💻',
      achievement: '⭐',
      test_result: '📊',
      certificate: '🏆'
    };
    return icons[itemType] || '📌';
  };

  const getItemTypeLabel = (type) => {
    const labels = {
      project: 'Loyiha',
      test_result: 'Test natijasi',
      certificate: 'Sertifikat',
      achievement: 'Yutuq'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="error-container">
        <h2>Talaba topilmadi</h2>
        <Link to="/students" className="btn btn-primary">Orqaga</Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/students" className="back-link">← Orqaga</Link>
        <h1>{student.full_name || student.username} - Portfolio</h1>
        <p className="subtitle">@{student.username}</p>
      </div>

      <div className="portfolio-stats">
        <div className="stat-card stat-level">
          <div className={`level-badge-large level-${getLevelColor(student.level)}`}>
            <div className="level-number">Daraja {student.level}</div>
            <div className="level-name">{getLevelColor(student.level).toUpperCase()}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{student.points}</h3>
            <p>Jami ballar</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats?.totalAttempts || 0}</h3>
            <p>Topshirilgan testlar</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats?.averageScore ? `${stats.averageScore.toFixed(1)}%` : '0%'}</h3>
            <p>O'rtacha ball</p>
          </div>
        </div>
      </div>

      {achievements.length > 0 && (
        <div className="section">
          <h2>🏆 Yutuqlar</h2>
          <div className="achievements-grid">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="achievement-card">
                <div className="achievement-icon-large">{achievement.icon || '🏆'}</div>
                <h3>{achievement.title}</h3>
                <p>{achievement.description}</p>
                <div className="achievement-date">
                  {new Date(achievement.earned_at).toLocaleDateString('uz-UZ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <h2>💼 Portfolio elementlari</h2>

        {portfolioItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💼</div>
            <h3>Portfolio bo'sh</h3>
            <p>Talaba hali hech narsa qo'shmagan</p>
          </div>
        ) : (
          <div className="portfolio-grid">
            {portfolioItems.map((item) => (
              <div 
                key={item.id} 
                className="portfolio-card"
                onClick={() => handleViewDetails(item)}
                style={{ cursor: 'pointer' }}
              >
                <div className="portfolio-header">
                  <span className="portfolio-icon">{getCategoryIcon(item.item_type)}</span>
                </div>
                <h3>{item.title}</h3>
                <p className="portfolio-description">
                  {item.description?.length > 100 
                    ? item.description.substring(0, 100) + '...' 
                    : item.description}
                </p>
                <div className="portfolio-footer">
                  <span className="portfolio-category">{getItemTypeLabel(item.item_type)}</span>
                  <span className="portfolio-date">
                    {new Date(item.created_at).toLocaleDateString('uz-UZ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>{getCategoryIcon(selectedItem.item_type)}</span>
                <div>
                  <h2 style={{ margin: 0 }}>{selectedItem.title}</h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {getItemTypeLabel(selectedItem.item_type)}
                  </p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ padding: '2rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Tavsif</label>
                <p style={{ lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  {selectedItem.description || 'Tavsif kiritilmagan'}
                </p>
              </div>

              {selectedItem.content && (
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Qo'shimcha ma'lumot</label>
                  <div style={{ 
                    padding: '1rem', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderRadius: 'var(--border-radius)',
                    lineHeight: 1.6
                  }}>
                    {typeof selectedItem.content === 'string' 
                      ? selectedItem.content 
                      : JSON.stringify(selectedItem.content, null, 2)}
                  </div>
                </div>
              )}

              {selectedItem.file_url && (
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Havola</label>
                  <a 
                    href={selectedItem.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span>🔗</span>
                    <span>Havolani ochish</span>
                  </a>
                </div>
              )}

              <div className="form-group" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span>Yaratilgan:</span>
                  <span>{new Date(selectedItem.created_at).toLocaleString('uz-UZ')}</span>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setShowDetailModal(false)}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPortfolio;
