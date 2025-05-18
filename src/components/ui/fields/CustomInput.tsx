import styled from 'styled-components';
import React from 'react';

type InputType = 'number' | 'text' | 'fullname';

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  customPlaceholder?: string;
  inputType?: InputType;
}

const CustomInput: React.FC<CustomInputProps> = ({
  placeholder = '',
  customPlaceholder,
  value,
  inputType = 'text',
  onChange,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const showCustomPlaceholder = Boolean(customPlaceholder && !value && !isFocused);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return;

    let newValue = e.target.value;

    switch (inputType) {
      case 'number':
        if (/^\d*$/.test(newValue)) {
          onChange(e);
        }
        break;

      case 'fullname':
        newValue = newValue.replace(/[^a-zA-Zа-яА-ЯёЁ'\s]/g, '');
        newValue = newValue.replace(/\s{2,}/g, ' ');
        let words = newValue.split(' ').filter(word => word.length > 0);
        words = words.slice(0, 3);
        newValue = words
          .map(word => 
            word.length > 0 
              ? word[0].toUpperCase() + word.slice(1).toLowerCase() 
              : ''
          )
          .join(' ');
        if (newValue.length > 0 && newValue[newValue.length - 1] !== ' ' && 
            e.target.value.length > 0 && e.target.value[e.target.value.length - 1] === ' ') {
          newValue += ' ';
        }
        e.target.value = newValue;
        onChange(e);
        break;

      default:
        onChange(e);
        break;
    }
  };

  return (
    <InputContainer>
      <StyledInput
        {...props}
        value={value}
        placeholder={showCustomPlaceholder ? '' : placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={handleInputChange}
        inputMode={inputType === 'number' ? 'numeric' : 'text'}
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

const StyledInput = styled.input`
  padding: 10px 12px;
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 5px;
  font-size: 14px;
  width: 100%;
  outline: none;
  transition: border-color 0.2s ease;
    height: auto; /* Занимает всю высоту родителя */
  box-sizing: border-box;
  max-width: 500px;

  &:hover {
    border-color: rgba(156, 163, 175, 1);
  }

  &:focus {
    border-color: rgba(59, 130, 246, 1);
  }

  &::placeholder {
    color: rgba(80, 85, 92, 1);
    opacity: 1;
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

export default CustomInput;