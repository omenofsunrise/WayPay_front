import React, { useState, useEffect } from 'react';
import BaseModal, { type ModalMode } from './modalBase';
import CustomInput from '../ui/fields/CustomInput';
import ModalInfoTitle from '../ui/Text/ModalInfoTitle';
import DateModalInput from '../ui/fields/DateModalInput';
import PhoneModalInput from '../ui/fields/PhoneModalInput';

interface Client {
  id: number;
  fullName: string;
  phone: string;
  doc: string;
  birthdate: Date;
  docIssueDate: Date;
}

type ClientModalProps = {
  mode: ModalMode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientData: Omit<Client, 'id'>) => void;
  initialData?: Client;
};

const ClientModal: React.FC<ClientModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData = {
    id: 0,
    fullName: '',
    phone: '',
    doc: '',
    birthdate: new Date(),
    docIssueDate: new Date()
  },
}) => {
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    fullName: initialData.fullName,
    phone: initialData.phone,
    doc: initialData.doc,
    birthdate: initialData.birthdate,
    docIssueDate: initialData.docIssueDate
  });

  const [validationErrors, setValidationErrors] = useState({
    fullName: false,
    phone: false,
    birthdate: false,
    doc: false,
    docIssueDate: false
  });

  const [errorMessages, setErrorMessages] = useState({
    fullName: '',
    phone: '',
    birthdate: '',
    doc: '',
    docIssueDate: ''
  });

  const [touchedFields, setTouchedFields] = useState({
    fullName: false,
    phone: false,
    birthdate: false,
    doc: false,
    docIssueDate: false
  });

  // Сбрасываем форму при изменении initialData
  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: initialData.fullName,
        phone: initialData.phone,
        doc: initialData.doc,
        birthdate: initialData.birthdate,
        docIssueDate: initialData.docIssueDate
      });
      setValidationErrors({
        fullName: false,
        phone: false,
        birthdate: false,
        doc: false,
        docIssueDate: false
      });
      setErrorMessages({
        fullName: '',
        phone: '',
        birthdate: '',
        doc: '',
        docIssueDate: ''
      });
      setTouchedFields({
        fullName: false,
        phone: false,
        birthdate: false,
        doc: false,
        docIssueDate: false
      });
    }
  }, [initialData, isOpen]);

  // Валидация при изменении данных
  useEffect(() => {
    if (mode === 'view') return;

    const newErrorMessages = {
      fullName: '',
      phone: '',
      birthdate: '',
      doc: '',
      docIssueDate: ''
    };

    // Валидация ФИО (минимум 2 слова)
    if (formData.fullName.trim().split(/\s+/).length < 2) {
      newErrorMessages.fullName = 'Укажите фамилию и имя (минимум 2 слова)';
    } else if (formData.fullName.trim().length === 0) {
      newErrorMessages.fullName = 'Поле обязательно для заполнения';
    }

    // Валидация телефона (пример: 8 (123) 456-78-90)
    const phoneRegex = /^(\+7|8)\s?\(?\d{3}\)?\s?\d{3}-?\d{2}-?\d{2}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      newErrorMessages.phone = 'Введите телефон в формате: 8 (123) 456-78-90';
    } else if (formData.phone.trim().length === 0) {
      newErrorMessages.phone = 'Поле обязательно для заполнения';
    }

    // Валидация даты рождения (18-100 лет)
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 100);
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 18);
    
    if (!(formData.birthdate instanceof Date) || isNaN(formData.birthdate.getTime())) {
      newErrorMessages.birthdate = 'Укажите корректную дату';
    } else if (formData.birthdate < minDate || formData.birthdate > maxDate) {
      newErrorMessages.birthdate = 'Возраст должен быть от 18 до 100 лет';
    }

    // Валидация документа (серия и номер: 4 цифры, пробел, 6 цифр)
    const docRegex = /^\d{4}\s\d{6}$/;
    if (!docRegex.test(formData.doc.trim())) {
      newErrorMessages.doc = 'Введите документ в формате: 1234 567890';
    } else if (formData.doc.trim().length === 0) {
      newErrorMessages.doc = 'Поле обязательно для заполнения';
    }

    // Валидация даты выдачи (не старше 90 лет и не в будущем)
    const minDocIssueDate = new Date();
    minDocIssueDate.setFullYear(today.getFullYear() - 90);
    
    if (!(formData.docIssueDate instanceof Date) || isNaN(formData.docIssueDate.getTime())) {
      newErrorMessages.docIssueDate = 'Укажите корректную дату';
    } else if (formData.docIssueDate < minDocIssueDate) {
      newErrorMessages.docIssueDate = 'Дата выдачи не может быть старше 90 лет';
    } else if (formData.docIssueDate > today) {
      newErrorMessages.docIssueDate = 'Дата выдачи не может быть в будущем';
    }

    setErrorMessages(newErrorMessages);

    const errors = {
      fullName: !!newErrorMessages.fullName,
      phone: !!newErrorMessages.phone,
      birthdate: !!newErrorMessages.birthdate,
      doc: !!newErrorMessages.doc,
      docIssueDate: !!newErrorMessages.docIssueDate
    };

    setValidationErrors(errors);
  }, [formData, mode]);

  // Проверка, можно ли разблокировать кнопку сохранения
  const isSaveDisabled = () => {
    if (mode === 'view') return true;

    // Проверяем, есть ли ошибки валидации
    const hasErrors = Object.values(validationErrors).some(Boolean);
    if (hasErrors) return true;

    // Для режима редактирования проверяем, были ли изменения
    if (mode === 'edit') {
      const isChanged = (
        formData.fullName !== initialData.fullName ||
        formData.phone !== initialData.phone ||
        formData.doc !== initialData.doc ||
        formData.birthdate.getTime() !== initialData.birthdate.getTime() ||
        formData.docIssueDate.getTime() !== initialData.docIssueDate.getTime()
      );
      return !isChanged;
    }

    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Помечаем все поля как "тронутые" для показа ошибок
    setTouchedFields({
      fullName: true,
      phone: true,
      birthdate: true,
      doc: true,
      docIssueDate: true
    });

    // Проверяем валидность
    const isValid = !Object.values(validationErrors).some(Boolean);
    if (!isValid) {
      return;
    }

    onSubmit(formData);
    onClose();
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

  const handleDateChange = (name: string, value: string) => {
    let date: Date;
    
    if (value && typeof value === 'string') {
      try {
        const [year, month, day] = value.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (isNaN(date.getTime())) {
          date = new Date(NaN);
        }
      } catch {
        date = new Date(NaN);
      }
    } else {
      date = new Date(NaN);
    }

    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Создание клиента';
      case 'edit': return 'Редактирование клиента';
      case 'view': return 'Просмотр клиента';
      default: return 'Клиент';
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title={getTitle()}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSaveDisabled={isSaveDisabled()}
      mode={mode}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <ModalInfoTitle>Основная информация</ModalInfoTitle>
          
          <CustomInput
            name="fullName"
            inputType="fullname"
            placeholder="ФИО клиента"
            value={formData.fullName}
            onChange={handleInputChange}
            disabled={mode === 'view'}
            hasError={touchedFields.fullName && validationErrors.fullName}
            errorMessage={touchedFields.fullName ? errorMessages.fullName : undefined}
          />
          
          <DateModalInput
            name="birthdate"
            placeholder="Дата рождения"
            value={
              formData.birthdate instanceof Date && !isNaN(formData.birthdate.getTime()) 
                ? formData.birthdate.toISOString() 
                : ''
            }
            onChange={(e) => handleDateChange('birthdate', e.target.value)}
            disabled={mode === 'view'}
            hasError={touchedFields.birthdate && validationErrors.birthdate}
            errorMessage={touchedFields.birthdate ? errorMessages.birthdate : undefined}
          />
          
          <PhoneModalInput
            name="phone"
            placeholder="Телефон"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={mode === 'view'}
            hasError={touchedFields.phone && validationErrors.phone}
            errorMessage={touchedFields.phone ? errorMessages.phone : undefined}
          />
          
          <ModalInfoTitle>Паспортные данные</ModalInfoTitle>
          
          <CustomInput
            name="doc"
            inputType="doc"
            placeholder="Документ (формат: 1234 567890)"
            value={formData.doc}
            onChange={handleInputChange}
            disabled={mode === 'view'}
            hasError={touchedFields.doc && validationErrors.doc}
            errorMessage={touchedFields.doc ? errorMessages.doc : undefined}
          />
          
          <DateModalInput
            name="docIssueDate"
            placeholder="Дата выдачи"
            value={
              formData.docIssueDate instanceof Date && !isNaN(formData.docIssueDate.getTime()) 
                ? formData.docIssueDate.toISOString() 
                : ''
            }
            onChange={(e) => handleDateChange('docIssueDate', e.target.value)}
            disabled={mode === 'view'}
            hasError={touchedFields.docIssueDate && validationErrors.docIssueDate}
            errorMessage={touchedFields.docIssueDate ? errorMessages.docIssueDate : undefined}
          />
        </div>
      </form>
    </BaseModal>
  );
};

export default ClientModal;