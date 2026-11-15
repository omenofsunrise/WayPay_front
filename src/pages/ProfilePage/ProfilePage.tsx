import PageLayout from "../../components/ui/Layouts/PageLayout";
import EmployeeProfilePage from "./EmployeeProfilePage";
import SessionsPage from "./SessionsPage";
import { useEffect, useState } from "react";
import { useAuth } from "../../сontext/AuthContext";
import type { Tab } from "../../components/ui/fields/Tabs";
import Tabs from "../../components/ui/fields/Tabs";
import QRCodeAuth from "../../components/WhatsAppLogin";
import EmployeeWhatsAppPage from "./EmployeeWhatsAppPage";
import AccountSwitcher from "./AccountSwitcher";

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem("profileActiveTab") || "Мой профиль";
  });
  const { authInfo } = useAuth();

  useEffect(() => {
    localStorage.setItem("profileActiveTab", activeTab);
  }, [activeTab]);

  const tabs: Tab[] = [
    { id: "Мой профиль", label: "Мой профиль" },
    { id: "Аккаунты", label: "Аккаунты" },
    { id: "Активные сессии", label: "Активные сессии" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Мой профиль":
        return <EmployeeProfilePage />;
      case "Аккаунты":
        return <AccountSwitcher />;
      case "Активные сессии":
        return <SessionsPage />;
      default:
        return <EmployeeProfilePage />;
    }
  };

  return (
    <PageLayout>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        fontSize={18}
      />
      {renderTabContent()}
    </PageLayout>
  );
};

export default ProfilePage;
