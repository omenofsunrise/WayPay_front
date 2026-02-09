import React, { type ReactNode, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import DarkCyanButton from '../../ui/Buttons/DarkCyanButton';

export type ModalMode = 'create' | 'edit' | 'view' | 'create-pool' | 'edit-pool';

interface ModalProps {
  title?: string;
  onClose: () => void;
  onCancel: () => void;
  onSave?: (e: React.FormEvent) => void;
  children: ReactNode;
  isSaveDisabled?: boolean;
  isSubmitting?: boolean;
  mode?: ModalMode;
  hideSaveButton?: boolean;
  hideCanselButton?: boolean;
  width?: string;
  saveButtonText?: string;
  customLayout?: React.ReactNode;
  maxHeight?: string; // Опциональный параметр для ограничения максимальной высоты
}

const BaseModal: React.FC<ModalProps> = ({
  title,
  onClose,
  onCancel,
  onSave,
  children,
  isSaveDisabled = false,
  isSubmitting = false,
  mode = 'create',
  hideSaveButton = false,
  hideCanselButton = false,
  width = '562px',
  saveButtonText = "Сохранить",
  customLayout,
  maxHeight = '90vh' // Значение по умолчанию - 90% высоты окна
}) => {
  const isViewMode = mode === 'view';
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    onCancel();
  };

  // Проверяем, нужно ли включать скроллинг
  useEffect(() => {
    const checkContentHeight = () => {
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight;
        const containerHeight = contentRef.current.clientHeight;
        setIsScrollable(contentHeight > containerHeight);
      }
    };

    checkContentHeight();
    
    // Добавляем обработчик на изменение размеров окна
    window.addEventListener('resize', checkContentHeight);
    
    // Используем MutationObserver для отслеживания изменений в контенте
    const observer = new MutationObserver(checkContentHeight);
    if (contentRef.current) {
      observer.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    }

    return () => {
      window.removeEventListener('resize', checkContentHeight);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <ModalBackdrop>
      <ModalContainer width={width} maxHeight={maxHeight} ref={modalRef}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        <div className="modal-body">
          {customLayout}
        </div>
        <ModalForm onSubmit={onSave}>
          <ModalContent 
            ref={contentRef}
            isScrollable={isScrollable}
          >
            {children}
          </ModalContent>

          <ModalFooter>
            {!hideCanselButton && (
              <CancelButton onClick={handleCancel}>Отменить</CancelButton>
            )}
            {!isViewMode && !hideSaveButton && (
              <DarkCyanButton 
                style={{ minWidth: "136px", padding: "10px 20px", borderRadius: "10px", fontSize: "16px" }}
                type="submit"
                disabled={isSaveDisabled || isSubmitting}
              >
                {isSubmitting ? 'Сохранение...' : saveButtonText || 'Сохранить'}
              </DarkCyanButton>
            )}
          </ModalFooter>
        </ModalForm>
      </ModalContainer>
    </ModalBackdrop>
  );
};

export default BaseModal;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div<{ width: string; maxHeight: string }>`
  width: ${props => props.width};
  max-height: ${props => props.maxHeight};
  background-color: rgba(249, 250, 250, 1);
  border: 1px solid rgba(173, 179, 188, 1);
  border-radius: 5px;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25), 0 0 25px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  padding: 24px;
  position: relative;
  margin: 0;
  overflow: hidden; /* Скрываем переполнение контейнера */
`;

const ModalForm = styled.form`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /* Важно для flex-контейнера с overflow */
  overflow: hidden;
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0;
  flex-shrink: 0; /* Запрещаем сжатие заголовка */
`;

export const ModalTitle = styled.h2`
  font-size: 30px;
  font-weight: 600;
  color: #000;
  margin-left: 25px;
  margin-bottom: 0;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 5px;
  z-index: 1;

  &:hover {
    color: #000;
  }
`;

const ModalContent = styled.div<{ isScrollable: boolean }>`
  flex: 1;
  margin-bottom: 20px;
  min-height: 0; /* Важно для flex-контейнера с overflow */
  
  /* Включаем скроллинг только когда нужно */
  overflow-y: ${props => props.isScrollable ? 'auto' : 'visible'};
  
  /* Кастомный скроллбар для лучшего вида */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(241, 241, 241, 1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(173, 179, 188, 1);
    border-radius: 3px;
    
    &:hover {
      background: rgba(130, 140, 150, 1);
    }
  }
  
  /* Для Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(173, 179, 188, 1) rgba(241, 241, 241, 1);
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 30px 20px 30px;
  flex-shrink: 0; /* Запрещаем сжатие футера */
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background-color: rgba(209, 213, 219, 1);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  width: 136px;
  color: black;

  &:hover {
    background-color: rgba(209, 213, 219, 0.8);
  }
`;