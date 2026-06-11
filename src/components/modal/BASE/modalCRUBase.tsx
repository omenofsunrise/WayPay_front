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
  maxHeight?: string;
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
  maxHeight = '90vh'
}) => {
  const isViewMode = mode === 'view';
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    onCancel();
  };

  // Блокируем скролл страницы при открытии модалки
  useEffect(() => {
    // Сохраняем текущую позицию скролла
    const scrollY = window.scrollY;
    
    // Блокируем скролл на body
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      // Восстанавливаем скролл при закрытии
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

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
    
    window.addEventListener('resize', checkContentHeight);
    
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

  // Обработчик Escape
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

  // Предотвращаем скролл фона при скролле внутри модалки
  const handleModalScroll = (e: React.WheelEvent) => {
    const modalContent = contentRef.current;
    if (!modalContent) return;

    const isAtTop = modalContent.scrollTop === 0;
    const isAtBottom = 
      Math.abs(modalContent.scrollHeight - modalContent.clientHeight - modalContent.scrollTop) < 1;

    // Если мы вверху и скроллим вверх, или внизу и скроллим вниз - блокируем событие
    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
      e.stopPropagation();
    }
  };

  return (
    <ModalBackdrop>
      <ModalContainer 
        width={width} 
        maxHeight={maxHeight} 
        ref={modalRef}
        onWheel={handleModalScroll}
      >
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
  overflow: hidden; /* Важно: предотвращаем скролл бэкдропа */
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
  overflow: hidden;
  
  /* Ограничиваем максимальную высоту относительно окна */
  @media (max-height: 768px) {
    max-height: 95vh;
  }
`;

const ModalForm = styled.form`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0;
  flex-shrink: 0;
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
  min-height: 0;
  
  /* Всегда включаем скролл если контент не помещается */
  overflow-y: ${props => props.isScrollable ? 'auto' : 'visible'};
  
  /* Кастомный скроллбар */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(241, 241, 241, 1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(173, 179, 188, 1);
    border-radius: 4px;
    
    &:hover {
      background: rgba(130, 140, 150, 1);
    }
  }
  
  scrollbar-width: thin;
  scrollbar-color: rgba(173, 179, 188, 1) rgba(241, 241, 241, 1);
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 30px 20px 30px;
  flex-shrink: 0;
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
