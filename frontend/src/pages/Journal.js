import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../assets/css/Pages.css';

const getMedal      = (g) => ({ 5:'🥇', 4:'🥈', 3:'🥉', 2:'😢' }[g] || '—');
const gradeColor    = (g) => ({ 5:'#f59e0b', 4:'#6366f1', 3:'#92400e', 2:'#dc2626' }[g] || '#9ca3af');
const gradeBg       = (g) => ({ 5:'rgba(245,158,11,0.12)', 4:'rgba(99,102,241,0.12)', 3:'rgba(146,64,14,0.12)', 2:'rgba(220,38,38,0.12)' }[g] || 'transparent');

const Journal = () => {
  const { user } = useAuth();
  const [journal, setJournal]     = useState([]);   // [{lesson, students[]}]
  const [loading, setLoading]     = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [search, setSearch]       = useState('');
  const [filterClass, setFilterClass] = useState('');

  useEffect(() => {
    fetchJournal();
  }, []);

  const fetchJournal = async () => {
    try {
      setLoading(true);
      const res = await api.get('/lesson-progress/journal/teacher');
      const data = res.data.journal || [];
      setJournal(data);
      if (data.length > 0) setActiveLesson(data[0].id);
    } catch (err) {
      console.error('Journal fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Jurnal yuklanmoqda...</p>
      </div>
    );
  }

  const activeLessonData = journal.find(l => l.id === activeLesson);

  // Barcha sinflar ro'yxati
  const allClasses = [...new Set(
    journal.flatMap(l => l.students.map(s => s.class_name).filter(Boolean))
  )].sort();

  // Filterlangan o'quvchilar
  const filteredStudents = (activeLessonData?.students || []).filter(s => {
    const matchSearch = !search ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.username?.toLowerCase().includes(search.toLowerCase());
    const matchClass = !filterClass || s.class_name === filterClass;
    return matchSearch && matchClass;
  });

  // Statistika
  const gradeStats = (students) => {
    const total   = students.length;
    const graded  = students.filter(s => s.grade > 0).length;
    const avg     = graded > 0
      ? (students.filter(s=>s.grade>0).reduce((a,s)=>a+s.grade,0) / graded).toFixed(1)
      : '—';
    const counts  = [5,4,3,2].map(g => ({
      grade: g,
      count: students.filter(s => s.grade === g).length
    }));
    return { total, graded, avg, counts };
  };

  return (
    <div className="page-container">

      {/* ── Sarlavha ── */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>📒 Jurnal</h1>
          <p className="subtitle">O'quvchilarning darslar bo'yicha bahosi</p>
        </div>
      </div>

      {journal.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📒</div>
          <h3>Hali darslar yaratilmagan</h3>
          <p>Darslar yarating va o'quvchilar testlar topshirganda jurnal to'ldiriladi</p>
          <Link to="/lessons" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Darslarga o'tish
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* ── Chap: darslar ro'yxati ── */}
          <div style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Darslar
            </div>
            {journal.map((lesson, idx) => {
              const stats = gradeStats(lesson.students);
              return (
                <button key={lesson.id}
                  onClick={() => setActiveLesson(lesson.id)}
                  style={{
                    textAlign: 'left', padding: '0.8rem 0.9rem',
                    borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: activeLesson === lesson.id
                      ? 'linear-gradient(135deg,rgba(102,126,234,0.15),rgba(118,75,162,0.15))'
                      : 'var(--card-bg)',
                    borderLeft: activeLesson === lesson.id
                      ? '3px solid var(--primary-color)'
                      : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {idx + 1}-Dars
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.15rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lesson.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    👥 {stats.graded}/{stats.total} baholandi
                    {stats.graded > 0 && <span style={{ marginLeft: '0.4rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                      ø{stats.avg}
                    </span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── O'ng: jurnal jadvali ── */}
          {activeLessonData && (
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Dars sarlavhasi */}
              <div style={{
                background: 'linear-gradient(135deg,var(--primary-color),var(--secondary-color))',
                borderRadius: '14px', padding: '1rem 1.5rem', color: '#fff',
                marginBottom: '1rem', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>
                    {journal.indexOf(activeLessonData) + 1}-Dars
                  </div>
                  <h3 style={{ margin: '0.1rem 0 0', color: '#fff', fontSize: '1.05rem' }}>
                    {activeLessonData.title}
                  </h3>
                  <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>
                    {activeLessonData.grade}-sinf · {activeLessonData.subject}
                  </div>
                </div>
                {/* Statistika */}
                {(() => {
                  const st = gradeStats(activeLessonData.students);
                  return (
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      {st.counts.map(({ grade, count }) => count > 0 && (
                        <div key={grade} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.3rem' }}>
                            {{ 5:'🥇', 4:'🥈', 3:'🥉', 2:'😢' }[grade]}
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                            {grade} — {count} ta
                          </div>
                        </div>
                      ))}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>ø{st.avg}</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>o'rtacha baho</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Filter qator */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="🔍 O'quvchi ismi..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    flex: 1, minWidth: '180px', padding: '0.5rem 0.75rem',
                    borderRadius: '8px', border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                />
                {allClasses.length > 1 && (
                  <select
                    value={filterClass}
                    onChange={e => setFilterClass(e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem', borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-bg)', color: 'var(--text-primary)', fontSize: '0.88rem'
                    }}>
                    <option value="">Barcha sinflar</option>
                    {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>

              {/* Jadval */}
              {filteredStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)',
                  background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  {activeLessonData.students.length === 0
                    ? 'Hali hech bir o\'quvchi bu darsni bajarmagan'
                    : 'Qidiruv bo\'yicha natijalar topilmadi'}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        {['#', "O'quvchi", 'Sinf', 'Ball', 'Foiz', 'Baho', 'Sana'].map(h => (
                          <th key={h} style={{
                            padding: '0.7rem 0.9rem', textAlign: 'left',
                            fontWeight: 700, color: 'var(--text-secondary)',
                            borderBottom: '2px solid var(--border-color)',
                            fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, idx) => (
                        <tr key={s.student_id}
                          style={{ borderBottom: '1px solid var(--border-color)',
                            transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '0.75rem 0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '0.75rem 0.9rem' }}>
                            <div style={{ fontWeight: 600 }}>{s.full_name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>@{s.username}</div>
                          </td>
                          <td style={{ padding: '0.75rem 0.9rem', color: 'var(--text-secondary)' }}>
                            {s.class_name || '—'}
                          </td>
                          <td style={{ padding: '0.75rem 0.9rem', fontWeight: 600 }}>
                            {s.earned_score} / {s.total_possible}
                          </td>
                          <td style={{ padding: '0.75rem 0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{
                                width: '60px', height: '6px', borderRadius: '99px',
                                background: 'var(--bg-secondary)', overflow: 'hidden'
                              }}>
                                <div style={{
                                  height: '100%', borderRadius: '99px',
                                  width: `${Math.min(s.percent || 0, 100)}%`,
                                  background: s.percent >= 86 ? '#f59e0b'
                                             : s.percent >= 60 ? '#6366f1'
                                             : s.percent >= 40 ? '#92400e' : '#dc2626'
                                }} />
                              </div>
                              <span style={{ fontWeight: 500 }}>{s.percent || 0}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 0.9rem' }}>
                            {s.grade > 0 ? (
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                background: gradeBg(s.grade), borderRadius: '20px',
                                padding: '0.2rem 0.75rem', fontWeight: 700
                              }}>
                                <span>{getMedal(s.grade)}</span>
                                <span style={{ color: gradeColor(s.grade), fontSize: '0.9rem' }}>
                                  {s.grade}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                                Baholanmagan
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 0.9rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {s.updated_at
                              ? new Date(s.updated_at).toLocaleDateString('uz-UZ')
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Eksport eslatmasi */}
              <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)',
                textAlign: 'center', padding: '0.5rem' }}>
                💡 Jami {filteredStudents.filter(s => s.grade > 0).length} o'quvchi baholangan
                · {filteredStudents.filter(s => s.grade === 0 || !s.grade).length} baholanmagan
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Journal;
