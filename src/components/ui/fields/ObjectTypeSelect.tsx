import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Portal from '../../../utils/Portal';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaList } from 'react-icons/fa';
import useObjectTypes from '../../../api/hooks/useObjectType';
import type { EntityType } from '../../../api/types/objectType';
import BaseModal from '../../modal/BASE/modalCRUBase';
import Pagination from './CustomPagination';
import DarkCyanButton from '../Buttons/DarkCyanButton';
import CustomInput from './CustomInput';

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

interface PaginationResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: Array<{
    id: number;
    name: string;
    entityType: EntityType;
  }>;
}

const ObjectTypeSelect = ({
  value,
  onChange,
  onObjectTypeSelect,
  placeholder = 'Выберите папку',
  customPlaceholder,
  hasError = false,
  errorMessage,
  disabled = false,
  entityType = 'credit',
  ...props
}: ObjectTypeSelectProps) => {
  const { 
    getAll, 
    create, 
    update, 
    deleteObjectType,
    isLoading 
  } = useObjectTypes();
  
  const [objectTypesData, setObjectTypesData] = useState<PaginationResponse | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manageModalMode, setManageModalMode] = useState<'create' | 'edit' | null>(null);
  const [manageName, setManageName] = useState('');
  const [editingObject, setEditingObject] = useState<{ id: number; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownCurrentPage, setDropdownCurrentPage] = useState(1);
  const itemsPerPage = 16; // Для dropdown (6 как в примере)
  const modalItemsPerPage = 6; // Для модального окна
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  // Получение данных с пагинацией
  const fetchObjectTypes = async (page: number, pageSize: number = itemsPerPage, isForModal: boolean = false) => {
    try {
      const data = await getAll({ 
        entityType, 
        pageSize, 
        page 
      });
      if (data) {
        if (isForModal) {
          setObjectTypesData(data);
        } else {
          // Для dropdown используем только первую страницу
          if (page === 1) {
            setObjectTypesData(data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching object types:', error);
    }
  };

  useEffect(() => {
    // Загружаем первую страницу для dropdown при монтировании
    fetchObjectTypes(1, itemsPerPage);
  }, [entityType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDropdownOpen) {
      // Сохраняем текущую позицию скролла
      const scrollY = window.scrollY;
      const body = document.body;
      
      // Блокируем скролл на body
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.width = '100%';
      body.style.overflowY = 'scroll'; // Оставляем скроллбар чтобы не прыгал контент
      
      return () => {
        // Восстанавливаем скролл при закрытии dropdown
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';
        body.style.overflowY = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isDropdownOpen]);

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

  const updateMenuPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsDropdownOpen(true);
      updateMenuPosition();
      // Обновляем данные при открытии dropdown
      fetchObjectTypes(1, itemsPerPage);
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
    setIsModalOpen(false);
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
    setIsModalOpen(false);
    setIsDropdownOpen(false);
    setManageModalMode('create');
    setManageName('');
    setEditingObject(null);
  };

  const handleStartEdit = (objectType: { id: number; name: string }) => {
    setIsModalOpen(false);
    setIsDropdownOpen(false);
    setManageModalMode('edit');
    setManageName(objectType.name);
    setEditingObject(objectType);
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить папку "${name}"?`)) {
      try {
        await deleteObjectType(id);
        // Обновляем данные после удаления
        if (isModalOpen) {
          fetchObjectTypes(currentPage, modalItemsPerPage, true);
        } else {
          fetchObjectTypes(1, itemsPerPage);
        }
      }
      catch {
        window.alert("Невозможно удалить категорию к которой привязаны договоры");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = objectTypesData?.items || [];
    if (e.key === 'Enter' && items.length > 0) {
      handleObjectTypeSelect(items[0]);
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    // Загружаем первую страницу для модального окна
    fetchObjectTypes(1, modalItemsPerPage, true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPage(1);
  };

  const handleCloseManageModal = () => {
    setManageModalMode(null);
    setManageName('');
    setEditingObject(null);
  };

  const handleManageSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!manageModalMode || !manageName.trim()) return;

    if (manageModalMode === 'create') {
      const created = await create({
        name: manageName.trim(),
        entityType: entityType
      });
      
      if (created) {
        setManageName('');
        setManageModalMode(null);
        // Обновляем данные после создания
        if (isModalOpen) {
          fetchObjectTypes(currentPage, modalItemsPerPage, true);
        } else {
          fetchObjectTypes(1, itemsPerPage);
        }
        handleObjectTypeSelect(created);
      }
    } else if (editingObject) {
      const updated = await update(editingObject.id, { name: manageName.trim() });
      if (updated) {
        if (value === editingObject.name) {
          onChange(updated.name);
        }
        setManageModalMode(null);
        setManageName('');
        setEditingObject(null);
        // Обновляем данные после редактирования
        if (isModalOpen) {
          fetchObjectTypes(currentPage, modalItemsPerPage, true);
        } else {
          fetchObjectTypes(1, itemsPerPage);
        }
      }
    }
  };

  // Обработчики для пагинации в модальном окне
  const handleModalPageChange = (page: number) => {
    setCurrentPage(page);
    fetchObjectTypes(page, modalItemsPerPage, true);
  };

  // Обработчик для пагинации в dropdown
  const handleDropdownPageChange = (page: number) => {
    setDropdownCurrentPage(page);
    fetchObjectTypes(page, itemsPerPage);
  };

  const displayObjectTypes = objectTypesData?.items || [];

  return (
    <>
      <InputContainer>
        <ControlsRow>
          <InputWrapper>
            <StyledInput
              ref={inputRef}
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
              <ClearButton type="button" onClick={handleClearSelection}>
                <FaTimes size={14} />
              </ClearButton>
            )}
            {!disabled && (
              <ModalButton type="button" onClick={handleOpenModal} title="Открыть список папок">
                <FaList size={14} />
              </ModalButton>
            )}
          </InputWrapper>
        </ControlsRow>
        
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
                    <DropdownItem>Загрузка папок...</DropdownItem>
                  ) : displayObjectTypes.length > 0 ? (
                    <>
                      {displayObjectTypes.map((objectType) => (
                        <ObjectTypeItem key={objectType.id}>
                          <>
                            <ObjectTypeName 
                              onClick={() => handleObjectTypeSelect(objectType)}
                            >
                              {objectType.name}
                            </ObjectTypeName>
                            <ObjectTypeActions>
                              <CompactActionButton
                                onClick={() => handleStartEdit(objectType)}
                                title="Редактировать"
                              >
                                <FaEdit size={12} />
                              </CompactActionButton>
                              <CompactActionButton
                                onClick={() => handleDelete(objectType.id, objectType.name)}
                                title="Удалить"
                              >
                                <FaTrash size={12} />
                              </CompactActionButton>
                            </ObjectTypeActions>
                          </>
                        </ObjectTypeItem>
                      ))}
                    </>
                  ) : (
                    <DropdownItem>папки не найдены</DropdownItem>
                  )}
                </DropdownContent>
                
                <DropdownFooter>
                  <AddButton type="button" onClick={handleCreateNew}>
                    <FaPlus size={12} />
                    <span>Создать новую папку</span>
                  </AddButton>
                </DropdownFooter>
              </DropdownMenu>
            </Portal>
          )}
        </AnimatePresence>

        {hasError && errorMessage && (
          <ErrorMessage>{errorMessage}</ErrorMessage>
        )}
      </InputContainer>

      {/* Модальное окно с типами объектов */}
      <AnimatePresence>
        {isModalOpen && (
          <BaseModal
            title="Выбор папки"
            onClose={handleCloseModal}
            onCancel={handleCloseModal}
            width="800px"
            maxHeight="80vh"
            hideSaveButton={true}
            saveButtonText=""
          >
            <ModalContentWrapper>
              <TopActions>
                <ModalActionButton 
                  type="button"
                  $primary 
                  onClick={handleCreateNew}
                >
                  <FaPlus size={14} />
                  Создать папку
                </ModalActionButton>
              </TopActions>

              <ListSection>
                {isLoading ? (
                  <LoadingMessage>Загрузка папок...</LoadingMessage>
                ) : displayObjectTypes.length > 0 ? (
                  <>
                    <ObjectTypeList>
                      {displayObjectTypes.map((objectType) => (
                        <ModalObjectTypeItem key={objectType.id}>
                          <>
                            <ModalObjectTypeName 
                              onClick={() => handleObjectTypeSelect(objectType)}
                            >
                              {objectType.name}
                            </ModalObjectTypeName>
                            <ModalObjectTypeActions>
                              <CompactActionButton
                                onClick={() => handleStartEdit(objectType)}
                                title="Редактировать"
                              >
                                <FaEdit size={14} />
                              </CompactActionButton>
                              <CompactActionButton
                                onClick={() => handleDelete(objectType.id, objectType.name)}
                                title="Удалить"
                              >
                                <FaTrash size={14} />
                              </CompactActionButton>
                            </ModalObjectTypeActions>
                          </>
                        </ModalObjectTypeItem>
                      ))}
                    </ObjectTypeList>
                    
                    {/* Пагинация для модального окна */}
                    {objectTypesData && objectTypesData.totalPages > 1 && (
                      <PaginationContainer>
                        <Pagination
                          total={objectTypesData.totalCount}
                          current={currentPage}
                          onChange={handleModalPageChange}
                          itemsPerPage={modalItemsPerPage}
                        />
                      </PaginationContainer>
                    )}
                  </>
                ) : (
                  <EmptyMessage>Папки не найдены</EmptyMessage>
                )}
              </ListSection>
            </ModalContentWrapper>
          </BaseModal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {manageModalMode && (
          <BaseModal
            title={manageModalMode === 'create' ? 'Создать папку' : 'Редактировать папку'}
            onClose={handleCloseManageModal}
            onCancel={handleCloseManageModal}
            onSave={handleManageSubmit}
            isSaveDisabled={!manageName.trim()}
            saveButtonText={manageModalMode === 'create' ? 'Создать' : 'Сохранить'}
            width="520px"
            maxHeight="60vh"
          >
            <CreateForm>
              <CustomInput
                value={manageName}
                onChange={(e) => setManageName(e.target.value)}
                placeholder="Введите название папки"
                autoFocus
              />
            </CreateForm>
          </BaseModal>
        )}
      </AnimatePresence>

    </>
  );
};

// Обновленные и новые стили
const InputContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-right: auto;
  gap: 8px;
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

const InputWrapper = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
`;

const StyledInput = styled.input<{ hasError?: boolean }>`
  padding: 10px 12px;
  border: 1px solid ${({ hasError }) => hasError ? 'rgba(239, 68, 68, 1)' : 'rgba(156, 163, 175, 1)'};
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

const ModalButton = styled.button`
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
    color: rgba(0, 125, 136, 1);
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

  overscroll-behavior: contain;
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
  justify-content: flex-start;
  gap: 12px;
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
  text-align: left;
  margin-right: auto;
  &:hover {
    color: rgba(0, 125, 136, 1);
  }
`;

const ObjectTypeActions = styled.div`
  display: flex;
  gap: 4px;
  opacity: 0;
  margin-left: auto;
  align-self: stretch;
  align-items: stretch;
  transition: opacity 0.2s ease;

  ${ObjectTypeItem}:hover & {
    opacity: 1;
  }
`;

const DropdownFooter = styled.div`
  padding: 8px 12px;
  border-top: 1px solid rgba(209, 213, 219, 1);
`;

const DropdownPaginationContainer = styled.div`
  padding: 8px 12px;
  border-top: 1px solid #f1f1f1;
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

// Новые стили для модального окна
const ModalContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
`;

const TopActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
`;

const ListSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const CreateForm = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 12px;
`;

const ModalActionButton = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 80px;

  ${({ $primary }) => $primary && `
    background-color: rgba(0, 125, 136, 1);
    color: white;
    
    &:hover:not(:disabled) {
      background-color: rgba(0, 100, 110, 1);
    }
    
    &:disabled {
      background-color: rgba(0, 125, 136, 0.5);
      cursor: not-allowed;
    }
  `}
`;

const ObjectTypeList = styled.div`
  flex: 1;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  min-height: 200px;
`;

const ModalObjectTypeItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 12px 16px;
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

const ModalObjectTypeName = styled.div`
  flex: 1;
  cursor: pointer;
  padding: 4px 0;
  font-size: 14px;
  text-align: left;
  margin-right: auto;
  
  &:hover {
    color: rgba(0, 125, 136, 1);
  }
`;

const ModalObjectTypeActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: stretch;
  justify-content: flex-start;
  margin-left: auto;
`;

const CompactActionButton = styled(DarkCyanButton)`
  padding: 8px 14px;
  height: 36px;
  min-width: 64px;
  font-size: 12px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
`;

const PaginationContainer = styled.div`
  margin-top: 16px;
  padding: 16px;
  border-top: 1px solid #e9ecef;
`;

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: rgba(80, 85, 92, 1);
  font-size: 14px;
`;

const EmptyMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: rgba(80, 85, 92, 1);
  font-size: 14px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
`;

export default ObjectTypeSelect;