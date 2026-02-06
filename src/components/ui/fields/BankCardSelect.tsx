import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Portal from '../../../utils/Portal';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaCreditCard } from 'react-icons/fa';
import useBankCards from '../../../api/hooks/useBankCard';

interface BankCardSelectProps {
  value: string;
  onChange: (value: string) => void;
  onBankCardSelect?: (bankCard: { 
    id: number; 
    details: string;
  }) => void;
  placeholder?: string;
  customPlaceholder?: string;
  hasError?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  clientId?: number;
  selectedCardId?: number;
}

const BankCardSelect = ({
  value,
  onChange,
  selectedCardId,
  onBankCardSelect,
  placeholder = 'Выберите карту',
  customPlaceholder,
  hasError = false,
  errorMessage,
  disabled = false,
  clientId,
  ...props
}: BankCardSelectProps) => {
  const { 
    bankCards, 
    getAll, 
    create, 
    update, 
    deleteBankCard,
    isLoading,
  } = useBankCards();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editDetails, setEditDetails] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: '300px'
  });

  useEffect(() => {
    if (clientId) {
      getAll({ pageSize: 50 });
    } else {
      getAll({ pageSize: 50 });
    }
  }, [getAll, clientId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsCreating(false);
        setIsEditing(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculateDropdownPosition = () => {
    if (!inputRef.current) return;

    const inputRect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;
    
    // Вычисляем доступную высоту
    const availableHeight = Math.max(spaceBelow, spaceAbove) - 20; // 20px отступ от края экрана
    const maxHeight = Math.min(400, availableHeight);
    
    // Определяем, открывать ли сверху или снизу
    const shouldOpenAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
    
    const dropdownWidth = inputRect.width;
    const left = inputRect.left + window.scrollX;
    
    const top = shouldOpenAbove 
      ? inputRect.top + window.scrollY - maxHeight - 5 // Открываем сверху
      : inputRect.bottom + window.scrollY + 5; // Открываем снизу

    setDropdownStyle({
      top,
      left,
      width: dropdownWidth,
      maxHeight: `${maxHeight}px`
    });
  };

  const handleInputClick = () => {
    if (!disabled) {
      if (!isDropdownOpen) {
        calculateDropdownPosition();
      }
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.target.blur();
  };

  const handleBankCardSelect = (bankCard: { id: number; details: string }) => {
    onChange(bankCard.details);
    if (onBankCardSelect) {
      onBankCardSelect(bankCard);
    }
    setIsDropdownOpen(false);
    setIsCreating(false);
    setIsEditing(null);
  };

  const handleClearSelection = () => {
    onChange('');
    if (onBankCardSelect) {
      onBankCardSelect({
        id: 0,
        details: ''
      });
    }
    setIsDropdownOpen(false);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setNewDetails('');
  };

  const handleConfirmCreate = async () => {
    if (newDetails.trim()) {
      const created = await create({
        details: newDetails.trim()
      });
      
      if (created) {
        setNewDetails('');
        setIsCreating(false);
        handleBankCardSelect(created);
      }
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewDetails('');
  };

  const handleStartEdit = (bankCard: { id: number; details: string }) => {
    setIsEditing(bankCard.id);
    setEditDetails(bankCard.details);
  };

  const handleConfirmEdit = async (id: number) => {
    if (editDetails.trim()) {
      const updated = await update(id, { 
        details: editDetails.trim()
      });
      if (updated) {
        setIsEditing(null);
        setEditDetails('');
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditDetails('');
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить карту "${name}"?`)) {
      try {
        await deleteBankCard(id);
      }
      catch {
        window.alert("Невозможно удалить карту, к которой привязаны операции или компания");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isCreating) {
        handleConfirmCreate();
      } else if (isEditing) {
        handleConfirmEdit(isEditing);
      } else if (bankCards.length > 0) {
        handleBankCardSelect(bankCards[0]);
      }
    } else if (e.key === 'Escape') {
      if (isCreating) {
        handleCancelCreate();
      } else if (isEditing) {
        handleCancelEdit();
      } else {
        setIsDropdownOpen(false);
      }
    }
  };

  const displayBankCards = bankCards;

  return (
    <>
      <InputContainer ref={inputRef}>
        <InputWrapper>
          <StyledInput
            type="text"
            value={value}
            readOnly
            onClick={handleInputClick}
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
          <CardIcon>
            <FaCreditCard size={16} />
          </CardIcon>
        </InputWrapper>
        
        {customPlaceholder && !value && (
          <PlaceholderLabel isVisible={true}>
            {customPlaceholder}
          </PlaceholderLabel>
        )}

        <AnimatePresence>
          {isDropdownOpen && (
            <Portal>
              <DropdownContainer
                initial={{ opacity: 0, scaleY: 0.95 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0.95 }}
                transition={{ duration: 0.15 }}
                ref={dropdownRef}
                style={{
                  position: 'absolute',
                  top: `${dropdownStyle.top}px`,
                  left: `${dropdownStyle.left}px`,
                  width: `${dropdownStyle.width}px`,
                  maxHeight: dropdownStyle.maxHeight,
                  zIndex: 9999
                }}
              >
                <DropdownContent>
                  {isLoading ? (
                    <DropdownItem>Загрузка карт...</DropdownItem>
                  ) : isCreating ? (
                    <CreateContainer>
                      <CreateInput
                        value={newDetails}
                        onChange={(e) => setNewDetails(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Реквизиты карты"
                        autoFocus
                      />
                      <ActionButtons>
                        <ActionButton $confirm onClick={handleConfirmCreate}>
                          ✓
                        </ActionButton>
                        <ActionButton $cancel onClick={handleCancelCreate}>
                          ✕
                        </ActionButton>
                      </ActionButtons>
                    </CreateContainer>
                  ) : displayBankCards.length > 0 ? (
                    <BankCardsList>
                      {displayBankCards.map((bankCard) => (
                        <BankCardItem key={bankCard.id}>
                          {isEditing === bankCard.id ? (
                            <EditContainer>
                              <EditInput
                                value={editDetails}
                                onChange={(e) => setEditDetails(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Детали"
                                autoFocus
                              />
                              <ActionButtons>
                                <ActionButton $confirm onClick={() => handleConfirmEdit(bankCard.id)}>
                                  ✓
                                </ActionButton>
                                <ActionButton $cancel onClick={handleCancelEdit}>
                                  ✕
                                </ActionButton>
                              </ActionButtons>
                            </EditContainer>
                          ) : (
                            <>
                              <BankCardInfo onClick={() => handleBankCardSelect(bankCard)}>
                                <BankCardDetails>{bankCard.details}</BankCardDetails>
                              </BankCardInfo>
                              <BankCardActions>
                                <ActionButton 
                                  $edit 
                                  onClick={() => handleStartEdit(bankCard)}
                                  title="Редактировать"
                                >
                                  <FaEdit size={12} />
                                </ActionButton>
                                <ActionButton 
                                  $delete 
                                  onClick={() => handleDelete(bankCard.id, bankCard.details)}
                                  title="Удалить"
                                >
                                  <FaTrash size={12} />
                                </ActionButton>
                              </BankCardActions>
                            </>
                          )}
                        </BankCardItem>
                      ))}
                    </BankCardsList>
                  ) : (
                    <DropdownItem>Карты не найдены</DropdownItem>
                  )}
                </DropdownContent>
                
                {!isCreating && !isEditing && (
                  <DropdownFooter>
                    <AddButton onClick={handleCreateNew}>
                      <FaPlus size={12} />
                      <span>Создать новую карту</span>
                    </AddButton>
                  </DropdownFooter>
                )}
              </DropdownContainer>
            </Portal>
          )}
        </AnimatePresence>

        {hasError && errorMessage && (
          <ErrorMessage>{errorMessage}</ErrorMessage>
        )}
      </InputContainer>
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
  max-width: 100%;
  background-color: white;
  color: black;
  padding: 5px;
  padding-left: 15px;
  padding-right: 60px;
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

  &:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 35px;
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

const CardIcon = styled.div`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
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

const DropdownContainer = styled(motion.div)`
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: top center;
`;

const DropdownContent = styled.div`
  overflow-y: auto;
  flex-grow: 1;
`;

const DropdownItem = styled.div`
  padding: 12px;
  font-size: 14px;
  color: #666;
  text-align: center;
`;

const BankCardsList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const BankCardItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  color: black;
  border-bottom: 1px solid #f1f1f1;
  transition: background-color 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const BankCardInfo = styled.div`
  flex: 1;
  cursor: pointer;
  padding: 4px 0;
  min-width: 0; /* Для корректного обрезания текста */
  
  &:hover {
    color: rgba(0, 125, 136, 1);
  }
`;

const BankCardDetails = styled.div`
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BankCardActions = styled.div`
  display: flex;
  gap: 8px;
  margin-left: 8px;
  flex-shrink: 0;
`;

const ActionButton = styled.button<{ $confirm?: boolean; $cancel?: boolean; $edit?: boolean; $delete?: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => {
    if (props.$confirm) return 'rgba(0, 125, 136, 1)';
    if (props.$cancel) return 'rgba(80, 85, 92, 1)';
    if (props.$edit) return 'rgba(80, 85, 92, 1)';
    if (props.$delete) return 'rgba(80, 85, 92, 1)';
    return '#6c757d';
  }};
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => {
      if (props.$confirm) return 'rgba(0, 125, 136, 0.1)';
      if (props.$cancel) return 'rgba(220, 53, 69, 0.1)';
      if (props.$edit) return 'rgba(0, 123, 255, 0.1)';
      if (props.$delete) return 'rgba(220, 53, 69, 0.1)';
      return '#f8f9fa';
    }};
  }
`;

const CreateContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 8px;
  border-bottom: 1px solid #f1f1f1;
`;

const EditContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

const CreateInput = styled.input`
  flex: 1;
  padding: 8px;
  border: 1px solid rgba(0, 125, 136, 1);
  color: black;
  background: white;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
  
  &:focus {
    border-color: rgba(0, 125, 136, 0.8);
    box-shadow: 0 0 0 2px rgba(0, 125, 136, 0.1);
  }
`;

const EditInput = styled.input`
  flex: 1;
  padding: 8px;
  border: 1px solid rgba(0, 125, 136, 1);
  color: black;
  background: white;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
  
  &:focus {
    border-color: rgba(0, 125, 136, 0.8);
    box-shadow: 0 0 0 2px rgba(0, 125, 136, 0.1);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 4px;
`;

const DropdownFooter = styled.div`
  padding: 12px;
  border-top: 1px solid #e2e8f0;
  background-color: #f8f9fa;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(0, 125, 136, 1);
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  width: 100%;
  justify-content: center;
  
  &:hover {
    background-color: rgba(0, 125, 136, 0.1);
    color: rgba(0, 100, 110, 1);
  }
`;

export default BankCardSelect;