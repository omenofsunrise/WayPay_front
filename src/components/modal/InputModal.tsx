import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import CustomInput from '../ui/fields/CustomInput';
import BaseModal from './BASE/modalCRUBase';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  pieValue?: number;
  onChange: (value: string) => void;
  onPieChange?: (value: number) => void;
  onSubmit: () => void;
  submitText?: string;
  placeholder?: string;
  showPieField?: boolean;
  width?: string;
}

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  title,
  value,
  pieValue = 0,
  onChange,
  onPieChange,
  onSubmit,
  submitText = 'Сохранить',
  placeholder = '',
  showPieField = false,
  width = '562px'
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [pieInputValue, setPieInputValue] = useState(pieValue.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setInputValue(value);
    setPieInputValue(pieValue.toString());
  }, [value, pieValue]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setInputValue(value);
    setPieInputValue(pieValue.toString());
    onClose();
  };

  const handlePieChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const pieNumber = numericValue ? parseInt(numericValue) : 0;
    setPieInputValue(numericValue);
    if (onPieChange) {
      onPieChange(pieNumber);
    }
  };

  return (
    <BaseModal
      title={title}
      onClose={onClose}
      onCancel={handleCancel}
      onSave={handleSubmit}
      isSaveDisabled={!inputValue.trim() || (showPieField && !pieInputValue)}
      isSubmitting={isSubmitting}
      width={width}
      saveButtonText={submitText}
    >
      <InputContainer>
        <InputWrapper>
          <Label>Название пула</Label>
          <CustomInput
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              onChange(e.target.value);
            }}
            placeholder={placeholder}
            autoFocus
          />
        </InputWrapper>
        
        {showPieField && (
          <InputWrapper>
            <Label>Доля пула (%)</Label>
            <CustomInput
              value={pieInputValue}
              onChange={(e) => handlePieChange(e.target.value)}
              placeholder="0"
              type="number"
              min="0"
              max="100"
            />
          </InputWrapper>
        )}
      </InputContainer>
    </BaseModal>
  );
};

const InputContainer = styled.div`
  padding: 0 30px;
  margin-bottom: 20px;
`;

const InputWrapper = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  text-align: left;
`;

export default InputModal;