import { useState, useCallback, useEffect } from 'react';
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import ExportButton from "../components/ui/Buttons/ExportButton";
import CustomInput from "../components/ui/fields/CustomInput";
import Pagination from "../components/ui/fields/CustomPagination";
import CustomTable from "../components/ui/fields/CustomTable";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import CustomTitle from "../components/ui/Text/CustomTitle";
import { exportToExcel } from '../utils/exportUtils';
import ClientSelectModal from "../components/modal/ClientSelectModal";
import useBlacklist from "../api/hooks/useBlacklist";
import { formatDate } from '../utils/dateFormatter';

interface BlacklistItem {
  id: number;
  clientId: number;
  fullName: string;
  phone: string;
  createdAt: Date;
}

const BlacklistPage = () => {
    const [nameFilter, setNameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: number | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    const pageSize = 10;
    
    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
    
    const columnToApiSortMap: Record<number, string> = {
        0: 'id',
        1: 'full_Name',
        2: 'birthdate'
    };
    
    const { 
        isLoading, 
        error, 
        data: blacklistData, 
        getBlacklist,
        addBlacklist
    } = useBlacklist();
    
    const loadBlacklist = useCallback(async () => {
        const params: any = {
            page: currentPage,
            pageSize,
            FullName: nameFilter || undefined
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
                            { name: "Дата рождения", isSortable: true, align: "left" },
                            { name: "Телефон", align: "left" },
                        ]} 
                        data={tableData}
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
            
            <ClientSelectModal
                isOpen={isSelectModalOpen}
                onClose={() => setIsSelectModalOpen(false)}
                onSubmit={handleClientSelect}
                hideSaveButton={true}
                width="900px"
            />
        </PageLayout>
    );
};

export default BlacklistPage;