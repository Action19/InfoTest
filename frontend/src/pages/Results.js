import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../assets/css/Pages.css';

// ─── Helpers ─────────────────────────────────────────────────
const getMedal = (grade) => ({ 5: '🥇', 4: '🥈', 3: '🥉', 2: '😢' }[grade] || '');
const getMedalLabel = (grade) => ({
  5: 'Oltin medal', 4: 'Kumush medal', 3: 'Bronza medal', 2: 'Qizil stiker'
}[grade] || '');
const getGradeColor = (grade) => ({
  5: '#f59e0b', 4: '#6366f1', 3: '#92400e', 2: '#dc2626'
}[grade] || '#6b7280');
const getGradeBg = (grade) => ({
  5: 'rgba(245,158,11,0.1)', 4: 'rgba(99,102,241,0.1)',
  3: 'rgba(146,64,14,0.1)', 2: 'rgba(220,38,38,0.1)'
}[grade] || 'rgba(107,114,128,0.1)');

const getScoreClass  = (pct) => pct >= 85 ? 'excellent' : pct >= 70 ? 'good' : pct >= 50 ? 'average' : 'poor';
const getScoreLabel  = (pct) => pct >= 85 ? "A'lo" : pct >= 70 ? 'Yaxshi' : pct >= 50 ? "O'rta" : 'Qoniqarsiz';

// ─── Tabs ─────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: '📊 Umumiy', icon: '📊' },
  { id: 'tests',    label: '📝 Testlar', icon: '📝' },
  { id: 'lessons',  label: '🎓 Darslar', icon: '🎓' },
];

const Results = () => {
  const { user } = useAuth();
  const location = useLocation();
  const fromLessonId = location.state?.lessonId;

  const [activeTab, setActiveTab]       = useState('overview');
  const [results, setResults]           = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [lessonProgresses, setLessonProgresses] = useState([]);
  const [summary, setSummary]           = useState(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([fetchResults(), fetchLessonProgresses()])
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!location.state?.showDetails || results.length === 0) return;
    const r = results.find(x =>
      x.attempt_id === location.state.resultId || x.id === location.state.resultId
    ) || results[0];
    setSelectedResult(r);
    setActiveTab('tests');
  }, [results, location]);

  const fetchResults = async () => {
    try {
      const res = await api.get('/results/my-results');
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch { setResults([]); }
  };

  const fetchLessonProgresses = async () => {
    try {
      const res = await api.get('/lesson-progress/student/all');
      setLessonProgresses(res.data.progresses || []);
      setSummary(res.data.summary || null);
    } catch { setLessonProgresses([]); }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  // Yillik hisoblar
  const totalTestPoints  = results.reduce((s, r) => s + (r.correct_answers || 0) * 2, 0);
  const avgTestPct       = results.length
    ? Math.round(results.reduce((s, r) => s + (r.score_percentage || 0), 0) / results.length)
    : 0;
  const totalGradePoints = summary?.total_grade_points || 0;
  const medals           = summary?.medals || { gold: 0, silver: 0, bronze: 0, red: 0 };

  return (
    <div className="page-container">

      {/* ── Header ── */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>Mening natijalarim</h1>
          <p className="subtitle">Testlar, darslar va medallar</p>
        </div>
        {fromLessonId && (
          <Link to={`/lessons/${fromLessonId}`} className="btn btn-outline">
            ← Darsga qaytish
          </Link>
        )}
      </div>

      {/* ── Yillik statistika kartochkalari ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {/* Umumiy ball */}
        <div style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: '14px', padding: '1.2rem', color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{user?.points || 0}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.25rem' }}>⭐ Umumiy ball</div>
        </div>

        {/* Darslar */}
        <div style={{ background: 'linear-gradient(135deg,#11998e,#38ef7d)', borderRadius: '14px', padding: '1.2rem', color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{lessonProgresses.length}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.25rem' }}>🎓 Darslar bajarildi</div>
        </div>

        {/* Testlar */}
        <div style={{ background: 'linear-gradient(135deg,#f093fb,#f5576c)', borderRadius: '14px', padding: '1.2rem', color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{results.length}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.25rem' }}>📝 Testlar topshirildi</div>
        </div>

        {/* O'rtacha test foizi */}
        <div style={{ background: 'linear-gradient(135deg,#4facfe,#00f2fe)', borderRadius: '14px', padding: '1.2rem', color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{avgTestPct}%</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.25rem' }}>📊 O'rtacha test bali</div>
        </div>
      </div>

      {/* ── Medallar vitrinasi ── */}
      {(medals.gold + medals.silver + medals.bronze + medals.red) > 0 && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem' }}>🏆 Medal vitrinasi</h3>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {medals.gold > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem' }}>🥇</div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#f59e0b' }}>×{medals.gold}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Oltin</div>
              </div>
            )}
            {medals.silver > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem' }}>🥈</div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#6366f1' }}>×{medals.silver}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Kumush</div>
              </div>
            )}
            {medals.bronze > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem' }}>🥉</div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#92400e' }}>×{medals.bronze}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Bronza</div>
              </div>
            )}
            {medals.red > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem' }}>😢</div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#dc2626' }}>×{medals.red}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Qizil</div>
              </div>
            )}
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                +{totalGradePoints}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                darslardan qo'shilgan ball
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab navigation ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.6rem 1.25rem',
              border: 'none', cursor: 'pointer',
              background: 'transparent',
              borderBottom: activeTab === tab.id ? '3px solid var(--primary-color)' : '3px solid transparent',
              color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 700 : 400,
              fontSize: '0.9rem',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════ OVERVIEW TAB ════════════ */}
      {activeTab === 'overview' && (
        <div>
          {lessonProgresses.length === 0 && results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>Hali natijalar yo'q</h3>
              <p>Darslarga kiring, testlar topshing va topshiriqlarni bajaring!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1rem' }}>
              {/* So'nggi test natijalari */}
              {results.slice(0, 5).map(r => (
                <div key={r.id} onClick={() => { setSelectedResult(r); setActiveTab('tests'); }}
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>📝 {r.test_title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(r.submitted_at).toLocaleDateString('uz-UZ')}
                      </div>
                    </div>
                    <span className={`score-badge score-${getScoreClass(r.score_percentage)}`}>
                      {r.score_percentage?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              {/* So'nggi dars natijalari */}
              {lessonProgresses.slice(0, 5).map(lp => (
                <Link key={lp.id} to={`/lessons/${lp.lesson_id}`}
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textDecoration: 'none', display: 'block', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        🎓 {lp.lesson_title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {lp.lesson_grade}-sinf • {lp.subject}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.4rem' }}>{getMedal(lp.grade)}</div>
                      <div style={{ fontSize: '0.72rem', color: getGradeColor(lp.grade), fontWeight: 600 }}>
                        {lp.grade > 0 ? `${lp.grade} baho` : '—'}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(lp.percent, 100)}%`, background: 'linear-gradient(90deg,var(--primary-color),var(--secondary-color))', borderRadius: '99px' }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    {lp.percent}% • {lp.earned_score}/{lp.total_possible} ball
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════ TESTS TAB ════════════ */}
      {activeTab === 'tests' && (
        <div>
          {results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>Hali testlar topshirilmagan</h3>
            </div>
          ) : (
            <div className="results-layout">
              <div className="results-list">
                {results.map(result => (
                  <div key={result.id}
                    className={`result-card ${selectedResult?.id === result.id ? 'selected' : ''}`}
                    onClick={() => setSelectedResult(result)}>
                    <div className="result-header">
                      <h3>{result.test_title}</h3>
                      <span className={`score-badge score-${getScoreClass(result.score_percentage)}`}>
                        {result.score_percentage?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="result-info">
                      <div className="result-stat">
                        <span className="stat-label">Ball:</span>
                        <span className="stat-value">{result.correct_answers} / {result.total_questions}</span>
                      </div>
                      <div className="result-stat">
                        <span className="stat-label">Baho:</span>
                        <span className="stat-value">{getScoreLabel(result.score_percentage)}</span>
                      </div>
                      <div className="result-stat">
                        <span className="stat-label">Sana:</span>
                        <span className="stat-value">{new Date(result.submitted_at).toLocaleString('uz-UZ')}</span>
                      </div>
                    </div>
                    {result.passed !== null && (
                      <div className={`result-status ${result.passed ? 'passed' : 'failed'}`}>
                        {result.passed ? "✓ O'tdi" : "✗ O'tmadi"}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedResult && (
                <div className="result-details">
                  <div className="detail-header">
                    <h2>{selectedResult.test_title}</h2>
                    <button onClick={() => setSelectedResult(null)} className="btn btn-sm btn-outline">Yopish</button>
                  </div>
                  <div className="detail-summary">
                    <div className={`score-circle score-${getScoreClass(selectedResult.score_percentage)}`}>
                      <div className="score-number">{selectedResult.score_percentage?.toFixed(1)}%</div>
                      <div className="score-text">{getScoreLabel(selectedResult.score_percentage)}</div>
                    </div>
                    <div className="summary-stats">
                      <div className="summary-stat">
                        <div className="stat-icon">✓</div>
                        <div className="stat-content">
                          <div className="stat-number">{selectedResult.correct_answers || 0}</div>
                          <div className="stat-label">To'g'ri</div>
                        </div>
                      </div>
                      <div className="summary-stat">
                        <div className="stat-icon">✗</div>
                        <div className="stat-content">
                          <div className="stat-number">{selectedResult.total_questions - (selectedResult.correct_answers || 0)}</div>
                          <div className="stat-label">Noto'g'ri</div>
                        </div>
                      </div>
                      <div className="summary-stat">
                        <div className="stat-icon">⭐</div>
                        <div className="stat-content">
                          <div className="stat-number">{(selectedResult.correct_answers || 0) * 2}</div>
                          <div className="stat-label">Ball</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedResult.detailed_answers && (() => {
                    try {
                      const answers = typeof selectedResult.detailed_answers === 'string'
                        ? JSON.parse(selectedResult.detailed_answers) : selectedResult.detailed_answers;
                      if (!Array.isArray(answers) || !answers.length) return null;
                      return (
                        <div className="detailed-answers">
                          <h3>Batafsil javoblar</h3>
                          {answers.map((ans, i) => (
                            <div key={i} className={`answer-item ${ans.is_correct ? 'correct' : 'incorrect'}`}>
                              <div className="answer-header">
                                <span className="answer-number">Savol {i + 1}</span>
                                <span className={`answer-status ${ans.is_correct ? 'correct' : 'incorrect'}`}>
                                  {ans.is_correct ? "✓ To'g'ri" : "✗ Noto'g'ri"}
                                </span>
                                <span className="answer-points">{ans.is_correct ? ans.points : 0} / {ans.points} ball</span>
                              </div>
                              <div className="answer-content">
                                <p className="question-text">{ans.question_text}</p>
                                <div className="answer-details">
                                  <div className="answer-row">
                                    <strong>Sizning javobingiz:</strong>
                                    <span className={ans.is_correct ? 'text-success' : 'text-danger'}>
                                      {ans.user_answer != null ? String(ans.user_answer) : '(Javob berilmagan)'}
                                    </span>
                                  </div>
                                  {!ans.is_correct && ans.correct_answer && (
                                    <div className="answer-row">
                                      <strong>To'g'ri javob:</strong>
                                      <span className="text-success">{ans.correct_answer}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    } catch { return null; }
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════ LESSONS TAB ════════════ */}
      {activeTab === 'lessons' && (
        <div>
          {lessonProgresses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎓</div>
              <h3>Hali darslar bajarilmagan</h3>
              <p>Darslarga kiring va testlar, topshiriqlarni bajaring!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {lessonProgresses.map(lp => (
                <Link key={lp.id} to={`/lessons/${lp.lesson_id}`}
                  style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    background: 'var(--card-bg)',
                    border: `2px solid ${lp.grade >= 5 ? '#f59e0b' : lp.grade === 4 ? '#6366f1' : lp.grade === 3 ? '#92400e' : lp.grade === 2 ? '#dc2626' : 'var(--border-color)'}`,
                    borderRadius: '14px', padding: '1.25rem',
                    transition: 'box-shadow 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      {/* Dars info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          {lp.lesson_title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                          {lp.lesson_grade}-sinf • {lp.subject} •{' '}
                          {new Date(lp.updated_at).toLocaleDateString('uz-UZ')}
                        </div>
                        {/* Progress bar */}
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: '99px', height: '8px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                          <div style={{
                            height: '100%', borderRadius: '99px',
                            width: `${Math.min(lp.percent, 100)}%`,
                            background: lp.percent >= 86
                              ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                              : lp.percent >= 60
                              ? 'linear-gradient(90deg,#6366f1,#818cf8)'
                              : lp.percent >= 40
                              ? 'linear-gradient(90deg,#92400e,#b45309)'
                              : 'linear-gradient(90deg,#dc2626,#f87171)',
                            transition: 'width 0.6s ease'
                          }} />
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                          <span>📊 {lp.percent}% o'zlashtirish</span>
                          <span>✏️ {lp.earned_score} / {lp.total_possible} ball</span>
                        </div>
                      </div>
                      {/* Medal */}
                      {lp.grade > 0 && (
                        <div style={{
                          textAlign: 'center',
                          background: getGradeBg(lp.grade),
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          minWidth: '80px'
                        }}>
                          <div style={{ fontSize: '2rem' }}>{getMedal(lp.grade)}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: getGradeColor(lp.grade) }}>
                            {lp.grade} baho
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            {getMedalLabel(lp.grade)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Results;
