import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import BudgetPage from './pages/FinancePage/BudgetPage';
import { AuthProvider } from './сontext/AuthContext';
import AdminPanelPage from './pages/AdminPanelPage';
import ToDoListPage from './pages/ToDoListPage';
import { TaskCountProvider } from './сontext/TaskCountContext';
import PaymentsIncomePage from './pages/FinancePage/PaymentIncomePage';
import BlogPage from './pages/BlogPage';
import ChatPage from './pages/ChatPage';
import AnalyticsPage from './pages/AnalyticsPage';
import type { AuthInfo } from './api/types/auth';
import apiClient, { PIN_REQUIRED_EVENT, type PinRequiredEventDetail } from './api/client';
import PinCodeModal from './components/modal/PinCodeModal';
import LicenseOutPage from './pages/LicenseOutPage';
import AboutPage from './pages/AboutPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import InvestorsPoolPage from './pages/InvestorsPoolPage';
import { DesktopOnlyContent } from './components/DesktopOnly';
import RegistrationRequestPage from './pages/RegistrationRequestPage';
import CreditApplicationPage from './pages/CreditApplicationPage';
import NotificationHandler from './components/NotificationHandler/NotificationHandler';
import { DISABLE_NOTIFICATIONS_KEY, getDisableNotificationsSetting, useLocalStorageSetting } from './components/modal/SettingsModal';
import FinancePage from './pages/FinancePage/FinancePage';
import SettingsPage from './pages/SettingsPage.tsx/SettingsPage';
import BlackCatalogPage from './pages/BlackCatalogPage/BlackCatalogPage';
import BotManagementPage from './pages/SettingsPage.tsx/BotManagementPage';

const INACTIVITY_TIMEOUT = 13 * 60 * 1000;
const FULL_RELOAD_AFTER_HIDDEN = 60 * 60 * 1000;

type PinResolver = {
  resolve: (pin: string) => void;
  reject: (error: Error) => void;
};

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
  const [isLicenseValid, setIsLicenseValid] = useState<boolean>(true);
  const disableNotifications = useLocalStorageSetting(DISABLE_NOTIFICATIONS_KEY, false);
  const pinResolversRef = useRef<PinResolver[]>([]);
  const lastHiddenAtRef = useRef<number | null>(null);
  const needsFullReloadRef = useRef<boolean>(false);

  const currentPath = window.location.pathname;

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, [getDisableNotificationsSetting]);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    const checkLicense = async () => {
      console.log(currentPath); 
      if (currentPath === '/licence-out') {
        return;
      }
      console.log('{L{L L{'); 
      if (isAuthenticated && authInfo) {
        const licenceActive = authInfo.employee.licenceActive;
        if (!licenceActive) {
          setIsLicenseValid(false);
          window.location.href = '/licence-out';
        } else {
          setIsLicenseValid(true);
        }
      }
    };

    checkLicense();
  }, [isAuthenticated, authInfo]);

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
      const elapsed = currentTime - lastActivity;
      if (elapsed > INACTIVITY_TIMEOUT) {
        if (elapsed >= FULL_RELOAD_AFTER_HIDDEN) {
          needsFullReloadRef.current = true;
        }
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
      pinResolversRef.current.push({ resolve, reject });
      setShowPinModal(true);
    };

    window.addEventListener(PIN_REQUIRED_EVENT, handlePinRequired as EventListener);
    return () => {
      window.removeEventListener(PIN_REQUIRED_EVENT, handlePinRequired as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lastHiddenAtRef.current = Date.now();
        return;
      }

      const hiddenAt = lastHiddenAtRef.current;
      lastHiddenAtRef.current = null;
      if (!hiddenAt || !isAuthenticated) return;

      const awayMs = Date.now() - hiddenAt;
      if (awayMs < INACTIVITY_TIMEOUT) return;

      if (awayMs >= FULL_RELOAD_AFTER_HIDDEN) {
        needsFullReloadRef.current = true;
      }

      sessionStorage.removeItem('lastActivity');
      if (authInfo?.hasPin && !showPinModal) {
        setShowPinModal(true);
      } else if (authInfo && !authInfo.hasPin) {
        window.location.reload();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, authInfo, showPinModal]);

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
              if (savedActivity && Date.now() - parseInt(savedActivity, 10) >= FULL_RELOAD_AFTER_HIDDEN) {
                needsFullReloadRef.current = true;
              }
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

  const handlePinSuccess = useCallback((pin?: string) => {
    setShowPinModal(false);
    updateActivity();
    sessionStorage.setItem('lastActivity', Date.now().toString());

    const resolvers = pinResolversRef.current;
    pinResolversRef.current = [];
    const triggeredByInterceptor = resolvers.length > 0;
    if (pin) {
      resolvers.forEach(r => r.resolve(pin));
    }

    if (needsFullReloadRef.current || triggeredByInterceptor || !authInfo) {
      needsFullReloadRef.current = false;
      window.location.reload();
    }
  }, [updateActivity, authInfo]);

  const handlePinMaxAttempts = useCallback(() => {
    const resolvers = pinResolversRef.current;
    pinResolversRef.current = [];
    resolvers.forEach(r => r.reject(new Error('Max attempts reached')));
    authStorage.clear();
    window.location.href = '/auth';
  }, []);

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
      {!disableNotifications && <NotificationHandler />}
      {showPinModal && (
        <PinCodeModal
          isOpen={true}
          onSuccess={handlePinSuccess}
          mode="verify"
          onMaxAttempts={handlePinMaxAttempts}
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

            <Route path="/credits/:id?" element={
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
                  <SchedulePage initialTab="table" hiddenTabs={['calendar']} title="Ожидаемые платежи" />
                </MainLayout>
            } />

            <Route path="schedule-calendar" element={
                <MainLayout> 
                  <SchedulePage initialTab="calendar" hiddenTabs={['schedule', 'table']} title="Календарь платежей" />
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

            <Route path="settings" element={
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
            } />

            <Route path="investors-report" element={
                <MainLayout>
                  <InvestorReportPage />
                </MainLayout>
            } />

            <Route path="/whatsapp/channel/:channelId/bots" element={
                <MainLayout>
                  <BotManagementPage />
                </MainLayout>
            } />

            <Route path="investors-pool" element={
                <MainLayout>
                  <InvestorsPoolPage />
                </MainLayout>
            } />

            <Route path="finance" element={
                <MainLayout>
                  <FinancePage />
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
