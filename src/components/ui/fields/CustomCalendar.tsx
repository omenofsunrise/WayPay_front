import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import CalendarIcon from '../../../assets/ui/calendar.svg?react';

interface DateInputProps {
  prefix?: string;
  value?: string;
  placeholder?: string;
  onChange?: (date: string) => void;
  onReset?: () => void;
}

const formatDisplayString = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const parseDisplayString = (text: string): { iso: string; date: Date } | null => {
  if (text.length !== 10) return null;
  const [d, m, y] = text.split('.');
  const day = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year = parseInt(y, 10);
  if (
    !Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year) ||
    day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100
  ) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return null;
  }
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { iso, date };
};

const months = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const CustomCalendar: React.FC<DateInputProps> = ({ 
  prefix = 'Дата:', 
  value = '', 
  placeholder = 'Выберите дату',
  onChange, 
  onReset 
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [inputValue, setInputValue] = useState<string>(() =>
    value ? formatDisplayString(new Date(value)) : ''
  );
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
        setShowMonthDropdown(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setShowYearDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setInputValue(formatDisplayString(date));
    } else {
      setSelectedDate(null);
      setInputValue('');
    }
  }, [value]);

  const handleManualChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d.]/g, '');
    const digits = cleaned.replace(/\./g, '');
    let formatted = '';
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 2 || i === 4) formatted += '.';
      formatted += digits[i];
    }
    setInputValue(formatted);

    const parsed = parseDisplayString(formatted);
    if (parsed) {
      setSelectedDate(parsed.date);
      setCurrentDate(parsed.date);
      onChange?.(parsed.iso);
    }
  }, [onChange]);

  const handleManualKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if ([8, 9, 27, 13, 46].includes(e.keyCode) || (e.keyCode >= 37 && e.keyCode <= 40)) return;
    if (!/[0-9.]/.test(e.key)) {
      e.preventDefault();
      return;
    }
    if (e.key === '.' && inputValue.split('.').length >= 3) {
      e.preventDefault();
    }
  }, [inputValue]);

  const handleManualBlur = useCallback(() => {
    if (inputValue.length === 0) return;
    const parsed = parseDisplayString(inputValue);
    if (!parsed) {
      setInputValue(formatDisplayString(selectedDate));
    }
  }, [inputValue, selectedDate]);

  const handleDateSelect = (date: Date) => {
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ));

    setSelectedDate(date);
    setInputValue(formatDisplayString(date));

    const formattedDate = utcDate.toISOString().split('T')[0];

    onChange?.(formattedDate);
    setIsPickerOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    setInputValue(formatDisplayString(today));

    const utcToday = new Date(Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ));
    const formattedDate = utcToday.toISOString().split('T')[0];

    onChange?.(formattedDate);
    setIsPickerOpen(false);
  };

  const handleReset = () => {
    setSelectedDate(null);
    setInputValue('');
    onChange?.('');
    onReset?.();
    setIsPickerOpen(false);
  };

  const changeMonth = (month: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(month);
    setCurrentDate(newDate);
    setShowMonthDropdown(false);
  };

  const changeYear = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
    setShowYearDropdown(false);
  };

  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDayOfMonth.getDate();
    const startDay = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;
    
    const days = [];
    const totalDays = 35;
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < startDay; i++) {
      const day = prevMonthLastDay - startDay + i + 1;
      const date = new Date(year, month - 1, day);
      const isSelected = selectedDate && 
        date.getDate() === selectedDate.getDate() && 
        date.getMonth() === selectedDate.getMonth() && 
        date.getFullYear() === selectedDate.getFullYear();
      
      days.push(
        <Day 
          key={`prev-${day}`} 
          selected={isSelected}
          onClick={() => handleDateSelect(date)}
          otherMonth
        >
          {day}
        </Day>
      );
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isSelected = selectedDate && 
        date.getDate() === selectedDate.getDate() && 
        date.getMonth() === selectedDate.getMonth() && 
        date.getFullYear() === selectedDate.getFullYear();
      
      days.push(
        <Day 
          key={`current-${i}`} 
          selected={isSelected}
          onClick={() => handleDateSelect(date)}
        >
          {i}
        </Day>
      );
    }
    
    const remainingDays = totalDays - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      const isSelected = selectedDate && 
        date.getDate() === selectedDate.getDate() && 
        date.getMonth() === selectedDate.getMonth() && 
        date.getFullYear() === selectedDate.getFullYear();
      
      days.push(
        <Day 
          key={`next-${i}`} 
          selected={isSelected}
          onClick={() => handleDateSelect(date)}
          otherMonth
        >
          {i}
        </Day>
      );
    }
    
    return days;
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  const toggleMonthDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMonthDropdown(!showMonthDropdown);
    setShowYearDropdown(false);
  };

  const toggleYearDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowYearDropdown(!showYearDropdown);
    setShowMonthDropdown(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const increment = direction === 'next' ? 1 : -1;
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  return (
    <Container ref={containerRef}>
      <Field>
        {prefix && <Prefix>{prefix}</Prefix>}
        <EditableInput
          ref={inputRef}
          type="text"
          value={inputValue}
          placeholder={placeholder === 'Выберите дату' ? 'дд.мм.гггг' : placeholder}
          onChange={handleManualChange}
          onKeyDown={handleManualKeyDown}
          onBlur={handleManualBlur}
          inputMode="numeric"
          maxLength={10}
        />
        <CalendarIconButton
          type="button"
          onClick={() => setIsPickerOpen(prev => !prev)}
          aria-label="Открыть календарь"
        >
          <CalendarIcon style={{ fontSize: '20px' }} />
        </CalendarIconButton>
      </Field>

      {isPickerOpen && (
        <CalendarPopup className="calendar-container">
          <CalendarHeader>
          <ArrowButton 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigateMonth('prev');
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <ArrowIcon direction="right" />
          </ArrowButton>
            
            <MonthYearContainer>
              <MonthSelectWrapper ref={monthDropdownRef}>
                <MonthSelectButton 
                  onClick={(e) => toggleMonthDropdown(e)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {months[currentDate.getMonth()]}
                  <DropdownArrow $open={showMonthDropdown} />
                </MonthSelectButton>
                {showMonthDropdown && (
                  <DropdownList 
                    $width={120}
                    onClick={(e) => e.stopPropagation()} // Добавьте это
                  >
                    {months.map((month, index) => (
                      <DropdownItem 
                        key={month}
                        $selected={index === currentDate.getMonth()}
                        onClick={(e) => {
                          e.stopPropagation(); // Добавьте это
                          changeMonth(index);
                        }}
                      >
                        {month}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                )}
              </MonthSelectWrapper>
              
              <YearSelectWrapper ref={yearDropdownRef}>
                <YearSelectButton 
                  onClick={(e) => toggleYearDropdown(e)}
                  onMouseDown={(e) => e.preventDefault()} // Добавьте это
                >
                  {currentDate.getFullYear()}
                  <DropdownArrow $open={showYearDropdown} />
                </YearSelectButton>
                {showYearDropdown && (
                  <DropdownList 
                    $width={80}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {generateYears().map(year => (
                      <DropdownItem 
                        key={year}
                        $selected={year === currentDate.getFullYear()}
                        onClick={(e) => {
                          e.stopPropagation();
                          changeYear(year);
                        }}
                      >
                        {year}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                )}
              </YearSelectWrapper>
            </MonthYearContainer>
            
            <ArrowButton 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigateMonth('next');
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <ArrowIcon direction="left" />
            </ArrowButton>
          </CalendarHeader>
          
          <WeekDays>
            {weekDays.map(day => (
              <WeekDay key={day}>{day}</WeekDay>
            ))}
          </WeekDays>
          
          <DaysGrid>
            {renderDays()}
          </DaysGrid>
          
          <CalendarFooter>
            <FooterButton onClick={handleReset}>Удалить</FooterButton>
            <FooterButton onClick={handleToday}>Сегодня</FooterButton>
          </CalendarFooter>
        </CalendarPopup>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
  text-align: left;
  color: black;
`;

const Field = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 12px;
  font-size: 14px;
  border-radius: 5px;
  border: 1px solid rgba(156, 163, 175, 1);
  cursor: pointer;
  background-color: white;
  width: 100%;
  transition: border-color 0.2s ease;
  height: auto;
  max-height: 38px;
  box-sizing: border-box;
  color: black;

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

const EditableInput = styled.input`
  flex-grow: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #000;
  padding: 0;
  min-width: 0;
  font-family: inherit;

  &::placeholder {
    color: rgba(80, 85, 92, 1);
    opacity: 1;
  }
`;

const CalendarIconButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin-left: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(80, 85, 92, 1);
  transition: color 0.2s ease;

  &:hover {
    color: rgba(0, 125, 136, 1);
  }

  &:focus {
    outline: none;
  }
`;

const CalendarPopup = styled.div`
  position: fixed;
  top: unset; 
  bottom: unset;
  left: unset; 
  transform: translate(0, 0);
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 9999;
  width: 280px;
  color: black;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  color: black;
`;

const MonthYearContainer = styled.div`
  display: flex;
  gap: 8px;
  color: black;
`;

const SelectButton = styled.button`
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 5px;
  padding: 6px 8px;
  font-size: 14px;
  cursor: pointer;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 80px;
  transition: all 0.2s ease;
  color: black;
  
  &:hover {
    background-color: rgba(232, 216, 216, 0.2);
  }
`;

const MonthSelectButton = styled(SelectButton)`
  min-width: 120px;

  &: hover {
    border-color: rgba(209, 213, 219, 1);
  }
`;

const YearSelectButton = styled(SelectButton)`
  min-width: 80px;

  &: hover {
    border-color: rgba(209, 213, 219, 1);
  }
`;

const MonthSelectWrapper = styled.div`
  position: relative;
`;

const YearSelectWrapper = styled.div`
  position: relative;
`;

const DropdownArrow = styled.div<{ $open: boolean }>`
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid rgba(80, 85, 92, 1);
  margin-left: 8px;
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'none'};
  transition: transform 0.2s ease;
`;

const DropdownList = styled.div<{ $width: number }>`
  position: absolute;
  top: 100%;
  left: 0;
  width: ${({ $width }) => $width}px;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  margin-top: 4px;

  /* Стили скроллбара */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(209, 213, 219, 1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(80, 85, 92, 1);
    border-radius: 3px;
  }
`;

const DropdownItem = styled.div<{ $selected: boolean }>`
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  background-color: ${({ $selected }) => 
    $selected ? 'rgba(232, 216, 216, 1)' : 'white'};
  color: ${({ $selected }) => 
    $selected ? '#000' : 'inherit'};

  &:hover {
    background-color: rgba(232, 216, 216, ${({ $selected }) => $selected ? '1' : '0.5'});
  }
`;

const ArrowButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:focus {
    outline: none;
  }
`;

const ArrowIcon = styled.div<{ direction: 'left' | 'right' }>`
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-${({ direction }) => direction}: 5px solid rgba(80, 85, 92, 1);
`;

const WeekDays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 8px;
`;

const WeekDay = styled.div`
  font-size: 12px;
  color: rgba(80, 85, 92, 1);
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const Day = styled.div<{ selected?: boolean; otherMonth?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 5px;
  
  color: ${({ otherMonth }) => otherMonth ? 'rgba(173, 179, 188, 1)' : '#000'};
  background-color: ${({ selected }) => selected ? 'rgba(237, 224, 224, 1)' : 'transparent'};
  
  &:hover {
    background-color: ${({ selected }) => selected ? 'rgba(237, 224, 224, 1)' : 'rgba(0, 125, 136, 0.1)'};
  }
`;

const CalendarFooter = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
`;

const FooterButton = styled.button`
  background: none;
  border: none;
  color: rgba(0, 125, 136, 1);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;

  &:hover {
    text-decoration: underline;
  }
`;

export default CustomCalendar;