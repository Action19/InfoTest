import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Tests = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, published, draft
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTests();
  }, [filter]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tests');
      
      // Ensure response.data is an array
      let filteredTests = Array.isArray(response.data) ? response.data : [];

      // Apply filters
      if (user.role === 'student') {
        // Students only see published tests
        filteredTests = filteredTests.filter(test => test.is_published);
      } else if (filter === 'published') {
        filteredTests = filteredTests.filter(test => test.is_published);
      } else if (filter === 'draft') {
        filteredTests = filteredTests.filter(test => !test.is_published);
      }

      setTests(filteredTests);
    } catch (error) {
      console.error('Error fetching tests:', error);
      setTests([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testId) => {
    if (!window.confirm("Testni o'chirishni tasdiqlaysizmi?")) {
      return;
    }

    try {
      await api.delete(`/tests/${testId}`);
      fetchTests();
    } catch (error) {
      alert("Testni o'chirishda xatolik yuz berdi");
    }
  };

  const handlePublish = async (testId, currentStatus) => {
    try {
      if (currentStatus) {
        await api.put(`/tests/${testId}/unpublish`);
      } else {
        await api.put(`/tests/${testId}/publish`);
      }
      fetchTests();
    } catch (error) {
      alert("Testni nashr qilishda xatolik yuz berdi");
    }
  };

  const filteredTests = tests.filter(test =>
    test.title.toLowerCase().includes(search.toLowerCase()) ||
    test.description?.toLowerCase().includes(search.toLowerCase())
  );

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
        <div>
          <h1>Testlar</h1>
          <p className="subtitle">
            {user.role === 'student' 
              ? "Mavjud testlarni toping va topshiring" 
              : "Testlarni boshqaring va yangilarini yarating"}
          </p>
        </div>
        {(user.role === 'teacher' || user.role === 'admin') && (
          <Link to="/tests/create" className="btn btn-primary">
            ➕ Yangi test
          </Link>
        )}
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Testlarni qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {user.role !== 'student' && (
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Barchasi ({tests.length})
            </button>
            <button
              className={`filter-tab ${filter === 'published' ? 'active' : ''}`}
              onClick={() => setFilter('published')}
            >
              Nashr qilingan ({tests.filter(t => t.is_published).length})
            </button>
            <button
              className={`filter-tab ${filter === 'draft' ? 'active' : ''}`}
              onClick={() => setFilter('draft')}
            >
              Qoralama ({tests.filter(t => !t.is_published).length})
            </button>
          </div>
        )}
      </div>

      {filteredTests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>Testlar topilmadi</h3>
          <p>
            {search 
              ? "Qidiruv bo'yicha natijalar topilmadi" 
              : user.role === 'student'
                ? "Hozircha hech qanday test nashr qilinmagan"
                : "Hozircha hech qanday test yaratilmagan"}
          </p>
          {user.role !== 'student' && !search && (
            <Link to="/tests/create" className="btn btn-primary">
              Birinchi testni yaratish
            </Link>
          )}
        </div>
      ) : (
        <div className="tests-grid">
          {filteredTests.map((test) => (
            <div key={test.id} className="test-card">
              <div className="test-card-header">
                <h3>{test.title}</h3>
                <span className={`badge ${test.is_published ? 'badge-success' : 'badge-secondary'}`}>
                  {test.is_published ? 'Nashr qilingan' : 'Qoralama'}
                </span>
              </div>

              <p className="test-description">{test.description || "Ta'rif kiritilmagan"}</p>

              <div className="test-meta">
                <div className="meta-item">
                  <span className="meta-icon">❓</span>
                  <span>{test.questions_count || 0} savol</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">⏱️</span>
                  <span>{test.time_limit} daqiqa</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">📊</span>
                  <span>{test.attempts_count || 0} ta urinish</span>
                </div>
              </div>

              {test.passing_score && (
                <div className="passing-score">
                  O'tish bali: <strong>{test.passing_score}%</strong>
                </div>
              )}

              <div className="test-actions">
                {user.role === 'student' ? (
                  <Link to={`/tests/${test.id}`} className="btn btn-primary btn-block">
                    Testni boshlash
                  </Link>
                ) : (
                  <>
                    <Link to={`/tests/${test.id}`} className="btn btn-outline">
                      Ko'rish
                    </Link>
                    <button
                      onClick={() => handlePublish(test.id, test.is_published)}
                      className={`btn ${test.is_published ? 'btn-warning' : 'btn-success'}`}
                    >
                      {test.is_published ? 'Yashirish' : 'Nashr qilish'}
                    </button>
                    <button
                      onClick={() => handleDelete(test.id)}
                      className="btn btn-danger"
                    >
                      O'chirish
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tests;
