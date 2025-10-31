import PageLayout from '../../components/ui/Layouts/PageLayout';
import CompanyPage from './CompanyPage';
import EmployeePage from './EmployeePage';
import EmployeeProfilePage from './EmployeeProfilePage';
import SessionsPage from './SessionsPage';
import { useEffect, useState } from 'react';
import BackButtonComponent from '../../components/ui/Buttons/BackButton';
import BranchPage from './BranchPage';
import SenderPage from './SenderPage'; // Добавляем импорт SenderPage
import { useAuth } from '../../сontext/AuthContext';
import type { Tab } from '../../components/ui/fields/Tabs';
import Tabs from '../../components/ui/fields/Tabs';

const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState<string>(() => {
        const savedEmployeeId = localStorage.getItem('viewingEmployeeId');
        if (savedEmployeeId) {
            return "Сотрудники";
        }
        return localStorage.getItem('profileActiveTab') || "Мой профиль";
    });

    const [viewingEmployeeId, setViewingEmployeeId] = useState<number | null>(() => {
        const saved = localStorage.getItem('viewingEmployeeId');
        return saved ? parseInt(saved) : null;
    });

    const { hasRole } = useAuth();

    useEffect(() => {
        localStorage.setItem('profileActiveTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        if (viewingEmployeeId) {
            localStorage.setItem('viewingEmployeeId', viewingEmployeeId.toString());
        } else {
            localStorage.removeItem('viewingEmployeeId');
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
        { id: "Мой профиль", label: "Мой профиль" },
        { id: "Активные сессии", label: "Активные сессии" }
    ];

    if (hasRole('директор') || hasRole("суперадмин")) {
        tabs.push(
            { id: "Сотрудники", label: "Сотрудники" },
            { id: "Данные компании", label: "Данные компании" },
            { id: "Отделения", label: "Отделения" },
            { id: "Рассылка", label: "Рассылка" } // Добавляем вкладку Рассылка
        );
    } else if (hasRole("админ")) {
        tabs.push(
            { id: "Сотрудники", label: "Сотрудники" },
            { id: "Рассылка", label: "Рассылка" } // Добавляем вкладку Рассылка для админа
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
            case "Мой профиль":
                return <EmployeeProfilePage />;
            case "Сотрудники":
                return <EmployeePage onViewEmployee={handleViewEmployee} />;
            case "Данные компании":
                return <CompanyPage />;
            case "Активные сессии":
                return <SessionsPage />;
            case "Отделения":
                return <BranchPage />;
            case "Рассылка": // Добавляем case для новой вкладки
                return <SenderPage />;
            default:
                return <EmployeeProfilePage />;
        }
    };

    return (
        <PageLayout>
            {!viewingEmployeeId && (
                <Tabs 
                    tabs={tabs}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    fontSize={18}
                />
            )}
            {renderTabContent()}
        </PageLayout>
    );
};

export default ProfilePage;