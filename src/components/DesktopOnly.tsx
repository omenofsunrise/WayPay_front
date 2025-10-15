import styled from 'styled-components';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import logoImage from '../assets/logos/logo.svg';

const DesktopOnlyContentInner = () => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <DesktopOnlyWrapper>
            <ContentContainer>
                <Logo src={logoImage} alt="Логотип" />
                <Title>Доступ только с компьютера</Title>
                <Description>
                    К сожалению, наш сайт недоступен для использования с мобильных устройств. 
                    Пожалуйста, откройте его с компьютера, ноутбука или планшета для полноценной работы.
                </Description>
            </ContentContainer>
        </DesktopOnlyWrapper>
    );
};

export const DesktopOnlyContent = () => {
    return (
        <BrowserRouter>
            <DesktopOnlyContentInner />
        </BrowserRouter>
    );
};

const DesktopOnlyWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    background-color: rgba(249, 250, 250, 1);
    width: auto;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    min-width: 0;

    @media (max-width: 768px) {
        justify-content: flex-start;
        padding-top: 40px;
    }
    
    @media (max-width: 480px) {
        padding-top: 30px;
    }
`;

const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 200px;
    width: 100%;
    margin: 0;
`;

const Logo = styled.img`
    width: 120px;
    height: 120px;
    margin-bottom: 30px;
    
    @media (max-width: 768px) {
        width: 100px;
        height: 100px;
        margin-bottom: 25px;
    }
    
    @media (max-width: 480px) {
        width: 80px;
        height: 80px;
        margin-bottom: 20px;
    }
    
    @media (max-width: 360px) {
        width: 70px;
        height: 70px;
        margin-bottom: 15px;
    }
`;

const Title = styled.h1`
    font-size: 28px;
    margin-bottom: 20px;
    color: #333;
    font-weight: 600;
    line-height: 1.3;
    
    @media (max-width: 768px) {
        font-size: 24px;
        margin-bottom: 18px;
    }
    
    @media (max-width: 480px) {
        font-size: 22px;
        margin-bottom: 16px;
        padding: 0 10px;
    }
    
    @media (max-width: 360px) {
        font-size: 20px;
        margin-bottom: 14px;
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
        margin-bottom: 35px;
        padding: 0 15px;
        line-height: 1.5;
    }
    
    @media (max-width: 480px) {
        font-size: 15px;
        margin-bottom: 30px;
        padding: 0 10px;
        line-height: 1.4;
    }
    
    @media (max-width: 360px) {
        font-size: 14px;
        margin-bottom: 25px;
    }
`;

const HomeButton = styled.button`
    background: linear-gradient(90deg, rgba(0, 125, 136, 1) 0%, rgba(37, 203, 161, 1) 100%);
    color: white;
    border: none;
    padding: 0;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 0px;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 125, 136, 0.3);
    }
    
    &:active {
        transform: translateY(0);
    }
    
    &:focus {
        outline: 2px solid rgba(0, 125, 136, 0.5);
        outline-offset: 2px;
    }
    
    @media (max-width: 768px) {
        padding: 14px 28px;
        font-size: 15px;
    }
    
    @media (max-width: 480px) {
        padding: 12px 24px;
        font-size: 14px;
        max-width: 280px;
    }
    
    @media (max-width: 360px) {
        font-size: 13px;
    }
    
    @media (min-height: 800px) and (max-width: 768px) {
        margin-top: 20px;
    }
`;