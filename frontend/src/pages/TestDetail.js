import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestDetails();
  }, [id]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const [testRes, questionsRes, statsRes] = await Promise.all([
        api.get(`/tests/${id}`),
        api.get(`/questions/test/${id}`),
        api.get(`/tests/${id}/statistics`)
      ]);

      setTest(testRes.data);
      setQuestions(questionsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching test details:', error);
      alert('Testni yuklashda xatolik yuz berdi');
      navigate('/tests');
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    if (window.confirm("Testni boshlaysizmi? Vaqt hisoblash boshlanadi!")) {
      navigate(`/take-test/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="error-container">
        <h2>Test topilmadi</h2>
        <Link to="/tests" className="btn btn-primary">Testlarga qaytish</Link>
      </div>
    );
  }

  const getQuestionTypeLabel = (type) => {
    const types = {
      single_choice: "Bir tanlovli",
      multiple_choice: "Ko'p tanlovli",
      true_false: "To'g'ri/Noto'g'ri",
      short_answer: "Qisqa javob",
      code_writing: "Kod yozish",
      matching: "Moslashtirish"
    };
    return types[type] || type;
  };

  return (
    <div className="page-container">
      <div className="test-detail-header">
        <Link to="/tests" className="back-link">← Orqaga</Link>
        
        <div className="test-title-section">
          <h1>{test.title}</h1>
          <div className="test-badges">
            <span className={`badge ${test.is_published ? 'badge-success' : 'badge-secondary'}`}>
              {test.is_published ? 'Nashr qilingan' : 'Qoralama'}
            </span>
            <span className="badge badge-info">{questions.length} savol</span>
            <span className="badge badge-warning">⏱️ {test.time_limit} daqiqa</span>
          </div>
        </div>
      </div>

      <div className="test-detail-content">
        <div className="test-info-section">
          <div className="info-card">
            <h3>Test haqida</h3>
            <p>{test.description || "Ta'rif kiritilmagan"}</p>
            
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Savollar soni:</span>
                <span className="info-value">{questions.length}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Vaqt:</span>
                <span className="info-value">{test.time_limit} daqiqa</span>
              </div>
              {test.passing_score && (
                <div className="info-item">
                  <span className="info-label">O'tish bali:</span>
                  <span className="info-value">{test.passing_score}%</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Yaratilgan:</span>
                <span className="info-value">
                  {new Date(test.created_at).toLocaleDateString('uz-UZ')}
                </span>
              </div>
            </div>
          </div>

          {stats && (
            <div className="info-card">
              <h3>Statistika</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">{stats.totalAttempts || 0}</div>
                  <div className="stat-label">Jami urinishlar</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">
                    {stats.averageScore ? `${stats.averageScore.toFixed(1)}%` : '0%'}
                  </div>
                  <div className="stat-label">O'rtacha ball</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">
                    {stats.highestScore ? `${stats.highestScore}%` : '0%'}
                  </div>
                  <div className="stat-label">Eng yuqori ball</div>
                </div>
              </div>
            </div>
          )}

          {user.role === 'student' && (
            <div className="start-test-section">
              <button onClick={startTest} className="btn btn-primary btn-lg btn-block">
                🚀 Testni boshlash
              </button>
              <p className="test-warning">
                ⚠️ Test boshlanishi bilan vaqt hisoblash boshlanadi. Testni tugatishdan oldin sahifani yopmang!
              </p>
            </div>
          )}
        </div>

        <div className="questions-preview-section">
          <h3>Savollar tuzilishi</h3>
          <div className="questions-list">
            {questions.map((question, index) => (
              <div key={question.id} className="question-preview-item">
                <div className="question-number">#{index + 1}</div>
                <div className="question-info">
                  <div className="question-type-badge">
                    {getQuestionTypeLabel(question.question_type)}
                  </div>
                  <div className="question-points">
                    {question.points} ball
                  </div>
                </div>
              </div>
            ))}
          </div>

          {questions.length === 0 && (
            <div className="empty-state">
              <p>Bu testda hali savollar yo'q</p>
              {(user.role === 'teacher' || user.role === 'admin') && (
                <button className="btn btn-primary">Savol qo'shish</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestDetail;
