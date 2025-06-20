import React, { useState, useRef, useEffect } from 'react';
import CalendarIcon from '../../../assets/ui/calendar.svg?react';
import styled from 'styled-components';

interface DateInputProps {
  prefix?: string;
  value?: string;
  onChange?: (date: string) => void;
  onReset?: () => void;
}

const DateInput: React.FC<DateInputProps> = ({ 
  prefix = 'Дата:', 
  value = '', 
  onChange, 
  onReset 
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDateSelect = (date: string) => {
    onChange?.(date);
    setIsPickerOpen(false);
  };

  const formatDisplayDate = () => {
    if (!value) return 'Выберите дату';
    const date = new Date(value);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleContainerClick = () => {
    setIsPickerOpen(true);
    setTimeout(() => {
      inputRef.current?.showPicker();
    }, 0);
  };

  return (
    <Container ref={containerRef}>
      <Field onClick={handleContainerClick}>
        {prefix && (
          <Prefix>{prefix}</Prefix>
        )}
        <DateText isEmpty={!value}>{formatDisplayDate()}</DateText>
        <CalendarIcon className="ml-2" style={{ fontSize: "20px" }}/>
      </Field>

      <HiddenInput
        type="date"
        ref={inputRef}
        value={value}
        onChange={(e) => handleDateSelect(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
  text-align: left;
`;

const Field = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 12px;
  font-size: 14px;
  border-radius: 5px;
  border: 1px solid rgba(209, 213, 219, 1);
  cursor: pointer;
  background-color: white;
  width: 100%;
  transition: border-color 0.2s ease;
    height: auto;
    max-height: 38px;
  box-sizing: border-box;

  &:hover {
    border-color: rgba(0, 125, 136, 1);
  }

  &:focus-within {
    border-color: rgba(0, 125, 136, 1);
  }
`;

const Prefix = styled.span`
  color: rgba(80, 85, 92, 1);
  margin-right: 8px;
`;

const DateText = styled.span<{ isEmpty: boolean }>`
  flex-grow: 1;
  color: ${({ isEmpty }) => isEmpty ? 'rgba(80, 85, 92, 1)' : '#000'};
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
  pointer-events: none;
`;

export default DateInput;