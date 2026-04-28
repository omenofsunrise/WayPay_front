import PageLayout from '../../components/ui/Layouts/PageLayout';
import { useEffect, useState } from 'react';
import BackButtonComponent from '../../components/ui/Buttons/BackButton';
import { useAuth } from '../../сontext/AuthContext';
import type { Tab } from '../../components/ui/fields/Tabs';
import Tabs from '../../components/ui/fields/Tabs';
import EmployeeProfilePage from '../ProfilePage/EmployeeProfilePage';
import EmployeePage from './EmployeePage';
import CompanyPage from './CompanyPage';
import BranchPage from './BranchPage';
import SenderPage from './SenderPage';
import AboutPage from '../AboutPage';
import WhatsAppSettingsPage from './WhatsAppSettingsPage'; // Добавляем импорт

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState<string>(() => {
        const savedEmployeeId = localStorage.getItem('settingsViewingEmployeeId');
        if (savedEmployeeId) {
            return "Сотрудники";
        }
        return localStorage.getItem('settingsActiveTab') || "Сотрудники";
    });

    const [viewingEmployeeId, setViewingEmployeeId] = useState<number | null>(() => {
        const saved = localStorage.getItem('settingsViewingEmployeeId');
        return saved ? parseInt(saved) : null;
    });

    const { hasRole } = useAuth();

    useEffect(() => {
        localStorage.setItem('settingsActiveTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        if (viewingEmployeeId) {
            localStorage.setItem('settingsViewingEmployeeId', viewingEmployeeId.toString());
        } else {
            localStorage.removeItem('settingsViewingEmployeeId');
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

    const tabs: Tab[] = [
        { id: "Сотрудники", label: "Сотрудники" }
    ];

    if (hasRole('директор') || hasRole("суперадмин")) {
        tabs.push(
            { id: "Данные компании", label: "Данные компании" },
            { id: "Отделения", label: "Отделения" },
            { id: "Рассылка", label: "Рассылка" },
            { id: "WhatsApp", label: "WhatsApp" }, // Добавляем вкладку WhatsApp
            { id: "О программе", label: "О программе" }
        );
    } else if (hasRole("админ")) {
        tabs.push(
            { id: "WhatsApp", label: "WhatsApp" }, // Добавляем для админа
            { id: "О программе", label: "О программе" }
        );
    } else {
        tabs.push(
            { id: "WhatsApp", label: "WhatsApp" }, // Добавляем для обычных сотрудников (если нужно)
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
            case "Данные компании":
                return <CompanyPage />;
            case "Отделения":
                return <BranchPage />;
            case "Рассылка":
                return <SenderPage />;
            case "WhatsApp": // Добавляем кейс для WhatsApp
                return <WhatsAppSettingsPage />;
            case "О программе":
                return <AboutPage />;
            default:
                return <EmployeePage onViewEmployee={handleViewEmployee} />;
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

export default SettingsPage;