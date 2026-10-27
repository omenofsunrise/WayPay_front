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

const CompanyFormContent = styled.div`
  padding: 6px 34px 24px;
  text-align: left;

  @media (max-width: 600px) {
    padding: 4px 18px 20px;
  }
`;

const FormSection = styled.section`
  width: 100%;
  margin-top: 8px;
  box-sizing: border-box;
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px;
  color: #07818a;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  text-align: left;
`;

const FieldsGrid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px 18px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FormField = styled.label<{ $fullWidth?: boolean }>`
  display: flex;
  grid-column: ${({ $fullWidth }) => ($fullWidth ? "1 / -1" : "auto")};
  min-width: 0;
  flex-direction: column;
  gap: 7px;
  color: #192438;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  text-align: left;
`;

const InputShell = styled.div`
  min-width: 0;

  > div {
    display: block;
    width: 100%;
    max-width: none;
    margin: 0;
  }

  input {
    width: 100%;
    max-width: none;
    min-height: 40px;
    padding: 7px 13px;
    box-sizing: border-box;
    color: #172235;
    font-size: 14px;
    background: #fff;
    border-color: #c7d2de;
    border-radius: 7px;
  }

  input::placeholder {
    color: #8b97a9;
  }
`;

const CalendarShell = styled.div<{ $disabled?: boolean }>`
  min-width: 0;
  pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};

  > div {
    display: block;
    width: 100%;
  }

  > div > div {
    width: 100%;
    min-height: 40px;
    max-height: none;
    padding: 7px 12px;
    border-color: #c7d2de;
    border-radius: 7px;
    background: ${({ $disabled }) => ($disabled ? "#f6f8fa" : "#fff")};
  }
`;

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

  const isViewMode = mode === "view";
  const modalSubtitle = mode === "create"
    ? "Заполните сведения о компании и срок подписки"
    : mode === "edit"
      ? "Обновите сведения о компании и срок подписки"
      : "Сведения о компании и срок подписки";

  return (
    <BaseModal
      isOpen={isOpen}
      title={mode === 'create' ? 'Новая компания' : mode === 'edit' ? 'Редактирование компании' : 'Просмотр компании'}
      subtitle={modalSubtitle}
      appearance="compact-form"
      width="680px"
      maxHeight="calc(100vh - 32px)"
      cancelButtonText={isViewMode ? "Закрыть" : "Отмена"}
      saveButtonText={mode === "create" ? "Создать компанию" : "Сохранить изменения"}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      mode={mode}
      isSaveDisabled={!formData.phone || !formData.licenceDate}
    >
      <CompanyFormContent>
        <FormSection>
          <SectionTitle>Основная информация</SectionTitle>
          <FieldsGrid>
            <FormField $fullWidth>
              Название компании
              <InputShell>
                <CustomInput
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Введите название компании"
                  disabled={isViewMode}
                />
              </InputShell>
            </FormField>

            <FormField $fullWidth>
              Директор
              <InputShell>
                <CustomInput
                  name="chief"
                  value={formData.chief}
                  onChange={handleChange}
                  placeholder="Введите ФИО директора"
                  disabled={isViewMode}
                />
              </InputShell>
            </FormField>

            <FormField>
              Телефон
              <InputShell>
                <PhoneModalInput
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isViewMode}
                />
              </InputShell>
            </FormField>

            <FormField>
              Дата окончания лицензии
              <CalendarShell $disabled={isViewMode}>
                <CustomCalendar
                  prefix=""
                  value={formData.licenceDate.toISOString().split('T')[0]}
                  onChange={handleDateChange}
                />
              </CalendarShell>
            </FormField>
          </FieldsGrid>
        </FormSection>
      </CompanyFormContent>
    </BaseModal>
  );
};

export default CompanyModal;
