import { useState, useCallback, useEffect } from 'react';
import BaseModal from './BASE/modalCRUBase';
import CustomInput from '../ui/fields/CustomInput';
import CustomTable from '../ui/fields/CustomTable';
import DarkCyanButton from '../ui/Buttons/DarkCyanButton';
import useClients from '../../api/hooks/useClient';
import Pagination from '../ui/fields/CustomPagination';
import styled from 'styled-components';
import { formatDate } from '../../utils/dateFormatter';

interface ClientSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (client: { id: number; fullName: string; phone: string }) => void;
  hideSaveButton?: boolean;
  width?: string;
}

const ClientSelectModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  hideSaveButton = true, 
  width = "800px" 
}: ClientSelectModalProps) => {
  const [nameFilter, setNameFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const pageSize = 8;
  
  const columnToApiSortMap: Record<number, string> = {
    0: 'id',
    1: 'fullName',
    3: 'birthdate'
  };
  
  const { 
    isLoading, 
    error, 
    data: clientsData, 
    getClients
  } = useClients();
  
  const loadClients = useCallback(async () => {
    const params: any = {
      page: currentPage,
      pageSize,
      FullName: nameFilter || undefined
    };

    if (sortConfig.key !== null) {
      params.sortBy = columnToApiSortMap[sortConfig.key];
      params.sortDirection = sortConfig.direction;
    }

    await getClients(params);
  }, [currentPage, nameFilter, sortConfig, getClients]);
  
  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen, currentPage, nameFilter, sortConfig, loadClients]);

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

  const handleRowDoubleClick = (rowData: any[], rowIndex: number) => {
    const client = clientsData?.items[rowIndex];
    if (client) {
      onSubmit({
        id: client.id,
        fullName: client.fullName,
        phone: client.phone
      });
    }
  };

  const tableData = clientsData?.items?.map(client => [
    client.id.toString(),
    client.fullName,
    client.phone,
    formatDate(client.birthdate),
  ]) || [];

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Выбор клиента"
      onClose={onClose}
      onCancel={onClose}
      hideSaveButton={hideSaveButton}
      width={width}
    >
      <ModalContent>
        <FilterContainer>
          <CustomInput 
          style={{ maxWidth: '900px' }}
            inputType="fullname"
            placeholder="Поиск по ФИО"
            value={nameFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
          />
        </FilterContainer>
        
        {isLoading && <LoadingMessage>Загрузка клиентов...</LoadingMessage>}
        {error && <ErrorMessage>Ошибка загрузки: {error}</ErrorMessage>}
        
        {!isLoading && !error && (
          <>
            <TableContainer>
              <CustomTable 
                columns={[
                  { name: "ID", isSortable: true },
                  { name: "ФИО", isSortable: true },
                  { name: "Телефон" },
                  { name: "Дата рождения", isSortable: true },
                ]} 
                data={tableData}
                onRowDoubleClick={handleRowDoubleClick}
                onSort={handleSort}
                sortConfig={sortConfig}
              />
            </TableContainer>
            
            <PaginationContainer>
              <Pagination
                total={clientsData?.totalCount || 0}
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

export default ClientSelectModal;