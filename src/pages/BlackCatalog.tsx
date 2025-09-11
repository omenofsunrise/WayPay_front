import { useState, useCallback, useEffect } from 'react';
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import CustomInput from "../components/ui/fields/CustomInput";
import Pagination from "../components/ui/fields/CustomPagination";
import CustomTable from "../components/ui/tables/CustomTable";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import CustomTitle from "../components/ui/Text/CustomTitle";
import useBlacklist from "../api/hooks/useBlacklist";
import { useAuth } from '../сontext/AuthContext';
import { formatDate, parseDateInput } from '../utils/dateFormatter';
import TitleField from '../components/ui/Layouts/TitleLayout';
import BlackCatalogModal from '../components/modal/CrudInherited/BlackCatalogModal';

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
  address?: string | null;
  creditIds?: string[];
  creditRestTerms?: string[];
  hasPassportPhoto?: boolean;
}

const BlackCatalogPage = () => {
    const [nameFilter, setNameFilter] = useState('');
    const [phoneFilter, setPhoneFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: number | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    const pageSize = 10;
    
    const { isSuperAdminCompany } = useAuth();
    
    const { 
        isLoading, 
        error, 
        data: blacklistData, 
        getBlackCatalog,
        addBlackCatalog,
        updateBlackCatalog,
        deleteFromBlackCatalog
    } = useBlacklist();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Partial<BlacklistClient> | null>(null);

    const handleAddToBlacklist = () => {
        setEditingClient(null);
        setIsModalOpen(true);
    };

const handleEditClient = (rowData: any[]) => {
    const [id, fullName, phone, birthdate, address, doc, docIssueDate] = rowData;
    setEditingClient({
        id: parseInt(id),
        fullName,
        phone,
        birthdate: birthdate,
        address: address,
        doc,
        docIssueDate: docIssueDate
    });
    setIsModalOpen(true);
};

    const handleSaveClient = async (clientData: Partial<BlacklistClient>) => {
        try {
            if (editingClient?.id) {
                await updateBlackCatalog(editingClient.id, clientData);
            } else {
                await addBlackCatalog(clientData);
            }
            loadBlacklist();
        } catch (err) {
            console.error('Ошибка при сохранении клиента:', err);
        }
    };

    const columnToApiSortMap: Record<number, string> = {
        0: 'id',
        1: 'fullName',
        2: 'phone',
        3: 'debt'
    };

    const loadBlacklist = useCallback(async () => {
        const params: any = {
            page: currentPage,
            pageSize,
            fullName: nameFilter || undefined,
            phone: phoneFilter || undefined
        };

        if (sortConfig.key !== null) {
            params.sortBy = columnToApiSortMap[sortConfig.key];
            params.sortDirection = sortConfig.direction;
        }

        await getBlackCatalog(params);
    }, [currentPage, nameFilter, phoneFilter, sortConfig, getBlackCatalog]);

    useEffect(() => {
        loadBlacklist();
    }, [currentPage, nameFilter, phoneFilter, sortConfig, loadBlacklist]);

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

    const handleDeleteFromBlackCatalog = async (rowData: any[]) => {
        const [id] = rowData;
        if (window.confirm('Вы уверены, что хотите убрать этого клиента из чёрного списка?')) {
            try {
                await deleteFromBlackCatalog(Number(id));
                loadBlacklist();
            } catch (err) {
                console.error('Ошибка при удалении клиента:', err);
            }
        }
    };

    const tableData = blacklistData?.items.map(client => [
        client.id.toString(),
        client.fullName,
        client.phone,
        formatDate(client.birthdate),
        client.address,
        client.doc,
        formatDate(client.docIssueDate),
    ]) || [];

    const tableActions = isSuperAdminCompany() ? [
        {
            label: 'Редактировать',
            action: handleEditClient,
            color: '#3B82F6'
        },
        {
            label: 'Удалить',
            action: handleDeleteFromBlackCatalog,
            color: '#EF4444'
        }
    ] : [];

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Чёрный каталог</CustomTitle>
            </TitleField>
            
            <FilterField>
                <CustomInput 
                    inputType="fullname"
                    placeholder="ФИО клиента"
                    value={nameFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                />
                {isSuperAdminCompany() && (
                    <DarkCyanButton 
                        style={{ width: "15vw" }}
                        onClick={handleAddToBlacklist}
                    >
                        + Добавить
                    </DarkCyanButton>
                )}
            </FilterField>
            
            {isLoading && <div>Загрузка...</div>}
            {error && <div>Ошибка: {error}</div>}
            
            {!isLoading && !error && (
                <>
                    <CustomTable 
                        columns={[
                            { name: "ID", isHidden: true },
                            { name: "ФИО", align: "left" },
                            { name: "Телефон", align: "left" },
                            { name: "Дата рождения", align: "right" },
                            { name: "Адрес", align: "left" },
                            { name: "Документ", align: "left" },
                            { name: "Дата выдачи", align: "right" },
                        ]} 
                        data={tableData}
                        contextMenuActions={tableActions}
                        onSort={handleSort}
                        sortConfig={sortConfig}
                    />
                    
                    <PaginationLayout>
                        <CountInfoTitle 
                            total={blacklistData?.totalCount || 0} 
                        />
                        
                        <Pagination
                            total={blacklistData?.totalCount || 0}
                            current={currentPage}
                            onChange={setCurrentPage}
                            itemsPerPage={pageSize}
                        />
                    </PaginationLayout>
                </>
            )}
            
            {isSuperAdminCompany() && (
                <BlackCatalogModal
                    mode={editingClient?.id ? 'edit' : 'create'}
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingClient(null);
                    }}
                    onSubmit={handleSaveClient}
                    initialData={editingClient || undefined}
                />
            )}
        </PageLayout>
    );
};

export default BlackCatalogPage;