import PageLayout from '../../components/ui/Layouts/PageLayout';
import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Checkbox from '../../components/ui/CheckBoxes/Checkbox';
import CustomSelect from '../../components/ui/fields/CustomSelect';
import CustomTitle from '../../components/ui/Text/CustomTitle';
import ModalInfoTitle from '../../components/ui/Text/ModalInfoTitle';
import DarkCyanButton from '../../components/ui/Buttons/DarkCyanButton';
import { Divider } from 'antd';
import useSender from '../../api/hooks/useSender';
import { DateDirection, TextPatternType } from '../../api/types/sender';
import TitleField from '../../components/ui/Layouts/TitleLayout';
import DefaultContainer, { DefaultGrid, Row } from '../../components/ui/containers/defaultContainer';

interface SenderSettings {
  enabled: boolean;
  // До платежа
  paymentDay: boolean;
  dayBeforePayment: boolean;
  threeDaysBefore: boolean;
  paymentDayActual: boolean;
  
  // После платежа (просрочка)
  overdueDay: boolean;
  overdueThreeDays: boolean;
  overdueWeek: boolean;
  overdueTwoWeeks: boolean; 
  overdueMonth: boolean; 
  overdueTwoMonths: boolean;
  
  messageBalance: number;
  autoPurchase: boolean;
  
  upcomingPaymentText: string;
  overduePaymentText: string;
  accountDetails: string;
  licenceDays: number;
}

const SenderPage = () => {
  const {
    isLoading,
    error,
    GetMyCompanySenderInfo,
    ToggleSenderActivity,
    ToggleShouldAutoBuy,
    SetSenderTextPattern,
    CreateNewSenderSetting,
    DeleteSenderSetting,
    BuyMessages
  } = useSender();

  const [settings, setSettings] = useState<SenderSettings>({
    enabled: true,
    paymentDay: true,
    dayBeforePayment: true,
    threeDaysBefore: false,
    paymentDayActual: false,
    overdueDay: true,
    overdueThreeDays: true,
    overdueWeek: true,
    overdueTwoWeeks: false,
    overdueMonth: false,
    overdueTwoMonths: false,
    messageBalance: 0,
    autoPurchase: false,
    upcomingPaymentText: '',
    overduePaymentText: '',
    accountDetails: '',
    licenceDays: 0
  });

  const [purchaseDays, setPurchaseDays] = useState<number>(1);
  const [senderSettings, setSenderSettings] = useState<any[]>([]);
  const [textChanged, setTextChanged] = useState({ upcoming: false, overdue: false });

  useEffect(() => {
    loadSenderData();
  }, []);

  const loadSenderData = async () => {
    const data = await GetMyCompanySenderInfo();
    if (data) {
      setSettings(prev => ({
        ...prev,
        enabled: data.isSenderTurnedOn,
        autoPurchase: data.shouldAutoBuyMessages,
        messageBalance: data.messagesCount,
        upcomingPaymentText: data.comingPaymentContent?.toString() || prev.upcomingPaymentText,
        overduePaymentText: data.overduePaymentContent?.toString() || prev.overduePaymentText,
        accountDetails: data.currentAccountDetails,
        licenceDays: data.licenceDays
      }));

      const apiSettings = data.senderSettingResponses || [];
      setSenderSettings(apiSettings);

      updateCheckboxesFromApi(apiSettings);
    }
  };

  const updateCheckboxesFromApi = (apiSettings: any[]) => {
    const newSettings = {
      paymentDay: false,
      dayBeforePayment: false,
      threeDaysBefore: false,
      paymentDayActual: false,
      overdueDay: false,
      overdueThreeDays: false,
      overdueWeek: false,
      overdueTwoWeeks: false,
      overdueMonth: false,
      overdueTwoMonths: false
    };

    apiSettings.forEach(setting => {
      if (setting.direction === "Before" || setting.direction === DateDirection.Before) {
        switch (setting.days) {
          case 7:
            newSettings.paymentDay = true;
            break;
          case 3:
            newSettings.dayBeforePayment = true;
            break;
          case 1:
            newSettings.threeDaysBefore = true;
            break;
          case 0:
            newSettings.paymentDayActual = true;
            break;
        }
      } else if (setting.direction === "After" || setting.direction === DateDirection.After) {
        switch (setting.days) {
          case 1:
            newSettings.overdueDay = true;
            break;
          case 3:
            newSettings.overdueThreeDays = true;
            break;
          case 7:
            newSettings.overdueWeek = true;
            break;
          case 14:
            newSettings.overdueTwoWeeks = true;
            break;
          case 30:
            newSettings.overdueMonth = true;
            break;
          case 60:
            newSettings.overdueTwoMonths = true;
            break;
        }
      }
    });

    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleSettingChange = async (key: keyof SenderSettings, value: any) => {
    const checkboxKeys = [
      'paymentDay', 'dayBeforePayment', 'threeDaysBefore', 'paymentDayActual',
      'overdueDay', 'overdueThreeDays', 'overdueWeek', 'overdueTwoWeeks', 
      'overdueMonth', 'overdueTwoMonths'
    ];
    
    if (checkboxKeys.includes(key)) {
      await handleSenderSettingChange(key, value);
    } 
    else if (key === 'autoPurchase') {
      await ToggleShouldAutoBuy();
      setSettings(prev => ({ ...prev, [key]: value }));
    }
    else {
      setSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSenderSettingChange = async (key: string, value: boolean) => {
    const settingConfig = getSettingConfig(key);
    if (!settingConfig) return;

    if (value) {
      await CreateNewSenderSetting({
        days: settingConfig.days,
        direction: settingConfig.direction
      });
    } else {
      const existingSetting = senderSettings.find(setting => 
        setting.days === settingConfig.days && 
        setting.direction === settingConfig.direction
      );
      
      console.log('Searching for setting:', settingConfig);
      console.log('Available settings:', senderSettings);
      console.log('Found setting:', existingSetting);
      
      if (existingSetting && existingSetting.id) {
        await DeleteSenderSetting(existingSetting.id);
      } else {
        console.warn('Setting not found for deletion:', settingConfig);
      }
    }

    await loadSenderData();
  };

  const getSettingConfig = (key: string) => {
    const configs: { [key: string]: { days: number; direction: string } } = {
      paymentDay: { days: 7, direction: 'Before' },
      dayBeforePayment: { days: 3, direction: 'Before' },
      threeDaysBefore: { days: 1, direction: 'Before' },
      paymentDayActual: { days: 0, direction: 'Before' },
      overdueDay: { days: 1, direction: 'After' },
      overdueThreeDays: { days: 3, direction: 'After' },
      overdueWeek: { days: 7, direction: 'After' },
      overdueTwoWeeks: { days: 14, direction: 'After' },
      overdueMonth: { days: 30, direction: 'After' },
      overdueTwoMonths: { days: 60, direction: 'After' }
    };
    return configs[key];
  };

  const saveTextPattern = async (key: 'upcomingPaymentText' | 'overduePaymentText', value: string) => {
    const patternType = key === 'upcomingPaymentText' ? TextPatternType.ComingPayment : TextPatternType.OverduePayment;
    
    try {
      await SetSenderTextPattern({
        newText: value,
        patternType: patternType
      });
      console.log(`${key} saved successfully`);
      
      setTextChanged(prev => ({ 
        ...prev, 
        [key === 'upcomingPaymentText' ? 'upcoming' : 'overdue']: false 
      }));
    } catch (error) {
      console.error('Error saving text pattern:', error);
    }
  };

  const handleTextChange = (key: 'upcomingPaymentText' | 'overduePaymentText', value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setTextChanged(prev => ({ 
      ...prev, 
      [key === 'upcomingPaymentText' ? 'upcoming' : 'overdue']: true 
    }));
  };

  const handleSaveText = async (key: 'upcomingPaymentText' | 'overduePaymentText') => {
    await saveTextPattern(key, settings[key]);
  };

  const handleToggleSender = async () => {
    const confirmText = settings.enabled ? "Вы уверены, что хотите отключить рассылку?" : "Вы уверены, что хотите включить рассылку?"
    const isConfirmed = window.confirm(confirmText);
    
    if (!isConfirmed) {
      return;
    }
    
    await ToggleSenderActivity();
    await loadSenderData();
  };

  const handlePurchaseMessages = async () => {
    if (purchaseDays <= 0) return;
    
    const isConfirmed = window.confirm(
      `Вы уверены, что хотите купить сообщения за ${purchaseDays} дней лицензии?`
    );
    
    if (!isConfirmed) {
      return;
    }

    await BuyMessages(purchaseDays);
    
    await loadSenderData();
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
    { value: 1, label: '1 день - 15 сообщений' },
    { value: 5, label: '5 дней - 75 сообщений' },
    { value: 10, label: '10 дней - 150 сообщений' },
    { value: 30, label: '30 дней - 450 сообщений' }
  ];

  if (error) {
    console.error('API Error:', error);
  }

  return (
    <PageLayout>
        <TitleField>
          <CustomTitle style={{ marginTop: 0 }}>Рассылка</CustomTitle>
          <ToggleButton
            enabled={settings.enabled}
            onClick={handleToggleSender}
            disabled={isLoading}
          >
            {settings.enabled ? 'Рассылка включена' : 'Рассылка выключена'}
            <ToggleIndicator enabled={settings.enabled} />
          </ToggleButton>
        </TitleField>

        <DefaultGrid>
          <Row>
            <DefaultContainer>
              <BalanceCard>
                {/* Компактное отображение обоих балансов */}
                <BalanceInfo style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                  <div>
                    <BalanceLabel>Доступно сообщений:</BalanceLabel>
                    <BalanceAmount>{settings.messageBalance}</BalanceAmount>
                  </div>
                  <div>
                    <BalanceLabel>Доступно дней:</BalanceLabel>
                    <BalanceAmount>{settings.licenceDays}</BalanceAmount>
                  </div>
                </BalanceInfo>
                
                <PurchaseSection>
                  <PurchaseForm>
                    <FormGroup>
                      <Label>Количество дней для покупки:</Label>
                      <CustomSelect
                        value={purchaseDays}
                        onChange={(e) => setPurchaseDays(Number(e.target.value))}
                        options={purchaseOptions}
                        disabled={isLoading}
                      />
                    </FormGroup>
                    
                    <Checkbox
                      checked={settings.autoPurchase}
                      onChange={(e) => handleSettingChange('autoPurchase', e)}
                      label="Автоматически докупать сообщения при нулевом балансе"
                      disabled={isLoading}
                    />
                    
                    <DarkCyanButton
                      onClick={handlePurchaseMessages}
                      disabled={isLoading || purchaseDays <= 0}
                    >
                      {isLoading ? 'Покупка...' : `Купить на ${purchaseDays} ${purchaseDays === 1 ? 'день' : purchaseDays < 5 ? 'дня' : 'дней'}`}
                    </DarkCyanButton>
                  </PurchaseForm>
                </PurchaseSection>
              </BalanceCard>
            </DefaultContainer>

            <DefaultContainer>
              <ModalInfoTitle>Когда отправлять уведомления?</ModalInfoTitle>
              <SettingsGrid>
                {/* До платежа */}
                <Checkbox
                  checked={settings.paymentDay}
                  onChange={(e) => handleSettingChange('paymentDay', e)}
                  label="За 7 дней до платежа"
                  disabled={isLoading}
                />
                <Checkbox
                  checked={settings.dayBeforePayment}
                  onChange={(e) => handleSettingChange('dayBeforePayment', e)}
                  label="За 3 дня до платежа"
                  disabled={isLoading}
                />
                <Checkbox
                  checked={settings.threeDaysBefore}
                  onChange={(e) => handleSettingChange('threeDaysBefore', e)}
                  label="За день до платежа"
                  disabled={isLoading}
                />
                <Checkbox
                  checked={settings.paymentDayActual}
                  onChange={(e) => handleSettingChange('paymentDayActual', e)}
                  label="В день платежа"
                  disabled={isLoading}
                />

                <Divider />
                <Divider />
                
                {/* После платежа (просрочка) */}
                <Checkbox
                  checked={settings.overdueDay}
                  onChange={(e) => handleSettingChange('overdueDay', e)}
                  label="При просрочке 1 день"
                  disabled={isLoading}
                />
                <Checkbox
                  checked={settings.overdueThreeDays}
                  onChange={(e) => handleSettingChange('overdueThreeDays', e)}
                  label="При просрочке 3 дня"
                  disabled={isLoading}
                />
                <Checkbox
                  checked={settings.overdueWeek}
                  onChange={(e) => handleSettingChange('overdueWeek', e)}
                  label="При просрочке 7 дней"
                  disabled={isLoading}
                />
                <Checkbox
                  checked={settings.overdueTwoWeeks}
                  onChange={(e) => handleSettingChange('overdueTwoWeeks', e)}
                  label="При просрочке 14 дней"
                  disabled={isLoading}
                />
                <Checkbox
                  checked={settings.overdueMonth}
                  onChange={(e) => handleSettingChange('overdueMonth', e)}
                  label="При просрочке 30 дней"
                  disabled={isLoading}
                />
                <Checkbox
                  checked={settings.overdueTwoMonths}
                  onChange={(e) => handleSettingChange('overdueTwoMonths', e)}
                  label="При просрочке 60 дней"
                  disabled={isLoading}
                />
              </SettingsGrid>
            </DefaultContainer>
          </Row>

          <Row>
            <DefaultContainer>
              <MessageHeader>
                <ModalInfoTitle>Текст для приближающегося платежа</ModalInfoTitle>
                  <VariableButtons>
                    <VariableButton 
                      onClick={() => insertVariable('upcomingPaymentText', 'amount')}
                      disabled={isLoading}
                    >
                      Сумма
                    </VariableButton>
                    <VariableButton 
                      onClick={() => insertVariable('upcomingPaymentText', 'date')}
                      disabled={isLoading}
                    >
                      Дата
                    </VariableButton>
                    <VariableButton 
                      onClick={() => insertVariable('upcomingPaymentText', 'accountDetails')}
                      disabled={isLoading}
                    >
                      Карта
                    </VariableButton>
                  </VariableButtons>
                  <DarkCyanButton
                    onClick={() => handleSaveText('upcomingPaymentText')}
                    disabled={isLoading || !textChanged.upcoming}
                  >
                    Сохранить
                  </DarkCyanButton>
              </MessageHeader>
              
              <MessageTextarea
                id="upcomingPaymentText"
                value={settings.upcomingPaymentText}
                onChange={(e) => handleTextChange('upcomingPaymentText', e.target.value)}
                rows={4}
                placeholder="Введите текст сообщения для приближающегося платежа..."
                disabled={isLoading}
              />
              
              <MessagePreview>
                <PreviewLabel>Предпросмотр:</PreviewLabel>
                <PreviewText>
                  {settings.upcomingPaymentText
                    .replace(/\{\{amount\}\}/g, '15 000₽')
                    .replace(/\{\{date\}\}/g, '15.12.2024')
                    .replace(/\{\{accountDetails\}\}/g, `${settings.accountDetails}`)}
                </PreviewText>
              </MessagePreview>
            </DefaultContainer>

            <DefaultContainer>
              <MessageHeader>
                <ModalInfoTitle>Текст для просрочки платежа</ModalInfoTitle>
                  <VariableButtons>
                    <VariableButton 
                      onClick={() => insertVariable('overduePaymentText', 'amount')}
                      disabled={isLoading}
                    >
                      Сумма
                    </VariableButton>
                    <VariableButton 
                      onClick={() => insertVariable('overduePaymentText', 'date')}
                      disabled={isLoading}
                    >
                      Дата
                    </VariableButton>
                    <VariableButton 
                      onClick={() => insertVariable('overduePaymentText', 'accountDetails')}
                      disabled={isLoading}
                    >
                      Карта
                    </VariableButton>
                  </VariableButtons>
                  <DarkCyanButton 
                    onClick={() => handleSaveText('overduePaymentText')}
                    disabled={isLoading || !textChanged.overdue}
                  >
                    Сохранить
                  </DarkCyanButton>
              </MessageHeader>
              
              <MessageTextarea
                id="overduePaymentText"
                value={settings.overduePaymentText}
                onChange={(e) => handleTextChange('overduePaymentText', e.target.value)}
                rows={4}
                placeholder="Введите текст сообщения для просрочки платежа..."
                disabled={isLoading}
              />
              
              <MessagePreview>
                <PreviewLabel>Предпросмотр:</PreviewLabel>
                <PreviewText>
                  {settings.overduePaymentText
                    .replace(/\{\{amount\}\}/g, '1,500')
                    .replace(/\{\{date\}\}/g, '15.12.2024')
                    .replace(/\{\{accountDetails\}\}/g, `${settings.accountDetails}`)}
                </PreviewText>
              </MessagePreview>
            </DefaultContainer>
          </Row>
        </DefaultGrid>
    </PageLayout>
  );
};

export default SenderPage;

const ToggleButton = styled.button<{ enabled: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
  background-color: ${props => props.enabled ? '#10b981' : 'rgba(173, 179, 188, 1)'};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 20px;

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
  padding-left: 5px;
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

const VariableButton = styled.button<{ disabled?: boolean }>`
  background-color: #e5e7eb;
  color: #374151;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 12px;
  font-weight: 500;
  opacity: ${props => props.disabled ? 0.6 : 1};

  &:hover:not(:disabled) {
    background-color: #d1d5db;
  }
`;

const MessageTextarea = styled.textarea<{ disabled?: boolean }>`
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  color: black;
  background-color: white;
  opacity: ${props => props.disabled ? 0.6 : 1};
  cursor: ${props => props.disabled ? 'not-allowed' : 'text'};
  box-sizing: border-box;

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