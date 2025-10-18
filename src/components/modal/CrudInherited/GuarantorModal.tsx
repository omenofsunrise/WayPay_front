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

// Тип для драг-н-дроп полей
interface DraggableField {
  id: string;
  type: 'fullName' | 'phone' | 'birthdate' | 'doc' | 'address' | 'section';
  label: string;
  required?: boolean;
  section?: string;
}

const emptyGuarantor: Omit<Guarantor, 'id'> = {
  fullName: '',
  phone: '',
  doc: '',
  birthdate: '',
  address: ''
};

// Конфигурация полей для драг-н-дроп
const defaultFieldConfig: DraggableField[] = [
  { id: 'section-basic', type: 'section', label: 'Основная информация', section: 'basic' },
  { id: 'fullName', type: 'fullName', label: 'ФИО:', required: true, section: 'basic' },
  { id: 'birthdate', type: 'birthdate', label: 'Дата рождения:', required: true, section: 'basic' },
  { id: 'section-passport', type: 'section', label: 'Паспортные данные', section: 'passport' },
  { id: 'doc', type: 'doc', label: 'Паспорт:', section: 'passport' },
  { id: 'address', type: 'address', label: 'Адрес:', section: 'passport' },
  { id: 'section-contact', type: 'section', label: 'Контактные данные', section: 'contact' },
  { id: 'phone', type: 'phone', label: 'Телефон:', required: true, section: 'contact' },
];

// Компонент для перетаскиваемого поля
interface DraggableInputProps {
  field: DraggableField;
  formData: Omit<Guarantor, 'id'>;
  validationErrors: any;
  errorMessages: any;
  touchedFields: any;
  mode: ModalMode;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart: (fieldId: string) => void;
  onDragOver: (fieldId: string) => void;
  onDragEnd: () => void;
  onDrop: (fieldId: string) => void;
}

const DraggableInput: React.FC<DraggableInputProps> = ({
  field,
  formData,
  validationErrors,
  errorMessages,
  touchedFields,
  mode,
  onInputChange,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', field.id);
    onDragStart(field.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver(field.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedFieldId = e.dataTransfer.getData('text/plain');
    if (draggedFieldId !== field.id) {
      onDrop(field.id);
    }
  };

  if (field.type === 'section') {
    return (
      <div 
        draggable={mode !== 'view'}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={onDragEnd}
        style={{
          marginTop: '0px',
          marginBottom: '0px',
          cursor: mode !== 'view' ? 'grab' : 'default',
          opacity: isDragging ? 0.5 : 1,
          backgroundColor: 'transparent',
          padding: '8px',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          border: isDragOver ? '2px dashed rgba(0, 125, 136, 1)' : 'none',
        }}
      >
        <ModalInfoTitle>{field.label}</ModalInfoTitle>
      </div>
    );
  }

  const getInputComponent = () => {
    const commonProps = {
      name: field.type,
      placeholder: getPlaceholder(field.type),
      value: formData[field.type]?.toString() || '',
      onChange: onInputChange,
      disabled: mode === 'view',
      hasError: touchedFields[field.type] && validationErrors[field.type],
      errorMessage: touchedFields[field.type] ? errorMessages[field.type] : undefined,
    };

    switch (field.type) {
      case 'phone':
        return (
          <PhoneModalInput
            {...commonProps}
          />
        );
      case 'birthdate':
        return (
          <CustomInput
            {...commonProps}
            inputType="date"
          />
        );
      case 'doc':
        return (
          <CustomInput
            {...commonProps}
            inputType="doc"
          />
        );
      case 'fullName':
        return (
          <CustomInput
            {...commonProps}
            inputType="fullname"
          />
        );
      default:
        return (
          <CustomInput
            {...commonProps}
            inputType="text"
          />
        );
    }
  };

  const getPlaceholder = (type: string) => {
    switch (type) {
      case 'fullName': return 'ФИО поручителя';
      case 'birthdate': return 'дд.мм.гггг';
      case 'doc': return 'Серия и номер';
      case 'address': return 'г. Грозный, ул. Примерная, д. 1, кв. 1';
      case 'phone': return 'Телефон';
      default: return '';
    }
  };

  return (
    <InputRow
      draggable={mode !== 'view'}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
      style={{
        cursor: mode !== 'view' ? 'grab' : 'default',
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: 'transparent',
        padding: '8px',
        borderRadius: '4px',
        transition: 'all 0.2s ease',
        border: isDragOver ? '2px dashed rgba(0, 125, 136, 1)' : 'none',
      }}
    >
      <InputLabel>
        {field.label}
      </InputLabel>
      <InputContainer>
        {getInputComponent()}
      </InputContainer>
    </InputRow>
  );
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
  
  // Состояние для конфигурации полей
  const [fieldConfig, setFieldConfig] = useState<DraggableField[]>(defaultFieldConfig);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [dragOverField, setDragOverField] = useState<string | null>(null);

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

  // Функции для драг-н-дроп
  const handleDragStart = (fieldId: string) => {
    setDraggedField(fieldId);
  };

  const handleDragOver = (fieldId: string) => {
    setDragOverField(fieldId);
  };

  const handleDragEnd = () => {
    setDraggedField(null);
    setDragOverField(null);
  };

  const handleDrop = (targetFieldId: string) => {
    if (!draggedField || draggedField === targetFieldId) return;

    const draggedFieldData = fieldConfig.find(f => f.id === draggedField);
    const targetFieldData = fieldConfig.find(f => f.id === targetFieldId);

    if (!draggedFieldData || !targetFieldData) return;

    const newConfig = [...fieldConfig];
    const draggedIndex = newConfig.findIndex(f => f.id === draggedField);
    const targetIndex = newConfig.findIndex(f => f.id === targetFieldId);

    // Если перетаскиваем поле в раздел
    if (targetFieldData.type === 'section' && draggedFieldData.type !== 'section') {
      // Находим все поля текущего раздела перетаскиваемого поля
      const currentSectionFields = newConfig.filter(f => f.section === draggedFieldData.section && f.type !== 'section');
      
      // Если в текущем разделе только одно поле (это которое перетаскиваем), то перемещаем раздел вместе с полем
      if (currentSectionFields.length === 1 && currentSectionFields[0].id === draggedField) {
        // Находим заголовок раздела
        const sectionHeader = newConfig.find(f => f.type === 'section' && f.section === draggedFieldData.section);
        
        if (sectionHeader) {
          // Удаляем и поле, и заголовок раздела
          const sectionHeaderIndex = newConfig.findIndex(f => f.id === sectionHeader.id);
          newConfig.splice(sectionHeaderIndex, 1); // Удаляем заголовок
          const [movedField] = newConfig.splice(draggedIndex > sectionHeaderIndex ? draggedIndex - 1 : draggedIndex, 1); // Удаляем поле
          
          // Обновляем раздел у перетаскиваемого поля
          movedField.section = targetFieldData.section;
          
          // Вставляем поле после целевого раздела
          const targetSectionIndex = newConfig.findIndex(f => f.id === targetFieldId);
          newConfig.splice(targetSectionIndex + 1, 0, movedField);
        }
      } else {
        // Обновляем раздел у перетаскиваемого поля
        draggedFieldData.section = targetFieldData.section;
        
        // Перемещаем поле сразу после раздела
        const [movedField] = newConfig.splice(draggedIndex, 1);
        
        // Вставляем после целевого раздела
        const sectionIndex = newConfig.findIndex(f => f.id === targetFieldId);
        newConfig.splice(sectionIndex + 1, 0, movedField);
      }
    }
    // Если перетаскиваем раздел
    else if (draggedFieldData.type === 'section' && targetFieldData.type === 'section') {
      // Перемещаем весь раздел
      const draggedSection = draggedFieldData.section;
      const targetSection = targetFieldData.section;
      
      if (draggedSection === targetSection) {
        setDragOverField(null);
        return;
      }

      // Находим все элементы обоих разделов
      const draggedSectionFields = newConfig.filter(f => f.section === draggedSection);
      const targetSectionFields = newConfig.filter(f => f.section === targetSection);
      
      // Удаляем поля dragged раздела
      const filteredConfig = newConfig.filter(f => f.section !== draggedSection);
      
      // Находим индекс целевого раздела в отфильтрованном массиве
      const targetSectionIndex = filteredConfig.findIndex(f => f.id === targetFieldId);
      
      // Вставляем dragged раздел после целевого раздела
      const insertIndex = targetSectionIndex + targetSectionFields.length;
      filteredConfig.splice(insertIndex, 0, ...draggedSectionFields);
      
      setFieldConfig(filteredConfig);
      setDragOverField(null);
      return;
    }
    // Если перетаскиваем поле на другое поле
    else {
      const [movedField] = newConfig.splice(draggedIndex, 1);
      newConfig.splice(targetIndex, 0, movedField);
    }

    setFieldConfig(newConfig);
    setDragOverField(null);
  };

  const getFieldsBySections = () => {
    const sections: { [key: string]: DraggableField[] } = {};
    
    fieldConfig.forEach(field => {
      if (!sections[field.section!]) {
        sections[field.section!] = [];
      }
      sections[field.section!].push(field);
    });

    const validSections = Object.keys(sections).filter(sectionId => {
      const sectionFields = sections[sectionId];
      return sectionFields.some(field => field.type !== 'section');
    });

    const result: DraggableField[] = [];
    
    validSections.forEach(sectionId => {
      const sectionFields = sections[sectionId];
      
      const sectionHeader = sectionFields.find(field => field.type === 'section');
      
      if (sectionHeader) {
        result.push(sectionHeader);
      }
      
      sectionFields.forEach(field => {
        if (field.type !== 'section') {
          result.push(field);
        }
      });
    });
    
    return result;
  };

  const getSectionLabel = (section: string): string => {
    switch (section) {
      case 'basic': return 'Основная информация';
      case 'passport': return 'Паспортные данные';
      case 'contact': return 'Контактные данные';
      default: return 'Дополнительная информация';
    }
  };

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

  const displayFields = getFieldsBySections();

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
          
          {displayFields.map((field) => (
            <DraggableInput
              key={field.id}
              field={field}
              formData={formData}
              validationErrors={validationErrors}
              errorMessages={errorMessages}
              touchedFields={touchedFields}
              mode={mode}
              onInputChange={handleInputChange}
              isDragging={draggedField === field.id}
              isDragOver={dragOverField === field.id}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </form>
    </BaseModal>
  );
};

export default GuarantorModal;