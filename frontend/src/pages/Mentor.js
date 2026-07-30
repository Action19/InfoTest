import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Mentor = () => {
  const { user } = useAuth();
  const [advice, setAdvice] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMentor();
  }, []);

  const fetchMentor = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mentor');
      if (res.data.exists) {
        setAdvice(res.data.advice);
        setGeneratedAt(res.data.generated_at);
      }
    } catch (err) {
      console.error('Mentor fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateMentor = async (force = false) => {
    try {
      setGenerating(true);
      setError('');
      const res = await api.post('/mentor/generate', { force });
      setAdvice(res.data.advice);
      setGeneratedAt(res.data.generated_at);
    } catch (err) {
      if (err.response?.status === 429) {
        setError(`Mentor maslahat haftada 1 marta yangilanadi. ${err.response.data.days_remaining} kun qoldi.`);
      } else {
        setError(err.response?.data?.error || 'Xatolik yuz berdi');
      }
    } finally {
      setGenerating(false);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'rising') return { icon: '📈', text: "O'sish", color: '#16a34a' };
    if (trend === 'declining') return { icon: '📉', text: 'Pasayish', color: '#dc2626' };
    return { icon: '📊', text: 'Barqaror', color: '#d97706' };
  };

  if (user?.role !== 'student') {
    return (
      <div className="page-container" style={{ paddingTop: '100px', textAlign: 'center' }}>
        <h2>🧠 AI Shaxsiy Mentor</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Bu bo'lim faqat o'quvchilar uchun</p>
      </div>
    );
  }

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
          <h1>🧠 Shaxsiy Mentor</h1>
          <p className="subtitle">Sun'iy intellekt sizning bilim darajangizni tahlil qilib, individual maslahatlar beradi</p>
        </div>
      </div>

      {/* Maslahat yo'q — birinchi marta */}
      {!advice ? (
        <div style={{
          textAlign: 'center', padding: '3rem 2rem',
          background: 'var(--card-bg)', borderRadius: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧠</div>
          <h2 style={{ margin: '0 0 1rem', color: 'var(--text-primary)' }}>AI Mentor hali faol emas</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Sun'iy intellekt sizning barcha test natijalari, amaliy topshiriqlar va adaptiv test
            ma'lumotlaringizni tahlil qilib, shaxsiy maslahatlar tayyorlaydi.
          </p>
          <button
            onClick={() => generateMentor()}
            disabled={generating}
            className="btn btn-primary"
            style={{ padding: '0.85rem 2.5rem', fontSize: '1.05rem' }}
          >
            {generating ? '🤖 Tahlil qilinmoqda...' : '🧠 Mentorni faollashtirish'}
          </button>
          {error && <p style={{ color: '#dc2626', marginTop: '1rem' }}>{error}</p>}
        </div>
      ) : (
        <div>
          {/* Header — sana va yangilash */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem'
          }}>
            <div>
              {generatedAt && (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Oxirgi yangilanish: {new Date(generatedAt).toLocaleDateString('uz-UZ')}
                </span>
              )}
            </div>
            <button
              onClick={() => generateMentor(true)}
              disabled={generating}
              className="btn btn-outline"
              style={{ fontSize: '0.85rem' }}
            >
              {generating ? '⏳ Yangilanmoqda...' : '🔄 Yangilash'}
            </button>
          </div>

          {error && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.1)', borderRadius: '10px', color: '#d97706', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Motivatsiya — katta banner */}
          {advice.motivation && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
              borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem',
              border: '1px solid rgba(99,102,241,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>💬</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#6366f1', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                    Mentor so'zi:
                  </div>
                  <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>
                    {advice.motivation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* O'sish trendi */}
          {advice.progress_trend && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem',
              background: 'var(--card-bg)', border: '1px solid var(--border-color)'
            }}>
              <span style={{ fontSize: '1.5rem' }}>{getTrendIcon(advice.progress_trend).icon}</span>
              <div>
                <span style={{ fontWeight: 700, color: getTrendIcon(advice.progress_trend).color }}>
                  Trend: {getTrendIcon(advice.progress_trend).text}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: '0.75rem' }}>
                  O'zlashtirish: {user.mastery_percent || 0}%
                </span>
              </div>
            </div>
          )}

          {/* Kuchli va zaif tomonlar — 2 ustun */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Kuchli tomonlar */}
            <div style={{
              background: 'var(--card-bg)', borderRadius: '16px', padding: '1.5rem',
              border: '1px solid rgba(34,197,94,0.2)'
            }}>
              <h3 style={{ margin: '0 0 1rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💪 Kuchli tomonlaringiz
              </h3>
              {advice.strengths && advice.strengths.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1.25rem', listStyleType: 'none' }}>
                  {advice.strengths.map((s, i) => (
                    <li key={i} style={{ padding: '0.4rem 0', fontSize: '0.92rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ color: '#16a34a' }}>✓</span> {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Hali yetarli ma'lumot yo'q</p>
              )}
            </div>

            {/* Zaif tomonlar */}
            <div style={{
              background: 'var(--card-bg)', borderRadius: '16px', padding: '1.5rem',
              border: '1px solid rgba(245,158,11,0.2)'
            }}>
              <h3 style={{ margin: '0 0 1rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📚 Yaxshilash kerak
              </h3>
              {advice.weaknesses && advice.weaknesses.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1.25rem', listStyleType: 'none' }}>
                  {advice.weaknesses.map((w, i) => (
                    <li key={i} style={{ padding: '0.4rem 0', fontSize: '0.92rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ color: '#d97706' }}>!</span> {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Hali yetarli ma'lumot yo'q</p>
              )}
            </div>
          </div>

          {/* Bu haftaning vazifalari */}
          {advice.next_steps && advice.next_steps.length > 0 && (
            <div style={{
              background: 'var(--card-bg)', borderRadius: '16px', padding: '1.5rem',
              border: '1px solid var(--border-color)', marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🎯 Bu haftaning vazifalari
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {advice.next_steps.map((step, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    padding: '0.75rem 1rem', background: 'var(--bg-secondary)',
                    borderRadius: '10px', border: '1px solid var(--border-color)'
                  }}>
                    <span style={{
                      background: 'var(--primary-color)', color: '#fff', borderRadius: '50%',
                      width: '26px', height: '26px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bu haftaning fokusi + o'rganish maslahati */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {advice.weekly_focus && (
              <div style={{
                background: 'rgba(99,102,241,0.06)', borderRadius: '14px', padding: '1.25rem',
                border: '1px solid rgba(99,102,241,0.15)'
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6366f1', marginBottom: '0.5rem' }}>
                  🔍 Bu haftaning fokusi:
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>{advice.weekly_focus}</p>
              </div>
            )}

            {advice.study_tip && (
              <div style={{
                background: 'rgba(16,185,129,0.06)', borderRadius: '14px', padding: '1.25rem',
                border: '1px solid rgba(16,185,129,0.15)'
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#059669', marginBottom: '0.5rem' }}>
                  💡 O'rganish maslahati:
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>{advice.study_tip}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Mentor;
