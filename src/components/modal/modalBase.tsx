import React, { type ReactNode } from 'react';
import styled from 'styled-components';
import DarkCyanButton from '../ui/Buttons/DarkCyanButton';

export type ModalMode = 'create' | 'edit' | 'view';

interface ModalProps {
  title: string;
  onClose: () => void;
  onCancel: () => void;
  onSave: () => void;
  children: ReactNode;
  isSaveDisabled?: boolean;
  mode?: ModalMode;
}

const BaseModal: React.FC<ModalProps> = ({
  title,
  onClose,
  onCancel,
  onSave,
  children,
  isSaveDisabled = false,
  mode = 'create',
}) => {
  const isViewMode = mode === 'view';

  return (
    <ModalBackdrop>
      <ModalContainer>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>

        <ModalContent>{children}</ModalContent>

        <ModalFooter>
          <CancelButton onClick={onCancel}>Отменить</CancelButton>
          {!isViewMode && (
            <DarkCyanButton 
              style={{ width: "136px", borderRadius: "5px" }} 
              onClick={onSave}
              disabled={isSaveDisabled}
            >
              Сохранить
            </DarkCyanButton>
          )}
        </ModalFooter>
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

const ModalContainer = styled.div`
  width: 562px;
  height: auto;
  background-color: rgba(249, 250, 250, 1);
  border: 1px solid rgba(173, 179, 188, 1);
  border-radius: 5px;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25), 0 0 25px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  padding: 24px;
  position: relative;
  margin: 0;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0;
`;

const ModalTitle = styled.h2`
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

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 30px 20px 30px;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background-color: rgba(209, 213, 219, 1);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  width: 136px;

  &:hover {
    background-color: rgba(209, 213, 219, 0.8);
  }
`;