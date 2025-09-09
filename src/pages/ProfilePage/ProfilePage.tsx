import ProfileTabs from '../../components/Profile/ProfileTabs';
import PageLayout from '../../components/ui/Layouts/PageLayout';
import CompanyPage from './CompanyPage';
import EmployeePage from './EmployeePage';
import EmployeeProfilePage from './EmployeeProfilePage';
import SessionsPage from './SessionsPage';
import { useEffect, useState } from 'react';
import BackButtonComponent from '../../components/ui/Buttons/BackButton';

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
            default:
                return <EmployeeProfilePage />;
        }
    };

    return (
        <PageLayout>
            {!viewingEmployeeId && (
                <ProfileTabs 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab} 
                />
            )}
            {renderTabContent()}
        </PageLayout>
    );
};

export default ProfilePage;