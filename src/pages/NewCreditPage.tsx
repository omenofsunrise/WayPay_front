import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
import useSchedule from '../api/hooks/useSchedule';
import useCredit from '../api/hooks/useCredit';
import type { CreateCreditRequest, UpdateCreditRequest } from '../api/types/credit';
import CustomCalendar from '../components/ui/fields/CustomCalendar';
import type { Investor } from '../api/types/investor';
import { type Guarantor } from '../components/modal/CrudInherited/GuarantorModal';
import Checkbox from '../components/ui/CheckBoxes/Checkbox';
import type { EntityType } from '../api/types/objectType';
import ObjectTypeSelect from '../components/ui/fields/ObjectTypeSelect';
import { formatMoney } from '../utils/formatPrice';
import DateModalInput from '../components/ui/fields/DateModalInput';

const MARKUP_TYPE_STORAGE_KEY = 'credit_product_markup_type';
const TURN_OF_ROUNDING_KEY = 'turn_of_rounding';
const NEXT_MONTH_START_STORAGE_KEY = 'credit_next_month_start';
const IN_DEBT_STORAGE_KEY = 'credit_in_debt';
const CREDIT_DRAFT_STORAGE_KEY = 'credit_draft';

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
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const location = useLocation();
  const [contractDate, setContractDate] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [guarantor, setGuarantor] = useState<Guarantor | null>(null);
  const [guarantorClient, setGuarantorClient] = useState<Client | null>(null);
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [selectedPool, setSelectedPool] = useState<Investor | null>(null);
  const [modalType, setModalType] = useState<'client' | 'guarantorClient' | 'investor' | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isGuarantorClientModalOpen, setIsGuarantorClientModalOpen] = useState(false);
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  let isMounted = true;
  const [totalSum, setTotalSum] = useState(0);
  const [initialPaymentPercent, setInitialPaymentPercent] = useState<string>('');
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<string>('');
  const [months, setMonths] = useState<string>('');
  const [creditName, setCreditName] = useState<string>('');
  const [turnOfRounding, setTurnOfRounding] = useState<boolean>(() => {
    const savedturnOfRounding = localStorage.getItem(TURN_OF_ROUNDING_KEY);
    return savedturnOfRounding === 'true';
  });
  const [debtComment, setDebtComment] = useState<string>('');
  const [paymentDue, setPaymentDue] = useState<string>('1');
  const [startPaymentDate, setStartPaymentDate] = useState<string | null>(null);
  const { getPreview, previewData, isLoading: isScheduleLoading } = useSchedule();
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);
  const { createCredit, updateCredit, getCreateCreditRequest, isLoading: isCreditLoading } = useCredit();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [objectTypeName, setObjectTypeName] = useState<string>('');
  const [tabTypeName, setTabTypeName] = useState<string>('');
  const [selectedObjectType, setSelectedObjectType] = useState<SelectedObjectType | null>(null);
  const [selectedTabType, setSelectedTabType] = useState<SelectedObjectType | null>(null);
  const [editMarkupType, setEditMarkupType] = useState<'percent' | 'fixed'>('percent');
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
  const [inDebt, setInDebt] = useState<boolean>(() => {
    const savedInDebt = localStorage.getItem(IN_DEBT_STORAGE_KEY);
    return savedInDebt === 'true';
  });
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const creditApplicationData = location.state?.creditApplication;

  // Загрузка черновика при первой инициализации
  useEffect(() => {
    if (isDraftLoaded) return;
    const draftRaw = localStorage.getItem(CREDIT_DRAFT_STORAGE_KEY);
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        setContractDate(draft.contractDate ?? null);
        setClient(draft.client ?? null);
        setGuarantor(draft.guarantor ?? null);
        setGuarantorClient(draft.guarantorClient ?? null);
        setInvestor(draft.investor ?? null);
        setSelectedPool(draft.selectedPool ?? null);
        setProducts(draft.products ?? []);
        setTotalSum(draft.totalSum ?? 0);
        setInitialPaymentPercent(draft.initialPaymentPercent ?? '');
        setInitialPaymentAmount(draft.initialPaymentAmount ?? '');
        setMonths(draft.months ?? '');
        setCreditName(draft.creditName ?? '');
        setStartPaymentDate(draft.startPaymentDate ?? null);
        setDebtComment(draft.debtComment ?? '');
        setPaymentDue(draft.paymentDue ?? '1');
        setNextMonthStart(draft.nextMonthStart ?? false);
        setInDebt(draft.inDebt ?? false);
        setObjectTypeName(draft.objectTypeName ?? '');
        setTabTypeName(draft.tabTypeName ?? '');
        setSelectedObjectType(draft.selectedObjectType ?? null);
        setSelectedTabType(draft.selectedTabType ?? null);
        setPaymentSchedule(draft.paymentSchedule ?? []);
        setHasDraft(true);
        setIsDraftLoaded(true);
      } catch (e) {
        console.error('Failed to load draft', e);
        setIsDraftLoaded(true);
      }
    } else {
      setIsDraftLoaded(true);
    }
  }, [isDraftLoaded]);

useEffect(() => {
  const loadCreditData = async () => {
    if (!isEditMode || !id) return;

    try {
      const creditData = await getCreateCreditRequest(parseInt(id));
      if (!isMounted) return;

      if (creditData) {
        // Логируем полученные данные
        console.log('Received credit data:', creditData);
        console.log('Products:', creditData.products);
        
        // Проверяем первый продукт
        if (creditData.products && creditData.products[0]) {
          const firstProduct = creditData.products[0];
          console.log('First product:', {
            surcharge: firstProduct.surcharge,
            surchargeAmount: firstProduct.surchargeAmount,
            price: firstProduct.price
          });
        }
        
        setCreditName(creditData.name || '');
        setContractDate(creditData.creditDate ? new Date(creditData.creditDate).toISOString().split('T')[0] : null);
        setTurnOfRounding(creditData.turnOfRounding);
        
        setStartPaymentDate(creditData.startPaymentDay ? new Date(creditData.startPaymentDay).toISOString().split('T')[0] : null);
        
        if (creditData.startPaymentDay && creditData.startPaymentDay.toString() === '0001-01-01T00:00:00') {
          console.log("alert)");
          window.alert('Внимание: Начало выплат у старых договоров нужно ввести заново для редактирования!');
        }
        
        setInDebt(creditData.inDebt || false);
        setDebtComment(creditData.debtComment);

        // Determine markup type from the first product
        const firstProduct = creditData.products && creditData.products[0];
        let determinedMarkupType: 'percent' | 'fixed' = 'percent';
        
        if (firstProduct) {
          if (firstProduct.surchargeAmount !== undefined && firstProduct.surchargeAmount !== null) {
            determinedMarkupType = 'fixed';
            console.log('Markup type determined as FIXED, surchargeAmount:', firstProduct.surchargeAmount);
          } else if (firstProduct.surcharge !== undefined && firstProduct.surcharge !== null) {
            determinedMarkupType = 'percent';
            console.log('Markup type determined as PERCENT, surcharge:', firstProduct.surcharge);
          }
        }
        
        // Set markup type states
        setMarkupType(determinedMarkupType);
        setEditMarkupType(determinedMarkupType);
        
        setClient({
          id: creditData.clientId,
          fullName: creditData.clientFullname,
          phone: creditData.clientId.toString() || ''
        });
        
        if (!creditData.inDebt) {
          if (creditData.investorId) {
            setInvestor({
              id: creditData.investorId,
              nickname: creditData.investorNickname || '',
              fullName: creditData.investorId.toString() || '',
              phoneNumber: creditData.investorId.toString() || '',
              investorPie: creditData.investorId || 0,
              investmentAmount: creditData.investorId || 0,
              balance: creditData.investorId || 0,
              activeUntil: creditData.investorActiveUntil,
              isPool: false
            });
          } else if (creditData.poolId) {
            setSelectedPool({
              id: creditData.poolId,
              nickname: creditData.investorNickname || '',
              fullName: creditData.poolId.toString() || '',
              phoneNumber: creditData.poolId.toString() || '',
              investorPie: creditData.poolId || 0,
              investmentAmount: creditData.poolId || 0,
              balance: creditData.poolId.toString() || 0,
              activeUntil: creditData.investorActiveUntil,
              isPool: true
            });
          }
        }
        
        if (creditData.guarantorClientId) {
          setGuarantorClient({
            id: creditData.guarantorClientId,
            fullName: creditData.guarantorFullname,
          });
        } else if (creditData.guarantor) {
          setGuarantor({
            id: null,
            fullName: creditData.guarantor.fullName,
            phone: creditData.guarantor.phone || '',
            doc: creditData.guarantor.doc || '',
            birthdate: creditData.guarantor.birthdate,
            address: creditData.guarantor.address || ''
          });
        }
        
        if (creditData.creditTypeId) {
          setSelectedObjectType({
            id: creditData.creditTypeId,
            name: creditData.creditTypeName,
            entityType: 'credit'
          });
          setObjectTypeName(creditData.creditTypeName);
        }
        
        // Format products using the determined markup type
        const formattedProducts = creditData.products.map((product, index) => {
          let markup = 0;
          let totalPrice = product.price;
          
          console.log(`Processing product ${index}:`, {
            name: product.name,
            price: product.price,
            surcharge: product.surcharge,
            surchargeAmount: product.surchargeAmount,
            determinedMarkupType
          });
          
          if (determinedMarkupType === 'percent') {
            // For percent markup
            markup = product.surcharge || 0;
            totalPrice = product.price * (1 + (product.surcharge || 0) / 100);
            console.log(`Percent markup: ${markup}% = ${totalPrice} total`);
          } else {
            // For fixed amount markup
            markup = product.surchargeAmount || 0;
            totalPrice = product.price + (product.surchargeAmount || 0);
            console.log(`Fixed markup: ${markup} ₽ = ${totalPrice} total`);
          }
          
          return {
            id: index + 1,
            name: product.name,
            price: product.price,
            quantity: 1,
            markup: markup,
            totalPrice: totalPrice
          };
        });
        
        console.log('Formatted products:', formattedProducts);
        setProducts(formattedProducts);
        
        const newTotalSum = formattedProducts.reduce((sum, product) => sum + product.totalPrice, 0);
        setTotalSum(newTotalSum);
        
        if (creditData.firstPayment !== undefined && creditData.firstPayment !== null) {
          const firstPayment = Number(creditData.firstPayment);
          if (!isNaN(firstPayment)) {
            const formattedAmount = formatMoney(firstPayment.toString());
            setInitialPaymentAmount(formattedAmount);
            
            if (newTotalSum > 0) {
              const percent = Math.round((firstPayment / newTotalSum) * 100);
              setInitialPaymentPercent(percent.toString());
            }
          }
        }
        
        if (creditData.termMonths) {
          setMonths(creditData.termMonths.toString());
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных кредита:', error);
      window.alert('Не удалось загрузить данные кредита');
    }
  };

  loadCreditData();
}, [id]);

  useEffect(() => {
    if (creditApplicationData) {
      if (creditApplicationData.clientId) {
        setClient({
          id: creditApplicationData.clientId,
          fullName: creditApplicationData.clientName,
          phone: creditApplicationData.clientPhone || ''
        });
      }

    const today = new Date().toISOString().split('T')[0];
    setContractDate(today);

      if (creditApplicationData.productName && creditApplicationData.productPrice) {
        setProducts([{
          id: Date.now(),
          name: creditApplicationData.productName,
          price: creditApplicationData.productPrice,
          quantity: 1,
          markup: creditApplicationData.percent * 100,
          totalPrice: creditApplicationData.productPrice * (1 + creditApplicationData.percent)
        }]);
        setTotalSum(creditApplicationData.productPrice * (1 + creditApplicationData.percent));
      }

      if (creditApplicationData.termMonths) {
        setMonths(creditApplicationData.termMonths.toString());
      }

      if (creditApplicationData.firstPayment !== undefined && creditApplicationData.firstPayment !== null) {
        const firstPayment = Number(creditApplicationData.firstPayment);
        if (!isNaN(firstPayment)) {
          const formattedAmount = formatMoney(firstPayment.toString());
          setInitialPaymentAmount(formattedAmount);
          handleAmountChange(null, formattedAmount);
          
          if (totalSum > 0) {
            const percent = Math.round((firstPayment / totalSum) * 100);
            setInitialPaymentPercent(percent.toString());
          }
        }
      }

    }
  }, [creditApplicationData]);

  useEffect(() => {
    console.log(startPaymentDate);
  }, [startPaymentDate]);

  // Сохранение черновика
  useEffect(() => {
    if (!isDraftLoaded || isEditMode) return;
    const draft = {
      contractDate,
      client,
      guarantor,
      guarantorClient,
      investor,
      selectedPool,
      products,
      totalSum,
      initialPaymentPercent,
      initialPaymentAmount,
      months,
      creditName,
      debtComment,
      paymentDue,
      nextMonthStart,
      inDebt,
      objectTypeName,
      tabTypeName,
      selectedObjectType,
      selectedTabType,
      paymentSchedule,
      turnOfRounding,
      startPaymentDate
    };
    try {
      localStorage.setItem(CREDIT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setHasDraft(true);
    } catch (e) {
      console.error('Failed to save draft', e);
    }
  }, [
    isDraftLoaded,
    isEditMode,
    contractDate,
    client,
    guarantor,
    guarantorClient,
    investor,
    selectedPool,
    startPaymentDate,
    products,
    totalSum,
    initialPaymentPercent,
    initialPaymentAmount,
    months,
    creditName,
    debtComment,
    paymentDue,
    nextMonthStart,
    turnOfRounding,
    inDebt,
    objectTypeName,
    tabTypeName,
    selectedObjectType,
    selectedTabType,
    paymentSchedule
  ]);

  const handleMarkupTypeChange = useCallback((type: 'percent' | 'fixed') => {
    setMarkupType(type);
    localStorage.setItem(MARKUP_TYPE_STORAGE_KEY, type);
  }, []);

  const handleTurnOfRoundingChange = useCallback((checked: boolean) => {
    setTurnOfRounding(checked);
    localStorage.setItem(TURN_OF_ROUNDING_KEY, checked.toString());
  }, []);

  const parseAmount = useCallback((formatted: string): number => {
    return parseInt(formatted.replace(/[^\d]/g, '')) || 0;
  }, []);

  const resetDraft = useCallback(() => {
    localStorage.removeItem(CREDIT_DRAFT_STORAGE_KEY);
    setHasDraft(false);
    setContractDate(null);
    setClient(null);
    setGuarantor(null);
    setGuarantorClient(null);
    setInvestor(null);
    setSelectedPool(null);
    setProducts([{
      id: Date.now(),
      name: ``,
      price: 0,
      quantity: 1,
      markup: 0,
      totalPrice: 0
    }]);
    setTotalSum(0);
    setInitialPaymentPercent('');
    setInitialPaymentAmount('');
    setMonths('');
    setCreditName('');
    setDebtComment('');
    setPaymentDue('1');
    setInDebt(false);
    setObjectTypeName('');
    setTabTypeName('');
    setSelectedObjectType(null);
    setSelectedTabType(null);
    setPaymentSchedule([]);
    setStartPaymentDate(null);
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

  const handleInDebtChange = useCallback((checked: boolean) => {
    setInDebt(checked);
    localStorage.setItem(IN_DEBT_STORAGE_KEY, checked.toString());
    
    if (checked) {
      setInvestor(null);
      setSelectedPool(null);
      setValidationError(null);
    }
  }, []);

const validateInvestorActivePeriod = useCallback((): boolean => {
  if (inDebt) {
    setValidationError(null);
    return true;
  }

  if (!contractDate || !months || parseInt(months) <= 0 || (!investor && !selectedPool)) {
    setValidationError(null);
    return true;
  }

  const selectedInvestor = investor || selectedPool;

  if (selectedPool || (investor && investor.isCompany)) {
    setValidationError(null);
    return true;
  }

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
    
    const tempDate = new Date(lastPaymentDate.getFullYear(), lastPaymentDate.getMonth(), paymentDay);
    
    if (tempDate.getMonth() !== lastPaymentDate.getMonth()) {
      tempDate.setDate(0);
    }
    
    const investorActiveUntil = new Date(selectedInvestor.activeUntil);
    
    if (isNaN(investorActiveUntil.getTime())) {
      setValidationError(null);
      return true;
    }

    if (!selectedInvestor.isCompany && investorActiveUntil < tempDate) {
      const errorMessage = `Договор с инвестором заканчивается (${investorActiveUntil.toLocaleDateString('ru-RU')}) \nраньше даты последнего платежа (${tempDate.toLocaleDateString('ru-RU')}).`;
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
}, [contractDate, months, paymentDue, investor, selectedPool, inDebt]);

  useEffect(() => {
    validateInvestorActivePeriod();
  }, [contractDate, months, paymentDue, investor, selectedPool, validateInvestorActivePeriod, inDebt]);


  const handleCreateOrUpdateCredit = useCallback(async () => {   
    if (!client || !contractDate || (!inDebt && !investor && !selectedPool)) {
      return;
    }
    
    if (!validateInvestorActivePeriod()) {
      return;
    }

    if (guarantorClient && guarantorClient.id === client.id) {
      window.alert("Клиент не может быть одновременно и поручителем");
      return;
    }

    const creditData: CreateCreditRequest | UpdateCreditRequest = {
      clientId: client.id,
      name: creditName,
      debtComment: debtComment,
      creditDate: new Date(contractDate),
      firstPayment: initialPaymentAmount ? parseAmount(initialPaymentAmount) : 0,
      termMonths: parseInt(months),
      startPaymentDay: new Date(startPaymentDate),
      turnOfRounding: turnOfRounding,
      inDebt: inDebt,
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
      creditTypeId: null,
      GuarantorClientId: null
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
    
    if (!inDebt) {
      if (selectedPool) {
        creditData.poolId = selectedPool.poolId || selectedPool.id;
      }

      if (investor) {
        creditData.investorId = investor.id;
      }
    }

    setSubmitError(null);

    try {
      let createdCredit;

      if (isEditMode && id) {
        const updateData = {
          ...creditData,
          id: parseInt(id)
        } as UpdateCreditRequest;

        createdCredit = await updateCredit(updateData);
      } else {
        createdCredit = await createCredit(creditData as CreateCreditRequest);
      }

      if (createdCredit) {
        localStorage.removeItem(CREDIT_DRAFT_STORAGE_KEY);
        setHasDraft(false);
        navigate('/credits');
      }
    } catch (err) {
      const responseData = (err as any)?.response?.data;
      const errorMessage =
        typeof responseData === 'string' ? responseData :
        responseData?.message ? responseData.message :
        (err as any)?.message || 'Не удалось сохранить договор. Попробуйте ещё раз.';
      setSubmitError(errorMessage);
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
    startPaymentDate,
    paymentDue,
    nextMonthStart,
    turnOfRounding,
    products,
    parseAmount,
    createCredit,
    updateCredit,
    navigate,
    validateInvestorActivePeriod,
    markupType,
    selectedObjectType,
    creditName,
    isEditMode,
    id,
    inDebt
  ]);

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
        termMonths: parseInt(months),
        totalAmount: creditAmount,
        turnOfRounding: turnOfRounding,
        startDate: new Date(startPaymentDate)
      };

      await getPreview(previewParams);
    } catch (error) {
      console.error('[PaymentSchedule] ❌ Ошибка при генерации превью:', error);
    }
  }, [contractDate, months, startPaymentDate, paymentDue, totalSum, initialPaymentAmount, parseAmount, getPreview, turnOfRounding]);

  useEffect(() => {
    if (previewData) {
      const initialPayment = initialPaymentAmount ? parseAmount(initialPaymentAmount) : 0;
      const creditAmount = totalSum - initialPayment;
      
      const formattedSchedule = previewData.map((item, index) => {
        const previousPayments = previewData
          .slice(0, index)
          .reduce((sum, payment) => sum + payment.paymentAmount, 0);
        const remainingAmount = creditAmount - previousPayments;
        
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
    } else {
      if (paymentSchedule.length > 0) {
        setPaymentSchedule([]);
      }
    }
  }, [contractDate, months, paymentDue, totalSum, nextMonthStart, turnOfRounding, generateSchedulePreview]);

  const handlePercentChange = useCallback((e?: ChangeEvent<HTMLInputElement>, value?: string) => {
    if (e != null)
      value = e.target.value;
    
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

  const handleAmountChange = useCallback((e?: ChangeEvent<HTMLInputElement>, inputValue?: string) => {
    if (e != null)
      inputValue = e.target.value;
    
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

  const hasEmptyProductNames = products.every(product => 
    product.name.trim() === ''
  );

  const isFormValid = 
    client && 
    contractDate && 
    startPaymentDate &&
    (inDebt || investor || selectedPool) && 
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
    activeUntil?: string;
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
        activeUntil: selectedEntity.activeUntil,
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
        activeUntil: selectedEntity.activeUntil,
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
        <CustomTitle>{isEditMode ? 'Редактирование договора' : 'Новый договор'}</CustomTitle>
        <DarkCyanButton onClick={resetDraft}>Сбросить черновик</DarkCyanButton>
      </TitleField>

      <ContentWrapper>
        <CheckboxContainer>
          <ModalInfoTitle>Основная информация</ModalInfoTitle>
          <Checkbox 
            label='Договор в долг'
            checked={inDebt} 
            onChange={handleInDebtChange} 
          />
        </CheckboxContainer>
        
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

            {!inDebt ? (
              <>
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
                </EntitySelectWrapper>
                </FieldGroup>
              </>
            ):
            <>
              <FieldGroup style={{ maxWidth: "365px", width: "100%" }}>

                <Label>Комментарий к долгу</Label>
                <EntitySelectWrapper>
                  <CustomInput
                    placeholder="Кем выдан долг"
                    value={debtComment}
                    onChange={(e) => setDebtComment(e.target.value)}
                  />
                </EntitySelectWrapper>
              </FieldGroup>
            </>}
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

          <FieldGroup style={{ maxWidth: "265px", width: "100%" }}>
            <Label>Папка (необязательно)</Label>
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
              onSelect={() => openClientModal('guarantorClient')}
              onClear={clearGuarantor}
              customIcon={
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 1.66675V20.3334M20.3333 11.0001L1.66663 11.0001" stroke="rgba(80, 85, 92, 1)" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              }
            />
          </EntitySelectWrapper>
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
          <Checkbox 
            label='Отключить округление'
            checked={turnOfRounding} 
            onChange={handleTurnOfRoundingChange} 
          />
        </TotalSumContainer>

        <CheckboxContainer>
          <ModalInfoTitle style={{marginRight: '32px'}}>График выплат</ModalInfoTitle>
        </CheckboxContainer>

        <PaymentScheduleContainer>
          <PaymentScheduleInputs>
            <InputGroup>
              <InputRow>
                <InputLabel style={{ flex: 1 }}>Первоначальный взнос, %</InputLabel>
                <InputLabel style={{ flex: 1 }}>Сумма</InputLabel>
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
                <InputLabel style={{ flex: 1 }}>Начало выплат</InputLabel>
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
                <DateModalInput
                  onChange={(e) => setStartPaymentDate(e)}
                  value={startPaymentDate}
                />
              </InputRow>
            </InputGroup>
            <InputGroup style={{ margin: 0 }}>
            {submitError && (
              <SubmitErrorBanner role="alert" aria-live="assertive">
                <SubmitErrorIcon aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 1.667a8.333 8.333 0 1 0 0 16.666 8.333 8.333 0 0 0 0-16.666Zm0 4.166a.833.833 0 0 1 .833.834v3.333a.833.833 0 1 1-1.666 0V6.667A.833.833 0 0 1 10 5.833Zm0 8.334a1.042 1.042 0 1 1 0-2.084 1.042 1.042 0 0 1 0 2.084Z" fill="currentColor"/>
                  </svg>
                </SubmitErrorIcon>
                <SubmitErrorContent>
                  <SubmitErrorTitle>
                    {isEditMode ? 'Не удалось сохранить изменения' : 'Не удалось создать договор'}
                  </SubmitErrorTitle>
                  <SubmitErrorMessage>{submitError}</SubmitErrorMessage>
                </SubmitErrorContent>
                <SubmitErrorClose
                  type="button"
                  onClick={() => setSubmitError(null)}
                  aria-label="Закрыть сообщение об ошибке"
                >
                  ×
                </SubmitErrorClose>
              </SubmitErrorBanner>
            )}
            <ButtonWrapper style={{ margin: 5 }}>
              <GrayButton onClick={() => navigate(-1)}>
                Отменить
              </GrayButton>
                <DarkCyanButton
                  style={{ marginRight: 'auto' }}
                  disabled={!isFormValid || isScheduleLoading || isCreditLoading}
                  onClick={handleCreateOrUpdateCredit}
                >
                  {isScheduleLoading || isCreditLoading
                    ? 'Загрузка...'
                    : isEditMode
                      ? 'Сохранить изменения'
                      : 'Создать договор'}
                </DarkCyanButton>
            </ButtonWrapper>
            </InputGroup>
          </PaymentScheduleInputs>
          <PaymentScheduleTableWrapper>
            <PaymentScheduleTable 
              data={paymentSchedule} 
              isLoading={isScheduleLoading} 
            />
          </PaymentScheduleTableWrapper>
        </PaymentScheduleContainer>
      </ContentWrapper>

      <ClientSelectModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSubmit={handleSelectClient}
        title="Выбор покупателя"
      />

      <ClientSelectModal
        isOpen={isGuarantorClientModalOpen}
        onClose={() => setIsGuarantorClientModalOpen(false)}
        onSubmit={handleSelectClient}
        title="Выбор поручителя"
      />

      <InvestorSelectModal
        isOpen={isInvestorModalOpen}
        onClose={() => setIsInvestorModalOpen(false)}
        onSubmit={handleSelectInvestor}
        includePools={true}
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

const DraftBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f1fbfd;
  border: 1px solid #cceef3;
  border-radius: 8px;
  padding: 12px 16px;
  margin: 12px 0 16px;
  color: #0b7285;
  gap: 12px;
`;

const DraftActions = styled.div`
  display: flex;
  gap: 8px;
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

const SubmitErrorBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  margin: 0 5px 12px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 4px solid #dc2626;
  border-radius: 8px;
  color: #7f1d1d;
  font-size: 14px;
  line-height: 1.45;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  animation: submitErrorSlideIn 180ms ease-out;

  @keyframes submitErrorSlideIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const SubmitErrorIcon = styled.span`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626;
  margin-top: 1px;
`;

const SubmitErrorContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const SubmitErrorTitle = styled.div`
  font-weight: 600;
  color: #991b1b;
  margin-bottom: 2px;
`;

const SubmitErrorMessage = styled.div`
  color: #7f1d1d;
  word-wrap: break-word;
`;

const SubmitErrorClose = styled.button`
  flex-shrink: 0;
  background: none;
  border: none;
  color: #991b1b;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  transition: background-color 120ms ease;

  &:hover {
    background-color: rgba(220, 38, 38, 0.1);
  }

  &:focus-visible {
    outline: 2px solid #dc2626;
    outline-offset: 1px;
  }
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
  display: flex;
  display-direction: row;
  gap: 15px;

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

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

export default NewCreditPage;