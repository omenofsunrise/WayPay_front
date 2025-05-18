import styled from "styled-components";
import ContractIcon from "../../../assets/ui/credits/allCredits.svg?react";
import ImportantIcon from "../../../assets/ui/credits/important.svg?react";
import DebtorsIcon from "../../../assets/ui/credits/debt.svg?react";
import ArchiveIcon from "../../../assets/ui/credits/pending.svg?react";

const CreditTypes = () => {
    return (
        <CreditTypesContainer>
            <CreditButton>
                <ContractIcon />
                <span>Все договоры</span>
            </CreditButton>
            <CreditButton>
                <ImportantIcon />
                <span>Важные</span>
            </CreditButton>
            <CreditButton>
                <DebtorsIcon />
                <span>Должники</span>
            </CreditButton>
            <CreditButton>
                <ArchiveIcon />
                <span>В архиве</span>
            </CreditButton>
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

const CreditButton = styled.button`
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
    
    &:hover {
        background-color: rgba(37, 203, 161, 1);
        border-radius: 10px;
    }
`;

export default CreditTypes;