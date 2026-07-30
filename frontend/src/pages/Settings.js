import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [archives, setArchives] = useState([]);
  const [telegramStats, setTelegramStats] = useState({ total: 0, connected: 0 });
  const [currentYear, setCurrentYear] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Yangi o'quv yili modal
  const [showNewYearModal, setShowNewYearModal] = useState(false);
  const [yearPassword, setYearPassword] = useState('');
  const [yearName, setYearName] = useState('');
  const [yearLoading, setYearLoading] = useState(false);

  // Ko'chirish modal
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveFrom, setMoveFrom] = useState('');
  const [moveTo, setMoveTo] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      setSettings(res.data.settings);
      setArchives(res.data.archives || []);
      setTelegramStats(res.data.telegramStats || { total: 0, connected: 0 });
      setCurrentYear(res.data.currentYear || {});
    } catch (err) {
      console.error('Settings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/settings', settings);
      setMessage('✅ Sozlamalar saqlandi');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Saqlashda xatolik'));
    } finally {
      setSaving(false);
    }
  };

  const handleNewYear = async () => {
    if (!yearPassword) { alert('Parolingizni kiriting'); return; }
    if (!window.confirm('⚠️ DIQQAT!\n\nBarcha o\'quvchilar natijalari arxivlanadi va 0 ga qaytadi.\nDars mazmuni, testlar, topshiriqlar saqlanadi.\n\nDavom etasizmi?')) return;

    try {
      setYearLoading(true);
      const res = await api.post('/settings/new-year', { password: yearPassword, year_name: yearName });
      alert(`🎉 ${res.data.message}\n\nArxivlangan: ${res.data.archived.students} ta o'quvchi, ${res.data.archived.classes.join(', ')} sinflari`);
      setShowNewYearModal(false);
      setYearPassword('');
      setYearName('');
      fetchSettings();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || 'Xatolik'));
    } finally {
      setYearLoading(false);
    }
  };

  const handleMoveStudents = async () => {
    if (!moveFrom || !moveTo) { alert('Ikkala sinfni ham tanlang'); return; }
    if (!window.confirm(`${moveFrom} sinf o'quvchilarini ${moveTo} ga ko'chirasizmi?`)) return;
    try {
      const res = await api.patch('/settings/move-students', { from_class: moveFrom, to_class: moveTo });
      alert(`✅ ${res.data.moved} ta o'quvchi ko'chirildi`);
      setShowMoveModal(false);
      setMoveFrom('');
      setMoveTo('');
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || 'Xatolik'));
    }
  };

  const handleTelegramSend = async () => {
    if (!window.confirm('Barcha ulangan ota-onalarga hozir hisobot yuborilsinmi?')) return;
    try {
      const res = await api.post('/telegram/send-weekly');
      alert(`✅ ${res.data.sent} ta ota-onaga yuborildi${res.data.failed > 0 ? `, ${res.data.failed} ta muvaffaqiyatsiz` : ''}`);
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || 'Xatolik'));
    }
  };

  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    return <div className="page-container" style={{ paddingTop: '100px', textAlign: 'center' }}><h2>🔒 Faqat o'qituvchilar uchun</h2></div>;
  }

  if (loading || !settings) {
    return <div className="loading-container"><div className="spinner"></div><p>Yuklanmoqda...</p></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>⚙️ Sozlamalar</h1>
        <p className="subtitle">Platformani sozlash va boshqarish</p>
      </div>

      {message && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', background: message.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: message.startsWith('✅') ? '#16a34a' : '#dc2626' }}>
          {message}
        </div>
      )}

      {/* ═══ O'quv yili ═══ */}
      <div className="profile-section" style={{ marginBottom: '1.5rem' }}>
        <div className="section-header">
          <h3>📅 O'quv yili</h3>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>O'tilgan darslar</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-color)' }}>{currentYear.taught_lessons || 0}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sinflar</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{(currentYear.teaching_classes || []).join(', ') || '—'}</div>
          </div>
          <button
            onClick={() => setShowNewYearModal(true)}
            className="btn btn-outline"
            style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#dc2626' }}
          >
            🔄 Yangi o'quv yiliga o'tish
          </button>
          <button
            onClick={() => setShowMoveModal(true)}
            className="btn btn-outline"
          >
            📋 O'quvchilarni ko'chirish
          </button>
        </div>
      </div>

      {/* ═══ Baholash sozlamalari ═══ */}
      <div className="profile-section" style={{ marginBottom: '1.5rem' }}>
        <div className="section-header">
          <h3>📊 Baholash sozlamalari</h3>
        </div>
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>A'lo (5) chegarasi (%)</label>
            <input type="number" min="50" max="100" value={settings.grade_excellent}
              onChange={e => setSettings({ ...settings, grade_excellent: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Yaxshi (4) chegarasi (%)</label>
            <input type="number" min="30" max="90" value={settings.grade_good}
              onChange={e => setSettings({ ...settings, grade_good: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Qoniqarli (3) chegarasi (%)</label>
            <input type="number" min="10" max="70" value={settings.grade_satisfactory}
              onChange={e => setSettings({ ...settings, grade_satisfactory: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Test standart ball</label>
            <input type="number" min="5" max="100" value={settings.test_max_score}
              onChange={e => setSettings({ ...settings, test_max_score: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Adaptiv test savollar soni</label>
            <input type="number" min="5" max="30" value={settings.adaptive_questions}
              onChange={e => setSettings({ ...settings, adaptive_questions: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* ═══ AI sozlamalari ═══ */}
      <div className="profile-section" style={{ marginBottom: '1.5rem' }}>
        <div className="section-header">
          <h3>🤖 AI sozlamalari</h3>
        </div>
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Avtomatik baholash</label>
            <select value={settings.ai_auto_grade ? 'true' : 'false'}
              onChange={e => setSettings({ ...settings, ai_auto_grade: e.target.value === 'true' })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="true">Yoqilgan (AI avtomatik baholaydi)</option>
              <option value="false">O'chirilgan (faqat qo'lda)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Tushuntirish darajasi</label>
            <select value={settings.ai_level}
              onChange={e => setSettings({ ...settings, ai_level: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="9">9-sinf darajasi</option>
              <option value="10">10-sinf darajasi</option>
              <option value="9-10">9-10 sinf (umumiy)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ═══ Telegram ═══ */}
      <div className="profile-section" style={{ marginBottom: '1.5rem' }}>
        <div className="section-header">
          <h3>📱 Telegram</h3>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ulangan ota-onalar</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: telegramStats.connected > 0 ? '#16a34a' : 'var(--text-secondary)' }}>
              {telegramStats.connected} / {telegramStats.total}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Hisobot yuborish kuni</label>
            <select value={settings.telegram_day}
              onChange={e => setSettings({ ...settings, telegram_day: e.target.value })}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="monday">Dushanba</option>
              <option value="tuesday">Seshanba</option>
              <option value="wednesday">Chorshanba</option>
              <option value="thursday">Payshanba</option>
              <option value="friday">Juma</option>
              <option value="saturday">Shanba</option>
            </select>
          </div>
          <button onClick={handleTelegramSend} className="btn btn-primary">
            📤 Hozir hisobot yuborish
          </button>
        </div>
      </div>

      {/* ═══ O'tiladigan sinflar ═══ */}
      <div className="profile-section" style={{ marginBottom: '1.5rem' }}>
        <div className="section-header">
          <h3>🏫 O'tiladigan sinflar</h3>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Sinflar (vergul bilan ajratib yozing, masalan: 9-A, 9-B, 10-A)
          </label>
          <input type="text" value={settings.teaching_classes || user.teaching_classes || ''}
            onChange={e => setSettings({ ...settings, teaching_classes: e.target.value })}
            placeholder="9-A, 9-B, 10-A"
            style={{ width: '100%', maxWidth: '400px', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Saqlash tugmasi */}
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
          {saving ? '⏳ Saqlanmoqda...' : '💾 Sozlamalarni saqlash'}
        </button>
      </div>

      {/* ═══ Arxiv ═══ */}
      {archives.length > 0 && (
        <div className="profile-section">
          <div className="section-header">
            <h3>📁 O'quv yili arxivlari</h3>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {archives.map(a => (
              <div key={a.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.85rem 1.25rem', borderRadius: '10px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>📅 {a.year_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {a.students_count} o'quvchi • {a.classes} • {new Date(a.archived_at).toLocaleDateString('uz-UZ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Yangi o'quv yili MODAL ═══ */}
      {showNewYearModal && (
        <div className="modal-overlay" onClick={() => setShowNewYearModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔄 Yangi o'quv yiliga o'tish</h2>
              <button className="close-btn" onClick={() => setShowNewYearModal(false)}>✕</button>
            </div>
            <div className="modal-form">
              <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.08)', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#dc2626', lineHeight: 1.6 }}>
                  <strong>⚠️ DIQQAT!</strong> Bu amal qaytarib bo'lmaydi!<br /><br />
                  • Barcha o'quvchilar natijalari <strong>arxivlanadi</strong><br />
                  • O'zlashtirish, daraja, bonus ballar <strong>0 ga qaytadi</strong><br />
                  • Darslar "o'tilmagan" holatga qaytadi<br />
                  • Dars mazmuni, testlar, topshiriqlar <strong>saqlanadi</strong>
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>O'quv yili nomi (ixtiyoriy)</label>
                <input type="text" value={yearName}
                  onChange={e => setYearName(e.target.value)}
                  placeholder={`${new Date().getFullYear() - 1}-${new Date().getFullYear()}`}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label><strong>Parolingizni kiriting (tasdiqlash uchun)</strong></label>
                <input type="password" value={yearPassword}
                  onChange={e => setYearPassword(e.target.value)}
                  placeholder="Parolingiz"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowNewYearModal(false)}>Bekor qilish</button>
              <button className="btn btn-danger" onClick={handleNewYear} disabled={yearLoading} style={{ background: '#dc2626', color: '#fff' }}>
                {yearLoading ? '⏳ Arxivlanmoqda...' : '🔄 Yangi yilga o\'tish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Ko'chirish MODAL ═══ */}
      {showMoveModal && (
        <div className="modal-overlay" onClick={() => setShowMoveModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 O'quvchilarni ko'chirish</h2>
              <button className="close-btn" onClick={() => setShowMoveModal(false)}>✕</button>
            </div>
            <div className="modal-form">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Bir sinfdagi barcha o'quvchilarni boshqa sinfga ko'chirish (masalan 9-A → 10-A)
              </p>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Qaysi sinfdan</label>
                  <input type="text" value={moveFrom} onChange={e => setMoveFrom(e.target.value)}
                    placeholder="9-A"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="form-group">
                  <label>Qaysi sinfga</label>
                  <input type="text" value={moveTo} onChange={e => setMoveTo(e.target.value)}
                    placeholder="10-A"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowMoveModal(false)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={handleMoveStudents}>📋 Ko'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
