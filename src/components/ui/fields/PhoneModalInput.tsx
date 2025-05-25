import React from 'react';
import styled from 'styled-components';

interface PhoneInputProps {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
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
    onBlur,
    placeholder = '8 (999) 500-50-50', 
    customPlaceholder,
    tabIndex, 
    disabled = false,
    hasError = false,
    errorMessage
}) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [cursorPosition, setCursorPosition] = React.useState<number | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    const showCustomPlaceholder = Boolean(customPlaceholder && !value && !isFocused);

    // Format phone number while preserving cursor position
    const formatPhoneNumber = (inputValue: string, cursorPos: number | null = null): { formattedValue: string, newCursorPos: number } => {
        const cleaned = inputValue.replace(/\D/g, '');
        const withPrefix = cleaned.startsWith('8') || cleaned.length === 0 ? cleaned : `8${cleaned}`;
        const trimmed = withPrefix.slice(0, 11);

        let formattedValue = '';
        let newCursorPos = cursorPos;

        if (trimmed.length > 0) {
            formattedValue += '8';
            if (cursorPos === 1) newCursorPos = 1;
        }
        if (trimmed.length > 1) {
            formattedValue += ` (${trimmed.slice(1, 4)}`;
            if (cursorPos && cursorPos >= 2 && cursorPos <= 4) newCursorPos = cursorPos + 2;
            else if (cursorPos === 5) newCursorPos = 7;
        }
        if (trimmed.length > 4) {
            formattedValue += `) ${trimmed.slice(4, 7)}`;
            if (cursorPos && cursorPos >= 5 && cursorPos <= 7) newCursorPos = cursorPos + 3;
            else if (cursorPos === 8) newCursorPos = 12;
        }
        if (trimmed.length > 7) {
            formattedValue += `-${trimmed.slice(7, 9)}`;
            if (cursorPos && cursorPos >= 8 && cursorPos <= 9) newCursorPos = cursorPos + 4;
            else if (cursorPos === 10) newCursorPos = 15;
        }
        if (trimmed.length > 9) {
            formattedValue += `-${trimmed.slice(9, 11)}`;
            if (cursorPos && cursorPos >= 10 && cursorPos <= 11) newCursorPos = cursorPos + 5;
        }

        return { formattedValue, newCursorPos: newCursorPos || cursorPos || 0 };
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const input = e.target;
        const cursorPos = input.selectionStart;
        
        const { formattedValue, newCursorPos } = formatPhoneNumber(input.value, cursorPos);
        
        setCursorPosition(newCursorPos);
        
        const syntheticEvent = {
            ...e,
            target: {
                ...input,
                name,
                value: formattedValue
            }
        };
        onChange(syntheticEvent);
    };

    // Restore cursor position after formatting
    React.useEffect(() => {
        if (cursorPosition !== null && inputRef.current) {
            inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
    }, [value, cursorPosition]);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        if (onBlur) {
            onBlur(e);
        }
    };

    return (
        <InputContainer>
            <StyledInput
                ref={inputRef}
                name={name}
                type="tel"  // Changed to type="tel" for better mobile keyboard support
                value={value}
                onChange={handleChange}
                placeholder={showCustomPlaceholder ? '' : placeholder}
                maxLength={18}
                tabIndex={tabIndex}
                disabled={disabled}
                hasError={hasError}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
                inputMode="tel"  // Better mobile keyboard support
            />
            {customPlaceholder && (
                <PlaceholderLabel isVisible={showCustomPlaceholder}>
                    {customPlaceholder}
                </PlaceholderLabel>
            )}
            {hasError && errorMessage && (
                <ErrorMessage>
                    {errorMessage}
                </ErrorMessage>
            )}
        </InputContainer>
    );
};

// Styled components remain the same as in your original code
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