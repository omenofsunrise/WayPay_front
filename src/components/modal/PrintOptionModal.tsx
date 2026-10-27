import styled from "styled-components";
import type { Credit } from "../../api/types/credit";
import type { Investor } from "../../api/types/investor";
import type { Payment } from "../../api/types/payment";
import BaseModal from "./BASE/modalCRUBase";

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

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      title={getModalTitle()}
      subtitle="Выберите документ для печати"
      appearance="compact-form"
      width="460px"
      onClose={onClose}
      onCancel={onClose}
      hideSaveButton
      hideCanselButton
    >
      <ModalContent>
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
    </BaseModal>
  );
};

const ModalContent = styled.div`
  padding: 6px 34px 28px;
  color: black;
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
