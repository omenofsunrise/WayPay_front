import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface AuthWhatsAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (code: string) => void;
    phone: string;
    isVerifying: boolean;
    error?: string;
}

const AuthWhatsAppModal: React.FC<AuthWhatsAppModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    phone,
    isVerifying,
    error,
}) => {
    const [code, setCode] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setCode('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setCode(value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || isVerifying) return;
        onSubmit(code);
    };

    return (
        <ModalOverlay onMouseDown={onClose}>
            <ModalContent onMouseDown={(e) => e.stopPropagation()}>
                <ModalTitle>Подтверждение по WhatsApp</ModalTitle>
                <ModalText>
                    Мы отправили код в WhatsApp на номер:
                </ModalText>
                <PhoneNumber>{phone}</PhoneNumber>
                <ModalText>
                    Введите полученный код, чтобы завершить авторизацию.
                </ModalText>

                <Form onSubmit={handleSubmit}>
                    <CodeInput
                        ref={inputRef}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Код из WhatsApp"
                        value={code}
                        onChange={handleChange}
                        disabled={isVerifying}
                    />

                    {error && <ErrorText>{error}</ErrorText>}

                    <SubmitButton type="submit" disabled={!code || isVerifying}>
                        {isVerifying ? 'Проверка…' : 'Подтвердить'}
                    </SubmitButton>
                </Form>
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

const PhoneNumber = styled.div`
    font-size: 22px;
    font-weight: bold;
    margin: 16px 0;
    color: rgba(0, 125, 136, 1);
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 20px;
`;

const CodeInput = styled.input`
    width: 100%;
    padding: 14px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 20px;
    text-align: center;
    letter-spacing: 4px;
    transition: border-color 0.2s;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: rgba(0, 125, 136, 1);
    }

    &:disabled {
        background: #f5f5f5;
    }
`;

const ErrorText = styled.div`
    color: #e74c3c;
    font-size: 14px;
`;

const SubmitButton = styled.button`
    background: linear-gradient(90deg, rgba(0, 125, 136, 1) 0%, rgba(37, 203, 161, 1) 100%);
    color: white;
    border: none;
    padding: 14px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 125, 136, 0.3);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

export default AuthWhatsAppModal;
