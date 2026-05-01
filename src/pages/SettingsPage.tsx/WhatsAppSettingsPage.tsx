import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import CustomTitle from '../../components/ui/Text/CustomTitle';
import useWhatsApp from '../../api/hooks/useWhatsApp';
import { useEmployee } from '../../api/hooks/useEmployee';
import DarkCyanButton from '../../components/ui/Buttons/DarkCyanButton';
import GrayButton from '../../components/ui/Buttons/GrayButton';
import CustomInput from '../../components/ui/fields/CustomInput';
import type { ChannelResponse } from '../../api/types/whatsapp';

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

  const [whatsAppNumbers, setWhatsAppNumbers] = useState<ChannelResponse[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<ChannelResponse | null>(null);
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

  const loadChannels = async () => {
    const result = await getChannels();
    if (result && result.length > 0) {
      setWhatsAppNumbers(result);
    } else {
      setWhatsAppNumbers([]);
    }
  };

  // Проверка можно ли выполнить действие с каналом
  const canPerformAction = (number: ChannelResponse): boolean => {
    if (number.stopped) {
      alert('Невозможно выполнить действие: канал остановлен');
      return false;
    }
    if (number.blocked) {
      alert('Невозможно выполнить действие: канал заблокирован');
      return false;
    }
    if (isSubscriptionExpired(number.activeTill)) {
      alert('Невозможно выполнить действие: подписка истекла. Необходимо продлить подписку');
      return false;
    }
    return true;
  };

  const handleLogin = async (numberId: string, numberName: string) => {
    const number = whatsAppNumbers.find(n => n.id === numberId);
    if (number && !canPerformAction(number)) return;

    setIsLoggingIn(numberId);
    try {
      const qrResult = await getQR(numberId);
      if (qrResult && qrResult.qrString) {
        setQrCode(qrResult.qrString);
        setQrStatus(qrResult.status);
        setSelectedNumber(number);
        setShowQRModal(true);
        
        pollConnectionStatus(numberId);
      } else {
        alert('Попробуйте снова через 10 секунд!');
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

  const handleDisconnectNumber = async (numberId: string) => {
    const number = whatsAppNumbers.find(n => n.id === numberId);
    if (number && isSubscriptionExpired(number.activeTill)) {
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
      const url = await extendChannel(extendDays, extendChannelId);
      
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
      const success = await setChannelEmployees(selectedNumber.id, selectedNumber.employeeIds);
      
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

  // Определяем, показывать ли кнопку подключения
  const shouldShowConnectButton = (channel: ChannelResponse): boolean => {
    const subscriptionExpired = isSubscriptionExpired(channel.activeTill);
    if (subscriptionExpired) return false;
    
    // Показываем кнопку "Подключить" если статус Disconnected и не истекла подписка
    return channel.status === 'Disconnected' && !channel.stopped && !channel.blocked;
  };

  // Определяем, показывать ли кнопку выхода
  const shouldShowLogoutButton = (channel: ChannelResponse): boolean => {
    const subscriptionExpired = isSubscriptionExpired(channel.activeTill);
    if (subscriptionExpired) return false;
    
    // Показываем кнопку "Выйти" если статус Connected и не истекла подписка
    return channel.status === 'Connected' && !channel.stopped && !channel.blocked;
  };

  // Определяем, активен ли канал для управления
  const isChannelActive = (channel: ChannelResponse): boolean => {
    const subscriptionExpired = isSubscriptionExpired(channel.activeTill);
    return !subscriptionExpired && !channel.stopped && !channel.blocked;
  };

  // Форматирование номера телефона для отображения
  const formatPhoneNumber = (phone: string | undefined): string => {
    if (!phone) return '';
    // Убираем знак + если есть и форматируем
    let cleanPhone = phone.replace(/\+/g, '');
    if (cleanPhone.length === 11) {
      return `+${cleanPhone[0]} (${cleanPhone.slice(1, 4)}) ${cleanPhone.slice(4, 7)}-${cleanPhone.slice(7, 9)}-${cleanPhone.slice(9, 11)}`;
    }
    return `+${cleanPhone}`;
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
            const employeeNames = getEmployeeNames(number.employeeIds);
            const subscriptionExpired = isSubscriptionExpired(number.activeTill);
            const channelActive = isChannelActive(number);
            const formattedPhone = formatPhoneNumber(number.phone);
            
            return (
              <NumberCard key={number.id} isActive={!subscriptionExpired} isExpired={subscriptionExpired}>
                <CardHeader>
                  <NumberInfo>
                    <NumberName>
                      {number.name}
                      {number.isCurrent && <MainBadge>Ваш текущий</MainBadge>}
                      {number.stopped && <StoppedBadge>Остановлен</StoppedBadge>}
                      {number.blocked && <BlockedBadge>Заблокирован</BlockedBadge>}
                      {subscriptionExpired && <ExpiredBadge>Подписка истекла</ExpiredBadge>}
                      {number.status === 'Connected' && <ConnectedBadge>Подключен</ConnectedBadge>}
                      {number.status === 'Disconnected' && !subscriptionExpired && <DisconnectedBadge>Не подключен</DisconnectedBadge>}
                    </NumberName>
                    {formattedPhone && (
                      <PhoneNumberDisplay>
                        {formattedPhone}
                      </PhoneNumberDisplay>
                    )}
                  </NumberInfo>
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
                    {channelActive && (
                      <GrayButton onClick={() => {
                        setSelectedNumber({
                          ...number
                        });
                        setShowAssignModal(true);
                      }}>
                        Назначить
                      </GrayButton>
                    )}
                  </InfoRow>

                  {number.activeTill && (
                    <InfoRow>
                      <InfoLabel>Подписка до:</InfoLabel>
                      <InfoValue expired={subscriptionExpired}>
                        {formatExpiryDate(number.activeTill)}
                      </InfoValue>
                    </InfoRow>
                  )}
                </CardContent>

                <CardActions>
                  {/* Кнопка подключения - показываем только если статус Disconnected и подписка активна */}
                  {shouldShowConnectButton(number) && (
                    <DarkCyanButton
                      onClick={() => handleLogin(number.id, number.name)}
                      disabled={isLoggingIn === number.id || isLoggingOut === number.id}
                    >
                      {isLoggingIn === number.id ? 'Получение QR...' : 'Подключить'}
                    </DarkCyanButton>
                  )}

                  {/* Кнопка выхода - показываем только если статус Connected и подписка активна */}
                  {shouldShowLogoutButton(number) && (
                    <GrayButton 
                      onClick={() => handleLogout(number.id, number.name)}
                      disabled={isLoggingIn === number.id || isLoggingOut === number.id}
                    >
                      {isLoggingOut === number.id ? 'Выход...' : 'Выйти'}
                    </GrayButton>
                  )}

                  {/* Кнопка продления - всегда активна, даже если подписка истекла */}
                  <DarkCyanButton 
                    onClick={() => handleExtendSubscription(number.id, number.name)}
                  >
                    Продлить
                  </DarkCyanButton>
                  
                  {/* Кнопка "Сделать основным" - только для активных каналов */}
                  {channelActive && number.status === 'Connected' && (
                    <DarkCyanButton onClick={() => handleSetMainNumber(number.id)}>
                      Сделать основным
                    </DarkCyanButton>
                  )}
                  
                  {/* Кнопка удаления - всегда доступна */}
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

      {/* Modal для добавления канала */}
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
            </FormGroup>

            <ModalActions>
              <GrayButton onClick={() => !isCreating && setShowAddModal(false)} disabled={isCreating}>
                Отмена
              </GrayButton>
              <DarkCyanButton onClick={handleAddNumber} disabled={isCreating || newNumber.assignedTo.length === 0}>
                {isCreating ? 'Создание...' : 'Создать канал'}
              </DarkCyanButton>
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
                      active={selectedNumber.employeeIds.includes(emp.id)}
                      onClick={() => {
                        setSelectedNumber({
                          ...selectedNumber,
                          employeeIds: selectedNumber.employeeIds.includes(emp.id)
                            ? selectedNumber.employeeIds.filter(id => id !== emp.id)
                            : [...selectedNumber.employeeIds, emp.id]
                        });
                      }}
                    >
                      <CheckIcon active={selectedNumber.employeeIds.includes(emp.id)}>
                        {selectedNumber.employeeIds.includes(emp.id) && '✓'}
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
                      <DaysPrice>3000 ₽</DaysPrice>
                    </DayOption>
                    <DayOption 
                      selected={extendDays === 365}
                      onClick={() => setExtendDays(365)}
                      disabled={isExtending}
                    >
                      <DaysValue>365 дней</DaysValue>
                      <DaysPrice>12000 ₽</DaysPrice>
                    </DayOption>
                  </DaysSelector>
                </FormGroup>

                <ModalActions>
                  <GrayButton onClick={() => setShowExtendModal(false)} disabled={isExtending}>
                    Отмена
                  </GrayButton>
                  <DarkCyanButton onClick={handleCreatePaymentLink} disabled={isExtending}>
                    {isExtending ? 'Создание платежа...' : 'Создать платеж'}
                  </DarkCyanButton>
                </ModalActions>
              </>
            ) : (
              <>
                <PaymentLinkContainer>
                  <PaymentLinkLabel>Ссылка для оплаты:</PaymentLinkLabel>
                  <PaymentLinkValue>{paymentUrl}</PaymentLinkValue>
                </PaymentLinkContainer>

                <InfoBox>
                  <InfoIcon>🔒</InfoIcon>
                  <InfoText>
                    Вы будете перенаправлены на страницу оплаты. 
                    Подписка будет активирована после оплаты и подтверждения транзакции банком.
                  </InfoText>
                </InfoBox>

                <ModalActions>
                  <GrayButton onClick={() => {
                    setShowExtendModal(false);
                    setPaymentUrl(null);
                    setExtendChannelId(null);
                    setExtendDays(30);
                    setExtendChannelName('');
                  }}>
                    Закрыть
                  </GrayButton>
                  <DarkCyanButton onClick={handleGoToPayment}>
                    Перейти к оплате
                  </DarkCyanButton>
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
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const PhoneNumberDisplay = styled.div`
  font-size: 14px;
  color: #666;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 16px;
  width: fit-content;
`;

const PhoneIcon = styled.span`
  font-size: 14px;
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

const ConnectedBadge = styled.span`
  background: #52c41a;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: normal;
`;

const DisconnectedBadge = styled.span`
  background: #8c8c8c;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: normal;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch(props.status) {
      case 'Connected': return '#e6f7e6';
      case 'Connecting': return '#fff7e6';
      case 'Disconnected': return '#f5f5f5';
      default: return '#fff2f0';
    }
  }};
  color: ${props => {
    switch(props.status) {
      case 'Connected': return '#52c41a';
      case 'Connecting': return '#faad14';
      case 'Disconnected': return '#999';
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
  text-align: left;
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
  margin-bottom: 20px;
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
  margin-right: auto;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  text-align: left;
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
  border: 2px solid ${props => props.selected ? '#128C7E' : '#e8e8e8'};
  border-radius: 8px;
  text-align: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  background: white;
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    border-color: ${props => props.disabled ? '#e8e8e8' : '#128C7E'};
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
  color: #128C7E;
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