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
import PhoneModalInput from '../components/ui/fields/PhoneModalInput';
import { Container } from 'react-bootstrap';
import styled from 'styled-components';
import ClientCard from '../components/ui/cards/ClientCard';
import ClientDossier from '../components/ui/Dossiers/ClientDossier';

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

const StickyFilterField = styled(FilterField)`
  position: sticky;
  top: 50px;
  z-index: 10;
  padding: 16px 0;
  background: none;
`;

const ResetButton = styled.button`
  background: none;
  border: 10px;
  color: black;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
  margin-left: 16px;
  height: 40px;
  padding: 0;
  width: 100px;

  &:hover {
    color: #374151;
  }
`;

const ContextMenu = styled.div<{ x: number; y: number }>`
  position: fixed;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 160px;
  padding: 4px 0;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
`;

const MenuItem = styled.div<{ danger?: boolean }>`
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: ${props => props.danger ? '#ff4d4f' : '#333'};
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
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
    const [selectedClientDossier, setSelectedClientDossier] = useState<Client | null>(null);

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
    
    const resetFilters = useCallback(() => {
        setNameFilter('');
        setPhoneFilter('');
        setSearchTriggered(false);
        setHasSearched(false);
        setSortConfig({ key: null, direction: 'asc' });
    }, []);

    const handleCardClick = (client: Client) => {
        setSelectedClientDossier(client);
    };

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
    
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        client: Client | null;
    } | null>(null);

    const handleCardRightClick = useCallback((e: React.MouseEvent, client: Client) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            client
        });
    }, []);

    const handleContextMenuAction = useCallback((action: 'edit' | 'delete') => {
        if (!contextMenu?.client) return;

        if (action === 'edit') {
            handleEditClient(contextMenu.client);
        } else if (action === 'delete') {
            handleDeleteClient(contextMenu.client);
        }

        setContextMenu(null);
    }, [contextMenu]);

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    useEffect(() => {
        const handleClickOutside = () => {
            if (contextMenu) {
                closeContextMenu();
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [contextMenu]);

    const handlePhoneFilterChange = (value: string) => {
        setPhoneFilter(value);
        setSearchTriggered(false);
        
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

    const handleOpenDossier = useCallback((client: Client) => {
        setSelectedClientDossier(client);
    }, []);

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
                {clientsData?.items.map((client) => (
                    <ClientCard 
                        key={client.id} 
                        client={client}
                        onEdit={handleEditClient}
                        onDelete={handleDeleteClient}
                        onRightClick={handleCardRightClick}
                        onOpenDossier={handleOpenDossier}
                    />
                ))}
            </div>
        );
    };

    return (
        <PageLayout onClick={closeContextMenu}>
            {selectedClientDossier ? (
            <ClientDossier
                client={selectedClientDossier}
                comments={[]}
                installments={[]}
                onBack={() => setSelectedClientDossier(null)}
                onAddComment={(comment) => console.log('Add comment:', comment)}
                onUploadPassport={(file) => console.log('Upload passport:', file)}
            />
            ) : (
            <>
            <TitleField style={{ position: "sticky"}}>
                <TitleContainer>
                    <CustomTitle>Клиенты</CustomTitle>
                    {clientsData && clientsData.items.length > 0 && (
                        <ClientCount>({clientsData.totalCount})</ClientCount>
                    )}
                </TitleContainer>
            </TitleField>
            
            <StickyFilterField>
                <Container style={{display: "flex", flexDirection: "row", width: "50vw", gap: "15px" }}>
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
                    <ResetButton onClick={resetFilters}>
                        Сбросить фильтры
                    </ResetButton>
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
            </StickyFilterField>
            
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

            {contextMenu && (
                <>
                    <Backdrop onClick={closeContextMenu} />
                    <ContextMenu x={contextMenu.x} y={contextMenu.y}>
                        <MenuItem onClick={() => handleContextMenuAction('edit')}>
                            Редактировать клиента
                        </MenuItem>
                        <MenuItem 
                            danger 
                            onClick={() => handleContextMenuAction('delete')}
                        >
                            Удалить клиента
                        </MenuItem>
                    </ContextMenu>
                </>
            )}
                        </>
            )}
        </PageLayout>
    );
};

export default ClientPage;