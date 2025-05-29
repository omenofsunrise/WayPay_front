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
import PaymentScheduleTable, { type PaymentScheduleItem } from '../components/ui/tables/PaymentScheduleTable';
import CustomInput from '../components/ui/fields/CustomInput';
import ClientModal from '../components/modal/ClientModal';
import InvestorModal from '../components/modal/InvestorModal';
import useClient from '../api/hooks/useClient';

interface Client {
  id: number;
  fullName: string;
  phone?: string;
  doc?: string;
  birthdate?: string;
  docIssueDate?: string;
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

interface ViewButtonProps {
  onClick?: () => void;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [totalSum, setTotalSum] = useState(0);
  const [initialPaymentPercent, setInitialPaymentPercent] = useState<string>('');
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<string>('');
  const [months, setMonths] = useState<string>('');
  const [paymentDue, setPaymentDue] = useState<string>('');
  const [isViewClientModalOpen, setIsViewClientModalOpen] = useState(false);
  const [isViewGuarantorModalOpen, setIsViewGuarantorModalOpen] = useState(false);
  const [isViewInvestorModalOpen, setIsViewInvestorModalOpen] = useState(false);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([
    {
      id: 1,
      date: '01.01.2023',
      remainingAmount: 100000,
      requiredPayment: 20000,
      note: 'Первый платёж'
    },
    {
      id: 2,
      date: '01.02.2023',
      remainingAmount: 80000,
      requiredPayment: 20000,
      note: 'Второй платёж'
    },
    {
      id: 3,
      date: '01.03.2023',
      remainingAmount: 80000,
      requiredPayment: 20000,
      note: 'Третий платёж'
    },
    {
      id: 4,
      date: '01.04.2023',
      remainingAmount: 80000,
      requiredPayment: 20000,
      note: ''
    },
    {
      id: 5,
      date: '01.05.2023',
      remainingAmount: 80000,
      requiredPayment: 20000,
      note: ''
    }
  ]);
  const { getClientById } = useClient();

  const handleSelectClient = (client: Client) => {
    if (modalType === 'client') {
      setClient(client);
    } else if (modalType === 'guarantor') {
      setGuarantor(client);
    }
    setIsClientModalOpen(false);
  };

  const handleViewClient = async () => {
    if (client) {
      const fullClientData = await getClientById(client.id);
      if (fullClientData) {
        setClient(fullClientData);
        setIsViewClientModalOpen(true);
      }
    }
  };

  const handleViewGuarantor = async () => {
    if (guarantor) {
      const fullGuarantorData = await getClientById(guarantor.id);
      if (fullGuarantorData) {
        setGuarantor(fullGuarantorData);
        setIsViewGuarantorModalOpen(true);
      }
    }
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

  return (
    <PageLayout>
      <TitleField style={{ marginTop: "0" }}>
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
              <ViewButton onClick={() => investor && setIsViewInvestorModalOpen(true)} />
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
              <ViewButton onClick={handleViewClient} />
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
              <ViewButton onClick={handleViewGuarantor} />
            </EntitySelectWrapper>
          </FieldGroup>
        </FormRow>

        <ModalInfoTitle>Список товаров</ModalInfoTitle>
        <ProductsTableWrapper>
          <ProductsTable 
            products={products} 
            onProductsChange={setProducts}
            onTotalSumChange={setTotalSum}
          />
        </ProductsTableWrapper>
        <TotalSumContainer>
          Итого товаров на сумму: {totalSum.toLocaleString('ru-RU')} ₽
        </TotalSumContainer>

        <ModalInfoTitle>График выплат</ModalInfoTitle>
      <PaymentScheduleContainer>
        <PaymentScheduleInputs>
          <InputGroup>
            <InputLabel>Первоначальный взнос</InputLabel>
            <InputRow>
              <CustomInput 
                inputType="number" 
                placeholder="%" 
                value={initialPaymentPercent}
                onChange={(e) => setInitialPaymentPercent(e.target.value)}
              />
              <CustomInput 
                inputType="rubles"
                placeholder="Сумма" 
                value={initialPaymentAmount}
                onChange={(e) => setInitialPaymentAmount(e.target.value)}
              />
            </InputRow>
          </InputGroup>
          <InputGroup>
            <InputRow style={{ marginBottom: '8px' }}>
              <InputLabel style={{ flex: 1 }}>Месяцев</InputLabel>
              <InputLabel1 style={{ flex: 1 }}>Уплата до</InputLabel1>
            </InputRow>
            <InputRow>
              <CustomInput 
                inputType="number"
                placeholder="Месяцев" 
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                style={{ flex: 1 }}
              />
              <CustomInput 
                inputType="number" 
                placeholder="Уплата до" 
                value={paymentDue}
                onChange={(e) => setPaymentDue(e.target.value)}
                style={{ flex: 1 }}
              />
            </InputRow>
          </InputGroup>
          <InputGroup>
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
          </InputGroup>
        </PaymentScheduleInputs>
        <PaymentScheduleTable data={paymentSchedule} />
      </PaymentScheduleContainer>
      </ContentWrapper>

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

      <ClientModal
        mode="view"
        isOpen={isViewClientModalOpen}
        onClose={() => setIsViewClientModalOpen(false)}
        onSubmit={async () => false}
        initialData={client ? {
          id: client.id,
          fullName: client.fullName,
          phone: client.phone || '',
          doc: client.doc || '',
          birthdate: client.birthdate || '',
          docIssueDate: client.docIssueDate || ''
        } : undefined}
      />

      <ClientModal
        mode="view"
        isOpen={isViewGuarantorModalOpen}
        onClose={() => setIsViewGuarantorModalOpen(false)}
        onSubmit={async () => false}
        initialData={client ? {
          id: client.id,
          fullName: client.fullName,
          phone: client.phone || '',
          doc: client.doc || '',
          birthdate: client.birthdate || '',
          docIssueDate: client.docIssueDate || ''
        } : undefined}
      />

      <InvestorModal
        mode="view"
        isOpen={isViewInvestorModalOpen}
        onClose={() => setIsViewInvestorModalOpen(false)}
        onSubmit={async () => false} // Не используется в режиме просмотра
        initialData={investor ? {
          id: investor.id,
          nickname: investor.nickname,
          fullName: investor.fullName,
          phoneNumber: investor.phoneNumber,
          investorPie: investor.investorPie,
          investmentAmount: investor.investmentAmount,
          balance: investor.balance,
          isCompany: false // Добавьте реальное значение, если оно есть
        } : undefined}
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

const TotalSumContainer = styled.div`
  text-align: left;
  font-weight: 500;
  color: black;
  margin-top: 10px;
`;

const ViewButton = ({ onClick }: ViewButtonProps) => {
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
      onClick={onClick}
    />
  );
};

const PaymentScheduleContainer = styled.div`
  display: flex;
  gap: 20px;
`;

const PaymentScheduleInputs = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 300px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InputLabel = styled.label`
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-right: auto;
  text-align: left;
  margin-bottom: 0;
  padding-bottom: 0;
`;

const InputLabel1 = styled.label`
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-right: auto;
  text-align: left;
  margin-left: 0;
  margin-bottom: 0;
  padding-bottom: 0;
`;

const InputRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 0;
  padding-bottom: 0;
`;

const InputField = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  flex: 1;
  margin-top: 0;

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

export default NewCreditPage;