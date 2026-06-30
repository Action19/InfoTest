import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../assets/css/Pages.css';

const LessonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Lesson state
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState('');

  // Test management state
  const [selectedTest, setSelectedTest] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [testStats, setTestStats] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);

  // Modals
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // New test form
  const [newTest, setNewTest] = useState({
    title: '',
    description: '',
    subject: '',
    duration: 30,
    difficulty: 'medium',
    passing_score: 60
  });

  // New question form
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'single_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1,
    explanation: ''
  });

  // AI prompt
  const [aiPrompt, setAiPrompt] = useState({
    topic: '',
    count: 5,
    difficulty: 'medium',
    questionType: 'single_choice'
  });


  useEffect(() => {
    fetchLesson();
  }, [id]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/lessons/${id}`);
      setLesson(response.data);
      // Auto-select the first test if any
      if (response.data.tests && response.data.tests.length > 0 && !selectedTest) {
        // Don't auto-select, let user choose
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Darsni olishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const fetchTestDetails = async (testId) => {
    try {
      setLoadingTest(true);
      const [questionsRes, statsRes] = await Promise.all([
        api.get(`/questions/test/${testId}`).catch(() => ({ data: [] })),
        api.get(`/tests/${testId}/statistics`).catch(() => ({ data: null }))
      ]);
      setTestQuestions(Array.isArray(questionsRes.data) ? questionsRes.data : []);
      setTestStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching test details:', err);
      setTestQuestions([]);
      setTestStats(null);
    } finally {
      setLoadingTest(false);
    }
  };

  const handleSelectTest = async (test) => {
    setSelectedTest(test);
    await fetchTestDetails(test.id);
  };

  // ─── File upload ──────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert('Fayl hajmi 50MB dan oshmasligi kerak!'); return; }
    const allowedTypes = ['pdf','ppt','pptx','doc','docx','xls','xlsx','txt','jpg','jpeg','png'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExt)) { alert('Ruxsat etilmagan fayl turi!'); return; }
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploadingFile(true);
      await api.post(`/lessons/${id}/materials`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchLesson();
      e.target.value = '';
    } catch (err) {
      alert(err.response?.data?.error || 'Materialni yuklashda xatolik');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm("Materialni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/lessons/${id}/materials/${materialId}`);
      fetchLesson();
    } catch (err) {
      alert(err.response?.data?.error || "Materialni o'chirishda xatolik");
    }
  };



  // ─── Test CRUD ────────────────────────────────────────────────
  const handleCreateTest = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/tests', {
        ...newTest,
        lesson_id: parseInt(id),
        subject: newTest.subject || lesson.subject
      });
      setNewTest({ title: '', description: '', subject: '', duration: 30, difficulty: 'medium', passing_score: 60 });
      setShowCreateTestModal(false);
      await fetchLesson();
      // Auto-select newly created test
      if (response.data.test) {
        setSelectedTest(response.data.test);
        await fetchTestDetails(response.data.test.id);
      }
    } catch (err) {
      alert('Test yaratishda xatolik: ' + (err.response?.data?.error || err.message));
    }
  };

  const handlePublishTest = async (testId, isPublished) => {
    try {
      if (isPublished) {
        await api.put(`/tests/${testId}/unpublish`);
      } else {
        await api.put(`/tests/${testId}/publish`);
      }
      await fetchLesson();
      // Refresh selected test info
      const updatedTest = lesson.tests?.find(t => t.id === testId);
      if (updatedTest) {
        const res = await api.get(`/tests/${testId}`);
        setSelectedTest(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Testni nashr qilishda xatolik');
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm("Testni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/tests/${testId}`);
      setSelectedTest(null);
      setTestQuestions([]);
      await fetchLesson();
    } catch (err) {
      alert(err.response?.data?.error || "Testni o'chirishda xatolik");
    }
  };

  // ─── Question CRUD ────────────────────────────────────────────
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await api.post('/questions', {
        test_id: selectedTest.id,
        question_text: newQuestion.question_text,
        question_type: newQuestion.question_type,
        options: JSON.stringify(newQuestion.options),
        correct_answer: newQuestion.correct_answer,
        points: newQuestion.points,
        explanation: newQuestion.explanation
      });
      setNewQuestion({ question_text: '', question_type: 'single_choice', options: ['','','',''], correct_answer: '', points: 1, explanation: '' });
      setShowAddQuestionModal(false);
      await fetchTestDetails(selectedTest.id);
      await fetchLesson();
    } catch (err) {
      alert("Savol qo'shishda xatolik: " + (err.response?.data?.error || err.message));
    }
  };

  const handleEditQuestion = (question) => {
    let options = ['', '', '', ''];
    if (question.options) {
      options = Array.isArray(question.options) ? [...question.options]
        : (() => { try { return JSON.parse(question.options); } catch { return options; } })();
    }
    setEditingQuestion({ ...question, options });
    setShowEditQuestionModal(true);
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/questions/${editingQuestion.id}`, {
        question_text: editingQuestion.question_text,
        question_type: editingQuestion.question_type,
        options: JSON.stringify(editingQuestion.options),
        correct_answer: editingQuestion.correct_answer,
        points: editingQuestion.points,
        explanation: editingQuestion.explanation
      });
      setShowEditQuestionModal(false);
      setEditingQuestion(null);
      await fetchTestDetails(selectedTest.id);
    } catch (err) {
      alert('Savolni yangilashda xatolik: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Savolni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/questions/${questionId}`);
      setShowEditQuestionModal(false);
      setEditingQuestion(null);
      await fetchTestDetails(selectedTest.id);
      await fetchLesson();
    } catch (err) {
      alert("Savolni o'chirishda xatolik: " + (err.response?.data?.error || err.message));
    }
  };

  const handleGenerateAI = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    try {
      const response = await api.post('/questions/generate-ai', {
        test_id: selectedTest.id,
        topic: aiPrompt.topic || selectedTest.subject,
        count: aiPrompt.count,
        difficulty: aiPrompt.difficulty,
        question_type: aiPrompt.questionType
      });
      alert(`${response.data.count} ta savol muvaffaqiyatli yaratildi!`);
      setShowAIModal(false);
      setAiPrompt({ topic: '', count: 5, difficulty: 'medium', questionType: 'single_choice' });
      await fetchTestDetails(selectedTest.id);
      await fetchLesson();
    } catch (err) {
      alert('AI savol yaratishda xatolik: ' + (err.response?.data?.error || err.message));
    } finally {
      setAiLoading(false);
    }
  };



  // ─── Helpers ──────────────────────────────────────────────────
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    return { pdf:'📄', ppt:'📊', pptx:'📊', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', txt:'📃', jpg:'🖼️', jpeg:'🖼️', png:'🖼️' }[ext] || '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getQuestionTypeLabel = (type) => ({
    single_choice: 'Bir tanlovli',
    multiple_choice: "Ko'p tanlovli",
    true_false: "To'g'ri/Noto'g'ri",
    short_answer: 'Qisqa javob',
    code_writing: 'Kod yozish',
    matching: 'Moslashtirish'
  }[type] || type);

  const getDifficultyLabel = (d) => ({ easy: 'Oson', medium: "O'rta", hard: 'Qiyin' }[d] || d);
  const getDifficultyColor = (d) => ({ easy: 'badge-success', medium: 'badge-warning', hard: 'badge-danger' }[d] || 'badge-secondary');

  const isOwner = user && lesson && (user.id === lesson.created_by || user.role === 'admin');

  // ─── Loading / Error states ───────────────────────────────────
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



  return (
    <div className="page-container">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/lessons')} className="btn btn-outline" style={{ marginBottom: '0.5rem' }}>
            ← Darslar ro'yxati
          </button>
          <h1>{lesson.title}</h1>
          <p className="subtitle">
            {lesson.grade}-sinf • {lesson.subject} • {lesson.creator?.full_name || "Noma'lum o'qituvchi"}
          </p>
        </div>
        {isOwner && (
          <Link to={`/lessons/${id}/edit`} className="btn btn-outline">✏️ Tahrirlash</Link>
        )}
      </div>

      {/* ── Description ── */}
      {lesson.description && (
        <div className="profile-section" style={{ marginBottom: '2rem' }}>
          <h3>📋 Tavsif</h3>
          <p style={{ marginTop: '1rem', lineHeight: '1.7' }}>{lesson.description}</p>
        </div>
      )}

      {/* ── Content ── */}
      {lesson.content && (
        <div className="profile-section" style={{ marginBottom: '2rem' }}>
          <h3>📖 Dars tarkibi</h3>
          <div style={{ marginTop: '1rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{lesson.content}</div>
        </div>
      )}

      {/* ── Materials ── */}
      <div className="profile-section" style={{ marginBottom: '2rem' }}>
        <div className="section-header">
          <h3>📎 Materiallar ({lesson.materials?.length || 0})</h3>
          {isOwner && (
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              {uploadingFile ? 'Yuklanmoqda...' : '➕ Material yuklash'}
              <input type="file" onChange={handleFileUpload} style={{ display: 'none' }}
                disabled={uploadingFile}
                accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png" />
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
                      {formatFileSize(material.file_size)} • {new Date(material.uploaded_at).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                </div>
                <div className="material-actions">
                  <a href={`${process.env.REACT_APP_API_URL?.replace('/api', '')}${material.file_path}`}
                    target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                    ⬇️ Yuklab olish
                  </a>
                  {isOwner && (
                    <button onClick={() => handleDeleteMaterial(material.id)} className="btn btn-sm btn-danger">
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Hozircha materiallar yuklanmagan</p>
        )}
      </div>



      {/* ── Tests section ── */}
      <div className="profile-section">
        <div className="section-header">
          <h3>📝 Testlar ({lesson.tests?.length || 0})</h3>
          {isOwner && (
            <button onClick={() => setShowCreateTestModal(true)} className="btn btn-primary">
              ➕ Yangi test
            </button>
          )}
        </div>

        {(!lesson.tests || lesson.tests.length === 0) ? (
          <div className="empty-state" style={{ padding: '2rem 0' }}>
            <div className="empty-icon">📝</div>
            <p>{isOwner ? "Bu darsga hali test yaratilmagan. Yuqoridagi tugmani bosing!" : "Bu darsga oid testlar hali yaratilmagan"}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

            {/* Test list (left column) */}
            <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {lesson.tests.map((test) => (
                <div
                  key={test.id}
                  onClick={() => handleSelectTest(test)}
                  className={`test-item${selectedTest?.id === test.id ? ' selected-test-item' : ''}`}
                  style={{
                    cursor: 'pointer',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: selectedTest?.id === test.id
                      ? '2px solid var(--primary-color)'
                      : '2px solid var(--border-color)',
                    background: selectedTest?.id === test.id
                      ? 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))'
                      : 'var(--card-bg)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.3' }}>{test.title}</h4>
                    <span className={`badge ${test.is_published ? 'badge-success' : 'badge-secondary'}`} style={{ whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                      {test.is_published ? 'Nashr' : 'Qoralama'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <span>❓ {test.questions_count || 0} savol</span>
                    <span>⏱️ {test.time_limit || test.duration} daq</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Test detail (right column) */}
            {selectedTest && (
              <div style={{ flex: 1, minWidth: 0 }}>
                {loadingTest ? (
                  <div className="loading-container" style={{ padding: '2rem' }}>
                    <div className="spinner"></div>
                    <p>Yuklanmoqda...</p>
                  </div>
                ) : (
                  <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>

                    {/* Test header */}
                    <div style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', color: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <h3 style={{ margin: 0, color: '#fff' }}>{selectedTest.title}</h3>
                          <p style={{ margin: '0.25rem 0 0', opacity: 0.85, fontSize: '0.85rem' }}>
                            {testQuestions.length} savol • {selectedTest.time_limit || selectedTest.duration} daqiqa • O'tish: {selectedTest.passing_score}%
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {user.role === 'student' && selectedTest.is_published && (
                            <Link to={`/tests/${selectedTest.id}`} className="btn btn-sm" style={{ background: '#fff', color: 'var(--primary-color)', fontWeight: 600 }}>
                              🚀 Testni boshlash
                            </Link>
                          )}
                          {isOwner && (
                            <>
                              <button
                                onClick={() => handlePublishTest(selectedTest.id, selectedTest.is_published)}
                                className="btn btn-sm"
                                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.5)' }}
                              >
                                {selectedTest.is_published ? '🔒 Yashirish' : '📢 Nashr qilish'}
                              </button>
                              <button
                                onClick={() => handleDeleteTest(selectedTest.id)}
                                className="btn btn-sm"
                                style={{ background: 'rgba(255,80,80,0.3)', color: '#fff', border: '1px solid rgba(255,80,80,0.5)' }}
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>



                    {/* Stats bar */}
                    {testStats && (
                      <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📊 {testStats.totalAttempts || 0} urinish</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>⌀ {testStats.averageScore ? testStats.averageScore.toFixed(1) + '%' : '0%'} o'rtacha</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🏆 {testStats.highestScore || 0}% eng yuqori</span>
                      </div>
                    )}

                    {/* Questions list */}
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h4 style={{ margin: 0 }}>Savollar ({testQuestions.length})</h4>
                        {isOwner && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setShowAddQuestionModal(true)} className="btn btn-sm btn-primary">
                              ➕ Savol qo'shish
                            </button>
                            <button onClick={() => setShowAIModal(true)} className="btn btn-sm btn-success">
                              🤖 AI bilan
                            </button>
                          </div>
                        )}
                      </div>

                      {testQuestions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                          <p>Hali savollar qo'shilmagan</p>
                          {isOwner && (
                            <button onClick={() => setShowAddQuestionModal(true)} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                              ➕ Birinchi savolni qo'shish
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {testQuestions.map((question, index) => (
                            <div key={question.id} style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border-color)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                                  <span style={{ background: 'var(--primary-color)', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                                    {index + 1}
                                  </span>
                                  <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontWeight: 500, lineHeight: '1.4' }}>{question.question_text}</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{getQuestionTypeLabel(question.question_type)}</span>
                                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{question.points} ball</span>
                                    </div>
                                  </div>
                                </div>
                                {isOwner && (
                                  <button onClick={() => handleEditQuestion(question)} className="btn btn-sm btn-outline" title="Tahrirlash">
                                    ✏️
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>



      {/* ════════════════════════ MODALS ════════════════════════ */}

      {/* Create Test Modal */}
      {showCreateTestModal && (
        <div className="modal-overlay" onClick={() => setShowCreateTestModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📝 Yangi test yaratish</h2>
              <button className="close-btn" onClick={() => setShowCreateTestModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTest} className="modal-form">
              <div className="form-group">
                <label>Test nomi *</label>
                <input type="text" value={newTest.title}
                  onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                  placeholder="Masalan: 1-mavzu bo'yicha test" required />
              </div>
              <div className="form-group">
                <label>Tavsif</label>
                <textarea value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  placeholder="Test haqida qisqacha..." rows="2" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Vaqt (daqiqa) *</label>
                  <input type="number" value={newTest.duration} min="1" max="180"
                    onChange={(e) => setNewTest({ ...newTest, duration: parseInt(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label>Qiyinlik</label>
                  <select value={newTest.difficulty} onChange={(e) => setNewTest({ ...newTest, difficulty: e.target.value })}>
                    <option value="easy">Oson</option>
                    <option value="medium">O'rta</option>
                    <option value="hard">Qiyin</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>O'tish bali (%)</label>
                  <input type="number" value={newTest.passing_score} min="1" max="100"
                    onChange={(e) => setNewTest({ ...newTest, passing_score: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Fan</label>
                  <input type="text" value={newTest.subject || lesson.subject}
                    onChange={(e) => setNewTest({ ...newTest, subject: e.target.value })}
                    placeholder={lesson.subject} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateTestModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary">✅ Yaratish</button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Add Question Modal */}
      {showAddQuestionModal && selectedTest && (
        <div className="modal-overlay" onClick={() => setShowAddQuestionModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Savol qo'shish</h2>
              <button className="close-btn" onClick={() => setShowAddQuestionModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddQuestion} className="modal-form">
              <div className="form-group">
                <label>Savol matni *</label>
                <textarea value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                  placeholder="Savolingizni kiriting..." rows="3" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Savol turi</label>
                  <select value={newQuestion.question_type}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question_type: e.target.value })}>
                    <option value="single_choice">Bir tanlovli</option>
                    <option value="multiple_choice">Ko'p tanlovli</option>
                    <option value="true_false">To'g'ri/Noto'g'ri</option>
                    <option value="short_answer">Qisqa javob</option>
                    <option value="code_writing">Kod yozish</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ballar</label>
                  <input type="number" value={newQuestion.points} min="1" max="10"
                    onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) })} />
                </div>
              </div>
              {(newQuestion.question_type === 'single_choice' || newQuestion.question_type === 'multiple_choice') && (
                <div className="form-group">
                  <label>Javob variantlari *</label>
                  {newQuestion.options.map((option, index) => (
                    <input key={index} type="text" value={option}
                      onChange={(e) => {
                        const opts = [...newQuestion.options];
                        opts[index] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: opts });
                      }}
                      placeholder={`Variant ${index + 1}`} required style={{ marginBottom: '8px' }} />
                  ))}
                </div>
              )}
              <div className="form-group">
                <label>To'g'ri javob *</label>
                <input type="text" value={newQuestion.correct_answer}
                  onChange={(e) => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })}
                  placeholder={newQuestion.question_type === 'true_false' ? "true yoki false" : "To'g'ri javobni kiriting"} required />
              </div>
              <div className="form-group">
                <label>Tushuntirish (ixtiyoriy)</label>
                <textarea value={newQuestion.explanation}
                  onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                  placeholder="Javob haqida tushuntirish..." rows="2" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddQuestionModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary">➕ Qo'shish</button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Edit Question Modal */}
      {showEditQuestionModal && editingQuestion && (
        <div className="modal-overlay" onClick={() => setShowEditQuestionModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Savolni tahrirlash</h2>
              <button className="close-btn" onClick={() => setShowEditQuestionModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateQuestion} className="modal-form">
              <div className="form-group">
                <label>Savol matni *</label>
                <textarea value={editingQuestion.question_text}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                  rows="3" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Savol turi</label>
                  <select value={editingQuestion.question_type}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question_type: e.target.value })}>
                    <option value="single_choice">Bir tanlovli</option>
                    <option value="multiple_choice">Ko'p tanlovli</option>
                    <option value="true_false">To'g'ri/Noto'g'ri</option>
                    <option value="short_answer">Qisqa javob</option>
                    <option value="code_writing">Kod yozish</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ballar</label>
                  <input type="number" value={editingQuestion.points} min="1" max="10"
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, points: parseInt(e.target.value) })} />
                </div>
              </div>
              {(editingQuestion.question_type === 'single_choice' || editingQuestion.question_type === 'multiple_choice') && (
                <div className="form-group">
                  <label>Javob variantlari *</label>
                  {editingQuestion.options.map((option, index) => (
                    <input key={index} type="text" value={option}
                      onChange={(e) => {
                        const opts = [...editingQuestion.options];
                        opts[index] = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: opts });
                      }}
                      placeholder={`Variant ${index + 1}`} required style={{ marginBottom: '8px' }} />
                  ))}
                </div>
              )}
              <div className="form-group">
                <label>To'g'ri javob *</label>
                <input type="text" value={editingQuestion.correct_answer}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Tushuntirish</label>
                <textarea value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  rows="2" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-danger"
                  onClick={() => handleDeleteQuestion(editingQuestion.id)}>
                  🗑️ O'chirish
                </button>
                <div style={{ flex: 1 }}></div>
                <button type="button" className="btn btn-outline" onClick={() => setShowEditQuestionModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary">💾 Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* AI Generate Modal */}
      {showAIModal && selectedTest && (
        <div className="modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🤖 AI bilan savol yaratish</h2>
              <button className="close-btn" onClick={() => setShowAIModal(false)}>✕</button>
            </div>
            <form onSubmit={handleGenerateAI} className="modal-form">
              <div className="form-group">
                <label>Mavzu *</label>
                <input type="text" value={aiPrompt.topic}
                  onChange={(e) => setAiPrompt({ ...aiPrompt, topic: e.target.value })}
                  placeholder={`Masalan: ${selectedTest.subject || lesson.subject}`} required />
                <small>AI ushbu mavzu bo'yicha savollar yaratadi</small>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Savollar soni</label>
                  <input type="number" value={aiPrompt.count} min="1" max="20"
                    onChange={(e) => setAiPrompt({ ...aiPrompt, count: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Qiyinlik</label>
                  <select value={aiPrompt.difficulty}
                    onChange={(e) => setAiPrompt({ ...aiPrompt, difficulty: e.target.value })}>
                    <option value="easy">Oson</option>
                    <option value="medium">O'rta</option>
                    <option value="hard">Qiyin</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Savol turi</label>
                <select value={aiPrompt.questionType}
                  onChange={(e) => setAiPrompt({ ...aiPrompt, questionType: e.target.value })}>
                  <option value="single_choice">Bir tanlovli</option>
                  <option value="multiple_choice">Ko'p tanlovli</option>
                  <option value="true_false">To'g'ri/Noto'g'ri</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAIModal(false)} disabled={aiLoading}>Bekor qilish</button>
                <button type="submit" className="btn btn-success" disabled={aiLoading}>
                  {aiLoading ? '⏳ Yaratilmoqda...' : '🤖 Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LessonDetail;
