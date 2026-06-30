import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleName = (role) => {
    const roleNames = {
      student: "O'quvchi",
      teacher: "O'qituvchi",
      admin: 'Administrator'
    };
    return roleNames[role] || role;
  };

  const getLevelColor = (level) => {
    const colors = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    return colors[level - 1] || 'bronze';
  };

  const isActive = (path) => location.pathname === path;

  if (!user) {
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <span className="logo-gradient">InfoTest</span>
          </Link>
          <div className="navbar-menu">
            <Link to="/login" className="navbar-link">Kirish</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Ro'yxatdan o'tish</Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          <span className="logo-gradient">InfoTest</span>
        </Link>
        
        <div className="navbar-menu">
          <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}>
            <span className="nav-icon">🏠</span>
            Bosh sahifa
          </Link>
          <Link to="/lessons" className={`navbar-link ${isActive('/lessons') ? 'active' : ''}`}>
            <span className="nav-icon">📚</span>
            Darslar
          </Link>
          {user.role === 'student' && (
            <>
              <Link to="/results" className={`navbar-link ${isActive('/results') ? 'active' : ''}`}>
                <span className="nav-icon">📊</span>
                Natijalar
              </Link>
              <Link to="/leaderboard" className={`navbar-link ${isActive('/leaderboard') ? 'active' : ''}`}>
                <span className="nav-icon">🏆</span>
                Reyting
              </Link>
            </>
          )}
          {(user.role === 'teacher' || user.role === 'admin') && (
            <>
              <Link to="/students" className={`navbar-link ${isActive('/students') ? 'active' : ''}`}>
                <span className="nav-icon">👥</span>
                O'quvchilar
              </Link>
              <Link to="/leaderboard" className={`navbar-link ${isActive('/leaderboard') ? 'active' : ''}`}>
                <span className="nav-icon">🏆</span>
                Reyting
              </Link>
            </>
          )}
          
          <div className="navbar-user">
            <div className="user-menu-trigger" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="user-avatar-gradient">{user.full_name.charAt(0).toUpperCase()}</div>
              <div className="user-details">
                <span className="user-name">{user.full_name}</span>
                <span className="user-role">{getRoleName(user.role)}</span>
              </div>
              {user.role === 'student' && (
                <div className="user-stats-inline">
                  <span className="points-badge-small">⭐ {user.points}</span>
                </div>
              )}
              <span className="dropdown-arrow">▼</span>
            </div>
            
            {showUserMenu && (
              <div className="user-dropdown">
                <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                  <span className="dropdown-icon">👤</span>
                  Profil
                </Link>
                {user.role === 'student' && (
                  <Link to="/portfolio" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <span className="dropdown-icon">💼</span>
                    Portfolio
                  </Link>
                )}
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item logout-item">
                  <span className="dropdown-icon">🚪</span>
                  Chiqish
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
