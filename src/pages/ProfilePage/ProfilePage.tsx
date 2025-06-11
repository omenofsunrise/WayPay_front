import styled from 'styled-components';
import ProfileTabs from '../../components/Profile/ProfileTabs';
import PageLayout from '../../components/ui/Layouts/PageLayout';
import CustomTitle from '../../components/ui/Text/CustomTitle';
import CompanyPage from './CompanyPage';
import EmployeePage from './EmployeePage';
import EmployeeProfilePage from './EmployeeProfilePage';
import { useEffect, useState } from 'react';
import BackButtonComponent from '../../components/ui/Buttons/BackButton';

const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState<string>(() => {
        const savedEmployeeId = localStorage.getItem('viewingEmployeeId');
        if (savedEmployeeId) {
            return "Список пользователей";
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
        setActiveTab("Список пользователей");
    };

    const handleBackToList = () => {
        setViewingEmployeeId(null);
        setActiveTab("Список пользователей");
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
            case "Список пользователей":
                return <EmployeePage onViewEmployee={handleViewEmployee} />;
            case "Данные компании":
                return <CompanyPage />;
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