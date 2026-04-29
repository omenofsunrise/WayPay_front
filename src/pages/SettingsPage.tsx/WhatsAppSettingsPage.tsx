import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import CustomTitle from '../../components/ui/Text/CustomTitle';
import useWhatsApp from '../../api/hooks/useWhatsApp';
import { useEmployee } from '../../api/hooks/useEmployee';
import DarkCyanButton from '../../components/ui/Buttons/DarkCyanButton';
import GrayButton from '../../components/ui/Buttons/GrayButton';
import CustomInput from '../../components/ui/fields/CustomInput';

interface WhatsAppNumber {
  id: string;
  phoneNumber: string;
  name: string;
  isActive: boolean;
  isMain: boolean;
  assignedTo: number[];
  assignedToNames: string[];
  status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'expired';
  lastMessage: string;
  qrCode?: string;
  subscriptionEndDate: string;
  pricePerMonth: number;
  blocked: boolean;
  stopped: boolean;
  isSubscriptionExpired: boolean;
}

const WhatsAppSettingsPage: React.FC = () => {
  const { 
    getChannels, 
    createChannel,
    deleteChannel,
    setCurrentChannel,
    channels, 
    isLoading,
    setChannelEmployees,
    extendChannel,
    getQR,
    logout
  } = useWhatsApp();

  const { employees, fetchEmployees, employeesLoading } = useEmployee();

  const [whatsAppNumbers, setWhatsAppNumbers] = useState<WhatsAppNumber[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<WhatsAppNumber | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState<string | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendChannelId, setExtendChannelId] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [extendChannelName, setExtendChannelName] = useState<string>('');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [qrStatus, setQrStatus] = useState<string>('');
  const [newNumber, setNewNumber] = useState({
    name: '',
    assignedTo: [] as number[]
  });

  useEffect(() => {
    loadChannels();
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      await fetchEmployees({ page: 1, pageSize: 100 });
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const isSubscriptionExpired = (activeTill: string | undefined): boolean => {
    if (!activeTill) return true;
    const expiryDate = new Date(activeTill);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiryDate < today;
  };

  const getChannelStatus = (channel: any): { status: WhatsAppNumber['status'], lastMessage: string, isActive: boolean } => {
    const expired = isSubscriptionExpired(channel.activeTill);
    
    if (expired) {
      return {
        status: 'expired',
        lastMessage: '❌ Необходимо оплатить подписку',
        isActive: false
      };
    }
    
    if (channel.stopped) {
      return {
        status: 'disconnected',
        lastMessage: '⏸ Остановлен',
        isActive: false
      };
    }
    
    if (channel.blocked) {
      return {
        status: 'error',
        lastMessage: '🚫 Заблокирован',
        isActive: false
      };
    }
    
    return {
      status: 'connected',
      lastMessage: '✅ Активен и работает',
      isActive: true
    };
  };

  const loadChannels = async () => {
    const result = await getChannels();
    if (result && result.length > 0) {
      const convertedNumbers: WhatsAppNumber[] = result.map((channel, index) => {
        const expired = isSubscriptionExpired(channel.activeTill);
        const { status, lastMessage, isActive } = getChannelStatus(channel);
        
        return {
          id: channel.id,
          phoneNumber: channel.name || `Канал ${index + 1}`,
          name: channel.name || `Канал ${index + 1}`,
          isActive: isActive && !expired,
          isMain: index === 0,
          assignedTo: channel.employeeIds || [],
          assignedToNames: [],
          status: status,
          lastMessage: lastMessage,
          subscriptionEndDate: channel.activeTill || '',
          pricePerMonth: 1000,
          blocked: channel.blocked || false,
          stopped: channel.stopped || false,
          isSubscriptionExpired: expired
        };
      });
      setWhatsAppNumbers(convertedNumbers);
    } else {
      setWhatsAppNumbers([]);
    }
  };

  // Проверка можно ли выполнить действие с каналом
  const canPerformAction = (number: WhatsAppNumber): boolean => {
    if (number.stopped) {
      alert('Невозможно выполнить действие: канал остановлен');
      return false;
    }
    if (number.blocked) {
      alert('Невозможно выполнить действие: канал заблокирован');
      return false;
    }
    return true;
  };

  const handleLogin = async (numberId: string, numberName: string) => {
    const number = whatsAppNumbers.find(n => n.id === numberId);
    if (number && !canPerformAction(number)) return;

    setIsLoggingIn(numberId);
    try {
      const success = await setCurrentChannel(numberId);
      if (!success) {
        alert('Ошибка при выборе канала');
        return;
      }

      const qrResult = await getQR(numberId);
      if (qrResult && qrResult.qrString) {
        setQrCode(qrResult.qrString);
        setQrStatus(qrResult.status);
        setSelectedNumber(number);
        setShowQRModal(true);
        
        pollConnectionStatus(numberId);
      } else {
        alert('Необходимо продлить подписку у канала для подключения номера!');
      }
    } catch (error) {
      console.error('Error getting QR:', error);
      alert('Ошибка при получении QR кода');
    } finally {
      setIsLoggingIn(null);
    }
  };

  const pollConnectionStatus = async (channelId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await getQR(channelId);
        if (status && status.status === 'CONNECTED') {
          setQrStatus('CONNECTED');
          clearInterval(interval);
          setTimeout(() => {
            setShowQRModal(false);
            setQrCode('');
            loadChannels();
            alert('WhatsApp успешно подключен!');
          }, 2000);
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 3000);

    // Останавливаем polling через 2 минуты
    setTimeout(() => {
      clearInterval(interval);
    }, 120000);
  };

  const handleLogout = async (numberId: string, numberName: string) => {
    const number = whatsAppNumbers.find(n => n.id === numberId);
    
    if (!window.confirm(`Вы уверены, что хотите выйти из WhatsApp канала "${numberName}"?`)) {
      return;
    }

    setIsLoggingOut(numberId);
    try {
      const success = await logout(numberId);
      if (success) {
        alert('Успешный выход из канала');
        await loadChannels();
      } else {
        alert('Ошибка при выходе из канала');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Произошла ошибка при выходе из канала');
    } finally {
      setIsLoggingOut(null);
    }
  };

  const handleConnectNumber = async (numberId: string) => {
    const number = whatsAppNumbers.find(n => n.id === numberId);
    if (number && !canPerformAction(number)) return;

    try {
      const success = await setCurrentChannel(numberId);
      if (success) {
        alert('Канал успешно выбран как текущий!');
        await loadChannels();
      } else {
        alert('Ошибка при выборе канала');
      }
    } catch (error) {
      console.error('Error setting current channel:', error);
      alert('Произошла ошибка при подключении канала');
    }
  };

  const handleDisconnectNumber = async (numberId: string) => {
    const number = whatsAppNumbers.find(n => n.id === numberId);
    if (number && number.isSubscriptionExpired) {
      if (!window.confirm('У этого канала истекла подписка. Удалить канал?')) {
        return;
      }
    } else if (!window.confirm('Вы уверены, что хотите удалить этот канал?')) {
      return;
    }

    try {
      await deleteChannel(numberId);
      alert('Канал успешно удален');
      await loadChannels();
    } catch (error) {
      console.error('Error deleting channel:', error);
      alert('Ошибка при удалении канала');
    }
  };

  const handleExtendSubscription = async (channelId: string, channelName: string) => {
    setExtendChannelId(channelId);
    setExtendChannelName(channelName);
    setPaymentUrl(null);
    setShowExtendModal(true);
  };

  const handleCreatePaymentLink = async () => {
    if (!extendChannelId) return;
    
    setIsExtending(true);
    try {
      const url = await extendChannel(1, extendChannelId);
      
      if (url) {
        setPaymentUrl(url);
      } else {
        alert('Ошибка при создании платежной ссылки. Попробуйте позже.');
      }
    } catch (error) {
      console.error('Error extending channel:', error);
      alert('Произошла ошибка при создании платежной ссылки');
    } finally {
      setIsExtending(false);
    }
  };

  const handleGoToPayment = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
      setShowExtendModal(false);
      setExtendChannelId(null);
      setExtendDays(30);
      setExtendChannelName('');
      setPaymentUrl(null);
      
      setTimeout(() => {
        loadChannels();
      }, 3000);
    }
  };

  const handleAddNumber = async () => {
    if (!newNumber.name.trim()) {
      alert('Пожалуйста, введите название канала');
      return;
    }

    if (newNumber.assignedTo.length === 0) {
      alert('Пожалуйста, выберите хотя бы одного сотрудника для канала');
      return;
    }

    setIsCreating(true);
    try {
      const createdChannel = await createChannel(newNumber.name, newNumber.assignedTo);
      
      if (createdChannel) {
        alert(`Канал "${createdChannel.name}" успешно создан!`);
        await loadChannels();
        
        setNewNumber({
          name: '',
          assignedTo: []
        });
        setShowAddModal(false);
      } else {
        alert('Ошибка при создании канала. Попробуйте позже.');
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      alert('Произошла ошибка при создании канала');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignEmployees = async () => {
    if (!selectedNumber) return;

    if (!canPerformAction(selectedNumber)) return;

    setIsAssigning(true);
    try {
      const success = await setChannelEmployees(selectedNumber.id, selectedNumber.assignedTo);
      
      if (success) {
        alert('Сотрудники успешно назначены!');
        await loadChannels();
        setShowAssignModal(false);
        setSelectedNumber(null);
      } else {
        alert('Ошибка при назначении сотрудников');
      }
    } catch (error) {
      console.error('Error assigning employees:', error);
      alert('Произошла ошибка при назначении сотрудников');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSetMainNumber = async (numberId: string) => {
    const number = whatsAppNumbers.find(n => n.id === numberId);
    if (number && !canPerformAction(number)) return;

    try {
      const success = await setCurrentChannel(numberId);
      if (success) {
        alert('Основной канал успешно изменен');
        await loadChannels();
      } else {
        alert('Ошибка при изменении основного канала');
      }
    } catch (error) {
      console.error('Error setting main channel:', error);
      alert('Произошла ошибка');
    }
  };

  const totalCost = whatsAppNumbers
    .filter(num => num.isActive && num.status === 'connected')
    .reduce((sum, num) => sum + num.pricePerMonth, 0);

  const activeNumbersCount = whatsAppNumbers.filter(num => num.isActive && num.status === 'connected').length;
  const expiredCount = whatsAppNumbers.filter(num => num.isSubscriptionExpired).length;

  const employeeList = employees?.items || [];

  const getEmployeeNames = (employeeIds: number[]): string[] => {
    return employeeIds
      .map(id => {
        const employee = employeeList.find(emp => emp.id === id);
        return employee?.fullName || '';
      })
      .filter(name => name);
  };

  const formatExpiryDate = (dateStr: string): string => {
    if (!dateStr) return 'Не указана';
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isExpired = date < today;
    
    const formattedDate = date.toLocaleDateString('ru-RU');
    return isExpired ? `${formattedDate} (истекла)` : formattedDate;
  };

  if (isLoading && whatsAppNumbers.length === 0) {
    return (
      <SettingsContainer>
        <Header>
          <CustomTitle>Настройка WhatsApp номеров</CustomTitle>
          <Description>Загрузка каналов...</Description>
        </Header>
      </SettingsContainer>
    );
  }

  return (
    <SettingsContainer>
      <Header>
        <HeaderTop>
          <CustomTitle>Настройка WhatsApp номеров</CustomTitle>
          <DarkCyanButton onClick={() => setShowAddModal(true)}>
            + Добавить WhatsApp
          </DarkCyanButton>
        </HeaderTop>
      </Header>

      {whatsAppNumbers.length === 0 ? (
        <EmptyState>
          <EmptyTitle>Нет WhatsApp каналов</EmptyTitle>
          <EmptyDescription>
            У вас пока нет подключенных WhatsApp номеров. Нажмите кнопку "Добавить WhatsApp", чтобы начать.
          </EmptyDescription>
        </EmptyState>
      ) : (
        <NumbersList>
          {whatsAppNumbers.map(number => {
            const employeeNames = getEmployeeNames(number.assignedTo);
            return (
              <NumberCard key={number.id} isActive={number.isActive} isExpired={number.isSubscriptionExpired}>
                <CardHeader>
                  <NumberInfo>
                    <NumberName>
                      {number.name}
                      {number.isMain && <MainBadge>Текущий</MainBadge>}
                      {number.stopped && <StoppedBadge>Остановлен</StoppedBadge>}
                      {number.blocked && <BlockedBadge>Заблокирован</BlockedBadge>}
                      {number.isSubscriptionExpired && <ExpiredBadge>Подписка истекла</ExpiredBadge>}
                    </NumberName>
                    <PhoneNumber>{number.phoneNumber}</PhoneNumber>
                  </NumberInfo>
                  <StatusBadge status={number.status}>
                    {number.status === 'connected' && '✓ Подключен'}
                    {number.status === 'connecting' && '⏳ Подключение...'}
                    {number.status === 'disconnected' && '○ Не подключен'}
                    {number.status === 'error' && '⚠ Ошибка'}
                    {number.status === 'expired' && '⌛ Подписка истекла'}
                  </StatusBadge>
                </CardHeader>

                <CardContent>
                  <InfoRow>
                    <InfoLabel>Доступ сотрудникам:</InfoLabel>
                    <EmployeesList>
                      {employeeNames.map(name => (
                        <EmployeeBadge key={name}>{name}</EmployeeBadge>
                      ))}
                      {employeeNames.length === 0 && (
                        <EmptyText>Не назначен</EmptyText>
                      )}
                    </EmployeesList>
                    {!number.isSubscriptionExpired && !number.stopped && !number.blocked && (
                      <GrayButton onClick={() => {
                        setSelectedNumber({
                          ...number,
                          assignedToNames: employeeNames
                        });
                        setShowAssignModal(true);
                      }}>
                        Назначить
                      </GrayButton>
                    )}
                  </InfoRow>

                  {number.subscriptionEndDate && (
                    <InfoRow>
                      <InfoLabel>Подписка до:</InfoLabel>
                      <InfoValue expired={number.isSubscriptionExpired}>
                        {formatExpiryDate(number.subscriptionEndDate)}
                      </InfoValue>
                    </InfoRow>
                  )}

                  <InfoRow>
                    <InfoLabel>Статус:</InfoLabel>
                    <InfoValue>{number.lastMessage}</InfoValue>
                  </InfoRow>

                  <InfoRow>
                    <InfoLabel>Стоимость:</InfoLabel>
                    <InfoValue>{number.pricePerMonth} ₽/месяц</InfoValue>
                  </InfoRow>

                  {number.isSubscriptionExpired && (
                    <WarningRow>
                      <WarningIcon>⚠️</WarningIcon>
                      <WarningText>
                        Для продолжения работы канала необходимо продлить подписку
                      </WarningText>
                    </WarningRow>
                  )}
                </CardContent>

                <CardActions>
                  {!number.isSubscriptionExpired && (
                    <>
                      <DarkCyanButton
                        onClick={() => handleLogin(number.id, number.name)}
                        isLoggingIn={isLoggingIn === number.id}
                        disabled={isLoggingIn === number.id || isLoggingOut === number.id}
                      >
                        {isLoggingIn === number.id ? 'Получение QR...' : '📱 Войти по QR'}
                      </DarkCyanButton>
                      <GrayButton 
                        onClick={() => handleLogout(number.id, number.name)}
                        disabled={isLoggingIn === number.id || isLoggingOut === number.id}
                      >
                        {isLoggingOut === number.id ? 'Выход...' : 'Выйти'}
                      </GrayButton>
                    </>
                  )}
                  <DarkCyanButton 
                    onClick={() => handleExtendSubscription(number.id, number.name)}
                  >
                    Продлить
                  </DarkCyanButton>
                  
                  {!number.isSubscriptionExpired && !number.stopped && !number.blocked && (
                    <DarkCyanButton onClick={() => handleSetMainNumber(number.id)}>
                      Сделать основным
                    </DarkCyanButton>
                  )}
                  
                  <GrayButton onClick={() => handleDisconnectNumber(number.id)}>
                    Удалить
                  </GrayButton>
                </CardActions>
              </NumberCard>
            );
          })}
        </NumbersList>
      )}

      {/* Modal для QR кода */}
      {showQRModal && selectedNumber && qrCode && (
        <ModalOverlay onClick={() => setShowQRModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Подключение WhatsApp - {selectedNumber.name}</ModalTitle>
              <CloseButton onClick={() => setShowQRModal(false)}>×</CloseButton>
            </ModalHeader>

            <QRContainer>
              <QRCodeImage src={qrCode} alt="WhatsApp QR Code" />
              <QRInstruction>
                <StepIcon>1</StepIcon>
                <StepText>Откройте WhatsApp на телефоне</StepText>
              </QRInstruction>
              <QRInstruction>
                <StepIcon>2</StepIcon>
                <StepText>Нажмите Меню → Связанные устройства</StepText>
              </QRInstruction>
              <QRInstruction>
                <StepIcon>3</StepIcon>
                <StepText>Нажмите "Связать устройство" и отсканируйте QR код</StepText>
              </QRInstruction>
              
              {qrStatus === 'CONNECTED' && (
                <SuccessMessage>
                  ✓ Успешно подключено! Перенаправление...
                </SuccessMessage>
              )}
              
              {qrStatus === 'EXPIRED' && (
                <ErrorMessage>
                  QR код истек. Пожалуйста, попробуйте снова.
                </ErrorMessage>
              )}
            </QRContainer>

            <ModalActions>
              <CancelButton onClick={() => setShowQRModal(false)}>
                Закрыть
              </CancelButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Modal для добавления канала - обновлен с использованием EmployeesGrid */}
      {showAddModal && (
        <ModalOverlay onClick={() => !isCreating && setShowAddModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Добавить WhatsApp канал</ModalTitle>
              <CloseButton onClick={() => !isCreating && setShowAddModal(false)}>×</CloseButton>
            </ModalHeader>
            
            <FormGroup>
              <CustomInput
                type="text"
                value={newNumber.name}
                onChange={e => setNewNumber({...newNumber, name: e.target.value})}
                placeholder="Название канала"
                disabled={isCreating}
                autoFocus
              />
            </FormGroup>

            <FormGroup>
              <Label>Доступ сотрудникам</Label>
              {employeesLoading ? (
                <LoadingText>Загрузка сотрудников...</LoadingText>
              ) : (
                <EmployeesGrid>
                  {employeeList.map(emp => (
                    <EmployeeCheckbox 
                      key={emp.id}
                      active={newNumber.assignedTo.includes(emp.id)}
                      onClick={() => {
                        setNewNumber({
                          ...newNumber,
                          assignedTo: newNumber.assignedTo.includes(emp.id)
                            ? newNumber.assignedTo.filter(id => id !== emp.id)
                            : [...newNumber.assignedTo, emp.id]
                        });
                      }}
                    >
                      <CheckIcon active={newNumber.assignedTo.includes(emp.id)}>
                        {newNumber.assignedTo.includes(emp.id) && '✓'}
                      </CheckIcon>
                      <EmployeeInfo>
                        <EmployeeName>{emp.fullName}</EmployeeName>
                        <EmployeePosition>{emp.role}</EmployeePosition>
                      </EmployeeInfo>
                    </EmployeeCheckbox>
                  ))}
                  {employeeList.length === 0 && (
                    <EmptyText>Нет доступных сотрудников</EmptyText>
                  )}
                </EmployeesGrid>
              )}
              <Hint>Нажмите на сотрудника для выбора/снятия выбора</Hint>
            </FormGroup>

            <ModalActions>
              <CancelButton onClick={() => !isCreating && setShowAddModal(false)} disabled={isCreating}>
                Отмена
              </CancelButton>
              <ConfirmButton onClick={handleAddNumber} disabled={isCreating || newNumber.assignedTo.length === 0}>
                {isCreating ? 'Создание...' : 'Создать канал'}
              </ConfirmButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Modal для назначения сотрудников */}
      {showAssignModal && selectedNumber && (
        <ModalOverlay onClick={() => !isAssigning && setShowAssignModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Назначить сотрудников на канал "{selectedNumber.name}"</ModalTitle>
              <CloseButton onClick={() => !isAssigning && setShowAssignModal(false)}>×</CloseButton>
            </ModalHeader>

            <FormGroup>
              {employeesLoading ? (
                <LoadingText>Загрузка сотрудников...</LoadingText>
              ) : (
                <EmployeesGrid>
                  {employeeList.map(emp => (
                    <EmployeeCheckbox 
                      key={emp.id}
                      active={selectedNumber.assignedTo.includes(emp.id)}
                      onClick={() => {
                        setSelectedNumber({
                          ...selectedNumber,
                          assignedTo: selectedNumber.assignedTo.includes(emp.id)
                            ? selectedNumber.assignedTo.filter(id => id !== emp.id)
                            : [...selectedNumber.assignedTo, emp.id]
                        });
                      }}
                    >
                      <CheckIcon active={selectedNumber.assignedTo.includes(emp.id)}>
                        {selectedNumber.assignedTo.includes(emp.id) && '✓'}
                      </CheckIcon>
                      <EmployeeInfo>
                        <EmployeeName>{emp.fullName}</EmployeeName>
                        <EmployeePosition>{emp.role}</EmployeePosition>
                      </EmployeeInfo>
                    </EmployeeCheckbox>
                  ))}
                  {employeeList.length === 0 && (
                    <EmptyText>Нет доступных сотрудников</EmptyText>
                  )}
                </EmployeesGrid>
              )}
            </FormGroup>

            <ModalActions>
              <GrayButton onClick={() => !isAssigning && setShowAssignModal(false)} disabled={isAssigning}>
                Отмена
              </GrayButton>
              <DarkCyanButton onClick={handleAssignEmployees} disabled={isAssigning}>
                {isAssigning ? 'Сохранение...' : 'Сохранить'}
              </DarkCyanButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Modal для продления подписки */}
      {showExtendModal && extendChannelId && (
        <ModalOverlay onClick={() => !isExtending && !paymentUrl && setShowExtendModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Продление подписки</ModalTitle>
              <CloseButton onClick={() => !isExtending && !paymentUrl && setShowExtendModal(false)}>×</CloseButton>
            </ModalHeader>

            {!paymentUrl ? (
              <>
                <InfoBox>
                  <InfoIcon>💰</InfoIcon>
                  <InfoText>
                    Продление подписки для канала <strong>"{extendChannelName}"</strong>
                  </InfoText>
                </InfoBox>

                <FormGroup>
                  <Label>Выберите срок продления:</Label>
                  <DaysSelector>
                    <DayOption 
                      selected={extendDays === 30}
                      onClick={() => setExtendDays(30)}
                      disabled={isExtending}
                    >
                      <DaysValue>30 дней</DaysValue>
                      <DaysPrice>1000 ₽</DaysPrice>
                    </DayOption>
                    <DayOption 
                      selected={extendDays === 90}
                      onClick={() => setExtendDays(90)}
                      disabled={isExtending}
                    >
                      <DaysValue>90 дней</DaysValue>
                      <DaysPrice>2700 ₽</DaysPrice>
                      <DaysDiscount>-10%</DaysDiscount>
                    </DayOption>
                    <DayOption 
                      selected={extendDays === 365}
                      onClick={() => setExtendDays(365)}
                      disabled={isExtending}
                    >
                      <DaysValue>365 дней</DaysValue>
                      <DaysPrice>10000 ₽</DaysPrice>
                      <DaysDiscount>-15%</DaysDiscount>
                    </DayOption>
                  </DaysSelector>
                  <Hint>Выберите удобный для вас срок подписки</Hint>
                </FormGroup>

                <PriceSummary>
                  <SummaryText>Итого к оплате:</SummaryText>
                  <SummaryPrice>
                    {extendDays === 30 && '1000 ₽'}
                    {extendDays === 90 && '2700 ₽'}
                    {extendDays === 365 && '10000 ₽'}
                  </SummaryPrice>
                </PriceSummary>

                <InfoBox>
                  <InfoIcon>💳</InfoIcon>
                  <InfoText>
                    После нажатия кнопки "Создать платеж" будет сформирована ссылка для оплаты
                  </InfoText>
                </InfoBox>

                <ModalActions>
                  <CancelButton onClick={() => setShowExtendModal(false)} disabled={isExtending}>
                    Отмена
                  </CancelButton>
                  <ConfirmButton onClick={handleCreatePaymentLink} disabled={isExtending}>
                    {isExtending ? 'Создание платежа...' : 'Создать платеж'}
                  </ConfirmButton>
                </ModalActions>
              </>
            ) : (
              <>
                <InfoBox>
                  <InfoIcon>✅</InfoIcon>
                  <InfoText>
                    Платежная ссылка создана! Нажмите на кнопку ниже, чтобы перейти к оплате.
                  </InfoText>
                </InfoBox>

                <PaymentLinkContainer>
                  <PaymentLinkLabel>Ссылка для оплаты:</PaymentLinkLabel>
                  <PaymentLinkValue>{paymentUrl}</PaymentLinkValue>
                </PaymentLinkContainer>

                <InfoBox>
                  <InfoIcon>🔒</InfoIcon>
                  <InfoText>
                    Вы будете перенаправлены на защищенную страницу оплаты. 
                    Подписка будет активирована сразу после успешной оплаты.
                  </InfoText>
                </InfoBox>

                <ModalActions>
                  <CancelButton onClick={() => {
                    setShowExtendModal(false);
                    setPaymentUrl(null);
                    setExtendChannelId(null);
                    setExtendDays(30);
                    setExtendChannelName('');
                  }}>
                    Закрыть
                  </CancelButton>
                  <PaymentButton onClick={handleGoToPayment}>
                    💳 Перейти к оплате
                  </PaymentButton>
                </ModalActions>
              </>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </SettingsContainer>
  );
};

const SettingsContainer = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: 100%;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Description = styled.p`
  color: #666;
  font-size: 14px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const StatCard = styled.div<{ warning?: boolean }>`
  background: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  ${props => props.warning && `
    background: #fff7e6;
    border: 1px solid #ffd666;
  `}
`;

const StatValue = styled.div<{ warning?: boolean }>`
  font-size: 32px;
  font-weight: bold;
  color: ${props => props.warning ? '#faad14' : '#333'};
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #666;
`;

const NumbersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const NumberCard = styled.div<{ isActive: boolean; isExpired?: boolean }>`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => {
    if (props.isExpired) return '#faad14';
    if (props.isActive) return '#52c41a';
    return '#d9d9d9';
  }};
  transition: all 0.2s;
  opacity: ${props => props.isExpired ? 0.85 : 1};
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const NumberInfo = styled.div`
  flex: 1;
`;

const NumberName = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const MainBadge = styled.span`
  background: #faad14;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: normal;
`;

const StoppedBadge = styled.span`
  background: #ff4d4f;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: normal;
`;

const BlockedBadge = styled.span`
  background: #8c8c8c;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: normal;
`;

const ExpiredBadge = styled.span`
  background: #faad14;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: normal;
`;

const PhoneNumber = styled.div`
  font-size: 14px;
  color: #666;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch(props.status) {
      case 'connected': return '#e6f7e6';
      case 'connecting': return '#fff7e6';
      case 'disconnected': return '#f5f5f5';
      case 'expired': return '#fff7e6';
      default: return '#fff2f0';
    }
  }};
  color: ${props => {
    switch(props.status) {
      case 'connected': return '#52c41a';
      case 'connecting': return '#faad14';
      case 'disconnected': return '#999';
      case 'expired': return '#faad14';
      default: return '#ff4d4f';
    }
  }};
`;

const CardContent = styled.div`
  margin-bottom: 20px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const InfoLabel = styled.span`
  font-size: 13px;
  min-width: 130px;
  color: #666;
`;

const InfoValue = styled.span<{ expired?: boolean }>`
  font-size: 14px;
  color: ${props => props.expired ? '#ff4d4f' : '#333'};
  font-weight: ${props => props.expired ? '500' : 'normal'};
`;

const WarningRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px;
  background: #fff7e6;
  border-radius: 6px;
  border: 1px solid #ffd666;
`;

const WarningIcon = styled.span`
  font-size: 16px;
`;

const WarningText = styled.span`
  font-size: 13px;
  color: #d48806;
  flex: 1;
`;

const EmployeesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
`;

const EmployeeBadge = styled.span`
  background: #f0f0f0;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  color: #666;
`;

const EditButton = styled.button`
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const EmptyText = styled.span`
  color: #999;
  font-size: 13px;
`;

const CardActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 550px;
  max-width: 90%;
  overflow-y: auto;
  padding: 24px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  
  &:hover {
    color: #333;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  text-align: left;
`;

const Hint = styled.div`
  font-size: 12px;
  color: #999;
  margin-top: 4px;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 20px;
  color: #999;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const CancelButton = styled.button`
  padding: 8px 20px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  
  &:hover {
    border-color: #1890ff;
    color: #1890ff;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ConfirmButton = styled.button`
  padding: 8px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  
  &:hover {
    background: #40a9ff;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PaymentButton = styled.button`
  padding: 8px 20px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #73d13d;
  }
`;

const EmployeesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
`;

const EmployeeCheckbox = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid ${props => props.active ? 'rgba(0, 125, 136, 1)' : '#e8e8e8'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;

  &:hover {
    border-color: rgba(0, 125, 136, 1);
  }
`;

const CheckIcon = styled.div<{ active: boolean }>`
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.active ? 'rgba(0, 125, 136, 1)' : '#d9d9d9'};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.active ? 'rgba(0, 125, 136, 1)' : 'transparent'};
  font-weight: bold;
`;

const EmployeeInfo = styled.div`
  flex: 1;
`;

const EmployeeName = styled.div`
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
`;

const EmployeePosition = styled.div`
  font-size: 12px;
  color: #999;
`;

const InfoBox = styled.div`
  border: 1px solid rgba(0, 125, 136, 1);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  margin: 20px 0;
`;

const InfoIcon = styled.div`
  font-size: 20px;
`;

const InfoText = styled.div`
  flex: 1;
  font-size: 13px;
  color: black;
  line-height: 1.5;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  margin-top: 20px;
`;

const EmptyTitle = styled.h3`
  font-size: 20px;
  color: #333;
  margin-bottom: 12px;
`;

const EmptyDescription = styled.p`
  color: #999;
  font-size: 14px;
`;

const DaysSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 8px;
`;

const DayOption = styled.div<{ selected: boolean; disabled: boolean }>`
  padding: 16px;
  border: 2px solid ${props => props.selected ? '#1890ff' : '#e8e8e8'};
  border-radius: 8px;
  text-align: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  background: ${props => props.selected ? '#f0f9ff' : 'white'};
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    border-color: ${props => props.disabled ? '#e8e8e8' : '#1890ff'};
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
  }
`;

const DaysValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`;

const DaysPrice = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #faad14;
`;

const DaysDiscount = styled.div`
  position: absolute;
  top: -10px;
  right: -10px;
  background: #52c41a;
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
`;

const PriceSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 20px 0;
`;

const SummaryText = styled.div`
  font-size: 16px;
  color: #666;
`;

const SummaryPrice = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #faad14;
`;

const PaymentLinkContainer = styled.div`
  margin: 20px 0;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  word-break: break-all;
`;

const PaymentLinkLabel = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
`;

const PaymentLinkValue = styled.div`
  font-size: 12px;
  color: #1890ff;
  font-family: monospace;
`;

const QRContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const QRCodeImage = styled.img`
  width: 250px;
  height: 250px;
  margin-bottom: 24px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
`;

const QRInstruction = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  background: #f5f5f5;
  border-radius: 8px;
`;

const StepIcon = styled.div`
  width: 28px;
  height: 28px;
  background: rgba(102, 177, 184, 1);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
`;

const StepText = styled.div`
  flex: 1;
  font-size: 14px;
  color: #333;
`;

const SuccessMessage = styled.div`
  margin-top: 16px;
  padding: 12px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
  color: #52c41a;
  font-weight: 500;
  text-align: center;
`;

const ErrorMessage = styled.div`
  margin-top: 16px;
  padding: 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  color: #ff4d4f;
  font-weight: 500;
  text-align: center;
`;

export default WhatsAppSettingsPage;