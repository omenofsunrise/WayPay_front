import React, { useState } from 'react';
import styled from 'styled-components';
import BaseModal from './BASE/modalCRUBase';

interface AuthCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    callPhone: string;
    isVerifying: boolean;
    error?: string;
}

const AuthCallModal: React.FC<AuthCallModalProps> = ({ 
    isOpen, 
    onClose, 
    callPhone, 
    isVerifying,
    error 
}) => {
    const [isCopied, setIsCopied] = useState(false);
    
    if (!isOpen) return null;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    const handlePhoneClick = () => {
        if (isMobile) {
            window.location.href = `tel:${callPhone}`;
        } else {
            navigator.clipboard.writeText(callPhone);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            title="Подтверждение авторизации"
            subtitle="Подтвердите вход звонком с вашего номера"
            appearance="compact-form"
            width="500px"
            onClose={onClose}
            onCancel={onClose}
            hideSaveButton
            hideCanselButton
        >
            <ModalContent>
                <ModalText>
                    Для завершения авторизации позвоните на номер:
                </ModalText>
                <CallPhoneNumber 
                    onClick={handlePhoneClick}
                    title={isMobile ? "Позвонить" : "Копировать номер"}
                    $clickable
                >
                    {callPhone}
                    {!isMobile && isCopied && <CopiedText>Скопировано!</CopiedText>}
                </CallPhoneNumber>
                <ModalText>
                    После звонка система автоматически подтвердит вашу авторизацию.
                </ModalText>
                {isVerifying && <StatusText>Ожидаем подтверждение звонка…</StatusText>}
                {error && <ErrorText>{error}</ErrorText>}
            </ModalContent>
        </BaseModal>
    );
};

const ModalContent = styled.div`
    padding: 6px 34px 28px;
    text-align: left;
`;

const ModalText = styled.p`
    margin-bottom: 15px;
    color: #555;
`;

const CallPhoneNumber = styled.div<{ $clickable?: boolean }>`
    font-size: 24px;
    font-weight: bold;
    margin: 18px 0 28px;
    color: rgba(0, 125, 136, 1);
    position: relative;
    cursor: ${props => props.$clickable ? 'pointer' : 'default'};
    transition: all 0.2s;
    
    ${props => props.$clickable && `
        &:hover {
            color: rgba(0, 100, 120, 1);
            text-decoration: underline;
        }
        &:active {
            transform: scale(0.98);
        }
    `}
`;

const CopiedText = styled.span`
    position: absolute;
    bottom: -25px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 14px;
    color: #27ae60;
    font-weight: normal;
    white-space: nowrap;
`;

const StatusText = styled.div`
    margin-top: 16px;
    color: #07818a;
    font-size: 14px;
`;

const ErrorText = styled.div`
    color: #e74c3c;
    margin: 10px 0;
`;

export default AuthCallModal;
