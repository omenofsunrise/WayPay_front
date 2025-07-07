import React, { useState } from 'react';
import styled from 'styled-components';
import DarkCyanButton from '../ui/Buttons/DarkCyanButton';

interface SearchFieldProps {
  onSearch: (value: string) => void;
  buttonText?: string;
  initialValue?: string;
}

const SearchField: React.FC<SearchFieldProps> = ({
  onSearch,
  buttonText = 'Поиск',
  initialValue = ''
}) => {
  const [searchValue, setSearchValue] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  return (
    <SearchContainer onSubmit={handleSubmit}>
      <SearchInput 
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder="Поиск постов..."
      />
      <SearchButton type="submit">
        <SearchIcon>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.98753 10.8711C8.86433 11.7685 7.44013 12.2018 6.00744 12.082C4.57475 11.9621 3.24232 11.2983 2.28382 10.2267C1.32532 9.15515 0.813508 7.75725 0.853497 6.32011C0.893485 4.88297 1.48224 3.51569 2.49884 2.49909C3.51545 1.48249 4.88273 0.893729 6.31986 0.853741C7.757 0.813753 9.15491 1.32557 10.2265 2.28407C11.298 3.24257 11.9619 4.57499 12.0817 6.00768C12.2016 7.44037 11.7683 8.86457 10.8709 9.98777L15.1675 14.2836C15.2289 14.3408 15.2782 14.4098 15.3123 14.4865C15.3465 14.5632 15.3649 14.6459 15.3664 14.7298C15.3678 14.8138 15.3524 14.8971 15.321 14.9749C15.2895 15.0528 15.2427 15.1235 15.1834 15.1828C15.124 15.2422 15.0534 15.2889 14.9755 15.3204C14.8977 15.3518 14.8143 15.3672 14.7304 15.3658C14.6465 15.3643 14.5638 15.3459 14.4871 15.3118C14.4104 15.2776 14.3414 15.2283 14.2842 15.1669L9.98753 10.8711ZM3.38253 9.56944C2.7709 8.95775 2.35433 8.17846 2.18546 7.33008C2.01659 6.4817 2.10301 5.60231 2.43379 4.80303C2.76457 4.00375 3.32487 3.32046 4.04388 2.83953C4.76288 2.35859 5.60832 2.10159 6.47334 2.10101C7.33836 2.10043 8.18415 2.35629 8.9038 2.83626C9.62345 3.31622 10.1847 3.99875 10.5165 4.79759C10.8484 5.59642 10.936 6.4757 10.7683 7.32431C10.6005 8.17292 10.185 8.95276 9.5742 9.56528L9.57003 9.56944L9.56586 9.57277C8.74511 10.3916 7.63289 10.8512 6.47351 10.8506C5.31413 10.85 4.2024 10.3892 3.38253 9.56944Z"
              fill="#50555C"
            />
          </svg>
        </SearchIcon>
        {buttonText}
      </SearchButton>
    </SearchContainer>
  );
};

const SearchContainer = styled.form`
  display: flex;
  width: 100%;
  max-width: 600px;
  margin-top: 10px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 10px 0 0 10px;
  border-right: none;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s ease;
  background-color: white;
  
  &:focus {
    border-color: rgba(156, 163, 175, 0.8);
  }
`;

const SearchButton = styled(DarkCyanButton)`
  border-radius: 0 10px 10px 0;
  padding: 8px 16px;
`;

const SearchIcon = styled.span`
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
`;

export default SearchField;