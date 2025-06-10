import ProfileTabs from '../../components/Profile/ProfileTabs';
import PageLayout from '../../components/ui/Layouts/PageLayout';
import CustomTitle from '../../components/ui/Text/CustomTitle';
import CompanyPage from './CompanyPage';
import EmployeePage from './EmployeePage';
import EmployeeProfilePage from './EmployeeProfilePage';
import { useState } from 'react';
import DarkCyanButton from '../../components/ui/Buttons/DarkCyanButton';

const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState("Мой профиль");
    const [viewingEmployeeId, setViewingEmployeeId] = useState<number | null>(null);

    const handleViewEmployee = (id: number) => {
        setViewingEmployeeId(id);
    };

    const handleBackToList = () => {
        setViewingEmployeeId(null);
    };

    const renderTabContent = () => {
        if (viewingEmployeeId) {
            return (
                <>
                    <DarkCyanButton onClick={handleBackToList} style={{ marginBottom: '20px' }}>
                        К списку пользователей
                    </DarkCyanButton>
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
            {!viewingEmployeeId && <ProfileTabs onTabChange={setActiveTab} />}
            {renderTabContent()}
        </PageLayout>
    );
};

export default ProfilePage;