import React, { useState, useEffect } from 'react';
import BaseModal, { type ModalMode } from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import ModalInfoTitle from '../../ui/Text/ModalInfoTitle';
import PhoneModalInput from '../../ui/fields/PhoneModalInput';
import { InputContainer, InputLabel, InputRow } from '../../Containers/InputComponents';
import type { GuarantorForm } from '../../../api/types/client';

export interface Guarantor {
  id: number;
  fullName: string;
  phone: string;
  doc?: string;
  birthdate?: Date | null | string;
  address?: string;
}

type GuarantorModalProps = {
  mode: ModalMode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (guarantorData: Omit<GuarantorForm, 'doc'>) => Promise<boolean>;
  initialData?: Guarantor;
};

const emptyGuarantor: Omit<Guarantor, 'id'> = {
  fullName: '',
  phone: '',
  doc: '',
  birthdate: '',
  address: ''
};

const validateDate = (dateStr: string, minAge: number, maxAge: number, isRequired: boolean): { isValid: boolean; error?: string; date?: Date } => {
  if (!dateStr) {
    return { isValid: true };
  }

  const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
  if (!dateRegex.test(dateStr)) {
    return { isValid: false, error: 'Формат даты: дд.мм.гггг' };
  }

  const [day, month, year] = dateStr.split('.').map(Number);
  
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { isValid: false, error: 'Некорректная дата' };
  }

  const today = new Date();
  const age = today.getFullYear() - year - 
    (today.getMonth() < month - 1 || 
     (today.getMonth() === month - 1 && today.getDate() < day) ? 1 : 0);

  if (age < minAge) {
    return { isValid: false, error: `Возраст должен быть не менее ${minAge} лет` };
  }

  if (age > maxAge) {
    return { isValid: false, error: `Возраст должен быть не более ${maxAge} лет` };
  }

  return { isValid: true, date };
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
    return dateString;
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}.${month}.${year}`;
};

const GuarantorModal: React.FC<GuarantorModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData = {
    id: 0,
    fullName: '',
    phone: '',
    doc: '',
    birthdate: null,
    address: ''
  },
}) => {
  const [formData, setFormData] = useState<Omit<Guarantor, 'id'>>(
    mode === 'create' ? emptyGuarantor : {
      fullName: initialData?.fullName || '',
      phone: initialData?.phone || '',
      doc: initialData?.doc || '',
      birthdate: initialData?.birthdate ? formatDate(initialData.birthdate.toString()) : '',
      address: initialData?.address || ''
    }
  );
  
  const [validationErrors, setValidationErrors] = useState({
    fullName: false,
    phone: false,
    birthdate: false,
    doc: false,
    address: false
  });
  
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

  const handleClose = () => {
      if (mode === 'create') {
          setFormData(emptyGuarantor);
      }
      onClose();
  };

  const [errorMessages, setErrorMessages] = useState({
    fullName: '',
    phone: '',
    birthdate: '',
    doc: '',
    address: ''
  });

  const [touchedFields, setTouchedFields] = useState({
    fullName: false,
    phone: false,
    birthdate: false,
    doc: false,
    address: false
  });

  const [isEditingPassport, setIsEditingPassport] = useState(false);
  const [passportEditData, setPassportEditData] = useState({
    doc: initialData?.doc || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (mode === 'create' && initialData && initialData.id !== 0) {
            setFormData({
                fullName: initialData.fullName || '',
                phone: initialData.phone || '',
                doc: initialData.doc || '',
                birthdate: initialData.birthdate ? formatDate(initialData.birthdate.toString()) : '',
                address: initialData.address || '',
            });
            
            setPassportEditData({
                doc: initialData.doc || ''
            });
        } else if (mode === 'create') {
            setFormData(emptyGuarantor);
            setIsEditingPassport(false);
        
            setValidationErrors({
            fullName: false,
            phone: false,
            birthdate: false,
            doc: false,
            address: false,
            });
            
            setErrorMessages({
            fullName: '',
            phone: '',
            birthdate: '',
            doc: '',
            address: ''
            });
            
            setTouchedFields({
            fullName: false,
            phone: false,
            birthdate: false,
            doc: false,
            address: false
            });
        }
      if (mode !== 'create') {
        setFormData({
          fullName: initialData?.fullName || '',
          phone: initialData?.phone || '',
          doc: initialData?.doc || '',
          birthdate: initialData?.birthdate ? formatDate(initialData.birthdate.toString()) : '',
          address: initialData?.address || '',
        });
        
        setPassportEditData({
          doc: initialData?.doc || ''
        });
        
        setIsEditingPassport(false);
        
        setValidationErrors({
          fullName: false,
          phone: false,
          birthdate: false,
          doc: false,
          address: false,
        });
        
        setErrorMessages({
          fullName: '',
          phone: '',
          birthdate: '',
          doc: '',
          address: ''
        });
        
        setTouchedFields({
          fullName: false,
          phone: false,
          birthdate: false,
          doc: false,
          address: false
        });
        
        setApiError('');
      }
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (mode === 'view') return;

    const validateForm = async () => {
      const newErrorMessages = {
        fullName: '',
        phone: '',
        birthdate: '',
        doc: '',
        address: ''
      };

      if (formData.fullName.trim().split(/\s+/).length < 2) {
        newErrorMessages.fullName = 'Укажите фио полностью';
      } else if (formData.fullName.trim().length === 0) {
        newErrorMessages.fullName = 'Поле обязательно для заполнения';
      }

      newErrorMessages.phone = await validatePhone(formData.phone);
      
      const birthdateValidation = validateDate(formData.birthdate.toString() || '', 18, 100, true);
      if (!birthdateValidation.isValid) {
        newErrorMessages.birthdate = birthdateValidation.error || '';
      }

      setErrorMessages(newErrorMessages);

      const errors = {
        fullName: !!newErrorMessages.fullName,
        phone: !!newErrorMessages.phone,
        birthdate: !!newErrorMessages.birthdate,
        doc: !!newErrorMessages.doc,
        address: !!newErrorMessages.address
      };

      setValidationErrors(errors);
    };

    validateForm();
  }, [formData, mode, isEditingPassport]);

  const isSaveDisabled = () => {
    if (mode === 'view') return true;

    const hasErrors = Object.values(validationErrors).some(Boolean);
    if (hasErrors) return true;

    if (mode === 'edit') {
      const isChanged = (
        formData.fullName !== initialData.fullName ||
        formData.phone !== initialData.phone ||
        formData.birthdate !== initialData.birthdate ||
        formData.address !== initialData.address ||
        formData.doc !== initialData.doc
      );
      return !isChanged;
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouchedFields({
      fullName: true,
      phone: true,
      birthdate: true,
      doc: true,
      address: true
    });

    const isValid = !Object.values(validationErrors).some(Boolean);
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      const formattedBirthdate = typeof formData.birthdate === 'string' 
        ? formData.birthdate
        : formatDate(formData.birthdate.toString());

      const submitData = {
        fullName: formData.fullName,
        phone: formData.phone,
        birthdate: formattedBirthdate,
        doc: formData.doc,
        address: formData.address
      };

      const success = await onSubmit(submitData);
      
      if (success) {
        onClose();
      }
      setIsSubmitting(false);
    } catch (error: any) {
      console.error('Ошибка при сохранении поручителя:', error);
      setApiError(error.message || 'Произошла ошибка при сохранении поручителя');
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handlePassportEditStart = () => {
    setIsEditingPassport(true);
    setFormData(prev => ({
      ...prev,
      doc: ''
    }));
  };

  const handlePassportEditCancel = () => {
    setIsEditingPassport(false);
    setFormData(prev => ({
      ...prev,
      doc: passportEditData.doc
    }));
    setValidationErrors(prev => ({
      ...prev,
      doc: false
    }));
    setErrorMessages(prev => ({
      ...prev,
      doc: ''
    }));
  };

  const handlePassportSave = async () => {
    const docRegex = /^\d{4}\s\d{6}$/;
    
    const newErrorMessages = {
      doc: ''
    };

    if (!docRegex.test(formData.doc.trim())) {
      newErrorMessages.doc = 'Введите документ';
    }

    if (newErrorMessages.doc) {
      setErrorMessages(prev => ({
        ...prev,
        ...newErrorMessages
      }));
      setValidationErrors(prev => ({
        ...prev,
        doc: !!newErrorMessages.doc
      }));
      return;
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      if (initialData.id) {
        
        setFormData(prev => ({
          ...prev,
          doc: formData.doc
        }));
      }
    } catch (error) {
      console.error('Failed to update passport:', error);
      setApiError('Ошибка при сохранении паспортных данных');
      setErrorMessages(prev => ({
        ...prev,
        doc: 'Ошибка при сохранении'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Создание поручителя';
      case 'edit': return 'Редактирование поручителя';
      case 'view': return 'Просмотр поручителя';
      default: return 'Поручитель';
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
          
          <InputRow>
            <InputLabel>ФИО:</InputLabel>
            <InputContainer>
              <CustomInput
                name="fullName"
                inputType="fullname"
                placeholder="ФИО поручителя"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                hasError={touchedFields.fullName && validationErrors.fullName}
                errorMessage={touchedFields.fullName ? errorMessages.fullName : undefined}
              />
            </InputContainer>
          </InputRow>
          
          <InputRow>
            <InputLabel>Дата рождения:</InputLabel>
            <InputContainer>
              <CustomInput
                name="birthdate"
                inputType="date"
                placeholder="дд.мм.гггг"
                value={formData.birthdate.toString() || ''}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                hasError={validationErrors.birthdate}
                errorMessage={touchedFields.birthdate ? errorMessages.birthdate : undefined}
              />
            </InputContainer>
          </InputRow>
          
          <ModalInfoTitle>Паспортные данные</ModalInfoTitle>
          
          <InputRow>
            <InputLabel>Паспорт:</InputLabel>
            <InputContainer>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <CustomInput
                  name="doc"
                  inputType="doc"
                  placeholder="Серия и номер"
                  value={formData.doc}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  hasError={touchedFields.doc && validationErrors.doc}
                  errorMessage={touchedFields.doc ? errorMessages.doc : undefined}
                  style={{ flex: 1 }}
                />
              </div>
            </InputContainer>
          </InputRow>

          <InputRow>
            <InputLabel>Адрес:</InputLabel>
            <InputContainer>
              <CustomInput
                name="address"
                inputType="text"
                placeholder="г. Грозный, ул. Примерная, д. 1, кв. 1"
                value={formData.address}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                errorMessage={touchedFields.address ? errorMessages.address : undefined}
              />
            </InputContainer>
          </InputRow>
          
          <ModalInfoTitle>Контактные данные</ModalInfoTitle>
          <InputRow>
            <InputLabel>Телефон:</InputLabel>
            <InputContainer>
              <PhoneModalInput
                name="phone"
                placeholder="Телефон"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                hasError={touchedFields.phone && validationErrors.phone}
                errorMessage={touchedFields.phone ? errorMessages.phone : undefined}
              />
            </InputContainer>
          </InputRow>
        </div>
      </form>
    </BaseModal>
  );
};

export default GuarantorModal;