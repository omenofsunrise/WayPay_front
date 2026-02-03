import { useState, useCallback, useEffect } from 'react';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import DarkCyanButton from '../../ui/Buttons/DarkCyanButton';
import useClients from '../../../api/hooks/useClient';
import Pagination from '../../ui/fields/CustomPagination';
import styled from 'styled-components';
import { formatDate } from '../../../utils/dateFormatter';
import ClientModal from './ClientModal';
import { useAuth } from '../../../сontext/AuthContext';
import type { Client } from '../../../api/types/client';
import PhoneModalInput from '../../ui/fields/PhoneModalInput';
import ClientCard from '../../ui/cards/ClientCard';

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
  width = "900px",
  title,
}: ClientSelectModalProps) => {
  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
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
  const [searchTriggered, setSearchTriggered] = useState(false);
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
    const shouldSearch = searchTriggered && (
      nameFilter.length >= 5 || 
      (phoneFilter.replace(/\D/g, '').length >= 11 && phoneFilter.replace(/\D/g, '').length <= 15)
    );

    if (!shouldSearch && searchTriggered) {
      return;
    }

    const params: any = {
      page: currentPage,
      pageSize,
      FullName: nameFilter || undefined,
      Phone: phoneFilter || undefined
    };

    if (sortConfig.key !== null) {
      params.sortBy = columnToApiSortMap[sortConfig.key];
      params.sortDirection = sortConfig.direction;
    }

    await getClients(params);
  }, [currentPage, nameFilter, phoneFilter, sortConfig, getClients, searchTriggered]);
  
  useEffect(() => {
    if (isOpen) {
      if (searchTriggered) {
        loadClients();
      }
      setSelectedClient(null);
    }
  }, [isOpen, currentPage, searchTriggered, sortConfig, loadClients]);

  // Сброс фильтров при очистке полей
  useEffect(() => {
    if (nameFilter === '' && phoneFilter === '' && searchTriggered) {
      setSearchTriggered(false);
      setCurrentPage(1);
    }
  }, [nameFilter, phoneFilter, searchTriggered]);

  const handleFilterChange = (value: string) => {
    setNameFilter(value);
    setCurrentPage(1);
    setSearchTriggered(false);
  };

  const handlePhoneFilterChange = (value: string) => {
    setPhoneFilter(value);
    setCurrentPage(1);
    setSearchTriggered(false);
  };

  const handleSearch = () => {
    setSearchTriggered(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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

  const handleClientCardClick = (client: ClientCardType) => {
    setSelectedClient({
      id: client.id,
      fullName: client.fullName,
      phone: client.phone
    });
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

  const transformClientData = (client: any): ClientCardType => ({
    id: client.id,
    fullName: client.fullName,
    phone: client.phone,
    secondPhone: client.secondPhone || null,
    doc: client.doc || '',
    birthdate: client.birthdate ? new Date(client.birthdate) : null,
    docIssueDate: client.docIssueDate ? new Date(client.docIssueDate) : null,
    docIssueYear: client.docIssueYear || null,
    registrationAddress: client.registrationAddress || null,
    creditIds: client.creditIds || null,
    creditRestTerms: client.creditRestTerms || null,
    hasPassportPhoto: client.hasPassportPhoto || null,
    blacklist: client.blacklist || false
  });

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
              placeholder="Поиск по ФИО (минимум 5 символов)"
              value={nameFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <PhoneModalInput 
              placeholder="Телефон (полный номер)"
              value={phoneFilter}
              onChange={(e) => handlePhoneFilterChange(e.target.value)}
              onKeyPress={handleKeyPress}
              name="phone"
              style={{ marginLeft: '16px', maxWidth: "none" }}
            />
            <DarkCyanButton 
              style={{ marginLeft: '16px', width: "auto" }}
              onClick={handleSearch}
              disabled={!(nameFilter.length >= 5 || phoneFilter.replace(/\D/g, '').length >= 11)}
            >
              Поиск
            </DarkCyanButton>
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
              {!searchTriggered ? (
                <SearchPrompt>
                  <SearchIcon>🔍</SearchIcon>
                  <SearchText>Введите данные для поиска клиента</SearchText>
                  <SearchHint>Для поиска введите минимум 5 символов в поле ФИО или полный номер телефона</SearchHint>
                </SearchPrompt>
              ) : (
                <>
                  <CardsContainer>
                    {clientsData?.items?.map((client: any) => (
                      <ClientCardWrapper 
                        key={client.id} 
                        $isSelected={selectedClient?.id === client.id}
                        onClick={() => handleClientCardClick(transformClientData(client))}
                      >
                        <ClientCard 
                          client={transformClientData(client)}
                          onEdit={() => {}} // Пустые функции, так как в модальном окне редактирование не нужно
                          onDelete={() => {}}
                          onRightClick={() => {}}
                          onOpenDossier={() => {}}
                          showMenu={false} // Скрываем меню в модальном окне выбора
                        />
                      </ClientCardWrapper>
                    ))}
                  </CardsContainer>
                </>
              )}
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
  gap: 10px;
`;

const CardsContainer = styled.div`
  margin-bottom: 16px;
  max-height: 500px;
  overflow-y: auto;
`;

const ClientCardWrapper = styled.div<{ $isSelected: boolean }>`
  position: relative;
  margin-bottom: 10px;
  margin-top: 10px;
  cursor: pointer;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px solid ${props => props.$isSelected ? '#007D88' : 'transparent'};
    border-radius: 12px;
    pointer-events: none;
    z-index: 1;
  }
  
  &:hover {
    transform: translateY(-2px);
    transition: transform 0.2s;
  }
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

const SearchPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #666;
`;

const SearchIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const SearchText = styled.div`
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const SearchHint = styled.div`
  font-size: 14px;
  color: #888;
`;

export default ClientSelectModal;