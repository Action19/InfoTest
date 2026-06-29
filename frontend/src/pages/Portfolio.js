import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Portfolio = () => {
  const { user } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
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
      fetchPortfolio();
    } catch (error) {
      alert("O'chirishda xatolik yuz berdi");
    }
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
              <div key={item.id} className="portfolio-card">
                <div className="portfolio-header">
                  <span className="portfolio-icon">{getCategoryIcon(item.item_type)}</span>
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    className="btn-delete-small"
                  >
                    ✕
                  </button>
                </div>
                <h3>{item.title}</h3>
                <p className="portfolio-description">{item.description}</p>
                {item.file_url && (
                  <a 
                    href={item.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="portfolio-link"
                  >
                    Ko'rish →
                  </a>
                )}
                <div className="portfolio-date">
                  {new Date(item.created_at).toLocaleDateString('uz-UZ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
