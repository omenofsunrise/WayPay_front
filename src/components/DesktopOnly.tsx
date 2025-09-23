import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import logoImage from '../assets/logos/logo.svg';

export const DesktopOnlyContent = () => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <DesktopOnlyWrapper>
            <Logo src={logoImage} alt="Логотип" />
            <Title>Доступ только с компьютера</Title>
            <Description>
                К сожалению, наш сайт недоступен для использования с мобильных устройств. 
                Пожалуйста, откройте его с компьютера или ноутбука для полноценной работы.
            </Description>
            <HomeButton onClick={handleGoHome}>
                Вернуться на главную
            </HomeButton>
        </DesktopOnlyWrapper>
    );
};

const DesktopOnlyWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
    background-color: rgba(249, 250, 250, 1);
    width: 100%;
    padding: 20px;
    
    @media (max-width: 768px) {
        padding: 15px;
    }
`;

const Logo = styled.img`
    width: 120px;
    height: 120px;
    margin-bottom: 30px;
    
    @media (max-width: 768px) {
        width: 80px;
        height: 80px;
        margin-bottom: 20px;
    }
`;

const Title = styled.h1`
    font-size: 28px;
    margin-bottom: 20px;
    color: #333;
    font-weight: 600;
    
    @media (max-width: 768px) {
        font-size: 22px;
        margin-bottom: 15px;
    }
    
    @media (max-width: 480px) {
        font-size: 20px;
    }
`;

const Description = styled.p`
    font-size: 18px;
    color: #666;
    margin-bottom: 40px;
    line-height: 1.6;
    max-width: 500px;
    
    @media (max-width: 768px) {
        font-size: 16px;
        margin-bottom: 30px;
        padding: 0 10px;
    }
    
    @media (max-width: 480px) {
        font-size: 14px;
        line-height: 1.5;
    }
`;

const HomeButton = styled.button`
    background: linear-gradient(90deg, rgba(0, 125, 136, 1) 0%, rgba(37, 203, 161, 1) 100%);
    color: white;
    border: none;
    padding: 16px 32px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 125, 136, 0.3);
    }
    
    &:active {
        transform: translateY(0);
    }
    
    @media (max-width: 768px) {
        padding: 14px 28px;
        font-size: 15px;
    }
    
    @media (max-width: 480px) {
        padding: 12px 24px;
        font-size: 14px;
        width: 100%;
        max-width: 280px;
    }
`;