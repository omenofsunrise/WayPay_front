import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AuthPage from './pages/AuthPage';
import CreditPage from './pages/CreditPage';
import MainLayout from './components/Layout/MainLayout';
import { NotFoundContent } from './components/NotFoundContent';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  const handleLogin = (token: string) => {
    localStorage.setItem('accessToken', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          isAuthenticated ? (
            <Navigate to="/credits" replace />
          ) : (
            <Navigate to="/auth" replace />
          )
        } />
        
        <Route path="/auth" element={
          isAuthenticated ? (
            <Navigate to="/credits" replace />
          ) : (
            <AuthPage onLoginSuccess={handleLogin} />
          )
        } />

        <Route path="/credits" element={
          isAuthenticated ? (
            <MainLayout>
              <CreditPage onLogout={handleLogout} />
            </MainLayout>
          ) : (
            <Navigate to="/auth" replace />
          )
        } />

        <Route path="*" element={
          isAuthenticated ? (
            <MainLayout>
              <NotFoundContent />
            </MainLayout>
          ) : (
            <Navigate to="/auth" replace />
          )
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;