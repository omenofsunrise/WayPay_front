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
import { createWhatsAppMessageWithoutPhone } from '../utils/sendWhatsAppMessage';

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

const CREDIT_FILTERS_STORAGE_KEY = 'creditsPageFilters';

type CreditFiltersStorage = {
  contractNumber: string;
  currentPage: number;
  investorName: string;
  selectedInvestmentSource: { type: 'investor' | 'pool'; id: number; name: string } | null;
  clientFullName: string;
  fromDate: string;
  toDate: string;
  fromCreationDate: string;
  toCreationDate: string;
  objectType: string;
  creditTypeId: number | null;
  sortConfig: { key: number | null; direction: 'asc' | 'desc' };
  filters: { isFavourite?: boolean; isActive?: boolean; myCredits?: boolean; debt?: boolean; inDebt?: boolean; objectTypeId?: number };
  activeTab: string;
};

const readStoredFilters = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const CreditPage = () => {
  const storedFiltersRef = useRef<CreditFiltersStorage | null>(readStoredFilters(CREDIT_FILTERS_STORAGE_KEY));
  const storedFilters = storedFiltersRef.current;
  const { id, tab } = useParams<{ id?: string; tab?: string }>();
  const baseTab = useMemo(() => {
    if (tab) return tab;
    if (location.pathname === '/credits/in-debt') return 'inDebt';
    return 'all';
  }, [tab]);
  const shouldUseStoredTab = !tab && location.pathname !== '/credits/in-debt';
  const getTabFilters = useCallback((tabId: string) => {
    if (tabId.startsWith('tab-')) {
      const objectTypeId = parseInt(tabId.replace('tab-', ''));
      return Number.isNaN(objectTypeId) ? {} : { objectTypeId };
    }
    switch (tabId) {
      case 'my':
        return { myCredits: true };
      case 'favourite':
        return { isFavourite: true };
      case 'archive':
        return { isActive: false };
      case 'debtors':
        return { debt: true };
      case 'inDebt':
        return { inDebt: true };
      default:
        return {};
    }
  }, []);

  const [contractNumber, setContractNumber] = useState(storedFilters?.contractNumber ?? '');
  const [currentPage, setCurrentPage] = useState(storedFilters?.currentPage ?? 1);
  const [investorName, setInvestorName] = useState(storedFilters?.investorName ?? '');
  const [selectedInvestmentSource, setSelectedInvestmentSource] = useState<{ type: 'investor' | 'pool'; id: number; name: string } | null>(storedFilters?.selectedInvestmentSource ?? null);
  const [clientFullName, setClientFullName] = useState(storedFilters?.clientFullName ?? '');
  const [fromDate, setFromDate] = useState<string>(storedFilters?.fromDate ?? '');
  const [toDate, setToDate] = useState<string>(storedFilters?.toDate ?? '');
  const [fromCreationDate, setFromCreationDate] = useState<string>(storedFilters?.fromCreationDate ?? '');
  const [toCreationDate, setToCreationDate] = useState<string>(storedFilters?.toCreationDate ?? '');
  const [objectType, setObjectType] = useState<string>(storedFilters?.objectType ?? '');
  const [creditTypeId, setCreditTypeId] = useState<number | null>(storedFilters?.creditTypeId ?? null);
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: 'asc' | 'desc';
  }>(storedFilters?.sortConfig ?? { key: null, direction: 'desc' });
  const itemsPerPage = 10;
  const [filters, setFilters] = useState<{ isFavourite?: boolean; isActive?: boolean; myCredits?: boolean; debt?: boolean; inDebt?: boolean; objectTypeId?: number }>(
    shouldUseStoredTab ? (storedFilters?.filters ?? {}) : getTabFilters(baseTab)
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCreditId, setViewingCreditId] = useState<number | null>(null);
  const { createPayment, generatePaymentHistoryMessage } = usePayment();
  const [isCreateTabModalOpen, setIsCreateTabModalOpen] = useState(false);
  const [isEditTabModalOpen, setIsEditTabModalOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<ObjectType | null>(null);
  const [customTabs, setCustomTabs] = useState<ObjectType[]>([]);
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
  const { isLoading, error, data: creditsData, getCredits, toggleFavourite, getDocsData, setInvestmentSource, acceptCredit } = useCredit();
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectedCreditForPrint, setSelectedCreditForPrint] = useState<Credit | null>(null);
  const [isInvestorSelectModalOpen, setIsInvestorSelectModalOpen] = useState(false);
  const [selectedCreditForFunding, setSelectedCreditForFunding] = useState<Credit | null>(null);
  const { id, tab } = useParams<{ id?: string; tab?: string }>();
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
    
    const message = await generateShareMessage(option);
    if (message) {
      const whatsappUrl = createWhatsAppMessageWithoutPhone(message);
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
    setIsShareModalOpen(false);
  }, [generateShareMessage]);

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

  const [activeTab, setActiveTab] = useState<string>(shouldUseStoredTab ? (storedFilters?.activeTab ?? baseTab) : baseTab);

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

    await getCredits(params);
  }, [currentPage, includeAllStates, clientFullName, investorName, fromDate, toDate, toCreationDate, fromCreationDate, creditTypeId, sortConfig, filters, contractNumber, selectedInvestmentSource]);

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

    setFilters(getTabFilters(tabId));
    setCurrentPage(1);
    setSelectedRows([]); // Сбрасываем выбор при смене вкладки
  };

  const resetFilters = () => {
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
    setSortConfig({ key: null, direction: 'desc' });
    setActiveTab(baseTab);
    setFilters(getTabFilters(baseTab));
    setCurrentPage(1);
    localStorage.removeItem(CREDIT_FILTERS_STORAGE_KEY);
  };

  const hasActiveFilters = useMemo(() => {
    const hasInputs = Boolean(
      contractNumber ||
      investorName ||
      clientFullName ||
      fromDate ||
      toDate ||
      fromCreationDate ||
      toCreationDate ||
      objectType ||
      creditTypeId !== null ||
      selectedInvestmentSource
    );
    const hasFilterFlags = Object.keys(filters).length > 0;
    const hasSort = sortConfig.key !== null;
    const hasTabChange = activeTab !== baseTab;
    return hasInputs || hasFilterFlags || hasSort || hasTabChange || currentPage !== 1;
  }, [
    contractNumber,
    investorName,
    clientFullName,
    fromDate,
    toDate,
    fromCreationDate,
    toCreationDate,
    objectType,
    creditTypeId,
    selectedInvestmentSource,
    filters,
    sortConfig,
    activeTab,
    baseTab,
    currentPage
  ]);

  useEffect(() => {
    const payload: CreditFiltersStorage = {
      contractNumber,
      currentPage,
      investorName,
      selectedInvestmentSource,
      clientFullName,
      fromDate,
      toDate,
      fromCreationDate,
      toCreationDate,
      objectType,
      creditTypeId,
      sortConfig,
      filters,
      activeTab
    };
    localStorage.setItem(CREDIT_FILTERS_STORAGE_KEY, JSON.stringify(payload));
  }, [
    contractNumber,
    currentPage,
    investorName,
    selectedInvestmentSource,
    clientFullName,
    fromDate,
    toDate,
    fromCreationDate,
    toCreationDate,
    objectType,
    creditTypeId,
    sortConfig,
    filters,
    activeTab
  ]);

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
      return result.id;
    } catch (error) {
      console.error('Ошибка при сохранении платежа:', error);
    }
  };

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
        <ExportButton 
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
        
        <RightActions>
          {customTabs.length < 5 && (
            <AddButton 
              onClick={() => setIsCreateTabModalOpen(true)}
              tooltip="Добавить вкладку"
              margin="0 auto 15px 15px" 
              size={24}
            />
          )}
          <ResetFiltersButton onClick={resetFilters} disabled={!hasActiveFilters}>
            Сбросить фильтры
          </ResetFiltersButton>
          <CountInfoTitle 
            total={creditsData?.totalCount || 0} 
          />
        )}
        
        <CountInfoTitle 
          total={creditsData?.totalCount || 0} 
        />
        
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

const RightActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
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

export default CreditPage;
