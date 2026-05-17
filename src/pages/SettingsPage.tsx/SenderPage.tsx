import PageLayout from '../../components/ui/Layouts/PageLayout';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import ModalInfoTitle from '../../components/ui/Text/ModalInfoTitle';
import DarkCyanButton from '../../components/ui/Buttons/DarkCyanButton';
import useSender from '../../api/hooks/useSender';
import { TextPatternType } from '../../api/types/sender';
import DefaultContainer from '../../components/ui/containers/defaultContainer';

type TemplateKey =
  | 'upcomingPaymentText'
  | 'overduePaymentText'
  | 'shareCreditText'
  | 'shareCreditsText'
  | 'shareSchedulesText';

interface Variable {
  key: string;
  label: string;
  preview: string;
}

interface TemplateConfig {
  key: TemplateKey;
  title: string;
  patternType: TextPatternType;
  variables: Variable[];
  placeholder: string;
}

type SenderSettings = Record<TemplateKey, string>;

const paymentVariables: Variable[] = [
  { key: 'fullname', label: 'ФИО', preview: 'Иванов Иван Иванович' },
  { key: 'company', label: 'Компания', preview: 'ООО "Пример"' },
  { key: 'amount', label: 'Сумма', preview: '15 000 ₽' },
  { key: 'date', label: 'Дата платежа', preview: '15.12.2024' },
  { key: 'credit_date', label: 'Дата договора', preview: '01.01.2024' },
  { key: 'account_details', label: 'Карта', preview: '**** 1234' },
  { key: 'rest', label: 'Остаток', preview: '50 000 ₽' },
  { key: 'product', label: 'Товар', preview: 'Ноутбук Dell XPS 15' },
  { key: 'payment_day', label: 'День платежа', preview: '15 число' },
  { key: 'overdue', label: 'Просрочка', preview: '3 дня' },
  { key: 'support_number', label: 'Поддержка', preview: '+7 (999) 123-45-67' }
];

const shareCreditVariables: Variable[] = [
  { key: 'name', label: 'Договор', preview: '№123' },
  { key: 'date', label: 'Дата оформления', preview: '01.01.2024' },
  { key: 'client_fullname', label: 'ФИО клиента', preview: 'Иванов Иван Иванович' },
  { key: 'terms', label: 'Срок', preview: '12' },
  { key: 'total_clean', label: 'Стоимость товара', preview: '100 000 ₽' },
  { key: 'total_amount', label: 'Общая сумма', preview: '120 000 ₽' }
];

const shareCreditsVariables: Variable[] = [
  { key: 'name', label: 'Договор', preview: '№123' },
  { key: 'client_fullname', label: 'ФИО клиента', preview: 'Иванов Иван Иванович' },
  { key: 'date', label: 'Дата', preview: '01.01.2024' },
  { key: 'total_amount', label: 'Сумма', preview: '120 000 ₽' },
  { key: 'rest', label: 'Остаток', preview: '50 000 ₽' }
];

const shareSchedulesVariables: Variable[] = [
  { key: 'number', label: 'Номер платежа', preview: '1' },
  { key: 'date', label: 'Дата', preview: '15.12.2024' },
  { key: 'amount', label: 'Сумма', preview: '15 000 ₽' },
  { key: 'payment_type', label: 'Способ оплаты', preview: 'Наличные' },
  { key: 'employee', label: 'Сотрудник', preview: 'Петров П.П.' }
];

const templateConfigs: TemplateConfig[] = [
  {
    key: 'upcomingPaymentText',
    title: 'Текст для приближающегося платежа',
    patternType: TextPatternType.ComingPayment,
    variables: paymentVariables,
    placeholder: `Пример:
Уважаемый {fullname}!
Напоминаем, что {date} ожидается платеж в размере {amount} по договору от {credit_date}.
Остаток задолженности: {rest}
Товар: {product}`
  },
  {
    key: 'overduePaymentText',
    title: 'Текст для просроченного платежа',
    patternType: TextPatternType.OverduePayment,
    variables: paymentVariables,
    placeholder: `Пример:
Уважаемый {fullname}!
У Вас просрочка платежа на {amount} с {date}.
Просрочка составляет {overdue}.
Пожалуйста, произведите оплату на карту {account_details}.
Для уточнений звоните {support_number}`
  },
  {
    key: 'shareCreditText',
    title: 'Текст для отправки договора',
    patternType: TextPatternType.WhatsAppCreditShare,
    variables: shareCreditVariables,
    placeholder: `Пример:
Договор {name}
Дата оформления договора: {date}
Клиент: {client_fullname}
Срок: {terms} месяцев
Стоимость товара: {total_clean} ₽
Общая сумма договора: {total_amount} ₽`
  },
  {
    key: 'shareCreditsText',
    title: 'Текст для отправки списка договоров',
    patternType: TextPatternType.WhatsAppCreditsShare,
    variables: shareCreditsVariables,
    placeholder: `Пример:
*Договор {name}*
Клиент: {client_fullname}
Дата: {date}
Сумма: {total_amount} ₽
Остаток: {rest} ₽`
  },
  {
    key: 'shareSchedulesText',
    title: 'Текст для отправки истории платежей',
    patternType: TextPatternType.WhatsAppSchedulesShare,
    variables: shareSchedulesVariables,
    placeholder: `Пример:
{number}. {date}    Сумма: {amount} ₽
   Способ: {payment_type}
   Сотрудник: {employee}`
  }
];

const initialSettings: SenderSettings = {
  upcomingPaymentText: '',
  overduePaymentText: '',
  shareCreditText: '',
  shareCreditsText: '',
  shareSchedulesText: ''
};

const SenderPage = () => {
  const {
    isLoading,
    error,
    GetMyCompanySenderInfo,
    SetSenderTextPattern
  } = useSender();

  const [settings, setSettings] = useState<SenderSettings>(initialSettings);
  const [changedFlags, setChangedFlags] = useState<Record<TemplateKey, boolean>>({
    upcomingPaymentText: false,
    overduePaymentText: false,
    shareCreditText: false,
    shareCreditsText: false,
    shareSchedulesText: false
  });

  useEffect(() => {
    loadSenderData();
  }, []);

  const loadSenderData = async () => {
    const data = await GetMyCompanySenderInfo();
    if (data) {
      setSettings({
        upcomingPaymentText: data.comingPaymentContent?.toString() || '',
        overduePaymentText: data.overduePaymentContent?.toString() || '',
        shareCreditText: data.shareCreditContent?.toString() || '',
        shareCreditsText: data.shareCreditsContent?.toString() || '',
        shareSchedulesText: data.sharePaymentsContent?.toString() || ''
      });
      setChangedFlags({
        upcomingPaymentText: false,
        overduePaymentText: false,
        shareCreditText: false,
        shareCreditsText: false,
        shareSchedulesText: false
      });
    }
  };

  const handleTextChange = (key: TemplateKey, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setChangedFlags(prev => ({ ...prev, [key]: true }));
  };

  const handleSaveText = async (config: TemplateConfig) => {
    try {
      await SetSenderTextPattern({
        newText: settings[config.key],
        patternType: config.patternType
      });
      setChangedFlags(prev => ({ ...prev, [config.key]: false }));
    } catch (e) {
      console.error('Error saving text pattern:', e);
    }
  };

  const insertVariable = (key: TemplateKey, variable: string) => {
    const textarea = document.getElementById(key) as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const variableText = `{${variable}}`;

    const newText = textarea.value.substring(0, start) + variableText + textarea.value.substring(end);
    handleTextChange(key, newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableText.length, start + variableText.length);
    }, 0);
  };

  const renderPreview = (config: TemplateConfig): string => {
    let text = settings[config.key];
    for (const v of config.variables) {
      text = text.split(`{${v.key}}`).join(v.preview);
    }
    return text;
  };

  if (error) {
    console.error('API Error:', error);
  }

  return (
    <PageLayout>
      <PageContainer>
        {templateConfigs.map(config => (
          <MessageColumn key={config.key}>
            <DefaultContainer>
              <MessageHeader>
                <ModalInfoTitle>{config.title}</ModalInfoTitle>
                <DarkCyanButton
                  onClick={() => handleSaveText(config)}
                  disabled={isLoading || !changedFlags[config.key]}
                  style={{ minWidth: '100px', flexShrink: 0 }}
                >
                  {isLoading ? '...' : 'Сохранить'}
                </DarkCyanButton>
              </MessageHeader>

              <ContentWrapper>
                <SectionTitle>Шаблон сообщения</SectionTitle>
                <VariableSection>
                  <VariableButtons>
                    {config.variables.map(variable => (
                      <VariableButton
                        key={`${config.key}-${variable.key}`}
                        onClick={() => insertVariable(config.key, variable.key)}
                        disabled={isLoading}
                        title={`Вставить {${variable.key}}`}
                      >
                        {variable.label}
                      </VariableButton>
                    ))}
                  </VariableButtons>
                </VariableSection>

                <MessageTextarea
                  id={config.key}
                  value={settings[config.key]}
                  onChange={(e) => handleTextChange(config.key, e.target.value)}
                  placeholder={config.placeholder}
                  disabled={isLoading}
                />

                <PreviewSection>
                  <SectionTitle>Предпросмотр</SectionTitle>
                  <MessagePreview>
                    <PreviewText>{renderPreview(config)}</PreviewText>
                  </MessagePreview>
                </PreviewSection>
              </ContentWrapper>
            </DefaultContainer>
          </MessageColumn>
        ))}
      </PageContainer>
    </PageLayout>
  );
};

export default SenderPage;

const PageContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 24px;
  padding: 24px 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const MessageColumn = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;

  > div {
    display: flex;
    flex-direction: column;
    height: 100%;
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
