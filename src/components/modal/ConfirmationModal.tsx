import React from 'react';
import styled from 'styled-components';
import DarkCyanButton from '../ui/Buttons/DarkCyanButton';
import GrayButton from '../ui/Buttons/GrayButton';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    /** Без этого текста кнопка отмены не рисуется: окно становится
     *  сообщением с одной кнопкой, годным для показа ошибки. */
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmColor?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    confirmColor
}) => {
    if (!isOpen) return null;

    return (
        <ModalOverlay>
            <ModalContainer>
                <ModalHeader>{title}</ModalHeader>
                <ModalBody>
                    <Message>{message}</Message>
                </ModalBody>
                <ModalFooter>
                    {cancelText && (
                        <GrayButton 
                            onClick={onCancel}
                        >
                            {cancelText}
                        </GrayButton>
                    )}
                    <DarkCyanButton 
                        onClick={onConfirm}
                    >
                        {confirmText}
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

const ModalFooter = styled.div`
    padding: 16px 24px;
    border-top: 1px solid #e5e5e5;
    display: flex;
    justify-content: flex-end;
`;

export default ConfirmModal;