import styled from 'styled-components';
import React from 'react';

interface CustomSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
  customPlaceholder?: string;
  hasError?: boolean;
  errorMessage?: string;
  options: { value: string; label: string }[];
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  placeholder = '',
  customPlaceholder,
  value,
  onChange,
  hasError = false,
  errorMessage,
  options,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const showCustomPlaceholder = Boolean(customPlaceholder && !value && !isFocused);

  return (
    <InputContainer>
      <SelectContainer>
        <StyledSelect
          {...props}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={onChange}
          hasError={hasError}
        >
          {placeholder && <option value="" disabled hidden>{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </StyledSelect>
        <SelectArrow>
          <svg width="17" height="9" viewBox="0 0 17 9" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 1L8.5 8L15.5 1" stroke="#50555C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </SelectArrow>
      </SelectContainer>
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

const SelectContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
`;

const StyledSelect = styled.select<{ hasError?: boolean }>`
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
  background-color: white;
  color: black;
  padding: 5px;
  padding-left: 15px;
  appearance: none;
  cursor: pointer;

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

  option {
    color: black;
    background-color: white;
  }

  option:disabled {
    color: rgba(80, 85, 92, 1);
  }
`;

const SelectArrow = styled.div`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
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

export default CustomSelect;