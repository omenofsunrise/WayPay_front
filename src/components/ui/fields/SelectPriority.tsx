import styled, { css, keyframes } from 'styled-components';
import React, { useState, useRef, useEffect } from 'react';

interface PriorityOption {
  value: string;
  label: string;
  color: string;
}

interface SelectPriorityProps {
  value?: string;
  onChange?: (value: string) => void;
  hasError?: boolean;
  errorMessage?: string;
  className?: string;
  showAnyOption?: boolean;
}

const basePriorityOptions: PriorityOption[] = [
  { value: 'low', label: 'Низкий приоритет', color: 'rgba(37, 203, 161, 1)' },
  { value: 'medium', label: 'Средний приоритет', color: 'rgba(255, 198, 24, 1)' },
  { value: 'high', label: 'Высокий приоритет', color: 'rgba(255, 90, 90, 1)' }
];

const anyPriorityOption: PriorityOption = {
  value: '',
  label: 'Любой приоритет',
  color: 'rgba(156, 163, 175, 1)'
};

const SelectPriority: React.FC<SelectPriorityProps> = ({
  value,
  onChange,
  hasError = false,
  errorMessage,
  className,
  showAnyOption = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<PriorityOption | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  const priorityOptions = showAnyOption 
    ? [anyPriorityOption, ...basePriorityOptions]
    : basePriorityOptions;

  useEffect(() => {
    const option = priorityOptions.find(opt => opt.value === value) || null;
    setSelectedOption(option);
  }, [value, showAnyOption]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: PriorityOption) => {
    onChange?.(option.value);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Container className={className} ref={selectRef}>
      <SelectButton
        onClick={toggleDropdown}
        isOpen={isOpen}
        hasError={hasError}
        hasValue={!!selectedOption}
      >
        {selectedOption ? (
          <>
            <PriorityIcon color={selectedOption.color}>
              <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.333008 12V1.33333C0.333008 0.966667 0.463674 0.652889 0.725008 0.392C0.986341 0.131111 1.30012 0.000444444 1.66634 0H8.33301C8.69968 0 9.01368 0.130667 9.27501 0.392C9.53634 0.653333 9.66679 0.967111 9.66634 1.33333V12L4.99967 10L0.333008 12Z" fill="currentColor"/>
              </svg>
            </PriorityIcon>
            {selectedOption.label}
          </>
        ) : (
          <Placeholder>Выберите приоритет</Placeholder>
        )}
        <SelectArrow isOpen={isOpen}>
          <svg width="17" height="9" viewBox="0 0 17 9" fill="none">
            <path d="M1.5 1L8.5 8L15.5 1" stroke="#50555C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </SelectArrow>
      </SelectButton>

      <DropdownMenu isOpen={isOpen}>
        {priorityOptions.map((option) => (
          <DropdownItem
            key={option.value}
            onClick={() => handleSelect(option)}
            isSelected={selectedOption?.value === option.value}
          >
            <PriorityIcon color={option.color}>
              <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.333008 12V1.33333C0.333008 0.966667 0.463674 0.652889 0.725008 0.392C0.986341 0.131111 1.30012 0.000444444 1.66634 0H8.33301C8.69968 0 9.01368 0.130667 9.27501 0.392C9.53634 0.653333 9.66679 0.967111 9.66634 1.33333V12L4.99967 10L0.333008 12Z" fill="currentColor"/>
              </svg>
            </PriorityIcon>
            {option.label}
          </DropdownItem>
        ))}
      </DropdownMenu>

      {hasError && errorMessage && (
        <ErrorMessage>{errorMessage}</ErrorMessage>
      )}
    </Container>
  );
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const rotateArrow = keyframes`
  from { transform: translateY(-50%) rotate(0deg); }
  to { transform: translateY(-50%) rotate(180deg); }
`;

const rotateArrowReverse = keyframes`
  from { transform: translateY(-50%) rotate(180deg); }
  to { transform: translateY(-50%) rotate(0deg); }
`;

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const SelectButton = styled.div<{ isOpen: boolean; hasError: boolean; hasValue: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 40px 10px 35px;
  border: 1px solid ${({ hasError }) => hasError ? 'rgba(239, 68, 68, 1)' : 'rgba(209, 213, 219, 1)'};
  border-radius: 5px;
  background-color: white;
  color: ${({ hasValue }) => hasValue ? 'black' : 'rgba(80, 85, 92, 1)'};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 38px;
  box-sizing: border-box;

  &:hover {
    border-color: ${({ hasError }) => hasError ? 'rgba(239, 68, 68, 1)' : 'rgba(0, 125, 136, 1)'};
  }

  ${({ isOpen, hasError }) => isOpen && css`
    border-color: ${hasError ? 'rgba(239, 68, 68, 1)' : 'rgba(0, 125, 136, 1)'};
    box-shadow: 0 0 0 2px rgba(0, 125, 136, 0.2);
  `}
`;

const Placeholder = styled.span`
  opacity: 0.7;
`;

const SelectArrow = styled.span<{ isOpen: boolean }>`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.2s ease;
  animation: ${({ isOpen }) => isOpen ? css`${rotateArrow} 0.2s forwards` : css`${rotateArrowReverse} 0.2s forwards`};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PriorityIcon = styled.div<{ color: string }>`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ color }) => color};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  height: 12px;
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  width: 100%;
  background-color: white;
  border-radius: 5px;
  box-shadow: 2px 2px 25px 2px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  z-index: 100;
  display: ${({ isOpen }) => isOpen ? 'block' : 'none'};
  animation: ${fadeIn} 0.2s ease;
`;

const DropdownItem = styled.div<{ isSelected: boolean }>`
  padding: 10px 15px 10px 35px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  background-color: ${({ isSelected }) => isSelected ? 'rgba(241, 245, 249, 1)' : 'transparent'};
  color: black;

  &:hover {
    background-color: rgba(241, 245, 249, 1);
  }

  & + & {
    border-top: 1px solid rgba(229, 231, 235, 1);
  }
`;

const ErrorMessage = styled.span`
  color: rgba(239, 68, 68, 1);
  font-size: 12px;
  margin-top: 4px;
  display: block;
`;

export default SelectPriority;