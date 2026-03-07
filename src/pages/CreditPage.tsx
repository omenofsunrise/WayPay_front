import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import CustomTitle from '../components/ui/Text/CustomTitle';
import TitleField from '../components/ui/Layouts/TitleLayout';
import ExportButton from '../components/ui/Buttons/ExportButton';
import CustomInput from '../components/ui/fields/CustomInput';
import CustomTable, { type RowStyle } from '../components/ui/tables/CustomTable';
import Pagination from '../components/ui/fields/CustomPagination';
import PageLayout from '../components/ui/Layouts/PageLayout';
import PrintIcon from '../assets/ui/print.svg?react';
import styled from 'styled-components';
import Tabs from '../components/ui/fields/Tabs';
import PaginationLayout from '../components/ui/Layouts/PaginationLayout';
import CountInfoTitle from '../components/ui/Text/CountInfoTitle';
import { useNavigate, useParams } from 'react-router-dom';
import useCredit from '../api/hooks/useCredit';
import { InvestmentSourceType, type Credit, type SetInvestmentSourceRequest } from '../api/types/credit';
import useExport from '../api/hooks/useExport';
import creditService from '../api/services/creditService';
import { formatDate } from '../utils/dateFormatter';
import NewPaymentModal from '../components/modal/NewPaymentModal';
import ViewCreditModal from '../components/modal/ViewCreditModal';
import { formatMoney } from '../utils/formatPrice';
import usePayment from '../api/hooks/usePayment';
import CustomCalendar from '../components/ui/fields/CustomCalendar';
import { useAuth } from '../сontext/AuthContext';
import PrintOptionModal from '../components/modal/PrintOptionModal';
import DocxGenerator from '../utils/doxcUtils/docxGenerator';
import InvestorSelect from '../components/ui/fields/InvestorSelect';
import ObjectTypeSelect from '../components/ui/fields/ObjectTypeSelect';
import PaymentConfirmationGenerator from '../utils/doxcUtils/paymentConfirmationGenerator';
import paymentService from '../api/services/paymentService';
import type { PaymentTab } from '../api/types/payment';
import InvestorSelectModal from '../components/modal/CrudInherited/InvestorSelectModal';
import AddButton from '../components/ui/Buttons/AddButton';
import type { ObjectType, ObjectTypeCreateRequest, ObjectTypeUpdateRequest } from '../api/types/objectType';
import useObjectTypes from '../api/hooks/useObjectType';
import CreateObjectTypeModal from '../components/modal/CrudInherited/CreateObjectTypeModal';
import EditButton from '../components/ui/Buttons/EditButton';
import DeleteButton from '../components/ui/Buttons/DeleteButton';
import EditObjectTypeModal from '../components/modal/CrudInherited/EditObjectTypeModal';
import type { ContextMenuItem } from '../components/modal/ContextMenu';
import { createWhatsAppMessageWithoutPhone, sendWhatsAppMessageToPhone } from '../utils/sendWhatsAppMessage';
import DarkCyanButton from '../components/ui/Buttons/DarkCyanButton';

// Интерфейс для модалки "Поделиться"
interface ShareOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: 'contractData' | 'paymentHistory' | 'paymentSchedule') => void;
  selectedCredit?: Credit | null;
  modalTitle?: string;
}

// Компонент модалки "Поделиться"
const ShareOptionModal = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedCredit,
  modalTitle = "Поделиться" 
}: ShareOptionModalProps) => {
  
  const options = [
    { key: 'contractData', label: 'Данными договора', enabled: !!selectedCredit },
    { key: 'paymentHistory', label: 'Историей платежей', enabled: !!selectedCredit },
    // { key: 'paymentSchedule', label: 'Расписанием платежей', enabled: !!selectedCredit }
  ];

  const handleSelect = (optionKey: 'contractData' | 'paymentHistory' | 'paymentSchedule') => {
    if (selectedCredit) {
      onSelect(optionKey);
    } else {
      console.error('No credit selected for sharing');
      onClose();
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>{modalTitle}</ModalTitle>
        <PrintOptions>
          {options.map(option => (
            option.enabled !== false && (
              <PrintOption 
                key={option.key} 
                onClick={() => handleSelect(option.key as any)}
                disabled={!option.enabled}
              >
                {option.label}
              </PrintOption>
            )
          ))}
        </PrintOptions>
      </ModalContent>
    </ModalOverlay>
  );
};

interface EmptyStarIconProps {
  isSelected?: boolean;
}

interface SetCategoryActionProps {
  creditId: number;
  onCategorySet: () => void;
  customTabs: ObjectType[];
}

const CreditPage = () => {
  const colors = {
    primary: '#007D88'
  };
  const FILTERS_STORAGE_KEY = 'creditsFilters';
  const { id, tab } = useParams<{ id?: string; tab?: string }>();
  const savedFilters = useMemo(() => {
    try {
      const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Ошибка чтения фильтров договоров из localStorage:', error);
      return null;
    }
  }, []);

  const initialTab = useMemo(() => {
    if (tab) {
      return tab;
    }

    if (location.pathname === '/credits/in-debt') {
      return 'inDebt';
    }

    return typeof savedFilters?.activeTab === 'string' ? savedFilters.activeTab : 'all';
  }, [tab, savedFilters]);

  const [contractNumber, setContractNumber] = useState(() => savedFilters?.contractNumber ?? '');
  const [currentPage, setCurrentPage] = useState(1);
  const [investorName, setInvestorName] = useState(() => savedFilters?.investorName ?? '');
  const [selectedInvestmentSource, setSelectedInvestmentSource] = useState<{ type: 'investor' | 'pool'; id: number; name: string } | null>(() => savedFilters?.selectedInvestmentSource ?? null);
  const [clientFullName, setClientFullName] = useState(() => savedFilters?.clientFullName ?? '');
  const [fromDate, setFromDate] = useState<string>(() => savedFilters?.fromDate ?? '');
  const [toDate, setToDate] = useState<string>(() => savedFilters?.toDate ?? '');
  const [fromCreationDate, setFromCreationDate] = useState<string>(() => savedFilters?.fromCreationDate ?? '');
  const [toCreationDate, setToCreationDate] = useState<string>(() => savedFilters?.toCreationDate ?? '');
  const [objectType, setObjectType] = useState<string>(() => savedFilters?.objectType ?? '');
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);
  const [creditTypeId, setCreditTypeId] = useState<number | null>(() => (typeof savedFilters?.creditTypeId === 'number' ? savedFilters.creditTypeId : null));
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'desc' });
  const itemsPerPage = 10;
  const [filters, setFilters] = useState<{ isFavourite?: boolean; isActive?: boolean; myCredits?: boolean; debt?: boolean; inDebt?: boolean }>(() => savedFilters?.filters ?? {});
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCreditId, setViewingCreditId] = useState<number | null>(null);
  const { createPayment, generatePaymentHistoryMessage } = usePayment();
  const [isCreateTabModalOpen, setIsCreateTabModalOpen] = useState(false);
  const [isEditTabModalOpen, setIsEditTabModalOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<ObjectType | null>(null);
  const [customTabs, setCustomTabs] = useState<ObjectType[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const columnToApiSortMap: Record<number, string> = {
    1: 'id',
    2: 'date',
    3: 'client',
    5: 'accured',
    6: 'payed',
    7: 'rest',
    8: 'debt'
  };
  const { hasPermission, forbiddenRole, hasRole, denyPermission } = useAuth();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  // Новое состояние для модалки "Поделиться"
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { exportData, isExporting, exportProgress } = useExport<Credit>();
  const { isLoading, error, data: creditsData, getCredits, toggleFavourite, getDocsData, setInvestmentSource, acceptCredit, acceptCredits } = useCredit();
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectedCreditForPrint, setSelectedCreditForPrint] = useState<Credit | null>(null);
  const [isInvestorSelectModalOpen, setIsInvestorSelectModalOpen] = useState(false);
  const [selectedCreditForFunding, setSelectedCreditForFunding] = useState<Credit | null>(null);
  const { 
    isLoading: isObjectTypesLoading, 
    objectTypes, 
    create: createObjectType,
    update: updateObjectType,
    deleteObjectType: deleteObjectTypeApi,
    getAll: getAllObjectTypes 
  } = useObjectTypes();

  const shouldShowMyCreditsTab = hasRole('директор') || 
                                hasRole('суперадмин') || 
                                hasPermission('VIEW_ALL_CREDITS', true);

  useEffect(() => {
    loadCustomTabs();
  }, []);

  const handleMultiSelectChange = useCallback((selectedIndices: number[]) => {
    setSelectedRows(selectedIndices);
  }, []);

  const handlePrintButtonClick = () => {
    if (selectedRows.length === 0) {
      alert('Пожалуйста, выберите хотя бы один договор из таблицы');
      return;
    }
    
    if (selectedRows.length === 1) {
      // Если выбран один договор - показываем модалку печати
      const selectedIndex = selectedRows[0];
      const credit = creditsData?.items[selectedIndex];
      if (credit) {
        setSelectedCreditForPrint(credit);
        setIsPrintModalOpen(true);
      }
    } else {
      // Если выбрано несколько договоров - предлагаем массовую печать
      const confirmMassPrint = window.confirm(
        `Вы выбрали ${selectedRows.length} договора(ов). Хотите сгенерировать документы для всех выбранных договоров?`
      );
      
      if (confirmMassPrint) {
        // Реализуйте массовую печать здесь
        handleMassPrint(selectedRows);
      }
    }
  };

  const handleShareButtonClick = () => {
    if (selectedRows.length === 0) {
      alert('Пожалуйста, выберите хотя бы один договор из таблицы');
      return;
    }
    
    if (selectedRows.length === 1) {
      // Если выбран один договор - показываем модалку "Поделиться"
      const selectedIndex = selectedRows[0];
      const credit = creditsData?.items[selectedIndex];
      if (credit) {
        setSelectedCreditForPrint(credit);
        setIsShareModalOpen(true);
      }
    } else {
      // Если выбрано несколько договоров - предлагаем массовую рассылку
      const confirmMassShare = window.confirm(
        `Вы выбрали ${selectedRows.length} договора(ов). Хотите отправить данные по всем выбранным договорам?`
      );
      
      if (confirmMassShare) {
        // Реализуйте массовую рассылку здесь
        handleMassShare(selectedRows);
      }
    }
  };

  // Функция для массовой печати
  const handleMassPrint = async (selectedIndices: number[]) => {
    try {
      const docxGenerator = new DocxGenerator(getDocsData);
      
      for (const rowIndex of selectedIndices) {
        const credit = creditsData?.items[rowIndex];
        if (credit) {
          // Генерируем стандартный договор для каждого выбранного кредита
          await docxGenerator.generateFromCreditData(credit.id);
        }
      }
      
      alert(`Сгенерировано документов: ${selectedIndices.length}`);
    } catch (error) {
      console.error('Ошибка при массовой печати:', error);
      alert('Произошла ошибка при печати некоторых документов');
    }
  };

  // Функция для массовой рассылки
  const handleMassShare = async (selectedIndices: number[]) => {
    try {
      let combinedMessage = ``;
      
      for (const rowIndex of selectedIndices) {
        const credit = creditsData?.items[rowIndex];
        if (credit) {
          combinedMessage += `*Договор №${credit.id}*\n`;
          combinedMessage += `Клиент: ${credit.clientFullName}\n`;
          combinedMessage += `Дата: ${formatDate(credit.creditDate)}\n`;
          combinedMessage += `Сумма: ${formatMoney(credit.totalAmount?.toString() || '0')}\n`;
          combinedMessage += `Остаток: ${formatMoney(credit.rest?.toString() || '0')}\n`;
          combinedMessage += `---\n`;
        }
      }
      
      const whatsappUrl = createWhatsAppMessageWithoutPhone(combinedMessage);
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      
    } catch (error) {
      console.error('Ошибка при массовой рассылке:', error);
      alert('Произошла ошибка при подготовке сообщения');
    }
  };

  const generateShareMessage = useCallback(async (option: 'contractData' | 'paymentHistory' | 'paymentSchedule'): Promise<string> => {
    if (!selectedCreditForPrint) return '';
    
    const credit = selectedCreditForPrint;
    const today = new Date().toLocaleDateString('ru-RU');
    switch (option) {
      case 'contractData':
        return `Договор №${credit.id}

Дата оформления договора: ${formatDate(credit.creditDate)}
Клиент: ${credit.clientFullName}
${credit.guarantorFullName ? `Поручитель: ${credit.guarantorFullName}\n` : ''}Срок: ${credit.termMonths} месяцев
Стоимость товара: ${formatMoney(credit.totalClean?.toString())}
${credit.firstPayment ? `Первоначальный взнос: ${formatMoney(credit.firstPayment?.toString())}\n` : ''}Общая сумма договора: ${formatMoney(credit.totalAmount?.toString() || '0')}`;
               
    case 'paymentHistory':
      return await generatePaymentHistoryMessage(credit);
               
      case 'paymentSchedule':
        return `📅 *Расписание платежей по договору #${credit.id}*\n\n` +
               `Клиент: ${credit.clientFullName}\n` +
               `Дата договора: ${formatDate(credit.creditDate)}\n` +
               `Общая сумма: ${formatMoney(credit.totalAmount?.toString() || '0')}\n` +
               `_Для получения детального графика платежей обратитесь к менеджеру._\n` +
               `_Отправлено ${today}_`;
               
      default:
        return '';
    }
  }, [selectedCreditForPrint]);

  const handleShareOptionSelect = useCallback(async (option: 'contractData' | 'paymentHistory' | 'paymentSchedule', e?: React.MouseEvent) => {
      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }
      
      if (!selectedCreditForPrint) {
          alert('Договор не выбран');
          setIsShareModalOpen(false);
          return;
      }
      
      // Получаем номер телефона клиента
      const clientPhone = selectedCreditForPrint.clientPhone;
      
      if (!clientPhone) {
          alert('У клиента не указан номер телефона');
          setIsShareModalOpen(false);
          return;
      }
      
      const message = await generateShareMessage(option);
      if (message) {
          // Используем новую функцию для отправки на конкретный номер
          const success = sendWhatsAppMessageToPhone(clientPhone, message);
          
          if (success) {
              console.log(`Сообщение отправлено на номер: ${clientPhone}`);
          } else {
              alert('Не удалось открыть WhatsApp. Проверьте номер телефона.');
          }
      }
      setIsShareModalOpen(false);
  }, [generateShareMessage, selectedCreditForPrint]);

  const getCategoryMenuItems = ({ 
    creditId, 
    onCategorySet, 
    customTabs 
  }: SetCategoryActionProps): ContextMenuItem[] => {

    const handleSetCategory = async (objectTypeId: number | null) => {
      try {
        await creditService.setCreditType(creditId, objectTypeId);
        onCategorySet();
      } catch (error) {
        console.error('Ошибка при установке категории:', error);
        alert('Произошла ошибка при установке категории');
      }
    };

    const categoryItems: ContextMenuItem[] = [
      {
        label: 'Без категории',
        action: () => handleSetCategory(null),
        color: '#666'
      },
      ...customTabs.map(tab => ({
        label: tab.name,
        action: () => handleSetCategory(tab.id),
        color: '#007d88'
      }))
    ];

    return categoryItems;
  };

  const loadCustomTabs = useCallback(async () => {
    const result = await getAllObjectTypes({ 
      entityType: 'creditTab' 
    });
    if (result) {
      setCustomTabs(result.items);
    }
  }, [getAllObjectTypes]);

  const getTabs = useCallback(() => {
    const baseTabs = [
      { id: 'all', label: 'Все' },
      ...(shouldShowMyCreditsTab ? [{ id: 'my', label: 'Свои' }] : []),
      { id: 'favourite', label: 'Избранные' },
      { id: 'debtors', label: 'Просрочка' },
      { id: 'inDebt', label: 'В долг' },
      { id: 'archive', label: 'В архиве' }
    ];

    const customTabItems = customTabs.map(tab => ({
      id: `tab-${tab.id}`,
      label: (
        <TabLabel>
          {tab.name}
          <TabActions>
            <EditButton 
              onClick={(e) => {
                e.stopPropagation();
                setEditingTab(tab);
                setIsEditTabModalOpen(true);
              }} 
              size={25}
            />
            <DeleteButton 
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Удалить вкладку "${tab.name}"?`)) {
                  handleDeleteTab(tab.id);
                }
              }} 
              size={25}
            />
          </TabActions>
        </TabLabel>
      ),
      objectTypeId: tab.id
    }));

    return [...baseTabs, ...customTabItems];
  }, [shouldShowMyCreditsTab, customTabs]);

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const handleCreateTab = useCallback(async (tabData: ObjectTypeCreateRequest) => {
    if (customTabs.length >= 5) {
      alert('Максимальное количество вкладок - 5');
      return false;
    }

    try {
      const result = await createObjectType(tabData);
      if (result) {
        await loadCustomTabs();
        setIsCreateTabModalOpen(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Ошибка при создании вкладки:', error);
      return false;
    }
  }, [createObjectType, customTabs.length, loadCustomTabs]);

  const handleEditTab = useCallback(async (updateData: ObjectTypeUpdateRequest) => {
    if (!editingTab) return false;

    try {
      const result = await updateObjectType(editingTab.id, updateData);
      if (result) {
        await loadCustomTabs();
        setIsEditTabModalOpen(false);
        setEditingTab(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Ошибка при редактировании вкладки:', error);
      return false;
    }
  }, [editingTab, updateObjectType, loadCustomTabs]);

  const handleDeleteTab = useCallback(async (tabId: number) => {
    try {
      await deleteObjectTypeApi(tabId);
      await loadCustomTabs();
      
      if (activeTab === `tab-${tabId}`) {
        setActiveTab('all');
      }
      
      alert('Вкладка успешно удалена');
    } catch (error) {
      console.error('Ошибка при удалении вкладки:', error);
      alert('Произошла ошибка при удалении вкладки');
    }
  }, [deleteObjectTypeApi, loadCustomTabs, activeTab]);

  useEffect(() => {
    if (id) {
      const creditId = parseInt(id);
      if (!isNaN(creditId)) {
        setViewingCreditId(creditId);
        setIsViewModalOpen(true);
      }
    }
  }, [id]);

  useEffect(() => {
    if (!isViewModalOpen && id) {
      navigate('/credits', { replace: true });
    }
  }, [isViewModalOpen, id, navigate]);

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingCreditId(null);
  };

  const handleSelectFundingSource = (rowData: any[]) => {
    const [_, id] = rowData;
    const credit = creditsData?.items.find(c => c.id === Number(id));
    if (credit) {
      setSelectedCreditForFunding(credit);
      setIsInvestorSelectModalOpen(true);
    }
  };

  useEffect(() => {
    const payload = {
      contractNumber,
      investorName,
      selectedInvestmentSource,
      clientFullName,
      fromDate,
      toDate,
      fromCreationDate,
      toCreationDate,
      objectType,
      creditTypeId,
      activeTab,
      filters
    };

    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(payload));
  }, [
    contractNumber,
    investorName,
    selectedInvestmentSource,
    clientFullName,
    fromDate,
    toDate,
    fromCreationDate,
    toCreationDate,
    objectType,
    creditTypeId,
    activeTab,
    filters
  ]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      contractNumber ||
      investorName ||
      selectedInvestmentSource ||
      clientFullName ||
      fromDate ||
      toDate ||
      fromCreationDate ||
      toCreationDate ||
      objectType ||
      (creditTypeId !== null && creditTypeId !== undefined) ||
      activeTab !== 'all' ||
      (filters && Object.keys(filters).length > 0)
    );
  }, [
    contractNumber,
    investorName,
    selectedInvestmentSource,
    clientFullName,
    fromDate,
    toDate,
    fromCreationDate,
    toCreationDate,
    objectType,
    creditTypeId,
    activeTab,
    filters
  ]);

  const resetFilters = useCallback(() => {
    setContractNumber('');
    setInvestorName('');
    setSelectedInvestmentSource(null);
    setClientFullName('');
    setFromDate('');
    setToDate('');
    setFromCreationDate('');
    setToCreationDate('');
    setObjectType('');
    setCreditTypeId(null);
    setFilters({});
    setActiveTab('all');
    setSortConfig({ key: null, direction: 'desc' });
    setCurrentPage(1);
    setSelectedRows([]);
    localStorage.removeItem(FILTERS_STORAGE_KEY);
  }, []);

  const handleAccept = async (rowData: any[]) => {
    const [_, id] = rowData;
    const credit = creditsData?.items.find(c => c.id === Number(id));
    if (credit) {
      try {
        await acceptCredit(credit.id);
        await loadCredits();
      } catch (error) {
        console.error('Ошибка при подтверждении договора:', error);
      }
    }
  };

  const handleFundingSourceSubmit = async (entity: { 
    id: number; 
    type: 'investor' | 'pool';
  }) => {
    if (!selectedCreditForFunding) return;

    try {
      const sourceRequest: SetInvestmentSourceRequest = {
        sourceType: entity.type === 'investor' ? InvestmentSourceType.Investor : InvestmentSourceType.InvestorPool,
        entityId: entity.id
      };

      await setInvestmentSource(selectedCreditForFunding.id, sourceRequest);
      
      await loadCredits();
      setIsInvestorSelectModalOpen(false);
      setSelectedCreditForFunding(null);
      
      alert('Источник финансирования успешно установлен');
    } catch (error) {
      console.error('Ошибка при установке источника финансирования:', error);
      alert('Произошла ошибка при установке источника финансирования');
    }
  };

  const getPaymentTab = useCallback(async (paymentId: number): Promise<PaymentTab | null> => {
      try {
          const result = await paymentService.getPaymentTab(paymentId);
          return result;
      } catch (err) {
          console.error('Ошибка при получении данных для документа:', err);
          return null;
      }
  }, []);

  const paymentConfirmationGenerator = new PaymentConfirmationGenerator(getPaymentTab);

  const handleRowClick = (rowData: any[], rowIndex: number) => {
    const [_, id] = rowData;
    const credit = creditsData?.items.find(c => c.id === Number(id));
    if (credit) {
      // Для обратной совместимости устанавливаем selectedCreditForPrint
      setSelectedCreditForPrint(credit);
    }
  };

  const handleEditCredit = (rowData: any[]) => {
    const [_, id] = rowData;
    navigate(`/new-credit/${id}`);
  };

  const handlePrintOptionSelect = async (option: 'sale' | 'saleSinglePage' | 'schedules' | 'guaranteeConsent') => {
    if (!selectedCreditForPrint) return;
    
    const docxGenerator = new DocxGenerator(getDocsData);
    
    if (option === 'sale') {
      await docxGenerator.generateFromCreditData(selectedCreditForPrint.id);
    } else if (option === 'saleSinglePage') {
      await docxGenerator.generateFromCreditData(
        selectedCreditForPrint.id,
        '/Docs/salesContractSinglePage.docx'
      );
    } else if (option === 'schedules') {
      await docxGenerator.generateFromCreditData(
        selectedCreditForPrint.id,
        '/Docs/schedules.docx'
      );
    } else if (option === 'guaranteeConsent') {
      await docxGenerator.generateFromCreditData(
        selectedCreditForPrint.id,
        '/Docs/guaranteeandConsentAgreement.docx'
      );
    }
  
    setIsPrintModalOpen(false);
  };

  const handlePrintReceipt = async (paymentId: number) => {
    try {
      console.log('ПОЧАЛОСЬ');
      await paymentConfirmationGenerator.generatePaymentConfirmation(paymentId);
      console.log('Чек успешно сгенерирован');
    } catch (error) {
      console.error('Ошибка при печати чека:', error);
      alert('Платёж создан, но произошла ошибка при печати чека');
    }
  };

  const includeAllStates = useMemo(() => {
    const excludedTabs = ['favourite', 'archive', 'debtors', 'inDebt'];
    if (excludedTabs.includes(activeTab)) {
      return false;
    }

    return contractNumber.trim() !== '' || 
          clientFullName.trim() !== '' || 
          investorName.trim() !== '' || 
          (creditTypeId !== null && creditTypeId !== undefined && creditTypeId !== 0);
  }, [contractNumber, clientFullName, investorName, objectType, selectedInvestmentSource, creditTypeId]);

  const loadCredits = useCallback(async () => {
    // Отменяем предыдущий запрос, если он есть
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Создаем новый AbortController
    abortControllerRef.current = new AbortController();

    const shouldInclude = includeAllStates;

    const params = {
      page: currentPage,
      pageSize: itemsPerPage,
      name: contractNumber || undefined,
      clientFullname: clientFullName || undefined,
      includeAllStates: shouldInclude ? true : undefined,
      investorNickname: selectedInvestmentSource?.type === 'pool' ? undefined : (investorName || undefined),
      investorPoolId: selectedInvestmentSource?.type === 'pool' ? selectedInvestmentSource.id : undefined,
      dateFrom: fromDate ? new Date(fromDate) : undefined,
      dateTo: toDate ? new Date(toDate) : undefined,
      CreatedAt: fromCreationDate ? new Date(fromCreationDate) : undefined,
      CreatedTo: toCreationDate ? new Date(toCreationDate) : undefined,
      creditTypeId: creditTypeId || undefined,
      sortBy: sortConfig.key !== null ? columnToApiSortMap[sortConfig.key] : undefined,
      sortDirection: sortConfig.direction,
      ...filters
    };

    await getCredits(params, abortControllerRef.current.signal);
  }, [currentPage, includeAllStates, clientFullName, investorName, fromDate, toDate, toCreationDate, fromCreationDate, creditTypeId, sortConfig, filters, contractNumber, selectedInvestmentSource]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  const handleSort = (columnIndex: number) => {
    if (!columnToApiSortMap[columnIndex]) return;
    
    setSortConfig(prev => {
      if (prev.key === columnIndex) {
        return {
          key: columnIndex,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return {
        key: columnIndex,
        direction: 'asc'
      };
    });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    if (tabId.startsWith('tab-')) {
      const objectTypeId = parseInt(tabId.replace('tab-', ''));
      setFilters({ objectTypeId });
    } else {
      switch (tabId) {
        case 'my':
          setFilters({ myCredits: true });
          break;
        case 'favourite':
          setFilters({ isFavourite: true });
          break;
        case 'archive':
          setFilters({ isActive: false });
          break;
        case 'debtors':
          setFilters({ debt: true });
          break;
        case 'inDebt':
          setFilters({ inDebt: true });
          break;
        default:
          setFilters({});
          break;
      }
    }
    
    setCurrentPage(1);
    setSelectedRows([]); // Сбрасываем выбор при смене вкладки
  };

  const handleDeleteCredit = async (rowData: any[]) => {
    const [_, id] = rowData;
    if (window.confirm('Вы уверены, что хотите удалить этот договор?')) {
      try {
        await creditService.deleteCredit(Number(id));
        loadCredits();
      } catch (err) {
        console.error('Ошибка при удалении договора:', err);
      }
    }
  };

  const handleOpenPaymentModal = (rowData: any[]) => {
    const [_, id, __, clientFullName] = rowData;
    const credit = creditsData?.items.find(c => c.id === Number(id));
    if (credit) {
      setSelectedCreditForPrint(credit);
      setIsPaymentModalOpen(true);
    }
  };

  const handleSavePayment = async (paymentData: {
    paymentDate: string;
    principalAmount: number;
    paymentMethod: 'cash' | 'card';
    bankCardId?: number;
  }) => {
    try {
      if (!selectedCreditForPrint) return;
      
      const paymentRequest = {
        creditId: selectedCreditForPrint.id,
        paymentAmount: paymentData.principalAmount,
        datePayment: paymentData.paymentDate,
        type: paymentData.paymentMethod,
        bankCardId: paymentData.bankCardId
      };
      
      const result = await createPayment(paymentRequest);
      
      await loadCredits();
      setIsPaymentModalOpen(false);
      return result;
    } catch (error) {
      console.error('Ошибка при сохранении платежа:', error);
    }
  };

  const handleConfirmAllCredits = useCallback(async () => {

  // Подтверждение у пользователя
  const confirmMessage = `Вы действительно хотите подтвердить ВСЕ договоры, соответствующие текущим фильтрам?

Это действие нельзя отменить. Продолжить?`;

  if (!window.confirm(confirmMessage)) {
    return;
  }

  setIsConfirmingAll(true);
  
  try {
    // Формируем параметры фильтрации для подтверждения
    const params = {
      name: contractNumber || undefined,
      clientFullname: clientFullName || undefined,
      includeAllStates: includeAllStates ? true : undefined,
      investorNickname: selectedInvestmentSource?.type === 'pool' ? undefined : (investorName || undefined),
      investorPoolId: selectedInvestmentSource?.type === 'pool' ? selectedInvestmentSource.id : undefined,
      dateFrom: fromDate ? new Date(fromDate) : undefined,
      dateTo: toDate ? new Date(toDate) : undefined,
      CreatedAt: fromCreationDate ? new Date(fromCreationDate) : undefined,
      CreatedTo: toCreationDate ? new Date(toCreationDate) : undefined,
      creditTypeId: creditTypeId || undefined,
      ...filters
    };

    await acceptCredits(params);
    
    // Показываем сообщение об успехе
    alert('Все договоры по указанным фильтрам успешно подтверждены');
    
    // Обновляем список договоров
    await loadCredits();
    
  } catch (error) {
    console.error('Ошибка при массовом подтверждении договоров:', error);
    alert('Произошла ошибка при подтверждении договоров. Пожалуйста, попробуйте еще раз.');
  } finally {
    setIsConfirmingAll(false);
  }
}, [acceptCredits, hasActiveFilters, contractNumber, clientFullName, investorName, 
    objectType, fromDate, toDate, fromCreationDate, toCreationDate, activeTab, 
    filters, includeAllStates, selectedInvestmentSource, creditTypeId, loadCredits]);

  const tableActions = [
    {
      label: 'Подтвердить договор',
      action: handleAccept,
      color: '#007d88',
      shouldShow: (rowData: any[]) => {
        const [_, id] = rowData;
        const credit = creditsData?.items.find(c => c.id === Number(id));
        
        return hasPermission('MANAGE_ACCOUNTING', true) && 
              credit && 
              !credit.hasCounterApproved;
      }
    },
    {
      label: 'Добавить платёж',
      action: handleOpenPaymentModal,
      color: '#008b8b',
    },
    {
      label: 'Выбрать источник финансирования',
      action: handleSelectFundingSource,
      color: '#007d88',
      shouldShow: (rowData: any[]) => activeTab === 'inDebt' && (hasRole('директор') || hasRole('суперадмин')) && denyPermission('MANAGE_ACCOUNTING', true)
    },
    {
      label: 'Установить категорию',
      action: (rowData: any[]) => {
        console.log('Установка категории для:', rowData);
      },
      color: '#007d88',
      shouldShow: (rowData: any[]) => customTabs.length > 0,
      getSubmenu: (rowData: any[]) => {
        const [_, id] = rowData;
        const creditId = Number(id);
        
        return getCategoryMenuItems({ 
          creditId, 
          onCategorySet: loadCredits, 
          customTabs 
        });
      },
      showOnHover: true
    },
    {
      label: 'Редактировать',
      action: handleEditCredit,
      color: '#007d88',
      shouldShow: (rowData: any[]) => (hasRole('директор') || hasRole('суперадмин')) && denyPermission('MANAGE_ACCOUNTING', true)
    },
    {
      label: 'Удалить',
      action: handleDeleteCredit,
      color: '#EF4444',
      shouldShow: (rowData: any[]) => (hasPermission('DELETE_CREDITS') && denyPermission('MANAGE_ACCOUNTING', true))
    }
  ];

  const handleExport = async () => {
    try {
      await exportData({
        fetchData: async (page, pageSize) => {
          const params = {
            page,
            pageSize,
            creditId: contractNumber || undefined,
            clientFullname: clientFullName || undefined,
            investorNickname: investorName || undefined,
            dateFrom: fromDate ? new Date(fromDate) : undefined,
            dateTo: toDate ? new Date(toDate) : undefined,
            creditTypeId: creditTypeId || undefined,
            sortBy: sortConfig.key !== null ? columnToApiSortMap[sortConfig.key] : undefined,
            sortDirection: sortConfig.direction,
            ...filters
          };
          
          const result = await creditService.getCredits(params);
          return {
            items: Array.isArray(result.items) ? result.items : [],
            totalCount: result.totalCount || 0
          };
        },
        fileName: 'credits_export',
        transformData: (credit) => {
          const creditDate = typeof credit.creditDate === 'string' 
            ? new Date(credit.creditDate) 
            : credit.creditDate;
            
          return {
            'ID': credit.id,
            'Дата договора': creditDate ? creditDate.toLocaleDateString() : 'Нет данных',
            'ФИО покупателя': credit.clientFullName,
            'Телефон': credit.clientPhone || 'Нет данных',
            'Стоимость товара': formatMoney(credit.totalClean?.toString()),
            'Начислено': formatMoney(credit.totalAmount?.toString() || '0'),
            'Уплачено': formatMoney(credit.payed?.toString() || '0'),
            'Остаток': formatMoney(credit.rest?.toString() || '0'),
            'Просрочка': formatMoney(credit.debt?.toString() || '0')
          };
        }
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Произошла ошибка при экспорте. Пожалуйста, попробуйте еще раз.');
    }
  };

  const rowStyles = useMemo(() => {
    if (!creditsData?.items) return {};

    const styles: { [rowIndex: number]: RowStyle } = {};
    
    creditsData.items.forEach((credit, rowIndex) => {
      const baseStyle: RowStyle = {
        backgroundColor: '#FFFFFF',
        color: '#000000',
        fontWeight: 'normal',
        hoverBackgroundColor: '#F3F4F6'
      };

      if (credit.debt > 0) {
        baseStyle.backgroundColor = '#E8D8D8';
      }

      if (!credit.isActive) {
        baseStyle.backgroundColor = '#E8F5E8';
        baseStyle.color = '#1B5E20';
      }

      if (!credit.hasCounterApproved) {
        baseStyle.color = '#FF5A5A';
      }

      // Подсветка выбранных строк
      if (selectedRows.includes(rowIndex)) {
        baseStyle.backgroundColor = '#E3F2FD';
        baseStyle.color = '#1565C0';
      }

      // Подсветка строки при одиночном выборе
      if (selectedCreditForPrint?.id === credit.id && selectedRows.length === 1) {
        baseStyle.backgroundColor = '#007D88';
        baseStyle.color = '#FFFFFF';
      }

      styles[rowIndex] = baseStyle;
    });

    return styles;
  }, [creditsData?.items, selectedCreditForPrint, selectedRows]);

  const formatCreditData = (credits: Credit[] | undefined) => {
    if (!credits) return [];
    
    const formattedData = credits.map(credit => [
      credit.isFavourite ? (
        <StarIcon 
          key={`star-${credit.id}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavourite(credit.id);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.74804 1.33325L9.81738 5.81859L14.7227 6.40059L11.096 9.75392L12.0587 14.5993L7.74804 12.1866L3.43738 14.5999L4.40004 9.75459L0.773376 6.39992L5.67938 5.81792L7.74804 1.33325Z" fill="#50555C" stroke="#50555C" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </StarIcon>
      ) : (
        <EmptyStarIcon 
          key={`star-${credit.id}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavourite(credit.id);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.74804 1.33325L9.81738 5.81859L14.7227 6.40059L11.096 9.75392L12.0587 14.5993L7.74804 12.1866L3.43738 14.5999L4.40004 9.75459L0.773376 6.39992L5.67938 5.81792L7.74804 1.33325Z" stroke="#50555C" stroke-linejoin="round"/>
          </svg>
        </EmptyStarIcon>
      ),
      credit.id.toString(),
      formatDate(credit.creditDate),
      credit.clientFullName,
      `${formatMoney(credit.totalClean.toString())}`,
      `${formatMoney(credit.firstPayment?.toString() || '')}`,
      `${formatMoney(credit.accured?.toString() || '')}`,
      `${formatMoney(credit.payed.toString())}`,
      `${formatMoney(credit.rest.toString())}`,
      `${formatMoney(credit.rest.toString())}`,
      `${formatMoney(credit.debt.toString())}`,
      credit.isActive
    ]);

    if (credits.length > 0 && 
      (hasRole('админ') || hasRole('директор') || hasRole('суперадмин') || hasPermission('MANAGE_ACCOUNTING'))) {
      const totalsRow = [
        '',
        '',
        '',
        'Итого',
        `${formatMoney(creditsData.totalPrice.toString())}`,
        `${formatMoney(creditsData.totalFirstPayment.toString())}`,
        `${formatMoney(creditsData.totalAccured.toString())}`,
        `${formatMoney(creditsData.totalPayed.toString())}`,
        `${formatMoney(creditsData.totalRest.toString())}`,
        `${formatMoney(creditsData.totalRest.toString())}`,
        `${formatMoney(creditsData.totalDebt.toString())}`,
        ''
      ];
      formattedData.push(totalsRow);
    }

    return formattedData;
  };

  const handleRowDoubleClick = (rowData: any[]) => {
    const [_, id] = rowData;
    setViewingCreditId(Number(id));
    setIsViewModalOpen(true);
  };

  const handleObjectTypeChange = (value: string) => {
    setObjectType(value);
    if (!value) {
      setCreditTypeId(null);
    }
    setCurrentPage(1);
  };

  const handleObjectTypeSelect = (objectType: { 
    id: number; 
    name: string; 
    entityType: string;
  }) => {
    setCreditTypeId(objectType.id);
    setObjectType(objectType.name);
    setCurrentPage(1);
  };

  // Добавим индикатор выбранных строк
  const SelectedCount = () => {
    if (selectedRows.length === 0) return null;
    
    return (
      <SelectedCountBadge>
        Выбрано: {selectedRows.length}
      </SelectedCountBadge>
    );
  };

  return (
    <PageLayout>
      <TitleField>
        <CustomTitle>Договоры</CustomTitle>
        {hasPermission('MANAGE_ACCOUNTING', true) && (
          <DarkCyanButton 
            onClick={handleConfirmAllCredits}
            disabled={isConfirmingAll}
          >
            {isConfirmingAll ? (
              <>
                <SpinnerIcon />
                Подтверждение...
              </>
            ) : (
              'Подтвердить все по фильтрам'
            )}
          </DarkCyanButton>
        )}
        <ExportButton 
          icon={<ShareIcon />}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleShareButtonClick();
          }}
        >
          Поделиться
        </ExportButton>
        <ExportButton 
          icon={<PrintIcon />} 
          onClick={() => { handlePrintButtonClick(); }}
        >
          Печать
        </ExportButton>
        <ExportButton 
          onClick={handleExport}
          isExporting={isExporting}
          exportProgress={exportProgress}
        >
          Экспорт
        </ExportButton>
      </TitleField>

      <FilterField>
        <InputWrapper>
          <CustomInput
            inputType="text"
            placeholder="№ Договора"
            value={contractNumber}
            onChange={(e) => {
              setContractNumber(e.target.value);
              setCurrentPage(1);
            }}
          />
        </InputWrapper>
        
        <InputWrapper>
          <CustomInput 
            style={{ marginRight: "auto", display: "flex"}}
            inputType="fullname"
            placeholder="ФИО"
            value={clientFullName}
            onChange={(e) => {
              setClientFullName(e.target.value);
              setCurrentPage(1);
            }}
          />
        </InputWrapper>

        <InputWrapper>
          <InvestorSelect 
            placeholder="Инвестор"
            value={investorName}
            onChange={(name) => {
              setInvestorName(name);
              setSelectedInvestmentSource(null);
              setCurrentPage(1);
            }}
            onInvestorSelect={(investor) => {
              setInvestorName(investor.nickname || investor.fullName || '');
              setSelectedInvestmentSource({
                type: investor.type || 'investor',
                id: investor.id,
                name: investor.nickname || investor.fullName || ''
              });
              setCurrentPage(1);
            }}
            includePools
          />
        </InputWrapper>

        <InputWrapper>
          <ObjectTypeSelect 
            value={objectType}
            onChange={handleObjectTypeChange}
            onObjectTypeSelect={handleObjectTypeSelect}
            placeholder="Каталог"
            customPlaceholder="Каталог"
            hideClearButton={false}
          />
        </InputWrapper>

        <DarkCyanButton
          type="button"
          onClick={resetFilters}
          disabled={!hasActiveFilters}
        >
          Сбросить фильтры
        </DarkCyanButton>
        
      </FilterField>

      <SecondRaw style={{ color: "white", gap: "15px" }}>
        <InputWrapper>
          <CustomCalendar 
            prefix="от:"
            placeholder='Дата договора'
            value={fromDate}
            onChange={(date) => {
              setFromDate(date);
              setCurrentPage(1);
            }}
          />
        </InputWrapper>
        
        <InputWrapper>
          <CustomCalendar 
            prefix="до:"
            placeholder='Дата договора'
            value={toDate}
            onChange={(date) => {
              setToDate(date);
              setCurrentPage(1);
            }}
          />
        </InputWrapper>

        <InputWrapper>
          <CustomCalendar 
            prefix="от:"
            placeholder='Дата создания'
            value={fromCreationDate}
            onChange={(date) => {
              setFromCreationDate(date);
              setCurrentPage(1);
            }}
          />
        </InputWrapper>
        
        <InputWrapper>
          <CustomCalendar 
            prefix="до:"
            placeholder='Дата создания'
            value={toCreationDate}
            onChange={(date) => {
              setToCreationDate(date);
              setCurrentPage(1);
            }}
          />
        </InputWrapper>
      </SecondRaw>

      <SecondRaw style={{ color: "white" }}>
        <Tabs 
          tabs={getTabs()}
          activeTab={activeTab}
          onChange={handleTabChange}
        />
        
        {customTabs.length < 5 && (
          <AddButton 
            onClick={() => setIsCreateTabModalOpen(true)}
            tooltip="Добавить вкладку"
            margin="0 auto 15px 15px" 
            size={24}
          />
        )}

        <TotalControls>
          <CountInfoTitle 
            total={creditsData?.totalCount || 0} 
          />
        </TotalControls>
        
        <SelectedCount />
      </SecondRaw>

      {isLoading && <div>Загрузка...</div>}
      {error && <div>Ошибка: {error}</div>}
      
      {!isLoading && !error && (
        <>
          <CustomTable 
            columns={[
              { name: "" },
              { name: "№", isSortable: true },
              { name: "Дата договора", isSortable: true, align: "right" },
              { name: "ФИО покупателя", isSortable: true, align: "left" },
              { name: "Стоимость товара", align: "right" },
              { name: "Первоначальный взнос", isSortable: true, align: "right" },
              { name: "Начислено", isSortable: true, align: "right" },
              { name: "Уплачено", isSortable: true, align: "right" },
              { name: "Остаток", isSortable: true, align: "right" },
              { name: "Остаток", isHidden: true },
              { name: "Долг", isSortable: true, align: "right" },
              { name: "isActive", isHidden: true, align: "right" },
            ]} 
            data={formatCreditData(creditsData?.items)}
            rowStyles={rowStyles}
            onSort={handleSort}
            multiSelect={true}
            onMultiSelectChange={handleMultiSelectChange}
            sortConfig={sortConfig}
            onRowDoubleClick={handleRowDoubleClick}
            onRowClick={handleRowClick}
            contextMenuActions={tableActions}
            hasTotalsRow={forbiddenRole('сотрудник')}
            debtChecker={(row) => row[row.length - 2] !== '0₽' && row[row.length - 2] !== '0'}
          />

          <PaginationLayout>
            <Pagination
              total={creditsData?.totalCount || 0}
              current={currentPage}
              onChange={(page) => {
                setCurrentPage(page);
                setSelectedRows([]); // Сбрасываем выбор при смене страницы
              }}
              itemsPerPage={itemsPerPage}
            />
          </PaginationLayout>
        </>
      )}

      <NewPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handleSavePayment}
        creditId={selectedCreditForPrint?.id || 0}
        clientName={selectedCreditForPrint?.clientFullName || ''}
        investorName={selectedCreditForPrint?.investorNickname || ''}
        clientPhone={selectedCreditForPrint?.clientPhone || ''}
        currentDebt={selectedCreditForPrint?.rest || 0}
        currentMonthDebt={selectedCreditForPrint?.currentMonthDebt || 0}
        onPrintReceipt={handlePrintReceipt}
        clientId={selectedCreditForPrint?.clientId}
      />

      <ViewCreditModal
        id={viewingCreditId || 0}
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
      />

      <PrintOptionModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onSelect={handlePrintOptionSelect}
        selectedCredit={selectedCreditForPrint}
      />

      {/* Новая модалка для кнопки "Поделиться" */}
      <ShareOptionModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSelect={handleShareOptionSelect}
        selectedCredit={selectedCreditForPrint}
      />

      <InvestorSelectModal
        isOpen={isInvestorSelectModalOpen}
        onClose={() => {
          setIsInvestorSelectModalOpen(false);
          setSelectedCreditForFunding(null);
        }}
        onSubmit={handleFundingSourceSubmit}
        includePools={true}
      />

      <CreateObjectTypeModal
        isOpen={isCreateTabModalOpen}
        onClose={() => setIsCreateTabModalOpen(false)}
        onSubmit={handleCreateTab}
        entityType="creditTab"
        maxTabs={5}
        currentTabCount={customTabs.length}
      />

      <EditObjectTypeModal
        isOpen={isEditTabModalOpen}
        onClose={() => {
          setIsEditTabModalOpen(false);
          setEditingTab(null);
        }}
        onSubmit={handleEditTab}
        initialData={editingTab}
        entityType="creditTab"
      />

    </PageLayout>
  );
};

const FilterField = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  position: relative;
`;

const ResetFiltersButton = styled.button`
  align-self: center;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #111827;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #f3f4f6;
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const InputWrapper = styled.div`
  flex: 1;  
  min-width: 0;
  position: relative;
`;

const SecondRaw = styled.div`
  display: flex;
  height: 60px;
  margin: 15px 0 0;
  background-color: transparent;
  justify-content: space-between;
  align-items: center;
  position: relative;
`;

const TotalControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ResetFiltersLink = styled.button<{ $primaryColor: string }>`
  background: none;
  border: 0;
  padding: 0;
  color: ${props => props.$primaryColor};
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const StarIcon = styled.div`
  cursor: pointer;
  color: gold;
  font-size: 1.2rem;
  user-select: none;
  width: 24px;  
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 100%;
    height: 100%;
  }
`;

const EmptyStarIcon = styled.div<EmptyStarIconProps>`
  cursor: pointer;
  width: 24px;
  height: 24px;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 100%;
    height: 100%;
    path {
      stroke: #50555C;
    }
  }
`;

const TabLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TabActions = styled.div`
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  
  ${TabLabel}:hover & {
    opacity: 1;
  }
`;

const SelectedCountBadge = styled.div`
  background-color: #007D88;
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  margin-left: 15px;
  margin-bottom: 15px;
`;

// Стили для модалки "Поделиться" (можно вынести в отдельный файл)
const ModalOverlay = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: black;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  color: black;
`;

const ModalTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
`;

const PrintOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PrintOption = styled.button<{ disabled?: boolean }>`
  padding: 12px;
  background-color: ${({ disabled }) => disabled ? '#f9f9f9' : '#f5f5f5'};
  border: 1px solid ${({ disabled }) => disabled ? '#eee' : '#ddd'};
  border-radius: 4px;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  text-align: center;
  transition: background-color 0.2s;
  color: ${({ disabled }) => disabled ? '#999' : 'black'};
  
  &:hover {
    background-color: ${({ disabled }) => disabled ? '#f9f9f9' : '#e9e9e9'};
    border-color: ${({ disabled }) => disabled ? '#eee' : 'rgba(0, 125, 136, 1)'};
  }
`;

const ShareIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.00001 2.50216C8.99998 1.91022 9.20982 1.33743 9.59224 0.885601C9.97466 0.43377 10.5049 0.132162 11.0887 0.0343785C11.6725 -0.0634049 12.2721 0.0489702 12.7809 0.351533C13.2896 0.654095 13.6747 1.12725 13.8675 1.6869C14.0604 2.24655 14.0485 2.85645 13.8341 3.4082C13.6197 3.95995 13.2167 4.41782 12.6965 4.70044C12.1764 4.98305 11.5729 5.0721 10.9934 4.95176C10.4138 4.83141 9.89563 4.50948 9.53101 4.04316L4.91502 6.35116C5.02912 6.77597 5.02912 7.22336 4.91502 7.64816L9.53302 9.95816C9.91574 9.47098 10.4657 9.14326 11.0764 9.03854C11.687 8.93382 12.3147 9.05956 12.8379 9.39139C13.3611 9.72321 13.7424 10.2375 13.908 10.8345C14.0736 11.4315 14.0116 12.0687 13.734 12.6226C13.4564 13.1765 12.9831 13.6076 12.4057 13.8323C11.8284 14.057 11.1882 14.0594 10.6092 13.8389C10.0302 13.6184 9.55374 13.1908 9.27213 12.6389C8.99051 12.0871 8.92383 11.4504 9.08502 10.8522L4.46702 8.54216C4.14602 8.95136 3.7054 9.25027 3.20652 9.39725C2.70765 9.54423 2.17535 9.53196 1.68377 9.36216C1.19219 9.19236 0.765807 8.87348 0.464002 8.44992C0.162198 8.02637 0 7.51924 0 6.99916C0 6.47908 0.162198 5.97195 0.464002 5.5484C0.765807 5.12485 1.19219 4.80596 1.68377 4.63616C2.17535 4.46636 2.70765 4.45409 3.20652 4.60107C3.7054 4.74805 4.14602 5.04696 4.46702 5.45616L9.08502 3.14916C9.02854 2.93813 8.99996 2.72062 9.00001 2.50216ZM11.502 1.00016C11.1038 1.00016 10.7219 1.15835 10.4403 1.43994C10.1587 1.72153 10.0005 2.10344 10.0005 2.50166C10.0005 2.89988 10.1587 3.2818 10.4403 3.56338C10.7219 3.84497 11.1038 4.00316 11.502 4.00316C11.9002 4.00316 12.2821 3.84497 12.5637 3.56338C12.8453 3.2818 13.0035 2.89988 13.0035 2.50166C13.0035 2.10344 12.8453 1.72153 12.5637 1.43994C12.2821 1.15835 11.9002 1.00016 11.502 1.00016ZM11.5 10.0002C11.1022 10.0002 10.7207 10.1582 10.4394 10.4395C10.1581 10.7208 10 11.1023 10 11.5002C10 11.898 10.1581 12.2795 10.4394 12.5608C10.7207 12.8421 11.1022 13.0002 11.5 13.0002C11.8978 13.0002 12.2794 12.8421 12.5607 12.5608C12.842 12.2795 13 11.898 13 11.5002C13 11.1023 12.842 10.7208 12.5607 10.4395C12.2794 10.1582 11.8978 10.0002 11.5 10.0002ZM1.00002 7.00016C1.00002 7.19714 1.03881 7.3922 1.1142 7.57419C1.18958 7.75617 1.30007 7.92153 1.43936 8.06082C1.57864 8.20011 1.744 8.3106 1.92599 8.38598C2.10798 8.46136 2.30303 8.50016 2.50002 8.50016C2.697 8.50016 2.89205 8.46136 3.07404 8.38598C3.25603 8.3106 3.42139 8.20011 3.56068 8.06082C3.69996 7.92153 3.81045 7.75617 3.88583 7.57419C3.96122 7.3922 4.00002 7.19714 4.00002 7.00016C4.00002 6.60234 3.84198 6.22081 3.56068 5.9395C3.27937 5.6582 2.89784 5.50016 2.50002 5.50016C2.10219 5.50016 1.72066 5.6582 1.43936 5.9395C1.15805 6.22081 1.00002 6.60234 1.00002 7.00016Z"
      fill="black"
    />
  </svg>
);

const SpinnerIcon = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default CreditPage;
