import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Students = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user.role === 'student') {
      navigate('/dashboard');
      return;
    }
    fetchStudents();
  }, [user.role, navigate]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/students/list');
      const studentsData = Array.isArray(response.data) ? response.data : [];
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const viewPortfolio = (studentId) => {
    navigate(`/students/${studentId}/portfolio`);
  };

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1>👥 O'quvchilar</h1>
        <p className="subtitle">Barcha o'quvchilar ro'yxati va statistikasi</p>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="O'quvchi qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>O'quvchilar topilmadi</h3>
          <p>
            {user.role === 'teacher' 
              ? "Sizning maktabingiz va sinflaringizda o'quvchilar topilmadi"
              : "Hali hech kim ro'yxatdan o'tmagan"
            }
          </p>
        </div>
      ) : (
        <div className="students-grid">
          {filteredStudents.map((student) => (
            <div key={student.id} className="student-card">
              <div className="student-avatar-large">
                {student.full_name?.charAt(0) || student.username?.charAt(0) || '?'}
              </div>
              
              <h3>{student.full_name || student.username}</h3>
              <p className="student-username">@{student.username}</p>

              {student.district && student.school_number && (
                <div className="student-school-info">
                  <div className="school-badge">🏫 {student.school_number}-maktab</div>
                  {student.class_name && (
                    <div className="class-badge">📚 {student.class_name}</div>
                  )}
                </div>
              )}

              <div className="student-stats-grid">
                <div className="student-stat">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-value">{student.points || 0}</div>
                  <div className="stat-label">Ballar</div>
                </div>
                <div className="student-stat">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-value">{student.level || 1}</div>
                  <div className="stat-label">Daraja</div>
                </div>
              </div>

              <div className="student-actions">
                <button 
                  onClick={() => viewPortfolio(student.id)} 
                  className="btn btn-primary btn-sm btn-block"
                >
                  📂 Portfolio
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Students;
