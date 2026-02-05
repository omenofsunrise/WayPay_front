import { useState, useCallback, useEffect } from 'react';
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import CustomInput from "../components/ui/fields/CustomInput";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import ClientSelectModal from "../components/modal/CrudInherited/ClientSelectModal";
import useBlacklist from "../api/hooks/useBlacklist";
import { useAuth } from '../сontext/AuthContext';
import { Container } from 'react-bootstrap';
import styled from 'styled-components';
import ClientCard from '../components/ui/cards/ClientCard';
import PhoneModalInput from '../components/ui/fields/PhoneModalInput';
import ClientDossier from '../components/ui/Dossiers/ClientDossier';
import CountInfoTitle from '../components/ui/Text/CountInfoTitle';
import { TitleContainer } from './BlackCatalog';
import { ClientCount } from './ClientPage';

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
  border: none;
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

const DebtBadge = styled.span`
  background-color: #EF4444;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const StyledCountInfo = styled(CountInfoTitle)`
    margin-left: auto;
`;

interface BlacklistClient {
  id: number;
  fullName: string;
  phone: string;
  birthdate: Date | null;
  debt: number;
  secondPhone?: string;
  doc?: string;
  docIssueDate?: Date | null;
  docIssueYear?: number;
  registrationAddress?: string | null;
  creditIds?: string[];
  creditRestTerms?: string[];
  hasPassportPhoto?: boolean;
}

const BlacklistPage = () => {
    const [nameFilter, setNameFilter] = useState('');
    const [phoneFilter, setPhoneFilter] = useState('');
    const [searchTriggered, setSearchTriggered] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const { hasRole } = useAuth();
    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
    const [selectedClientDossier, setSelectedClientDossier] = useState<BlacklistClient | null>(null);
    
    // Добавляем состояние для общего количества клиентов в черном списке
    const [totalBlacklistCount, setTotalBlacklistCount] = useState<number>(0);
    
    const { 
        isLoading, 
        error, 
        data: blacklistData, 
        getBlacklist,
        addBlacklist,
        deleteFromBlacklist
    } = useBlacklist();
    
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        client: BlacklistClient | null;
    } | null>(null);

    // Загружаем общее количество клиентов в черном списке при инициализации
    useEffect(() => {
        const loadTotalBlacklistCount = async () => {
            try {
                // Делаем запрос с минимальными параметрами только для получения количества
                const params = {
                    page: 1,
                    pageSize: 0, // Минимальный размер страницы, так как нам нужен только totalCount
                    fullName: undefined,
                    phone: undefined
                };

                const response = await getBlacklist(params);
                setTotalBlacklistCount(response.totalCount || 0);
            } catch (err) {
                console.error('Ошибка при загрузке общего количества клиентов в черном списке:', err);
                setTotalBlacklistCount(0);
            }
        };

        loadTotalBlacklistCount();
    }, []); // Пустой массив зависимостей - выполнится только при монтировании

    const resetFilters = useCallback(() => {
        setNameFilter('');
        setPhoneFilter('');
        setSearchTriggered(false);
        setHasSearched(false);
    }, []);

    const loadBlacklist = useCallback(async () => {
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
            fullName: nameFilter || undefined,
            phone: phoneFilter || undefined
        };

        await getBlacklist(params);
        setHasSearched(true);
    }, [nameFilter, phoneFilter, getBlacklist, searchTriggered]);

    useEffect(() => {
        if (searchTriggered) {
            loadBlacklist();
        }
    }, [searchTriggered, loadBlacklist]);

    const handlePhoneFilterChange = (value: string) => {
        setPhoneFilter(value);
        setSearchTriggered(false);
        
        if (!value && !nameFilter) {
            resetFilters();
        }
    };

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

    const handleCardRightClick = useCallback((e: React.MouseEvent, client: BlacklistClient) => {
        e.preventDefault();
        if (hasRole('суперадмин')) {
            setContextMenu({
                x: e.clientX,
                y: e.clientY,
                client
            });
        }
    }, [hasRole]);

    const handleContextMenuAction = useCallback((action: 'delete') => {
        if (!contextMenu?.client) return;

        if (action === 'delete') {
            handleDeleteFromBlacklist(contextMenu.client);
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

    const handleDeleteFromBlacklist = async (client: BlacklistClient) => {
        if (window.confirm('Вы уверены, что хотите убрать этого клиента из чёрного списка?')) {
            try {
                await deleteFromBlacklist(client.id);
                loadBlacklist();
                // Обновляем общее количество после удаления
                setTotalBlacklistCount(prev => prev - 1);
            } catch (err) {
                console.error('Ошибка при удалении клиента:', err);
            }
        }
    };

    const handleAddToBlacklist = () => {
        setIsSelectModalOpen(true);
    };

    const handleClientSelect = async (client: { id: number; fullName: string; phone: string }) => {
        try {
            await addBlacklist(client.id);
            loadBlacklist();
            // Обновляем общее количество после добавления
            setTotalBlacklistCount(prev => prev + 1);
            setIsSelectModalOpen(false);
        } catch (err) {
            console.error('Ошибка при добавлении в черный список:', err);
        }
    };

    const handleOpenDossier = useCallback((client: BlacklistClient) => {
        setSelectedClientDossier(client);
    }, []);

    const handleCardClick = (client: BlacklistClient) => {
        setSelectedClientDossier(client);
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
                    <EmptyStateIcon>🚫</EmptyStateIcon>
                    <EmptyStateTitle>Поиск в чёрном списке</EmptyStateTitle>
                    <EmptyStateText>
                        Введите ФИО клиента (минимум 5 символов) или полный номер телефона для поиска в чёрном списке.
                    </EmptyStateText>
                </EmptyStateContainer>
            );
        }

        if (blacklistData && blacklistData.items.length === 0) {
            return (
                <EmptyStateContainer>
                    <EmptyStateIcon>🔍</EmptyStateIcon>
                    <EmptyStateTitle>Клиент в чёрном списке не найден</EmptyStateTitle>
                    <EmptyStateText>
                        По вашему запросу "{nameFilter || phoneFilter}" ничего не найдено в чёрном списке.
                    </EmptyStateText>
                    <DarkCyanButton onClick={handleAddToBlacklist}>
                        + Добавить в чёрный список
                    </DarkCyanButton>
                    <ResetButton onClick={resetFilters} style={{ marginTop: '16px' }}>
                        Сбросить фильтры
                    </ResetButton>
                </EmptyStateContainer>
            );
        }

        return (
            <div>
                {blacklistData?.items.map((client) => (
                    <ClientCard 
                        key={client.id} 
                        client={{
                            ...client,
                            secondPhone: client.secondPhone || '',
                            doc: client.doc || '',
                            docIssueDate: client.docIssueDate || null,
                            docIssueYear: client.docIssueYear || 0,
                            registrationAddress: client.registrationAddress || '',
                            birthdate: client.birthdate || null,
                            creditIds: client.creditIds || [],
                            creditRestTerms: client.creditRestTerms || []
                        }}
                        onEdit={() => {}}
                        onDelete={() => handleDeleteFromBlacklist(client)}
                        onRightClick={(e) => handleCardRightClick(e, client)}
                        showMenu={false} 
                        onOpenDossier={handleOpenDossier}
                        additionalInfo={
                            <DebtBadge>
                                Просрочка: {client.debt?.toLocaleString('ru-RU')} ₽
                            </DebtBadge>
                        }
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
                    <TitleContainer style={{ position: "sticky"}}>
                        <TitleContainer style={{maxWidth: "290px"}}>
                            <CustomTitle>Чёрный список</CustomTitle>
                            {blacklistData && blacklistData.items.length > 0 && (
                                <ClientCount>({blacklistData.totalItemsCount})</ClientCount>
                            )}
                        </TitleContainer>
                        <StyledCountInfo 
                            total={blacklistData?.totalItemsCount} 
                        />
                    </TitleContainer>
                    
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
                            onClick={handleAddToBlacklist}
                        >
                            + Добавить
                        </DarkCyanButton>
                    </StickyFilterField>
                    
                    {renderContent()}
                    
                    <ClientSelectModal
                        isOpen={isSelectModalOpen}
                        onClose={() => setIsSelectModalOpen(false)}
                        onSubmit={handleClientSelect}
                        width="900px"
                    />

                    {contextMenu && hasRole('суперадмин') && (
                        <>
                            <Backdrop onClick={closeContextMenu} />
                            <ContextMenu x={contextMenu.x} y={contextMenu.y}>
                                <MenuItem 
                                    danger 
                                    onClick={() => handleContextMenuAction('delete')}
                                >
                                    Удалить из чёрного списка
                                </MenuItem>
                            </ContextMenu>
                        </>
                    )}
                </>
            )}
        </PageLayout>
    );
};

export default BlacklistPage;