import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import apiClient from '../api/client';
import { authStorage } from '../api/utils/auth-storage';
import logoImage from '../assets/logos/logo.svg';
import CustomPhoneInput from '../components/ui/fields/PhoneInput';
import AuthCallModal from '../components/modal/AuthCallModal';
import PinCodeModal from '../components/modal/PinCodeModal';

interface AuthPageProps {
  onLoginSuccess: (token: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [rawPhone, setRawPhone] = useState('');
    const [showCallModal, setShowCallModal] = useState(false);
    const [callPhone, setCallPhone] = useState('');
    const [checkId, setCheckId] = useState('');
    const [verificationError, setVerificationError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const verificationInterval = useRef<number | undefined>(undefined);
    const [showPinModal, setShowPinModal] = useState(false);
    const [authCompleted, setAuthCompleted] = useState(false);

    useEffect(() => {
        return () => {
            if (verificationInterval.current) {
                clearInterval(verificationInterval.current);
            }
        };
    }, []);

    const closeModal = () => {
        setShowCallModal(false);
        if (verificationInterval.current) {
            window.clearInterval(verificationInterval.current);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rawPhone) return;
        
        setIsLoading(true);
        try {
            const response = await apiClient.post('/Auth/start', {
                phone: rawPhone,
                userType: 'employee',
            });
            
            setCheckId(response.data.checkId);
            setCallPhone(response.data.callPhone);
            setShowCallModal(true);
            startVerificationPolling(rawPhone, response.data.checkId);
        } catch (error: any) {
            console.error('Auth error:', error);
            if (error.response?.status === 400) {
                alert(error.response.data);
            } else {
                alert('Произошла ошибка при авторизации');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const startVerificationPolling = (phone: string, id: string) => {
        if (verificationInterval.current) {
            window.clearInterval(verificationInterval.current);
        }
        
        verificationInterval.current = window.setInterval(() => {
            verifyAuth(phone, id);
        }, 3000);
    };
    
    const verifyAuth = async (phone: string, id: string) => {
        if (isVerifying) return;
        
        setIsVerifying(true);
        try {
            const response = await apiClient.post('/Auth/confirm', {
                phone: phone,
                checkId: id,
                userType: 'employee'
            });
            
            if (response.data.accessToken && response.data.refreshToken) {
                authStorage.setTokens(response.data.accessToken, response.data.refreshToken);
                
                if (verificationInterval.current) {
                    window.clearInterval(verificationInterval.current);
                }
                setShowCallModal(false);
                
                setShowPinModal(true);
            }
        } catch (error) {
            console.error('Verification error:', error);
            setVerificationError('Ошибка проверки авторизации');
        } finally {
            setIsVerifying(false);
        }
    };

    const handlePinSuccess = () => {
        setShowPinModal(false);
        setAuthCompleted(true);
        onLoginSuccess(authStorage.getAccessToken()!);
        window.location.href = '/credits';
    };
    
    return (
        <AuthContainer>
            <AuthCard>
                <Logo>
                    <LogoImage src={logoImage} alt="WayPay Logo" />
                </Logo>

                <AuthForm onSubmit={handleSubmit}>
                    <Title>Авторизация</Title>

                    <FormGroup>
                        <InputContainer>
                            <CustomPhoneInput 
                                value={rawPhone}
                                onChange={(value: string) => setRawPhone(value)}
                                placeholder="8 (xxx) xxx-xx-xx"
                            />
                        </InputContainer>
                    </FormGroup>

                    <SubmitButton type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <Loader>
                                <LoaderCircle />
                                <LoaderCircle />
                                <LoaderCircle />
                            </Loader>
                        ) : (
                            'Войти'
                        )}
                    </SubmitButton>
                </AuthForm>
                <InfoText>
                    Хотите получить доступ к нашим продуктам?<br />
                    Обратитесь по номеру <InfoPhone href="tel:89899242424">8 989 924 24 24</InfoPhone><br />
                    или оставьте заявку на <InfoLink href="https://waypay.one" target="_blank">waypay.one</InfoLink>
                </InfoText>
            </AuthCard>

            <AuthCallModal
                isOpen={showCallModal}
                onClose={closeModal}
                callPhone={callPhone}
                isVerifying={isVerifying}
                error={verificationError}
            />

            <PinCodeModal 
                isOpen={showPinModal}
                onSuccess={handlePinSuccess}
                mode='setup'
            />

        </AuthContainer>
    );
};

const InfoText = styled.div`
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
    text-align: center;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
`;

const InfoPhone = styled.a`
    color: rgba(0, 125, 136, 1);
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
        text-decoration: underline;
    }
`;

const InfoLink = styled.a`
    color: rgba(0, 125, 136, 1);
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
        text-decoration: underline;
    }
`;

const AuthContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 90vh;
    padding: 20px;
`;

const AuthCard = styled.div`
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 125, 136, 0.1);
    width: 100%;
    max-width: 440px;
    padding: 40px;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, rgba(0, 125, 136, 1) 0%, rgba(37, 203, 161, 1) 100%);
    }

    @media (max-width: 480px) {
        padding: 30px 20px;
    }
`;

const Logo = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 0;
`;

const LogoImage = styled.img`
    height: 100px;
    width: auto;

    @media (max-width: 480px) {
        height: 40px;
    }
`;

const AuthForm = styled.form`
    display: flex;
    flex-direction: column;
`;

const Title = styled.h1`
    font-size: 24px;
    margin-bottom: 30px;
    text-align: center;
    color: #333;
    font-weight: 600;
`;

const FormGroup = styled.div`
    margin-bottom: 25px;
`;

const InputContainer = styled.div`
    position: relative;
    width: auto;
`;

const RadioGroup = styled.div`
    display: flex;
    gap: 15px;
    margin-bottom: 30px;

    @media (max-width: 480px) {
        flex-direction: column;
    }
`;

const RadioOption = styled.div<{ active?: boolean }>`
    flex: 1;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid ${props => props.active ? 'rgba(0, 125, 136, 0.3)' : '#e0e0e0'};
    background: ${props => props.active ? 'rgba(0, 125, 136, 0.05)' : 'transparent'};
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: rgba(0, 125, 136, 0.5);
    }
`;

const RadioInput = styled.input`
    display: none;
`;

const RadioLabel = styled.label`
    display: block;
    font-size: 14px;
    color: #555;
    cursor: pointer;
    text-align: center;
`;

const SubmitButton = styled.button`
    background: linear-gradient(90deg, rgba(0, 125, 136, 1) 0%, rgba(37, 203, 161, 1) 100%);
    color: white;
    border: none;
    padding: 16px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 125, 136, 0.3);
    }
    
    &:active {
        transform: translateY(0);
    }
    
    &:disabled {
        background: linear-gradient(90deg, rgba(0, 125, 136, 0.5) 0%, rgba(37, 203, 161, 0.5) 100%);
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
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
    background: white;
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

export default AuthPage;