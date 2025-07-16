import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

interface PeriodOption {
  id: string;
  label: string;
  value: string;
}

interface PeriodFieldProps {
  value?: string;
  placeholder?: string;
  options?: PeriodOption[];
  showCustomPeriodButton?: boolean;
  onChange?: (value: string) => void;
  onCustomPeriodClick?: () => void;
}

const defaultOptions: PeriodOption[] = [
  { id: '7days', label: 'За последние 7 дней', value: '7days' },
  { id: 'thisMonth', label: 'За этот месяц', value: 'thisMonth' },
  { id: '31days', label: 'За последний 31 день', value: '31days' },
  { id: 'lastMonth', label: 'За прошлый месяц', value: 'lastMonth' },
  { id: 'thisYear', label: 'За этот год', value: 'thisYear' },
  { id: 'lastYear', label: 'За прошлый год', value: 'lastYear' },
];

const PeriodField: React.FC<PeriodFieldProps> = ({
  value = '',
  placeholder = 'Выберите период',
  options = defaultOptions,
  showCustomPeriodButton = true,
  onChange,
  onCustomPeriodClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectedOption = options.find(opt => opt.value === value);
    setSelectedLabel(selectedOption ? selectedOption.label : '');
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option: PeriodOption) => {
    if (onChange) {
      onChange(option.value);
    }
    setIsOpen(false);
  };

  const handleCustomPeriodClick = () => {
    setIsOpen(false);
    if (onCustomPeriodClick) {
      onCustomPeriodClick();
    } else {
      // Дефолтное поведение, если не передали обработчик
      const startDate = prompt('Введите начальную дату (ДД.ММ.ГГГГ):');
      const endDate = prompt('Введите конечную дату (ДД.ММ.ГГГГ):');
      
      if (startDate && endDate) {
        const customValue = `custom_${startDate}_${endDate}`;
        const customLabel = `С ${startDate} по ${endDate}`;
        
        if (onChange) {
          onChange(customValue);
        }
        setSelectedLabel(customLabel);
      }
    }
  };

  return (
    <Container ref={dropdownRef}>
      <InputField onClick={() => setIsOpen(!isOpen)}>
        <InputText>{selectedLabel || placeholder}</InputText>
        <ArrowIcon $isOpen={isOpen}>▼</ArrowIcon>
      </InputField>
      
      {isOpen && (
        <Dropdown>
          {options.map((option) => (
            <OptionItem
              key={option.id}
              onClick={() => handleSelect(option)}
              $isSelected={value === option.value}
            >
              <OptionLabel>{option.label}</OptionLabel>
              {value === option.value && <CheckMark>✓</CheckMark>}
            </OptionItem>
          ))}
          {showCustomPeriodButton && (
            <CustomPeriodButton onClick={handleCustomPeriodClick}>
              Другой период
              <CustomPeriodHint>Выбрать даты вручную</CustomPeriodHint>
            </CustomPeriodButton>
          )}
        </Dropdown>
      )}
    </Container>
  );
};

// Styled components
const Container = styled.div`
  position: relative;
  width: 205px;
`;

const InputField = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  width: 100%;
  height: 40px;
  background: #FFFFFF;
  border: 1px solid #D1D5DB;
  border-radius: 5px;
  cursor: pointer;
  user-select: none;

  &:hover {
    border-color: #ADB3BC;
  }

  &:focus {
    outline: none;
    border-color: #007D88;
  }
`;

const InputText = styled.span`
  font-family: 'Manrope', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 19px;
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ArrowIcon = styled.span<{ $isOpen: boolean }>`
  font-size: 10px;
  transition: transform 0.2s;
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  color: #ADB3BC;
  margin-left: 8px;
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin-top: 4px;
  background: #FFFFFF;
  box-shadow: 2px 2px 25px 2px rgba(0, 0, 0, 0.25);
  border-radius: 5px;
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
`;

const OptionItem = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  width: 100%;
  min-height: 38px;
  background: ${({ $isSelected }) => ($isSelected ? '#E8D8D8' : 'transparent')};
  cursor: pointer;

  &:hover {
    background: #f5f5f5;
  }

  &:first-child {
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
  }

  &:last-child {
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
  }
`;

const OptionLabel = styled.span`
  font-family: 'Manrope', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 19px;
  color: #000000;
`;

const CheckMark = styled.span`
  color: #007D88;
  font-weight: bold;
`;

const CustomPeriodButton = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  width: 100%;
  min-height: 38px;
  font-family: 'Manrope', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 19px;
  color: #007D88;
  cursor: pointer;
  border-top: 1px solid #f0f0f0;

  &:hover {
    background: #f5f5f5;
  }
`;

const CustomPeriodHint = styled.span`
  font-size: 12px;
  color: #ADB3BC;
  margin-top: 2px;
`;

export default PeriodField;