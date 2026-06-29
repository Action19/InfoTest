import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleName = (role) => {
    const roleNames = {
      student: 'Talaba',
      teacher: "O'qituvchi",
      admin: 'Administrator'
    };
    return roleNames[role] || role;
  };

  const getLevelColor = (level) => {
    const colors = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    return colors[level - 1] || 'bronze';
  };

  if (!user) {
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">📚</span>
            <span className="logo-text">InfoTest</span>
          </Link>
          <div className="navbar-menu">
            <Link to="/login" className="navbar-link">Kirish</Link>
            <Link to="/register" className="navbar-link navbar-link-primary">Ro'yxatdan o'tish</Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">InfoTest</span>
        </Link>
        
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link">Bosh sahifa</Link>
          <Link to="/tests" className="navbar-link">Testlar</Link>
          {user.role === 'student' && (
            <>
              <Link to="/results" className="navbar-link">Natijalar</Link>
              <Link to="/portfolio" className="navbar-link">Portfolio</Link>
              <Link to="/leaderboard" className="navbar-link">Reyting</Link>
            </>
          )}
          {(user.role === 'teacher' || user.role === 'admin') && (
            <>
              <Link to="/students" className="navbar-link">O'quvchilar</Link>
              <Link to="/leaderboard" className="navbar-link">Reyting</Link>
            </>
          )}
          
          <div className="navbar-user">
            <Link to="/profile" className="user-info">
              <div className="user-avatar">{user.full_name.charAt(0).toUpperCase()}</div>
              <div className="user-details">
                <span className="user-name">{user.full_name}</span>
                <span className="user-role">{getRoleName(user.role)}</span>
              </div>
              {user.role === 'student' && (
                <div className="user-stats">
                  <span className={`level-badge level-${getLevelColor(user.level)}`}>
                    Daraja {user.level}
                  </span>
                  <span className="points-badge">⭐ {user.points}</span>
                </div>
              )}
            </Link>
            <button onClick={handleLogout} className="btn-logout">Chiqish</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
