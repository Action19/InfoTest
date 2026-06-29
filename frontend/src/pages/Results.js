import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Results = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    if (location.state?.resultId && location.state?.showDetails) {
      const result = results.find(r => r.id === location.state.resultId);
      if (result) {
        setSelectedResult(result);
      }
    }
  }, [results, location]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await api.get('/results/my-results');
      
      // Ensure response.data is an array
      const resultsData = Array.isArray(response.data) ? response.data : [];
      setResults(resultsData);
    } catch (error) {
      console.error('Error fetching results:', error);
      setResults([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getScoreClass = (percentage) => {
    if (percentage >= 85) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'average';
    return 'poor';
  };

  const getScoreLabel = (percentage) => {
    if (percentage >= 85) return 'A\'lo';
    if (percentage >= 70) return 'Yaxshi';
    if (percentage >= 50) return "O'rta";
    return 'Qoniqarsiz';
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
        <h1>Mening natijalarim</h1>
        <p className="subtitle">Topshirgan testlaringiz natijalari</p>
      </div>

      {results.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>Hali natijalar yo'q</h3>
          <p>Testlarni topshirishni boshlang!</p>
        </div>
      ) : (
        <div className="results-layout">
          <div className="results-list">
            {results.map((result) => (
              <div
                key={result.id}
                className={`result-card ${selectedResult?.id === result.id ? 'selected' : ''}`}
                onClick={() => setSelectedResult(result)}
              >
                <div className="result-header">
                  <h3>{result.test_title}</h3>
                  <span className={`score-badge score-${getScoreClass(result.score_percentage)}`}>
                    {result.score_percentage.toFixed(1)}%
                  </span>
                </div>
                
                <div className="result-info">
                  <div className="result-stat">
                    <span className="stat-label">Ball:</span>
                    <span className="stat-value">{result.score} / {result.total_questions}</span>
                  </div>
                  <div className="result-stat">
                    <span className="stat-label">Baho:</span>
                    <span className="stat-value">{getScoreLabel(result.score_percentage)}</span>
                  </div>
                  <div className="result-stat">
                    <span className="stat-label">Sana:</span>
                    <span className="stat-value">
                      {new Date(result.submitted_at).toLocaleString('uz-UZ')}
                    </span>
                  </div>
                </div>

                {result.passed !== null && (
                  <div className={`result-status ${result.passed ? 'passed' : 'failed'}`}>
                    {result.passed ? '✓ O\'tdi' : '✗ O\'tmadi'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedResult && (
            <div className="result-details">
              <div className="detail-header">
                <h2>{selectedResult.test_title}</h2>
                <button 
                  onClick={() => setSelectedResult(null)} 
                  className="btn btn-sm btn-outline"
                >
                  Yopish
                </button>
              </div>

              <div className="detail-summary">
                <div className={`score-circle score-${getScoreClass(selectedResult.score_percentage)}`}>
                  <div className="score-number">{selectedResult.score_percentage.toFixed(1)}%</div>
                  <div className="score-text">{getScoreLabel(selectedResult.score_percentage)}</div>
                </div>

                <div className="summary-stats">
                  <div className="summary-stat">
                    <div className="stat-icon">✓</div>
                    <div className="stat-content">
                      <div className="stat-number">{selectedResult.score}</div>
                      <div className="stat-label">To'g'ri javoblar</div>
                    </div>
                  </div>
                  <div className="summary-stat">
                    <div className="stat-icon">✗</div>
                    <div className="stat-content">
                      <div className="stat-number">
                        {selectedResult.total_questions - selectedResult.score}
                      </div>
                      <div className="stat-label">Noto'g'ri javoblar</div>
                    </div>
                  </div>
                  <div className="summary-stat">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-content">
                      <div className="stat-number">{selectedResult.points_earned}</div>
                      <div className="stat-label">Olingan ballar</div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedResult.detailed_answers && (
                <div className="detailed-answers">
                  <h3>Batafsil javoblar</h3>
                  {(() => {
                    try {
                      const answers = typeof selectedResult.detailed_answers === 'string' 
                        ? JSON.parse(selectedResult.detailed_answers) 
                        : selectedResult.detailed_answers;
                      
                      if (!Array.isArray(answers) || answers.length === 0) {
                        return <p className="text-secondary">Batafsil javoblar mavjud emas</p>;
                      }
                      
                      return answers.map((answer, index) => (
                        <div key={index} className={`answer-item ${answer.is_correct ? 'correct' : 'incorrect'}`}>
                          <div className="answer-header">
                            <span className="answer-number">Savol {index + 1}</span>
                            <span className={`answer-status ${answer.is_correct ? 'correct' : 'incorrect'}`}>
                              {answer.is_correct ? '✓ To\'g\'ri' : '✗ Noto\'g\'ri'}
                            </span>
                            <span className="answer-points">
                              {answer.is_correct ? answer.points : 0} / {answer.points} ball
                            </span>
                          </div>
                          
                          <div className="answer-content">
                            <p className="question-text">{answer.question_text || 'Savol matni mavjud emas'}</p>
                            
                            <div className="answer-details">
                              <div className="answer-row">
                                <strong>Sizning javobingiz:</strong>
                                <span className={answer.is_correct ? 'text-success' : 'text-danger'}>
                                  {answer.user_answer !== undefined && answer.user_answer !== null 
                                    ? String(answer.user_answer)
                                    : "(Javob berilmagan)"}
                                </span>
                              </div>
                              
                              {!answer.is_correct && answer.correct_answer && (
                                <div className="answer-row">
                                  <strong>To'g'ri javob:</strong>
                                  <span className="text-success">{answer.correct_answer}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ));
                    } catch (error) {
                      console.error('Error parsing detailed answers:', error);
                      return <p className="text-danger">Javoblarni yuklashda xatolik yuz berdi</p>;
                    }
                  })()}
                </div>
              )}

              {selectedResult.achievements_earned && (() => {
                try {
                  const achievements = typeof selectedResult.achievements_earned === 'string'
                    ? JSON.parse(selectedResult.achievements_earned)
                    : selectedResult.achievements_earned;
                  
                  if (Array.isArray(achievements) && achievements.length > 0) {
                    return (
                      <div className="achievements-section">
                        <h3>🏆 Qo'lga kiritilgan yutuqlar</h3>
                        <div className="achievements-list">
                          {achievements.map((achievement, index) => (
                            <div key={index} className="achievement-badge">
                              <span className="achievement-icon">{achievement.icon || '🏆'}</span>
                              <span className="achievement-name">{achievement.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                } catch (error) {
                  console.error('Error parsing achievements:', error);
                  return null;
                }
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Results;
