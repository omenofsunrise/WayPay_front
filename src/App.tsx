import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import AuthPage from "./pages/AuthPage";
import CreditPage from "./pages/CreditPage";
import MainLayout from "./components/Layout/MainLayout/MainLayout";
import { NotFoundContent } from "./components/NotFoundContent";
import "./App.css";
import PaymentPage from "./pages/PaymentPage";
import ProductPage from "./pages/ProductPage";
import { authStorage } from "./api/utils/auth-storage";
import QueuePage from "./pages/QueuePage";
import ClientPage from "./pages/ClientPage";
import InvestorPage from "./pages/InvestorPage";
import NewCreditPage from "./pages/NewCreditPage";
import SchedulePage from "./pages/Schedule/SchedulePage";
import CreditControlPage from "./pages/CreditControlPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import InvestorReportPage from "./pages/InvestorReportPage";
import InvestorsV2Page from "./pages/InvestorsV2Page";
import BudgetPage from "./pages/FinancePage/BudgetPage";
import { AuthProvider, useAuth } from "./сontext/AuthContext";
import AdminPanelPage from "./pages/AdminPanelPage";
import AdminWhatsAppChatPage from "./pages/AdminWhatsAppChatPage";
import ToDoListPage from "./pages/ToDoListPage";
import { TaskCountProvider } from "./сontext/TaskCountContext";
import { ClientFeedbackProvider } from "./сontext/ClientFeedbackContext";
import PaymentsIncomePage from "./pages/FinancePage/PaymentIncomePage";
import ChatPage from "./pages/ChatPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import type { AuthInfo } from "./api/types/auth";
import apiClient, {
  PIN_REQUIRED_EVENT,
  type PinRequiredEventDetail,
} from "./api/client";
import PinCodeModal from "./components/modal/PinCodeModal";
import LicenseOutPage from "./pages/LicenseOutPage";
import AboutPage from "./pages/AboutPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import InvestorsPoolPage from "./pages/InvestorsPoolPage";
import { DesktopOnlyContent } from "./components/DesktopOnly";
import MobileAppsPage from "./pages/MobileAppsPage";
import CreditApplicationPage from "./pages/CreditApplicationPage";
import PublicClientPage from "./pages/PublicClientPage";
import CreditPrintPage from "./pages/CreditPrintPage";
import PublicInvestorReportPage from "./pages/PublicInvestorReportPage";

// Путь публичной страницы клиента по токену (должен совпадать с ClientLinkModal).
const CLIENT_PUBLIC_PATH = "/client-public";
const INVESTOR_PUBLIC_PATH = "/investor-public";

// Страницы по временной ссылке открываются без входа в систему. Любая
// проверка авторизации должна спрашивать именно этот список, иначе новая
// публичная страница молча начнёт требовать вход.
const isPublicLinkPath = (pathname: string) =>
  pathname.startsWith(CLIENT_PUBLIC_PATH) ||
  pathname.startsWith(INVESTOR_PUBLIC_PATH);
import NotificationHandler from "./components/NotificationHandler/NotificationHandler";
import {
  DISABLE_NOTIFICATIONS_KEY,
  getDisableNotificationsSetting,
  useLocalStorageSetting,
} from "./components/modal/SettingsModal";
import FinancePage from "./pages/FinancePage/FinancePage";
import SettingsPage from "./pages/SettingsPage.tsx/SettingsPage";
import BlackCatalogPage from "./pages/BlackCatalog";
import BotManagementPage from "./pages/SettingsPage.tsx/BotManagementPage";
import WhatsAppSendersPage from "./pages/SettingsPage.tsx/WhatsAppSendersPage";
import ReceptionPage from "./pages/ReceptionPage";
import PaymentPendingPage from "./pages/PaymentPendingPage";

const INACTIVITY_TIMEOUT = 13 * 60 * 1000;
const FULL_RELOAD_AFTER_HIDDEN = 60 * 60 * 1000;

type PinResolver = {
  resolve: (pin: string) => void;
  reject: (error: Error) => void;
};

const AppLoader = () => (
  <div className="app-loading">
    <div className="spinner"></div>
  </div>
);

const InvestorsRoute = () => {
  const { authInfo, isLoading } = useAuth();

  if (isLoading || !authInfo) return <AppLoader />;
  return authInfo.employee.poolV2 ? (
    <Navigate to="/investors-v2" replace />
  ) : (
    <InvestorPage />
  );
};

const InvestorsV2Route = () => {
  const { authInfo, isLoading } = useAuth();

  if (isLoading || !authInfo) return <AppLoader />;
  return authInfo.employee.poolV2 ? (
    <InvestorsV2Page />
  ) : (
    <Navigate to="/investors" replace />
  );
};

const InvestorsPoolRoute = () => {
  const { authInfo, isLoading } = useAuth();

  if (isLoading || !authInfo) return <AppLoader />;
  return authInfo.employee.poolV2 ? (
    <Navigate to="/investors-v2" replace />
  ) : (
    <InvestorsPoolPage />
  );
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
  const disableNotifications = useLocalStorageSetting(
    DISABLE_NOTIFICATIONS_KEY,
    false
  );
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
      if (currentPath === "/licence-out") {
        return;
      }
      console.log("{L{L L{");
      if (isAuthenticated && authInfo) {
        const licenceActive = authInfo.employee.licenceActive;
        if (!licenceActive) {
          setIsLicenseValid(false);
          window.location.href = "/licence-out";
        } else {
          setIsLicenseValid(true);
        }
      }
    };

    checkLicense();
  }, [isAuthenticated, authInfo]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (
        (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "l") ||
        (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "д")
      ) {
        event.preventDefault();

        if (isAuthenticated && authInfo?.hasPin && !showPinModal) {
          setShowPinModal(true);
          sessionStorage.removeItem("lastActivity");
        }
      }
    },
    [isAuthenticated, authInfo?.hasPin, showPinModal]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    const handleUserActivity = () => {
      updateActivity();
    };

    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("scroll", handleUserActivity);
    window.addEventListener("click", handleUserActivity);

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
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
        sessionStorage.removeItem("lastActivity");
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

    window.addEventListener(
      PIN_REQUIRED_EVENT,
      handlePinRequired as EventListener
    );
    return () => {
      window.removeEventListener(
        PIN_REQUIRED_EVENT,
        handlePinRequired as EventListener
      );
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

      sessionStorage.removeItem("lastActivity");
      if (authInfo?.hasPin && !showPinModal) {
        setShowPinModal(true);
      } else if (authInfo && !authInfo.hasPin && !authInfo.pinDisabled) {
        window.location.reload();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAuthenticated, authInfo, showPinModal]);

  const updateAuthStatus = useCallback(() => {
    const authenticated = authStorage.isAuthenticated();
    setIsAuthenticated(authenticated);
    return authenticated;
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      // Миграция уже залогиненных в мультиаккаунт.
      authStorage.ensureSeeded();
      const authenticated = updateAuthStatus();
      // Режим добавления аккаунта: остаёмся на /auth, даже если уже залогинены.
      const addingAccount = sessionStorage.getItem("wp_add_account") === "1";

      if (
        authenticated &&
        window.location.pathname === "/auth" &&
        !addingAccount
      ) {
        window.location.href = "/credits";
      }

      if (
        !authenticated &&
        window.location.pathname !== "/auth" &&
        !isPublicLinkPath(window.location.pathname)
      ) {
        window.location.href = "/auth";
      }

      if (authenticated) {
        apiClient
          .get<AuthInfo>("/Auth/info")
          .then((response) => {
            setAuthInfo(response.data);
            authStorage.setUserType(response.data.type);

            const savedActivity = sessionStorage.getItem("lastActivity");
            if (
              !savedActivity ||
              (savedActivity &&
                Date.now() - parseInt(savedActivity, 10) > INACTIVITY_TIMEOUT)
            ) {
              if (
                savedActivity &&
                Date.now() - parseInt(savedActivity, 10) >=
                  FULL_RELOAD_AFTER_HIDDEN
              ) {
                needsFullReloadRef.current = true;
              }
              if (
                !addingAccount &&
                response.data.hasPin &&
                !response.data.pinDisabled
              ) {
                setShowPinModal(true);
              }
            }
          })
          .catch(() => setAuthInfo(null));
      }
    };

    checkAuth();

    const handleStorageChange = () => checkAuth();
    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, [updateAuthStatus]);

  const handlePinSuccess = useCallback(
    (pin?: string) => {
      setShowPinModal(false);
      updateActivity();
      sessionStorage.setItem("lastActivity", Date.now().toString());

      const resolvers = pinResolversRef.current;
      pinResolversRef.current = [];
      const triggeredByInterceptor = resolvers.length > 0;
      if (pin) {
        resolvers.forEach((r) => r.resolve(pin));
      }

      if (needsFullReloadRef.current || triggeredByInterceptor || !authInfo) {
        needsFullReloadRef.current = false;
        window.location.reload();
      }
    },
    [updateActivity, authInfo]
  );

  const handlePinMaxAttempts = useCallback(() => {
    const resolvers = pinResolversRef.current;
    pinResolversRef.current = [];
    resolvers.forEach((r) => r.reject(new Error("Max attempts reached")));
    authStorage.clear();
    window.location.href = "/auth";
  }, []);

  // Публичные страницы по токену должны открываться и на мобильных: и
  // клиент, и инвестор чаще всего откроют ссылку с телефона.
  const isPublicClientRoute = isPublicLinkPath(window.location.pathname);

  if (isMobile && !isPublicClientRoute) {
    return <DesktopOnlyContent />;
  }

  if (isAuthenticated && authInfo?.hasPin === false && !authInfo.pinDisabled) {
    return (
      <PinCodeModal
        isOpen={true}
        onSuccess={() => window.location.reload()}
        mode="setup"
        onMaxAttempts={() => {
          authStorage.clear();
          window.location.href = "/auth";
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
      {showPinModal && (
        <PinCodeModal
          isOpen={true}
          onSuccess={handlePinSuccess}
          mode="verify"
          onMaxAttempts={handlePinMaxAttempts}
        />
      )}
      <BrowserRouter>
        {/* Внутри роутера: иначе переход по уведомлению пришлось бы делать
            перезагрузкой страницы, а она заново поднимает непрочитанные и
            показывает только что закрытое уведомление снова. */}
        {!disableNotifications && <NotificationHandler />}
        <TaskCountProvider>
          <ClientFeedbackProvider>
            {authInfo?.type === "payment_place" ||
            authStorage.isPaymentPlace() ? (
              <Routes>
                <Route
                  path="/reception"
                  element={
                    <MainLayout>
                      <ReceptionPage />
                    </MainLayout>
                  }
                />
                <Route
                  path="*"
                  element={<Navigate to="/reception" replace />}
                />
              </Routes>
            ) : (
              <Routes>
                <Route
                  path="/"
                  element={
                    <Navigate
                      to={isAuthenticated ? "/credits" : "/auth"}
                      replace
                    />
                  }
                />

                <Route
                  path="/auth"
                  element={
                    isAuthenticated &&
                    sessionStorage.getItem("wp_add_account") !== "1" ? (
                      <Navigate to="/credits" replace />
                    ) : (
                      <AuthPage
                        onLoginSuccess={() => setIsAuthenticated(true)}
                      />
                    )
                  }
                />

                {/* Печать договора — без MainLayout, чтобы на бумагу шёл только документ. */}
                <Route
                  path="/credits/:id/print"
                  element={
                    isAuthenticated ? (
                      <CreditPrintPage />
                    ) : (
                      <Navigate to="/auth" replace />
                    )
                  }
                />

                <Route
                  path="/credits/:id?"
                  element={
                    isAuthenticated ? (
                      <MainLayout>
                        <CreditPage />
                      </MainLayout>
                    ) : (
                      <Navigate to="/auth" replace />
                    )
                  }
                />

                <Route
                  path="payments"
                  element={
                    <MainLayout>
                      <PaymentPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="payments-pending"
                  element={
                    <MainLayout>
                      <PaymentPendingPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="products"
                  element={
                    <MainLayout>
                      <ProductPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="queue"
                  element={
                    <MainLayout>
                      <QueuePage />
                    </MainLayout>
                  }
                />

                <Route
                  path="clients"
                  element={
                    <MainLayout>
                      <ClientPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="blacklist"
                  element={<Navigate to="/clients" replace />}
                />

                <Route
                  path="black-catalog"
                  element={
                    <MainLayout>
                      <BlackCatalogPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="investors"
                  element={
                    <MainLayout>
                      <InvestorsRoute />
                    </MainLayout>
                  }
                />

                <Route
                  path="investors-v2"
                  element={
                    <MainLayout>
                      <InvestorsV2Route />
                    </MainLayout>
                  }
                />

                <Route
                  path="new-credit"
                  element={
                    <MainLayout>
                      <NewCreditPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="new-credit/:id?"
                  element={
                    <MainLayout>
                      <NewCreditPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="schedules"
                  element={
                    <MainLayout>
                      <SchedulePage
                        initialTab="table"
                        hiddenTabs={["calendar"]}
                        title="Ожидаемые платежи"
                      />
                    </MainLayout>
                  }
                />

                <Route
                  path="schedule-calendar"
                  element={
                    <MainLayout>
                      <SchedulePage
                        initialTab="calendar"
                        hiddenTabs={["schedule", "table"]}
                        title="Календарь платежей"
                      />
                    </MainLayout>
                  }
                />

                <Route
                  path="credit-control"
                  element={
                    <MainLayout>
                      <CreditControlPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="profile"
                  element={
                    <MainLayout>
                      <ProfilePage />
                    </MainLayout>
                  }
                />

                <Route
                  path="settings"
                  element={
                    <MainLayout>
                      <SettingsPage />
                    </MainLayout>
                  }
                />

                {!authInfo?.employee?.poolV2 && (
                  <Route
                    path="investors-report"
                    element={
                      <MainLayout>
                        <InvestorReportPage />
                      </MainLayout>
                    }
                  />
                )}

                <Route
                  path="/whatsapp/channel/:channelId/bots"
                  element={
                    <MainLayout>
                      <BotManagementPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="/whatsapp/senders"
                  element={
                    <MainLayout>
                      <WhatsAppSendersPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="investors-pool"
                  element={
                    <MainLayout>
                      <InvestorsPoolRoute />
                    </MainLayout>
                  }
                />

                <Route
                  path="finance"
                  element={
                    <MainLayout>
                      <FinancePage />
                    </MainLayout>
                  }
                />

                <Route
                  path="budget"
                  element={
                    <MainLayout>
                      <BudgetPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="admin"
                  element={
                    <MainLayout>
                      <AdminPanelPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="admin/whatsapp/:phone"
                  element={
                    <MainLayout>
                      <AdminWhatsAppChatPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="todo"
                  element={
                    <MainLayout>
                      <ToDoListPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="payments-income"
                  element={
                    <MainLayout>
                      <PaymentsIncomePage />
                    </MainLayout>
                  }
                />

                <Route
                  path="chat"
                  element={
                    <MainLayout>
                      <ChatPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="chat/:chatId?"
                  element={
                    <MainLayout>
                      <ChatPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="analytics"
                  element={
                    <MainLayout>
                      <AnalyticsPage />
                    </MainLayout>
                  }
                />

                <Route path="/licence-out" element={<LicenseOutPage />} />

                {/* Публичный просмотр клиента по временному токену — без авторизации и без MainLayout. */}
                <Route
                  path={CLIENT_PUBLIC_PATH}
                  element={<PublicClientPage />}
                />

                {/* Касса инвестора по временной ссылке — тоже без авторизации. */}
                <Route
                  path={INVESTOR_PUBLIC_PATH}
                  element={<PublicInvestorReportPage />}
                />

                <Route
                  path="about"
                  element={
                    <MainLayout>
                      <AboutPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="privacy-policy"
                  element={
                    <MainLayout>
                      <PrivacyPolicyPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="mobile-apps"
                  element={
                    <MainLayout>
                      <MobileAppsPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="credit-application"
                  element={
                    <MainLayout>
                      <CreditApplicationPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="*"
                  element={
                    <MainLayout>
                      <NotFoundContent />
                    </MainLayout>
                  }
                />
              </Routes>
            )}
          </ClientFeedbackProvider>
        </TaskCountProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
