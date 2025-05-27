import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AuthPage from './pages/AuthPage';
import CreditPage from './pages/CreditPage';
import MainLayout from './components/Layout/MainLayout/MainLayout';
import { NotFoundContent } from './components/NotFoundContent';
import './App.css';
import PaymentPage from './pages/PaymentPage';
import ProductPage from './pages/ProductPage';
import { authStorage } from './api/utils/auth-storage';
import QueuePage from './pages/QueuePage';
import ClientPage from './pages/ClientPage';
import BlacklistPage from './pages/BlacklistPage';
import InvestorPage from './pages/InvestorPage';
import NewCreditPage from './pages/NewCreditPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authStorage.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      // Если пользователь авторизован и находится на странице auth - редиректим
      if (authenticated && window.location.pathname === '/auth') {
        window.location.href = '/credits';
      }
      
      // Если пользователь не авторизован и не на странице auth - редиректим
      if (!authenticated && window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    };

    checkAuth();
    
    // Слушаем изменения в localStorage для синхронизации вкладок
    const handleStorageChange = () => checkAuth();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (isAuthenticated === null) {
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
          <Navigate to={isAuthenticated ? "/credits" : "/auth"} replace />
        } />
        
        <Route path="/auth" element={
          isAuthenticated ? (
            <Navigate to="/credits" replace />
          ) : (
            <AuthPage onLoginSuccess={() => setIsAuthenticated(true)} />
          )
        } />

        <Route path="/credits" element={
          isAuthenticated ? (
            <MainLayout>
              <CreditPage />
            </MainLayout>
          ) : (
            <Navigate to="/auth" replace />
          )
        } />

        <Route path="payments" element={
            <MainLayout>
              <PaymentPage/>
            </MainLayout>
        } />

        <Route path="products" element={
            <MainLayout>
              <ProductPage/>
            </MainLayout>
        } />

        <Route path="queue" element={
            <MainLayout>
              <QueuePage />
            </MainLayout>
        } />

        <Route path="clients" element={
            <MainLayout>
              <ClientPage />
            </MainLayout>
        } />

        <Route path="blacklist" element={
            <MainLayout>
              <BlacklistPage />
            </MainLayout>
        } />

        <Route path="investors" element={
            <MainLayout>
              <InvestorPage />
            </MainLayout>
        } />

        <Route path="new-credit" element={
            <MainLayout>
              <NewCreditPage />
            </MainLayout>
        } />

        <Route path="*" element={
             <MainLayout>
              <NotFoundContent />
            </MainLayout>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;