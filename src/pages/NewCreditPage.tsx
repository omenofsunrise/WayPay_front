import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useEffect, useState, type ChangeEvent, useCallback, useRef } from 'react';
import CustomTitle from '../components/ui/Text/CustomTitle';
import TitleField from '../components/ui/Layouts/TitleLayout';
import PageLayout from '../components/ui/Layouts/PageLayout';
import DarkCyanButton from '../components/ui/Buttons/DarkCyanButton';
import GrayButton from '../components/ui/Buttons/GrayButton';
import ModalInfoTitle from '../components/ui/Text/ModalInfoTitle';
import EntitySelectContainer from '../components/ui/Layouts/EntitySelectContainer';
import ClientSelectModal from '../components/modal/CrudInherited/ClientSelectModal';
import InvestorSelectModal from '../components/modal/CrudInherited/InvestorSelectModal';
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
import CustomCalendar from '../components/ui/fields/CustomCalendar';
import { useEmployee } from '../api/hooks/useEmployee';
import type { Investor } from '../api/types/investor';
import GuarantorModal, { type Guarantor } from '../components/modal/CrudInherited/GuarantorModal';
import type { GuarantorForm } from '../api/types/client';
import Checkbox from '../components/ui/CheckBoxes/Checkbox';
import type { EntityType } from '../api/types/objectType';
import ObjectTypeSelect from '../components/ui/fields/ObjectTypeSelect';
import { formatMoney } from '../utils/formatPrice';

const MARKUP_TYPE_STORAGE_KEY = 'credit_product_markup_type';
const NEXT_MONTH_START_STORAGE_KEY = 'credit_next_month_start';

interface Client {
  id: number;
  fullName: string;
  phone?: string;
  doc?: string;
  birthdate?: string | Date;
  docIssueDate?: string | Date;
  docIssueYear?: number; 
  registrationAddress?: string;
  secondPhone?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  markup: number;
  totalPrice: number;
}

interface SelectedObjectType {
  id: number;
  name: string;
  entityType: EntityType;
}

const NewCreditPage = () => {
  const navigate = useNavigate();
  const [contractDate, setContractDate] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [guarantor, setGuarantor] = useState<Guarantor | null>(null);
  const [guarantorClient, setGuarantorClient] = useState<Client | null>(null);
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [selectedPool, setSelectedPool] = useState<Investor | null>(null);
  const [modalType, setModalType] = useState<'client' | 'guarantor' | 'guarantorClient' | 'investor' | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isGuarantorModalOpen, setIsGuarantorModalOpen] = useState(false);
  const [isGuarantorClientModalOpen, setIsGuarantorClientModalOpen] = useState(false);
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalSum, setTotalSum] = useState(0);
  const [initialPaymentPercent, setInitialPaymentPercent] = useState<string>('');
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<string>('');
  const [months, setMonths] = useState<string>('');
  const [creditName, setCreditName] = useState<string>('');
  const [paymentDue, setPaymentDue] = useState<string>('1');
  const [isViewClientModalOpen, setIsViewClientModalOpen] = useState(false);
  const [isViewGuarantorModalOpen, setIsViewGuarantorModalOpen] = useState(false);
  const [isViewInvestorModalOpen, setIsViewInvestorModalOpen] = useState(false);
  const { getPreview, previewData, isLoading: isScheduleLoading } = useSchedule();
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);
  const { getClientById } = useClient();
  const { createCredit, isLoading: isCreditLoading, error } = useCredit();
  const { autoSelectInvestor } = useInvestor();
  const { authInfo } = useEmployee();
  const minSurcharge = authInfo?.employee.minSurcharge || 0;
  const [viewModalData, setViewModalData] = useState<Investor | null>(null);
  const [guarantorMenuOpen, setGuarantorMenuOpen] = useState(false);
  const guarantorMenuRef = useRef<HTMLDivElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [objectTypeName, setObjectTypeName] = useState<string>('');
  const [selectedObjectType, setSelectedObjectType] = useState<SelectedObjectType | null>(null);
  const [markupType, setMarkupType] = useState<'percent' | 'fixed'>(() => {
    const savedMarkupType = localStorage.getItem(MARKUP_TYPE_STORAGE_KEY);
    return (savedMarkupType === 'percent' || savedMarkupType === 'fixed') 
      ? savedMarkupType 
      : 'percent';
  });
  const [nextMonthStart, setNextMonthStart] = useState<boolean>(() => {
    const savedNextMonthStart = localStorage.getItem(NEXT_MONTH_START_STORAGE_KEY);
    return savedNextMonthStart === 'true';
  });

  const handleMarkupTypeChange = useCallback((type: 'percent' | 'fixed') => {
    setMarkupType(type);
    localStorage.setItem(MARKUP_TYPE_STORAGE_KEY, type);
  }, []);

  const handleNextMonthStartChange = useCallback((checked: boolean) => {
    setNextMonthStart(checked);
    localStorage.setItem(NEXT_MONTH_START_STORAGE_KEY, checked.toString());
  }, []);

  const parseAmount = useCallback((formatted: string): number => {
    return parseInt(formatted.replace(/[^\d]/g, '')) || 0;
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (guarantorMenuRef.current && !guarantorMenuRef.current.contains(event.target as Node)) {
        setGuarantorMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleObjectTypeSelect = useCallback((objectType: SelectedObjectType) => {
    setSelectedObjectType(objectType);
    setObjectTypeName(objectType.name);
  }, []);

  const handleObjectTypeNameChange = useCallback((value: string) => {
    setObjectTypeName(value);
    if (!value) {
      setSelectedObjectType(null);
    }
  }, []);

  const openGuarantorSelectionMenu = () => {
    setGuarantorMenuOpen(true);
  };

  const handleSelectExistingClient = () => {
    setGuarantorMenuOpen(false);
    openClientModal('guarantorClient');
  };

  const handleCreateNewGuarantor = () => {
    setGuarantorMenuOpen(false);
    openGuarantorModal();
  };

  const validateInvestorActivePeriod = useCallback((): boolean => {
  if (!contractDate || !months || parseInt(months) <= 0 || (!investor && !selectedPool)) {
    setValidationError(null);
    return true;
  }

  const selectedInvestor = investor || selectedPool;
  
  // Если у инвестора/пула нет даты окончания, пропускаем проверку
  if (!selectedInvestor?.activeUntil) {
    setValidationError(null);
    return true;
  }

  try {
    const contractDateObj = new Date(contractDate);
    
    if (isNaN(contractDateObj.getTime())) {
      setValidationError(null);
      return true;
    }

    const monthsValue = parseInt(months);
    
    if (isNaN(monthsValue) || monthsValue <= 0) {
      setValidationError(null);
      return true;
    }

    const lastPaymentDate = new Date(contractDateObj);
    lastPaymentDate.setMonth(lastPaymentDate.getMonth() + monthsValue);
    
    const paymentDay = parseInt(paymentDue);
    
    // Рассчитываем дату последнего платежа
    const tempDate = new Date(lastPaymentDate.getFullYear(), lastPaymentDate.getMonth(), paymentDay);
    
    // Если день платежа превышает количество дней в месяце, используем последний день месяца
    if (tempDate.getMonth() !== lastPaymentDate.getMonth()) {
      tempDate.setDate(0);
    }
    
    const investorActiveUntil = new Date(selectedInvestor.activeUntil);
    
    if (isNaN(investorActiveUntil.getTime())) {
      setValidationError(null);
      return true;
    }

    // Сравниваем даты
    if (investorActiveUntil < tempDate) {
      const entityType = investor ? 'инвестора' : 'пула';
      const errorMessage = `Договор с ${entityType} заканчивается (${investorActiveUntil.toLocaleDateString('ru-RU')}) \nраньше даты последнего платежа (${tempDate.toLocaleDateString('ru-RU')}).`;
      setValidationError(errorMessage);
      return false;
    }

    setValidationError(null);
    return true;
  } catch (error) {
    console.error('Ошибка при проверке дат:', error);
    setValidationError(null);
    return true;
  }
}, [contractDate, months, paymentDue, investor, selectedPool]);

  useEffect(() => {
    validateInvestorActivePeriod();
  }, [contractDate, months, paymentDue, investor, selectedPool, validateInvestorActivePeriod]);

  const handleViewInvestor = () => {
    if (investor || selectedPool) {
      setViewModalData(investor || selectedPool);
      setIsViewInvestorModalOpen(true);
    }
  };

  const handleCreateCredit = useCallback(async () => {   
    if (!client || !contractDate || (!investor && !selectedPool)) {
      return;
    }
    
    if (!validateInvestorActivePeriod()) {
      return;
    }

    if (guarantorClient && guarantorClient.id === client.id) {
      window.alert("Клиент не может быть одновременно и поручителем");
      return;
    }

    const creditData: CreateCreditRequest = {
      clientId: client.id,
      name: creditName,
      creditDate: new Date(contractDate),
      firstPayment: initialPaymentAmount ? parseAmount(initialPaymentAmount) : 0,
      termMonths: parseInt(months),
      paymentDay: parseInt(paymentDue),
      nextMonthStart: nextMonthStart,
      products: products
        .filter(product => product.name.trim() !== '' && product.price > 0)
        .map(product => ({
          name: product.name,
          price: product.price,
          ...(markupType === 'percent' 
            ? { surcharge: product.markup }
            : { surchargeAmount: product.markup }
          )
        })),
    };
    
    if (selectedObjectType && selectedObjectType.id) {
      creditData.creditTypeId = selectedObjectType.id;
    }
    
    if (guarantorClient) {
      creditData.GuarantorClientId = guarantorClient.id;
    } else if (guarantor) {
      creditData.guarantor = {
        fullName: guarantor.fullName,
        phone: guarantor.phone,
        birthdate: guarantor.birthdate ? new Date(guarantor.birthdate) : undefined,
        address: guarantor.address,
        doc: guarantor.doc
      };
    }
    
    if (selectedPool) {
      creditData.poolId = selectedPool.poolId || selectedPool.id;
    }

    if (investor) {
      creditData.investorId = investor.id;
    }

    const createdCredit = await createCredit(creditData);
    if (createdCredit) {
      navigate('/credits');
    } else {
      window.alert(`${error?.response?.data}`);
    }
  }, [
    client,
    contractDate,
    investor,
    selectedPool,
    guarantor,
    guarantorClient,
    initialPaymentAmount,
    months,
    paymentDue,
    nextMonthStart,
    products,
    parseAmount,
    createCredit,
    navigate,
    validateInvestorActivePeriod,
    markupType,
    error,
    selectedObjectType,
    creditName
  ]);

  const handleAutoSelectInvestor = async () => {
    if (totalSum <= 0 || !months || !contractDate) return;
    
    const initialPayment = initialPaymentAmount ? parseAmount(initialPaymentAmount) : 0;
    const amountToFinance = totalSum - initialPayment;
    
    if (amountToFinance <= 0) return;
    
    const contractDateObj = new Date(contractDate);
    const lastPaymentDate = new Date(contractDateObj);
    lastPaymentDate.setMonth(lastPaymentDate.getMonth() + parseInt(months));
    
    const paymentDay = parseInt(paymentDue);
    const tempDate = new Date(lastPaymentDate.getFullYear(), lastPaymentDate.getMonth(), paymentDay);
    
    if (tempDate.getMonth() !== lastPaymentDate.getMonth()) {
      tempDate.setDate(0);
    }
    
    const selectedInvestor = await autoSelectInvestor(amountToFinance, tempDate);
    if (selectedInvestor) {
      setInvestor({
        id: selectedInvestor.id,
        nickname: selectedInvestor.nickname,
        fullName: selectedInvestor.nickname,
        phoneNumber: '',
        investorPie: 0,
        investmentAmount: 0,
        balance: selectedInvestor.balance,
        activeUntil: selectedInvestor.activeUntil,
        isBlocked: false,
        isCompany: false
      });
      setSelectedPool(null);
      setValidationError(null);
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
    
    setTimeout(() => {
      validateInvestorActivePeriod();
    }, 0);
  }, [validateInvestorActivePeriod]);

  const generateSchedulePreview = useCallback(async () => {
    if (!contractDate || !months || !paymentDue || totalSum <= 0) return;

    try {
      const initialPayment = initialPaymentAmount ? parseAmount(initialPaymentAmount) : 0;
      const creditAmount = totalSum - initialPayment;

      const previewParams = {
        creditDate: new Date(contractDate),
        termMonths: parseInt(months),
        paymentDay: parseInt(paymentDue),
        totalAmount: creditAmount,
        nextMonthStart: nextMonthStart,
      };

      await getPreview(previewParams);
    } catch (error) {
      console.error('Failed to generate schedule preview:', error);
    }
  }, [contractDate, months, paymentDue, totalSum, initialPaymentAmount, nextMonthStart, parseAmount, getPreview]);

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
  }, [contractDate, months, paymentDue, totalSum, nextMonthStart, generateSchedulePreview]);

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
          setInitialPaymentAmount(formatMoney(amount.toString()));
        }
      }
    }
  }, [totalSum, formatMoney]);

  const openInvestorModal = () => {
    setModalType('investor');
    setIsInvestorModalOpen(true);
  };

  const handleAmountChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (inputValue === '₽' || inputValue === '') {
      setInitialPaymentAmount('');
      setInitialPaymentPercent('');
      return;
    }
    
    const numericValue = parseAmount(inputValue);
    
    const formattedValue = formatMoney(numericValue.toString());
    
    setInitialPaymentAmount(formattedValue);
    
    if (totalSum > 0 && numericValue > 0) {
      const percent = Math.round((numericValue / totalSum) * 100);
      setInitialPaymentPercent(percent.toString());
    } else {
      setInitialPaymentPercent('');
    }
  }, [totalSum, parseAmount, formatMoney]);

  useEffect(() => {
    if (totalSum === 0) {
      setInitialPaymentAmount('');
      setInitialPaymentPercent('');
    }
  }, [totalSum]);

  const handleSelectClient = (client: Client) => {
    if (modalType === 'client') {
      setClient(client);
    } else if (modalType === 'guarantorClient') {
      setGuarantorClient(client);
      setGuarantor(null);
    }
    setIsClientModalOpen(false);
    setIsGuarantorClientModalOpen(false);
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

  const handleViewGuarantor = () => {
    if (guarantor) {
      setIsViewGuarantorModalOpen(true);
    } else if (guarantorClient) {
      setClient(guarantorClient);
      setIsViewClientModalOpen(true);
    }
  };

  const hasEmptyProductNames = products.every(product => 
    product.name.trim() === ''
  );

  const isFormValid = 
    client && 
    contractDate && 
    (investor || selectedPool) && 
    !validationError &&
    !hasEmptyProductNames &&
    products.length > 0 &&
    products.some(product => product.name.trim() !== '' && product.price > 0);

  const handleSelectInvestor = (selectedEntity: { 
  id: number; 
  nickname?: string; 
  name?: string;
  fullName?: string; 
  phoneNumber?: string;
  investorPie?: number;
  pie?: number;
  investmentAmount?: number;
  balance?: number;
  type: 'investor' | 'pool';
  activeUntil?: string; // Добавьте это
}) => {
  if (selectedEntity.type === 'pool') {
    setSelectedPool({
      id: selectedEntity.id,
      nickname: selectedEntity.name || selectedEntity.nickname || '',
      fullName: selectedEntity.fullName || selectedEntity.name || '',
      phoneNumber: selectedEntity.phoneNumber || '',
      investorPie: selectedEntity.pie || 0,
      investmentAmount: selectedEntity.investmentAmount || 0,
      balance: selectedEntity.balance || 0,
      activeUntil: selectedEntity.activeUntil, // Добавьте это
      isPool: true
    });
    setInvestor(null);
  
  } else {
    setInvestor({
      id: selectedEntity.id,
      nickname: selectedEntity.nickname || '',
      fullName: selectedEntity.fullName || '',
      phoneNumber: selectedEntity.phoneNumber || '',
      investorPie: selectedEntity.investorPie || 0,
      investmentAmount: selectedEntity.investmentAmount || 0,
      balance: selectedEntity.balance || 0,
      activeUntil: selectedEntity.activeUntil, // Убедитесь что это есть
      isPool: false
    });
    setSelectedPool(null);
  }
  setIsInvestorModalOpen(false);
  setValidationError(null);
};

  const openClientModal = (type: 'client' | 'guarantorClient') => {
    setModalType(type);
    if (type === 'client') {
      setIsClientModalOpen(true);
    } else {
      setIsGuarantorClientModalOpen(true);
    }
  };

  const openGuarantorModal = () => {
    if (guarantor) {
      setModalType('guarantor');
      setIsGuarantorModalOpen(true);
    } else {
      setModalType('guarantor');
      setIsGuarantorModalOpen(true);
    }
  };

  const handleMonthsBlur = (value: string) => {
    const numericValue = Number(value) || 0;
    if (numericValue > 180) {
      setMonths('180');
    } else if (numericValue < 1) {
      setMonths('1');
    }
    
    setTimeout(() => {
      validateInvestorActivePeriod();
    }, 0);
  };

  const handleCreateGuarantor = async (guarantorData: Omit<GuarantorForm, 'doc'>): Promise<boolean> => {
    try {
      const newGuarantor: Guarantor = {
        id: Date.now(),
        fullName: guarantorData.fullName,
        phone: guarantorData.phone,
        doc: guarantorData.doc,
        birthdate: guarantorData.birthdate,
        address: guarantorData.address
      };
      
      setGuarantor(newGuarantor);
      setGuarantorClient(null);
      setIsGuarantorModalOpen(false);
      return true;
    } catch (error) {
      console.error('Ошибка при создании поручителя:', error);
      return false;
    }
  };

  const getSelectedEntityDisplayName = () => {
    if (investor) return investor.nickname;
    if (selectedPool) return selectedPool.nickname;
    return '';
  };

  const getSelectedEntityPhone = () => {
    if (investor) return investor.phoneNumber;
    if (selectedPool) return selectedPool.phoneNumber;
    return '';
  };

  const clearSelectedEntity = () => {
    setInvestor(null);
    setSelectedPool(null);
    setValidationError(null);
  };

  const getGuarantorDisplayInfo = () => {
    if (guarantorClient) {
      return {
        primaryValue: guarantorClient.fullName,
        secondaryValue: guarantorClient.phone,
        type: 'client'
      };
    } else if (guarantor) {
      return {
        primaryValue: guarantor.fullName,
        secondaryValue: guarantor.phone,
        type: 'custom'
      };
    }
    return {
      primaryValue: '',
      secondaryValue: '',
      type: null
    };
  };

  const clearGuarantor = () => {
    setGuarantor(null);
    setGuarantorClient(null);
  };

  const guarantorInfo = getGuarantorDisplayInfo();

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
              <CustomCalendar 
                value={contractDate} 
                onChange={handleContractDateChange}
              />
            </DateInputWrapper>
          </FieldGroup>
        
          <FieldGroup style={{ maxWidth: "365px", width: "100%" }}>
            <Label>Инвестор / Пул</Label>
            <EntitySelectWrapper>
                <EntitySelectContainer
                  mode="create"
                  primaryValue={getSelectedEntityDisplayName()}
                  secondaryValue={getSelectedEntityPhone()}
                  placeholder="Выберите инвестора или пул"
                  onSelect={openInvestorModal}
                  onClear={clearSelectedEntity}
                />
              {/* <ViewButton 
                onClick={handleViewInvestor} 
                disabled={!investor && !selectedPool} 
              />
              <AutoSelectButton onClick={handleAutoSelectInvestor} disabled={totalSum <= 0 || !months}>
                <svg width="23" height="7" viewBox="0 0 23 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.8429 0.462891C18.3527 0.462891 17.3131 1.80373 17.3131 3.72363C17.3131 5.58303 18.3218 6.87943 19.7664 6.87943C21.0257 6.87943 22.2962 5.86824 22.2962 3.61005C22.2962 1.72719 21.3085 0.462891 19.8429 0.462891ZM21.2899 3.64462C21.2899 4.76198 20.8245 5.96331 19.8083 5.96331C18.8391 5.96331 18.3267 4.82742 18.3267 3.70635C18.3267 2.54823 18.786 1.37901 19.8083 1.37901C20.7825 1.37901 21.2899 2.52478 21.2899 3.64462ZM11.8732 1.50248H13.8696V6.78313H15.0364V1.50248H17.0427V0.559194H11.8732V1.50248ZM10.2953 4.2175C10.2953 5.37561 9.81004 5.96331 8.85195 5.96331C7.96546 5.96331 7.47777 5.34598 7.47777 4.2175V0.559194H6.31225V4.20021C6.26092 4.54943 6.28907 4.90572 6.39458 5.24255C6.50009 5.57938 6.68025 5.88806 6.92164 6.14558C7.16302 6.40311 7.45941 6.60284 7.78871 6.7299C8.11801 6.85696 8.47175 6.90808 8.82355 6.87943C9.18497 6.91195 9.54909 6.86336 9.88934 6.73719C10.2296 6.61103 10.5374 6.41047 10.7902 6.15018C11.043 5.88988 11.2346 5.57641 11.3508 5.23265C11.467 4.88888 11.505 4.5235 11.462 4.16317V0.559194H10.2953V4.2175ZM3.65279 0.559194H2.41195L0.0722656 6.78313H1.2773L1.96006 4.91755H4.06887L4.77015 6.78313H6.00482L3.68982 0.656733L3.65279 0.559194ZM3.78242 4.02736H2.2428L2.81445 2.50255C2.87989 2.31735 2.93792 2.12228 3.00829 1.90498C3.06756 2.10005 3.13176 2.3013 3.21325 2.5149L3.78242 4.02736Z" fill="#50555C"/>
                </svg>
              </AutoSelectButton> */}
            </EntitySelectWrapper>
          </FieldGroup>
            {validationError && (
              <ValidationError>{validationError}</ValidationError>
            )}

          <FieldGroup style={{ maxWidth: "248px", width: "100%" }}>
            <Label>Имя договора (необязательно)</Label>
            <DateInputWrapper>
              <CustomInput 
                inputType="text"
                placeholder="Имя договора" 
                value={creditName}
                onChange={(e) => setCreditName(e.target.value)}
              />
            </DateInputWrapper>
          </FieldGroup>

          <FieldGroup style={{ maxWidth: "465px", width: "100%" }}>
            <Label>Тип договора (необязательно)</Label>
            <ObjectTypeSelect
              value={objectTypeName}
              onChange={handleObjectTypeNameChange}
              onObjectTypeSelect={handleObjectTypeSelect}
              placeholder="Выберите тип договора"
              entityType="credit"
            />
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
              {/* <ViewButton onClick={handleViewClient} disabled={!client} /> */}
            </EntitySelectWrapper>
          </FieldGroup>

          <FieldGroup style={{ maxWidth: "465px", width: "100%" }}>
          <Label>Поручитель (не обязательно)</Label>
          <EntitySelectWrapper>
            <EntitySelectContainer
              mode="create"
              primaryValue={guarantorInfo.primaryValue}
              secondaryValue={guarantorInfo.secondaryValue}
              placeholder="Выберите поручителя"
              onSelect={openGuarantorSelectionMenu}
              onClear={clearGuarantor}
              customIcon={
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 1.66675V20.3334M20.3333 11.0001L1.66663 11.0001" stroke="rgba(80, 85, 92, 1)" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              }
            />
            {/* <ViewButton 
              onClick={handleViewGuarantor} 
              disabled={!guarantor && !guarantorClient} 
            /> */}
          </EntitySelectWrapper>

          {/* Контекстное меню */}
          {guarantorMenuOpen && (
            <ContextMenu ref={guarantorMenuRef}>
              <ContextMenuItem onClick={handleSelectExistingClient}>
                <UserIcon>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="#50555C"/>
                    <path d="M8 9.5C4.96243 9.5 2.5 11.9624 2.5 15C2.5 15.2761 2.72386 15.5 3 15.5H13C13.2761 15.5 13.5 15.2761 13.5 15C13.5 11.9624 11.0376 9.5 8 9.5Z" fill="#50555C"/>
                  </svg>
                </UserIcon>
                Выбрать из существующих клиентов
              </ContextMenuItem>
              <ContextMenuItem onClick={handleCreateNewGuarantor}>
                <PlusIcon>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 1V15M1 8H15" stroke="#50555C" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </PlusIcon>
                Создать нового поручителя
              </ContextMenuItem>
            </ContextMenu>
          )}
        </FieldGroup>
      </FormRow>

        <ModalInfoTitle>
          Список товаров
          <MarkupTypeToggleContainer>
            <MarkupTypeToggle
              active={markupType === 'percent'}
              onClick={() => handleMarkupTypeChange('percent')}
            >
              %
            </MarkupTypeToggle>
            <MarkupTypeToggle
              active={markupType === 'fixed'}
              onClick={() => handleMarkupTypeChange('fixed')}
            >
              ₽
            </MarkupTypeToggle>
          </MarkupTypeToggleContainer>
        </ModalInfoTitle>

        <ProductsTableWrapper>
          <ProductsTable 
            products={products} 
            onProductsChange={setProducts}
            onTotalSumChange={setTotalSum}
            markupType={markupType}
            onMarkupTypeChange={setMarkupType}
          />
        </ProductsTableWrapper>
        <TotalSumContainer>
          Итого товаров на сумму: {formatMoney(totalSum.toString())} 
        </TotalSumContainer>

        <CheckboxContainer>
          <ModalInfoTitle style={{marginRight: '32px'}}>График выплат</ModalInfoTitle>
          <Checkbox 
            label='Начинать выплаты со следующего месяца'
            checked={nextMonthStart} 
            onChange={handleNextMonthStartChange} 
          />
        </CheckboxContainer>

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
                  onBlur={(e) => handleMonthsBlur(e.target.value)}
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
            <InputGroup style={{ margin: 0 }}>
              <ButtonWrapper style={{ margin: 5 }}>
                <GrayButton onClick={() => navigate(-1)}>
                  Отменить
                </GrayButton>
                  <DarkCyanButton 
                    style={{ marginRight: 'auto' }}
                    disabled={!isFormValid || isScheduleLoading || isCreditLoading}
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
      </ContentWrapper>

      <ClientSelectModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSubmit={handleSelectClient}
        title={modalType === 'client' ? 'Выбор покупателя' : 'Выбор поручителя из клиентов'}
      />

      <ClientSelectModal
        isOpen={isGuarantorClientModalOpen}
        onClose={() => setIsGuarantorClientModalOpen(false)}
        onSubmit={handleSelectClient}
        title="Выбор поручителя из клиентов"
      />

      <GuarantorModal
        mode={guarantor ? 'edit' : 'create'}
        isOpen={isGuarantorModalOpen}
        onClose={() => setIsGuarantorModalOpen(false)}
        onSubmit={handleCreateGuarantor}
        initialData={guarantor || undefined}
      />

      <InvestorSelectModal
        isOpen={isInvestorModalOpen}
        onClose={() => setIsInvestorModalOpen(false)}
        onSubmit={handleSelectInvestor}
        includePools={true}
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
          registrationAddress: client.registrationAddress,
          secondPhone: client.secondPhone || ''
        } : undefined}
      />

      <GuarantorModal
        mode="view"
        isOpen={isViewGuarantorModalOpen}
        onClose={() => setIsViewGuarantorModalOpen(false)}
        onSubmit={async () => false}
        initialData={guarantor || undefined}
      />

      <InvestorModal
        mode="view"
        isOpen={isViewInvestorModalOpen}
        onClose={() => {
          setIsViewInvestorModalOpen(false);
          setViewModalData(null);
        }}
        onSubmit={async () => false}
        initialData={viewModalData ? {
          id: viewModalData.id,
          nickname: viewModalData.nickname,
          fullName: viewModalData.fullName,
          phoneNumber: viewModalData.phoneNumber,
          investorPie: viewModalData.investorPie || 0,
          investmentAmount: viewModalData.investmentAmount || 0,
          balance: viewModalData.balance || 0,
          isCompany: false,
          isBlocked: false,
          activeUntil: viewModalData.activeUntil || new Date()
        } : undefined}
      />
    </PageLayout>
  );
};

const ContextMenu = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  min-width: 250px;
  
  position: fixed;
  top: ${350}px;
  left: ${1000}px;
  
  pointer-events: auto;
`;

const ContextMenuItem = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  text-align: left;
  gap: 12px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f7fafc;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #e2e8f0;
  }
`;

const UserIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`;

const PlusIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`;

const MarkupTypeToggleContainer = styled.div`
  display: flex;
  margin: 0 0 0 16px;
  align-items: center;
`;

const MarkupTypeToggle = styled.button<{ active: boolean }>`
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  background: ${props => props.active ? '#007d88' : 'white'};
  color: ${props => props.active ? 'white' : '#333'};
  cursor: pointer;
  font-size: 12px;
  margin: 0;
  
  &:first-child {
    border-radius: 4px 0 0 4px;
    border-right: none;
  }
  
  &:last-child {
    border-radius: 0 4px 4px 0;
  }
  
  &:hover {
    background: ${props => props.active ? '#007d88' : '#f7fafc'};
  }
  
  &:focus {
    outline: none;
  }
`;

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

const ValidationError = styled.div`
  color: #d32f2f;
  font-size: 12px;
  background-color: #ffebee;
  border-radius: 4px;
  border: 1px solid #ffcdd2;
  padding: 8px 12px;
  text-align: center;
  max-width: 300px;
  margin: 0 auto 0 0;
  box-sizing: border-box;
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

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

export default NewCreditPage;