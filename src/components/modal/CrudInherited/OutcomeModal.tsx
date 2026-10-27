import React from 'react';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import styled from 'styled-components';

const FinanceFormContent = styled.div`
    padding: 6px 34px 24px;
    text-align: left;

    @media (max-width: 600px) {
        padding: 4px 18px 20px;
    }
`;

const FinanceSection = styled.section`
    width: 100%;
    margin-top: 8px;
    box-sizing: border-box;
`;

const FinanceSectionTitle = styled.h3`
    margin: 0 0 16px;
    color: #07818a;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.3;
    text-align: left;
`;

const FinanceFields = styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
`;

const FinanceField = styled.label`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 7px;
    color: #192438;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.3;
    text-align: left;
`;

const FinanceControl = styled.div`
    min-width: 0;

    > div {
        width: 100%;
        max-width: none;
        margin: 0;
    }

    input {
        width: 100%;
        max-width: none;
        min-height: 40px;
        padding: 7px 13px;
        box-sizing: border-box;
        color: #172235;
        font-size: 14px;
        background: #fff;
        border-color: #c7d2de;
        border-radius: 7px;
    }
`;

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
            subtitle="Укажите сумму и назначение операции"
            appearance="compact-form"
            width="680px"
            maxHeight="calc(100vh - 32px)"
            cancelButtonText="Отмена"
            saveButtonText="Добавить расход"
            onClose={onClose}
            onCancel={onClose}
            onSave={handleSave}
            isSaveDisabled={!newOutcome.amount}
        >
            <FinanceFormContent>
                <FinanceSection>
                    <FinanceSectionTitle>Основная информация</FinanceSectionTitle>
                    <FinanceFields>
                        <FinanceField>
                            Сумма
                            <FinanceControl>
                                <CustomInput
                                    type="text"
                                    value={displayAmount}
                                    onChange={handleAmountChange}
                                    placeholder="Введите сумму"
                                    inputType="text"
                                    required
                                />
                            </FinanceControl>
                        </FinanceField>

                        <FinanceField>
                            Комментарий
                            <FinanceControl>
                                <CustomInput
                                    value={newOutcome.comment}
                                    onChange={(e) => setNewOutcome({...newOutcome, comment: e.target.value})}
                                    placeholder="Введите комментарий"
                                />
                            </FinanceControl>
                        </FinanceField>
                    </FinanceFields>
                </FinanceSection>
            </FinanceFormContent>
        </BaseModal>
    );
};

export default OutcomeModal;
