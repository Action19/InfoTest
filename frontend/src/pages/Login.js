import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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
    setLoading(true);

    try {
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || "Kirish xatosi. Login va parolni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { username: 'admin', password: 'admin123', role: 'Administrator' },
    { username: 'o_qituvchi', password: 'teacher123', role: "O'qituvchi" },
    { username: 'akmal_yusupov', password: 'student123', role: 'Talaba' }
  ];

  const fillDemo = (username, password) => {
    setFormData({ username, password });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>InfoTest ga kirish</h1>
          <p>Bilimlaringizni sinab ko'ring!</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Login</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Loginingizni kiriting"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Parol</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Parolingizni kiriting"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Yuklanmoqda...' : 'Kirish'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Hisobingiz yo'qmi? <Link to="/register">Ro'yxatdan o'tish</Link></p>
        </div>

        <div className="demo-accounts">
          <h3>Demo hisoblar:</h3>
          <div className="demo-list">
            {demoAccounts.map((account, index) => (
              <div key={index} className="demo-account-card">
                <div className="demo-info">
                  <strong>{account.role}</strong>
                  <span className="demo-username">{account.username}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => fillDemo(account.username, account.password)}
                >
                  To'ldirish
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
