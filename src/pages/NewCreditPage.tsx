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
import InvestorSelectModal from '../components/modal/InvestorSelectModal';
import view from '../assets/ui/credits/newCredit/view.svg';
import CustomTable from '../components/ui/tables/CustomTable';
import ProductsTable from '../components/ui/tables/ProductTable';

interface Client {
  id: number;
  fullName: string;
  phone?: string;
}

interface Investor {
  id: number;
  nickname: string;
  fullName: string;
  phoneNumber: string;
  investorPie: number;
  investmentAmount: number;
  balance: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  markup: number;
  totalPrice: number;
}

const NewCreditPage = () => {
  const navigate = useNavigate();
  const [contractDate, setContractDate] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [guarantor, setGuarantor] = useState<Client | null>(null);
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [modalType, setModalType] = useState<'client' | 'guarantor' | 'investor' | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: 'Ноутбук ASUS X543', price: 45000, quantity: 1, markup: 10, totalPrice: 49500 },
    { id: 2, name: 'Мышь беспроводная', price: 1500, quantity: 2, markup: 15, totalPrice: 3450 },
    { id: 3, name: 'Клавиатура механическая', price: 3500, quantity: 1, markup: 5, totalPrice: 3675 },
    { id: 4, name: 'Монитор 24"', price: 18000, quantity: 1, markup: 8, totalPrice: 19440 },
    { id: 5, name: 'Коврик для мыши', price: 500, quantity: 1, markup: 0, totalPrice: 500 },
    { id: 6, name: 'Наушники беспроводные', price: 6000, quantity: 1, markup: 12, totalPrice: 6720 },
  ]);

  const handleSelectClient = (client: Client) => {
    if (modalType === 'client') {
      setClient(client);
    } else if (modalType === 'guarantor') {
      setGuarantor(client);
    }
    setIsClientModalOpen(false);
  };

  const handleSelectInvestor = (selectedInvestor: Investor) => {
    setInvestor(selectedInvestor);
    setIsInvestorModalOpen(false);
  };

  const openClientModal = (type: 'client' | 'guarantor') => {
    setModalType(type);
    setIsClientModalOpen(true);
  };

  const openInvestorModal = () => {
    setModalType('investor');
    setIsInvestorModalOpen(true);
  };

  const tableColumns = [
    { name: '№', align: 'center' },
    { name: 'Название', align: 'left' },
    { name: 'Стоимость', align: 'right' },
    { name: 'Количество', align: 'center' },
    { name: 'Надбавка', align: 'right' },
    { name: 'Цена', align: 'right' },
  ];

  const tableData = products.map(product => [
    product.id,
    product.name,
    `${product.price.toLocaleString()} ₽`,
    product.quantity,
    `${product.markup}%`,
    `${product.totalPrice.toLocaleString()} ₽`,
  ]);

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
            <DateInputWrapper>
              <DateInput 
                value={contractDate} 
                onChange={(date) => setContractDate(date)}
              />
            </DateInputWrapper>
          </FieldGroup>
        
          <FieldGroup>
            <Label>Инвестор</Label>
            <EntitySelectWrapper>
              <EntitySelectContainer
                mode="create"
                primaryValue={investor?.fullName || investor?.nickname || ''}
                secondaryValue={investor?.phoneNumber}
                placeholder="Выберите инвестора"
                onSelect={openInvestorModal}
                onClear={() => setInvestor(null)}
              />
              <ViewButton/>
            </EntitySelectWrapper>
          </FieldGroup>
        </FormRow>

        <ModalInfoTitle>Сведения о покупателе</ModalInfoTitle>
        <FormRow>
          <FieldGroup>
            <Label>Покупатель</Label>
            <EntitySelectWrapper>
              <EntitySelectContainer
                mode="create"
                primaryValue={client?.fullName || ''}
                secondaryValue={client?.phone}
                placeholder="Выберите покупателя"
                onSelect={() => openClientModal('client')}
                onClear={() => setClient(null)}
              />
              <ViewButton/>
            </EntitySelectWrapper>
          </FieldGroup>

          <FieldGroup>
            <Label>Поручитель</Label>
            <EntitySelectWrapper>
              <EntitySelectContainer
                mode="create"
                primaryValue={guarantor?.fullName || ''}
                secondaryValue={guarantor?.phone}
                placeholder="Выберите поручителя"
                onSelect={() => openClientModal('guarantor')}
                onClear={() => setGuarantor(null)}
              />
              <ViewButton/>
            </EntitySelectWrapper>
          </FieldGroup>
        </FormRow>

        <ModalInfoTitle>Список товаров</ModalInfoTitle>
        <ProductsTableWrapper>
          <ProductsTable />
        </ProductsTableWrapper>
      </ContentWrapper>

      <ButtonWrapper>
        <GrayButton onClick={() => navigate(-1)}>
          Отменить
        </GrayButton>
        <DarkCyanButton 
          style={{ marginRight: 'auto' }}
          disabled={!client || !contractDate || !investor}
        >
          Создать договор
        </DarkCyanButton>
      </ButtonWrapper>

      <ClientSelectModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSubmit={handleSelectClient}
        title={modalType === 'client' ? 'Выбор покупателя' : 'Выбор поручителя'}
      />

      <InvestorSelectModal
        isOpen={isInvestorModalOpen}
        onClose={() => setIsInvestorModalOpen(false)}
        onSubmit={handleSelectInvestor}
      />
    </PageLayout>
  );
};

const ContentWrapper = styled.div`
  margin-bottom: 20px;
`;

const ProductsTableWrapper = styled.div`
  margin-top: 16px;
`;

const EntitySelectWrapper = styled.div`
  width: 465px;
  display: flex;
`;

const DateInputWrapper = styled.div`
  width: 248px;
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
  text-align: left;
`;

const ButtonWrapper = styled.div`
  margin-top: 30px;
  display: flex;
  flex-direction: row;
`;

const ViewButton = () => {
  return (
    <img 
      src={view} 
      alt="View" 
      style={{ 
        padding: "0", 
        marginLeft: "10px",
        cursor: "pointer",
        transition: "filter 0.2s ease",
      }}
      onMouseOver={(e) => e.currentTarget.style.filter = "brightness(0) invert(0)"}
      onMouseOut={(e) => e.currentTarget.style.filter = "brightness(0) invert(0.3)"}
    />
  );
};

export default NewCreditPage;