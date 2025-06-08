import React, { useState, useEffect } from 'react';
import BaseModal, { type ModalMode } from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import CustomSelect from '../../ui/fields/CustomSelect';
import Avatar from '../../Profile/Avatar';
import { ModalTitle } from 'react-bootstrap';
import styled from 'styled-components';
import { BASE_URL } from '../../../api/client';
import { generateAvatar, getInitials } from '../../../utils/avatarUtils';

type EmployeeModalProps = {
  mode: ModalMode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeData: {
    fio: string;
    address: string;
    role: string;
    phone: string;
    minSurcharge: number;
  }) => void;
  initialData?: {
    fio: string;
    address: string;
    role: string;
    phone: string;
    minSurcharge: number;
    avatar?: string;
  };
};

const roleOptions = [
  { value: 'admin', label: 'Администратор' },
  { value: 'counter', label: 'Бухгалтер' },
  { value: 'employee', label: 'Сотрудник' },
];

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData = {
    fio: '',
    address: '',
    role: 'employee',
    phone: '',
    minSurcharge: 0,
    avatar: undefined,
  },
}) => {
  const [formData, setFormData] = useState({
    fio: initialData.fio,
    address: initialData.address,
    role: initialData.role,
    phone: initialData.phone,
    minSurcharge: initialData.minSurcharge,
  });
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [validationErrors, setValidationErrors] = useState({
    fio: false,
    phone: false,
  });

  useEffect(() => {
    setFormData({
      fio: initialData.fio,
      address: initialData.address,
      role: initialData.role,
      phone: initialData.phone,
      minSurcharge: initialData.minSurcharge,
    });
    setValidationErrors({
      fio: false,
      phone: false,
    });
  }, [initialData]);

  useEffect(() => {
    const isFioValid = formData.fio.trim().length > 0;
    const isPhoneValid = /^[\d\s()+-\s]+$/.test(formData.phone);
    
    const isFormValid = isFioValid && isPhoneValid;
    const isFormChanged = 
      formData.fio !== initialData.fio ||
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

  const handleSubmit = () => {
    const isFioValid = formData.fio.trim().length > 0;
    const isPhoneValid = /^[\d\s()+-\s]+$/.test(formData.phone);

    if (!isFioValid || !isPhoneValid) {
      setValidationErrors({
        fio: !isFioValid,
        phone: !isPhoneValid,
      });
      return;
    }
    
    onSubmit({
      fio: formData.fio.trim(),
      address: formData.address.trim(),
      role: formData.role,
      phone: formData.phone.trim(),
      minSurcharge: Number(formData.minSurcharge),
    });
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (validationErrors[name as keyof typeof validationErrors] && value.trim().length > 0) {
      setValidationErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
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

  const avatarSrc = initialData.avatar
          ? BASE_URL + initialData.avatar 
          : generateAvatar(getInitials(initialData.fio), 100);

  return (
    <BaseModal
      title={getTitle()}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSaveDisabled={mode !== 'view' && isSaveDisabled}
      children={<div></div>}
      width={"750px"}
      mode={mode}
      customLayout={
        <div style={{ display: 'flex', gap: '20px', width: "100%" }}>
          <div style={{ flexShrink: 0, padding: "40px 0" }}>
            <Avatar 
              src={avatarSrc} 
              size={220} 
              name={formData.fio} 
              disabled={mode === 'view'}
              showCameraIndicator={true} 
            />
          </div>
          <div style={{ flexGrow: 1, padding: '20px 20px 20px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Title>ФИО</Title>
              <CustomInput
                style={{ marginTop: "0" }}
                name="fio"
                inputType="text"
                placeholder="ФИО сотрудника"
                value={formData.fio}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                hasError={validationErrors.fio}
                errorMessage={validationErrors.fio ? "Поле не может быть пустым" : undefined}
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
                  />
                </FieldContainer>
                
                <FieldContainer>
                  <Title>Телефон</Title>
                  <CustomInput
                    name="phone"
                    inputType="number"
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