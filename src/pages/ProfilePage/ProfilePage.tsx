import PageLayout from "../../components/ui/Layouts/PageLayout";
import EmployeeProfilePage from "./EmployeeProfilePage";
import SessionsPage from "./SessionsPage";
import { useEffect, useState } from "react";
import type { Tab } from "../../components/ui/fields/Tabs";
import Tabs from "../../components/ui/fields/Tabs";

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const savedTab = localStorage.getItem("profileActiveTab");
    if (
      savedTab === "Аккаунты" ||
      savedTab === "Активные сессии" ||
      savedTab === "Аккаунт и безопасность"
    ) {
      return "Настройки";
    }
    return savedTab || "Мой профиль";
  });
  useEffect(() => {
    localStorage.setItem("profileActiveTab", activeTab);
  }, [activeTab]);

  const tabs: Tab[] = [
    { id: "Мой профиль", label: "Мой профиль" },
    { id: "Настройки", label: "Настройки" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Мой профиль":
        return <EmployeeProfilePage />;
      case "Настройки":
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
