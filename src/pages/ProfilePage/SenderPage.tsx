import PageLayout from '../../components/ui/Layouts/PageLayout';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import ModalInfoTitle from '../../components/ui/Text/ModalInfoTitle';
import DarkCyanButton from '../../components/ui/Buttons/DarkCyanButton';
import useSender from '../../api/hooks/useSender';
import { TextPatternType } from '../../api/types/sender';
import DefaultContainer from '../../components/ui/containers/defaultContainer';

interface SenderSettings {
  upcomingPaymentText: string;
  overduePaymentText: string;
}

const SenderPage = () => {
  const {
    isLoading,
    error,
    GetMyCompanySenderInfo,
    SetSenderTextPattern
  } = useSender();

  const [settings, setSettings] = useState<SenderSettings>({
    upcomingPaymentText: '',
    overduePaymentText: ''
  });

  const [textChanged, setTextChanged] = useState({ upcoming: false, overdue: false });

  useEffect(() => {
    loadSenderData();
  }, []);

  const loadSenderData = async () => {
    const data = await GetMyCompanySenderInfo();
    if (data) {
      setSettings(prev => ({
        ...prev,
        upcomingPaymentText: data.comingPaymentContent?.toString() || prev.upcomingPaymentText,
        overduePaymentText: data.overduePaymentContent?.toString() || prev.overduePaymentText
      }));
    }
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

  const insertVariable = (textKey: 'upcomingPaymentText' | 'overduePaymentText', variable: string) => {
    const textarea = document.getElementById(textKey) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const variableText = `{${variable}}`;
    
    const newText = textarea.value.substring(0, start) + variableText + textarea.value.substring(end);
    handleTextChange(textKey, newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableText.length, start + variableText.length);
    }, 0);
  };

  const variables = [
    { key: 'fullname', label: 'ФИО' },
    { key: 'company', label: 'Компания' },
    { key: 'amount', label: 'Сумма' },
    { key: 'date', label: 'Дата платежа' },
    { key: 'credit_date', label: 'Дата договора' },
    { key: 'account_details', label: 'Карта' },
    { key: 'rest', label: 'Остаток' },
    { key: 'product', label: 'Товар' },
    { key: 'payment_day', label: 'День платежа' },
    { key: 'overdue', label: 'Просрочка' },
    { key: 'support_number', label: 'Поддержка' }
  ];

  if (error) {
    console.error('API Error:', error);
  }

  return (
    <PageLayout>
      <PageContainer>
        {/* Левая колонка - Приближающийся платеж */}
        <MessageColumn>
          <DefaultContainer>
            <MessageHeader>
              <ModalInfoTitle>Текст для приближающегося платежа</ModalInfoTitle>
              <DarkCyanButton
                onClick={() => handleSaveText('upcomingPaymentText')}
                disabled={isLoading || !textChanged.upcoming}
                style={{ minWidth: '100px', flexShrink: 0 }}
              >
                {isLoading ? '...' : 'Сохранить'}
              </DarkCyanButton>
            </MessageHeader>
            
            <ContentWrapper>
              <SectionTitle>Шаблон сообщения</SectionTitle>
              <VariableSection>
                <VariableButtons>
                  {variables.map(variable => (
                    <VariableButton 
                      key={`upcoming-${variable.key}`}
                      onClick={() => insertVariable('upcomingPaymentText', variable.key)}
                      disabled={isLoading}
                      title={`Вставить {${variable.key}}`}
                    >
                      {variable.label}
                    </VariableButton>
                  ))}
                </VariableButtons>
              </VariableSection>
              
              <MessageTextarea
                id="upcomingPaymentText"
                value={settings.upcomingPaymentText}
                onChange={(e) => handleTextChange('upcomingPaymentText', e.target.value)}
                placeholder={`Пример:
Уважаемый {fullname}!
Напоминаем, что {date} ожидается платеж в размере {amount} по договору от {credit_date}.
Остаток задолженности: {rest}
Товар: {product}`}
                disabled={isLoading}
              />
              
              <PreviewSection>
                <SectionTitle>Предпросмотр</SectionTitle>
                <MessagePreview>
                  <PreviewText>
                    {settings.upcomingPaymentText
                      .replace(/{fullname}/g, 'Иванов Иван Иванович')
                      .replace(/{company}/g, 'ООО "Пример"')
                      .replace(/{amount}/g, '15 000 ₽')
                      .replace(/{date}/g, '15.12.2024')
                      .replace(/{credit_date}/g, '01.01.2024')
                      .replace(/{account_details}/g, '12341413212 Сбербанк')
                      .replace(/{rest}/g, '50 000 ₽')
                      .replace(/{product}/g, 'Ноутбук Dell XPS 15')
                      .replace(/{payment_day}/g, '15 число')
                      .replace(/{overdue}/g, '0 дней')
                      .replace(/{support_number}/g, '+7 (999) 123-45-67')}
                  </PreviewText>
                </MessagePreview>
              </PreviewSection>
            </ContentWrapper>
          </DefaultContainer>
        </MessageColumn>

        {/* Правая колонка - Просрочка платежа */}
        <MessageColumn>
          <DefaultContainer>
            <MessageHeader>
              <ModalInfoTitle>Текст для просроченного платежа</ModalInfoTitle>
              <DarkCyanButton
                onClick={() => handleSaveText('overduePaymentText')}
                disabled={isLoading || !textChanged.overdue}
                style={{ minWidth: '100px', flexShrink: 0 }}
              >
                {isLoading ? '...' : 'Сохранить'}
              </DarkCyanButton>
            </MessageHeader>
            
            <ContentWrapper>
              <SectionTitle>Шаблон сообщения</SectionTitle>
              <VariableSection>
                <VariableButtons>
                  {variables.map(variable => (
                    <VariableButton 
                      key={`overdue-${variable.key}`}
                      onClick={() => insertVariable('overduePaymentText', variable.key)}
                      disabled={isLoading}
                      title={`Вставить {${variable.key}}`}
                    >
                      {variable.label}
                    </VariableButton>
                  ))}
                </VariableButtons>
              </VariableSection>
              
              <MessageTextarea
                id="overduePaymentText"
                value={settings.overduePaymentText}
                onChange={(e) => handleTextChange('overduePaymentText', e.target.value)}
                placeholder={`Пример:
Уважаемый {fullname}!
У Вас просрочка платежа на {amount} с {date}.
Просрочка составляет {overdue}.
Пожалуйста, произведите оплату на карту {account_details}.
Для уточнений звоните {support_number}`}
                disabled={isLoading}
              />
              
              <PreviewSection>
                <SectionTitle>Предпросмотр</SectionTitle>
                <MessagePreview>
                  <PreviewText>
                    {settings.overduePaymentText
                      .replace(/{fullname}/g, 'Иванов Иван Иванович')
                      .replace(/{company}/g, 'ООО "Пример"')
                      .replace(/{amount}/g, '15 000 ₽')
                      .replace(/{date}/g, '15.12.2024')
                      .replace(/{credit_date}/g, '01.01.2024')
                      .replace(/{account_details}/g, '**** 1234')
                      .replace(/{rest}/g, '50 000 ₽')
                      .replace(/{product}/g, 'Ноутбук Dell XPS 15')
                      .replace(/{payment_day}/g, '15 число')
                      .replace(/{overdue}/g, '3 дня')
                      .replace(/{support_number}/g, '+7 (999) 123-45-67')}
                  </PreviewText>
                </MessagePreview>
              </PreviewSection>
            </ContentWrapper>
          </DefaultContainer>
        </MessageColumn>
      </PageContainer>
    </PageLayout>
  );
};

export default SenderPage;

const PageContainer = styled.div`
  display: flex;
  gap: 24px;
  padding: 24px 16px;
  height: calc(100vh - 200px); // Учитываем высоту хедера
  max-height: 100vh;
  overflow: hidden;

  @media (max-width: 1200px) {
    flex-direction: column;
    height: auto;
    overflow-y: auto;
  }
`;

// Колонка для сообщения
const MessageColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; // Важно для правильного скроллинга внутри

  > div { // Стиль для DefaultContainer
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  @media (max-width: 1200px) {
    min-height: 600px;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: nowrap;
  gap: 16px;
  flex-shrink: 0;

  h2 {
    margin: 0;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
`;

const VariableSection = styled.div`
  margin-bottom: 16px;
  flex-shrink: 0;
`;

const VariableButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
`;

const VariableButton = styled.button<{ disabled?: boolean }>`
  background-color: rgba(0, 125, 136, 1);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 12px;
  font-weight: 500;
  opacity: ${props => props.disabled ? 0.6 : 1};
  transition: all 0.2s ease;
  white-space: nowrap;
  border: none;
  &:hover:not(:disabled) {
    background-color: rgba(0, 105, 116, 1);
    transform: translateY(-1px);
  }
  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const MessageTextarea = styled.textarea<{ disabled?: boolean }>`
  width: 100%;
  padding: 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 180px;
  max-height: 250px;
  color: #1f2937;
  background-color: white;
  opacity: ${props => props.disabled ? 0.6 : 1};
  cursor: ${props => props.disabled ? 'not-allowed' : 'text'};
  box-sizing: border-box;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  line-height: 1.5;
  margin-bottom: 24px;
  flex-shrink: 0;
  
  &:focus {
    outline: none;
    border-color: #007D88;
    box-shadow: 0 0 0 3px rgba(0, 125, 136, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
    font-size: 13px;
    line-height: 1.4;
  }
`;

const PreviewSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const MessagePreview = styled.div`
  flex: 1;
  min-height: 0;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PreviewText = styled.div`
  font-size: 14px;
  color: #1f2937;
  line-height: 1.6;
  white-space: pre-wrap;
  flex: 1;
  overflow-y: auto;
  padding: 2px;
  font-family: 'Inter', 'Segoe UI', sans-serif;

  /* Стилизация скроллбара для предпросмотра */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;