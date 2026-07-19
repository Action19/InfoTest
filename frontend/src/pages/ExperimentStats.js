import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ExperimentStats = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/experiment/stats');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="page-container" style={{ paddingTop: '100px', textAlign: 'center' }}>
        <h2>🔒 Faqat administrator ko'ra oladi</h2>
      </div>
    );
  }

  const StatTable = ({ title, rows }) => (
    <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1rem', color: 'var(--primary-light)', fontSize: '1.1rem' }}>{title}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
        <tbody>
          {rows.map(([label, value, highlight], i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
              <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', width: '55%' }}>{label}</td>
              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: highlight ? 'var(--primary-light)' : 'var(--text-primary)', textAlign: 'right' }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="page-container" style={{ paddingTop: '90px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2rem', marginBottom: '0.5rem' }}>
          📊 Tajriba-sinov ishlari
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Statistik hisoblashlar va natijalar tahlili (PhD dissertatsiya)</p>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="btn btn-primary"
          style={{ marginTop: '1rem', padding: '0.85rem 2rem', fontSize: '1rem' }}
        >
          {loading ? '⏳ Hisoblanmoqda...' : '🧮 Hisoblashni boshlash'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {data && (
        <div>
          {/* Umumiy statistika */}
          <StatTable title="📋 Umumiy statistika" rows={[
            ['Jami o\'quvchilar soni (N)', data.general.total_students, true],
            ['Jami urinishlar soni', data.general.total_attempts],
            ['O\'rtacha ball (M)', `${data.general.mean}%`, true],
            ['Mediana', `${data.general.median}%`],
            ['Standart og\'ish (SD)', data.general.std_dev],
            ['Dispersiya (S²)', data.general.variance],
            ['Standart xatolik (SEM)', data.general.sem],
            ['Min — Max', `${data.general.min}% — ${data.general.max}%`],
            ['Diapazaon (Range)', data.general.range],
            ['95% ishonch intervali (CI)', `${data.general.confidence_interval_95.lower}% — ${data.general.confidence_interval_95.upper}%`, true],
          ]} />

          {/* Guruhlar solishtiruvi */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <StatTable title={`🟢 ${data.groups.experiment.name}`} rows={[
              ['n', data.groups.experiment.n, true],
              ['O\'rtacha (M)', `${data.groups.experiment.mean}%`, true],
              ['Standart og\'ish (SD)', data.groups.experiment.std_dev],
              ['Dispersiya (S²)', data.groups.experiment.variance],
              ['SEM', data.groups.experiment.sem],
              ['Min — Max', `${data.groups.experiment.min}% — ${data.groups.experiment.max}%`],
            ]} />
            <StatTable title={`🔴 ${data.groups.control.name}`} rows={[
              ['n', data.groups.control.n, true],
              ['O\'rtacha (M)', `${data.groups.control.mean}%`, true],
              ['Standart og\'ish (SD)', data.groups.control.std_dev],
              ['Dispersiya (S²)', data.groups.control.variance],
              ['SEM', data.groups.control.sem],
              ['Min — Max', `${data.groups.control.min}% — ${data.groups.control.max}%`],
            ]} />
          </div>

          {/* Farq */}
          <StatTable title="📐 Guruhlar o'rtasidagi farq" rows={[
            ['O\'rtacha farq (Δ)', `+${data.groups.difference.mean_diff}%`, true],
            ['O\'sish foizi', `${data.groups.difference.improvement_percent}%`, true],
          ]} />

          {/* Student t-test */}
          <StatTable title="📏 Student t-test (Independent Samples)" rows={[
            ['Tavsif', data.t_test.description],
            ['H₀', data.t_test.hypothesis?.H0],
            ['H₁', data.t_test.hypothesis?.H1],
            ['t-qiymat', data.t_test.t, true],
            ['Erkinlik darajasi (df)', data.t_test.df],
            ['p-qiymat', data.t_test.p, true],
            ['Ahamiyatlilik', data.t_test.significance_level, true],
            ['Natija', data.t_test.result, true],
          ]} />

          {/* Fisher F-test */}
          <StatTable title="🔬 Fisher F-test (Dispersiyalar tengligi)" rows={[
            ['Tavsif', data.fisher_test.description],
            ['F-qiymat', data.fisher_test.F, true],
            ['df₁', data.fisher_test.df1],
            ['df₂', data.fisher_test.df2],
            ['p-qiymat', data.fisher_test.p, true],
            ['Natija', data.fisher_test.significance],
          ]} />

          {/* Cohen's d */}
          <StatTable title="📐 Cohen's d (Effekt o'lchami)" rows={[
            ['Tavsif', data.cohens_d.description],
            ['d qiymati', data.cohens_d.d, true],
            ['|d| (absolut)', data.cohens_d.abs_d, true],
            ['Interpretatsiya', data.cohens_d.interpretation, true],
          ]} />

          {/* ANOVA */}
          {data.anova && (
            <StatTable title="🏫 One-Way ANOVA (Sinflar bo'yicha)" rows={[
              ['Tavsif', data.anova.description],
              ['F-qiymat', data.anova.F, true],
              ['df (guruhlar arasi)', data.anova.df_between],
              ['df (guruh ichida)', data.anova.df_within],
              ['p-qiymat', data.anova.p, true],
              ['Ahamiyatlilik', data.anova.significance_level || 'ns'],
              ...(data.anova.class_means || []).map(c =>
                [`   ${c.class_name}`, `M=${c.mean}%, SD=${c.std_dev}, n=${c.n}`]
              )
            ]} />
          )}

          {/* Cronbach's Alpha */}
          <StatTable title="🔑 Cronbach's Alpha (Ichki izchillik)" rows={[
            ['Tavsif', data.cronbach_alpha.description],
            ['Alpha (α)', data.cronbach_alpha.alpha, true],
            ['Interpretatsiya', data.cronbach_alpha.interpretation, true],
          ]} />

          {/* O'tish foizi */}
          <StatTable title="📈 O'zlashtirish darajasi" rows={[
            ['A\'lo (86-100%)', `${data.pass_rate.distribution.excellent} ta o'quvchi`],
            ['Yaxshi (60-85%)', `${data.pass_rate.distribution.good} ta o'quvchi`],
            ['Qoniqarli (40-59%)', `${data.pass_rate.distribution.satisfactory} ta o'quvchi`],
            ['Qoniqarsiz (0-39%)', `${data.pass_rate.distribution.unsatisfactory} ta o'quvchi`],
            ['60%+ o\'tganlar', `${data.pass_rate.pass_rate_60}%`, true],
          ]} />

          {/* Xulosa */}
          <div style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.05), rgba(139,92,246,0.05))', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--primary-light)', margin: '0 0 1rem' }}>📝 Xulosa</h3>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--text-primary)', lineHeight: 1.8, fontSize: '0.9rem', margin: 0 }}>
              {data.conclusion}
            </pre>
          </div>

          {/* O'quvchilar jadvali */}
          {data.students_data?.length > 0 && (
            <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', overflow: 'auto' }}>
              <h3 style={{ margin: '0 0 1rem', color: 'var(--text-primary)' }}>👥 O'quvchilar natijalari</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '0.6rem', textAlign: 'left', color: 'var(--text-secondary)' }}>#</th>
                    <th style={{ padding: '0.6rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Ism</th>
                    <th style={{ padding: '0.6rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Sinf</th>
                    <th style={{ padding: '0.6rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Ball (%)</th>
                    <th style={{ padding: '0.6rem', textAlign: 'right', color: 'var(--text-secondary)' }}>To'g'ri</th>
                  </tr>
                </thead>
                <tbody>
                  {data.students_data.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                      <td style={{ padding: '0.5rem 0.6rem', color: 'var(--text-light)' }}>{i + 1}</td>
                      <td style={{ padding: '0.5rem 0.6rem', color: 'var(--text-primary)', fontWeight: 500 }}>{s.full_name}</td>
                      <td style={{ padding: '0.5rem 0.6rem', color: 'var(--text-secondary)' }}>{s.class_name}</td>
                      <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontWeight: 700, color: s.score >= 60 ? '#34d399' : '#fb7185' }}>{s.score}%</td>
                      <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{s.correct}/{s.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExperimentStats;
