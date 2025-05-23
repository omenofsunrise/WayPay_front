import React, { useState, useEffect } from 'react';
import BaseModal, { type ModalMode } from './modalBase';
import CustomInput from '../ui/fields/CustomInput';

type ProductModalProps = {
  mode: ModalMode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: { name: string }) => void;
  initialData?: { name: string };
};

export const ProductModal: React.FC<ProductModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData = { name: '' },
}) => {
  const [productName, setProductName] = useState(initialData.name);
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [validationError, setValidationError] = useState(false);

  useEffect(() => {
    setProductName(initialData.name);
    setValidationError(false);
  }, [initialData]);

  useEffect(() => {
    const isNameValid = productName.trim().length > 0;
    const isNameChanged = productName !== initialData.name;
    
    if (mode === 'create') {
      setIsSaveDisabled(!isNameValid);
    } else if (mode === 'edit') {
      setIsSaveDisabled(!isNameValid || !isNameChanged);
    }
  }, [productName, initialData.name, mode]);

  const handleSubmit = () => {
    if (productName.trim().length === 0) {
      setValidationError(true);
      return;
    }
    
    onSubmit({ name: productName.trim() });
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductName(e.target.value);
    if (validationError && e.target.value.trim().length > 0) {
      setValidationError(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Создание товара';
      case 'edit':
        return 'Редактирование товара';
      case 'view':
        return 'Просмотр товара';
      default:
        const _exhaustiveCheck: never = mode;
        return 'Товар';
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
      mode={mode}
    >
      <div style={{ padding: '20px' }}>
        <CustomInput
          inputType="text"
          placeholder="Название продукта"
          value={productName}
          onChange={handleInputChange}
          disabled={mode === 'view'}
          hasError={validationError}
          errorMessage={validationError ? "Поле не может быть пустым" : undefined}
        />
      </div>
    </BaseModal>
  );
};