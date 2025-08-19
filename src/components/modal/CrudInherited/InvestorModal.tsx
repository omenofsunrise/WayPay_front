import React, { useState, useEffect } from 'react';
import BaseModal, { type ModalMode } from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import ModalInfoTitle from '../../ui/Text/ModalInfoTitle';
import PhoneModalInput from '../../ui/fields/PhoneModalInput';
import { InputContainer, InputLabel, InputRow } from '../../Containers/InputComponents';
import type { Investor } from '../../../api/types/investor';
import { formatMoney, parseMoney } from '../../../utils/formatPrice';
import { useAuth } from '../../../сontext/AuthContext';

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
};

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
      isBlocked: initialData?.isBlocked || false
    }
  );
  const [displaySum, setDisplaySum] = useState<string>(initialData.investmentAmount.toString());
  const [validationErrors, setValidationErrors] = useState({
    nickname: false,
    fullName: false,
    phoneNumber: false,
    investorPie: false,
    investmentAmount: false,
    balance: false
  });
  const { hasRole } = useAuth();
  
  const validatePhone = async (phone: string) => {
    const phoneRegex = /^(\+7|8)\s?\(?\d{3}\)?\s?\d{3}-?\d{2}-?\d{2}$/;
    
    if (!phoneRegex.test(phone.trim())) {
      return 'Введите корректный телефон';
    }
    
    if (phone.trim().length === 0) {
      return 'Поле обязательно для заполнения';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 11) {
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
          isBlocked: initialData?.isBlocked || false
        }
      );
      setDisplaySum(initialData.investmentAmount.toString());
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
        // For pool modes, ensure these fields are not included
        ...(mode === 'create-pool' || mode === 'edit-pool' ? {
          investorPie: 0,
          balance: 0,
          nickname: ''
        } : {}),
        // For edit modes, preserve original financial data
        ...(mode === 'edit' ? {
          investorPie: initialData.investorPie,
          investmentAmount: initialData.investmentAmount,
          balance: initialData.balance
        } : {}),
        ...(mode === 'edit-pool' ? {
          investmentAmount: initialData.investmentAmount
        } : {})
      };

      await onSubmit(submitData);
      
      setIsSubmitting(false);
      onClose();
    } catch (error: any) {
      console.error('Ошибка при сохранении инвестора:', error);
      setApiError(error.message || 'Произошла ошибка при сохранении инвестора');
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'investmentAmount') {
      const numericValue = parseMoney(value);
      setDisplaySum(formatMoney(numericValue.toString())); 
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
    if ((mode !== 'create' && mode !== 'create-pool') && ['investorPie', 'investmentAmount', 'balance'].includes(name)) {
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

  if (!isOpen) return null;

  return (
    <BaseModal
      title={getTitle()}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSaveDisabled={isSaveDisabled() || isSubmitting}
      isSubmitting={isSubmitting}
      mode={mode}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {apiError && (
            <div style={{ color: 'red', marginBottom: '15px' }}>
              {apiError}
            </div>
          )}
          
          <ModalInfoTitle>Основная информация</ModalInfoTitle>
          
          {(mode !== 'create-pool' && mode !== 'edit-pool') && (
            <InputRow>
              <InputLabel>{formData.isCompany ? 'Название компании:' : 'Никнейм:'}</InputLabel>
              <InputContainer >
                <CustomInput
                  name="nickname"
                  inputType="text"
                  placeholder={formData.isCompany ? "Название компании" : "Никнейм"}
                  value={formData.nickname}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  hasError={touchedFields.nickname && validationErrors.nickname}
                  errorMessage={touchedFields.nickname ? errorMessages.nickname : undefined}
                />
              </InputContainer>
            </InputRow>
          )}
          
          {(hasRole("директор") || hasRole("суперадмин")) && (
            <InputRow>
              <InputLabel>{formData.isCompany ? 'В лице:' : 'ФИО:'}</InputLabel>
              <InputContainer>
                <CustomInput
                  name="fullName"
                  inputType="fullname"
                  placeholder= "ФИО"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  hasError={touchedFields.fullName && validationErrors.fullName}
                  errorMessage={touchedFields.fullName ? errorMessages.fullName : undefined}
                />
              </InputContainer>
            </InputRow>
          )}

          <InputRow>
            <InputLabel>Телефон:</InputLabel>
            <InputContainer>
              <PhoneModalInput
                name="phoneNumber"
                placeholder="Телефон"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                hasError={touchedFields.phoneNumber && validationErrors.phoneNumber}
                errorMessage={touchedFields.phoneNumber ? errorMessages.phoneNumber : undefined}
              />
            </InputContainer>
          </InputRow>
          
          {(mode !== 'create-pool' && mode !== 'edit-pool') && (
            <>
              <ModalInfoTitle>Финансовая информация</ModalInfoTitle>
            
              <InputRow>
                <InputLabel>Доля инвестора (%):</InputLabel>
                <InputContainer >
                  <CustomInput
                    name="investorPie"
                    inputType="number"
                    placeholder="0-100"
                    value={formData.investorPie.toString()}
                    onChange={handleNumberChange}
                    disabled={mode !== 'create'}
                    hasError={touchedFields.investorPie && validationErrors.investorPie}
                    errorMessage={touchedFields.investorPie ? errorMessages.investorPie : undefined}
                  />
                </InputContainer>
              </InputRow>
            </>
          )}

          {(mode === 'create' || mode === 'create-pool') && (
            <InputRow>
              <InputLabel>Инвестиция:</InputLabel>
              <InputContainer>
                <CustomInput
                  name="investmentAmount"
                  inputType="rubles"
                  placeholder="Сумма"
                  onChange={handleInputChange}
                  hasError={touchedFields.investmentAmount && validationErrors.investmentAmount}
                  errorMessage={touchedFields.investmentAmount ? errorMessages.investmentAmount : undefined}
                />
              </InputContainer>
            </InputRow>
          )}

          {(mode === 'view' && mode !== 'edit-pool') && (
            <InputRow>
              <InputLabel>Касса:</InputLabel>
              <InputContainer>
                <CustomInput
                  name="balance"
                  inputType="rubles"
                  value={formatMoney(formData.balance.toString())}
                  disabled={true}
                />
              </InputContainer>
            </InputRow>
          )}

          {(mode === 'view') && (
            <InputRow>
                <InputLabel>Заблокирован:</InputLabel>
                <InputContainer>
                  <CustomInput
                    name="isBlocked"
                    value={formData.isBlocked ? "Да" : "Нет"}
                    disabled={true}
                  />
                </InputContainer>
            </InputRow>
          )}

        </div>
      </form>
    </BaseModal>
  );
};

export default InvestorModal;