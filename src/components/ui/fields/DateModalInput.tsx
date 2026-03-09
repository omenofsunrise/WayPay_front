import styled from 'styled-components';
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface DateModalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  placeholder?: string;
  customPlaceholder?: string;
  hasError?: boolean;
  errorMessage?: string;
  value: string | null;
  onChange: (date: string | null) => void;
}

const DateModalInput: React.FC<DateModalInputProps> = ({
  placeholder = 'дд.мм.гггг',
  customPlaceholder,
  value,
  onChange,
  hasError = false,
  errorMessage,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const showCustomPlaceholder = Boolean(customPlaceholder && !displayValue && !isFocused);

  // Конвертация ISO даты в формат ДД.ММ.ГГГГ для отображения
  useEffect(() => {
    if (value && typeof value === 'string') {
      try {
        // Разбираем ISO дату (YYYY-MM-DD)
        const [year, month, day] = value.split('-').map(Number);
        
        // Проверяем, что все части даты корректны
        if (year && month && day && !isNaN(year) && !isNaN(month) && !isNaN(day)) {
          // Создаем дату в локальном времени, чтобы избежать проблем с часовыми поясами
          const localDate = new Date(year, month - 1, day);
          
          if (!isNaN(localDate.getTime())) {
            const formattedDay = String(day).padStart(2, '0');
            const formattedMonth = String(month).padStart(2, '0');
            setDisplayValue(`${formattedDay}.${formattedMonth}.${year}`);
            return;
          }
        }
      } catch {
        // Игнорируем ошибки парсинга
      }
    }
    setDisplayValue('');
  }, [value]);

  // Конвертация ДД.ММ.ГГГГ в ISO формат (YYYY-MM-DD) без потери дня
  const convertToISO = useCallback((dateStr: string): string | null => {
    if (dateStr.length !== 10) return null;
    
    const [day, month, year] = dateStr.split('.');
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    // Проверяем корректность даты
    if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
      // Возвращаем дату в формате YYYY-MM-DD без создания объекта Date
      // чтобы избежать проблем с часовыми поясами
      return `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    }
    
    return null;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Удаляем все не-цифры, кроме точек
    const cleanedValue = input.replace(/[^\d.]/g, '');
    
    // Автоматическое форматирование при вводе
    let formattedValue = '';
    const digits = cleanedValue.replace(/\./g, '');
    
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 2 || i === 4) {
        formattedValue += '.';
      }
      formattedValue += digits[i];
    }
    
    setDisplayValue(formattedValue);
    
    // Если дата полная, конвертируем и отправляем в родительский компонент
    if (formattedValue.length === 10) {
      const isoDate = convertToISO(formattedValue);
      onChange(isoDate);
    } else {
      // Если дата неполная, отправляем null
      onChange(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Разрешаем специальные клавиши
    if ([8, 9, 27, 13, 46].includes(e.keyCode) || 
        (e.keyCode >= 37 && e.keyCode <= 40)) {
      return;
    }

    // Разрешаем только цифры и точку
    if (!/[0-9.]/.test(e.key)) {
      e.preventDefault();
    }
    
    // Ограничиваем количество точек
    if (e.key === '.' && displayValue.split('.').length >= 3) {
      e.preventDefault();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // При потере фокуса проверяем и конвертируем дату
    if (displayValue.length === 10) {
      const isoDate = convertToISO(displayValue);
      if (isoDate) {
        onChange(isoDate);
      } else {
        setDisplayValue('');
        onChange(null);
      }
    } else if (displayValue.length > 0) {
      // Если дата неполная, очищаем поле
      setDisplayValue('');
      onChange(null);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <InputContainer>
      <StyledInput
        {...props}
        ref={inputRef}
        type="text"
        value={displayValue}
        placeholder={showCustomPlaceholder ? '' : placeholder}
        onFocus={handleFocus}
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
  transition: opacity 0.2s ease;
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