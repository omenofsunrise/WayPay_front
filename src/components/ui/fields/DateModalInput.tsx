import styled from 'styled-components';
import React, { useState, useEffect, useRef } from 'react';

interface DateModalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  customPlaceholder?: string;
  hasError?: boolean;
  errorMessage?: string;
}

const DateModalInput: React.FC<DateModalInputProps> = ({
  placeholder = 'дд.мм.гггг',
  customPlaceholder,
  value = '',
  onChange,
  hasError = false,
  errorMessage,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const showCustomPlaceholder = Boolean(customPlaceholder && !value && !isFocused);

  useEffect(() => {
    if (value && typeof value === 'string') {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          setDisplayValue(`${day}.${month}.${year}`);
          return;
        }
      } catch {
      }
    }
    setDisplayValue('');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    const cleanedValue = input.replace(/[^\d.]/g, '');
    
    const parts = cleanedValue.split('.').filter(part => part !== '');
    
    let formattedValue = '';
    if (parts.length > 0) {
      const day = parts[0].slice(0, 2);
      formattedValue = day;
      
      if (parts.length > 1 || (parts[0].length > 2 && parts.length === 1)) {
        const monthPart = parts.length > 1 ? parts[1] : parts[0].slice(2);
        const month = monthPart.slice(0, 2);
        formattedValue += `.${month}`;
        
        if (parts.length > 2 || (monthPart.length > 2 && parts.length === 2) || 
            (parts.length === 1 && parts[0].length > 4)) {
          const yearPart = parts.length > 2 ? parts[2] : 
                         parts.length === 2 ? parts[1].slice(2) : 
                         parts[0].slice(4);
          const year = yearPart.slice(0, 4);
          formattedValue += `.${year}`;
        }
      }
    }
    
    setDisplayValue(formattedValue);
    
    if (formattedValue.length === 10) {
      const [day, month, year] = formattedValue.split('.');
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10) - 1;
      const yearNum = parseInt(year, 10);
      
      const date = new Date(yearNum, monthNum, dayNum);
      if (!isNaN(date.getTime())) {
        const isoDate = date.toISOString().split('T')[0];
        onChange?.({
            ...e,
            target: {
                ...e.target,
                value: formattedValue
          }
        });
        return;
      }
    }
    
    onChange?.({
      ...e,
      target: {
        ...e.target,
        value: formattedValue
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ([8, 9, 27, 13, 46].includes(e.keyCode) || 
        (e.keyCode >= 37 && e.keyCode <= 40)) {
      return;
    }

    if (!/[0-9.]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    if (displayValue.length === 10) {
      const [day, month, year] = displayValue.split('.');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      if (!isNaN(date.getTime())) {
        const isoDate = date.toISOString().split('T')[0];
        onChange?.({
          target: {
            value: isoDate,
          },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  return (
    <InputContainer>
      <StyledInput
        {...props}
        ref={inputRef}
        value={displayValue}
        placeholder={showCustomPlaceholder ? '' : placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        inputMode="numeric"
        hasError={hasError}
        maxLength={10}
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

export default DateModalInput;