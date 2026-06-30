import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../assets/css/Pages.css';

const LessonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLesson();
  }, [id]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/lessons/${id}`);
      setLesson(response.data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      setError(error.response?.data?.error || 'Darsni olishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      alert('Fayl hajmi 50MB dan oshmasligi kerak!');
      return;
    }

    // Check file type
    const allowedTypes = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      alert('Faqat PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX, TXT va rasm fayllari qabul qilinadi!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingFile(true);
      await api.post(`/lessons/${id}/materials`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchLesson(); // Refresh lesson data
      e.target.value = ''; // Clear file input
    } catch (error) {
      alert(error.response?.data?.error || 'Materialni yuklashda xatolik yuz berdi');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Materialni o\'chirishni tasdiqlaysizmi?')) {
      return;
    }

    try {
      await api.delete(`/lessons/${id}/materials/${materialId}`);
      fetchLesson();
    } catch (error) {
      alert(error.response?.data?.error || 'Materialni o\'chirishda xatolik yuz berdi');
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const icons = {
      pdf: '📄',
      ppt: '📊',
      pptx: '📊',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      txt: '📃',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️'
    };
    return icons[ext] || '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <h3>Xatolik yuz berdi</h3>
          <p>{error || 'Dars topilmadi'}</p>
          <button onClick={() => navigate('/lessons')} className="btn btn-primary">
            Darslar ro'yxatiga qaytish
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user.id === lesson.created_by || user.role === 'admin';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>{lesson.title}</h1>
          <p className="subtitle">
            {lesson.grade}-sinf • {lesson.subject} • {lesson.creator?.full_name || 'Noma\'lum'}
          </p>
        </div>
        {isOwner && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/lessons/${id}/edit`} className="btn btn-outline">
              Tahrirlash
            </Link>
          </div>
        )}
      </div>

      {lesson.description && (
        <div className="profile-section" style={{ marginBottom: '2rem' }}>
          <h3>Tavsif</h3>
          <p style={{ marginTop: '1rem', lineHeight: '1.6' }}>{lesson.description}</p>
        </div>
      )}

      {lesson.content && (
        <div className="profile-section" style={{ marginBottom: '2rem' }}>
          <h3>Dars tarkibi</h3>
          <div style={{ marginTop: '1rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
            {lesson.content}
          </div>
        </div>
      )}

      <div className="profile-section" style={{ marginBottom: '2rem' }}>
        <div className="section-header">
          <h3>📎 Materiallar ({lesson.materials?.length || 0})</h3>
          {isOwner && (
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              {uploadingFile ? 'Yuklanmoqda...' : '➕ Material yuklash'}
              <input
                type="file"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={uploadingFile}
                accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
              />
            </label>
          )}
        </div>

        {lesson.materials && lesson.materials.length > 0 ? (
          <div className="materials-list" style={{ marginTop: '1.5rem' }}>
            {lesson.materials.map((material) => (
              <div key={material.id} className="material-item">
                <div className="material-info">
                  <span className="material-icon">{getFileIcon(material.file_name)}</span>
                  <div>
                    <h4>{material.file_name}</h4>
                    <p className="material-meta">
                      {formatFileSize(material.file_size)} • 
                      {new Date(material.uploaded_at).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                </div>
                <div className="material-actions">
                  <a
                    href={`${process.env.REACT_APP_API_URL.replace('/api', '')}${material.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline"
                  >
                    Yuklab olish
                  </a>
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteMaterial(material.id)}
                      className="btn btn-sm btn-danger"
                    >
                      O'chirish
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
            Hozircha materiallar yuklanmagan
          </p>
        )}
      </div>

      <div className="profile-section">
        <div className="section-header">
          <h3>📝 Testlar ({lesson.tests?.length || 0})</h3>
          {isOwner && (
            <Link to="/tests" className="btn btn-primary">
              ➕ Test yaratish
            </Link>
          )}
        </div>

        {lesson.tests && lesson.tests.length > 0 ? (
          <div className="tests-list" style={{ marginTop: '1.5rem' }}>
            {lesson.tests.map((test) => (
              <div key={test.id} className="test-item">
                <div className="test-item-content">
                  <h4>{test.title}</h4>
                  <p className="test-meta">
                    {test.questions_count} savol • {test.time_limit} daqiqa • 
                    {test.attempts_count} ta urinish
                  </p>
                </div>
                <Link to={`/tests/${test.id}`} className="btn btn-primary">
                  Testni boshlash
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
            Bu darsga oid testlar hali yaratilmagan
          </p>
        )}
      </div>
    </div>
  );
};

export default LessonDetail;
