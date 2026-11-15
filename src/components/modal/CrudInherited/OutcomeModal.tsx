import React from 'react';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';

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
    const [displayAmount, setDisplayAmount] = React.useState('');

    React.useEffect(() => {
        if (show) {
            // При открытии модального окна форматируем сумму для отображения
            const numericValue = newOutcome.amount.replace(/\D/g, '');
            if (numericValue) {
                const formatted = new Intl.NumberFormat('ru-RU').format(parseInt(numericValue, 10));
                setDisplayAmount(formatted);
            } else {
                setDisplayAmount('');
            }
        } else {
            setDisplayAmount('');
        }
    }, [show, newOutcome.amount]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        
        // Удаляем все нецифровые символы, кроме запятых и точек (для разделителей тысяч)
        const cleanedValue = value.replace(/[^\d,.]/g, '');
        
        // Удаляем все разделители тысяч, чтобы получить чистое число
        const numericValue = cleanedValue.replace(/[.,]/g, '');
        
        // Сохраняем числовое значение в состоянии
        setNewOutcome(prev => ({...prev, amount: numericValue}));
        
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
        
        if (!newOutcome.amount) {
            alert('Пожалуйста, укажите сумму');
            return;
        }

        try {
            await onSave(e);
            setNewOutcome({ amount: '', comment: '' });
            setDisplayAmount('');
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
                    value={displayAmount}
                    onChange={handleAmountChange}
                    placeholder="Введите сумму"
                    inputType="text" // Используем обычный текст вместо rubles
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