import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import OfflineIndicator from './components/OfflineIndicator';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import TestDetail from './pages/TestDetail';
import TakeTest from './pages/TakeTest';
import Results from './pages/Results';
import Portfolio from './pages/Portfolio';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Students from './pages/Students';
import StudentPortfolio from './pages/StudentPortfolio';
import Lessons from './pages/Lessons';
import LessonDetail from './pages/LessonDetail';
import Journal from './pages/Journal';
import AIAnalytics from './pages/AIAnalytics';
import Forum from './pages/Forum';
import ForumPost from './pages/ForumPost';
import NewPost from './pages/NewPost';
import './assets/css/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <OfflineIndicator />
          <div className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              {/* /tests redirect → /lessons */}
              <Route path="/tests" element={<Navigate to="/lessons" replace />} />
              <Route 
                path="/tests/:id" 
                element={
                  <PrivateRoute>
                    <TestDetail />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/take-test/:id" 
                element={
                  <PrivateRoute>
                    <TakeTest />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/results" 
                element={
                  <PrivateRoute>
                    <Results />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/portfolio" 
                element={
                  <PrivateRoute>
                    <Portfolio />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/leaderboard" 
                element={
                  <PrivateRoute>
                    <Leaderboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/students" 
                element={
                  <PrivateRoute>
                    <Students />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/students/:userId/portfolio" 
                element={
                  <PrivateRoute>
                    <StudentPortfolio />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/lessons" 
                element={
                  <PrivateRoute>
                    <Lessons />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/lessons/:id" 
                element={
                  <PrivateRoute>
                    <LessonDetail />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/journal" 
                element={
                  <PrivateRoute>
                    <Journal />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/ai-analytics" 
                element={
                  <PrivateRoute>
                    <AIAnalytics />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/forum" 
                element={
                  <PrivateRoute>
                    <Forum />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/forum/post/:id" 
                element={
                  <PrivateRoute>
                    <ForumPost />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/forum/new" 
                element={
                  <PrivateRoute>
                    <NewPost />
                  </PrivateRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
