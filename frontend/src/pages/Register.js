import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    email: '',
    role: 'student',
    district: '',
    school_number: '',
    class_name: '',
    teaching_classes: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, message: '', available: null });
  const [emailStatus, setEmailStatus] = useState({ checking: false, message: '', available: null });
  const { register } = useAuth();
  const navigate = useNavigate();

  const districts = [
    'Davlatobod tumani',
    'Chortoq tumani',
    'Chust tumani',
    'Kosonsoy tumani',
    'Mingbuloq tumani',
    'Namangan tumani',
    'Norin tumani',
    'Pop tumani',
    "To'raqo'rg'on tumani",
    "Uchqo'rg'on tumani",
    'Uychi tumani',
    "Yangiqo'rg'on tumani"
  ];

  const classes = [
    '9-A', '9-B', '9-V', '9-G', '9-D',
    '10-A', '10-B', '10-V', '10-G', '10-D'
  ];

  // Debounce timer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username.length >= 3) {
        checkUsername(formData.username);
      } else if (formData.username.length > 0) {
        setUsernameStatus({ 
          checking: false, 
          message: '⚠️ Login kamida 3 belgidan iborat bo\'lishi kerak', 
          available: false 
        });
      } else {
        setUsernameStatus({ checking: false, message: '', available: null });
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [formData.username]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email.length > 0) {
        checkEmail(formData.email);
      } else {
        setEmailStatus({ checking: false, message: '', available: null });
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [formData.email]);

  const checkUsername = async (username) => {
    setUsernameStatus({ checking: true, message: 'Tekshirilmoqda...', available: null });
    
    try {
      const response = await api.post('/auth/check-username', { username });
      setUsernameStatus({ 
        checking: false, 
        message: response.data.message, 
        available: response.data.available 
      });
    } catch (error) {
      if (error.response?.data) {
        setUsernameStatus({ 
          checking: false, 
          message: error.response.data.message || '❌ Xatolik', 
          available: false 
        });
      }
    }
  };

  const checkEmail = async (email) => {
    setEmailStatus({ checking: true, message: 'Tekshirilmoqda...', available: null });
    
    try {
      const response = await api.post('/auth/check-email', { email });
      setEmailStatus({ 
        checking: false, 
        message: response.data.message, 
        available: response.data.available 
      });
    } catch (error) {
      if (error.response?.data) {
        setEmailStatus({ 
          checking: false, 
          message: error.response.data.message || '❌ Xatolik', 
          available: false 
        });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'role') {
      // Reset fields when role changes
      setFormData({
        ...formData,
        role: value,
        class_name: '',
        teaching_classes: []
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleTeachingClassesChange = (className) => {
    const currentClasses = formData.teaching_classes;
    const newClasses = currentClasses.includes(className)
      ? currentClasses.filter(c => c !== className)
      : [...currentClasses, className];
    
    setFormData({
      ...formData,
      teaching_classes: newClasses
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if username and email are available
    if (!usernameStatus.available) {
      setError('Login band yoki noto\'g\'ri!');
      return;
    }

    if (!emailStatus.available) {
      setError('Email allaqachon ro\'yxatdan o\'tgan yoki noto\'g\'ri!');
      return;
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Parollar mos kelmadi!');
      return;
    }

    if (formData.password.length < 6) {
      setError('Parol kamida 6 belgidan iborat bo\'lishi kerak!');
      return;
    }

    if (!formData.district) {
      setError('Tumanni tanlang!');
      return;
    }

    if (!formData.school_number) {
      setError('Maktab raqamini kiriting!');
      return;
    }

    if (formData.role === 'student' && !formData.class_name) {
      setError('Sinfni tanlang!');
      return;
    }

    if (formData.role === 'teacher' && formData.teaching_classes.length === 0) {
      setError('Kamida bitta sinfni tanlang!');
      return;
    }

    setLoading(true);

    try {
      const registerData = {
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        district: formData.district,
        school_number: formData.school_number
      };

      if (formData.role === 'student') {
        registerData.class_name = formData.class_name;
      } else if (formData.role === 'teacher') {
        registerData.teaching_classes = formData.teaching_classes.join(',');
      }

      await register(registerData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          "Ro'yxatdan o'tish xatosi. Qaytadan urinib ko'ring.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Ro'yxatdan o'tish</h1>
          <p>InfoTest platformasiga qo'shiling</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="full_name">To'liq ism *</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Ismingizni kiriting"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Login *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Login tanlang"
              required
              disabled={loading}
              style={{
                borderColor: usernameStatus.available === true ? '#10B981' : 
                           usernameStatus.available === false ? '#EF4444' : 
                           'var(--border-color)'
              }}
            />
            {usernameStatus.message && (
              <small style={{ 
                color: usernameStatus.available === true ? '#10B981' : 
                       usernameStatus.available === false ? '#EF4444' : 
                       '#6B7280',
                marginTop: '0.25rem',
                display: 'block',
                fontWeight: '500'
              }}>
                {usernameStatus.message}
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="emailingizni kiriting"
              required
              disabled={loading}
              style={{
                borderColor: emailStatus.available === true ? '#10B981' : 
                           emailStatus.available === false ? '#EF4444' : 
                           'var(--border-color)'
              }}
            />
            {emailStatus.message && (
              <small style={{ 
                color: emailStatus.available === true ? '#10B981' : 
                       emailStatus.available === false ? '#EF4444' : 
                       '#6B7280',
                marginTop: '0.25rem',
                display: 'block',
                fontWeight: '500'
              }}>
                {emailStatus.message}
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="role">Kirish huquqi *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              required
            >
              <option value="student">O'quvchi</option>
              <option value="teacher">O'qituvchi</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="district">Tuman *</label>
            <select
              id="district"
              name="district"
              value={formData.district}
              onChange={handleChange}
              disabled={loading}
              required
            >
              <option value="">Tumanni tanlang</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="school_number">Maktab raqami *</label>
            <input
              type="text"
              id="school_number"
              name="school_number"
              value={formData.school_number}
              onChange={handleChange}
              placeholder="Masalan: 15"
              required
              disabled={loading}
            />
          </div>

          {formData.role === 'student' && (
            <div className="form-group">
              <label htmlFor="class_name">Sinf *</label>
              <select
                id="class_name"
                name="class_name"
                value={formData.class_name}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="">Sinfni tanlang</option>
                {classes.map(className => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </div>
          )}

          {formData.role === 'teacher' && (
            <div className="form-group">
              <label>Dars o'tadi gan sinflar * (bir nechtasini tanlash mumkin)</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(5, 1fr)', 
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}>
                {classes.map(className => (
                  <label 
                    key={className} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '0.5rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: 'var(--border-radius)',
                      cursor: 'pointer',
                      backgroundColor: formData.teaching_classes.includes(className) 
                        ? 'var(--primary-color)' 
                        : 'transparent',
                      color: formData.teaching_classes.includes(className) 
                        ? 'white' 
                        : 'var(--text-primary)',
                      transition: 'var(--transition)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.teaching_classes.includes(className)}
                      onChange={() => handleTeachingClassesChange(className)}
                      disabled={loading}
                      style={{ marginRight: '0.5rem' }}
                    />
                    {className}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Parol *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Parol kiriting (min 6 belgi)"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Parolni tasdiqlash *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Parolni qayta kiriting"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || !usernameStatus.available || !emailStatus.available}
          >
            {loading ? "Yuklanmoqda..." : "Ro'yxatdan o'tish"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Allaqachon hisobingiz bormi?{' '}
            <Link to="/login">Kirish</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
