import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import CustomCalendar from './CustomCalendar';
import BaseModal, { ModalHeader, ModalTitle } from '../../modal/BASE/modalCRUBase';
import type { PredefinedPeriod } from '../../../api/types/analytic';

interface PeriodOption {
  id: string;
  label: string;
  value: PredefinedPeriod;
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
  { id: 'Last7Days', label: 'За последние 7 дней', value: 'Last7Days' },
  { id: 'ThisMonth', label: 'За этот месяц', value: 'ThisMonth' },
  { id: 'Last31Days', label: 'За последние 31 день', value: 'Last31Days' },
  { id: 'PreviousMonth', label: 'За прошлый месяц', value: 'PreviousMonth' },
  { id: 'ThisYear', label: 'За этот год', value: 'ThisYear' },
  { id: 'PreviousYear', label: 'За прошлый год', value: 'PreviousYear' },
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectedOption = options.find(opt => opt.value === value);
    if (value.startsWith('custom_')) {
      const dates = value.replace('custom_', '').split('_');
      if (dates.length === 2) {
        setSelectedLabel(`С ${dates[0]} по ${dates[1]}`);
      }
    } else {
      setSelectedLabel(selectedOption ? selectedOption.label : '');
    }
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
      setIsModalOpen(true);
    }
  };

  const handleClearPeriod = () => {
    if (onChange) {
      onChange('');
    }
    setSelectedLabel('');
    setStartDate('');
    setEndDate('');
  };

  const handleSavePeriod = () => {
    if (startDate && endDate) {
      const formattedStart = formatDateForDisplay(startDate);
      const formattedEnd = formatDateForDisplay(endDate);
      const customValue = `custom_${formattedStart}_${formattedEnd}`;
      const customLabel = `С ${formattedStart} по ${formattedEnd}`;
      
      if (onChange) {
        onChange(customValue);
      }
      setSelectedLabel(customLabel);
      setIsModalOpen(false);
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const ModalHeaderContent = () => (
    <ModalHeaderWithClear>
        <ModalHeader style={{margin: 0}}>
          <ModalTitle style={{margin: 0}}>Выбор периода</ModalTitle>
        </ModalHeader>
      <ClearPeriodButton onClick={handleClearPeriod}>
        Очистить период
      </ClearPeriodButton>
    </ModalHeaderWithClear>
  );

  return (
    <>
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
                <RadioButton $isSelected={value === option.value}>
                  {value === option.value && <RadioButtonInner />}
                </RadioButton>
                <OptionLabel>{option.label}</OptionLabel>
              </OptionItem>
            ))}
            {showCustomPeriodButton && (
              <CustomPeriodButton onClick={handleCustomPeriodClick}>
                Другой период
              </CustomPeriodButton>
            )}
          </Dropdown>
        )}
      </Container>

      {isModalOpen && (
        <BaseModal
          title=""
          onClose={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
          onSave={(e) => {
            e.preventDefault();
            handleSavePeriod();
          }}
          saveButtonText="Выбрать"
          customLayout={<ModalHeaderContent />}
        >
          <CalendarContainer>
            <CalendarColumn>
              <CustomCalendar 
                value={startDate}
                onChange={(date) => setStartDate(date)}
              />
            </CalendarColumn>
            <CalendarColumn>
              <CustomCalendar 
                value={endDate}
                onChange={(date) => setEndDate(date)}
              />
            </CalendarColumn>
          </CalendarContainer>
        </BaseModal>
      )}
    </>
  );
};

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
  height: 20px;
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
  padding: 10px 12px;
  width: 100%;
  min-height: 38px;
  background: ${({ $isSelected }) => ($isSelected ? 'rgba(232, 216, 216, 1)' : 'transparent')};
  cursor: pointer;

  &:hover {
    background: rgba(232, 216, 216, 1);
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

const RadioButton = styled.div<{ $isSelected: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid ${({ $isSelected }) => ($isSelected ? '#007D88' : '#ADB3BC')};
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const RadioButtonInner = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #007D88;
`;

const OptionLabel = styled.span`
  font-family: 'Manrope', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 19px;
  color: #000000;
`;

const CustomPeriodButton = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px 12px 0 0;
  width: 100%;
  min-height: 38px;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 19px;
  color: #007D88;
  cursor: pointer;
  text-align: center;

  &:hover {
    background: #f5f5f5;
  }
`;

const CalendarContainer = styled.div`
  display: flex;
  gap: 20px;
  margin: 20px 25px;
`;

const CalendarColumn = styled.div`
  flex: 1;
`;

const ModalHeaderWithClear = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 25px;
`;

const ClearPeriodButton = styled.button`
  background: none;
  border: none;
  color: rgba(0, 125, 136, 1);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 4px;
  margin-right: 40px;

  &:hover {
    text-decoration: underline;
  }
`;

export default PeriodField;