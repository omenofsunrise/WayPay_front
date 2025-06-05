import { useState, useCallback, useEffect } from 'react';
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import ExportButton from "../components/ui/Buttons/ExportButton";
import CustomInput from "../components/ui/fields/CustomInput";
import Pagination from "../components/ui/fields/CustomPagination";
import CustomTable, { type RowStyle } from "../components/ui/tables/CustomTable";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import CustomTitle from "../components/ui/Text/CustomTitle";
import { exportToExcel } from '../utils/exportUtils';
import ClientModal from "../components/modal/ClientModal";
import useClients from "../api/hooks/useClient";
import type { ClientForm } from '../api/types/client';
import { formatDate } from '../utils/dateFormatter';

interface Client {
  id: number;
  fullName: string;
  phone: string;
  doc: string;
  birthdate: Date | null;
  docIssueDate: Date | null;
  docIssueYear: number;
}
const ClientPage = () => {
    const [nameFilter, setNameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: number | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    const pageSize = 10;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    
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
        deleteClient
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
        loadClients();
    }, [currentPage, nameFilter, sortConfig, loadClients]);

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

    const handleCreateClient = () => {
        setModalMode('create');
        setSelectedClient({
            id: 0,
            fullName: '',
            phone: '',
            doc: '',
            birthdate: null,
            docIssueDate: null,
            docIssueYear: 0
        });
        setIsModalOpen(true);
    };

    const handleEditClient = (client: Client) => {
        setModalMode('edit');
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    const handleDeleteClient = async (rowData: any[]) => {
        const [id] = rowData;
        if (window.confirm('Вы уверены, что хотите удалить этого клиента?')) {
            try {
                await deleteClient(Number(id));
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
                birthdate: parseDate(clientData.birthdate),
                doc: (clientData as ClientForm).doc || undefined,
                docIssueDate: parseDate((clientData as ClientForm).docIssueDate || '') || undefined,
                docIssueYear: (clientData as ClientForm).docIssueDate || 0
            };

            if (modalMode === 'create') {
                await createClient(apiData);
            } else if (modalMode === 'edit' && selectedClient?.id) {
                await updateClient(selectedClient.id, apiData);
            }
            
            loadClients();
            return true;
        } catch (error: any) {            
            return false;
        }
    };

    const handleRowDoubleClick = (rowData: any[], rowIndex: number) => {
        const client = clientsData?.items[rowIndex];
        if (client) {
            handleEditClient(client);
        }
    };

    const tableData = clientsData?.items?.map(client => [
        client.id.toString(),
        client.fullName,
        client.phone,
        formatDate(client.birthdate),
        client.creditIds || '-',
        client.creditRestTerms || '-'
    ]) || [];

    const rowStyles = tableData.reduce((styles, rowData, index) => {
        const contracts = rowData[4];
        
        if (Array.isArray(contracts) && contracts.length === 0) {
            styles[index] = {
                backgroundColor: '#C8E6C9',
                color: '#1B5E20',          
                fontWeight: 'normal'
            };
        }
        else if (contracts === '-') {
            styles[index] = {
                backgroundColor: '#C8E6C9',
                color: '#1B5E20',
                fontWeight: 'normal'
            };
        }
        else {
            styles[index] = {
                backgroundColor: '#FFEBEE',
                color: '#D32F2F',
                fontWeight: 'normal'
            };
        }
        
        return styles;
    }, {} as Record<number, RowStyle>);

    const tableActions = [
        {
            label: 'Удалить',
            action: handleDeleteClient,
            color: '#EF4444'
        }
    ];

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Клиенты</CustomTitle>
            </TitleField>
            
            <FilterField>
                <CustomInput 
                    inputType="fullname"
                    placeholder="ФИО клиента"
                    value={nameFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                />
                <DarkCyanButton 
                    style={{ width: "15vw" }}
                    onClick={handleCreateClient}
                >
                    + Добавить
                </DarkCyanButton>
            </FilterField>
            
            {isLoading && <div>Загрузка...</div>}
            {error && <div>{error}</div>}
            
            {!isLoading && !error && (
                <>
                    <CustomTable 
                        columns={[
                            { name: "ID", isSortable: true, align: "left" },
                            { name: "ФИО", isSortable: true, align: "left" },
                            { name: "Телефон", align: "left" },
                            { name: "Дата рождения", isSortable: true, align: "right" },
                            { name: "№ договоров" },
                            { name: "Остатки мес." }
                        ]} 
                        rowStyles={rowStyles}
                        data={tableData}
                        onRowDoubleClick={handleRowDoubleClick}
                        contextMenuActions={tableActions}
                        onSort={handleSort}
                        sortConfig={sortConfig}
                    />
                    
                    <PaginationLayout>
                        <CountInfoTitle 
                            total={clientsData?.totalCount || 0} 
                        />
                        
                        <Pagination
                            total={clientsData?.totalCount || 0}
                            current={currentPage}
                            onChange={setCurrentPage}
                            itemsPerPage={pageSize}
                        />
                    </PaginationLayout>
                </>
            )}
            
            <ClientModal
                mode={modalMode}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitClient}
                initialData={selectedClient || {
                    id: 0,
                    fullName: '',
                    phone: '',
                    doc: '',
                    birthdate: null,
                    docIssueDate: null,
                    docIssueYear: 0
                }}
            />
        </PageLayout>
    );
};

export default ClientPage;