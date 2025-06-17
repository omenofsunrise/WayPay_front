import React from 'react';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';

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
}

const IncomeModal: React.FC<IncomeModalProps> = ({
    show,
    onClose,
    onSave,
    newIncome,
    setNewIncome
}) => {
    if (!show) return null;

    return (
        <BaseModal
            title="Добавить доход"
            onClose={onClose}
            onCancel={onClose}
            onSave={onSave}
            isSaveDisabled={!newIncome.amount || !newIncome.investorId}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
                <CustomInput
                    type="rubles"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome({...newIncome, amount: e.target.value})}
                    placeholder="Введите сумму"
                    required
                />
                <CustomInput
                    type="number"
                    value={newIncome.investorId}
                    onChange={(e) => setNewIncome({...newIncome, investorId: e.target.value})}
                    placeholder="Введите ID инвестора"
                    required
                />
                <CustomInput
                    value={newIncome.comment}
                    onChange={(e) => setNewIncome({...newIncome, comment: e.target.value})}
                    placeholder="Введите комментарий"
                />
            </div>
        </BaseModal>
    );
};

export default IncomeModal;