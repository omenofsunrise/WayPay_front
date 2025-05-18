import styled from "styled-components";
import ContractIcon from "../../../assets/ui/credits/allCredits.svg?react";
import ImportantIcon from "../../../assets/ui/credits/important.svg?react";
import DebtorsIcon from "../../../assets/ui/credits/debt.svg?react";
import ArchiveIcon from "../../../assets/ui/credits/pending.svg?react";
import { useState } from "react";

interface CreditButtonProps {
    $isActive: boolean;
}

const CreditTypes = () => {
    const [activeTab, setActiveTab] = useState("Все договоры");

    const tabs = [
        { name: "Все договоры", icon: <ContractIcon /> },
        { name: "Важные", icon: <ImportantIcon /> },
        { name: "Должники", icon: <DebtorsIcon /> },
        { name: "В архиве", icon: <ArchiveIcon /> }
    ];

    return (
        <CreditTypesContainer>
            {tabs.map((tab) => (
                <CreditButton 
                    key={tab.name}
                    $isActive={activeTab === tab.name}
                    onClick={() => setActiveTab(tab.name)}
                >
                    {tab.icon}
                    <span>{tab.name}</span>
                </CreditButton>
            ))}
        </CreditTypesContainer>
    );
};

const CreditTypesContainer = styled.div`
    background-color: white;
    border-radius: 5px;
    display: flex;
    gap: 15px;
    width: fit-content;
    margin-bottom: 15px;
`;

const CreditButton = styled.button<CreditButtonProps>`
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
    border-radius: 5px;
    &:hover {
        background-color: rgba(37, 203, 161, 1);
        border-radius: 10px;
    }
    
    &:focus {
        outline: none;
    }
`;

export default CreditTypes;