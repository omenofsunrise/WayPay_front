import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import BaseModal from './BASE/modalCRUBase';

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
        <BaseModal
            isOpen={isOpen}
            title="Подтверждение по WhatsApp"
            subtitle="Введите код, отправленный на ваш номер"
            appearance="compact-form"
            width="500px"
            onClose={onClose}
            onCancel={onClose}
            onSave={handleSubmit}
            saveButtonText="Подтвердить"
            cancelButtonText="Отмена"
            isSaveDisabled={!code}
            isSubmitting={isVerifying}
            submittingText="Проверка…"
        >
            <ModalContent>
                <ModalText>
                    Мы отправили код в WhatsApp на номер:
                </ModalText>
                <PhoneNumber>{phone}</PhoneNumber>
                <ModalText>
                    Введите полученный код, чтобы завершить авторизацию.
                </ModalText>

                <Form>
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

                </Form>
            </ModalContent>
        </BaseModal>
    );
};

const ModalContent = styled.div`
    padding: 6px 34px 24px;
    text-align: left;
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

const Form = styled.div`
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

export default AuthWhatsAppModal;
