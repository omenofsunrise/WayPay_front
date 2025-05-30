import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useEffect, useState, type ChangeEvent, useCallback } from 'react';
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
import ProductsTable from '../components/ui/tables/ProductTable';
import PaymentScheduleTable, { type PaymentScheduleItem } from '../components/ui/tables/PaymentScheduleTable';
import CustomInput from '../components/ui/fields/CustomInput';
import ClientModal from '../components/modal/ClientModal';
import InvestorModal from '../components/modal/InvestorModal';
import useClient from '../api/hooks/useClient';
import CustomSelect from '../components/ui/fields/CustomSelect';
import useSchedule from '../api/hooks/useSchedule';

interface Client {
  id: number;
  fullName: string;
  phone?: string;
  doc?: string;
  birthdate?: string | Date;
  docIssueDate?: string | Date;
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
  const [paymentDue, setPaymentDue] = useState<string>('1');
  const [isViewClientModalOpen, setIsViewClientModalOpen] = useState(false);
  const [isViewGuarantorModalOpen, setIsViewGuarantorModalOpen] = useState(false);
  const [isViewInvestorModalOpen, setIsViewInvestorModalOpen] = useState(false);
  const { getPreview, previewData, isLoading: isScheduleLoading } = useSchedule();
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);
  const { getClientById } = useClient();

  const generateSchedulePreview = useCallback(async () => {
    if (!contractDate || !months || !paymentDue || totalSum <= 0) return;

    try {
      const previewParams = {
        creditDate: new Date(contractDate),
        termMonths: parseInt(months),
        paymentDay: parseInt(paymentDue),
        totalAmount: totalSum
      };

      await getPreview(previewParams);
    } catch (error) {
      console.error('Failed to generate schedule preview:', error);
    }
  }, [contractDate, months, paymentDue, totalSum, getPreview]);

  useEffect(() => {
    if (previewData) {
      const formattedSchedule = previewData.map((item, index) => {
        const remainingAmount = totalSum - previewData
          .slice(0, index)
          .reduce((sum, payment) => sum + payment.paymentAmount, 0);
          
        return {
          id: index + 1,
          date: new Date(item.paymentDate).toLocaleDateString('ru-RU'),
          remainingAmount: Math.max(0, remainingAmount),
          requiredPayment: item.paymentAmount,
          note: index === 0 ? 'Первый платёж' : ''
        };
      });
      setPaymentSchedule(formattedSchedule);
    }
  }, [previewData, totalSum]);

  useEffect(() => {
    if (contractDate && months && paymentDue && totalSum > 0) {
      generateSchedulePreview();
    }
  }, [contractDate, months, paymentDue, totalSum, generateSchedulePreview]);

  const formatAmount = useCallback((value: number): string => {
    return value.toLocaleString('ru-RU') + '₽';
  }, []);

  const parseAmount = useCallback((formatted: string): number => {
    return parseInt(formatted.replace(/[^\d]/g, '')) || 0;
  }, []);

  const handlePercentChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '' || /^\d*$/.test(value)) {
      setInitialPaymentPercent(value);
      
      if (value === '') {
        setInitialPaymentAmount('');
      } else if (totalSum > 0) {
        const percent = parseInt(value);
        if (!isNaN(percent)) {
          const amount = Math.round(totalSum * percent / 100);
          setInitialPaymentAmount(formatAmount(amount));
        }
      }
    }
  }, [totalSum, formatAmount]);

  const handleAmountChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (inputValue === '₽' || inputValue === '') {
      setInitialPaymentAmount('');
      setInitialPaymentPercent('');
      return;
    }
    
    const numericValue = parseAmount(inputValue);
    
    const formattedValue = formatAmount(numericValue);
    
    setInitialPaymentAmount(formattedValue);
    
    if (totalSum > 0 && numericValue > 0) {
      const percent = Math.round((numericValue / totalSum) * 100);
      setInitialPaymentPercent(percent.toString());
    } else {
      setInitialPaymentPercent('');
    }
  }, [totalSum, parseAmount, formatAmount]);

  useEffect(() => {
    if (totalSum === 0) {
      setInitialPaymentAmount('');
      setInitialPaymentPercent('');
    }
  }, [totalSum]);

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
                  onChange={handlePercentChange}
                  max={100}
                />
                <CustomInput 
                  inputType="rubles"
                  placeholder="Сумма" 
                  value={initialPaymentAmount}
                  onChange={handleAmountChange}
                  disabled={totalSum <= 0}
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
                  onChange={(e) => setMonths(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ flex: 1 }}
                  min="1"
                  max="60"
                />
                <CustomSelect
                  options={Array.from({ length: 31 }, (_, i) => ({
                    value: String(i + 1),
                    label: String(i + 1)
                  }))}
                  onChange={(e) => setPaymentDue(e.target.value)}
                  value={paymentDue}
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
                  disabled={!client || !contractDate || !investor || isScheduleLoading}
                >
                  {isScheduleLoading ? 'Загрузка...' : 'Создать договор'}
                </DarkCyanButton>
              </ButtonWrapper>
            </InputGroup>
          </PaymentScheduleInputs>
          <PaymentScheduleTable data={paymentSchedule} isLoading={isScheduleLoading} />
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
          birthdate: client.birthdate instanceof Date ? client.birthdate.toISOString() : client.birthdate,
          docIssueDate: client.docIssueDate instanceof Date ? client.docIssueDate.toISOString() : client.docIssueDate
        } : undefined}
      />

      <ClientModal
        mode="view"
        isOpen={isViewGuarantorModalOpen}
        onClose={() => setIsViewGuarantorModalOpen(false)}
        onSubmit={async () => false}
        initialData={guarantor ? {
          id: guarantor.id,
          fullName: guarantor.fullName,
          phone: guarantor.phone || '',
          doc: guarantor.doc || '',
          birthdate: guarantor.birthdate instanceof Date ? guarantor.birthdate.toISOString() : guarantor.birthdate,
          docIssueDate: guarantor.docIssueDate instanceof Date ? guarantor.docIssueDate.toISOString() : guarantor.docIssueDate
        } : undefined}
      />

      <InvestorModal
        mode="view"
        isOpen={isViewInvestorModalOpen}
        onClose={() => setIsViewInvestorModalOpen(false)}
        onSubmit={async () => false}
        initialData={investor ? {
          id: investor.id,
          nickname: investor.nickname,
          fullName: investor.fullName,
          phoneNumber: investor.phoneNumber,
          investorPie: investor.investorPie,
          investmentAmount: investor.investmentAmount,
          balance: investor.balance,
          isCompany: false
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