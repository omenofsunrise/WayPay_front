import ProfileTabs from '../../components/Profile/ProfileTabs';
import PageLayout from '../../components/ui/Layouts/PageLayout';
import CustomTitle from '../../components/ui/Text/CustomTitle';
import EmployeePage from './EmployeePage';
import EmployeeProfilePage from './EmployeeProfilePage';
import { useState } from 'react';

const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState("Мой профиль");

    const renderTabContent = () => {
        switch (activeTab) {
            case "Мой профиль":
                return <EmployeeProfilePage />;
            case "Список пользователей":
                return <EmployeePage />;
            case "Данные компании":
                return <div/>;
            default:
                return <EmployeeProfilePage />;
        }
    };

    return (
        <PageLayout>
            <ProfileTabs onTabChange={setActiveTab} />
            {renderTabContent()}
        </PageLayout>
    );
};

export default ProfilePage;