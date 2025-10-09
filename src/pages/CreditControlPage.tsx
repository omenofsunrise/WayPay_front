import { useState, useCallback, useEffect } from 'react';
import CustomTitle from '../components/ui/Text/CustomTitle';
import TitleField from '../components/ui/Layouts/TitleLayout';
import ExportButton from '../components/ui/Buttons/ExportButton';
import CustomInput from '../components/ui/fields/CustomInput';
import CustomTable from '../components/ui/tables/CustomTable';
import Pagination from '../components/ui/fields/CustomPagination';
import PageLayout from '../components/ui/Layouts/PageLayout';
import PrintIcon from '../assets/ui/print.svg?react';
import Tabs from '../components/ui/fields/Tabs';
import PaginationLayout from '../components/ui/Layouts/PaginationLayout';
import CountInfoTitle from '../components/ui/Text/CountInfoTitle';
import { useNavigate } from 'react-router-dom';
import useCredit from '../api/hooks/useCredit';
import type { Credit } from '../api/types/credit';
import useExport from '../api/hooks/useExport';
import creditService from '../api/services/creditService';
import { formatDate } from '../utils/dateFormatter';
import NewPaymentModal from '../components/modal/NewPaymentModal';
import ViewCreditModal from '../components/modal/ViewCreditModal';
import { formatMoney } from '../utils/formatPrice';
import usePayment from '../api/hooks/usePayment';
import styled from 'styled-components';
import { Container } from 'react-bootstrap';
import CustomCalendar from '../components/ui/fields/CustomCalendar';
import { useAuth } from '../сontext/AuthContext';
import InvestorSelect from '../components/ui/fields/InvestorSelect';
import ObjectTypeSelect from '../components/ui/fields/ObjectTypeSelect';

interface EmptyStarIconProps {
  isSelected?: boolean;
}

const CreditControlPage = () => {
  const [contractNumber, setContractNumber] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [investorName, setInvestorName] = useState('');
  const [clientFullName, setClientFullName] = useState('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [rublesIncomeFrom, setRublesIncomeFrom] = useState<string>('');
  const [rublesIncomeTo, setRublesIncomeTo] = useState<string>('');
  const [percentsIncomeFrom, setPercentsIncomeFrom] = useState<string>('');
  const [percentsIncomeTo, setPercentsIncomeTo] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'desc' });
  const itemsPerPage = 10;
  const [filters, setFilters] = useState<{ isFavourite?: boolean; isActive?: boolean; myCredits?: boolean; debt?: boolean }>({});
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCreditId, setViewingCreditId] = useState<number | null>(null);
  const { createPayment } = usePayment();
  const [objectType, setObjectType] = useState<string>('');
  const [creditTypeId, setCreditTypeId] = useState<number | null>(null);
  const columnToApiSortMap: Record<number, string> = {
    1: 'id',
    2: 'date',
    4: 'accured',
    5: 'income_percents',
    6: 'income_rubles',
  };
  const { hasPermission, hasRole, forbiddenRole } = useAuth();
  const { exportData, isExporting, exportProgress } = useExport<Credit>();
  const { isLoading, error, data: creditsData, getCredits, toggleFavourite } = useCredit();
  const navigate = useNavigate();

  const shouldShowMyCreditsTab = hasRole('директор') || 
                                hasRole('суперадмин') || 
                                hasPermission('VIEW_ALL_CREDITS', true);

  const tabs = [
    { id: 'all', label: 'Все' },
    ...(shouldShowMyCreditsTab ? [{ id: 'my', label: 'Свои' }] : []),
    { id: 'favourite', label: 'Избранные' },
    { id: 'debtors', label: 'Просрочка' },
    { id: 'archive', label: 'В архиве' }
  ];
  
  const [activeTab, setActiveTab] = useState<string>('all');

  const handleEditCredit = (rowData: any[]) => {
    const [_, id] = rowData;
    navigate(`/new-credit/${id}`);
  };

  const loadCredits = useCallback(async () => {
    const params = {
      page: currentPage,
      pageSize: itemsPerPage,
      creditId: contractNumber || undefined,
      creditTypeId: creditTypeId || undefined, 
      clientFullname: clientFullName || undefined,
      investorNickname: investorName || undefined,
      dateFrom: fromDate ? new Date(fromDate) : undefined,
      dateTo: toDate ? new Date(toDate) : undefined,
      rublesIncomeFrom: rublesIncomeFrom && !isNaN(Number(rublesIncomeFrom))
        ? Number(rublesIncomeFrom)
        : undefined,
      rublesIncomeTo: rublesIncomeTo && !isNaN(Number(rublesIncomeTo))
        ? Number(rublesIncomeTo)
        : undefined,
      percentsIncomeFrom: percentsIncomeFrom && !isNaN(Number(percentsIncomeFrom))
        ? Number(percentsIncomeFrom)
        : undefined,
      percentsIncomeTo: percentsIncomeTo && !isNaN(Number(percentsIncomeTo))
        ? Number(percentsIncomeTo)
        : undefined,
      sortBy: sortConfig.key !== null ? columnToApiSortMap[sortConfig.key] : undefined,
      sortDirection: sortConfig.direction,
      ...filters
    };

    console.log('Параметры запроса:', params); 
    await getCredits(params);
  }, [
    currentPage, contractNumber, clientFullName, investorName, 
    fromDate, toDate, rublesIncomeFrom, rublesIncomeTo, 
    percentsIncomeFrom, percentsIncomeTo, sortConfig, filters, creditTypeId
  ]);

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
      default:
        setFilters({});
        break;
    }
    
    setCurrentPage(1);
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
      setSelectedCredit(credit);
      setIsPaymentModalOpen(true);
    }
  };

  const handleSavePayment = async (paymentData: {
    paymentDate: string;
    principalAmount: number;
    paymentMethod: 'cash' | 'card';
  }) => {
    try {
      if (!selectedCredit) return;
      
      const paymentRequest = {
        creditId: selectedCredit.id,
        paymentAmount: paymentData.principalAmount,
        datePayment: paymentData.paymentDate,
        type: paymentData.paymentMethod
      };
      
      await createPayment(paymentRequest);
      
      await loadCredits();
      setIsPaymentModalOpen(false);
    } catch (error) {
      console.error('Ошибка при сохранении платежа:', error);
    }
  };

  const tableActions = [
    {
      label: 'Добавить платёж',
      action: handleOpenPaymentModal,
      color: '#008b8b',
      shouldShow: () => forbiddenRole("бухгалтер")
    },
    {
      label: 'Редактировать',
      action: handleEditCredit,
      color: '#007d88',
      shouldShow: () => (hasRole('директор') || hasRole('суперадмин')) && forbiddenRole("бухгалтер")
    },
    {
      label: 'Удалить',
      action: handleDeleteCredit,
      color: '#EF4444',
      shouldShow: () => hasPermission('DELETE_CREDITS') && forbiddenRole("бухгалтер")
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
            rublesIncomeFrom: rublesIncomeFrom ? Number(rublesIncomeFrom) : undefined,
            rublesIncomeTo: rublesIncomeTo ? Number(rublesIncomeTo) : undefined,
            percentsIncomeFrom: percentsIncomeFrom ? Number(percentsIncomeFrom) : undefined,
            percentsIncomeTo: percentsIncomeTo ? Number(percentsIncomeTo) : undefined,
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
        fileName: 'credits_control_export',
        transformData: (credit) => {
          const creditDate = typeof credit.creditDate === 'string' 
            ? new Date(credit.creditDate) 
            : credit.creditDate;
            
          return {
            'Номер договора': credit.id,
            'Дата договора': creditDate ? formatDate(creditDate) : 'Нет данных',
            'ФИО сотрудника': credit.employeeName || 'Нет данных',
            'Стоимость товара': formatMoney(credit.totalClean?.toString() || '0'),
            'Доход в рублях': formatMoney(credit.incomeRubles?.toString() || '0'),
            'Доход в %': `${credit.incomePercents || 0}%`,
            'Начислено': formatMoney(credit.accured?.toString() || '0'),
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
      credit.employeeName,
      `${formatMoney(credit.totalClean.toString())}`,
      `${credit.incomePercents.toString() + '%'}`,
      `${formatMoney(credit.incomeRubles.toString())}`,
      `${formatMoney(credit.accured?.toString() || '')}`,
      credit.debt > 0,
      credit.isActive,
    ]);

    if (credits.length > 0) {
      const totalsRow = [
        '',
        '',
        '',
        'Итого',
        `${formatMoney(creditsData.totalPrice.toString())}`,
        ``,
        `${formatMoney(creditsData.totalIncomeRubles.toString())}`,
        `${formatMoney(creditsData.totalAccured.toString())}`,
        false
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

  return (
    <PageLayout>
      <TitleField>
        <CustomTitle>Контроль договоров</CustomTitle>
          {/* <ExportButton icon={<PrintIcon />} onClick={handlePrint}>
            Печать
          </ExportButton> */}
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
          <CustomCalendar 
            prefix="от:"
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
            value={toDate}
            onChange={(date) => {
              setToDate(date);
              setCurrentPage(1);
            }}
          />
        </InputWrapper>
        
        <InputWrapper style={{ minWidth: "500px" }}>
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
      </FilterField>

      <SecondRaw>
        <CustomInput 
          style={{ display: "flex"}}
          inputType="fullname"
          placeholder="ФИО"
          value={clientFullName}
          onChange={(e) => {
            setClientFullName(e.target.value);
            setCurrentPage(1);
          }}
        />

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

        <IncomeContainer>
          <InputTitle style={{ margin: '0 16px 0 16px' }}>Доход, руб</InputTitle>
          <CustomInput 
            style={{ maxWidth: "80px" }}
            inputType="number"
            placeholder="От"
            value={rublesIncomeFrom}
            onChange={(e) => {
              setRublesIncomeFrom(e.target.value);
              setCurrentPage(1);
            }}
          />
          <InputTitle style={{ margin: '0' }}>-</InputTitle>
          <CustomInput 
            style={{ maxWidth: "80px" }}
            inputType="number"
            placeholder="До"
            value={rublesIncomeTo}
            onChange={(e) => {
              setRublesIncomeTo(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Container style={{ margin: "20px"}}/>
          <InputTitle style={{ margin: '0 16px 0 16px' }}>Доход, %</InputTitle>
          <CustomInput 
            style={{ maxWidth: "80px" }}
            inputType="number"
            placeholder="От"
            value={percentsIncomeFrom}
            onChange={(e) => {
              setPercentsIncomeFrom(e.target.value);
              setCurrentPage(1);
            }}
          />
          <InputTitle style={{ margin: '0' }}>-</InputTitle>
          <CustomInput 
            style={{ maxWidth: "80px" }}
            inputType="number"
            placeholder="До"
            value={percentsIncomeTo}
            onChange={(e) => {
              setPercentsIncomeTo(e.target.value);
              setCurrentPage(1);
            }}
          />
        </IncomeContainer>
      </SecondRaw>
      <SecondRaw>
        <Tabs 
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
        />
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
              { name: "ФИО сотрудника", align: "left" },
              { name: "Стоимость товара", align: "right" },
              { name: "Доход, %", isSortable: true, align: "right" },
              { name: "Доход, руб", isSortable: true, align: "right" },
              { name: "Начислено", isSortable: true, align: "right" },
              { name: "isActive", isHidden: true },
              { name: "hasDebt", isHidden: true } 
            ]} 
            data={formatCreditData(creditsData?.items)}
            onSort={handleSort}
            sortConfig={sortConfig}
            onRowDoubleClick={handleRowDoubleClick}
            contextMenuActions={tableActions}
            hasTotalsRow={true}
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
        creditId={selectedCredit?.id || 0}
        clientName={selectedCredit?.clientFullName || ''}
        investorName={selectedCredit?.investorNickname || ''}
        clientPhone={selectedCredit?.clientPhone || ''}
        currentDebt={selectedCredit?.rest || 0}
        currentMonthDebt={selectedCredit?.currentMonthDebt || 0}
      />

      <ViewCreditModal
        id={viewingCreditId || 0}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />
    </PageLayout>
  );
};

const FilterField = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
`;

const InputWrapper = styled.div`
  flex: 1;  
  min-width: 0;
  position: relative;
`;

const SecondRaw = styled.div`
  display: flex;
  margin: 15px 0 0;
  gap: 15px;
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

const InputTitle = styled.p`
  color: black;
  width: 153px;
  text-align: center;
  white-space: nowrap;
`;

const IncomeContainer = styled.div`
  display: flex;
  flex-direction: row;
  max-width: 600px;
  align-items: center;
  flex-grow: 1;
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

export default CreditControlPage;