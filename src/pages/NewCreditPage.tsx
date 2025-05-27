import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useState } from 'react';
import CustomTitle from '../components/ui/Text/CustomTitle';
import TitleField from '../components/ui/Layouts/TitleLayout';
import PageLayout from '../components/ui/Layouts/PageLayout';
import DarkCyanButton from '../components/ui/Buttons/DarkCyanButton';
import GrayButton from '../components/ui/Buttons/GrayButton';
import ModalInfoTitle from '../components/ui/Text/ModalInfoTitle';
import DateInput from '../components/ui/fields/DateInput';
import EntitySelectContainer from '../components/ui/Layouts/EntitySelectContainer';
import ClientSelectModal from '../components/modal/ClientSelectModal';

interface Client {
  id: number;
  name: string;
  phone?: string;
}

const NewCreditPage = () => {
  const navigate = useNavigate();
  const [contractDate, setContractDate] = useState<string | null>(null);
  const [buyer, setBuyer] = useState<Client | null>(null);
  const [guarantor, setGuarantor] = useState<Client | null>(null);
  const [investor, setInvestor] = useState<Client | null>(null);
  const [modalType, setModalType] = useState<'buyer' | 'guarantor' | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const handleSelectClient = (client: Client) => {
    if (modalType === 'buyer') {
      setBuyer(client);
    } else if (modalType === 'guarantor') {
      setGuarantor(client);
    }
    setIsClientModalOpen(false);
  };

  const openClientModal = (type: 'buyer' | 'guarantor') => {
    setModalType(type);
    setIsClientModalOpen(true);
  };

  return (
    <PageLayout>
      <TitleField>
        <CustomTitle>Новый договор</CustomTitle>
      </TitleField>

      <ContentWrapper>
        <ModalInfoTitle>Основная информация</ModalInfoTitle>
        
        <FormRow>
          <FieldGroup>
            <Label>Дата</Label>
            <DateInput 
              value={contractDate} 
              onChange={(date) => setContractDate(date)}
              style={{ width: '248px' }}
            />
          </FieldGroup>
          
          <FieldGroup>
            <Label>Инвестор</Label>
            <EntitySelectContainer
              mode="create"
              primaryValue={investor?.name || ''}
              secondaryValue={investor?.phone}
              placeholder="Выберите инвестора"
              onSelect={() => {/* Реализовать выбор инвестора */}}
              onClear={() => setInvestor(null)}
              style={{ width: '465px' }}
            />
          </FieldGroup>
        </FormRow>

        <FormRow>
          <FieldGroup>
            <Label>Покупатель</Label>
            <EntitySelectContainer
              mode="create"
              primaryValue={buyer?.name || ''}
              secondaryValue={buyer?.phone}
              placeholder="Выберите покупателя"
              onSelect={() => openClientModal('buyer')}
              onClear={() => setBuyer(null)}
              style={{ width: '465px' }}
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Поручитель</Label>
            <EntitySelectContainer
              mode="create"
              primaryValue={guarantor?.name || ''}
              secondaryValue={guarantor?.phone}
              placeholder="Выберите поручителя"
              onSelect={() => openClientModal('guarantor')}
              onClear={() => setGuarantor(null)}
              style={{ width: '465px' }}
            />
          </FieldGroup>
        </FormRow>
      </ContentWrapper>
    
      <ButtonWrapper>
        <GrayButton onClick={() => navigate(-1)}>
          Отменить
        </GrayButton>
        <DarkCyanButton 
          style={{ marginLeft: '10px' }}
          disabled={!buyer || !contractDate}
        >
          Сохранить
        </DarkCyanButton>
      </ButtonWrapper>

      <ClientSelectModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSubmit={handleSelectClient}
        title={modalType === 'buyer' ? 'Выбор покупателя' : 'Выбор поручителя'}
      />
    </PageLayout>
  );
};

const ContentWrapper = styled.div`
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  margin-top: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FormRow = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
`;

const ButtonWrapper = styled.div`
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
`;

export default NewCreditPage;