import React from 'react';
import styled from 'styled-components';
import DarkCyanButton from '../ui/Buttons/DarkCyanButton';
import GrayButton from '../ui/Buttons/GrayButton';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
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

    return (
        <ModalOverlay role="presentation">
            <ModalContainer role="dialog" aria-modal="true" aria-labelledby="confirmation-modal-title">
                <ModalHeader id="confirmation-modal-title">{title}</ModalHeader>
                <ModalBody>
                    <Message>{message}</Message>
                    {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
                </ModalBody>
                <ModalFooter>
                    <GrayButton 
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </GrayButton>
                    <DarkCyanButton 
                        onClick={onConfirm}
                        disabled={isLoading}
                        style={confirmColor ? { backgroundColor: confirmColor } : undefined}
                    >
                        {isLoading ? "Удаление..." : confirmText}
                    </DarkCyanButton>
                </ModalFooter>
            </ModalContainer>
        </ModalOverlay>
    );
};

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContainer = styled.div`
    background-color: white;
    border-radius: 8px;
    width: 500px;
    max-width: 90%;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
    padding: 20px 24px;
    border-bottom: 1px solid #e5e5e5;
    font-size: 18px;
    font-weight: 600;
    color: #333;
`;

const ModalBody = styled.div`
    padding: 24px;
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

const ModalFooter = styled.div`
    padding: 16px 24px;
    border-top: 1px solid #e5e5e5;
    display: flex;
    justify-content: flex-end;
`;

export default ConfirmModal;
