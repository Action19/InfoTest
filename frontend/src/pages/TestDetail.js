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
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'single_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1,
    explanation: ''
  });
  const [aiPrompt, setAiPrompt] = useState({
    topic: '',
    count: 5,
    difficulty: 'medium',
    questionType: 'single_choice'
  });
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    // Don't fetch if we're on create page
    if (id === 'create') {
      // Redirect to tests page - creation should happen from Tests page
      navigate('/tests');
      return;
    }
    fetchTestDetails();
  }, [id]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching test details for ID:', id);
      
      const [testRes, questionsRes, statsRes] = await Promise.all([
        api.get(`/tests/${id}`),
        api.get(`/questions/test/${id}`),
        api.get(`/tests/${id}/statistics`)
      ]);

      console.log('Test data:', testRes.data);
      console.log('Questions data:', questionsRes.data);
      console.log('Stats data:', statsRes.data);

      setTest(testRes.data);
      
      // Ensure questions is an array
      const questionsData = Array.isArray(questionsRes.data) ? questionsRes.data : [];
      console.log('Questions count:', questionsData.length);
      setQuestions(questionsData);
      
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

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    
    try {
      const questionData = {
        test_id: id,
        question_text: newQuestion.question_text,
        question_type: newQuestion.question_type,
        options: JSON.stringify(newQuestion.options),
        correct_answer: newQuestion.correct_answer,
        points: newQuestion.points,
        explanation: newQuestion.explanation
      };

      await api.post('/questions', questionData);
      alert('Savol muvaffaqiyatli qo\'shildi!');
      setShowAddQuestionModal(false);
      setNewQuestion({
        question_text: '',
        question_type: 'single_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        points: 1,
        explanation: ''
      });
      fetchTestDetails();
    } catch (error) {
      alert('Savol qo\'shishda xatolik: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleGenerateAI = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    
    try {
      console.log('Starting AI generation...');
      
      // AI orqali savol yaratish (backend'da implement qilinadi)
      const response = await api.post('/questions/generate-ai', {
        test_id: id,
        topic: aiPrompt.topic || test.subject,
        count: aiPrompt.count,
        difficulty: aiPrompt.difficulty,
        question_type: aiPrompt.questionType
      });
      
      console.log('AI generation response:', response.data);
      
      alert(`${response.data.count} ta savol muvaffaqiyatli yaratildi!`);
      setShowAIModal(false);
      setAiPrompt({
        topic: '',
        count: 5,
        difficulty: 'medium',
        questionType: 'single_choice'
      });
      
      // Force refresh test details
      console.log('Refreshing test details...');
      await fetchTestDetails();
      console.log('Test details refreshed, questions count:', questions.length);
      
    } catch (error) {
      console.error('AI generation error:', error);
      alert('AI savol yaratishda xatolik: ' + (error.response?.data?.error || error.message));
    } finally {
      setAiLoading(false);
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
                <div className="action-buttons">
                  <button className="btn btn-primary" onClick={() => setShowAddQuestionModal(true)}>
                    ➕ Savol qo'shish
                  </button>
                  <button className="btn btn-success" onClick={() => setShowAIModal(true)}>
                    🤖 AI bilan yaratish
                  </button>
                </div>
              )}
            </div>
          )}

          {questions.length > 0 && (user.role === 'teacher' || user.role === 'admin') && (
            <div className="action-buttons" style={{marginTop: '20px'}}>
              <button className="btn btn-primary" onClick={() => setShowAddQuestionModal(true)}>
                ➕ Savol qo'shish
              </button>
              <button className="btn btn-success" onClick={() => setShowAIModal(true)}>
                🤖 AI bilan yaratish
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Question Modal */}
      {showAddQuestionModal && (
        <div className="modal-overlay" onClick={() => setShowAddQuestionModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Savol qo'shish</h2>
              <button className="close-btn" onClick={() => setShowAddQuestionModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddQuestion} className="modal-form">
              <div className="form-group">
                <label htmlFor="question_text">Savol matni *</label>
                <textarea
                  id="question_text"
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                  placeholder="Savolingizni kiriting..."
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="question_type">Savol turi</label>
                  <select
                    id="question_type"
                    value={newQuestion.question_type}
                    onChange={(e) => setNewQuestion({...newQuestion, question_type: e.target.value})}
                  >
                    <option value="single_choice">Bir tanlovli</option>
                    <option value="multiple_choice">Ko'p tanlovli</option>
                    <option value="true_false">To'g'ri/Noto'g'ri</option>
                    <option value="short_answer">Qisqa javob</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="points">Ballar *</label>
                  <input
                    type="number"
                    id="points"
                    value={newQuestion.points}
                    onChange={(e) => setNewQuestion({...newQuestion, points: parseInt(e.target.value)})}
                    min="1"
                    max="10"
                    required
                  />
                </div>
              </div>

              {(newQuestion.question_type === 'single_choice' || newQuestion.question_type === 'multiple_choice') && (
                <div className="form-group">
                  <label>Javob variantlari *</label>
                  {newQuestion.options.map((option, index) => (
                    <input
                      key={index}
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newQuestion.options];
                        newOptions[index] = e.target.value;
                        setNewQuestion({...newQuestion, options: newOptions});
                      }}
                      placeholder={`Variant ${index + 1}`}
                      required
                      style={{marginBottom: '10px'}}
                    />
                  ))}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="correct_answer">To'g'ri javob *</label>
                <input
                  type="text"
                  id="correct_answer"
                  value={newQuestion.correct_answer}
                  onChange={(e) => setNewQuestion({...newQuestion, correct_answer: e.target.value})}
                  placeholder="To'g'ri javobni kiriting"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="explanation">Tushuntirish (ixtiyoriy)</label>
                <textarea
                  id="explanation"
                  value={newQuestion.explanation}
                  onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                  placeholder="Javob haqida tushuntirish..."
                  rows="2"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddQuestionModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAIModal && (
        <div className="modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🤖 AI bilan savol yaratish</h2>
              <button className="close-btn" onClick={() => setShowAIModal(false)}>✕</button>
            </div>
            <form onSubmit={handleGenerateAI} className="modal-form">
              <div className="form-group">
                <label htmlFor="topic">Mavzu *</label>
                <input
                  type="text"
                  id="topic"
                  value={aiPrompt.topic}
                  onChange={(e) => setAiPrompt({...aiPrompt, topic: e.target.value})}
                  placeholder={`Masalan: ${test.subject} - algebraik tenglamalar`}
                  required
                />
                <small>AI ushbu mavzu bo'yicha savollar yaratadi</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="count">Savollar soni *</label>
                  <input
                    type="number"
                    id="count"
                    value={aiPrompt.count}
                    onChange={(e) => setAiPrompt({...aiPrompt, count: parseInt(e.target.value)})}
                    min="1"
                    max="20"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ai_difficulty">Qiyinlik</label>
                  <select
                    id="ai_difficulty"
                    value={aiPrompt.difficulty}
                    onChange={(e) => setAiPrompt({...aiPrompt, difficulty: e.target.value})}
                  >
                    <option value="easy">Oson</option>
                    <option value="medium">O'rta</option>
                    <option value="hard">Qiyin</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="ai_type">Savol turi</label>
                <select
                  id="ai_type"
                  value={aiPrompt.questionType}
                  onChange={(e) => setAiPrompt({...aiPrompt, questionType: e.target.value})}
                >
                  <option value="single_choice">Bir tanlovli</option>
                  <option value="multiple_choice">Ko'p tanlovli</option>
                  <option value="true_false">To'g'ri/Noto'g'ri</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAIModal(false)} disabled={aiLoading}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-success" disabled={aiLoading}>
                  {aiLoading ? 'Yaratilmoqda...' : '🤖 Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDetail;
