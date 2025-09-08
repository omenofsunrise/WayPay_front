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
import CreditTypes from '../components/ui/fields/CreditTypes';
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
import CustomCalendar from '../components/ui/fields/CustomCalendar';
import { useAuth } from '../сontext/AuthContext';
import PrintOptionModal from '../components/modal/PrintOptionModal';
import DocxGenerator from '../utils/docxGenerator';
import InvestorSelect from '../components/ui/fields/InvestorSelect';

interface EmptyStarIconProps {
  isSelected?: boolean;
}

const CreditPage = () => {
  const [contractNumber, setContractNumber] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [investorName, setInvestorName] = useState('');
  const [clientFullName, setClientFullName] = useState('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'desc' });
  const itemsPerPage = 10;
  const [filters, setFilters] = useState<{ isFavourite?: boolean; isActive?: boolean }>({});
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCreditId, setViewingCreditId] = useState<number | null>(null);
  const { createPayment } = usePayment();
  const columnToApiSortMap: Record<number, string> = {
    1: 'id',
    2: 'date',
    3: 'client',
    5: 'accured',
    6: 'payed',
    7: 'rest',
    8: 'debt'
  };
  const { hasPermission, forbiddenRole } = useAuth();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const { exportData, isExporting, exportProgress } = useExport<Credit>();
  const { isLoading, error, data: creditsData, getCredits, toggleFavourite, getDocsData } = useCredit();
  const navigate = useNavigate();
  const [selectedCreditForPrint, setSelectedCreditForPrint] = useState<Credit | null>(null);

  const handleRowClick = (rowData: any[], rowIndex: number) => {
    const [_, id] = rowData;
    const credit = creditsData?.items.find(c => c.id === Number(id));
    if (credit) {
    setSelectedCreditForPrint(credit);
    }
  };

  const handlePrintOptionSelect = async (option: 'sale' | 'schedules' | 'guaranteeConsent') => {
    if (!selectedCreditForPrint) return;
    
    try {
      const docxGenerator = new DocxGenerator(getDocsData);
      
      if (option === 'sale') {
        await docxGenerator.generateFromCreditData(selectedCreditForPrint.id);
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
    } catch (error) {
      console.error('Ошибка при генерации документа:', error);
      alert('Произошла ошибка при генерации документа');
    }
    
    setIsPrintModalOpen(false);
  };

  const loadCredits = useCallback(async () => {
    const params = {
          page: currentPage,
          pageSize: itemsPerPage,
          creditId: contractNumber ? Number(contractNumber) : undefined,
          clientFullname: clientFullName || undefined,
          investorNickname: investorName || undefined,
          dateFrom: fromDate ? new Date(fromDate) : undefined,
          dateTo: toDate ? new Date(toDate) : undefined,
          sortBy: sortConfig.key !== null ? columnToApiSortMap[sortConfig.key] : undefined,
          sortDirection: sortConfig.direction,
          ...filters
      };

      await getCredits(params);
  }, [currentPage, clientFullName, investorName, fromDate, toDate, sortConfig, filters, contractNumber]);

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

  const handleTabChange = (newFilters: { isFavourite?: boolean; isActive?: boolean }) => {
      setFilters(newFilters);
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
  }) => {
    try {
      if (!selectedCreditForPrint) return;
      
      const paymentRequest = {
        creditId: selectedCreditForPrint.id,
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
      label: 'Удалить',
      action: handleDeleteCredit,
      color: '#EF4444',
      shouldShow: () => (hasPermission('DELETE_CREDITS') && forbiddenRole("бухгалтер"))
    }
  ];

  const handleExport = async () => {
    try {
      await exportData({
        fetchData: async (page, pageSize) => {
          const params = {
            page,
            pageSize,
            creditId: contractNumber ? Number(contractNumber) : undefined,
            clientFullname: clientFullName || undefined,
            investorNickname: investorName || undefined,
            dateFrom: fromDate ? new Date(fromDate) : undefined,
            dateTo: toDate ? new Date(toDate) : undefined,
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
            'Начислено': formatMoney(credit.totalAmount?.toString() || '0'),
            'Уплачено': formatMoney(credit.payed?.toString() || '0'),
            'Остаток': formatMoney(credit.rest?.toString() || '0'),
            'Долг': formatMoney(credit.debt?.toString() || '0')
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
      credit.clientPhone || 'Нет данных',
      `${formatMoney(credit.accured?.toString() || '')}`,
      `${formatMoney(credit.payed.toString())}`,
      `${formatMoney(credit.rest.toString())}`,
      `${formatMoney(credit.debt.toString())}`,
      credit.isActive
    ]);

    if (credits.length > 0) {
      const totalsRow = [
        '',
        '',
        '',
        '',
        'Итого',
        `${formatMoney(creditsData.totalAccured.toString())}`,
        `${formatMoney(creditsData.totalPayed.toString())}`,
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
            inputType="number"
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

      </FilterField>

      <SecondRaw style={{ color: "white" }}>
        <CreditTypes onTabChange={handleTabChange} />
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
              { name: "Телефон", align: "left" },
              { name: "Начислено", isSortable: true, align: "right" },
              { name: "Уплачено", isSortable: true, align: "right" },
              { name: "Остаток", isSortable: true, align: "right" },
              { name: "Долг", isSortable: true, align: "right" },
              { name: "isActive", isHidden: true, align: "right" }
            ]} 
            data={formatCreditData(creditsData?.items)}
            onSort={handleSort}
            sortConfig={sortConfig}
            onRowDoubleClick={handleRowDoubleClick}
            onRowClick={handleRowClick}
            selectedRow={selectedCreditForPrint ? creditsData?.items.findIndex(c => c.id === selectedCreditForPrint.id) : null}
            contextMenuActions={tableActions}
            hasTotalsRow={true}
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
      />

      <ViewCreditModal
        id={viewingCreditId || 0}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />  

      <PrintOptionModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onSelect={handlePrintOptionSelect}
        selectedCredit={selectedCreditForPrint}
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

export default CreditPage;