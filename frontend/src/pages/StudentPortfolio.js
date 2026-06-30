import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../assets/css/Pages.css';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace('/api', '');

// ─── Helpers ─────────────────────────────────────────────────
const TYPE_LABELS  = { project:'Loyiha', certificate:'Sertifikat', achievement:'Yutuq', test_result:'Test natijasi' };
const TYPE_ICONS   = { project:'💻', certificate:'🏆', achievement:'⭐', test_result:'📊' };
const LEVEL_COLORS = ['bronze','silver','gold','platinum','diamond'];
const IMG_EXTS     = ['jpg','jpeg','png','gif','webp'];

function isImageUrl(url) {
  if (!url || !url.startsWith('/')) return false;
  const ext = url.split('.').pop().toLowerCase();
  return IMG_EXTS.includes(ext);
}
function fileIcon(type) {
  return { image:'🖼️', pdf:'📄', doc:'📝', video:'🎬', zip:'📦' }[type] || '📎';
}

// ─── Lightbox ─────────────────────────────────────────────────
const Lightbox = ({ src, alt, onClose }) => (
  <div onClick={onClose} style={{
    position:'fixed', inset:0, background:'rgba(0,0,0,0.92)',
    display:'flex', alignItems:'center', justifyContent:'center',
    zIndex:9999, cursor:'zoom-out'
  }}>
    <img src={src} alt={alt}
      style={{ maxWidth:'92vw', maxHeight:'92vh', borderRadius:'8px', objectFit:'contain' }}
      onClick={e => e.stopPropagation()} />
    <button onClick={onClose} style={{
      position:'absolute', top:'1.5rem', right:'1.5rem',
      background:'rgba(255,255,255,0.2)', border:'none', color:'#fff',
      width:'40px', height:'40px', borderRadius:'50%', fontSize:'1.1rem', cursor:'pointer'
    }}>✕</button>
  </div>
);

// ─── Portfolio Card (o'qituvchi ko'rinishi) ───────────────────
const StudentPortfolioCard = ({ item, onView }) => {
  const [lightbox, setLightbox] = useState(false);
  const imageUrl = isImageUrl(item.file_url) ? `${API_BASE}${item.file_url}` : null;
  const hasFile  = item.file_url?.startsWith('/') && !imageUrl;

  return (
    <div
      onClick={() => onView(item)}
      style={{
        background:'var(--card-bg)', borderRadius:'14px',
        border:'1px solid var(--border-color)', overflow:'hidden',
        cursor:'pointer', transition:'box-shadow 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

      {/* ── Rasm miniaturasi ── */}
      {imageUrl && (
        <div style={{ position:'relative', paddingTop:'56.25%', overflow:'hidden', background:'var(--bg-secondary)' }}>
          <img src={imageUrl} alt={item.title}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
          {/* Kattalashtirish tugmasi */}
          <button onClick={e => { e.stopPropagation(); setLightbox(true); }}
            style={{
              position:'absolute', bottom:'0.5rem', right:'0.5rem',
              background:'rgba(0,0,0,0.65)', color:'#fff', border:'none',
              borderRadius:'6px', padding:'0.25rem 0.6rem',
              fontSize:'0.72rem', cursor:'pointer'
            }}>🔍 Kattalashtirish</button>
        </div>
      )}
      {lightbox && <Lightbox src={imageUrl} alt={item.title} onClose={() => setLightbox(false)} />}

      <div style={{ padding:'1rem' }}>
        {/* Sarlavha */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.4rem' }}>
          <span style={{ fontSize:'1.15rem' }}>{TYPE_ICONS[item.item_type] || '📌'}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:'0.9rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {item.title}
            </div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginTop:'1px' }}>
              {TYPE_LABELS[item.item_type]} · {new Date(item.created_at).toLocaleDateString('uz-UZ')}
              {item.is_public && <span style={{ color:'#16a34a', marginLeft:'0.5rem' }}>🌐</span>}
            </div>
          </div>
        </div>

        {/* Tavsif */}
        {item.description && (
          <p style={{
            fontSize:'0.8rem', color:'var(--text-secondary)', margin:'0.4rem 0 0.6rem',
            lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2,
            WebkitBoxOrient:'vertical', overflow:'hidden'
          }}>{item.description}</p>
        )}

        {/* Fayl (rasm emas) — yuklab olish tugmasi */}
        {hasFile && (
          <a href={`${API_BASE}${item.file_url}`}
            target="_blank" rel="noopener noreferrer"
            download={item.file_name}
            onClick={e => e.stopPropagation()}
            style={{
              display:'inline-flex', alignItems:'center', gap:'0.4rem',
              fontSize:'0.78rem', color:'#fff', background:'var(--primary-color)',
              padding:'0.3rem 0.75rem', borderRadius:'6px', textDecoration:'none',
              marginBottom:'0.4rem'
            }}>
            ⬇️ {item.file_name || 'Yuklab olish'}
          </a>
        )}

        {/* Tashqi URL */}
        {item.file_url && !item.file_url.startsWith('/') && (
          <a href={item.file_url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display:'inline-flex', alignItems:'center', gap:'0.3rem',
              fontSize:'0.78rem', color:'var(--primary-color)', textDecoration:'none'
            }}>
            🔗 Havolani ochish
          </a>
        )}

        {/* Teglar */}
        {item.tags?.length > 0 && (
          <div style={{ display:'flex', gap:'0.3rem', flexWrap:'wrap', marginTop:'0.5rem' }}>
            {item.tags.slice(0,4).map((t,i) => (
              <span key={i} style={{
                fontSize:'0.68rem', background:'rgba(99,102,241,0.1)',
                color:'#6366f1', padding:'2px 8px', borderRadius:'20px'
              }}>#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Detail Modal (o'qituvchi) ────────────────────────────────
const DetailModal = ({ item, onClose }) => {
  const [lightbox, setLightbox] = useState(false);
  const imageUrl = isImageUrl(item.file_url) ? `${API_BASE}${item.file_url}` : null;
  const hasFile  = item.file_url?.startsWith('/') && !imageUrl;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <span style={{ fontSize:'1.8rem' }}>{TYPE_ICONS[item.item_type]}</span>
            <div>
              <h2 style={{ margin:0 }}>{item.title}</h2>
              <p style={{ margin:'0.2rem 0 0', color:'var(--text-secondary)', fontSize:'0.82rem' }}>
                {TYPE_LABELS[item.item_type]} · {new Date(item.created_at).toLocaleDateString('uz-UZ')}
                {item.is_public && <span style={{ color:'#16a34a', marginLeft:'0.5rem' }}>🌐 Ommaviy</span>}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding:'1.5rem' }}>

          {/* Rasm to'liq ko'rinish */}
          {imageUrl && (
            <div style={{ marginBottom:'1.25rem', textAlign:'center' }}>
              <img src={imageUrl} alt={item.title}
                onClick={() => setLightbox(true)}
                style={{
                  maxWidth:'100%', maxHeight:'380px', objectFit:'contain',
                  borderRadius:'10px', cursor:'zoom-in',
                  border:'1px solid var(--border-color)'
                }} />
              <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginTop:'0.4rem' }}>
                🔍 Kattalashtirish uchun bosing
              </div>
            </div>
          )}
          {lightbox && <Lightbox src={imageUrl} alt={item.title} onClose={() => setLightbox(false)} />}

          {/* Tavsif */}
          {item.description && (
            <div style={{ marginBottom:'1rem' }}>
              <div style={{
                fontWeight:600, marginBottom:'0.4rem', fontSize:'0.82rem',
                color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em'
              }}>Tavsif</div>
              <p style={{ lineHeight:1.7, margin:0 }}>{item.description}</p>
            </div>
          )}

          {/* Fayl yuklab olish */}
          {hasFile && (
            <div style={{ marginBottom:'1rem' }}>
              <div style={{
                fontWeight:600, marginBottom:'0.6rem', fontSize:'0.82rem',
                color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em'
              }}>Yuklangan fayl</div>
              <a href={`${API_BASE}${item.file_url}`}
                target="_blank" rel="noopener noreferrer"
                download={item.file_name}
                style={{
                  display:'inline-flex', alignItems:'center', gap:'0.5rem',
                  background:'var(--primary-color)', color:'#fff',
                  padding:'0.5rem 1.25rem', borderRadius:'8px',
                  textDecoration:'none', fontWeight:600, fontSize:'0.9rem'
                }}>
                ⬇️ {item.file_name || 'Yuklab olish'}
              </a>
              {item.file_size && (
                <span style={{ marginLeft:'0.75rem', fontSize:'0.78rem', color:'var(--text-secondary)' }}>
                  ({item.file_size < 1024*1024
                    ? (item.file_size/1024).toFixed(0)+' KB'
                    : (item.file_size/1024/1024).toFixed(1)+' MB'})
                </span>
              )}
            </div>
          )}

          {/* Tashqi URL */}
          {item.file_url && !item.file_url.startsWith('/') && (
            <div style={{ marginBottom:'1rem' }}>
              <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem' }}>
                🔗 Havolani ochish
              </a>
            </div>
          )}

          {/* Teglar */}
          {item.tags?.length > 0 && (
            <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginTop:'0.75rem' }}>
              {item.tags.map((t,i) => (
                <span key={i} style={{
                  fontSize:'0.78rem', background:'rgba(99,102,241,0.1)',
                  color:'#6366f1', padding:'3px 10px', borderRadius:'20px'
                }}>#{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>Yopish</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main StudentPortfolio Page ────────────────────────────────
const StudentPortfolio = () => {
  const { userId }   = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [student,      setStudent]      = useState(null);
  const [items,        setItems]        = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('all');
  const [viewItem,     setViewItem]     = useState(null);

  useEffect(() => {
    if (user.role === 'student') { navigate('/portfolio'); return; }
    fetchAll();
  }, [userId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [uRes, pRes, sRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/portfolio/${userId}`),
        api.get(`/statistics/user/${userId}`).catch(() => ({ data:{} }))
      ]);
      setStudent(uRes.data);
      setItems(Array.isArray(pRes.data.portfolio) ? pRes.data.portfolio : []);
      setAchievements(sRes.data?.achievements || []);
      setStats(sRes.data);
    } catch (err) {
      console.error(err);
      alert("Ma'lumotlarni yuklashda xatolik");
    } finally { setLoading(false); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"/><p>Yuklanmoqda...</p></div>;
  if (!student) return <div className="error-container"><h2>Talaba topilmadi</h2><Link to="/students" className="btn btn-primary">Orqaga</Link></div>;

  const levelLabel = (LEVEL_COLORS[student.level-1] || 'bronze').toUpperCase();
  const filtered   = filter === 'all' ? items : items.filter(i => i.item_type === filter);

  // Kategoriyalar soni
  const counts = items.reduce((acc, i) => { acc[i.item_type]=(acc[i.item_type]||0)+1; return acc; }, {});

  return (
    <div className="page-container">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <Link to="/students" className="btn btn-outline" style={{ marginBottom:'0.5rem', display:'inline-block' }}>
            ← Orqaga
          </Link>
          <h1>💼 {student.full_name || student.username}</h1>
          <p className="subtitle">@{student.username} · {student.class_name} sinf</p>
        </div>
      </div>

      {/* ── Statistika ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
        <div className="stat-card" style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff' }}>
          <div className="stat-icon">🏅</div>
          <div className="stat-content">
            <h3 style={{ color:'#fff' }}>Daraja {student.level}</h3>
            <p style={{ color:'rgba(255,255,255,0.85)' }}>{levelLabel}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content"><h3>{student.points}</h3><p>Jami ballar</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats?.totalAttempts || 0}</h3><p>Testlar</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{stats?.averageScore ? `${stats.averageScore.toFixed(1)}%` : '0%'}</h3>
            <p>O'rtacha ball</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-content"><h3>{items.length}</h3><p>Portfolio</p></div>
        </div>
      </div>

      {/* ── Yutuqlar ── */}
      {achievements.length > 0 && (
        <div className="section" style={{ marginBottom:'2rem' }}>
          <h2>🏆 Yutuqlar</h2>
          <div className="achievements-grid">
            {achievements.map(a => (
              <div key={a.id} className="achievement-card">
                <div className="achievement-icon-large">{a.icon||'🏆'}</div>
                <h3>{a.title}</h3>
                <p>{a.description}</p>
                <div className="achievement-date">{new Date(a.earned_at).toLocaleDateString('uz-UZ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Portfolio ── */}
      <div className="section">
        <h2>💼 Portfolio elementlari</h2>

        {/* Filter tabs */}
        <div style={{
          display:'flex', gap:'0.4rem', marginBottom:'1.5rem',
          borderBottom:'2px solid var(--border-color)', paddingBottom:0, overflowX:'auto'
        }}>
          {[
            { id:'all',         label:`Barchasi (${items.length})` },
            { id:'project',     label:`💻 Loyihalar (${counts.project||0})` },
            { id:'certificate', label:`🏆 Sertifikatlar (${counts.certificate||0})` },
            { id:'achievement', label:`⭐ Yutuqlar (${counts.achievement||0})` },
            { id:'test_result', label:`📊 Testlar (${counts.test_result||0})` },
          ].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)} style={{
              padding:'0.5rem 1rem', border:'none', cursor:'pointer', background:'transparent',
              borderBottom: filter===t.id ? '3px solid var(--primary-color)' : '3px solid transparent',
              color: filter===t.id ? 'var(--primary-color)' : 'var(--text-secondary)',
              fontWeight: filter===t.id ? 700 : 400,
              fontSize:'0.85rem', marginBottom:'-2px', transition:'all 0.2s', whiteSpace:'nowrap'
            }}>{t.label}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💼</div>
            <h3>{filter==='all' ? "Portfolio bo'sh" : "Bu kategoriyada elementlar yo'q"}</h3>
            <p>O'quvchi hali hech narsa qo'shmagan</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1.25rem' }}>
            {filtered.map(item => (
              <StudentPortfolioCard key={item.id} item={item} onView={setViewItem} />
            ))}
          </div>
        )}
      </div>

      {viewItem && <DetailModal item={viewItem} onClose={() => setViewItem(null)} />}
    </div>
  );
};

export default StudentPortfolio;
