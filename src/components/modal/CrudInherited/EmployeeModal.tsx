import React, { useState, useEffect, useCallback } from 'react';
import BaseModal, { type ModalMode } from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import CustomSelect from '../../ui/fields/CustomSelect';
import Avatar from '../../Profile/Avatar';
import { ModalTitle } from 'react-bootstrap';
import styled from 'styled-components';
import { BASE_URL } from '../../../api/client';
import { generateAvatar, getInitials } from '../../../utils/avatarUtils';
import { useEmployee } from '../../../api/hooks/useEmployee';

type EmployeeModalProps = {
  mode: ModalMode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeData: {
    fullName: string;
    address: string;
    role: string;
    phone: string;
    minSurcharge: number;
  }) => Promise<void>;
  initialData?: {
    id?: number;
    fullName: string;
    address: string;
    role: string;
    phone: string;
    minSurcharge: number;
    avatar?: string;
  };
};

const roleOptions = [
  { value: 'admin', label: 'Администратор' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'employee', label: 'Сотрудник' },
];

const EmployeeModal: React.FC<EmployeeModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData = {
    fullName: '',
    address: '',
    role: 'employee',
    phone: '',
    minSurcharge: 0,
    avatar: undefined,
  },
}) => {
  const { updateEmployeePhoto, refresh } = useEmployee();
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    address: initialData?.address || '',
    role: initialData?.role || 'сотрудник',
    phone: initialData?.phone || '',
    minSurcharge: initialData?.minSurcharge || 0,
  });
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [validationErrors, setValidationErrors] = useState({
    fullName: false,
    phone: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string>(
    initialData.avatar
      ? `${BASE_URL}${initialData.avatar}?${Date.now()}`
      : generateAvatar(getInitials(initialData.fullName || ''), 100)
  );

  const handlePhotoChange = async (file: File) => {
    if (!initialData.id) return;
    
    try {
      setIsSubmitting(true);
      const updatedEmployee = await updateEmployeePhoto(initialData.id, file);
      
      if (updatedEmployee.photoPath) {
        const newAvatarUrl = `${BASE_URL}${updatedEmployee.photoPath}?${Date.now()}`;
        setAvatarSrc(newAvatarUrl);
        await refresh();
      }
    } catch (error) {
      console.error("Error updating photo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setFormData({
      fullName: initialData.fullName || '',
      address: initialData.address || '',
      role: initialData.role || 'employee',
      phone: initialData.phone || '',
      minSurcharge: initialData.minSurcharge || 0,
    });
    setValidationErrors({
      fullName: false,
      phone: false,
    });
    
    if (initialData.avatar) {
      setAvatarSrc(`${BASE_URL}${initialData.avatar}?${Date.now()}`);
    } else if (initialData.fullName) {
      setAvatarSrc(generateAvatar(getInitials(initialData.fullName || ''), 100));
    }
  }, [initialData]);

  useEffect(() => {
    const isFullNameValid = formData.fullName.trim().length > 0;
    const isPhoneValid = /^[\d\s()+-\s]+$/.test(formData.phone);
    
    const isFormValid = isFullNameValid && isPhoneValid;
    const isFormChanged = 
      formData.fullName !== initialData.fullName ||
      formData.address !== initialData.address ||
      formData.role !== initialData.role ||
      formData.phone !== initialData.phone ||
      formData.minSurcharge !== initialData.minSurcharge;

    if (mode === 'create') {
      setIsSaveDisabled(!isFormValid);
    } else if (mode === 'edit') {
      setIsSaveDisabled(!isFormValid || !isFormChanged);
    }
  }, [formData, initialData, mode]);

  const handleSubmit = async () => {
    const isFullNameValid = formData.fullName.trim().length > 0;
    const isPhoneValid = /^[\d\s()+-\s]+$/.test(formData.phone);

    if (!isFullNameValid || !isPhoneValid) {
      setValidationErrors({
        fullName: !isFullNameValid,
        phone: !isPhoneValid,
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onSubmit({
        fullName: formData.fullName.trim(),
        address: formData.address.trim(),
        role: formData.role,
        phone: formData.phone.trim(),
        minSurcharge: Number(formData.minSurcharge),
      });
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (validationErrors[name as keyof typeof validationErrors] && value.trim().length > 0) {
      setValidationErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, role: e.target.value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Number(e.target.value));
    setFormData(prev => ({ ...prev, minSurcharge: value }));
  };
  
  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Добавление сотрудника';
      case 'edit':
        return 'Редактирование профиля';
      case 'view':
        return 'Просмотр сотрудника';
      default:
        const _exhaustiveCheck: never = mode;
        return 'Сотрудник';
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title={getTitle()}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSaveDisabled={mode !== 'view' && isSaveDisabled}
      isSubmitting={isSubmitting}
      children={<div></div>}
      width={"750px"}
      mode={mode}
      customLayout={
        <div style={{ display: 'flex', gap: '20px', width: "100%" }}>
          <div style={{ flexShrink: 0, padding: "40px 0" }}>
            <Avatar 
              src={avatarSrc} 
              size={220} 
              name={formData.fullName} 
              disabled={mode === 'view'}
              showCameraIndicator={mode !== 'view'} 
              onPhotoChange={mode !== 'view' ? handlePhotoChange : undefined}
            />
          </div>
          <div style={{ flexGrow: 1, padding: '20px 20px 20px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Title>ФИО</Title>
              <CustomInput
                style={{ marginTop: "0" }}
                name="fullName"
                inputType="text"
                placeholder="ФИО сотрудника"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                hasError={validationErrors.fullName}
                errorMessage={validationErrors.fullName ? "Поле не может быть пустым" : undefined}
              />
              
              <Title>Адрес</Title>
              <CustomInput
                name="address"
                inputType="text"
                placeholder="Адрес"
                value={formData.address}
                onChange={handleInputChange}
                disabled={mode === 'view'}
              />

              <RowContainer>
                <FieldContainer>
                  <Title>Роль</Title>
                  <CustomSelect
                    options={roleOptions}
                    disabled={mode === 'view'}
                    placeholder="Выберите роль"
                    value={formData.role}
                    onChange={handleSelectChange}
                  />
                </FieldContainer>
                
                <FieldContainer>
                  <Title>Телефон</Title>
                  <CustomInput
                    name="phone"
                    inputType="text"
                    placeholder="Телефон"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={mode === 'view'}
                    hasError={validationErrors.phone}
                    errorMessage={validationErrors.phone ? "Некорректный формат телефона" : undefined}
                  />
                </FieldContainer>
                
                <FieldContainer>
                  <Title>Мин. надбавка%</Title>
                  <CustomInput
                    name="minSurcharge"
                    inputType="number"
                    placeholder="Минимальная надбавка"
                    value={formData.minSurcharge.toString()}
                    onChange={handleNumberChange}
                    disabled={mode === 'view'}
                    min={0}
                  />
                </FieldContainer>
              </RowContainer>
            </div>
          </div>
        </div>
      }
    />
  );
};

const Title = styled.h3`
  color: black;
  text-align: left;
  margin: 0;
  padding: 0;
  margin-top: 15px;
  font-size: 14px;
  font-weight: 400;
`;

const RowContainer = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
`;

const FieldContainer = styled.div`
  flex: 1;
  min-width: 0;
`;

export default EmployeeModal;