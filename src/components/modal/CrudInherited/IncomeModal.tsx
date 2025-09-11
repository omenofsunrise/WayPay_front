import React from 'react';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import ViewButton from '../../ui/Buttons/ViewButton';
import EntitySelectContainer from '../../ui/Layouts/EntitySelectContainer';
import InvestorModal from './InvestorModal';
import InvestorSelectModal from './InvestorSelectModal';
import { formatMoney, parseMoney } from '../../../utils/formatPrice';

interface Investor {
  id: number;
  nickname: string;
  fullName: string;
  phoneNumber: string;
  investorPie: number;
  investmentAmount: number;
  balance: number;
}

interface IncomeModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    newIncome: {
        amount: string;
        comment: string;
        investorId: string;
    };
    setNewIncome: React.Dispatch<React.SetStateAction<{
        amount: string;
        comment: string;
        investorId: string;
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
    const [isViewInvestorModalOpen, setIsViewInvestorModalOpen] = React.useState(false);
    const [selectedInvestor, setSelectedInvestor] = React.useState<Investor | null>(null);
    const [displayAmount, setDisplayAmount] = React.useState('');

    React.useEffect(() => {
        if (show) {
            // При открытии модального окна форматируем сумму для отображения
            const numericValue = newIncome.amount.replace(/\D/g, '');
            if (numericValue) {
                const formatted = new Intl.NumberFormat('ru-RU').format(parseInt(numericValue, 10));
                setDisplayAmount(formatted);
            } else {
                setDisplayAmount('');
            }
        } else {
            setDisplayAmount('');
        }
    }, [show, newIncome.amount]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        
        // Удаляем все нецифровые символы, кроме запятых и точек (для разделителей тысяч)
        const cleanedValue = value.replace(/[^\d,.]/g, '');
        
        // Удаляем все разделители тысяч, чтобы получить чистое число
        const numericValue = cleanedValue.replace(/[.,]/g, '');
        
        // Сохраняем числовое значение в состоянии
        setNewIncome(prev => ({...prev, amount: numericValue}));
        
        // Форматируем значение для отображения с разделителями тысяч
        if (numericValue) {
            const formatted = new Intl.NumberFormat('ru-RU').format(parseInt(numericValue, 10));
            setDisplayAmount(formatted);
        } else {
            setDisplayAmount('');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newIncome.amount || !newIncome.investorId) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }

        try {
            await onSave(e);
            setNewIncome({ amount: '', comment: '', investorId: '' });
            setSelectedInvestor(null);
            setDisplayAmount('');
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

    if (!show) return null;

    return (
        <>
            <BaseModal
                title="Добавить приход"
                onClose={onClose}
                onCancel={onClose}
                onSave={handleSave}
                isSaveDisabled={!newIncome.amount || !newIncome.investorId}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
                    <CustomInput
                        type="text"
                        value={displayAmount}
                        onChange={handleAmountChange}
                        placeholder="Введите сумму"
                        inputType="text" // Используем обычный текст вместо rubles
                        required
                    />
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

export default IncomeModal;