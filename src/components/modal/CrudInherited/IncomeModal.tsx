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

interface IncomeModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    newIncome: {
        amount: string;
        comment: string;
        investorId: string;
        companyShare: number;
    };
    setNewIncome: React.Dispatch<React.SetStateAction<{
        amount: string;
        comment: string;
        investorId: string;
        companyShare: number;
    }>>;
    investors: Investor[];
}

const IncomeModal: React.FC<IncomeModalProps> = ({
    show,
    onClose,
    onSave,
    newIncome,
    setNewIncome,
    investors
}) => {
    const [isInvestorModalOpen, setIsInvestorModalOpen] = React.useState(false);
    const [selectedInvestor, setSelectedInvestor] = React.useState<Investor | null>(null);
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
            
            setCompanyPercentage(newIncome.companyShare.toString());
            setInvestorPercentage((100 - newIncome.companyShare).toString());
        } else {
            setDisplayAmount('');
            setCompanyPercentage('100');
            setInvestorPercentage('0');
        }
    }, [show, newIncome.amount, newIncome.companyShare]);

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
        setCompanyPercentage(percentage.toString());
        setInvestorPercentage((100 - percentage).toString());
        setNewIncome(prev => ({...prev, companyShare: percentage}));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newIncome.amount || !newIncome.investorId) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }

        // Проверка баланса
        const amountNumber = parseInt(newIncome.amount, 10);
        if (currentInvestor && amountNumber > currentInvestor.balance) {
            alert(`Нельзя вывести больше доступного баланса. Доступно: ${new Intl.NumberFormat('ru-RU').format(currentInvestor.balance)} руб.`);
            return;
        }

        const isCompanyInvestor = currentInvestor?.isCompany;
        if (isCompanyInvestor) {
            setNewIncome(prev => ({...prev, companyShare: 100}));
        }

        try {
            await onSave(e);
            setNewIncome({ amount: '', comment: '', investorId: '', companyShare: 100 });
            setSelectedInvestor(null);
            setDisplayAmount('');
            setCompanyPercentage('100');
            setInvestorPercentage('0');
        } catch (error) {
            console.error('Ошибка при сохранении:', error);
        }
    };

    const handleSelectInvestor = (investor: Investor) => {
        setSelectedInvestor(investor);
        setNewIncome(prev => ({...prev, investorId: investor.id.toString()}));
        setIsInvestorModalOpen(false);
    };

    const currentInvestor = selectedInvestor || investors.find(i => i.id.toString() === newIncome.investorId);
    
    const isCompanyInvestor = currentInvestor?.isCompany;

    // Проверка превышения баланса
    const amountNumber = parseInt(newIncome.amount, 10) || 0;
    const isAmountExceedingBalance = currentInvestor && amountNumber > currentInvestor.balance;

    if (!show) return null;

    return (
        <>
            <BaseModal
                title="Добавить приход"
                onClose={onClose}
                onCancel={onClose}
                onSave={handleSave}
                isSaveDisabled={!newIncome.amount || !newIncome.investorId || isAmountExceedingBalance}
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
                        
                        {currentInvestor && (
                            <BalanceInfo>
                                <BalanceLabel>Доступно для вывода:</BalanceLabel>
                                <BalanceAmount>
                                    {new Intl.NumberFormat('ru-RU').format(currentInvestor.balance)} руб.
                                </BalanceAmount>
                                {isAmountExceedingBalance && (
                                    <BalanceError>
                                        Превышена касса на {new Intl.NumberFormat('ru-RU').format(amountNumber - currentInvestor.balance)} руб.
                                    </BalanceError>
                                )}
                                {!isAmountExceedingBalance && amountNumber > 0 && (
                                    <BalanceSuccess>
                                        Можно вывести ещё {new Intl.NumberFormat('ru-RU').format(currentInvestor.balance - amountNumber)} руб.
                                    </BalanceSuccess>
                                )}
                            </BalanceInfo>
                        )}
                    </div>
                    
                    <div style={{ margin: "0 10px", display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <EntitySelectContainer
                            mode="create"
                            primaryValue={currentInvestor?.fullName || currentInvestor?.nickname || ''}
                            secondaryValue={currentInvestor?.phoneNumber}
                            placeholder="Выберите инвестора"
                            onSelect={() => setIsInvestorModalOpen(true)}
                            onClear={() => {
                                setSelectedInvestor(null);
                                setNewIncome(prev => ({...prev, investorId: ''}));
                            }}
                        />
                    </div>

                    {!isCompanyInvestor && (
                        <PercentageSection>
                            <PercentageTitle>Распределение</PercentageTitle>
                            
                            <PercentageInputsContainer>
                                <PercentageInputGroup>
                                    <PercentageLabel>Компания</PercentageLabel>
                                    <CustomInput
                                        type="text"
                                        value={companyPercentage}
                                        onChange={handleCompanyPercentageChange}
                                        placeholder="0"
                                        inputType="text"
                                    />
                                </PercentageInputGroup>
                                
                                <PercentageInputGroup>
                                    <PercentageLabel>Инвестор</PercentageLabel>
                                    <CustomInput
                                        type="text"
                                        value={investorPercentage}
                                        onChange={handleInvestorPercentageChange}
                                        placeholder="0"
                                        inputType="text"
                                    />
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

            <InvestorSelectModal
                isOpen={isInvestorModalOpen}
                onClose={() => setIsInvestorModalOpen(false)}
                onSubmit={handleSelectInvestor}
            />
        </>
    );
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