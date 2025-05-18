import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import logoImage from '../assets/logos/logo.svg';

export const NotFoundContent = () => {
    const navigate = useNavigate();

    return (
        <NotFoundContentWrapper>
            <Title>404 - Страница не найдена</Title>
            <Description>
                Запрашиваемая страница не существует или была перемещена.
            </Description>
            <HomeButton onClick={() => navigate('/')}>
                Вернуться на главную
            </HomeButton>
        </NotFoundContentWrapper>
    );
};

const NotFoundContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: calc(100vh - 200px);
    text-align: center;
    background-color: rgba(249, 250, 250, 1);
    width: 100%;
`;

const Title = styled.h1`
    font-size: 24px;
    margin-bottom: 20px;
    color: #333;
    font-weight: 600;
`;

const Description = styled.p`
    font-size: 16px;
    color: #666;
    margin-bottom: 30px;
    line-height: 1.5;
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
`;