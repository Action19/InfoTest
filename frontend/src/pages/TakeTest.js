import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTest();
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const [testRes, questionsRes] = await Promise.all([
        api.get(`/tests/${id}`),
        api.get(`/questions/test/${id}`)
      ]);

      setTest(testRes.data);
      setQuestions(questionsRes.data);
      setTimeLeft(testRes.data.time_limit * 60); // Convert to seconds
    } catch (error) {
      console.error('Error fetching test:', error);
      alert('Testni yuklashda xatolik yuz berdi');
      navigate('/tests');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value
    });
  };

  const handleMultipleChoice = (questionId, optionIndex) => {
    const currentAnswers = answers[questionId] || [];
    const newAnswers = currentAnswers.includes(optionIndex)
      ? currentAnswers.filter(i => i !== optionIndex)
      : [...currentAnswers, optionIndex];
    
    setAnswers({
      ...answers,
      [questionId]: newAnswers
    });
  };

  const handleSubmit = async () => {
    if (!window.confirm("Testni tugatib, javoblarni yuborishni tasdiqlaysizmi?")) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Format answers for submission
      const formattedAnswers = questions.map(q => {
        const answer = answers[q.id];
        let formattedAnswer = '';

        if (q.question_type === 'multiple_choice') {
          formattedAnswer = Array.isArray(answer) ? answer.sort().join(',') : '';
        } else if (q.question_type === 'matching') {
          formattedAnswer = answer ? JSON.stringify(answer) : '';
        } else {
          formattedAnswer = answer !== undefined ? String(answer) : '';
        }

        return {
          question_id: q.id,
          answer: formattedAnswer
        };
      });

      const response = await api.post('/results/submit', {
        test_id: parseInt(id),
        answers: formattedAnswers
      });

      // Navigate to results page
      navigate('/results', { 
        state: { 
          resultId: response.data.id,
          showDetails: true 
        } 
      });
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Javoblarni yuborishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const answeredCount = Object.keys(answers).length;
    return Math.round((answeredCount / questions.length) * 100);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Test yuklanmoqda...</p>
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <div className="error-container">
        <h2>Test topilmadi</h2>
        <button onClick={() => navigate('/tests')} className="btn btn-primary">
          Testlarga qaytish
        </button>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="take-test-container">
      <div className="test-header">
        <div className="test-info">
          <h2>{test.title}</h2>
          <div className="test-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
            <span className="progress-text">
              {Object.keys(answers).length} / {questions.length} javoblangan
            </span>
          </div>
        </div>
        
        <div className="test-timer">
          <div className={`timer ${timeLeft < 300 ? 'timer-warning' : ''}`}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="test-body">
        <div className="question-navigation">
          <h3>Savollar</h3>
          <div className="question-grid">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`question-nav-btn ${
                  currentQuestion === index ? 'active' : ''
                } ${
                  answers[q.id] !== undefined ? 'answered' : ''
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleSubmit} 
            className="btn btn-success btn-block"
            disabled={submitting}
          >
            {submitting ? 'Yuborilmoqda...' : 'Testni tugatish'}
          </button>
        </div>

        <div className="question-content">
          <div className="question-header">
            <span className="question-number">Savol {currentQuestion + 1} / {questions.length}</span>
            <span className="question-points">{question.points} ball</span>
          </div>

          <div className="question-text">
            <h3>{question.question_text}</h3>
          </div>

          <div className="answer-section">
            {question.question_type === 'single_choice' && (
              <div className="options-list">
                {JSON.parse(question.options).map((option, index) => (
                  <label key={index} className="option-item">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={index}
                      checked={answers[question.id] === index}
                      onChange={() => handleAnswerChange(question.id, index)}
                    />
                    <span className="option-text">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.question_type === 'multiple_choice' && (
              <div className="options-list">
                {JSON.parse(question.options).map((option, index) => (
                  <label key={index} className="option-item">
                    <input
                      type="checkbox"
                      value={index}
                      checked={(answers[question.id] || []).includes(index)}
                      onChange={() => handleMultipleChoice(question.id, index)}
                    />
                    <span className="option-text">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.question_type === 'true_false' && (
              <div className="options-list">
                <label className="option-item">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value="true"
                    checked={answers[question.id] === 'true'}
                    onChange={() => handleAnswerChange(question.id, 'true')}
                  />
                  <span className="option-text">To'g'ri</span>
                </label>
                <label className="option-item">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value="false"
                    checked={answers[question.id] === 'false'}
                    onChange={() => handleAnswerChange(question.id, 'false')}
                  />
                  <span className="option-text">Noto'g'ri</span>
                </label>
              </div>
            )}

            {question.question_type === 'short_answer' && (
              <input
                type="text"
                className="answer-input"
                placeholder="Javobingizni kiriting..."
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              />
            )}

            {question.question_type === 'code_writing' && (
              <textarea
                className="code-input"
                placeholder="Kodni kiriting..."
                rows={10}
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              />
            )}

            {question.question_type === 'matching' && (
              <div className="matching-section">
                <p className="hint">Chap va o'ng ustunlarni moslang</p>
                {JSON.parse(question.options).left.map((leftItem, index) => (
                  <div key={index} className="matching-row">
                    <div className="matching-left">{leftItem}</div>
                    <select
                      className="matching-select"
                      value={answers[question.id]?.[index] || ''}
                      onChange={(e) => {
                        const newAnswers = { ...(answers[question.id] || {}) };
                        newAnswers[index] = e.target.value;
                        handleAnswerChange(question.id, newAnswers);
                      }}
                    >
                      <option value="">Tanlang...</option>
                      {JSON.parse(question.options).right.map((rightItem, idx) => (
                        <option key={idx} value={rightItem}>
                          {rightItem}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="question-navigation-buttons">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="btn btn-outline"
            >
              ← Oldingi
            </button>
            <button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === questions.length - 1}
              className="btn btn-outline"
            >
              Keyingi →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeTest;
