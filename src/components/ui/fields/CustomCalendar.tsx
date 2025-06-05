import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import CalendarIcon from '../../../assets/ui/calendar.svg?react';

interface DateInputProps {
  prefix?: string;
  value?: string;
  onChange?: (date: string) => void;
  onReset?: () => void;
}

const months = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const CustomCalendar: React.FC<DateInputProps> = ({ 
  prefix = 'Дата:', 
  value = '', 
  onChange, 
  onReset 
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

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
      setSelectedDate(new Date(value));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const handleDateSelect = (date: Date) => {
    const localDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );
    setSelectedDate(localDate);
    
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    onChange?.(formattedDate);
    setIsPickerOpen(false);
    };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    handleDateSelect(today);
  };

  const handleReset = () => {
    setSelectedDate(null);
    onChange?.(''); // Add this line to trigger onChange with empty value
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
    
    // Previous month days
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
    
    // Current month days
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
    
    // Next month days
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

  const formatDisplayDate = () => {
    if (!selectedDate) return 'Выберите дату';
    return selectedDate.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  const toggleMonthDropdown = () => {
    setShowMonthDropdown(!showMonthDropdown);
    setShowYearDropdown(false);
  };

  const toggleYearDropdown = () => {
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
      <Field onClick={() => setIsPickerOpen(!isPickerOpen)}>
        {prefix && <Prefix>{prefix}</Prefix>}
        <DateText isEmpty={!selectedDate}>{formatDisplayDate()}</DateText>
        <CalendarIcon className="ml-2" style={{ fontSize: "20px" }}/>
      </Field>

      {isPickerOpen && (
        <CalendarPopup>
          <CalendarHeader>
            <ArrowButton onClick={() => navigateMonth('prev')}>
              <ArrowIcon direction="right" />
            </ArrowButton>
            
            <MonthYearContainer>
              <MonthSelectWrapper ref={monthDropdownRef}>
                <MonthSelectButton onClick={toggleMonthDropdown}>
                  {months[currentDate.getMonth()]}
                  <DropdownArrow $open={showMonthDropdown} />
                </MonthSelectButton>
                {showMonthDropdown && (
                  <DropdownList $width={120}>
                    {months.map((month, index) => (
                      <DropdownItem 
                        key={month}
                        $selected={index === currentDate.getMonth()}
                        onClick={() => changeMonth(index)}
                      >
                        {month}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                )}
              </MonthSelectWrapper>
              
              <YearSelectWrapper ref={yearDropdownRef}>
                <YearSelectButton onClick={toggleYearDropdown}>
                  {currentDate.getFullYear()}
                  <DropdownArrow $open={showYearDropdown} />
                </YearSelectButton>
                {showYearDropdown && (
                  <DropdownList $width={80}>
                    {generateYears().map(year => (
                      <DropdownItem 
                        key={year}
                        $selected={year === currentDate.getFullYear()}
                        onClick={() => changeYear(year)}
                      >
                        {year}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                )}
              </YearSelectWrapper>
            </MonthYearContainer>
            
            <ArrowButton onClick={() => navigateMonth('next')}>
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

const CalendarPopup = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 1000;
  width: 280px;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const MonthYearContainer = styled.div`
  display: flex;
  gap: 8px;
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