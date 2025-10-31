import PageLayout from '../../components/ui/Layouts/PageLayout';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import CustomInput from '../../components/ui/fields/CustomInput';
import Checkbox from '../../components/ui/CheckBoxes/Checkbox';
import CustomSelect from '../../components/ui/fields/CustomSelect';
import CustomTitle from '../../components/ui/Text/CustomTitle';
import ModalInfoTitle from '../../components/ui/Text/ModalInfoTitle';
import DarkCyanButton from '../../components/ui/Buttons/DarkCyanButton';
import { Divider } from 'antd';

interface SenderSettings {
  enabled: boolean;
  paymentDay: boolean;
  dayBeforePayment: boolean;
  threeDaysBefore: boolean;
  overdueDay: boolean;
  overdueThreeDays: boolean;
  overdueWeek: boolean;
  
  messageBalance: number;
  autoPurchase: boolean;
  
  upcomingPaymentText: string;
  overduePaymentText: string;
}

const SenderPage = () => {
  const [settings, setSettings] = useState<SenderSettings>({
    enabled: true,
    paymentDay: true,
    dayBeforePayment: true,
    threeDaysBefore: false,
    overdueDay: true,
    overdueThreeDays: true,
    overdueWeek: true,
    messageBalance: 100,
    autoPurchase: false,
    upcomingPaymentText: 'Уважаемый клиент! Напоминаем, что {{сумма}} руб. к оплате {{дата}}. Карта: {{карта}}.',
    overduePaymentText: 'Уважаемый клиент! Просрочка платежа {{сумма}} руб. от {{дата}}. Карта: {{карта}}. Срочно оплатите!'
  });

  const [purchaseAmount, setPurchaseAmount] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('senderSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('senderSettings', JSON.stringify(settings));
  }, [settings]);

  const handleSettingChange = (key: keyof SenderSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTextChange = (key: 'upcomingPaymentText' | 'overduePaymentText', value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleToggleSender = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSettings(prev => ({
        ...prev,
        enabled: !prev.enabled
      }));
    } catch (error) {
      console.error('Ошибка при переключении рассылки:', error);
      alert('Ошибка при переключении рассылки');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseMessages = async () => {
    if (purchaseAmount <= 0) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSettings(prev => ({
        ...prev,
        messageBalance: prev.messageBalance + purchaseAmount
      }));
      
      setPurchaseAmount(100);
      alert(`Успешно приобретено ${purchaseAmount} сообщений!`);
    } catch (error) {
      console.error('Ошибка при покупке сообщений:', error);
      alert('Ошибка при покупке сообщений');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      alert('Настройки успешно сохранены!');
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error);
      alert('Ошибка при сохранении настроек');
    } finally {
      setIsLoading(false);
    }
  };

  const insertVariable = (textKey: 'upcomingPaymentText' | 'overduePaymentText', variable: string) => {
    const textarea = document.getElementById(textKey) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const variableText = `{{${variable}}}`;
    
    const newText = textarea.value.substring(0, start) + variableText + textarea.value.substring(end);
    handleTextChange(textKey, newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableText.length, start + variableText.length);
    }, 0);
  };

  const purchaseOptions = [
    { value: 15, label: '15 сообщений - 1 день' },
    { value: 75, label: '75 сообщений - 5 дней' },
    { value: 150, label: '150 сообщений - 10 дней' },
    { value: 450, label: '450 сообщений - 30 дней' }
  ];

  return (
    <PageLayout>
        <HeaderRow>
          <CustomTitle style={{ marginTop: 0 }}>Рассылка</CustomTitle>
          <ToggleButton
            enabled={settings.enabled}
            onClick={handleToggleSender}
            disabled={isLoading}
          >
            {settings.enabled ? 'Рассылка включена' : 'Рассылка выключена'}
            <ToggleIndicator enabled={settings.enabled} />
          </ToggleButton>
        </HeaderRow>

        <SettingsContainer>
          <TopRow>
            <SettingsSection>
              <ModalInfoTitle>Когда отправлять уведомления?</ModalInfoTitle>
              <SettingsGrid>
                <Checkbox
                  checked={settings.paymentDay}
                  onChange={(e) => handleSettingChange('paymentDay', e)}
                  label="За 7 дней до платежа"
                />
                <Checkbox
                  checked={settings.dayBeforePayment}
                  onChange={(e) => handleSettingChange('dayBeforePayment', e)}
                  label="За 3 дня до платежа"
                />
                <Checkbox
                  checked={settings.threeDaysBefore}
                  onChange={(e) => handleSettingChange('threeDaysBefore', e)}
                  label="За день до платежа"
                />
                <Checkbox
                  checked={settings.threeDaysBefore}
                  onChange={(e) => handleSettingChange('threeDaysBefore', e)}
                  label="В день платежа"
                />

                <Divider />
                <Divider />
                
                <Checkbox
                  checked={settings.overdueDay}
                  onChange={(e) => handleSettingChange('overdueDay', e)}
                  label="При просрочке 1 день"
                />
                <Checkbox
                  checked={settings.overdueThreeDays}
                  onChange={(e) => handleSettingChange('overdueThreeDays', e)}
                  label="При просрочке 3 дня"
                />
                <Checkbox
                  checked={settings.overdueWeek}
                  onChange={(e) => handleSettingChange('overdueWeek', e)}
                  label="При просрочке 7 дней"
                />
                <Checkbox
                  checked={settings.overdueWeek}
                  onChange={(e) => handleSettingChange('overdueWeek', e)}
                  label="При просрочке 14 дней"
                />
                <Checkbox
                  checked={settings.overdueWeek}
                  onChange={(e) => handleSettingChange('overdueWeek', e)}
                  label="При просрочке 30 дней"
                />
                <Checkbox
                  checked={settings.overdueWeek}
                  onChange={(e) => handleSettingChange('overdueWeek', e)}
                  label="При просрочке 60 дней"
                />
              </SettingsGrid>
            </SettingsSection>

            <SettingsSection>
              <BalanceCard>
                <BalanceInfo>
                  <BalanceLabel>Доступно сообщений:</BalanceLabel>
                  <BalanceAmount>{settings.messageBalance}</BalanceAmount>
                </BalanceInfo>
                
                <PurchaseSection>
                  <PurchaseForm>
                    <FormGroup>
                      <Label>Количество сообщений для покупки:</Label>
                      <CustomSelect
                        value={purchaseAmount}
                        onChange={(value) => setPurchaseAmount(Number(value))}
                        options={purchaseOptions}
                      />
                    </FormGroup>
                    
                    <Checkbox
                      checked={settings.autoPurchase}
                      onChange={(e) => handleSettingChange('autoPurchase', e)}
                      label="Автоматически докупать сообщения при нулевом балансе"
                    />
                    
                    <DarkCyanButton
                      onClick={handlePurchaseMessages}
                      disabled={isLoading || purchaseAmount <= 0}
                    >
                      {isLoading ? 'Покупка...' : `Купить`}
                    </DarkCyanButton>
                  </PurchaseForm>
                </PurchaseSection>
              </BalanceCard>
            </SettingsSection>
          </TopRow>

          {/* Второй ряд: Шаблоны сообщений */}
          <BottomRow>
            <MessageSection>
              <MessageHeader>
                <ModalInfoTitle>Текст для приближающегося платежа</ModalInfoTitle>
                <VariableButtons>
                  <VariableButton onClick={() => insertVariable('upcomingPaymentText', 'сумма')}>
                    Сумма
                  </VariableButton>
                  <VariableButton onClick={() => insertVariable('upcomingPaymentText', 'дата')}>
                    Дата
                  </VariableButton>
                  <VariableButton onClick={() => insertVariable('upcomingPaymentText', 'карта')}>
                    Карта
                  </VariableButton>
                </VariableButtons>
              </MessageHeader>
              
              <MessageTextarea
                id="upcomingPaymentText"
                value={settings.upcomingPaymentText}
                onChange={(e) => handleTextChange('upcomingPaymentText', e.target.value)}
                rows={4}
                placeholder="Введите текст сообщения для приближающегося платежа..."
              />
              
              <MessagePreview>
                <PreviewLabel>Предпросмотр:</PreviewLabel>
                <PreviewText>
                  {settings.upcomingPaymentText
                    .replace('{{сумма}}', '1,500')
                    .replace('{{дата}}', '15.12.2024')
                    .replace('{{карта}}', '**** 1234')}
                </PreviewText>
              </MessagePreview>
            </MessageSection>

            <MessageSection>
              <MessageHeader>
                <ModalInfoTitle>Текст для просрочки платежа</ModalInfoTitle>
                <VariableButtons>
                  <VariableButton onClick={() => insertVariable('overduePaymentText', 'сумма')}>
                    Сумма
                  </VariableButton>
                  <VariableButton onClick={() => insertVariable('overduePaymentText', 'дата')}>
                    Дата
                  </VariableButton>
                  <VariableButton onClick={() => insertVariable('overduePaymentText', 'карта')}>
                    Карта
                  </VariableButton>
                </VariableButtons>
              </MessageHeader>
              
              <MessageTextarea
                id="overduePaymentText"
                value={settings.overduePaymentText}
                onChange={(e) => handleTextChange('overduePaymentText', e.target.value)}
                rows={4}
                placeholder="Введите текст сообщения для просрочки платежа..."
              />
              
              <MessagePreview>
                <PreviewLabel>Предпросмотр:</PreviewLabel>
                <PreviewText>
                  {settings.overduePaymentText
                    .replace('{{сумма}}', '1,500')
                    .replace('{{дата}}', '15.12.2024')
                    .replace('{{карта}}', '**** 1234')}
                </PreviewText>
              </MessagePreview>
            </MessageSection>
          </BottomRow>
        </SettingsContainer>
    </PageLayout>
  );
};

export default SenderPage;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const ToggleButton = styled.button<{ enabled: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background-color: ${props => props.enabled ? '#10b981' : 'rgba(173, 179, 188, 1)'};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.enabled ? '#059669' : 'rgba(173, 179, 180, 1)'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ToggleIndicator = styled.div<{ enabled: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: white;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
`;

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const TopRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const BottomRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const SettingsSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  height: fit-content;
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const BalanceCard = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e2e8f0;
`;

const BalanceInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
`;

const BalanceLabel = styled.span`
  font-size: 16px;
  color: #374151;
  font-weight: 500;
`;

const BalanceAmount = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: #007D88;
`;

const PurchaseSection = styled.div`
  margin-top: 16px;
`;

const PurchaseForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const MessageSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  height: fit-content;
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
`;

const VariableButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const VariableButton = styled.button`
  background-color: #e5e7eb;
  color: #374151;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;

  &:hover {
    background-color: #d1d5db;
  }
`;

const MessageTextarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  color: black;
  background-color: white;

  &:focus {
    outline: none;
    border-color: #007D88;
    box-shadow: 0 0 0 3px rgba(0, 125, 136, 0.1);
  }
`;

const MessagePreview = styled.div`
  margin-top: 12px;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
`;

const PreviewLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
  font-weight: 500;
`;

const PreviewText = styled.div`
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
`;