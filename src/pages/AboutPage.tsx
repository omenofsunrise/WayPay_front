import React from 'react';
import styled from 'styled-components';
import useCompany from '../api/hooks/useCompany';
import type { CommonInfo } from '../api/types/company';

const AboutPage: React.FC = () => {
  const { getCommonInfo } = useCompany();
  const [commonInfo, setCommonInfo] = React.useState<CommonInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCommonInfo();
        setCommonInfo(data);
      } catch (err) {
        setError('Не удалось загрузить информацию о компании');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getCommonInfo]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const handlePhoneClick = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText('89957022304');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      if ('ontouchstart' in window) {
        window.location.href = 'tel:+79957022304';
      }
    } catch (err) {
      console.error('Failed to copy number', err);
    }
  };

  const getDaysRemaining = (dateString: string): string => {
    const targetDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `Осталось ${diffDays} дней`;
    if (diffDays === 0) return 'Срок истекает сегодня';
    return `Просрочено на ${Math.abs(diffDays)} дней`;
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Container>
      <Content>
        <Title>О приложении</Title>
        
        <InfoCard>
          <InfoItem>
            <Label>Версия:</Label>
            <Value>beta</Value>
          </InfoItem>
          
          <InfoItem>
            <Label>Владелец:</Label>
            <Value>{commonInfo.directorFullname}</Value>
          </InfoItem>

          <InfoItem>
            <Label>Телефон:</Label>
            <PhoneContainer>
              <PhoneValue onClick={handlePhoneClick}>8 (995) 702-23-04</PhoneValue>
              {copied && <CopiedMessage>Скопировано!</CopiedMessage>}
            </PhoneContainer>
          </InfoItem>
          
          <InfoItem>
            <Label>Срок лицензии:</Label>
            <Value>
              {commonInfo ? (
                `${formatDate(commonInfo.licenceDate)} (${getDaysRemaining(commonInfo.licenceDate.toString())})`
              ) : 'Нет данных'}
            </Value>
          </InfoItem>
        </InfoCard>
        
        <LinksContainer>
          <PolicyLink href="/privacy-policy">Политика конфиденциальности</PolicyLink>
        </LinksContainer>
      </Content>

      <Content>
        <Title>Оплата</Title>
        <QrCode src="/paymentQr.jpg" alt="QR код для оплаты" />
        <InstructionTitle>Для продления подписки в сообщении <strong>Обязательно укажите ФИО директора и его номер телефона</strong></InstructionTitle>
      </Content>
    </Container>
  );
};

const InstructionTitle = styled.h3`
  color: rgba(0, 125, 136, 1);
  font-size: 18px;
  margin-bottom: 10px;
  font-weight: 600;
`;


const QrCode = styled.img`
  width: 350px;
  height: 350px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  padding: 10px;
  background: white;
`;

const Container = styled.div`
  display: flex;
  gap: 20px;
  padding: 20px;
  flex-direction: row;
  max-width: 1100px;
  margin: 0 auto;
`;

const Content = styled.div`
  background-color: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-top: 40px;
  flex: 1;
  min-width: 0;
`;

const Title = styled.h1`
  color: rgba(0, 125, 136, 1);
  font-size: 28px;
  margin-bottom: 30px;
  text-align: center;
  font-weight: 600;
  position: relative;
  padding-bottom: 15px;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 3px;
    background: rgba(37, 203, 161, 1);
    border-radius: 3px;
  }
`;

const InfoCard = styled.div`
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
  border: 1px solid rgba(209, 213, 219, 1);
`;

const InfoItem = styled.div`
  display: flex;
  margin-bottom: 18px;
  align-items: baseline;
  flex-wrap: wrap;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.span`
  font-weight: 600;
  max-width: 160px;
  color: rgba(0, 125, 136, 0.9);
  margin-right: 20px;
  margin-bottom: 5px;
  text-align: left;
`;

const Value = styled.span`
  color: #333;
  flex: 1;
  line-height: 1.5;
`;

const PhoneContainer = styled.div`
  position: relative;
  display: inline-block;
    flex: 1;
`;

const PhoneValue = styled(Value)`
  color: rgba(0, 125, 136, 1);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-block;
  
  &:hover {
    color: rgba(37, 203, 161, 1);
    text-decoration: underline;
  }
`;

const CopiedMessage = styled.span`
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 125, 136, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  animation: fadeInOut 2s ease-in-out;

  @keyframes fadeInOut {
    0% { opacity: 0; }
    20% { opacity: 1; }
    80% { opacity: 1; }
    100% { opacity: 0; }
  }
`;

const LinksContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const PolicyLink = styled.a`
  color: rgba(0, 125, 136, 1);
  text-decoration: none;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: 8px;
  transition: all 0.3s;
  border: 1px solid rgba(0, 125, 136, 0.2);
  
  &:hover {
    background: rgba(0, 125, 136, 0.1);
    color: rgba(0, 125, 136, 0.9);
    border-color: rgba(0, 125, 136, 0.4);
  }
`;

export default AboutPage;