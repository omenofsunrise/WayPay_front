import React from 'react';
import styled from 'styled-components';
import BaseModal from './BASE/modalCRUBase';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    /** Без этого текста кнопка отмены не рисуется: окно становится
     *  сообщением с одной кнопкой, годным для показа ошибки. */
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    confirmColor?: string;
    isLoading?: boolean;
    error?: string | null;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    confirmColor,
    isLoading = false,
    error
}) => {
    if (!isOpen) return null;

    const handleClose = onCancel ?? (() => { void onConfirm(); });
    const handleConfirm = (event: React.FormEvent) => {
        event.preventDefault();
        void onConfirm();
    };

    return (
        <BaseModal
            isOpen={isOpen}
            title={title}
            appearance="compact-form"
            width="500px"
            onClose={handleClose}
            onCancel={handleClose}
            onSave={handleConfirm}
            hideCanselButton={!cancelText}
            cancelButtonText={cancelText}
            saveButtonText={confirmText}
            isSubmitting={isLoading}
            submittingText="Удаление..."
            saveButtonStyle={confirmColor ? { backgroundColor: confirmColor } : undefined}
        >
            <ModalBody>
                <Message>{message}</Message>
                {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
            </ModalBody>
        </BaseModal>
    );
};

const ModalBody = styled.div`
    padding: 6px 34px 24px;
    text-align: left;
`;

const Message = styled.p`
    margin: 0;
    color: #555;
    line-height: 1.5;
    font-size: 16px;
`;

const ErrorMessage = styled.div`
    margin-top: 16px;
    padding: 10px 12px;
    border: 1px solid #fecaca;
    border-radius: 6px;
    background: #fef2f2;
    color: #b91c1c;
    font-size: 13px;
    line-height: 1.45;
`;

export default ConfirmModal;
