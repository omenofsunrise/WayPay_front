import { useState, useEffect } from "react";
import styled from "styled-components";
import BaseModal from "../BASE/modalCRUBase";
import DateModalInput from "../../ui/fields/DateModalInput";
import PhoneModalInput from "../../ui/fields/PhoneModalInput";

export interface CompanyModalData {
  phone: string;
  licenceDate: Date;
}

const CompanyModal = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData
}: {
  mode: 'create' | 'edit' | 'view';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompanyModalData) => void;
  initialData: CompanyModalData | null;
}) => {
  const [formData, setFormData] = useState<CompanyModalData>({
    phone: '',
    licenceDate: new Date()
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        phone: '',
        licenceDate: new Date()
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length === 10) { // Check if date is complete (dd.mm.yyyy)
      const [day, month, year] = value.split('.');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      if (!isNaN(date.getTime())) {
        setFormData(prev => ({ ...prev, licenceDate: date }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <BaseModal
      title={mode === 'create' ? 'Новая компания' : mode === 'edit' ? 'Редактирование компании' : 'Просмотр компании'}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      mode={mode}
      isSaveDisabled={!formData.phone || !formData.licenceDate}
    >
      <ModalFormContainer>
        <FormRow>
          <FormLabel>Телефон</FormLabel>
          <PhoneModalInput
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </FormRow>

        <FormRow>
          <FormLabel>Дата окончания лицензии</FormLabel>
          <DateModalInput
            name="licenceDate"
            value={formData.licenceDate.toISOString().split('T')[0]}
            onChange={handleDateChange}
            placeholder="дд.мм.гггг"
          />
        </FormRow>
      </ModalFormContainer>
    </BaseModal>
  );
};

const ModalFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
`;

const FormRow = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const FormLabel = styled.label`
  width: 200px;
  font-size: 16px;
  color: #333;
`;

export default CompanyModal;