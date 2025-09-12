import styled from "styled-components";
import type { Credit } from "../../api/types/credit";
import type { Investor } from "../../api/types/investor";

export interface PrintOption {
  key: string;
  label: string;
  enabled?: boolean;
}

interface PrintOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: string) => void;
  selectedCredit: Credit | null;
  selectedInvestor?: Investor | null;
  printOptions?: PrintOption[];
  modalTitle?: string;
}

const PrintOptionModal = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedCredit, 
  printOptions, 
  selectedInvestor,
  modalTitle = "Выберите тип договора" 
}: PrintOptionModalProps) => {
  
  const defaultOptions: PrintOption[] = [
    { key: 'sale', label: 'Договор купли-продажи', enabled: true },
    { key: 'guaranteeConsent', label: 'Договор поручительства', enabled: true },
    { key: 'schedules', label: 'График платежей', enabled: true },
    { key: 'investorContract', label: 'Договор с инвестором', enabled: !!selectedInvestor }
  ];
  
  const options = printOptions || defaultOptions;

  const handleSelect = (optionKey: string) => {
    if (selectedCredit || selectedInvestor) {
      onSelect(optionKey);
    } else {
      console.error('No credit selected');
      onClose();
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>{modalTitle}</ModalTitle>
        <PrintOptions>
          {options.map(option => (
            option.enabled !== false && (
              <PrintOption 
                key={option.key} 
                onClick={() => handleSelect(option.key)}
              >
                {option.label}
              </PrintOption>
            )
          ))}
        </PrintOptions>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: black;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  color: black;
`;

const ModalTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
`;

const PrintOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PrintOption = styled.button`
  padding: 12px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s;
  color: black;
  
  &:hover {
    background-color: #e9e9e9;
    border-color: rgba(0, 125, 136, 1);
  }
`;

export default PrintOptionModal;