import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import OfflineIndicator from './components/OfflineIndicator';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import './assets/css/App.css';

// Lazy loading — sahifalar kerak bo'lgandagina yuklanadi
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TestDetail = lazy(() => import('./pages/TestDetail'));
const TakeTest = lazy(() => import('./pages/TakeTest'));
const Results = lazy(() => import('./pages/Results'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Profile = lazy(() => import('./pages/Profile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Students = lazy(() => import('./pages/Students'));
const StudentPortfolio = lazy(() => import('./pages/StudentPortfolio'));
const Lessons = lazy(() => import('./pages/Lessons'));
const LessonDetail = lazy(() => import('./pages/LessonDetail'));
const Journal = lazy(() => import('./pages/Journal'));
const AIAnalytics = lazy(() => import('./pages/AIAnalytics'));
const Forum = lazy(() => import('./pages/Forum'));
const ForumPost = lazy(() => import('./pages/ForumPost'));
const NewPost = lazy(() => import('./pages/NewPost'));

// Loading fallback
const PageLoader = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '60vh', gap: '1rem'
  }}>
    <div className="spinner"></div>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Yuklanmoqda...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <OfflineIndicator />
          <div className="main-content">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route 
                  path="/dashboard" 
                  element={<PrivateRoute><Dashboard /></PrivateRoute>} 
                />
                <Route path="/tests" element={<Navigate to="/lessons" replace />} />
                <Route 
                  path="/tests/:id" 
                  element={<PrivateRoute><TestDetail /></PrivateRoute>} 
                />
                <Route 
                  path="/take-test/:id" 
                  element={<PrivateRoute><TakeTest /></PrivateRoute>} 
                />
                <Route 
                  path="/results" 
                  element={<PrivateRoute><Results /></PrivateRoute>} 
                />
                <Route 
                  path="/portfolio" 
                  element={<PrivateRoute><Portfolio /></PrivateRoute>} 
                />
                <Route 
                  path="/profile" 
                  element={<PrivateRoute><Profile /></PrivateRoute>} 
                />
                <Route 
                  path="/leaderboard" 
                  element={<PrivateRoute><Leaderboard /></PrivateRoute>} 
                />
                <Route 
                  path="/students" 
                  element={<PrivateRoute><Students /></PrivateRoute>} 
                />
                <Route 
                  path="/students/:userId/portfolio" 
                  element={<PrivateRoute><StudentPortfolio /></PrivateRoute>} 
                />
                <Route 
                  path="/lessons" 
                  element={<PrivateRoute><Lessons /></PrivateRoute>} 
                />
                <Route 
                  path="/lessons/:id" 
                  element={<PrivateRoute><LessonDetail /></PrivateRoute>} 
                />
                <Route 
                  path="/journal" 
                  element={<PrivateRoute><Journal /></PrivateRoute>} 
                />
                <Route 
                  path="/ai-analytics" 
                  element={<PrivateRoute><AIAnalytics /></PrivateRoute>} 
                />
                <Route 
                  path="/forum" 
                  element={<PrivateRoute><Forum /></PrivateRoute>} 
                />
                <Route 
                  path="/forum/post/:id" 
                  element={<PrivateRoute><ForumPost /></PrivateRoute>} 
                />
                <Route 
                  path="/forum/new" 
                  element={<PrivateRoute><NewPost /></PrivateRoute>} 
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
