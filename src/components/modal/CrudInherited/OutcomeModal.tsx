import React from 'react';
import CustomInput from '../../ui/fields/CustomInput';
import BaseModal from '../BASE/modalCRUBase';

interface OutcomeModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
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
    if (!show) return null;

    return (
        <BaseModal
            title="Добавить расход"
            onClose={onClose}
            onCancel={onClose}
            onSave={onSave}
            isSaveDisabled={!newOutcome.amount}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
                <CustomInput
                    type="rubles"
                    value={newOutcome.amount}
                    onChange={(e) => setNewOutcome({...newOutcome, amount: e.target.value})}
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