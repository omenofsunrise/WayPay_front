import { useState, useCallback, useEffect } from 'react';
import CustomTitle from '../components/ui/Text/CustomTitle';
import TitleField from '../components/ui/Layouts/TitleLayout';
import ExportButton from '../components/ui/Buttons/ExportButton';
import CustomInput from '../components/ui/fields/CustomInput';
import CustomTable from '../components/ui/tables/CustomTable';
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

interface EmptyStarIconProps {
  isSelected?: boolean;
}

interface SetCategoryActionProps {
  creditId: number;
  onCategorySet: () => void;
  customTabs: ObjectType[];
}

const CreditPage = () => {
  const [contractNumber, setContractNumber] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [investorName, setInvestorName] = useState('');
  const [clientFullName, setClientFullName] = useState('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [fromCreationDate, setFromCreationDate] = useState<string>('');
  const [toCreationDate, setToCreationDate] = useState<string>('');
  const [objectType, setObjectType] = useState<string>('');
  const [creditTypeId, setCreditTypeId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'desc' });
  const itemsPerPage = 10;
  const [filters, setFilters] = useState<{ isFavourite?: boolean; isActive?: boolean; myCredits?: boolean; debt?: boolean; inDebt?: boolean }>({});
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCreditId, setViewingCreditId] = useState<number | null>(null);
  const { createPayment } = usePayment();
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
  const { exportData, isExporting, exportProgress } = useExport<Credit>();
  const { isLoading, error, data: creditsData, getCredits, toggleFavourite, getDocsData, setInvestmentSource } = useCredit();
  const navigate = useNavigate();
  const [selectedCreditForPrint, setSelectedCreditForPrint] = useState<Credit | null>(null);
  const [isInvestorSelectModalOpen, setIsInvestorSelectModalOpen] = useState(false);
  const [selectedCreditForFunding, setSelectedCreditForFunding] = useState<Credit | null>(null);
  const { id, tab } = useParams<{ id?: string; tab?: string }>();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
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

  const getInitialTab = () => {
    if (tab) {
      return tab;
    }
    
    if (location.pathname === '/credits/in-debt') {
      return 'inDebt';
    }
    
    return 'all';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());

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
    setSelectedCreditForPrint(credit);
    }
  };

  const handleEditCredit = (rowData: any[]) => {
    const [_, id] = rowData;
    navigate(`/new-credit/${id}`);
  };

  const handlePrintOptionSelect = async (option: 'sale' | 'saleSinglePage' | 'schedules' | 'guaranteeConsent') => {
    if (!selectedCreditForPrint) return;
    
    // try {
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
    // } catch (error) {
    //   console.error('Ошибка при генерации документа:', error);
    //   alert('Произошла ошибка при генерации документа');
    // }
    
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

  const loadCredits = useCallback(async () => {
    const params = {
      page: currentPage,
      pageSize: itemsPerPage,
      creditId: contractNumber || undefined,
      clientFullname: clientFullName || undefined,
      investorNickname: investorName || undefined,
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
  }, [currentPage, clientFullName, investorName, fromDate, toDate, toCreationDate, fromCreationDate, creditTypeId, sortConfig, filters, contractNumber]);

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
      return result.id;
    } catch (error) {
      console.error('Ошибка при сохранении платежа:', error);
    }
  };

  const tableActions = [
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

  const handleClearObjectType = () => {
    setObjectType('');
    setCreditTypeId(null);
    setCurrentPage(1);
  };

  return (
    <PageLayout>
      <TitleField>
        <CustomTitle>Договоры</CustomTitle>
        <ExportButton 
          icon={<PrintIcon />} 
          onClick={() => {
            if (!selectedCreditForPrint) {
              alert('Пожалуйста, выберите договора из таблицы (клик по строке)');
              return;
            }
            setIsPrintModalOpen(true);
          }}
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
              setCurrentPage(1);
            }}
            onInvestorSelect={(investor) => {
              console.log('Selected investor:', investor);
            }}
          />
        </InputWrapper>

        <InputWrapper>
          <ObjectTypeSelect 
            value={objectType}
            onChange={handleObjectTypeChange}
            onObjectTypeSelect={handleObjectTypeSelect}
            placeholder="Каталог"
            customPlaceholder="Каталог"
          />
          {objectType && (
            <ClearFilterButton onClick={handleClearObjectType}>
              ×
            </ClearFilterButton>
          )}
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
        
        {customTabs.length < 5 && (
          <AddButton 
            onClick={() => setIsCreateTabModalOpen(true)}
            tooltip="Добавить вкладку"
            margin="0 auto 15px 15px" 
            size={24}
          />
        )}
        
        <CountInfoTitle 
          total={creditsData?.totalCount || 0} 
        />
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
              { name: "Первоначальный взнос", isSortable: true, align: "right" },
              { name: "Начислено", isSortable: true, align: "right" },
              { name: "Уплачено", isSortable: true, align: "right" },
              { name: "Остаток", isSortable: true, align: "right" },
              { name: "Остаток", isHidden: true },
              { name: "Долг", isSortable: true, align: "right" },
              { name: "isActive", isHidden: true, align: "right" },
            ]} 
            data={formatCreditData(creditsData?.items)}
            onSort={handleSort}
            sortConfig={sortConfig}
            onRowDoubleClick={handleRowDoubleClick}
            onRowClick={handleRowClick}
            selectedRow={selectedCreditForPrint ? creditsData?.items.findIndex(c => c.id === selectedCreditForPrint.id) : null}
            contextMenuActions={tableActions}
            hasTotalsRow={forbiddenRole('сотрудник')}
            debtChecker={(row) => row[row.length - 2] === true}
          />

          <PaginationLayout>
            <Pagination
              total={creditsData?.totalCount || 0}
              current={currentPage}
              onChange={setCurrentPage}
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

const ClearFilterButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  z-index: 10;

  &:hover {
    color: #666;
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

export default CreditPage;