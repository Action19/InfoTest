import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ExperimentStats = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [controlData, setControlData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showControlForm, setShowControlForm] = useState(false);
  const [preInput, setPreInput] = useState('');
  const [postInput, setPostInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchControlData(); }, []);

  const fetchControlData = async () => {
    try {
      const res = await api.get('/experiment/control-data');
      setControlData(res.data);
    } catch {}
  };

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

  const saveControlData = async () => {
    try {
      setSaving(true);
      const pre = preInput.split(/[,;\n\s]+/).map(Number).filter(n => !isNaN(n) && n >= 0);
      const post = postInput.split(/[,;\n\s]+/).map(Number).filter(n => !isNaN(n) && n >= 0);

      if (pre.length < 2 || post.length < 2) {
        alert('Kamida 2 tadan ball kiritilishi kerak');
        return;
      }

      await api.post('/experiment/control-data', { pre_test: pre, post_test: post });
      alert(`✅ Saqlandi! Pre-test: ${pre.length} ta, Post-test: ${post.length} ta`);
      setShowControlForm(false);
      fetchControlData();
    } catch (err) {
      alert(err.response?.data?.error || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="page-container" style={{ paddingTop: '100px', textAlign: 'center' }}><h2>🔒 Faqat administrator</h2></div>;
  }

  const StatRow = ({ label, value, highlight, info }) => (
    <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', width: '55%' }}>
        {label}
        {info && <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.15rem', fontStyle: 'italic' }}>{info}</div>}
      </td>
      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: highlight ? 'var(--primary-light)' : 'var(--text-primary)', textAlign: 'right' }}>{value}</td>
    </tr>
  );

  const Section = ({ title, info, children }) => (
    <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
      <h3 style={{ margin: '0 0 0.25rem', color: 'var(--primary-light)', fontSize: '1.05rem' }}>{title}</h3>
      {info && <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: 'var(--text-light)', fontStyle: 'italic', lineHeight: 1.5 }}>💡 {info}</p>}
      {children}
    </div>
  );

  return (
    <div className="page-container" style={{ paddingTop: '90px', maxWidth: '1100px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2rem', marginBottom: '0.5rem' }}>
          📊 Tajriba-sinov ishlari
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Statistik hisoblashlar va natijalar tahlili (PhD dissertatsiya)</p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button onClick={fetchStats} disabled={loading} className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>
            {loading ? '⏳ Hisoblanmoqda...' : '🧮 Hisoblashni boshlash'}
          </button>
          <button onClick={() => setShowControlForm(!showControlForm)} className="btn btn-outline">
            📝 Nazorat guruhi ma'lumotlarini kiritish
          </button>
        </div>

        {controlData?.entered && (
          <p style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '0.75rem' }}>
            ✅ Nazorat guruhi kiritilgan: Pre-test {controlData.pre_test?.length} ta, Post-test {controlData.post_test?.length} ta
          </p>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Nazorat guruhi kiritish formasi */}
      {showControlForm && (
        <Section title="📝 Nazorat guruhi ma'lumotlarini kiritish"
          info="Nazorat guruhi qog'oz variantda test topshirgan. Ularning ballarini (foiz yoki ball) vergul yoki bo'sh joy bilan ajratib kiriting.">
          <div className="form-group">
            <label>Pre-test (diagnostik) ballari (masalan: 45, 52, 38, 61, 55...)</label>
            <textarea value={preInput} onChange={e => setPreInput(e.target.value)} rows={3}
              placeholder="45, 52, 38, 61, 55, 40, 48, 33, 57, 42, 50, 46, 39, 54, 47..." />
            <small style={{ color: 'var(--text-light)' }}>Har o'quvchining pre-test foizini kiriting</small>
          </div>
          <div className="form-group">
            <label>Post-test (yakuniy) ballari (xuddi shu tartibda)</label>
            <textarea value={postInput} onChange={e => setPostInput(e.target.value)} rows={3}
              placeholder="58, 65, 49, 72, 60, 52, 55, 44, 68, 53, 62, 57, 48, 66, 59..." />
            <small style={{ color: 'var(--text-light)' }}>Har o'quvchining post-test foizini kiriting (tartib pre-test bilan bir xil bo'lsin)</small>
          </div>
          <button onClick={saveControlData} disabled={saving} className="btn btn-primary">
            {saving ? '⏳ Saqlanmoqda...' : '💾 Saqlash'}
          </button>
        </Section>
      )}

      {/* NATIJALAR */}
      {data && (
        <div>
          {/* Guruhlar statistikasi */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <Section title="🟢 Tajriba guruhi (platforma)" info="Platformadan foydalangan o'quvchilar. Pre-test = Diagnostik test, Post-test = Platformadagi eng oxirgi test natijasi.">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}><tbody>
                <StatRow label="Pre-test: n" value={data.experiment_group?.pre?.n || 0} highlight />
                <StatRow label="Pre-test: M (o'rtacha)" value={`${data.experiment_group?.pre?.mean || 0}%`} highlight />
                <StatRow label="Pre-test: SD" value={data.experiment_group?.pre?.std_dev || 0} />
                <StatRow label="Post-test: n" value={data.experiment_group?.post?.n || 0} highlight />
                <StatRow label="Post-test: M (o'rtacha)" value={`${data.experiment_group?.post?.mean || 0}%`} highlight />
                <StatRow label="Post-test: SD" value={data.experiment_group?.post?.std_dev || 0} />
              </tbody></table>
            </Section>

            <Section title="🔴 Nazorat guruhi (qo'lda)" info="Qog'oz variantda test topshirgan o'quvchilar. Admin qo'lda kiritgan. Platforma ishlatilmagan.">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}><tbody>
                <StatRow label="Pre-test: n" value={data.control_group?.pre?.n || 0} highlight />
                <StatRow label="Pre-test: M (o'rtacha)" value={`${data.control_group?.pre?.mean || 0}%`} highlight />
                <StatRow label="Pre-test: SD" value={data.control_group?.pre?.std_dev || 0} />
                <StatRow label="Post-test: n" value={data.control_group?.post?.n || 0} highlight />
                <StatRow label="Post-test: M (o'rtacha)" value={`${data.control_group?.post?.mean || 0}%`} highlight />
                <StatRow label="Post-test: SD" value={data.control_group?.post?.std_dev || 0} />
              </tbody></table>
              {!data.control_data_entered && (
                <p style={{ color: '#fb7185', fontSize: '0.82rem', marginTop: '0.75rem' }}>⚠️ Nazorat guruhi ma'lumotlari kiritilmagan</p>
              )}
            </Section>
          </div>

          {/* O'sish */}
          <Section title="📈 O'sish (Pre → Post)" info="Har ikki guruhda tajriba davomida qancha o'sish bo'lganini ko'rsatadi. Tajriba guruhi ko'proq o'sishi kerak.">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}><tbody>
              <StatRow label="Tajriba guruhi o'sishi" value={`+${data.growth?.experiment || 0}%`} highlight />
              <StatRow label="Nazorat guruhi o'sishi" value={`+${data.growth?.control || 0}%`} />
              <StatRow label="Farq (tajriba — nazorat)" value={`+${data.growth?.difference || 0}%`} highlight info="Bu qiymat ijobiy va katta bo'lishi kerak" />
            </tbody></table>
          </Section>

          {/* Pre-test t-test */}
          {data.t_test_pre && (
            <Section title="📏 Pre-test: Student t-test" info="MAQSAD: Tajriba boshida guruhlar TENG ekanligini isbotlash. p > 0.05 bo'lishi KERAK (farq yo'q = yaxshi).">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}><tbody>
                <StatRow label="t-qiymat" value={data.t_test_pre.t} highlight />
                <StatRow label="Erkinlik darajasi (df)" value={data.t_test_pre.df} />
                <StatRow label="p-qiymat" value={data.t_test_pre.p} highlight />
                <StatRow label="Natija" value={
                  data.t_test_pre.significant
                    ? '⚠️ Guruhlar teng EMAS (p < 0.05)'
                    : '✅ Guruhlar teng (p > 0.05) — yaxshi!'
                } highlight />
              </tbody></table>
            </Section>
          )}

          {/* Post-test t-test */}
          {data.t_test_post && (
            <Section title="📏 Post-test: Student t-test" info="MAQSAD: Tajriba NATIJASIDA guruhlar o'rtasida farq borligini isbotlash. p < 0.05 bo'lishi KERAK.">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}><tbody>
                <StatRow label="t-qiymat" value={data.t_test_post.t} highlight />
                <StatRow label="Erkinlik darajasi (df)" value={data.t_test_post.df} />
                <StatRow label="p-qiymat" value={data.t_test_post.p} highlight />
                <StatRow label="Ahamiyatlilik" value={data.t_test_post.significance_level} highlight />
                <StatRow label="Natija" value={
                  data.t_test_post.significant
                    ? '✅ Farq SEZILARLI (p < 0.05) — gipoteza isbotlandi!'
                    : '⚠️ Farq sezilarli emas (p > 0.05)'
                } highlight />
              </tbody></table>
            </Section>
          )}

          {/* Fisher F-test */}
          {data.fisher_test && (
            <Section title="🔬 Fisher F-test" info="MAQSAD: t-test uchun dispersiyalar TENG ekanligini tekshirish. p > 0.05 bo'lsa — t-test ishonchli.">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}><tbody>
                <StatRow label="F-qiymat" value={data.fisher_test.F} highlight />
                <StatRow label="df₁ / df₂" value={`${data.fisher_test.df1} / ${data.fisher_test.df2}`} />
                <StatRow label="p-qiymat" value={data.fisher_test.p} highlight />
                <StatRow label="Natija" value={data.fisher_test.equal_variances ? '✅ Dispersiyalar teng' : '⚠️ Dispersiyalar teng emas'} />
              </tbody></table>
            </Section>
          )}

          {/* Cohen's d */}
          {data.cohens_d && (
            <Section title="📐 Cohen's d (Effekt o'lchami)" info="MAQSAD: Farqning AMALIY ahamiyatini ko'rsatish. d ≥ 0.8 = katta effekt, d ≥ 0.5 = o'rta, d ≥ 0.2 = kichik.">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}><tbody>
                <StatRow label="d qiymati" value={data.cohens_d.d} highlight />
                <StatRow label="|d| (absolut)" value={data.cohens_d.abs_d} highlight />
                <StatRow label="Interpretatsiya" value={data.cohens_d.interpretation} highlight />
              </tbody></table>
            </Section>
          )}

          {/* Paired t-tests */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {data.paired_t_experiment && (
              <Section title="🔄 Tajriba ichida (Paired)" info="MAQSAD: Tajriba guruhi ICHIDA pre→post o'sish statistik jihatdan sezilarli ekanligini isbotlash.">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}><tbody>
                  <StatRow label="t-qiymat" value={data.paired_t_experiment.t} highlight />
                  <StatRow label="p-qiymat" value={data.paired_t_experiment.p} highlight />
                  <StatRow label="O'rtacha o'sish" value={`+${data.paired_t_experiment.mean_difference}%`} highlight />
                  <StatRow label="Natija" value={data.paired_t_experiment.significant ? '✅ O\'sish sezilarli' : '⚠️ Sezilarli emas'} />
                </tbody></table>
              </Section>
            )}

            {data.paired_t_control && (
              <Section title="🔄 Nazorat ichida (Paired)" info="Nazorat guruhi ichida pre→post o'sish bo'lganmi. Odatda kichik o'sish bo'ladi.">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}><tbody>
                  <StatRow label="t-qiymat" value={data.paired_t_control.t} highlight />
                  <StatRow label="p-qiymat" value={data.paired_t_control.p} highlight />
                  <StatRow label="O'rtacha o'sish" value={`+${data.paired_t_control.mean_difference}%`} />
                  <StatRow label="Natija" value={data.paired_t_control.significant ? 'O\'sish sezilarli' : 'Sezilarli emas'} />
                </tbody></table>
              </Section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperimentStats;
