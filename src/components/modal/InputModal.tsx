import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import CustomInput from '../ui/fields/CustomInput';
import BaseModal from './BASE/modalCRUBase';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitText?: string;
  placeholder?: string;
  width?: string;
}

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  title,
  value,
  onChange,
  onSubmit,
  submitText = 'Сохранить',
  placeholder = '',
  width = '562px'
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

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
    onClose();
  };

  return (
    <BaseModal
      title={title}
      onClose={onClose}
      onCancel={handleCancel}
      onSave={handleSubmit}
      isSaveDisabled={!inputValue.trim()}
      isSubmitting={isSubmitting}
      width={width}
      saveButtonText={submitText}
    >
      <InputContainer>
        <CustomInput
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          autoFocus
        />
      </InputContainer>
    </BaseModal>
  );
};

const InputContainer = styled.div`
  padding: 0 30px;
  margin-bottom: 20px;
`;

export default InputModal;