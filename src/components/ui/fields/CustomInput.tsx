import styled from 'styled-components';
import React from 'react';

type InputType = 'number' | 'text' | 'fullname' | 'doc' | 'date';

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  customPlaceholder?: string;
  inputType?: InputType;
  hasError?: boolean;
  errorMessage?: string;
}

const CustomInput: React.FC<CustomInputProps> = ({
  placeholder = '',
  customPlaceholder,
  value,
  inputType = 'text',
  onChange,
  hasError = false,
  errorMessage,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const showCustomPlaceholder = Boolean(customPlaceholder && !value && !isFocused);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return;

    let newValue = e.target.value;

    switch (inputType) {
      case 'number':
        if (/^\d*$/.test(newValue)) {
          onChange(e);
        }
        break;

      case 'fullname':
        newValue = newValue.replace(/[^a-zA-Zа-яА-ЯёЁ'\s]/g, '');
        newValue = newValue.replace(/\s{2,}/g, ' ');
        let words = newValue.split(' ').filter(word => word.length > 0);
        words = words.slice(0, 3);
        newValue = words
          .map(word => 
            word.length > 0 
              ? word[0].toUpperCase() + word.slice(1).toLowerCase() 
              : ''
          )
          .join(' ');
        if (newValue.length > 0 && newValue[newValue.length - 1] !== ' ' && 
            e.target.value.length > 0 && e.target.value[e.target.value.length - 1] === ' ') {
          newValue += ' ';
        }
        if (newValue.length > 100) {
          newValue = newValue.slice(0, 100);
        }
        e.target.value = newValue;
        onChange(e);
        break;

      case 'doc':
        newValue = newValue.replace(/\D/g, '');
        if (newValue.length > 4) {
          newValue = `${newValue.slice(0, 4)} ${newValue.slice(4, 10)}`;
        }
        if (newValue.length > 11) {
          newValue = newValue.slice(0, 11);
        }
        e.target.value = newValue;
        onChange(e);
        break;

      case 'date':
        newValue = newValue.replace(/\D/g, '');
        
        if (newValue.length > 4) {
          newValue = `${newValue.slice(0, 2)}.${newValue.slice(2, 4)}.${newValue.slice(4, 8)}`;
        } else if (newValue.length > 2) {
          newValue = `${newValue.slice(0, 2)}.${newValue.slice(2, 4)}`;
        }
        
        if (newValue.length > 10) {
          newValue = newValue.slice(0, 10);
        }
        
        const isDeleting = (value as string)?.length > newValue.length;
        if (isDeleting && [3, 6].includes(newValue.length)) {
          newValue = newValue.slice(0, newValue.length - 1);
        }
        
        e.target.value = newValue;
        onChange(e);
        break;

      default:
        onChange(e);
        break;
    }
  };

  return (
    <InputContainer>
      <StyledInput
        {...props}
        value={value}
        placeholder={showCustomPlaceholder ? '' : placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={handleInputChange}
        inputMode={inputType === 'number' || inputType === 'doc' || inputType === 'date' ? 'numeric' : 'text'}
        maxLength={inputType === 'doc' ? 11 : inputType === 'date' ? 10 : undefined}
        hasError={hasError}
      />
      {customPlaceholder && (
        <PlaceholderLabel isVisible={showCustomPlaceholder}>
          {customPlaceholder}
        </PlaceholderLabel>
      )}
      {hasError && errorMessage && (
        <ErrorMessage>{errorMessage}</ErrorMessage>
      )}
    </InputContainer>
  );
};


const InputContainer = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
  margin-right: auto;
`;

const StyledInput = styled.input<{ hasError?: boolean }>`
  padding: 10px 12px;
  border: 1px solid ${({ hasError }) => hasError ? 'rgba(239, 68, 68, 1)' : 'rgba(209, 213, 219, 1)'};
  border-radius: 5px;
  font-size: 14px;
  width: 100%;
  outline: none;
  transition: border-color 0.2s ease;
  height: auto;
  min-height: 38px;
  box-sizing: border-box;
  max-width: 500px;
  background-color: white;
  color: black;
  padding: 5px;
  padding-left: 15px;

  &:hover {
    border-color: ${({ hasError }) => hasError ? 'rgba(239, 68, 68, 1)' : 'rgba(0, 125, 136, 1)'};
  }

  &:focus {
    border-color: ${({ hasError }) => hasError ? 'rgba(239, 68, 68, 1)' : 'rgba(0, 125, 136, 1)'};
  }

  &::placeholder {
    color: rgba(80, 85, 92, 1);
    opacity: 1;
  }
`;

const PlaceholderLabel = styled.label<{ isVisible: boolean }>`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(80, 85, 92, 1);
  pointer-events: none;
  transition: all 0.2s ease;
  font-size: 14px;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  background-color: white;
  padding: 0 4px;
`;

const ErrorMessage = styled.span`
  color: rgba(239, 68, 68, 1);
  font-size: 12px;
  margin-top: 4px;
  display: block;
`;

export default CustomInput;