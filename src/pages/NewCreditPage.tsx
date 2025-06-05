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
import ClientSelectModal from '../components/modal/CrudInherited/ClientSelectModal';
import InvestorSelectModal from '../components/modal/CrudInherited/InvestorSelectModal';
import view from '../assets/ui/credits/newCredit/view.svg';
import ProductsTable from '../components/ui/tables/ProductTable';
import PaymentScheduleTable, { type PaymentScheduleItem } from '../components/ui/tables/PaymentScheduleTable';
import CustomInput from '../components/ui/fields/CustomInput';
import ClientModal from '../components/modal/CrudInherited/ClientModal';
import InvestorModal from '../components/modal/CrudInherited/InvestorModal';
import useClient from '../api/hooks/useClient';
import CustomSelect from '../components/ui/fields/CustomSelect';
import useSchedule from '../api/hooks/useSchedule';
import useCredit from '../api/hooks/useCredit';
import type { CreateCreditRequest } from '../api/types/credit';
import useInvestor from '../api/hooks/useInvestor';
import ViewButton from '../components/ui/Buttons/ViewButton';

interface Client {
  id: number;
  fullName: string;
  phone?: string;
  doc?: string;
  birthdate?: string | Date;
  docIssueDate?: string | Date;
  docIssueYear?: number; 
  registrationAddress?: string;
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
  const { createCredit, isLoading: isCreditLoading } = useCredit();
  const { autoSelectInvestor } = useInvestor();
  
  const formatAmount = useCallback((value: number): string => {
    return value.toLocaleString('ru-RU') + '₽';
  }, []);

  const parseAmount = useCallback((formatted: string): number => {
    return parseInt(formatted.replace(/[^\d]/g, '')) || 0;
  }, []);

  const handleCreateCredit = useCallback(async () => {
    if (!client || !contractDate || !investor) return;

    const creditData: CreateCreditRequest = {
      clientId: client.id,
      investorId: investor.id,
      creditDate: new Date(contractDate),
      firstPayment: initialPaymentAmount ? parseAmount(initialPaymentAmount) : 0,
      termMonths: parseInt(months),
      paymentDay: parseInt(paymentDue),
      products: products
        .filter(product => product.name.trim() !== '' && product.price > 0)
        .map(product => ({
          name: product.name,
          price: product.price,
          surcharge: product.markup
        })),
      ...(guarantor && { guarantorId: guarantor.id })
    };

    const createdCredit = await createCredit(creditData);
    if (createdCredit) {
      navigate('/credits');
    }
  }, [
    client,
    contractDate,
    investor,
    guarantor,
    initialPaymentAmount,
    months,
    paymentDue,
    products,
    parseAmount,
    createCredit,
    navigate
  ]);

  const handleAutoSelectInvestor = async () => {
    if (totalSum <= 0) return;
    
    const initialPayment = initialPaymentAmount ? parseAmount(initialPaymentAmount) : 0;
    const amountToFinance = totalSum - initialPayment;
    
    if (amountToFinance <= 0) return;
    
    const selectedInvestor = await autoSelectInvestor(amountToFinance);
    if (selectedInvestor) {
      setInvestor({
        id: selectedInvestor.id,
        nickname: selectedInvestor.nickname,
        fullName: selectedInvestor.nickname,
        phoneNumber: '',
        investorPie: 0,
        investmentAmount: 0,
        balance: selectedInvestor.balance
      });
    }
  };

  const handleContractDateChange = useCallback((date: string | null) => {
    setContractDate(date);
    
    if (date) {
      const contractDateObj = new Date(date);
      const nextDay = new Date(contractDateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      
      setPaymentDue(nextDay.getDate().toString());
    }
  }, []);

  const generateSchedulePreview = useCallback(async () => {
    if (!contractDate || !months || !paymentDue || totalSum <= 0) return;

    try {
      const initialPayment = initialPaymentAmount ? parseAmount(initialPaymentAmount) : 0;
      const creditAmount = totalSum - initialPayment;

      const previewParams = {
        creditDate: new Date(contractDate),
        termMonths: parseInt(months),
        paymentDay: parseInt(paymentDue),
        totalAmount: creditAmount
      };

      await getPreview(previewParams);
    } catch (error) {
      console.error('Failed to generate schedule preview:', error);
    }
  }, [contractDate, months, paymentDue, totalSum, initialPaymentAmount, parseAmount, getPreview]);

  useEffect(() => {
    if (previewData) {
      const initialPayment = initialPaymentAmount ? parseAmount(initialPaymentAmount) : 0;
      const creditAmount = totalSum - initialPayment;
      
      const formattedSchedule = previewData.map((item, index) => {
        const remainingAmount = creditAmount - previewData
          .slice(0, index)
          .reduce((sum, payment) => sum + payment.paymentAmount, 0);
          
        return {
          id: index + 1,
          date: new Date(item.paymentDate).toLocaleDateString('ru-RU'),
          remainingAmount: Math.max(0, remainingAmount),
          requiredPayment: item.paymentAmount,
          comment: item.comment
        };
      });
      
      if (initialPayment > 0) {
        formattedSchedule.unshift({
          id: 0,
          date: new Date(contractDate!).toLocaleDateString('ru-RU'),
          remainingAmount: totalSum,
          requiredPayment: initialPayment,
          comment: 'Первоначальный взнос'
        });
      }
      
      setPaymentSchedule(formattedSchedule);
    }
  }, [previewData, totalSum, initialPaymentAmount, contractDate, parseAmount]);

  useEffect(() => {
    if (contractDate && months && paymentDue && totalSum > 0) {
      generateSchedulePreview();
    }
  }, [contractDate, months, paymentDue, totalSum, generateSchedulePreview]);

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
          <FieldGroup style={{ maxWidth: "248px", width: "100%" }}>
            <Label>Дата</Label>
            <DateInputWrapper>
              <DateInput 
                value={contractDate} 
                onChange={handleContractDateChange}
              />
            </DateInputWrapper>
          </FieldGroup>
        
          <FieldGroup style={{ maxWidth: "465px", width: "100%" }}>
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
              <ViewButton onClick={() => investor && setIsViewInvestorModalOpen(true)} disabled={!investor} />
              <AutoSelectButton onClick={handleAutoSelectInvestor} disabled={totalSum <= 0}>
                <svg width="23" height="7" viewBox="0 0 23 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.8429 0.462891C18.3527 0.462891 17.3131 1.80373 17.3131 3.72363C17.3131 5.58303 18.3218 6.87943 19.7664 6.87943C21.0257 6.87943 22.2962 5.86824 22.2962 3.61005C22.2962 1.72719 21.3085 0.462891 19.8429 0.462891ZM21.2899 3.64462C21.2899 4.76198 20.8245 5.96331 19.8083 5.96331C18.8391 5.96331 18.3267 4.82742 18.3267 3.70635C18.3267 2.54823 18.786 1.37901 19.8083 1.37901C20.7825 1.37901 21.2899 2.52478 21.2899 3.64462ZM11.8732 1.50248H13.8696V6.78313H15.0364V1.50248H17.0427V0.559194H11.8732V1.50248ZM10.2953 4.2175C10.2953 5.37561 9.81004 5.96331 8.85195 5.96331C7.96546 5.96331 7.47777 5.34598 7.47777 4.2175V0.559194H6.31225V4.20021C6.26092 4.54943 6.28907 4.90572 6.39458 5.24255C6.50009 5.57938 6.68025 5.88806 6.92164 6.14558C7.16302 6.40311 7.45941 6.60284 7.78871 6.7299C8.11801 6.85696 8.47175 6.90808 8.82355 6.87943C9.18497 6.91195 9.54909 6.86336 9.88934 6.73719C10.2296 6.61103 10.5374 6.41047 10.7902 6.15018C11.043 5.88988 11.2346 5.57641 11.3508 5.23265C11.467 4.88888 11.505 4.5235 11.462 4.16317V0.559194H10.2953V4.2175ZM3.65279 0.559194H2.41195L0.0722656 6.78313H1.2773L1.96006 4.91755H4.06887L4.77015 6.78313H6.00482L3.68982 0.656733L3.65279 0.559194ZM3.78242 4.02736H2.2428L2.81445 2.50255C2.87989 2.31735 2.93792 2.12228 3.00829 1.90498C3.06756 2.10005 3.13176 2.3013 3.21325 2.5149L3.78242 4.02736Z" fill="#50555C"/>
                </svg>
              </AutoSelectButton>
            </EntitySelectWrapper>
          </FieldGroup>
        </FormRow>

        <ModalInfoTitle>Сведения о покупателе</ModalInfoTitle>
        <FormRow>
          <FieldGroup style={{ maxWidth: "465px", width: "100%" }}>
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
              <ViewButton onClick={handleViewClient} disabled={!client} />
            </EntitySelectWrapper>
          </FieldGroup>

          <FieldGroup style={{ maxWidth: "465px", width: "100%" }}>
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
              <ViewButton onClick={handleViewGuarantor} disabled={!guarantor} />
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
              <InputRow>
                <InputLabel style={{ flex: 1 }}>Первоначальный взнос, %</InputLabel>
                <InputLabel1 style={{ flex: 1 }}>Сумма</InputLabel1>
              </InputRow>
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
              <InputRow>
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
                  disabled={!client || !contractDate || !investor || isScheduleLoading || isCreditLoading}
                  onClick={handleCreateCredit}
                >
                  {isScheduleLoading || isCreditLoading ? 'Загрузка...' : 'Создать договор'}
                </DarkCyanButton>
              </ButtonWrapper>
            </InputGroup>
          </PaymentScheduleInputs>
          <PaymentScheduleTableWrapper>
            <PaymentScheduleTable data={paymentSchedule} isLoading={isScheduleLoading} />
          </PaymentScheduleTableWrapper>
        </PaymentScheduleContainer>
        <CustomInput 
        inputType="rubles"/>
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
          docIssueDate: client.docIssueDate instanceof Date ? client.docIssueDate.toISOString() : client.docIssueDate,
          docIssueYear: client.docIssueYear,
          registrationAddress: client.registrationAddress
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
          docIssueDate: guarantor.docIssueDate instanceof Date ? guarantor.docIssueDate.toISOString() : guarantor.docIssueDate,
          docIssueYear: guarantor.docIssueYear,
          registrationAddress: guarantor.registrationAddress
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
  overflow-x: auto;
`;

const EntitySelectWrapper = styled.div`
  width: 100%;
  max-width: 465px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DateInputWrapper = styled.div`
  width: 100%;
  max-width: 248px;
`;

const FormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
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
  flex-direction: column;
  gap: 12px;

  @media (min-width: 576px) {
    flex-direction: row;
    align-items: center;
  }
`;

const TotalSumContainer = styled.div`
  text-align: left;
  font-weight: 500;
  color: black;
  margin-top: 10px;
  font-size: 14px;

  @media (min-width: 576px) {
    font-size: 16px;
  }
`;

const PaymentScheduleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (min-width: 992px) {
    flex-direction: row;
  }
`;

const PaymentScheduleInputs = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;

  @media (min-width: 992px) {
    width: 300px;
    min-width: 300px;
  }
`;

const PaymentScheduleTableWrapper = styled.div`
  flex: 1;
  overflow-x: auto;
  width: 100%;
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
  flex-direction: column;
  gap: 10px;
  margin-bottom: 0;
  padding-bottom: 0;
  width: 100%;

  @media (min-width: 576px) {
    flex-direction: row;
    width: 100%;
    max-width: 440px;
  }
`;

const AutoSelectButton = styled.button`
  padding: 0;
  margin-left: 10px;
  cursor: pointer;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.disabled ? 0.5 : 1};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  outline: none;
  
  &:hover:not(:disabled) {
    opacity: 0.8;
  }
  
  &:focus {
    outline: none;
  }

  svg {
    width: 23px;
    height: 7px;
  }
`;

export default NewCreditPage;