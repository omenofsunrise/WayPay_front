import React, { useState } from 'react';
import styled from 'styled-components';

interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked = false, onChange, className }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClick = () => {
    if (onChange) {
      onChange(!checked);
    }
  };

  return (
    <CheckboxContainer 
      className={className}
      checked={checked}
      isFocused={isFocused}
      onClick={handleClick}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={0}
    >
      {checked && (
        <Checkmark viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.375 1.1875L2.65 6.8125L0.625 4.5625" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
        </Checkmark>
      )}
    </CheckboxContainer>
  );
};

const CheckboxContainer = styled.div<{ checked: boolean; isFocused: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => 
    props.checked 
      ? 'rgba(0, 125, 136, 1)' 
      : props.isFocused 
        ? 'rgba(0, 125, 136, 1)' 
        : 'rgba(173, 179, 188, 1)'};
  background-color: ${props => props.checked ? 'rgba(0, 125, 136, 1)' : 'transparent'};
  box-shadow: ${props => 
    props.checked && props.isFocused 
      ? '0 0 0 4px rgba(121, 159, 162, 0.33)' 
      : 'none'};

  &:focus {
    outline: none;
  }
`;

const Checkmark = styled.svg`
  width: 8px;
  height: 8px;
`;

export default Checkbox;