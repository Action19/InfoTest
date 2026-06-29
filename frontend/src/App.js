import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tests from './pages/Tests';
import TestDetail from './pages/TestDetail';
import TakeTest from './pages/TakeTest';
import Results from './pages/Results';
import Portfolio from './pages/Portfolio';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Students from './pages/Students';
import StudentPortfolio from './pages/StudentPortfolio';
import './assets/css/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/tests" 
                element={
                  <PrivateRoute>
                    <Tests />
                  </PrivateRoute>
                } 
              />
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
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
