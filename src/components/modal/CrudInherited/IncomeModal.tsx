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
    const [formattedAmount, setFormattedAmount] = React.useState('');

    React.useEffect(() => {
        if (show) {
            setFormattedAmount(newIncome.amount ? formatMoney(newIncome.amount) : '');
        } else {
            setFormattedAmount('');
        }
    }, [show]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const rawValue = value.replace(/\D/g, '');
        setNewIncome(prev => ({...prev, amount: rawValue}));
        setFormattedAmount(formatMoney(rawValue));
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
            setFormattedAmount('');
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
                title="Добавить доход"
                onClose={onClose}
                onCancel={onClose}
                onSave={handleSave}
                isSaveDisabled={!newIncome.amount || !newIncome.investorId}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
                    <CustomInput
                        type="text"
                        value={formattedAmount}
                        onChange={handleAmountChange}
                        placeholder="Введите сумму"
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
                        <ViewButton 
                            onClick={() => currentInvestor && setIsViewInvestorModalOpen(true)} 
                            disabled={!currentInvestor} 
                        />
                    </div>
                    <CustomInput
                        value={newIncome.comment}
                        onChange={(e) => setNewIncome({...newIncome, comment: e.target.value})}
                        placeholder="Введите комментарий"
                    />
                </div>
            </BaseModal>

            <InvestorSelectModal
                isOpen={isInvestorModalOpen}
                onClose={() => setIsInvestorModalOpen(false)}
                onSubmit={handleSelectInvestor}
            />

            {currentInvestor && (
                <InvestorModal
                    mode="view"
                    isOpen={isViewInvestorModalOpen}
                    onClose={() => setIsViewInvestorModalOpen(false)}
                    onSubmit={async () => false}
                    initialData={{
                        id: currentInvestor.id,
                        nickname: currentInvestor.nickname,
                        fullName: currentInvestor.fullName,
                        phoneNumber: currentInvestor.phoneNumber,
                        investorPie: currentInvestor.investorPie,
                        investmentAmount: currentInvestor.investmentAmount,
                        balance: currentInvestor.balance,
                        isCompany: false,
                        isBlocked: false
                    }}
                />
            )}
        </>
    );
};

export default IncomeModal;