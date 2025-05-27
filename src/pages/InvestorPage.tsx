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
import InvestorModal from '../components/modal/InvestorModal';
import useExport from '../api/hooks/useExport';
import type { Investor, InvestorParams } from '../api/types/investor';
import investorService from '../api/services/investorService';
import useInvestor from '../api/hooks/useInvestor';
import { formatMoney } from '../utils/formatPrice';

const InvestorPage = () => {
    const [nameFilter, setNameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: number | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    const pageSize = 10;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
    
    const columnToApiSortMap: Record<number, string> = {
        0: 'id',
        1: 'nickname',
        2: 'fullName',
        3: 'phoneNumber',
        4: 'investorPie',
        5: 'investmentAmount',
        6: 'balance',
        7: 'isCompany'
    };
    
    const { exportData, isExporting, exportProgress } = useExport<Investor>();

    const { 
        isLoading, 
        error, 
        data: investorsData, 
        getInvestors,
        createInvestor,
        updateInvestor,
        deleteInvestor
    } = useInvestor();
    
    const loadInvestors = useCallback(async () => {
        const params: InvestorParams = {
            page: currentPage,
            pageSize,
            name: nameFilter || undefined
        };

        if (sortConfig.key !== null) {
            params.sortBy = columnToApiSortMap[sortConfig.key];
            params.sortDirection = sortConfig.direction;
        }

        await getInvestors(params);
    }, [currentPage, nameFilter, sortConfig, getInvestors]);
    
    useEffect(() => {
        loadInvestors();
    }, [currentPage, nameFilter, sortConfig, loadInvestors]);

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

    const handleExport = async () => {
        try {
            await exportData({
                fetchData: async (page, pageSize) => {
                    const params: InvestorParams = {
                        page,
                        pageSize,
                        name: nameFilter || undefined,
                        sortBy: sortConfig.key !== null ? columnToApiSortMap[sortConfig.key] : undefined,
                        sortDirection: sortConfig.direction
                    };
                    
                    const result = await investorService.getInvestors(params);
                    return {
                        items: Array.isArray(result.items) ? result.items : [],
                        totalCount: result.totalCount || 0
                    };
                },
                fileName: 'investors_export',
                transformData: (investor) => ({
                    ID: investor.id,
                    'Никнейм': investor.nickname,
                    'Полное имя': investor.fullName,
                    'Телефон': investor.phoneNumber,
                    'Доля инвестора': investor.investorPie,
                    'Сумма инвестиций': investor.investmentAmount,
                    'Баланс': investor.balance,
                    'Компания': investor.isCompany ? 'Да' : 'Нет'
                })
            });
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const handleCreateInvestor = () => {
        setModalMode('create');
        setSelectedInvestor({
            id: 0,
            nickname: '',
            fullName: '',
            phoneNumber: '',
            investorPie: 0,
            investmentAmount: 0,
            balance: 0,
            isCompany: false
        });
        setIsModalOpen(true);
    };

    const handleEditInvestor = (investor: Investor) => {
        setModalMode('edit');
        setSelectedInvestor(investor);
        setIsModalOpen(true);
    };

    const handleViewInvestor = (investor: Investor) => {
        setModalMode('view');
        setSelectedInvestor(investor);
        setIsModalOpen(true);
    };

    const handleDeleteInvestor = async (rowData: any[]) => {
        const [id] = rowData;
        
        if (isNaN(Number(id))) {
            console.error('Неверный ID инвестора');
            return;
        }

        const investorToDelete = investorsData?.items.find(i => i.id === Number(id));
        
        if (!investorToDelete) {
            console.error('Инвестор не найден');
            return;
        }
        
        if (investorToDelete.isCompany) {
            alert('Нельзя удалить свою компанию из инвесторов');
            return;
        }
        
        if (window.confirm('Вы уверены, что хотите удалить этого инвестора?')) {
            try {
                await deleteInvestor(Number(id));
                loadInvestors();
            } catch (err) {
                console.error('Ошибка при удалении инвестора:', err);
            }
        }
    };

    const handleSubmitInvestor = async (investorData: Partial<Investor>) => {
        try {
            if (modalMode === 'create') {
                await createInvestor(investorData as Omit<Investor, 'id'>);
            } else if (modalMode === 'edit' && selectedInvestor?.id) {
                await updateInvestor(selectedInvestor.id, investorData);
            }
            loadInvestors();
        } catch (err) {
            console.error('Ошибка при сохранении инвестора:', err);
        }
    };

    const handleRowDoubleClick = (rowData: any[], rowIndex: number) => {
        const investor = investorsData?.items.find(i => i.id === Number(rowData[0]));
        if (investor) {
            handleEditInvestor(investor);
        }
    };

    const tableData = investorsData?.items.map(investor => [
        investor.id.toString(),
        investor.nickname,
        investor.fullName,
        investor.phoneNumber,
        investor.investorPie.toString() + "%",
        formatMoney(investor.investmentAmount.toString()),
        formatMoney(investor.balance.toString()),
    ]) || [];

    const tableActions = [
        {
            label: 'Удалить',
            action: handleDeleteInvestor,
            color: '#EF4444'
        }
    ];

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Инвесторы</CustomTitle>
                <ExportButton 
                    onClick={handleExport}
                    isExporting={isExporting}
                    exportProgress={exportProgress}
                />
            </TitleField>
            
            <FilterField>
                <DarkCyanButton 
                    style={{ width: "15vw", marginLeft: "auto" }}
                    onClick={handleCreateInvestor}
                >
                    + Новый инвестор
                </DarkCyanButton>
            </FilterField>
            
            {isLoading && <div>Загрузка...</div>}
            {error && <div>Ошибка: {error}</div>}
            
            {!isLoading && !error && (
                <>
                    <CustomTable 
                        columns={[
                            { name: "id", isHidden: true },
                            { name: "Никнейм" },
                            { name: "ФИО (видно только админам)", isSortable: true },
                            { name: "Телефон" },
                            { name: "Доля инвестора", isSortable: true },
                            { name: "Инвестиция", isSortable: true },
                            { name: "Касса", isSortable: true },
                        ]} 
                        data={tableData}
                        onRowDoubleClick={handleRowDoubleClick}
                        contextMenuActions={tableActions}
                        onSort={handleSort}
                        sortConfig={sortConfig}
                    />
                    
                    <PaginationLayout>
                        <CountInfoTitle 
                            total={investorsData?.totalCount || 0} 
                        />
                        
                        <Pagination
                            total={investorsData?.totalCount || 0}
                            current={currentPage}
                            onChange={setCurrentPage}
                            itemsPerPage={pageSize}
                        />
                    </PaginationLayout>
                </>
            )}
            
            <InvestorModal
                mode={modalMode}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitInvestor}
                initialData={selectedInvestor || {
                    id: 0,
                    nickname: '',
                    fullName: '',
                    phoneNumber: '',
                    investorPie: 0,
                    investmentAmount: 0,
                    balance: 0,
                    isCompany: false
                }}
            />
        </PageLayout>
    );
};

export default InvestorPage;