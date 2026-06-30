import React, { useState } from 'react';
import '../assets/css/Pages.css';
import { useAuth } from '../context/AuthContext';
import '../assets/css/Pages.css';
import api from '../services/api';
import '../assets/css/Pages.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    email: user.email
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const getLevelColor = (level) => {
    const colors = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    return colors[level - 1] || 'bronze';
  };

  const getRoleName = (role) => {
    const roleNames = {
      student: 'Talaba',
      teacher: "O'qituvchi",
      admin: 'Administrator'
    };
    return roleNames[role] || role;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/auth/profile', formData);
      updateUser(response.data);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profil muvaffaqiyatli yangilandi!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || "Profilni yangilashda xatolik yuz berdi" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Yangi parollar mos kelmadi!' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Parol kamida 6 belgidan iborat bo\'lishi kerak!' });
      return;
    }

    setLoading(true);

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      setMessage({ type: 'success', text: 'Parol muvaffaqiyatli o\'zgartirildi!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || "Parolni o'zgartirishda xatolik yuz berdi" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Profil</h1>
        <p className="subtitle">Shaxsiy ma'lumotlaringizni boshqaring</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-layout">
        <div className="profile-sidebar">
          <div className="profile-avatar-large">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <h2>{user.full_name}</h2>
          <p className="profile-role">{getRoleName(user.role)}</p>

          {user.role === 'student' && (
            <>
              <div className={`level-badge-large level-${getLevelColor(user.level)}`}>
                <div className="level-number">Daraja {user.level}</div>
                <div className="level-name">{getLevelColor(user.level).toUpperCase()}</div>
              </div>
              
              <div className="profile-stats">
                <div className="profile-stat-item">
                  <span className="stat-label">Ballar</span>
                  <span className="stat-value">⭐ {user.points}</span>
                </div>
              </div>
            </>
          )}

          <div className="profile-info-list">
            <div className="info-item">
              <span className="info-label">Login:</span>
              <span className="info-value">{user.username}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Ro'yxatdan o'tgan:</span>
              <span className="info-value">
                {new Date(user.created_at).toLocaleDateString('uz-UZ')}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <div className="section-header">
              <h3>Shaxsiy ma'lumotlar</h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="btn btn-outline"
                >
                  Tahrirlash
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileUpdate} className="profile-form">
                <div className="form-group">
                  <label>To'liq ism</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        full_name: user.full_name,
                        email: user.email
                      });
                    }} 
                    className="btn btn-outline"
                    disabled={loading}
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            ) : (
              <div className="info-display">
                <div className="info-row">
                  <span className="info-label">To'liq ism:</span>
                  <span className="info-value">{user.full_name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{user.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Login:</span>
                  <span className="info-value">{user.username}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Rol:</span>
                  <span className="info-value">{getRoleName(user.role)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="profile-section">
            <div className="section-header">
              <h3>Xavfsizlik</h3>
              {!showPasswordForm && (
                <button 
                  onClick={() => setShowPasswordForm(true)} 
                  className="btn btn-outline"
                >
                  Parolni o'zgartirish
                </button>
              )}
            </div>

            {showPasswordForm ? (
              <form onSubmit={handlePasswordChange} className="profile-form">
                <div className="form-group">
                  <label>Joriy parol</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Yangi parol</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Kamida 6 belgi"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Yangi parolni tasdiqlash</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saqlanmoqda...' : 'Parolni o\'zgartirish'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }} 
                    className="btn btn-outline"
                    disabled={loading}
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            ) : (
              <div className="info-display">
                <p>Parolingizni o'zgartirish uchun yuqoridagi tugmani bosing.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
