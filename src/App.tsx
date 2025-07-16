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
import SchedulePage from './pages/SchedulePage';
import CreditControlPage from './pages/CreditControlPage';
import EmployeeProfilePage from './pages/ProfilePage/EmployeeProfilePage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import InvestorReportPage from './pages/InvestorReportPage';
import BudgetPage from './pages/BudgetPage';
import { ErrorBoundary } from "react-error-boundary";
import { AuthProvider } from './сontext/AuthContext';
import AdminPanelPage from './pages/AdminPanelPage';
import ToDoListPage from './pages/ToDoListPage';
import { TaskCountProvider } from './сontext/TaskCountContext';
import PaymentsIncomePage from './pages/PaymentIncomePage';
import BlogPage from './pages/BlogPage';
import ChatPage from './pages/ChatPage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authStorage.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated && window.location.pathname === '/auth') {
        window.location.href = '/credits';
      }
      
      if (!authenticated && window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    };

    checkAuth();
    
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
    <AuthProvider>
      <BrowserRouter>
      <TaskCountProvider>
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

            <Route path="schedules" element={
                <MainLayout> 
                  <SchedulePage />
                </MainLayout>
            } />

            <Route path="credit-control" element={
                <MainLayout>
                  <CreditControlPage />
                </MainLayout>
            } />

            <Route path="profile" element={
                <MainLayout>
                  <ProfilePage />
                </MainLayout>
            } />

            <Route path="investors-report" element={
                <MainLayout>
                  <InvestorReportPage />
                </MainLayout>
            } />

            <Route path="budget" element={
                <MainLayout>
                  <ErrorBoundary fallback={<div>Something went wrong</div>}>
                    <BudgetPage />
                  </ErrorBoundary>
                </MainLayout>
            } />

            <Route path="admin" element={
              <MainLayout>
                <AdminPanelPage />
              </MainLayout>
            } />

            <Route path="todo" element={
              
                <MainLayout>
                  <ToDoListPage />
                </MainLayout>
            } />

            <Route path="payments-income" element={
                <MainLayout>
                  <PaymentsIncomePage />
                </MainLayout>
            } />

            <Route path="blog" element={
                <MainLayout>
                  <BlogPage />
                </MainLayout>
            } />

            <Route path="chat" element={
                <MainLayout>
                  <ChatPage />
                </MainLayout>
            } />

            <Route path="analytics" element={
                <MainLayout>
                  <AnalyticsPage />
                </MainLayout>
            } />

            <Route path="*" element={
                <MainLayout>
                  <NotFoundContent />
                </MainLayout>
            } />
          </Routes>
        </TaskCountProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;