import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    email: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Parollar mos kelmadi!');
      return;
    }

    if (formData.password.length < 6) {
      setError('Parol kamida 6 belgidan iborat bo\'lishi kerak!');
      return;
    }

    setLoading(true);

    try {
      await register({
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || "Ro'yxatdan o'tish xatosi. Qaytadan urinib ko'ring.");
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
            <label htmlFor="full_name">To'liq ism</label>
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
            <label htmlFor="username">Login</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Login tanlang"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="emailingizni kiriting"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Rol</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="student">Talaba</option>
              <option value="teacher">O'qituvchi</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Parol</label>
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
            <label htmlFor="confirmPassword">Parolni tasdiqlash</label>
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

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Yuklanmoqda...' : "Ro'yxatdan o'tish"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Hisobingiz bormi? <Link to="/login">Kirish</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
