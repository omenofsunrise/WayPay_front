import { useEffect, useState } from "react";
import styled from "styled-components";
import BackButtonComponent from "../../components/ui/Buttons/BackButton";
import { useAuth } from "../../сontext/AuthContext";
import EmployeeProfilePage from "../ProfilePage/EmployeeProfilePage";
import EmployeePage from "./EmployeePage";
import CustomRolesPage from "./CustomRolesPage";
import CompanyPage from "./CompanyPage";
import BranchPage from "./BranchPage";
import SenderPage from "./SenderPage";
import AboutPage from "../AboutPage";
import WhatsAppSettingsPage from "./WhatsAppSettingsPage";
import PaymentPlacePage from "./PaymentPlacePage";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const savedEmployeeId = localStorage.getItem("settingsViewingEmployeeId");
    if (savedEmployeeId) {
      return "Сотрудники";
    }
    return localStorage.getItem("settingsActiveTab") || "Сотрудники";
  });

  const [viewingEmployeeId, setViewingEmployeeId] = useState<number | null>(
    () => {
      const saved = localStorage.getItem("settingsViewingEmployeeId");
      return saved ? parseInt(saved) : null;
    }
  );

  const { hasRole } = useAuth();

  useEffect(() => {
    localStorage.setItem("settingsActiveTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (viewingEmployeeId) {
      localStorage.setItem(
        "settingsViewingEmployeeId",
        viewingEmployeeId.toString()
      );
    } else {
      localStorage.removeItem("settingsViewingEmployeeId");
    }
  }, [viewingEmployeeId]);

  const handleViewEmployee = (id: number) => {
    setViewingEmployeeId(id);
    setActiveTab("Сотрудники");
  };

  const handleBackToList = () => {
    setViewingEmployeeId(null);
    setActiveTab("Сотрудники");
  };

  const tabs: { id: string; label: string }[] = [
    { id: "Сотрудники", label: "Сотрудники" },
  ];

  if (hasRole("директор") || hasRole("суперадмин")) {
    tabs.push(
      { id: "Роли", label: "Роли" },
      { id: "Данные компании", label: "Данные компании" },
      { id: "Отделения", label: "Отделения" },
      { id: "Пункты приёма", label: "Пункты приёма" },
      { id: "Рассылка", label: "Рассылка" },
      { id: "WhatsApp", label: "WhatsApp" },
      { id: "О программе", label: "О программе" }
    );
  } else if (hasRole("админ")) {
    tabs.push(
      { id: "WhatsApp", label: "WhatsApp" },
      { id: "О программе", label: "О программе" }
    );
  } else {
    tabs.push(
      { id: "WhatsApp", label: "WhatsApp" },
      { id: "О программе", label: "О программе" }
    );
  }

  const renderTabContent = () => {
    if (viewingEmployeeId) {
      return (
        <>
          <BackButtonComponent onClick={handleBackToList}>
            К списку пользователей
          </BackButtonComponent>
          <EmployeeProfilePage employeeId={viewingEmployeeId} />
        </>
      );
    }

    switch (activeTab) {
      case "Сотрудники":
        return <EmployeePage onViewEmployee={handleViewEmployee} />;
      case "Роли":
        return <CustomRolesPage />;
      case "Данные компании":
        return <CompanyPage />;
      case "Отделения":
        return <BranchPage />;
      case "Пункты приёма":
        return <PaymentPlacePage />;
      case "Рассылка":
        return <SenderPage />;
      case "WhatsApp":
        return <WhatsAppSettingsPage />;
      case "О программе":
        return <AboutPage />;
      default:
        return <EmployeePage onViewEmployee={handleViewEmployee} />;
    }
  };

  return (
    <SettingsShell>
      <TabsBar aria-label="Разделы настроек">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            type="button"
            $active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </TabButton>
        ))}
      </TabsBar>
      <SettingsContent $fullWidth={activeTab === "Данные компании"}>
        {renderTabContent()}
      </SettingsContent>
    </SettingsShell>
  );
};

const SettingsShell = styled.div`
  min-height: 100%;
  background:
    radial-gradient(circle at 46% 18%, rgba(222, 234, 243, 0.55), transparent 36%),
    #f7fafc;
`;

const TabsBar = styled.nav`
  min-height: 53px;
  box-sizing: border-box;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: clamp(22px, 3vw, 44px);
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid #dfe7ef;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  position: relative;
  height: 38px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: ${({ $active }) =>
    $active ? "rgba(0, 139, 136, 0.055)" : "transparent"};
  color: ${({ $active }) => ($active ? "#007f7c" : "#53657f")};
  font: inherit;
  font-size: 15px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.18s ease, background-color 0.18s ease;

  &::after {
    content: "";
    position: absolute;
    right: 8px;
    bottom: -8px;
    left: 8px;
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: #008b88;
    opacity: ${({ $active }) => ($active ? 1 : 0)};
  }

  &:hover {
    color: #007f7c;
    background: rgba(0, 139, 136, 0.075);
    border-color: transparent;
  }

  &:focus,
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 139, 136, 0.16);
  }
`;

const SettingsContent = styled.div<{ $fullWidth: boolean }>`
  ${({ $fullWidth }) =>
    $fullWidth
      ? ""
      : `width: min(1344px, calc(100% - 64px)); margin: 0 auto; padding-top: 24px;`}
`;

export default SettingsPage;
