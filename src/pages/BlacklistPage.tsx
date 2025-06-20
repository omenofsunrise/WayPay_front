import { useState, useCallback, useEffect } from 'react';
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import CustomInput from "../components/ui/fields/CustomInput";
import Pagination from "../components/ui/fields/CustomPagination";
import CustomTable, { type TableAction } from "../components/ui/tables/CustomTable";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import CustomTitle from "../components/ui/Text/CustomTitle";
import ClientSelectModal from "../components/modal/CrudInherited/ClientSelectModal";
import useBlacklist from "../api/hooks/useBlacklist";
import { formatDate } from '../utils/dateFormatter';
import { useAuth } from '../сontext/AuthContext';
import TitleField from '../components/ui/Layouts/TitleLayout';

const BlacklistPage = () => {
    const [nameFilter, setNameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: number | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    const pageSize = 10;
    const { hasRole } = useAuth();
    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
    
    const columnToApiSortMap: Record<number, string> = {
        0: 'id',
        1: 'fullName',
        2: 'birthdate'
    };
    
    const { 
        isLoading, 
        error, 
        data: blacklistData, 
        getBlacklist,
        addBlacklist,
        deleteFromBlacklist
    } = useBlacklist();
    
    const loadBlacklist = useCallback(async () => {
        const params: any = {
            page: currentPage,
            pageSize,
            fullName: nameFilter || undefined
        };

        if (sortConfig.key !== null) {
            params.sortBy = columnToApiSortMap[sortConfig.key];
            params.sortDirection = sortConfig.direction;
        }

        await getBlacklist(params);
    }, [currentPage, nameFilter, sortConfig, getBlacklist]);
    
    useEffect(() => {
        loadBlacklist();
    }, [currentPage, nameFilter, sortConfig, loadBlacklist]);

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

    const handleDeleteFromBlacklist = async (rowData: any[]) => {
        const [id] = rowData;

        if (window.confirm('Вы уверены, что хотите убрать этого клиента из чёрного списка?')) {
            try {
                await deleteFromBlacklist(Number(id));
                loadBlacklist();
            } catch (err) {
                console.error('Ошибка при удалении клиента:', err);
            }
        }
    };

    const tableActions = [
        {
            label: 'Удалить',
            action: handleDeleteFromBlacklist,
            color: '#EF4444'
        }
    ];

    const getTableActions = (rowData: any[]): TableAction[] | null => 
        hasRole('суперадмин') ? tableActions : null;

    const handleAddToBlacklist = () => {
        setIsSelectModalOpen(true);
    };

    const handleClientSelect = async (client: { id: number; fullName: string; phone: string }) => {
        try {
            await addBlacklist(client.id);
            loadBlacklist();
            setIsSelectModalOpen(false);
        } catch (err) {
            console.error('Ошибка при добавлении в черный список:', err);
        }
    };

    const tableData = blacklistData?.items?.map(item => [
        item.id.toString(),
        item.fullName,
        formatDate(item.birthdate),
        item.phone,
        item.debt
    ]) || [];

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Чёрный список</CustomTitle>
            </TitleField>
            
            <FilterField>
                <CustomInput 
                    inputType="fullname"
                    placeholder="ФИО клиента"
                    value={nameFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                    <DarkCyanButton 
                        style={{ width: "15vw" }}
                        onClick={handleAddToBlacklist}
                    >
                        + Добавить
                    </DarkCyanButton>
                </div>
            </FilterField>
            
            {isLoading && <div>Загрузка...</div>}
            {error && <div>Ошибка: {error}</div>}
            
            {!isLoading && !error && (
                <>
                    <CustomTable 
                        columns={[
                            { name: "ID", isSortable: true, align: "left" },
                            { name: "ФИО", isSortable: true, align: "left" },
                            { name: "Дата рождения", isSortable: true, align: "right" },
                            { name: "Телефон", align: "left" },
                            { name: "Всего просрочка", align: "right" }
                        ]} 
                        data={tableData}
                        onSort={handleSort}
                        sortConfig={sortConfig}
                        contextMenuActions={getTableActions}
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
            
            <ClientSelectModal
                isOpen={isSelectModalOpen}
                onClose={() => setIsSelectModalOpen(false)}
                onSubmit={handleClientSelect}
                width="900px"
            />
        </PageLayout>
    );
};

export default BlacklistPage;