import React from 'react';
import styled from 'styled-components';

interface PhoneInputProps {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    tabIndex?: number;
    disabled?: boolean;
    hasError?: boolean;
    errorMessage?: string;
    customPlaceholder?: string;
}

const PhoneModalInput: React.FC<PhoneInputProps> = ({ 
    name, 
    value, 
    onChange, 
    placeholder = '8 (999) 500-50-50', 
    customPlaceholder,
    tabIndex, 
    disabled = false,
    hasError = false,
    errorMessage
}) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const showCustomPlaceholder = Boolean(customPlaceholder && !value && !isFocused);

    const formatPhoneNumber = (value: string): string => {
        const cleaned = value.replace(/\D/g, '');
        const withPrefix = cleaned.startsWith('8') || cleaned.length === 0 ? cleaned : `8${cleaned}`;
        const trimmed = withPrefix.slice(0, 11);

        let formattedValue = '';

        if (trimmed.length > 0) {
            formattedValue += '8';
        }
        if (trimmed.length > 1) {
            formattedValue += ` (${trimmed.slice(1, 4)}`;
        }
        if (trimmed.length > 4) {
            formattedValue += `) ${trimmed.slice(4, 7)}`;
        }
        if (trimmed.length > 7) {
            formattedValue += `-${trimmed.slice(7, 9)}`;
        }
        if (trimmed.length > 9) {
            formattedValue += `-${trimmed.slice(9, 11)}`;
        }

        return formattedValue;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const formattedPhone = formatPhoneNumber(e.target.value);
        const syntheticEvent = {
            ...e,
            target: {
                ...e.target,
                name,
                value: formattedPhone
            }
        };
        onChange(syntheticEvent);
    };

    return (
        <InputContainer>
            <StyledInput
                name={name}
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={showCustomPlaceholder ? '' : placeholder}
                maxLength={18}
                tabIndex={tabIndex}
                disabled={disabled}
                hasError={hasError}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
            {customPlaceholder && (
                <PlaceholderLabel isVisible={showCustomPlaceholder}>
                    {customPlaceholder}
                </PlaceholderLabel>
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

  &:disabled {
    background-color: rgba(248, 249, 250, 0.9);
    cursor: not-allowed;
  }
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

export default PhoneModalInput;