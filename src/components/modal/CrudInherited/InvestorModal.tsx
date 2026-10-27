import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Phone } from 'lucide-react';
import BaseModal, { type ModalMode } from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import PhoneModalInput from '../../ui/fields/PhoneModalInput';
import type { Investor } from '../../../api/types/investor';
import { formatMoney, parseMoney } from '../../../utils/formatPrice';
import { useAuth } from '../../../сontext/AuthContext';
import { formatPhoneHref } from '../../../utils/phoneUtils';
import { extractErrorMessage } from '../../../api/utils/errorMessage';

type InvestorModalProps = {
  mode: ModalMode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (investorData: Omit<Investor, 'id'>) => Promise<boolean>;
  initialData?: Investor;
};

const emptyInvestor: Omit<Investor, 'id'> = {
  nickname: '',
  fullName: '',
  phoneNumber: '',
  investorPie: 0,
  investmentAmount: 0,
  balance: 0,
  isCompany: false,
  isBlocked: false,
  currentIncome: 0
};

const InvestorFormContent = styled.div`
  padding: 6px 34px 24px;
  text-align: left;

  @media (max-width: 600px) { padding: 4px 18px 20px; }
`;

const FormSection = styled.section<{ $separated?: boolean }>`
  width: 100%;
  box-sizing: border-box;
  margin-top: ${({ $separated }) => ($separated ? '18px' : '8px')};
  padding-top: ${({ $separated }) => ($separated ? '18px' : '0')};
  border-top: ${({ $separated }) => ($separated ? '1px solid #dfe6ed' : '0')};
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px;
  color: #07818a;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  text-align: left;
`;

const FieldsGrid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px 18px;

  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const FormField = styled.label<{ $fullWidth?: boolean }>`
  display: flex;
  grid-column: ${({ $fullWidth }) => ($fullWidth ? '1 / -1' : 'auto')};
  min-width: 0;
  flex-direction: column;
  gap: 7px;
  color: #192438;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  text-align: left;
`;

const InputShell = styled.div<{ $withIcon?: boolean }>`
  position: relative;
  min-width: 0;

  > svg {
    position: absolute;
    top: 20px;
    left: 13px;
    z-index: 2;
    color: #8290a3;
    transform: translateY(-50%);
    pointer-events: none;
  }

  > div {
    display: block;
    width: 100%;
    max-width: none;
    margin: 0;
  }

  input {
    width: 100%;
    max-width: none;
    min-height: 40px;
    padding: 7px 12px 7px ${({ $withIcon }) => ($withIcon ? '40px' : '13px')};
    color: #172235;
    font-size: 14px;
    background: #fff;
    border-color: #c7d2de;
    border-radius: 7px;
  }

  input::placeholder { color: #8b97a9; }
`;

const PoolWarning = styled.div`
  margin-bottom: 15px;
  padding: 10px 12px;
  color: #8a5a08;
  font-size: 13px;
  line-height: 1.4;
  background: #fff7df;
  border: 1px solid #f4daa0;
  border-radius: 7px;
`;

const ApiError = styled.div`
  margin-bottom: 12px;
  padding: 9px 11px;
  color: #b4232a;
  font-size: 13px;
  background: #fff0f1;
  border-radius: 7px;
`;

const ViewPhoneLink = styled.a`
  display: flex;
  min-height: 40px;
  padding: 0 13px 0 40px;
  box-sizing: border-box;
  align-items: center;
  color: #087d86;
  text-decoration: none;
  background: #f6f8fa;
  border: 1px solid #d6dee7;
  border-radius: 7px;
`;

const InvestorModal: React.FC<InvestorModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData = {
    id: 0,
    nickname: '',
    fullName: '',
    phoneNumber: '',
    investorPie: 0,
    investmentAmount: 0,
    balance: 0,
    isCompany: false,
    isBlocked: false
  },
}) => {
  const [formData, setFormData] = useState<Omit<Investor, 'id'>>(
    mode === 'create' || mode === 'create-pool' ? emptyInvestor : {
      nickname: initialData?.nickname || '',
      fullName: initialData?.fullName || '',
      phoneNumber: initialData?.phoneNumber || '',
      investorPie: initialData?.investorPie || 0,
      investmentAmount: initialData?.investmentAmount || 0,
      balance: initialData?.balance || 0,
      isCompany: initialData?.isCompany || false,
      isBlocked: initialData?.isBlocked || false,
      currentIncome: 0
    }
  );
  const [validationErrors, setValidationErrors] = useState({
    nickname: false,
    fullName: false,
    phoneNumber: false,
    investorPie: false,
    investmentAmount: false,
    balance: false
  });
  const { authInfo, hasRole } = useAuth();

  const validatePhone = async (phone: string) => {
    const phoneRegex = /^(\+7|8)\s?\(?\d{3}\)?\s?\d{3}-?\d{2}-?\d{2}$/;
    
    if (!phoneRegex.test(phone.trim())) {
      return 'Введите корректный телефон';
    }
    
    if (phone.trim().length === 0) {
      return 'Поле обязательно для заполнения';
    }

    return '';
  };

  const validateNumber = (value: number, fieldName: string, min: number, max: number) => {
    if (isNaN(value)) {
      return '';
    }
    if (value < min) {
      return `${fieldName} не может быть меньше ${min}`;
    }
    if (value > max) {
      return `${fieldName} не может быть больше ${max}`;
    }
    return '';
  };

  const [errorMessages, setErrorMessages] = useState({
    nickname: '',
    fullName: '',
    phoneNumber: '',
    investorPie: '',
    investmentAmount: '',
    balance: ''
  });

  const [touchedFields, setTouchedFields] = useState({
    nickname: false,
    fullName: false,
    phoneNumber: false,
    investorPie: false,
    investmentAmount: false,
    balance: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(
        mode === 'create' || mode === 'create-pool' ? emptyInvestor : {
          nickname: initialData?.nickname || '',
          fullName: initialData?.fullName || '',
          phoneNumber: initialData?.phoneNumber || '',
          investorPie: initialData?.investorPie || 0,
          investmentAmount: initialData?.investmentAmount || 0,
          balance: initialData?.balance || 0,
          isCompany: initialData?.isCompany || false,
          isBlocked: initialData?.isBlocked || false,
          currentIncome: 0
        }
      );
      setValidationErrors({
        nickname: false,
        fullName: false,
        phoneNumber: false,
        investorPie: false,
        investmentAmount: false,
        balance: false
      });
      setErrorMessages({
        nickname: '',
        fullName: '',
        phoneNumber: '',
        investorPie: '',
        investmentAmount: '',
        balance: ''
      });
      setTouchedFields({
        nickname: false,
        fullName: false,
        phoneNumber: false,
        investorPie: false,
        investmentAmount: false,
        balance: false
      });
      setApiError('');
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (mode === 'view') return;

    const validateForm = async () => {
      const newErrorMessages = {
        nickname: '',
        fullName: '',
        phoneNumber: '',
        investorPie: '',
        investmentAmount: '',
        balance: ''
      };

      if (mode !== 'create-pool' && mode !== 'edit-pool') {
        if (formData.nickname.trim().length === 0) {
          newErrorMessages.nickname = 'Поле обязательно для заполнения';
        }
      }

      if (formData.fullName.trim().length === 0) {
        newErrorMessages.fullName = 'Поле обязательно для заполнения';
      }

      newErrorMessages.phoneNumber = await validatePhone(formData.phoneNumber);

      if (mode === 'create') {
        newErrorMessages.investorPie = validateNumber(
          formData.investorPie, 
          'Доля инвестора', 
          0, 
          100
        );

        newErrorMessages.investmentAmount = validateNumber(
          formData.investmentAmount, 
          'Сумма инвестиций', 
          0, 
          1000000000
        );

        newErrorMessages.balance = validateNumber(
          formData.balance, 
          'Касса', 
          -1000000, 
          1000000000
        );
      }

      if (mode === 'create-pool') {
        newErrorMessages.investmentAmount = validateNumber(
          formData.investmentAmount, 
          'Сумма инвестиций', 
          0, 
          1000000000
        );
      }

      setErrorMessages(newErrorMessages);

      const errors = {
        nickname: !!newErrorMessages.nickname,
        fullName: !!newErrorMessages.fullName,
        phoneNumber: !!newErrorMessages.phoneNumber,
        investorPie: !!newErrorMessages.investorPie,
        investmentAmount: !!newErrorMessages.investmentAmount,
        balance: !!newErrorMessages.balance
      };

      setValidationErrors(errors);
    };

    validateForm();
  }, [formData, mode]);

  const isSaveDisabled = () => {
    if (mode === 'view') return true;

    const hasErrors = Object.values(validationErrors).some(Boolean);
    if (hasErrors) return true;

    if (mode === 'edit' || mode === 'edit-pool') {
      const isChanged = (
        formData.fullName !== initialData.fullName ||
        formData.phoneNumber !== initialData.phoneNumber ||
        formData.isCompany !== initialData.isCompany ||
        formData.investorPie !== initialData.investorPie ||
        (mode === 'edit' && formData.nickname !== initialData.nickname)
      );
      return !isChanged;
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouchedFields({
      nickname: true,
      fullName: true,
      phoneNumber: true,
      investorPie: true,
      investmentAmount: true,
      balance: true
    });

    const isValid = !Object.values(validationErrors).some(Boolean);
    if (!isValid) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const submitData = {
        ...formData,
        ...(mode === 'create-pool' || mode === 'edit-pool' ? {
          balance: 0,
          nickname: ''
        } : {}),
        ...(mode === 'edit' ? {
          investmentAmount: initialData.investmentAmount,
          balance: initialData.balance
        } : {}),
        ...(mode === 'edit-pool' ? {
          investmentAmount: initialData.investmentAmount
        } : {})
      };

      const success = await onSubmit(submitData);
      
      if (success) {
        setIsSubmitting(false);
        onClose();
      } else {
        setIsSubmitting(false);
      }
    } catch (error: unknown) {
      console.error('Ошибка при сохранении инвестора:', error);
      setApiError(extractErrorMessage(error, 'Произошла ошибка при сохранении инвестора'));
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'investmentAmount') {
      const numericValue = parseMoney(value);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if ((mode !== 'create' && mode !== 'create-pool') && ['investmentAmount', 'balance'].includes(name)) {
      return;
    }
    
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const getTitle = () => {
    switch (mode) {
      case 'create': return formData.isCompany ? 'Создание компании' : 'Создание инвестора';
      case 'edit': return formData.isCompany ? 'Редактирование компании' : 'Редактирование инвестора';
      case 'view': return formData.isCompany ? 'Просмотр компании' : 'Просмотр инвестора';
      case 'create-pool': return 'Создание инвестора для пула';
      case 'edit-pool': return 'Редактирование инвестора для пула';
      default: return formData.isCompany ? 'Компания' : 'Инвестор';
    }
  };

  const getSubtitle = () => {
    if (mode === 'view') return 'Информация об инвесторе и его финансовых показателях';
    if (mode === 'create-pool' || mode === 'edit-pool') {
      return 'Заполните данные инвестора для инвестиционного пула';
    }
    return formData.isCompany
      ? 'Заполните данные компании и финансовые условия'
      : 'Заполните контактные данные и финансовые условия';
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title={getTitle()}
      subtitle={getSubtitle()}
      appearance="compact-form"
      width="620px"
      maxHeight="calc(100vh - 32px)"
      cancelButtonText={mode === 'view' ? 'Закрыть' : 'Отмена'}
      saveButtonText={mode === 'create' || mode === 'create-pool' ? 'Создать инвестора' : 'Сохранить'}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSaveDisabled={isSaveDisabled() || isSubmitting}
      isSubmitting={isSubmitting}
      mode={mode}
    >
      <InvestorFormContent>
        {apiError && <ApiError>{apiError}</ApiError>}

        <FormSection>
          <SectionTitle>Основная информация</SectionTitle>
          {mode === 'create-pool' && !authInfo?.employee?.poolV2 && (
            <PoolWarning>
              Рекомендуется сначала сделать реинвестицию, а затем добавлять новую инвестицию.
            </PoolWarning>
          )}

          <FieldsGrid>
            {mode !== 'create-pool' && mode !== 'edit-pool' && (
              <FormField $fullWidth>
                {formData.isCompany ? 'Название компании' : 'Никнейм'}
                <InputShell>
                  <CustomInput
                    name="nickname"
                    inputType="text"
                    placeholder={formData.isCompany ? 'Название компании' : 'Никнейм инвестора'}
                    value={formData.nickname}
                    onChange={handleInputChange}
                    disabled={mode === 'view'}
                    hasError={touchedFields.nickname && validationErrors.nickname}
                    errorMessage={touchedFields.nickname ? errorMessages.nickname : undefined}
                  />
                </InputShell>
              </FormField>
            )}

            {(hasRole('директор') || hasRole('суперадмин')) && (
              <FormField>
                {formData.isCompany ? 'В лице' : 'ФИО'}
                <InputShell>
                  <CustomInput
                    name="fullName"
                    inputType="fullname"
                    placeholder="Фамилия, имя, отчество"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={mode === 'view'}
                    hasError={touchedFields.fullName && validationErrors.fullName}
                    errorMessage={touchedFields.fullName ? errorMessages.fullName : undefined}
                  />
                </InputShell>
              </FormField>
            )}

            <FormField $fullWidth={!(hasRole('директор') || hasRole('суперадмин'))}>
              Телефон
              <InputShell $withIcon>
                <Phone size={17} />
                {mode === 'view' ? (
                  <ViewPhoneLink href={formatPhoneHref(formData.phoneNumber)}>
                    {formData.phoneNumber || 'Не указан'}
                  </ViewPhoneLink>
                ) : (
                  <PhoneModalInput
                    name="phoneNumber"
                    placeholder="8 (___) ___-__-__"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    hasError={touchedFields.phoneNumber && validationErrors.phoneNumber}
                    errorMessage={touchedFields.phoneNumber ? errorMessages.phoneNumber : undefined}
                  />
                )}
              </InputShell>
            </FormField>
          </FieldsGrid>
        </FormSection>

        <FormSection $separated>
          <SectionTitle>Финансовая информация</SectionTitle>
          <FieldsGrid>
            <FormField>
              Доля инвестора (%)
              <InputShell>
                <CustomInput
                  name="investorPie"
                  inputType="percents"
                  placeholder="0–100"
                  value={formData.investorPie.toString()}
                  onChange={handleNumberChange}
                  disabled={mode === 'view'}
                  hasError={touchedFields.investorPie && validationErrors.investorPie}
                  errorMessage={touchedFields.investorPie ? errorMessages.investorPie : undefined}
                />
              </InputShell>
            </FormField>

            {(mode === 'create' || mode === 'create-pool') && (
              <FormField>
                Сумма инвестиции
                <InputShell>
                  <CustomInput
                    name="investmentAmount"
                    inputType="rubles"
                    placeholder="0 ₽"
                    value={formData.investmentAmount ? formatMoney(formData.investmentAmount.toString()) : ''}
                    onChange={handleInputChange}
                    hasError={touchedFields.investmentAmount && validationErrors.investmentAmount}
                    errorMessage={touchedFields.investmentAmount ? errorMessages.investmentAmount : undefined}
                  />
                </InputShell>
              </FormField>
            )}

            {mode === 'view' && (
              <>
                <FormField>
                  Касса
                  <InputShell>
                    <CustomInput
                      name="balance"
                      inputType="rubles"
                      value={formatMoney(formData.balance.toString())}
                      disabled
                    />
                  </InputShell>
                </FormField>
                <FormField>
                  Заблокирован
                  <InputShell>
                    <CustomInput name="isBlocked" value={formData.isBlocked ? 'Да' : 'Нет'} disabled />
                  </InputShell>
                </FormField>
              </>
            )}
          </FieldsGrid>
        </FormSection>
      </InvestorFormContent>
    </BaseModal>
  );
};

export default InvestorModal;
