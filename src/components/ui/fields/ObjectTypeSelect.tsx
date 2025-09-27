import { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Portal from '../../../utils/Portal';
import { FaTimes, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import useObjectTypes from '../../../api/hooks/useObjectType';
import type { EntityType } from '../../../api/types/objectType';

interface ObjectTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  onObjectTypeSelect?: (objectType: { 
    id: number; 
    name: string; 
    entityType: EntityType;
  }) => void;
  placeholder?: string;
  customPlaceholder?: string;
  hasError?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  entityType?: EntityType;
}

const ObjectTypeSelect = ({
  value,
  onChange,
  onObjectTypeSelect,
  placeholder = 'Выберите тип',
  customPlaceholder,
  hasError = false,
  errorMessage,
  disabled = false,
  entityType = 'credit',
  ...props
}: ObjectTypeSelectProps) => {
  const { 
    objectTypes, 
    getAll, 
    create, 
    update, 
    deleteObjectType,
    isLoading 
  } = useObjectTypes();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    getAll({ entityType, pageSize: 50 });
  }, [getAll, entityType]);

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

  const handleInputClick = () => {
    if (!disabled) {
      setIsDropdownOpen(true);
      updateMenuPosition();
    }
  };

  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleObjectTypeSelect = (objectType: { id: number; name: string; entityType: EntityType }) => {
    onChange(objectType.name);
    if (onObjectTypeSelect) {
      onObjectTypeSelect(objectType);
    }
    setIsDropdownOpen(false);
  };

  const handleClearSelection = () => {
    onChange('');
    if (onObjectTypeSelect) {
      onObjectTypeSelect({
        id: 0,
        name: '',
        entityType: 'credit'
      });
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setNewName('');
  };

  const handleConfirmCreate = async () => {
    if (newName.trim()) {
      const created = await create({
        name: newName.trim(),
        entityType: entityType
      });
      
      if (created) {
        setNewName('');
        setIsCreating(false);
        handleObjectTypeSelect(created);
      }
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewName('');
  };

  const handleStartEdit = (objectType: { id: number; name: string }) => {
    setIsEditing(objectType.id);
    setEditName(objectType.name);
  };

  const handleConfirmEdit = async (id: number) => {
    if (editName.trim()) {
      const updated = await update(id, { name: editName.trim() });
      if (updated) {
        setIsEditing(null);
        setEditName('');
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditName('');
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить тип "${name}"?`)) {
      try {
        await deleteObjectType(id);
      }
      catch {
        window.alert("Невозможно удалить категорию к которой привязаны договоры");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isCreating) {
        handleConfirmCreate();
      } else if (isEditing) {
        handleConfirmEdit(isEditing);
      } else if (objectTypes.length > 0) {
        handleObjectTypeSelect(objectTypes[0]);
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

  // Убрана фильтрация - всегда показываем все типы
  const displayObjectTypes = objectTypes;

  return (
    <>
      <InputContainer>
        <InputWrapper>
          <StyledInput
            ref={inputRef}
            type="text"
            value={value}
            readOnly // Запрещаем ввод
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
                  maxHeight: '400px',
                  zIndex: 1000
                }}
              >
                <DropdownContent>
                  {isLoading ? (
                    <DropdownItem>Загрузка типов...</DropdownItem>
                  ) : isCreating ? (
                    <CreateContainer>
                      <CreateInput
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Введите название типа"
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
                  ) : displayObjectTypes.length > 0 ? (
                    displayObjectTypes.map((objectType) => (
                      <ObjectTypeItem key={objectType.id}>
                        {isEditing === objectType.id ? (
                          <EditContainer>
                            <EditInput
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={handleKeyDown}
                              autoFocus
                            />
                            <ActionButtons>
                              <ActionButton $confirm onClick={() => handleConfirmEdit(objectType.id)}>
                                ✓
                              </ActionButton>
                              <ActionButton $cancel onClick={handleCancelEdit}>
                                ✕
                              </ActionButton>
                            </ActionButtons>
                          </EditContainer>
                        ) : (
                          <>
                            <ObjectTypeName 
                              onClick={() => handleObjectTypeSelect(objectType)}
                            >
                              {objectType.name}
                            </ObjectTypeName>
                            <ObjectTypeActions>
                              <ActionButton 
                                $edit 
                                onClick={() => handleStartEdit(objectType)}
                                title="Редактировать"
                              >
                                <FaEdit size={12} />
                              </ActionButton>
                              <ActionButton 
                                $delete 
                                onClick={() => handleDelete(objectType.id, objectType.name)}
                                title="Удалить"
                              >
                                <FaTrash size={12} />
                              </ActionButton>
                            </ObjectTypeActions>
                          </>
                        )}
                      </ObjectTypeItem>
                    ))
                  ) : (
                    <DropdownItem>Типы не найдены</DropdownItem>
                  )}
                </DropdownContent>
                
                <DropdownFooter>
                  {!isCreating && (
                    <AddButton onClick={handleCreateNew}>
                      <FaPlus size={12} />
                      <span>Создать новый тип</span>
                    </AddButton>
                  )}
                </DropdownFooter>
              </DropdownMenu>
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

// Стили остаются без изменений
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
  max-height: 400px;
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

const ObjectTypeItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  color: black;
  border-bottom: 1px solid #f1f1f1;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background-color: #f8f9fa;
  }
`;

const ObjectTypeName = styled.div`
  flex: 1;
  cursor: pointer;
  padding: 4px 0;
  &:hover {
    color: rgba(0, 125, 136, 1);
  }
`;

const ObjectTypeActions = styled.div`
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${ObjectTypeItem}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button<{ $confirm?: boolean; $cancel?: boolean; $edit?: boolean; $delete?: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 3px;
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
  
  &:hover {
    background-color: ${props => {
      if (props.$confirm) return 'rgba(40, 167, 69, 0.1)';
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
  padding: 8px 12px;
  gap: 8px;
`;

const EditContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CreateInput = styled.input`
  flex: 1;
  padding: 4px 8px;
  border: 1px solid rgba(0, 125, 136, 1);
  color: black;
  background: white;
  border-radius: 5px;
  font-size: 14px;
  
  outline: none;
  
  transition: border-color 0.2s ease;
  
  &:focus {
    border-color: rgba(0, 125, 136, 0.8);
  }
`;

const EditInput = styled.input`
  flex: 1;
  padding: 4px 8px;
  border: 1px solid rgba(0, 125, 136, 1);
  color: black;
  background: white;
  border-radius: 5px;
  font-size: 14px;
  
  outline: none;
  
  transition: border-color 0.2s ease;
  
  &:focus {
    border-color: rgba(0, 125, 136, 0.8);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 2px;
`;

const DropdownFooter = styled.div`
  padding: 8px 12px;
  border-top: 1px solid rgba(209, 213, 219, 1);
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(0, 125, 136, 1);
  font-size: 14px;
  padding: 4px 0;
  
  &:hover {
    color: rgba(0, 100, 110, 1);
  }
`;

export default ObjectTypeSelect;