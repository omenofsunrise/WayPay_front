import React from 'react';
import styled from 'styled-components';
import ReactDOM from 'react-dom';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 400px;
  text-align: center;
  position: relative;
`;

const ModalTitle = styled.h2`
  margin: 0 0 15px 0;
  color: #333;
`;

const ModalText = styled.p`
  margin: 0 0 20px 0;
  color: #666;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const Button = styled.button<{ $primary?: boolean }>`
  background: ${props => props.$primary ? '#007D88' : '#f0f0f0'};
  color: ${props => props.$primary ? 'white' : '#333'};
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: ${props => props.$primary ? '600' : '400'};
  
  &:hover {
    opacity: 0.9;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  
  &:hover {
    color: #666;
  }
`;

interface DemoPromoModalProps {
  onClose: () => void;
  onGo: () => void;
}

const DemoPromoModal: React.FC<DemoPromoModalProps> = ({ onClose, onGo }) => {
  const modalContent = (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalTitle>🔒 Демо-режим</ModalTitle>
        <ModalText>
          Полный доступ к данным доступен только на основном сайте. 
          Хотите перейти?
        </ModalText>
        <ButtonGroup>
          <Button $primary onClick={onGo}>
            Перейти на сайт
          </Button>
        </ButtonGroup>
        <CloseButton onClick={onClose}>✕</CloseButton>
      </ModalContent>
    </ModalOverlay>
  );

  return ReactDOM.createPortal(
    modalContent,
    document.body
  );
};

export default DemoPromoModal;