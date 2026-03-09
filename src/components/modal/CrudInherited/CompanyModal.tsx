import { useState, useEffect } from "react";
import styled from "styled-components";
import BaseModal from "../BASE/modalCRUBase";
import PhoneModalInput from "../../ui/fields/PhoneModalInput";
import CustomCalendar from "../../ui/fields/CustomCalendar";
import CustomInput from "../../ui/fields/CustomInput";

export interface CompanyModalData {
  phone: string;
  licenceDate: Date;
  chief: string;
  company: string;
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
    licenceDate: new Date(),
    chief: '',
    company: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        phone: '',
        licenceDate: new Date(),
        chief: '',
        company: ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (dateString: string) => {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      setFormData(prev => ({ ...prev, licenceDate: date }));
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
          <FormLabel>Директор</FormLabel>
          <CustomInput
            name="chief"
            value={formData.chief}
            onChange={handleChange}
            placeholder="Введите ФИО директора"
          />
        </FormRow>

        <FormRow>
          <FormLabel>Компания</FormLabel>
          <CustomInput
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Введите название компании"
          />
        </FormRow>

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
          <CustomCalendar
            value={formData.licenceDate.toISOString().split('T')[0]}
            onChange={handleDateChange}
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