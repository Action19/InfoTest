import React, { useState, useEffect } from 'react';
import '../assets/css/Pages.css';
import { useAuth } from '../context/AuthContext';
import '../assets/css/Pages.css';
import api from '../services/api';
import '../assets/css/Pages.css';

const Portfolio = () => {
  const { user } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    item_type: 'project',
    file_url: ''
  });

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const [portfolioRes, statsRes] = await Promise.all([
        api.get('/portfolio'),
        api.get(`/statistics/user/${user.id}`)
      ]);

      const items = Array.isArray(portfolioRes.data) ? portfolioRes.data : [];
      setPortfolioItems(items);
      
      // Get achievements from stats response
      if (statsRes.data && statsRes.data.achievements) {
        setAchievements(statsRes.data.achievements);
      }
      
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setPortfolioItems([]);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/portfolio', formData);
      alert('Portfolio element muvaffaqiyatli qo\'shildi!');
      setShowAddForm(false);
      setFormData({
        title: '',
        description: '',
        item_type: 'project',
        file_url: ''
      });
      fetchPortfolio();
    } catch (error) {
      alert("Portfolio qo'shishda xatolik: " + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu elementni o'chirishni tasdiqlaysizmi?")) {
      return;
    }

    try {
      await api.delete(`/portfolio/${id}`);
      alert('Element o\'chirildi!');
      fetchPortfolio();
    } catch (error) {
      alert("O'chirishda xatolik: " + (error.response?.data?.error || error.message));
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
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
        <h1>Mening Portfoliom</h1>
        <p className="subtitle">Yutuqlarim va ishlarim</p>
      </div>

      <div className="portfolio-stats">
        <div className="stat-card stat-level">
          <div className={`level-badge-large level-${getLevelColor(user.level)}`}>
            <div className="level-number">Daraja {user.level}</div>
            <div className="level-name">{getLevelColor(user.level).toUpperCase()}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{user.points}</h3>
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
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>{achievements.length}</h3>
            <p>Yutuqlar</p>
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
        <div className="section-header">
          <h2>💼 Portfolio elementlari</h2>
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="btn btn-primary"
          >
            {showAddForm ? 'Bekor qilish' : '+ Qo\'shish'}
          </button>
        </div>

        {showAddForm && (
          <div className="add-form-card">
            <h3>Yangi element qo'shish</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Sarlavha</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Element sarlavhasi"
                  required
                />
              </div>

              <div className="form-group">
                <label>Kategoriya</label>
                <select
                  value={formData.item_type}
                  onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                >
                  <option value="project">Loyiha</option>
                  <option value="test_result">Test natijasi</option>
                  <option value="certificate">Sertifikat</option>
                  <option value="achievement">Yutuq</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tavsif</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Element tavsifi"
                  rows={4}
                  required
                />
              </div>

              <div className="form-group">
                <label>Havola (ixtiyoriy)</label>
                <input
                  type="url"
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Saqlash
              </button>
            </form>
          </div>
        )}

        {portfolioItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💼</div>
            <h3>Portfolio bo'sh</h3>
            <p>Yutuqlaringizni va ishlaringizni qo'shing!</p>
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
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }} 
                    className="btn-delete-small"
                  >
                    ✕
                  </button>
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
                className="btn btn-danger" 
                onClick={() => {
                  setShowDetailModal(false);
                  handleDelete(selectedItem.id);
                }}
              >
                🗑️ O'chirish
              </button>
              <div style={{ flex: 1 }}></div>
              <button 
                type="button" 
                className="btn btn-outline" 
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

export default Portfolio;
