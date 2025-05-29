import { useState, useCallback, useEffect } from 'react';
import CustomTitle from '../components/ui/Text/CustomTitle';
import TitleField from '../components/ui/Layouts/TitleLayout';
import ExportButton from '../components/ui/Buttons/ExportButton';
import CustomInput from '../components/ui/fields/CustomInput';
import DateInput from '../components/ui/fields/DateInput';
import CustomTable from '../components/ui/tables/CustomTable';
import Pagination from '../components/ui/fields/CustomPagination';
import PageLayout from '../components/ui/Layouts/PageLayout';
import PrintIcon from '../assets/ui/print.svg?react';
import styled from 'styled-components';
import DarkCyanButton from '../components/ui/Buttons/DarkCyanButton';
import CreditTypes from '../components/ui/fields/CreditTypes';
import PaginationLayout from '../components/ui/Layouts/PaginationLayout';
import CountInfoTitle from '../components/ui/Text/CountInfoTitle';
import { useNavigate } from 'react-router-dom';
import useCredit from '../api/hooks/useCredit';
import type { Credit } from '../api/types/credit';
import useExport from '../api/hooks/useExport';
import creditService from '../api/services/creditService';
import { formatDate } from '../utils/dateFormatter';

const CreditPage = () => {
  const [contractNumber, setContractNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [investorName, setInvestorName] = useState('');
  const [clientFullName, setClientFullName] = useState('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  
  const itemsPerPage = 10;
  
  const columnToApiSortMap: Record<number, string> = {
    1: 'id',
    2: 'creditDate',
    3: 'clientFullName',
    4: 'phone',
    5: 'totalAmount',
    6: 'paidAmount',
    7: 'remainingAmount',
    8: 'debtAmount'
  };

  const { exportData, isExporting, exportProgress } = useExport<Credit>();
  const { isLoading, error, data: creditsData, getCredits } = useCredit();
  const navigate = useNavigate();

  const loadCredits = useCallback(async () => {
    const params = {
      page: currentPage,
      pageSize: itemsPerPage,
      creditId: contractNumber ? Number(contractNumber) : undefined,
      clientFullname: clientFullName || undefined,
      investorNick: investorName || undefined,
      dateFrom: fromDate ? new Date(fromDate) : undefined,
      dateTo: toDate ? new Date(toDate) : undefined,
      sortBy: sortConfig.key !== null ? columnToApiSortMap[sortConfig.key] : undefined,
      sortDirection: sortConfig.direction
    };

    await getCredits(params);
  }, [currentPage, contractNumber, clientFullName, investorName, fromDate, toDate, sortConfig]);

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

  const handleExport = async () => {
    try {
      await exportData({
        fetchData: async (page, pageSize) => {
          const params = {
            page,
            pageSize,
            creditId: contractNumber ? Number(contractNumber) : undefined,
            clientFullname: clientFullName || undefined,
            investorNick: investorName || undefined,
            dateFrom: fromDate ? new Date(fromDate) : undefined,
            dateTo: toDate ? new Date(toDate) : undefined,
            sortBy: sortConfig.key !== null ? columnToApiSortMap[sortConfig.key] : undefined,
            sortDirection: sortConfig.direction
          };
          
          const result = await creditService.getCredits(params);
          return {
            items: Array.isArray(result.items) ? result.items : [],
            totalCount: result.totalCount || 0
          };
        },
        fileName: 'credits_export',
        transformData: (credit) => ({
          'ID': credit.id,
          'Дата договора': credit.creditDate.toLocaleDateString(),
          'ФИО покупателя': credit.clientFullName,
          'Телефон': credit.phone || 'Нет данных',
          'Начислено': `${credit.totalAmount} ₽`,
          'Уплачено': ` ₽`,
          'Остаток': ` ₽`,
          'Долг': ` ₽`
        })
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handlePrint = () => {
    console.log('Печать данных', creditsData?.items);
  };

  const formatCreditData = (credits: Credit[] | undefined) => {
    if (!credits) return [];
    
    return credits.map(credit => [
      credit.isFavourite ? '★' : '',
      credit.id.toString(),
      formatDate(credit.creditDate),
      credit.clientFullName,
      credit.phone || 'Нет данных',
      `${credit.totalAmount} ₽`,
      ` ₽`,
      ` ₽`,
      ` ₽`
    ]);
  };

  const handleRowDoubleClick = (rowData: any[]) => {
    const [_, id] = rowData;
    navigate(`/credits/${id}`);
  };

  return (
    <PageLayout>
      <TitleField>
        <CustomTitle>Договоры</CustomTitle>
          <ExportButton icon={<PrintIcon />} onClick={handlePrint}>
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
          <DateInput 
            prefix="от:"
            value={fromDate}
            onChange={(date) => {
              setFromDate(date);
              setCurrentPage(1);
            }}
          />
        </InputWrapper>
        
        <InputWrapper>
          <DateInput 
            prefix="до:"
            value={toDate}
            onChange={(date) => {
              setToDate(date);
              setCurrentPage(1);
            }}
          />
        </InputWrapper>
        
        <InputWrapper style={{ minWidth: "500px" }}>
          <CustomInput
            inputType="text"
            placeholder="Инвестор"
            value={investorName}
            onChange={(e) => {
              setInvestorName(e.target.value);
              setCurrentPage(1);
            }}
          />
        </InputWrapper>
      </FilterField>

      <SecondRaw style={{ color: "white" }}>
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
        <DarkCyanButton 
          style={{ marginLeft: "auto", width: "15vw"}}
          onClick={() => navigate('/new-credit')}
        >
          + Новый договор
        </DarkCyanButton>
      </SecondRaw>

      <CreditTypes />

      {isLoading && <div>Загрузка...</div>}
      {error && <div>Ошибка: {error}</div>}
      
      {!isLoading && !error && (
        <>
          <CustomTable 
            columns={[
              { name: "" },
              { name: "№", isSortable: true },
              { name: "Дата договора", isSortable: true },
              { name: "ФИО покупателя", isSortable: true },
              { name: "Телефон", isSortable: true },
              { name: "Начислено", isSortable: true },
              { name: "Уплачено", isSortable: true },
              { name: "Остаток", isSortable: true },
              { name: "Долг", isSortable: true },
            ]} 
            data={formatCreditData(creditsData?.items)}
            onSort={handleSort}
            sortConfig={sortConfig}
            onRowDoubleClick={handleRowDoubleClick}
          />

          <PaginationLayout>
            <CountInfoTitle 
              total={creditsData?.totalCount || 0} 
            />
            
            <Pagination
              total={creditsData?.totalCount || 0}
              current={currentPage}
              onChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
            />
          </PaginationLayout>
        </>
      )}
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
  width: 100%;
  margin: 15px 0;
  background-color: transparent;
`;

export default CreditPage;