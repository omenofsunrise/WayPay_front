import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import QRCodeAuth from '../../components/WhatsAppLogin';

interface EmployeeNumber {
  id: number;
  phoneNumber: string;
  name: string;
  isActive: boolean;
  isMain: boolean;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastActive?: string;
  assignedBy: string;
  assignedAt: string;
}

const EmployeeWhatsAppPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'myNumbers' | 'connect'>('myNumbers');
  const [selectedNumber, setSelectedNumber] = useState<EmployeeNumber | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState({
    id: 1,
    name: 'Иванов Иван',
    position: 'Менеджер по продажам'
  });

  // Моковые данные - номера доступные сотруднику
  const [myNumbers, setMyNumbers] = useState<EmployeeNumber[]>([
    {
      id: 1,
      phoneNumber: '+7 (999) 123-45-67',
      name: 'Основной номер компании',
      isActive: true,
      isMain: true,
      status: 'connected',
      lastActive: new Date().toLocaleString(),
      assignedBy: 'Директор',
      assignedAt: '01.12.2024'
    },
    {
      id: 2,
      phoneNumber: '+7 (999) 765-43-21',
      name: 'Отдел продаж',
      isActive: true,
      isMain: false,
      status: 'connected',
      lastActive: new Date().toLocaleString(),
      assignedBy: 'Директор',
      assignedAt: '15.01.2025'
    }
  ]);

  // Переключение активного номера
  const handleSwitchNumber = (number: EmployeeNumber) => {
    if (number.status !== 'connected') {
      alert('Номер не подключен. Пожалуйста, подключите его сначала.');
      return;
    }
    setSelectedNumber(number);
    // Здесь будет API вызов для смены активного номера в сессии
    localStorage.setItem('activeWhatsAppNumber', JSON.stringify(number));
    alert(`Вы переключились на номер: ${number.name}\n${number.phoneNumber}`);
  };

  // Подключение нового номера (уже назначенного компании)
  const handleConnectNumber = (number: EmployeeNumber) => {
    setSelectedNumber(number);
    setShowQR(true);
    setActiveTab('connect');
  };

  // Успешное подключение
  const handleQRSuccess = () => {
    if (selectedNumber) {
      setMyNumbers(prev => prev.map(num => 
        num.id === selectedNumber.id 
          ? { 
              ...num, 
              status: 'connected', 
              isActive: true,
              lastActive: new Date().toLocaleString()
            }
          : num
      ));
      setShowQR(false);
      setSelectedNumber(null);
      alert('Номер успешно подключен!');
    }
  };

  // Ошибка подключения
  const handleQRError = (error: string) => {
    console.error('QR Auth error:', error);
    alert('Ошибка подключения: ' + error);
  };

  // Отключение номера
  const handleDisconnectNumber = (numberId: number) => {
    if (window.confirm('Вы уверены, что хотите отключить этот номер?')) {
      setMyNumbers(prev => prev.map(num => 
        num.id === numberId 
          ? { ...num, status: 'disconnected', isActive: false }
          : num
      ));
      if (selectedNumber?.id === numberId) {
        setSelectedNumber(null);
        setShowQR(false);
      }
      alert('Номер отключен');
    }
  };

  // Получение статуса номера
  const getStatusText = (status: string) => {
    switch(status) {
      case 'connected': return 'Подключен';
      case 'connecting': return 'Подключение...';
      case 'disconnected': return 'Не подключен';
      case 'error': return 'Ошибка';
      default: return 'Неизвестно';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'connected': return '#52c41a';
      case 'connecting': return '#faad14';
      case 'disconnected': return '#999';
      case 'error': return '#ff4d4f';
      default: return '#999';
    }
  };

  return (
    <PageContainer>
      <Header>
        <Title>Мои WhatsApp номера</Title>
        <Subtitle>
          Управление доступными вам номерами WhatsApp
        </Subtitle>
      </Header>

      <TabsContainer>
        <Tab 
          active={activeTab === 'myNumbers'} 
          onClick={() => {
            setActiveTab('myNumbers');
            setShowQR(false);
            setSelectedNumber(null);
          }}
        >
          📱 Мои номера ({myNumbers.length})
        </Tab>
        <Tab 
          active={activeTab === 'connect'} 
          onClick={() => setActiveTab('connect')}
        >
          🔌 Подключить номер
        </Tab>
      </TabsContainer>

      {activeTab === 'myNumbers' && (
        <NumbersContainer>
          {myNumbers.length === 0 ? (
            <EmptyState>
              <EmptyIcon>📭</EmptyIcon>
              <EmptyText>У вас пока нет доступных номеров</EmptyText>
              <EmptySubtext>Обратитесь к администратору для назначения номера</EmptySubtext>
            </EmptyState>
          ) : (
            <>
              {/* Информация о текущем активном номере */}
              <ActiveNumberCard>
                <ActiveIcon>✅</ActiveIcon>
                <ActiveInfo>
                  <ActiveTitle>Активный номер</ActiveTitle>
                  <ActiveNumber>
                    {myNumbers.find(n => n.isMain)?.name || myNumbers[0]?.name}
                  </ActiveNumber>
                  <ActivePhone>
                    {myNumbers.find(n => n.isMain)?.phoneNumber || myNumbers[0]?.phoneNumber}
                  </ActivePhone>
                </ActiveInfo>
                <ActiveBadge>Используется сейчас</ActiveBadge>
              </ActiveNumberCard>

              {/* Список доступных номеров */}
              <NumbersGrid>
                {myNumbers.map(number => (
                  <NumberCard key={number.id} status={number.status}>
                    <CardHeader>
                      <NumberName>
                        {number.name}
                        {number.isMain && <MainBadge>Основной</MainBadge>}
                      </NumberName>
                      <StatusDot color={getStatusColor(number.status)} />
                    </CardHeader>

                    <PhoneDisplay>{number.phoneNumber}</PhoneDisplay>

                    <StatusInfo>
                      <StatusLabel>Статус:</StatusLabel>
                      <StatusText status={number.status}>
                        {getStatusText(number.status)}
                      </StatusText>
                    </StatusInfo>

                    {number.status === 'connected' && number.lastActive && (
                      <InfoRow>
                        <InfoLabel>Последняя активность:</InfoLabel>
                        <InfoValue>{number.lastActive}</InfoValue>
                      </InfoRow>
                    )}

                    <InfoRow>
                      <InfoLabel>Назначен:</InfoLabel>
                      <InfoValue>{number.assignedBy} • {number.assignedAt}</InfoValue>
                    </InfoRow>

                    <ButtonGroup>
                      {number.status === 'connected' ? (
                        <>
                          <SwitchButton 
                            onClick={() => handleSwitchNumber(number)}
                            disabled={number.isMain}
                          >
                            {number.isMain ? 'Активен' : 'Переключиться'}
                          </SwitchButton>
                          <DisconnectButton onClick={() => handleDisconnectNumber(number.id)}>
                            Отключить
                          </DisconnectButton>
                        </>
                      ) : number.status === 'disconnected' ? (
                        <ConnectButton onClick={() => handleConnectNumber(number)}>
                          Подключить номер
                        </ConnectButton>
                      ) : number.status === 'connecting' ? (
                        <DisabledButton>Подключение...</DisabledButton>
                      ) : null}
                    </ButtonGroup>
                  </NumberCard>
                ))}
              </NumbersGrid>
            </>
          )}
        </NumbersContainer>
      )}

      {activeTab === 'connect' && (
        <ConnectContainer>
          {!showQR ? (
            <SelectNumberCard>
              <SelectTitle>Выберите номер для подключения</SelectTitle>
              <SelectSubtitle>
                Выберите один из доступных вам номеров, который еще не подключен
              </SelectSubtitle>
              
              <NumbersList>
                {myNumbers.filter(n => n.status !== 'connected').map(number => (
                  <SelectNumberItem 
                    key={number.id}
                    onClick={() => handleConnectNumber(number)}
                  >
                    <NumberIcon>📞</NumberIcon>
                    <NumberDetails>
                      <NumberTitle>{number.name}</NumberTitle>
                      <NumberPhoneNumber>{number.phoneNumber}</NumberPhoneNumber>
                    </NumberDetails>
                    <ConnectArrow>→</ConnectArrow>
                  </SelectNumberItem>
                ))}
                {myNumbers.filter(n => n.status !== 'connected').length === 0 && (
                  <EmptyConnectState>
                    <EmptyIcon>✅</EmptyIcon>
                    <EmptyText>Все доступные номера уже подключены</EmptyText>
                    <EmptySubtext>
                      Если вам нужен дополнительный номер, обратитесь к администратору
                    </EmptySubtext>
                  </EmptyConnectState>
                )}
              </NumbersList>
            </SelectNumberCard>
          ) : (
            <QRContainer>
              <QRHeader>
                <BackButton onClick={() => {
                  setShowQR(false);
                  setSelectedNumber(null);
                }}>
                  ← Назад
                </BackButton>
                <QRTitle>Подключение номера</QRTitle>
                <QRSubtitle>{selectedNumber?.name} - {selectedNumber?.phoneNumber}</QRSubtitle>
              </QRHeader>
              
              <QRCodeAuth
                userId={currentEmployee.id.toString()}
                onSuccess={handleQRSuccess}
                onError={handleQRError}
                pollingInterval={3000}
              />
              
              <InfoBox>
                <InfoIcon>ℹ️</InfoIcon>
                <InfoText>
                  После успешного подключения вы сможете отправлять и получать сообщения 
                  от имени этого номера. Переключение между номерами происходит мгновенно.
                </InfoText>
              </InfoBox>
            </QRContainer>
          )}
        </ConnectContainer>
      )}
    </PageContainer>
  );
};

// Стили
const PageContainer = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: 100%;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e8e8e8;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 12px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: ${props => props.active ? '#1890ff' : '#666'};
  border-bottom: 2px solid ${props => props.active ? '#1890ff' : 'transparent'};
  transition: all 0.2s;
  
  &:hover {
    color: #1890ff;
  }
`;

const NumbersContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const ActiveNumberCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const ActiveIcon = styled.div`
  font-size: 48px;
`;

const ActiveInfo = styled.div`
  flex: 1;
`;

const ActiveTitle = styled.div`
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
`;

const ActiveNumber = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const ActivePhone = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

const ActiveBadge = styled.div`
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
`;

const NumbersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
`;

const NumberCard = styled.div<{ status: string }>`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => {
    switch(props.status) {
      case 'connected': return '#52c41a';
      case 'connecting': return '#faad14';
      case 'disconnected': return '#999';
      default: return '#ff4d4f';
    }
  }};
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const NumberName = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MainBadge = styled.span`
  background: #faad14;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: normal;
`;

const StatusDot = styled.div<{ color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.color};
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

const PhoneDisplay = styled.div`
  font-size: 20px;
  font-weight: 500;
  color: #1890ff;
  margin-bottom: 16px;
  font-family: monospace;
`;

const StatusInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const StatusLabel = styled.span`
  font-size: 13px;
  color: #999;
`;

const StatusText = styled.span<{ status: string }>`
  font-size: 13px;
  font-weight: 500;
  color: ${props => {
    switch(props.status) {
      case 'connected': return '#52c41a';
      case 'connecting': return '#faad14';
      case 'disconnected': return '#999';
      default: return '#ff4d4f';
    }
  }};
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
`;

const InfoLabel = styled.span`
  color: #999;
`;

const InfoValue = styled.span`
  color: #666;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const SwitchButton = styled.button`
  flex: 1;
  padding: 8px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #40a9ff;
  }
  
  &:disabled {
    background: #d9d9d9;
    cursor: not-allowed;
  }
`;

const ConnectButton = styled.button`
  flex: 1;
  padding: 8px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: #73d13d;
  }
`;

const DisconnectButton = styled.button`
  flex: 1;
  padding: 8px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: #ff7875;
  }
`;

const DisabledButton = styled.button`
  flex: 1;
  padding: 8px;
  background: #d9d9d9;
  color: #999;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: not-allowed;
`;

const ConnectContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const SelectNumberCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SelectTitle = styled.h2`
  font-size: 20px;
  margin: 0 0 8px 0;
  color: #333;
`;

const SelectSubtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
`;

const NumbersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SelectNumberItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #1890ff;
    background: #f0f9ff;
    transform: translateX(4px);
  }
`;

const NumberIcon = styled.div`
  font-size: 32px;
`;

const NumberDetails = styled.div`
  flex: 1;
`;

const NumberTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
`;

const NumberPhoneNumber = styled.div`
  font-size: 14px;
  color: #666;
  font-family: monospace;
`;

const ConnectArrow = styled.div`
  font-size: 24px;
  color: #1890ff;
`;

const QRContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const QRHeader = styled.div`
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  margin-bottom: 16px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const QRTitle = styled.h2`
  font-size: 20px;
  margin: 0 0 4px 0;
  color: #333;
`;

const QRSubtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

const EmptyText = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
`;

const EmptySubtext = styled.div`
  font-size: 14px;
  color: #999;
`;

const EmptyConnectState = styled.div`
  text-align: center;
  padding: 40px 20px;
`;

const InfoBox = styled.div`
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const InfoIcon = styled.div`
  font-size: 20px;
`;

const InfoText = styled.div`
  flex: 1;
  font-size: 13px;
  color: #0050b3;
  line-height: 1.5;
`;

export default EmployeeWhatsAppPage;