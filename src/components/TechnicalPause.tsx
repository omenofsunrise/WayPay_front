import styled from 'styled-components';
import logoImage from '../assets/logos/logo.svg';

const TechnicalPauseInner = () => {
    return (
        <TechnicalPauseWrapper>
            <ContentContainer>
                <Logo src={logoImage} alt="Логотип" />

                <StatusBadge>
                    <PulseDot />
                    Технические работы
                </StatusBadge>

                <Title>Сайт временно недоступен</Title>

                <Description>
                    В данный момент проводятся технические мероприятия.
                    Мы уже работаем над восстановлением доступа —
                    сайт снова будет доступен примерно в{' '}
                    <TimeHighlight>23:45</TimeHighlight>.
                </Description>
            </ContentContainer>
        </TechnicalPauseWrapper>
    );
};

export const TechnicalPause = () => {
    return <TechnicalPauseInner />;
};

/* ---------- Layout ---------- */

const TechnicalPauseWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    width: 100%;
    margin: 0;
    padding: 24px;
    box-sizing: border-box;
    text-align: center;
    background: linear-gradient(180deg, #f9fafa 0%, #f0fdfa 100%);

    @media (max-width: 768px) {
        align-items: flex-start;
        padding-top: 40px;
    }

    @media (max-width: 480px) {
        padding: 24px 16px;
    }
`;

const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 440px;
    width: 100%;
    padding: 48px 32px 44px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    box-shadow:
        0 10px 30px rgba(0, 125, 136, 0.06),
        0 2px 6px rgba(0, 0, 0, 0.04);

    @media (max-width: 480px) {
        padding: 36px 22px 32px;
        border-radius: 16px;
    }
`;

const Logo = styled.img`
    width: 88px;
    height: 88px;
    margin-bottom: 24px;

    @media (max-width: 480px) {
        width: 72px;
        height: 72px;
        margin-bottom: 20px;
    }
`;

/* ---------- Status badge ---------- */

const StatusBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    margin-bottom: 20px;
    background: #e6f4f5;
    border: 1px solid #ccfbf1;
    border-radius: 999px;
    color: #00666f;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.2px;
`;

const PulseDot = styled.span`
    position: relative;
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #007d88;

    &::after {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        background: #007d88;
        opacity: 0.35;
        animation: pulse 1.8s ease-out infinite;
    }

    @keyframes pulse {
        0% {
            transform: scale(0.8);
            opacity: 0.5;
        }
        100% {
            transform: scale(2);
            opacity: 0;
        }
    }
`;

/* ---------- Text ---------- */

const Title = styled.h1`
    font-size: 24px;
    margin: 0 0 12px;
    color: #111827;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.3px;

    @media (max-width: 480px) {
        font-size: 20px;
    }
`;

const Description = styled.p`
    font-size: 15px;
    color: #6b7280;
    margin: 0;
    line-height: 1.65;
    max-width: 380px;

    @media (max-width: 480px) {
        font-size: 14px;
    }
`;

const TimeHighlight = styled.span`
    color: #007d88;
    font-weight: 600;
    background: #e6f4f5;
    padding: 1px 8px;
    border-radius: 6px;
    white-space: nowrap;
`;