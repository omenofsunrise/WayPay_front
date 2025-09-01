import { useState, useCallback, useEffect } from 'react';
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import CustomInput from "../components/ui/fields/CustomInput";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import ClientModal from "../components/modal/CrudInherited/ClientModal";
import useClients from "../api/hooks/useClient";
import type { ClientForm } from '../api/types/client';
import { formatDate } from '../utils/dateFormatter';
import PhoneModalInput from '../components/ui/fields/PhoneModalInput';
import { Container } from 'react-bootstrap';
import styled from 'styled-components';
import ClientCard from '../components/ui/cards/ClientCard';

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ClientCount = styled.span`
  font-size: 16px;
  color: #6B7280;
  font-weight: 500;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #6B7280;
`;

const EmptyStateIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyStateTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
`;

const EmptyStateText = styled.p`
  font-size: 16px;
  margin-bottom: 24px;
  max-width: 500px;
  line-height: 1.5;
`;

const SearchTips = styled.div`
  background-color: #F9FAFB;
  border-radius: 8px;
  padding: 16px;
  margin-top: 24px;
  text-align: left;
  max-width: 500px;
`;

const SearchTipsTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
`;

const SearchTipsList = styled.ul`
  font-size: 14px;
  padding-left: 20px;
  margin: 0;
`;

const SearchTipsItem = styled.li`
  margin-bottom: 4px;
  line-height: 1.4;
`;

const ResetButton = styled.button`
  background: none;
  border: none;
  color: #6B7280;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
  margin-left: 16px;
  
  &:hover {
    color: #374151;
  }
`;

const FilterControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface Client {
  id: number;
  fullName: string;
  phone: string;
  secondPhone?: string;
  doc: string;
  birthdate: Date | null;
  docIssueDate: Date | null;
  docIssueYear: number;
  registrationAddress: string | null;
  creditIds?: string[];
  creditRestTerms?: string[];
}

const ClientPage = () => {
    const [nameFilter, setNameFilter] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        key: number | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [phoneFilter, setPhoneFilter] = useState('');
    const [searchTriggered, setSearchTriggered] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

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
        createClient,
        updateClient,
        deleteClient,
        checkClientCredits
    } = useClients();
    
    // Функция сброса всех фильтров
    const resetFilters = useCallback(() => {
        setNameFilter('');
        setPhoneFilter('');
        setSearchTriggered(false);
        setHasSearched(false);
        setSortConfig({ key: null, direction: 'asc' });
    }, []);

    const loadClients = useCallback(async () => {
        const shouldSearch = searchTriggered && (
            nameFilter.length >= 5 || 
            (phoneFilter.replace(/\D/g, '').length >= 11 && phoneFilter.replace(/\D/g, '').length <= 15)
        );

        if (!shouldSearch && searchTriggered) {
            return;
        }

        const params: any = {
            page: 1,
            pageSize: 1000,
            FullName: nameFilter || undefined,
            Phone: phoneFilter || undefined
        };

        if (sortConfig.key !== null) {
            params.sortBy = columnToApiSortMap[sortConfig.key];
            params.sortDirection = sortConfig.direction;
        }

        await getClients(params);
        setHasSearched(true);
    }, [nameFilter, phoneFilter, sortConfig, getClients, searchTriggered]);
    
    const handlePhoneFilterChange = (value: string) => {
        setPhoneFilter(value);
        setSearchTriggered(false);
        
        // Автоматический сброс поиска при очистке всех полей
        if (!value && !nameFilter) {
            resetFilters();
        }
    };

    useEffect(() => {
        if (searchTriggered) {
            loadClients();
        }
    }, [searchTriggered, loadClients]);

    const handleFilterChange = (value: string) => {
        setNameFilter(value);
        setSearchTriggered(false);
        
        // Автоматический сброс поиска при очистке всех полей
        if (!value && !phoneFilter) {
            resetFilters();
        }
    };

    const handleSearch = () => {
        setSearchTriggered(true);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleCreateClient = () => {
        setModalMode('create');
        setSelectedClient({
            id: 0,
            fullName: '',
            phone: '',
            secondPhone: '',
            doc: '',
            birthdate: null,
            docIssueDate: null,
            docIssueYear: 0,
            registrationAddress: '',
        });
        setIsModalOpen(true);
    };

    const handleEditClient = (client: Client) => {
        setModalMode('edit');
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    const handleDeleteClient = async (client: Client) => {
        if (await checkClientCredits(client.id)) {
            alert('Нельзя удалить клиента, привязанного к договору');
            return;
        }

        if (window.confirm('Вы уверены, что хотите удалить этого клиента?')) {
            try {
                await deleteClient(client.id);
                loadClients();
            } catch (err) {
                console.error('Ошибка при удалении клиента:', err);
            }
        }
    };

    const handleSubmitClient = async (
        clientData: Omit<ClientForm, 'doc' | 'docIssueDate'> | ClientForm
    ): Promise<boolean> => {
        try {
            const parseDate = (dateStr: string): Date | null => {
                if (!dateStr) return null;
                const [day, month, year] = dateStr.split('.').map(Number);
                return new Date(year, month - 1, day);
            };

            const apiData = {
                fullName: clientData.fullName,
                phone: clientData.phone,
                secondPhone: clientData.secondPhone || undefined,
                birthdate: parseDate(clientData.birthdate),
                doc: (clientData as ClientForm).doc || undefined,
                docIssueDate: parseDate((clientData as ClientForm).docIssueDate || '') || undefined,
                docIssueYear: (clientData as ClientForm).docIssueDate || 0,
                registrationAddress: clientData.registrationAddress,
            };

            if (modalMode === 'create') {
                await createClient(apiData);
            } else if (modalMode === 'edit' && selectedClient?.id) {
                await updateClient(selectedClient.id, apiData);
            }
            
            loadClients();
            setIsModalOpen(false);
            return true;
        } catch (error: any) {            
            return false;
        }
    };

    // Функция для отображения состояния
    const renderContent = () => {
        if (isLoading) {
            return <div>Загрузка...</div>;
        }

        if (error) {
            return <div>{error}</div>;
        }

        if (!hasSearched) {
            return (
                <EmptyStateContainer>
                    <EmptyStateIcon>👥</EmptyStateIcon>
                    <EmptyStateTitle>Начните поиск клиентов</EmptyStateTitle>
                    <EmptyStateText>
                        Введите ФИО клиента (минимум 5 символов) или полный номер телефона для поиска в базе данных.
                    </EmptyStateText>
                </EmptyStateContainer>
            );
        }

        if (clientsData && clientsData.items.length === 0) {
            return (
                <EmptyStateContainer>
                    <EmptyStateIcon>🔍</EmptyStateIcon>
                    <EmptyStateTitle>Клиент не найден</EmptyStateTitle>
                    <EmptyStateText>
                        По вашему запросу "{nameFilter || phoneFilter}" ничего не найдено. 
                        Попробуйте изменить критерии поиска или добавьте нового клиента.
                    </EmptyStateText>
                    <DarkCyanButton onClick={handleCreateClient}>
                        + Добавить нового клиента
                    </DarkCyanButton>
                    <ResetButton onClick={resetFilters} style={{ marginTop: '16px' }}>
                        Сбросить фильтры
                    </ResetButton>
                </EmptyStateContainer>
            );
        }

        return (
            <div>
                <FilterControls>
                    {hasSearched && (
                        <ResetButton onClick={resetFilters}>
                            Сбросить фильтры
                        </ResetButton>
                    )}
                </FilterControls>
                {clientsData?.items.map((client) => (
                    <ClientCard 
                        key={client.id} 
                        client={client}
                        onEdit={handleEditClient}
                        onDelete={handleDeleteClient}
                    />
                ))}
            </div>
        );
    };

    return (
        <PageLayout>
            <TitleField>
                <TitleContainer>
                    <CustomTitle>Клиенты</CustomTitle>
                    {clientsData && clientsData.items.length > 0 && (
                        <ClientCount>({clientsData.totalCount})</ClientCount>
                    )}
                </TitleContainer>
            </TitleField>
            
            <FilterField>
                <Container style={{display: "flex", flexDirection: "row", width: "40vw", gap: "15px" }}>
                    <CustomInput 
                        inputType="fullname"
                        placeholder="ФИО клиента (минимум 5 символов)"
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
                    />
                    <DarkCyanButton 
                        onClick={handleSearch}
                        disabled={!(nameFilter.length >= 5 || phoneFilter.replace(/\D/g, '').length >= 11)}
                    >
                        Поиск
                    </DarkCyanButton>
                </Container>
                <DarkCyanButton 
                    style={{ width: "25vw", marginLeft: "auto" }}
                    onClick={handleCreateClient}
                >
                    + Добавить
                </DarkCyanButton>
            </FilterField>
            
            {renderContent()}
            
            <ClientModal
                mode={modalMode}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitClient}
                initialData={selectedClient || {
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
        </PageLayout>
    );
};

export default ClientPage;