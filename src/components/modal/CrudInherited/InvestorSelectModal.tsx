import { useState, useCallback, useEffect } from 'react';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import CustomTable from '../../ui/tables/CustomTable';
import DarkCyanButton from '../../ui/Buttons/DarkCyanButton';
import useInvestor from '../../../api/hooks/useInvestor';
import Pagination from '../../ui/fields/CustomPagination';
import styled from 'styled-components';
import { formatMoney } from '../../../utils/formatPrice';

interface InvestorSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (investor: { 
    id: number; 
    nickname: string; 
    fullName: string; 
    phoneNumber: string;
    investorPie: number;
    investmentAmount: number;
    balance: number;
  }) => void;
  width?: string;
}

const InvestorSelectModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  width = "1000px" 
}: InvestorSelectModalProps) => {
  const [nameFilter, setNameFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [selectedInvestor, setSelectedInvestor] = useState<{
    id: number;
    nickname: string;
    fullName: string;
    phoneNumber: string;
    investorPie: number;
    investmentAmount: number;
    balance: number;
  } | null>(null);
  
  const pageSize = 8;
  
  const columnToApiSortMap: Record<number, string> = {
    0: 'id',
    3: 'investor_pie',
    4: 'balance'
  };
  
  const { 
    isLoading, 
    error, 
    data: investorsData, 
    getInvestors
  } = useInvestor();
  
  const loadInvestors = useCallback(async () => {
    const params: any = {
      page: currentPage,
      pageSize,
      search: nameFilter || undefined
    };

    if (sortConfig.key !== null) {
      params.sortBy = columnToApiSortMap[sortConfig.key];
      params.sortDirection = sortConfig.direction;
    }

    await getInvestors(params);
  }, [currentPage, nameFilter, sortConfig, getInvestors]);
  
  useEffect(() => {
    if (isOpen) {
      loadInvestors();
      setSelectedInvestor(null);
    }
  }, [isOpen, currentPage, nameFilter, sortConfig, loadInvestors]);

  const handleFilterChange = (value: string) => {
    setNameFilter(value);
    setCurrentPage(1);
  };

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

  const handleRowClick = (rowData: any[], rowIndex: number) => {
    const investor = investorsData?.items[rowIndex];
    if (investor) {
      setSelectedInvestor({
        id: investor.id,
        nickname: investor.nickname,
        fullName: investor.fullName,
        phoneNumber: investor.phoneNumber,
        investorPie: investor.investorPie,
        investmentAmount: investor.investmentAmount,
        balance: investor.balance
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvestor) {
      onSubmit(selectedInvestor);
      onClose();
    }
  };

  const tableData = investorsData?.items?.map(investor => [
    investor.id.toString(),
    investor.nickname,
    investor.phoneNumber,
    investor.investorPie.toString() + "%",
    formatMoney(investor.balance.toString()),
  ]) || [];

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Выбор инвестора"
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSaveDisabled={!selectedInvestor}
      saveButtonText="Выбрать"
      width={width}
    >
      <ModalContent>
        <FilterContainer>
          <CustomInput 
            style={{ maxWidth: "none" }}
            inputType="fullname"
            placeholder="Поиск по никнейму"
            value={nameFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
          />
        </FilterContainer>
        
        {isLoading && <LoadingMessage>Загрузка инвесторов...</LoadingMessage>}
        {error && <ErrorMessage>Ошибка загрузки: {error}</ErrorMessage>}
        
        {!isLoading && !error && (
          <>
            <TableContainer>
              <CustomTable 
                columns={[
                  { name: "ID", isSortable: true, align: "left" },
                  { name: "Никнейм", align: "left" },
                  { name: "Телефон", align: "left" },
                  { name: "Доля", align: "left", isSortable: true },
                  { name: "Касса", isSortable: true, align: "right" },
                ]} 
                data={tableData}
                onRowClick={handleRowClick}
                onSort={handleSort}
                sortConfig={sortConfig}
                selectedRow={selectedInvestor ? tableData.findIndex(row => row[0] === selectedInvestor.id.toString()) : -1}
              />
            </TableContainer>
            
            <PaginationContainer>
              <Pagination
                total={investorsData?.totalCount || 0}
                current={currentPage}
                onChange={setCurrentPage}
                itemsPerPage={pageSize}
              />
            </PaginationContainer>
          </>
        )}
      </ModalContent>
    </BaseModal>
  );
};

const ModalContent = styled.div`
  padding: 20px;
`;

const FilterContainer = styled.div`
  margin-bottom: 16px;
`;

const TableContainer = styled.div`
  margin-bottom: 16px;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

const LoadingMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
`;

const ErrorMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #ff0000;
`;

export default InvestorSelectModal;