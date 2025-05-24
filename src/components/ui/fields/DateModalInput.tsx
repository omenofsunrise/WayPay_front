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
        // ignore parsing errors
      }
    }
    setDisplayValue('');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Если пользователь стер все (пустая строка), передаем пустое значение
    if (input === '') {
        setDisplayValue('');
        onChange?.({ 
        ...e, 
        target: { 
            ...e.target, 
            value: '' 
        } 
        } as React.ChangeEvent<HTMLInputElement>);
        return;
    }

    // Получаем только цифры из ввода
    const digits = input.replace(/\D/g, '');
    
    let formattedValue = '';
    let day = '';
    let month = '';
    let year = '';

    // Разбиваем цифры на компоненты даты
    if (digits.length > 0) {
        day = digits.substring(0, 2);
        if (digits.length > 2) {
        month = digits.substring(2, 4);
        if (digits.length > 4) {
            year = digits.substring(4, 8);
        }
        }
    }

    // Собираем отформатированную строку с учетом удаления символов
    if (day) {
        formattedValue = day;
        if (month) {
        formattedValue += `.${month}`;
        if (year) {
            formattedValue += `.${year}`;
        }
        }
    }

    setDisplayValue(formattedValue);

    // Если введена полная дата (дд.мм.гггг), преобразуем в ISO строку
    if (digits.length === 8) {
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
            value: isoDate 
            } 
        } as React.ChangeEvent<HTMLInputElement>);
        return;
        }
    }

    // Для неполных дат передаем текущее значение цифр
    onChange?.({ 
        ...e, 
        target: { 
        ...e.target, 
        value: digits 
        } 
    } as React.ChangeEvent<HTMLInputElement>);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Разрешаем: backspace, delete, tab, escape, enter, стрелки
    if ([8, 9, 27, 13, 46].includes(e.keyCode) || 
        (e.keyCode >= 37 && e.keyCode <= 40)) {
        return;
    }

    // Разрешаем только цифры
    if (!/[0-9]/.test(e.key)) {
        e.preventDefault();
    }
    };

  const handleBlur = () => {
    setIsFocused(false);
    
    if (displayValue.length === 10) { // дд.мм.гггг
      const [day, month, year] = displayValue.split('.');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
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
// Стили оставляем как в оригинале
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