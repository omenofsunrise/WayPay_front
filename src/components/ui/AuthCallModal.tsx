import React from 'react';
import styled from 'styled-components';

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
    if (!isOpen) return null;

    return (
        <ModalOverlay>
            <ModalContent>
                <ModalTitle>Подтверждение авторизации</ModalTitle>
                <ModalText>
                    Для завершения авторизации позвоните на номер:
                </ModalText>
                <CallPhoneNumber>{callPhone}</CallPhoneNumber>
                <ModalText>
                    После звонка система автоматически подтвердит вашу авторизацию.
                </ModalText>
                
                {isVerifying && (
                    <VerificationStatus>
                        <Loader>
                            <LoaderCircle />
                            <LoaderCircle />
                            <LoaderCircle />
                        </Loader>
                        Проверяем статус...
                    </VerificationStatus>
                )}
                
                {error && (
                    <ErrorText>{error}</ErrorText>
                )}
                
                <ModalButton onClick={onClose}>Закрыть</ModalButton>
            </ModalContent>
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

const ModalContent = styled.div`
    background: white;
    padding: 30px;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    text-align: center;
`;

const ModalTitle = styled.h2`
    font-size: 20px;
    margin-bottom: 20px;
    color: #333;
`;

const ModalText = styled.p`
    margin-bottom: 15px;
    color: #555;
`;

const CallPhoneNumber = styled.div`
    font-size: 24px;
    font-weight: bold;
    margin: 20px 0;
    color: rgba(0, 125, 136, 1);
`;

const VerificationStatus = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 20px 0;
    color: #555;
`;

const Loader = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    height: 24px;
`;

const LoaderCircle = styled.div`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(0, 125, 136, 1);
    animation: bounce 1s infinite ease-in-out;
    
    &:nth-child(1) {
        animation-delay: 0s;
    }
    &:nth-child(2) {
        animation-delay: 0.2s;
    }
    &:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes bounce {
        0%, 100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-6px);
        }
    }
`;

const ErrorText = styled.div`
    color: #e74c3c;
    margin: 10px 0;
`;

const ModalButton = styled.button`
    background: rgba(0, 125, 136, 1);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 20px;
    transition: background 0.3s;
    
    &:hover {
        background: rgba(0, 100, 120, 1);
    }
`;

export default AuthCallModal;