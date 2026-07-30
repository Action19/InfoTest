import React, { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * TelegramParentSection — O'quvchi profilida ota-ona Telegram ulanish bo'limi
 */
const TelegramParentSection = () => {
  const [link, setLink] = useState('');
  const [connected, setConnected] = useState(false);
  const [parentName, setParentName] = useState('');
  const [connectedAt, setConnectedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchLink();
  }, []);

  const fetchLink = async () => {
    try {
      const res = await api.get('/telegram/link');
      setLink(res.data.link);
      setConnected(res.data.connected);
      setParentName(res.data.parent_name);
      setConnectedAt(res.data.connected_at);
    } catch (err) {
      console.error('Telegram link error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Ota-ona Telegram aloqasini uzishni tasdiqlaysizmi?")) return;
    try {
      await api.delete('/telegram/disconnect');
      setConnected(false);
      setParentName('');
      fetchLink();
    } catch (err) {
      alert('Xatolik: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return null;

  return (
    <div className="profile-section" style={{ marginTop: '1.5rem' }}>
      <div className="section-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📱 Ota-ona Telegram
        </h3>
      </div>

      {connected ? (
        /* ── Ulangan holat ── */
        <div style={{
          background: 'rgba(34,197,94,0.06)', borderRadius: '14px',
          padding: '1.25rem', border: '1px solid rgba(34,197,94,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <div>
              <div style={{ fontWeight: 600, color: '#16a34a' }}>Ulangan</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {parentName && `${parentName} • `}
                {connectedAt && new Date(connectedAt).toLocaleDateString('uz-UZ')}
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1rem', lineHeight: 1.5 }}>
            Ota-onangizga har hafta sizning o'zlashtirish natijalaringiz va AI tavsiyalari Telegram orqali yuboriladi.
          </p>
          <button onClick={handleDisconnect} className="btn btn-sm btn-outline" style={{ color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }}>
            Uzish
          </button>
        </div>
      ) : (
        /* ── Ulanmagan holat ── */
        <div style={{
          background: 'var(--bg-secondary)', borderRadius: '14px',
          padding: '1.25rem', border: '1px solid var(--border-color)'
        }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0 0 1rem', lineHeight: 1.6 }}>
            Ota-onangizni Telegram orqali ulang — har hafta sizning natijalaringiz va AI tavsiyalari yuboriladi.
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              📋 Quyidagi havolani ota-onangizga yuboring:
            </div>
            <div style={{
              display: 'flex', gap: '0.5rem', alignItems: 'center',
              background: 'var(--card-bg)', padding: '0.6rem 0.9rem',
              borderRadius: '8px', border: '1px solid var(--border-color)'
            }}>
              <input
                type="text"
                readOnly
                value={link}
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  color: 'var(--primary-color)', fontSize: '0.82rem',
                  outline: 'none', fontFamily: 'monospace'
                }}
              />
              <button onClick={handleCopy} className="btn btn-sm btn-primary">
                {copied ? '✅ Nusxalandi' : '📋 Nusxalash'}
              </button>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong>Qanday ishlaydi:</strong><br />
            1. Havolani ota-onangizga yuboring (Telegram, SMS yoki boshqa)<br />
            2. Ota-onangiz havolani bosadi → @InfoBahoBot ochiladi<br />
            3. "Start" bosadi → ulanish tayyor!<br />
            4. Har hafta natijalar + AI tavsiya yuboriladi
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramParentSection;
