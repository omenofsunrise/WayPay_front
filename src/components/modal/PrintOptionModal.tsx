import styled from "styled-components";
import type { Credit } from "../../api/types/credit";
import type { Investor } from "../../api/types/investor";
import type { Payment } from "../../api/types/payment";

export interface PrintOption {
  key: string;
  label: string;
  enabled?: boolean;
}

export interface PrintOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: 'sale' | 'saleSinglePage' | 'schedules' | 'guaranteeConsent' | 'paymentConfirmation' | 'investorContract') => void;
  selectedCredit?: Credit | null;
  selectedPayment?: Payment | null;
  selectedInvestor?: Investor | null;
  printOptions?: PrintOption[];
  modalTitle?: string;
}

const PrintOptionModal = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedCredit, 
  selectedPayment,
  selectedInvestor,
  printOptions, 
  modalTitle = "Выберите тип договора" 
}: PrintOptionModalProps) => {
  
  const defaultOptions: PrintOption[] = [
    { key: 'sale', label: 'Договор купли-продажи', enabled: !!selectedCredit },
    { key: 'saleSinglePage', label: 'Договор купли-продажи (одностраничный)', enabled: !!selectedCredit },
    { key: 'guaranteeConsent', label: 'Договор поручительства', enabled: !!selectedCredit },
    { key: 'schedules', label: 'График платежей', enabled: !!selectedCredit },
    { key: 'paymentConfirmation', label: 'Чек', enabled: !!selectedPayment },
    { key: 'investorContract', label: 'Договор с инвестором', enabled: !!selectedInvestor }
  ];
  
  const options = printOptions || defaultOptions;

  const hasSelectedItem = selectedCredit || selectedPayment || selectedInvestor;

  const handleSelect = (optionKey: string) => {
    if (hasSelectedItem) {
      onSelect(optionKey);
    } else {
      console.error('No item selected for printing');
      onClose();
    }
  };

  // Автоматически определяем заголовок в зависимости от типа выбранного элемента
  const getModalTitle = () => {
    if (modalTitle !== "Выберите тип договора") return modalTitle;
    
    if (selectedPayment) return "Печать документа по платежу";
    if (selectedInvestor) return "Печать документа по инвестору";
    if (selectedCredit) return "Выберите тип договора";
    
    return "Печать документа";
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>{getModalTitle()}</ModalTitle>
        <PrintOptions>
          {options.map(option => (
            option.enabled !== false && (
              <PrintOption 
                key={option.key} 
                onClick={() => handleSelect(option.key)}
                disabled={!option.enabled}
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

const PrintOption = styled.button<{ disabled?: boolean }>`
  padding: 12px;
  background-color: ${({ disabled }) => disabled ? '#f9f9f9' : '#f5f5f5'};
  border: 1px solid ${({ disabled }) => disabled ? '#eee' : '#ddd'};
  border-radius: 4px;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  text-align: center;
  transition: background-color 0.2s;
  color: ${({ disabled }) => disabled ? '#999' : 'black'};
  
  &:hover {
    background-color: ${({ disabled }) => disabled ? '#f9f9f9' : '#e9e9e9'};
    border-color: ${({ disabled }) => disabled ? '#eee' : 'rgba(0, 125, 136, 1)'};
  }
`;

export default PrintOptionModal;