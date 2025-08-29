import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

interface DropdownOption {
  id: string;
  label: string;
  value: string;
}

interface DropdownButtonProps {
  icon?: React.ReactNode;
  options: DropdownOption[];
  selectedValue?: string;
  placeholder?: string;
  onSelect?: (option: DropdownOption) => void;
  className?: string;
}

const DropdownButton: React.FC<DropdownButtonProps> = ({
  icon,
  options,
  selectedValue,
  placeholder = 'Выберите опцию',
  onSelect,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (option: DropdownOption) => {
    onSelect?.(option);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === selectedValue);

  return (
    <Container ref={dropdownRef} className={className}>
      <Button onClick={() => setIsOpen(!isOpen)}>
        <ButtonContent>
          {icon && <IconWrapper>{icon}</IconWrapper>}
          <ButtonText>{selectedOption?.label || placeholder}</ButtonText>
        </ButtonContent>
        <ArrowIcon $isOpen={isOpen}>▼</ArrowIcon>
      </Button>
      
      {isOpen && (
        <DropdownList>
          {options.map((option) => (
            <OptionItem
              key={option.id}
              onClick={() => handleSelect(option)}
              $isSelected={selectedValue === option.value}
            >
              <RadioButton $isSelected={selectedValue === option.value}>
                {selectedValue === option.value && <RadioButtonInner />}
              </RadioButton>
              <OptionLabel>{option.label}</OptionLabel>
            </OptionItem>
          ))}
        </DropdownList>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 300px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  width: 100%;
  background: #FFFFFF;
  border: 1px solid #D1D5DB;
  border-radius: 5px;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #ADB3BC;
  }

  &:focus {
    outline: none;
    border-color: #007D88;
  }
`;

const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
`;

const ButtonText = styled.span`
  font-family: 'Manrope', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 19px;
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
`;

const ArrowIcon = styled.span<{ $isOpen: boolean }>`
  font-size: 10px;
  transition: transform 0.2s;
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  color: #ADB3BC;
  margin-left: 8px;
`;

const DropdownList = styled.div`
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

export default DropdownButton;