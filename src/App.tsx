import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
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
import ProfilePage from './pages/ProfilePage/ProfilePage';
import InvestorReportPage from './pages/InvestorReportPage';
import BudgetPage from './pages/BudgetPage';
import { AuthProvider } from './сontext/AuthContext';
import AdminPanelPage from './pages/AdminPanelPage';
import ToDoListPage from './pages/ToDoListPage';
import { TaskCountProvider } from './сontext/TaskCountContext';
import PaymentsIncomePage from './pages/PaymentIncomePage';
import BlogPage from './pages/BlogPage';
import ChatPage from './pages/ChatPage';
import AnalyticsPage from './pages/AnalyticsPage';
import type { AuthInfo } from './api/types/auth';
import apiClient, { PIN_REQUIRED_EVENT, type PinRequiredEventDetail } from './api/client';
import PinCodeModal from './components/modal/PinCodeModal';
import { createRoot } from 'react-dom/client';
import LicenseOutPage from './pages/LicenseOutPage';
import AboutPage from './pages/AboutPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import InvestorsPoolPage from './pages/InvestorsPoolPage';
import { DesktopOnlyContent } from './components/DesktopOnly';
import BlackCatalogPage from './pages/BlackCatalog';
import RegistrationRequestPage from './pages/RegistrationRequestPage';
import CreditApplicationPage from './pages/CreditApplicationPage';
import NotificationHandler from './components/NotificationHandler/NotificationHandler';

const INACTIVITY_TIMEOUT = 13 * 60 * 1000;

const isMobileDevice = (): boolean => {
  const screenWidthCheck = window.innerWidth <= 768;
  
  return screenWidthCheck;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'l') || (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'д')) {
      event.preventDefault();
      
      if (isAuthenticated && authInfo?.hasPin && !showPinModal) {
        setShowPinModal(true);
        sessionStorage.removeItem('lastActivity');
      }
    }
  }, [isAuthenticated, authInfo?.hasPin, showPinModal]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    const handleUserActivity = () => {
      updateActivity();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [updateActivity]);

  useEffect(() => {
    const checkInactivity = () => {
      if (!isAuthenticated || !authInfo?.hasPin || showPinModal) return;

      const currentTime = Date.now();
      if (currentTime - lastActivity > INACTIVITY_TIMEOUT) {
        setShowPinModal(true);
        sessionStorage.removeItem('lastActivity');
      }
    };

    const interval = setInterval(checkInactivity, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, authInfo?.hasPin, lastActivity, showPinModal]);

  useEffect(() => {
    const handlePinRequired = (event: CustomEvent<PinRequiredEventDetail>) => {
      const { resolve, reject } = event.detail;
      
      let modalRoot = document.getElementById('pin-modal-root');
      if (!modalRoot) {
        modalRoot = document.createElement('div');
        modalRoot.id = 'pin-modal-root';
        document.body.appendChild(modalRoot);
      }
      
      const root = createRoot(modalRoot);
      
      root.render(
        <PinCodeModal
          isOpen={true}
          onSuccess={(pin) => {
            resolve(pin);
            root.unmount();
            modalRoot?.remove();
          }}
          mode="verify"
          onMaxAttempts={() => {
            reject(new Error('Max attempts reached'));
            root.unmount();
            modalRoot?.remove();
            authStorage.clear();
            window.location.href = '/auth';
          }}
        />
      );
    };

    window.addEventListener(PIN_REQUIRED_EVENT, handlePinRequired as EventListener);
    return () => {
      window.removeEventListener(PIN_REQUIRED_EVENT, handlePinRequired as EventListener);
    };
  }, []);

  const updateAuthStatus = useCallback(() => {
    const authenticated = authStorage.isAuthenticated();
    setIsAuthenticated(authenticated);
    return authenticated;
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = updateAuthStatus();
      
      if (authenticated && window.location.pathname === '/auth') {
        window.location.href = '/credits';
      }
      
      if (!authenticated && window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }

      if (authenticated) {
        apiClient.get<AuthInfo>('/Auth/info')
          .then(response => {
            setAuthInfo(response.data);
            const savedActivity = sessionStorage.getItem('lastActivity');
            if (!savedActivity || (savedActivity && Date.now() - parseInt(savedActivity, 10) > INACTIVITY_TIMEOUT)) {
              setShowPinModal(true);
            }
          })
          .catch(() => setAuthInfo(null));
      }
    };

    checkAuth();
    
    const handleStorageChange = () => checkAuth();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [updateAuthStatus]);

  const handlePinSuccess = useCallback(() => {
    setShowPinModal(false);
    updateActivity();
    sessionStorage.setItem('lastActivity', Date.now().toString());
  }, [updateActivity]);

  if (isMobile) {
    return <DesktopOnlyContent />;
  }

  if (isAuthenticated && authInfo?.hasPin === false) {
    return (
      <PinCodeModal
        isOpen={true}
        onSuccess={() => window.location.reload()}
        mode="setup"
        onMaxAttempts={() => {
          authStorage.clear();
          window.location.href = '/auth';
        }}
      />
    );
  }

  if (isAuthenticated === null) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <NotificationHandler />
      {showPinModal && (
        <PinCodeModal
          isOpen={true}
          onSuccess={handlePinSuccess}
          mode="verify"
          onMaxAttempts={() => {
            authStorage.clear();
            window.location.href = '/auth';
          }}
        />
      )}
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

            <Route path="black-catalog" element={
                <MainLayout>
                  <BlackCatalogPage />
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
            
            <Route path="new-credit/:id?" element={
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

            <Route path="investors-pool" element={
                <MainLayout>
                  <InvestorsPoolPage />
                </MainLayout>
            } />

            <Route path="budget" element={
                <MainLayout>
                  <BudgetPage />
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

            <Route path="blog/:id" element={
                <MainLayout>
                    <BlogPage />
                </MainLayout>
            } />

            <Route path="chat" element={
                <MainLayout>
                  <ChatPage />
                </MainLayout>
            } />

            <Route path="chat/:chatId?" element={
                <MainLayout>
                  <ChatPage />
                </MainLayout>
            } />

            <Route path="analytics" element={
                <MainLayout>
                  <AnalyticsPage />
                </MainLayout>
            } />

            <Route path="/licence-out" element={<LicenseOutPage />} />
            
            <Route path="about" element={
                <MainLayout>
                  <AboutPage />
                </MainLayout>
            } />

            <Route path="privacy-policy" element={
                <MainLayout>
                  <PrivacyPolicyPage />
                </MainLayout>
            } />

            <Route path="registration-requests" element={
                <MainLayout>
                  <RegistrationRequestPage />
                </MainLayout>
            } />

            <Route path="credit-application" element={
              <MainLayout>
                <CreditApplicationPage />
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