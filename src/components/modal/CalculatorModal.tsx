import React from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

interface CalculatorModalProps {
  onClose: () => void;
}

const CalculatorModal = ({ onClose }: CalculatorModalProps) => {
  return createPortal(
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Калькулятор</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <ModalContent>
          <p>Здесь будет функционал калькулятора</p>
          <CalculatorForm>
            <FormGroup>
              <label>Сумма кредита:</label>
              <input type="number" placeholder="Введите сумму" />
            </FormGroup>
            <FormGroup>
              <label>Срок (мес.):</label>
              <input type="number" placeholder="Введите срок" />
            </FormGroup>
            <FormGroup>
              <label>Процентная ставка:</label>
              <input type="number" placeholder="Введите ставку" />
            </FormGroup>
            <CalculateButton>Рассчитать</CalculateButton>
          </CalculatorForm>
        </ModalContent>
      </ModalContainer>
    </ModalOverlay>,
    document.body
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  &:hover {
    color: #000;
  }
`;

const ModalContent = styled.div`
  padding: 24px;
`;

const CalculatorForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-weight: 500;
    color: #374151;
  }

  input {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 16px;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
  }
`;

const CalculateButton = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 8px;

  &:hover {
    background-color: #2563eb;
  }
`;

export default CalculatorModal;