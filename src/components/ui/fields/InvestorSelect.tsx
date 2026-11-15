import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import useInvestor from '../../../api/hooks/useInvestor';
import useInvestorPool from '../../../api/hooks/useInvestorPool';
import Portal from '../../../utils/Portal';
import InvestorSelectModal from '../../modal/CrudInherited/InvestorSelectModal';
import { FaTimes } from 'react-icons/fa';
import type { InvestorParams } from '../../../api/types/investor';

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
    type?: 'investor' | 'pool';
  }) => void;
  placeholder?: string;
  customPlaceholder?: string;
  hasError?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  includePools?: boolean;
  poolId?: number;
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
  includePools = false,
  poolId,
  ...props
}: InvestorSelectProps) => {
  const { getInvestors } = useInvestor();
  const { getInvestorPools } = useInvestorPool();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [investors, setInvestors] = useState<{ id: number; name: string; type: 'investor' | 'pool' }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInvestorModal, setShowInvestorModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 300 });

  // Блокировка скролла страницы при открытом dropdown
  useEffect(() => {
    if (isDropdownOpen) {
      // Сохраняем текущую позицию скролла
      const scrollY = window.scrollY;
      const body = document.body;
      const html = document.documentElement;
      
      // Блокируем скролл на body и html
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      
      // Добавляем padding-right чтобы компенсировать исчезновение скроллбара
      const scrollbarWidth = window.innerWidth - html.clientWidth;
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      return () => {
        // Восстанавливаем скролл при закрытии dropdown
        const scrollY = parseInt(body.style.top || '0', 10) * -1;
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';
        body.style.overflow = '';
        body.style.paddingRight = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isDropdownOpen]);

  // Обработка колесика мыши внутри dropdown
  const handleDropdownWheel = useCallback((e: WheelEvent) => {
    if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
      // Позволяем скроллить только внутри dropdown
      e.stopPropagation();
    }
  }, []);

  // Добавляем обработчик колесика мыши
  useEffect(() => {
    if (isDropdownOpen) {
      document.addEventListener('wheel', handleDropdownWheel, { passive: false });
      return () => {
        document.removeEventListener('wheel', handleDropdownWheel);
      };
    }
  }, [isDropdownOpen, handleDropdownWheel]);

  useEffect(() => {
    const fetchInvestors = async () => {
      setIsLoading(true);
      try {
        const params: InvestorParams = {
          pageSize: 20,
          name: value
        };

        if (poolId) {
          params.poolId = poolId;
        }

        const [investorData, poolsData] = await Promise.all([
          getInvestors(params),
          includePools ? getInvestorPools({ pageSize: 20 }) : Promise.resolve(null)
        ]);

        const investorItems = investorData?.items.map(item => ({ 
          id: item.id, 
          name: (item.nickname && item.nickname.trim() !== '') ? item.nickname : item.fullName,
          type: 'investor' as const 
        })) || [];
        
        const poolItems = includePools 
          ? (poolsData?.items.map(pool => ({ 
              id: pool.id, 
              name: pool.name, 
              type: 'pool' as const 
            })) || [])
          : [];

        setInvestors([...investorItems, ...poolItems]);
      } catch (err) {
        console.error('Ошибка загрузки инвесторов/пулов', err);
        setInvestors([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestors();
  }, [value, getInvestors, getInvestorPools, includePools, poolId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const updateMenuPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const margin = 8;
      const maxDropdownHeight = 300;
      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const shouldOpenUp = spaceBelow < 180 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(
        120,
        Math.min(maxDropdownHeight, shouldOpenUp ? spaceAbove : spaceBelow)
      );
      const top = shouldOpenUp
        ? Math.max(margin, rect.top - maxHeight)
        : Math.min(rect.bottom, window.innerHeight - margin);
      const width = Math.min(rect.width, window.innerWidth - margin * 2);
      const left = Math.min(
        Math.max(margin, rect.left),
        window.innerWidth - width - margin
      );

      setMenuPosition({
        top,
        left,
        width,
        maxHeight
      });
    }
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isDropdownOpen, updateMenuPosition]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleFocus = () => {
    setIsDropdownOpen(true);
    updateMenuPosition();
  };

  const handleInvestorSelect = (investor: { id: number; name: string; type: 'investor' | 'pool' }) => {
    onChange(investor.name);
    if (onInvestorSelect) {
      onInvestorSelect({
        id: investor.id,
        nickname: investor.name,
        fullName: investor.name,
        phoneNumber: '',
        investorPie: 0,
        investmentAmount: 0,
        balance: 0,
        type: investor.type
      });
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
        balance: 0,
        type: 'investor'
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
    type: 'investor' | 'pool';
    }) => {
    onChange(selectedInvestor.nickname || selectedInvestor.fullName || '');
    if (onInvestorSelect) {
        onInvestorSelect(selectedInvestor);
    }
    setShowInvestorModal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && investors.length > 0) {
      handleInvestorSelect(investors[0]);
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
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
                  position: 'fixed', // Используем fixed вместо absolute
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                  width: `${menuPosition.width}px`,
                  maxHeight: `${menuPosition.maxHeight}px`,
                  zIndex: 1000
                }}
              >
                <DropdownContent
                  onWheel={(e) => {
                    // Предотвращаем всплытие события колесика
                    e.stopPropagation();
                  }}
                >
                  {isLoading ? (
                    <DropdownItem>Загрузка инвесторов...</DropdownItem>
                  ) : investors.length > 0 ? (
                    investors.map((investor) => (
                      <DropdownItem
                        key={`${investor.type}-${investor.id}`}
                        onClick={() => handleInvestorSelect(investor)}
                      >
                        {investor.name}
                        {investor.type === 'pool' ? ' (пул)' : ''}
                      </DropdownItem>
                    ))
                  ) : (
                    <DropdownItem>
                      {poolId ? 'Инвесторы в этом пуле не найдены' : 'Инвесторы не найдены'}
                    </DropdownItem>
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
        includePools={includePools}
        poolId={poolId}
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
  position: fixed;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DropdownContent = styled.div`
  overflow-y: auto;
  flex-grow: 1;
  min-height: 0;
  
  /* Кастомный скроллбар */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
    
    &:hover {
      background: #a8a8a8;
    }
  }
  
  /* Для Firefox */
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
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
