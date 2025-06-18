import React from 'react';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import { formatMoney } from '../../../utils/formatPrice';

interface OutcomeModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => Promise<boolean> | void;
    newOutcome: {
        amount: string;
        comment: string;
    };
    setNewOutcome: React.Dispatch<React.SetStateAction<{
        amount: string;
        comment: string;
    }>>;
}

const OutcomeModal: React.FC<OutcomeModalProps> = ({
    show,
    onClose,
    onSave,
    newOutcome,
    setNewOutcome
}) => {
    const [formattedAmount, setFormattedAmount] = React.useState('');

    React.useEffect(() => {
        if (show) {
            setFormattedAmount(newOutcome.amount ? formatMoney(newOutcome.amount) : '');
        } else {
            setFormattedAmount('');
        }
    }, [show]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const rawValue = value.replace(/\D/g, '');
        setNewOutcome(prev => ({...prev, amount: rawValue}));
        setFormattedAmount(formatMoney(rawValue));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newOutcome.amount) {
            alert('Пожалуйста, укажите сумму');
            return;
        }

        try {
            await onSave(e);
            // Reset after successful save
            setNewOutcome({ amount: '', comment: '' });
            setFormattedAmount('');
        } catch (error) {
            console.error('Ошибка при сохранении:', error);
        }
    };

    if (!show) return null;

    return (
        <BaseModal
            title="Добавить расход"
            onClose={onClose}
            onCancel={onClose}
            onSave={handleSave}
            isSaveDisabled={!newOutcome.amount}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
                <CustomInput
                    type="text"
                    value={formattedAmount}
                    onChange={handleAmountChange}
                    placeholder="Введите сумму"
                    required
                />
                <CustomInput
                    value={newOutcome.comment}
                    onChange={(e) => setNewOutcome({...newOutcome, comment: e.target.value})}
                    placeholder="Введите комментарий"
                />
            </div>
        </BaseModal>
    );
};

export default OutcomeModal;