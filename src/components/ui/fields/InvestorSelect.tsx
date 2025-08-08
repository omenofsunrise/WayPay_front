import { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import useInvestor from '../../../api/hooks/useInvestor';
import Portal from '../../../utils/Portal';
import InvestorSelectModal from '../../modal/CrudInherited/InvestorSelectModal';
import { FaTimes } from 'react-icons/fa';

interface InvestorSelectProps {
  value: string;
  onChange: (value: string) => void;
  onInvestorSelect?: (investor: { 
    id: number; 
    nickname: string; 
    fullName: string; 
    phoneNumber: string;
    investorPie: number;
    investmentAmount: number;
    balance: number;
  }) => void;
  placeholder?: string;
  customPlaceholder?: string;
  hasError?: boolean;
  errorMessage?: string;
  disabled?: boolean;
}

const InvestorSelect = ({
  value,
  onChange,
  onInvestorSelect,
  placeholder = '',
  customPlaceholder,
  hasError = false,
  errorMessage,
  disabled = false,
  ...props
}: InvestorSelectProps) => {
  const { getInvestors } = useInvestor();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [investors, setInvestors] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInvestorModal, setShowInvestorModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  // Загружаем инвесторов при монтировании и при изменении searchTerm
  useEffect(() => {
    const fetchInvestors = async () => {
      setIsLoading(true);
      try {
        const data = await getInvestors({ pageSize: 20, name: value });
        if (data) {
          setInvestors(data.items.map(item => ({ id: item.id, name: item.nickname })));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestors();
  }, [value, getInvestors]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateMenuPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleFocus = () => {
    setIsDropdownOpen(true);
    updateMenuPosition();
  };

  const handleInvestorSelect = (investor: { id: number; name: string }) => {
    onChange(investor.name);
    if (onInvestorSelect) {
      onInvestorSelect(investor);
    }
    setIsDropdownOpen(false);
  };

  const handleClearSelection = () => {
    onChange('');
    if (onInvestorSelect) {
      onInvestorSelect({
        id: 0,
        nickname: '',
        fullName: '',
        phoneNumber: '',
        investorPie: 0,
        investmentAmount: 0,
        balance: 0
      });
    }
  };

  const handleShowAllInvestors = () => {
    setShowInvestorModal(true);
    setIsDropdownOpen(false);
  };

  const handleInvestorSelectFromModal = (selectedInvestor: { 
    id: number; 
    nickname: string; 
    fullName: string; 
    phoneNumber: string;
    investorPie: number;
    investmentAmount: number;
    balance: number;
    }) => {
    onChange(selectedInvestor.nickname);
    if (onInvestorSelect) {
        onInvestorSelect(selectedInvestor);
    }
    setShowInvestorModal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && investors.length > 0) {
      handleInvestorSelect(investors[0]);
    }
  };

  return (
    <>
      <InputContainer>
        <InputWrapper>
          <StyledInput
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={customPlaceholder && !value ? '' : placeholder}
            hasError={hasError}
            disabled={disabled || isLoading}
            {...props}
          />
          {value && !disabled && (
            <ClearButton onClick={handleClearSelection}>
              <FaTimes size={14} />
            </ClearButton>
          )}
        </InputWrapper>
        
        {customPlaceholder && !value && (
          <PlaceholderLabel isVisible={true}>
            {customPlaceholder}
          </PlaceholderLabel>
        )}

        <AnimatePresence>
          {isDropdownOpen && (
            <Portal>
              <DropdownMenu
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                ref={dropdownRef}
                style={{
                  position: 'absolute',
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                  width: `${menuPosition.width}px`,
                  maxHeight: '300px',
                  zIndex: 1000
                }}
              >
                <DropdownContent>
                  {isLoading ? (
                    <DropdownItem>Загрузка инвесторов...</DropdownItem>
                  ) : investors.length > 0 ? (
                    investors.map((investor) => (
                      <DropdownItem
                        key={investor.id}
                        onClick={() => handleInvestorSelect(investor)}
                      >
                        {investor.name}
                      </DropdownItem>
                    ))
                  ) : (
                    <DropdownItem>Инвесторы не найдены</DropdownItem>
                  )}
                </DropdownContent>
                
                <DropdownFooter>
                  <ShowAllLink onClick={handleShowAllInvestors}>
                    Показать всех
                  </ShowAllLink>
                </DropdownFooter>
              </DropdownMenu>
            </Portal>
          )}
        </AnimatePresence>

        {hasError && errorMessage && (
          <ErrorMessage>{errorMessage}</ErrorMessage>
        )}
      </InputContainer>

      <InvestorSelectModal
        isOpen={showInvestorModal}
        onClose={() => setShowInvestorModal(false)}
        onSubmit={handleInvestorSelectFromModal}
      />
    </>
  );
};

const InputContainer = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
  margin-right: auto;
`;

const InputWrapper = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
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
  padding-right: 30px;

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
    background-color: #f3f4f6;
    cursor: not-allowed;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;

  &:hover {
    color: #666;
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

const DropdownMenu = styled(motion.div)`
  position: absolute;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 300px;
  display: flex;
  flex-direction: column;
`;

const DropdownContent = styled.div`
  overflow-y: auto;
  flex-grow: 1;
`;

const DropdownItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: black;
  &:hover {
    background-color: #ebf8ff;
  }
`;

const DropdownFooter = styled.div`
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border-top: 1px solid rgba(209, 213, 219, 1);
`;

const ShowAllLink = styled.div`
  font-size: 15px;
  color: rgba(0, 125, 136, 1);
  text-decoration: underline;
  cursor: pointer;
  padding: 4px 0;
  margin-top: 2px;
`;

export default InvestorSelect;