import styled from "styled-components";
import { useAuth } from "../../сontext/AuthContext";

interface ProfileTabButtonProps {
    $isActive: boolean;
}

interface ProfileTabsProps {
    activeTab: string;
    onTabChange: (tabName: string) => void;
}

const ProfileTabs = ({ activeTab, onTabChange }: ProfileTabsProps) => {
  const { hasRole } = useAuth();
    const tabs = [];
    
    tabs.push({ name: "Мой профиль" });
    
    tabs.push({ name: "Активные сессии" });
    
    if (hasRole('директор') || hasRole("суперадмин")) {
        tabs.push({ name: "Список пользователей" });
        tabs.push({ name: "Данные компании" });
    } else if (hasRole("админ")) {
        tabs.push({ name: "Список пользователей" });
    }

    return (
        <ProfileTabsContainer>
            {tabs.map((tab) => (
                <ProfileTabButton 
                    key={tab.name}
                    $isActive={activeTab === tab.name}
                    onClick={() => onTabChange(tab.name)}
                >
                    <span>{tab.name}</span>
                </ProfileTabButton>
            ))}
        </ProfileTabsContainer>
    );
};

const ProfileTabsContainer = styled.div`
    background-color: white;
    border-radius: 5px;
    display: flex;
    gap: 15px;
    width: fit-content;
    margin: 25px;
`;

const ProfileTabButton = styled.button<ProfileTabButtonProps>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 15px;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 5px;
    transition: all 0.3s ease;
    font-size: 16px;
    font-weight: 500;
    background-color: ${props => props.$isActive ? "rgba(37, 203, 161, 1)" : "transparent"};
    color: black;
    border-radius: 5px;
    &:hover {
        background-color: rgba(37, 203, 161, 1);
        border-radius: 10px;
    }
    
    &:focus {
        outline: none;
    }
`;

export default ProfileTabs;