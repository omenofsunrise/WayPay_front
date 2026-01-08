import React from 'react';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import EntitySelectContainer from '../../ui/Layouts/EntitySelectContainer';
import InvestorSelectModal from './InvestorSelectModal';
import { ProgressBar } from '../../ui/ProgressBar';
import styled from 'styled-components';

interface Investor {
  id: number;
  nickname: string;
  fullName: string;
  phoneNumber: string;
  investorPie: number;
  investmentAmount: number;
  balance: number;
  isCompany: boolean;
}

interface SelectedEntity {
  id: number;
  type: 'investor' | 'pool';
  nickname?: string;
  name?: string;
  fullName?: string;
  phoneNumber?: string;
  balance?: number;
  isCompany?: boolean;
  investorPie?: number;
  pie?: number;
}

interface IncomeModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    newIncome: {
        amount: string;
        comment: string;
        investorId: string;
        investorPoolId: string;
        companyShare: number;
    };
    setNewIncome: React.Dispatch<React.SetStateAction<{
        amount: string;
        comment: string;
        investorId: string;
        investorPoolId: string;
        companyShare: number;
    }>>;
    selectedEntity: SelectedEntity | null;
    onEntitySelect: () => void;
    onEntityClear: () => void;
}

const IncomeModal: React.FC<IncomeModalProps> = ({
    show,
    onClose,
    onSave,
    newIncome,
    setNewIncome,
    selectedEntity,
    onEntitySelect,
    onEntityClear
}) => {
    const [displayAmount, setDisplayAmount] = React.useState('');
    const [companyPercentage, setCompanyPercentage] = React.useState('100');
    const [investorPercentage, setInvestorPercentage] = React.useState('0');

    React.useEffect(() => {
        if (show) {
            const numericValue = newIncome.amount.replace(/\D/g, '');
            if (numericValue) {
                const formatted = new Intl.NumberFormat('ru-RU').format(parseInt(numericValue, 10));
                setDisplayAmount(formatted);
            } else {
                setDisplayAmount('');
            }
            
            // Устанавливаем распределение на основе выбранной сущности
            if (selectedEntity?.type === 'investor' && !selectedEntity.isCompany) {
                // Для инвесторов устанавливаем распределение из настроек или по умолчанию
                setCompanyPercentage(newIncome.companyShare.toString());
                setInvestorPercentage((100 - newIncome.companyShare).toString());
            } else {
                // Для пулов и компании-инвесторов 100% компании
                setCompanyPercentage('100');
                setInvestorPercentage('0');
                setNewIncome(prev => ({...prev, companyShare: 100}));
            }
        } else {
            setDisplayAmount('');
            setCompanyPercentage('100');
            setInvestorPercentage('0');
        }
    }, [show, newIncome.amount, newIncome.companyShare, selectedEntity]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        
        const cleanedValue = value.replace(/[^\d,.]/g, '');
        
        const numericValue = cleanedValue.replace(/[.,]/g, '');
        
        setNewIncome(prev => ({...prev, amount: numericValue}));
        
        if (numericValue) {
            const formatted = new Intl.NumberFormat('ru-RU').format(parseInt(numericValue, 10));
            setDisplayAmount(formatted);
        } else {
            setDisplayAmount('');
        }
    };

    const handleCompanyPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedEntity?.type !== 'investor' || selectedEntity.isCompany) return;
        
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 100)) {
            setCompanyPercentage(value);
            if (value !== '') {
                const companyPercent = parseInt(value);
                const investorPercent = 100 - companyPercent;
                setInvestorPercentage(investorPercent.toString());
                setNewIncome(prev => ({...prev, companyShare: companyPercent}));
            }
        }
    };

    const handleInvestorPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedEntity?.type !== 'investor' || selectedEntity.isCompany) return;
        
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 100)) {
            setInvestorPercentage(value);
            if (value !== '') {
                const investorPercent = parseInt(value);
                const companyPercent = 100 - investorPercent;
                setCompanyPercentage(companyPercent.toString());
                setNewIncome(prev => ({...prev, companyShare: companyPercent}));
            }
        }
    };

    const handleProgressChange = (percentage: number) => {
        if (selectedEntity?.type !== 'investor' || selectedEntity.isCompany) return;
        
        setCompanyPercentage(percentage.toString());
        setInvestorPercentage((100 - percentage).toString());
        setNewIncome(prev => ({...prev, companyShare: percentage}));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newIncome.amount || (!newIncome.investorId && !newIncome.investorPoolId)) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }

        // Проверка баланса только для инвесторов
        if (selectedEntity?.type === 'investor') {
            const amountNumber = parseInt(newIncome.amount, 10);
            if (selectedEntity.balance && amountNumber > selectedEntity.balance) {
                alert(`Нельзя вывести больше доступного баланса. Доступно: ${new Intl.NumberFormat('ru-RU').format(selectedEntity.balance)} руб.`);
                return;
            }
        }

        try {
            await onSave(e);
        } catch (error) {
            console.error('Ошибка при сохранении:', error);
        }
    };

    const getEntityDisplayName = () => {
        if (!selectedEntity) return '';
        
        if (selectedEntity.type === 'investor') {
            return selectedEntity.nickname || selectedEntity.fullName || '';
        } else {
            return selectedEntity.name || '';
        }
    };

    const getEntityTypeLabel = () => {
        if (!selectedEntity) return '';
        return selectedEntity.type === 'investor' ? 'Инвестор' : 'Пул';
    };

    const showDistributionSection = selectedEntity?.type === 'investor' && !selectedEntity.isCompany;
    
    // Проверка превышения баланса
    const amountNumber = parseInt(newIncome.amount, 10) || 0;
    const isAmountExceedingBalance = selectedEntity?.type === 'investor' && 
                                     selectedEntity.balance && 
                                     amountNumber > selectedEntity.balance;

    if (!show) return null;

    return (
        <>
            <BaseModal
                title="Добавить приход"
                onClose={onClose}
                onCancel={onClose}
                onSave={handleSave}
                isSaveDisabled={!newIncome.amount || !selectedEntity || isAmountExceedingBalance}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
                    <div>
                        <CustomInput
                            type="text"
                            value={displayAmount}
                            onChange={handleAmountChange}
                            placeholder="Введите сумму"
                            inputType="text"
                            required
                            hasError={isAmountExceedingBalance}
                        />
                        
                        {selectedEntity?.type === 'investor' && selectedEntity.balance !== undefined && (
                            <BalanceInfo>
                                <BalanceLabel>Доступно для вывода:</BalanceLabel>
                                <BalanceAmount>
                                    {new Intl.NumberFormat('ru-RU').format(selectedEntity.balance)} руб.
                                </BalanceAmount>
                                {isAmountExceedingBalance && (
                                    <BalanceError>
                                        Превышена касса на {new Intl.NumberFormat('ru-RU').format(amountNumber - selectedEntity.balance)} руб.
                                    </BalanceError>
                                )}
                                {!isAmountExceedingBalance && amountNumber > 0 && (
                                    <BalanceSuccess>
                                        Можно вывести ещё {new Intl.NumberFormat('ru-RU').format(selectedEntity.balance - amountNumber)} руб.
                                    </BalanceSuccess>
                                )}
                            </BalanceInfo>
                        )}
                    </div>
                    
                    <div style={{ margin: "0 10px", display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <EntitySelectContainer
                            mode="create"
                            primaryValue={getEntityDisplayName()}
                            secondaryValue={selectedEntity ? `${getEntityTypeLabel()}` : ''}
                            placeholder="Выберите инвестора или пул"
                            onSelect={onEntitySelect}
                            onClear={onEntityClear}
                        />
                    </div>

                    {showDistributionSection && (
                        <PercentageSection>
                            <PercentageTitle>Распределение дохода</PercentageTitle>
                            <PercentageSubtitle>
                                Укажите, как распределить сумму между компанией и инвестором
                            </PercentageSubtitle>
                            
                            <PercentageInputsContainer>
                                <PercentageInputGroup>
                                    <PercentageLabel>Компания (%)</PercentageLabel>
                                    <CustomInput
                                        type="text"
                                        value={companyPercentage}
                                        onChange={handleCompanyPercentageChange}
                                        placeholder="0"
                                        inputType="text"
                                        suffix="%"
                                    />
                                    <PercentageAmount>
                                        {amountNumber > 0 ? (
                                            <>
                                                {formatMoney(Math.round(amountNumber * parseInt(companyPercentage) / 100).toString())} руб.
                                            </>
                                        ) : '—'}
                                    </PercentageAmount>
                                </PercentageInputGroup>
                                
                                <PercentageInputGroup>
                                    <PercentageLabel>Инвестор (%)</PercentageLabel>
                                    <CustomInput
                                        type="text"
                                        value={investorPercentage}
                                        onChange={handleInvestorPercentageChange}
                                        placeholder="0"
                                        inputType="text"
                                        suffix="%"
                                    />
                                    <PercentageAmount>
                                        {amountNumber > 0 ? (
                                            <>
                                                {formatMoney(Math.round(amountNumber * parseInt(investorPercentage) / 100).toString())} руб.
                                            </>
                                        ) : '—'}
                                    </PercentageAmount>
                                </PercentageInputGroup>
                            </PercentageInputsContainer>

                            <ProgressBarContainer>
                                <ProgressBarLabels>
                                    <ProgressBarLabel>
                                        <ColorSquare color="company" />
                                        Компания: {companyPercentage}%
                                    </ProgressBarLabel>
                                    <ProgressBarLabel>
                                        <ColorSquare color="investor" />
                                        Инвестор: {investorPercentage}%
                                    </ProgressBarLabel>
                                </ProgressBarLabels>
                                
                                <ProgressBar
                                    percentage={parseInt(companyPercentage) || 0}
                                    onChange={handleProgressChange}
                                    draggable={true}
                                    colors={{
                                        primary: '#007D88',
                                        secondary: '#25CBA1'
                                    }}
                                />
                            </ProgressBarContainer>
                        </PercentageSection>
                    )}
                </div>
            </BaseModal>
        </>
    );
};

// Вспомогательная функция для форматирования денег
const formatMoney = (amount: string) => {
    const num = parseInt(amount) || 0;
    return new Intl.NumberFormat('ru-RU').format(num);
};

const PercentageSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
`;

const PercentageTitle = styled.h3`
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    text-align: center;
`;

const PercentageSubtitle = styled.p`
    margin: 0;
    font-size: 14px;
    color: #666;
    text-align: center;
`;

const PercentageInputsContainer = styled.div`
    display: flex;
    gap: 16px;
    justify-content: space-between;
    
    @media (max-width: 480px) {
        flex-direction: column;
        gap: 12px;
    }
`;

const PercentageInputGroup = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const PercentageLabel = styled.label`
    font-size: 14px;
    font-weight: 500;
    color: #555;
    text-align: center;
`;

const PercentageAmount = styled.div`
    font-size: 12px;
    color: #666;
    text-align: center;
    min-height: 16px;
`;

const ProgressBarContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const ProgressBarLabels = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
`;

const ProgressBarLabel = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #666;
`;

const ColorSquare = styled.div<{ color: 'company' | 'investor' }>`
    width: 12px;
    height: 12px;
    border-radius: 2px;
    background-color: ${props => 
        props.color === 'company' ? '#007D88' : '#25CBA1'};
`;

const TotalAmountInfo = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #e9ecef;
    margin-top: 8px;
`;

const TotalLabel = styled.div`
    font-size: 14px;
    font-weight: 500;
    color: #333;
`;

const TotalAmount = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #007D88;
`;

const BalanceInfo = styled.div`
    margin: 5px 0 0 0;
    padding: 0px;
`;

const BalanceLabel = styled.div`
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
`;

const BalanceAmount = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
`;

const BalanceError = styled.div`
    font-size: 12px;
    color: #dc3545;
    font-weight: 500;
    margin-top: 4px;
`;

const BalanceSuccess = styled.div`
    font-size: 12px;
    color: #28a745;
    font-weight: 500;
    margin-top: 4px;
`;

export default IncomeModal;