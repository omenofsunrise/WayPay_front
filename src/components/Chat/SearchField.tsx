import styled from 'styled-components';
import React from 'react';

interface SearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  hasError?: boolean;
  hasIcon?: boolean;
  errorMessage?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const SearchField: React.FC<SearchFieldProps> = ({
  placeholder = '',
  value,
  onChange,
  hasIcon = true,
  hasError = false,
  errorMessage,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <InputContainer>
      <SearchIcon>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            fillRule="evenodd" 
            clipRule="evenodd" 
            d="M9.98778 10.8711C8.86457 11.7685 7.44037 12.2018 6.00768 12.082C4.57499 11.9621 3.24257 11.2983 2.28407 10.2267C1.32557 9.15515 0.813753 7.75725 0.853741 6.32011C0.893729 4.88297 1.48249 3.51569 2.49909 2.49909C3.51569 1.48249 4.88297 0.893729 6.32011 0.853741C7.75725 0.813753 9.15515 1.32557 10.2267 2.28407C11.2983 3.24257 11.9621 4.57499 12.082 6.00768C12.2018 7.44037 11.7685 8.86457 10.8711 9.98777L15.1678 14.2836C15.2292 14.3408 15.2784 14.4098 15.3126 14.4865C15.3468 14.5632 15.3651 14.6459 15.3666 14.7298C15.3681 14.8138 15.3526 14.8971 15.3212 14.9749C15.2898 15.0528 15.243 15.1235 15.1836 15.1828C15.1243 15.2422 15.0536 15.2889 14.9758 15.3204C14.898 15.3518 14.8146 15.3672 14.7307 15.3658C14.6468 15.3643 14.564 15.3459 14.4873 15.3118C14.4107 15.2776 14.3417 15.2283 14.2844 15.1669L9.98778 10.8711ZM3.38278 9.56944C2.77114 8.95775 2.35457 8.17846 2.1857 7.33008C2.01684 6.4817 2.10325 5.60231 2.43404 4.80303C2.76482 4.00375 3.32512 3.32046 4.04412 2.83953C4.76312 2.35859 5.60856 2.10159 6.47358 2.10101C7.33861 2.10043 8.18439 2.35629 8.90404 2.83626C9.62369 3.31622 10.1849 3.99875 10.5168 4.79759C10.8486 5.59642 10.9362 6.4757 10.7685 7.32431C10.6008 8.17292 10.1853 8.95276 9.57444 9.56528L9.57028 9.56944L9.56611 9.57277C8.74535 10.3916 7.63313 10.8512 6.47375 10.8506C5.31437 10.85 4.20265 10.3892 3.38278 9.56944Z" 
            fill="#50555C"
          />
        </svg>
      </SearchIcon>
      <StyledInput
        {...props}
        value={value}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        onChange={onChange}
        $hasIcon={hasIcon}
      />
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

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
`;

const StyledInput = styled.input<{ $hasIcon?: boolean; hasError?: boolean }>`
  padding: 10px 12px;
  padding-left: ${({ $hasIcon }) => $hasIcon ? '36px' : '12px'};
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
`;

const ErrorMessage = styled.span`
  color: rgba(239, 68, 68, 1);
  font-size: 12px;
  margin-top: 4px;
  display: block;
`;

export default SearchField;