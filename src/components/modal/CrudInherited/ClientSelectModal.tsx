import { useState, useCallback, useEffect } from 'react';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import CustomTable from '../../ui/tables/CustomTable';
import DarkCyanButton from '../../ui/Buttons/DarkCyanButton';
import useClients from '../../../api/hooks/useClient';
import Pagination from '../../ui/fields/CustomPagination';
import styled from 'styled-components';
import { formatDate } from '../../../utils/dateFormatter';
import ClientModal from './ClientModal';
import { useAuth } from '../../../сontext/AuthContext';
import type { Client } from '../../../api/types/client';

interface ClientSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (client: { id: number; fullName: string; phone: string }) => void;
  width?: string;
  title?: string;
}

const ClientSelectModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  width = "832px",
  title,
}: ClientSelectModalProps) => {
  const [nameFilter, setNameFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [selectedClient, setSelectedClient] = useState<{
    id: number;
    fullName: string;
    phone: string;
  } | null>(null);
  const [creatingClient, setCreatingClient] = useState<Client | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const pageSize = 5;
  
  const columnToApiSortMap: Record<number, string> = {
    0: 'id',
    1: 'fullName',
    3: 'birthdate'
  };
  
  const { 
    isLoading, 
    error, 
    data: clientsData, 
    getClients,
    createClient
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
      setSelectedClient(null);
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

  const handleRowClick = (rowData: any[], rowIndex: number) => {
    const client = clientsData?.items[rowIndex];
    if (client) {
      setSelectedClient({
        id: client.id,
        fullName: client.fullName,
        phone: client.phone
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClient) {
      onSubmit(selectedClient);
      onClose();
    }
  };

  const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  };

  const handleCreateClient = () => {
    setIsCreateModalOpen(true);
  };

  const handleSubmitNewClient = async (clientData: any): Promise<boolean> => {
    try {
      console.log(clientData.secondPhone);
      await createClient({
        fullName: clientData.fullName,
        phone: clientData.phone,
        birthdate: clientData.birthdate ? parseDateString(clientData.birthdate) : null,
        doc: clientData.doc || undefined,
        docIssueDate: clientData.docIssueDate ? parseDateString(clientData.docIssueDate) : undefined,
        docIssueYear: clientData.docIssueYear || 0,
        registrationAddress: clientData.registrationAddress || '',
        secondPhone: clientData.secondPhone || '',
        creditIds: null,
        creditRestTerms: null
      });
      
      loadClients();
      setIsCreateModalOpen(false);
      return true;
    } catch (error) {
      console.error('Error creating client:', error);
      return false;
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
    <>
      <BaseModal
        title={title || "Выбор клиента"}
        onClose={onClose}
        onCancel={onClose}
        onSave={handleSubmit}
        isSaveDisabled={!selectedClient}
        saveButtonText="Выбрать"
        width={width}
      >
        <ModalContent>
          <FilterContainer>
            <CustomInput 
              style={{ maxWidth: "none" }}
              inputType="fullname"
              placeholder="Поиск по ФИО"
              value={nameFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
            />
            <DarkCyanButton 
              style={{ marginLeft: '16px', width: "auto" }}
              onClick={handleCreateClient}
            >
              + Добавить
            </DarkCyanButton>
          </FilterContainer>
          
          {isLoading && <LoadingMessage>Загрузка клиентов...</LoadingMessage>}
          {error && <ErrorMessage>Ошибка загрузки: {error}</ErrorMessage>}
          
          {!isLoading && !error && (
            <>
              <TableContainer>
                <CustomTable 
                  columns={[
                    { name: "ID", isSortable: true, align: "left" },
                    { name: "ФИО", isSortable: true, align: "left" },
                    { name: "Телефон", align: "left" },
                    { name: "Дата рождения", isSortable: true, align: "right" },
                  ]} 
                  data={tableData}
                  onRowClick={handleRowClick}
                  onSort={handleSort}
                  sortConfig={sortConfig}
                  selectedRow={selectedClient ? tableData.findIndex(row => row[0] === selectedClient.id.toString()) : -1}
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

      <ClientModal
        mode="create"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleSubmitNewClient}
        initialData={ 
          creatingClient || {
                    id: 0,
                    fullName: '',
                    phone: '',
                    secondPhone: '',
                    doc: '',
                    birthdate: null,
                    docIssueDate: null,
                    docIssueYear: 0,
                    registrationAddress: ''
                }}
      />
    </>
  );
};

const ModalContent = styled.div`
  padding: 20px;
`;

const FilterContainer = styled.div`
  margin-bottom: 16px;
  display: flex;
  align-items: center;
`;

const TableContainer = styled.div`
  margin-bottom: 16px;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 0;
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