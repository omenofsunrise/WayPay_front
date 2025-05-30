import { useState, useCallback, useEffect } from 'react';
import ExportButton from "../components/ui/Buttons/ExportButton";
import CustomInput from "../components/ui/fields/CustomInput";
import Pagination from "../components/ui/fields/CustomPagination";
import CustomTable from "../components/ui/tables/CustomTable";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import CustomTitle from "../components/ui/Text/CustomTitle";
import useSchedule from "../api/hooks/useSchedule";
import useExport from '../api/hooks/useExport';
import type { ScheduleDetails, ScheduleParams } from '../api/types/schedule';
import scheduleService from '../api/services/scheduleService';
import { formatDate, parseDateInput } from '../utils/dateFormatter';

const SchedulePage = () => {
    const [clientNameFilter, setClientNameFilter] = useState('');
    const [investorFilter, setInvestorFilter] = useState('');
    const [dateFromFilter, setDateFromFilter] = useState('');
    const [dateToFilter, setDateToFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: number | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    const pageSize = 10;
    
    const columnToApiSortMap: Record<number, string> = {
        0: 'id',
        1: 'date',
        2: 'payment',
        3: 'creditId'
    };
    
    const { exportData, isExporting, exportProgress } = useExport<ScheduleDetails>();

    const { 
        isLoading, 
        error, 
        scheduleData, 
        getList
    } = useSchedule();
    
    const loadSchedules = useCallback(async () => {
        const params: ScheduleParams = {
            page: currentPage,
            pageSize,
            clientName: clientNameFilter || undefined,
            investorNickname: investorFilter || undefined,
            dateFrom: dateFromFilter ? parseDateInput(dateFromFilter) : undefined,
            dateTo: dateToFilter ? parseDateInput(dateToFilter) : undefined
        };

        if (sortConfig.key !== null) {
            params.sortBy = columnToApiSortMap[sortConfig.key];
            params.sortDirection = sortConfig.direction;
        }

        await getList(params);
    }, [currentPage, clientNameFilter, investorFilter, dateFromFilter, dateToFilter, sortConfig, getList]);
    
    useEffect(() => {
        loadSchedules();
    }, [currentPage, clientNameFilter, investorFilter, dateFromFilter, dateToFilter, sortConfig, loadSchedules]);

    const handleClientNameFilterChange = (value: string) => {
        setClientNameFilter(value);
        setCurrentPage(1);
    };

    const handleInvestorFilterChange = (value: string) => {
        setInvestorFilter(value);
        setCurrentPage(1);
    };

    const handleDateFromFilterChange = (value: string) => {
        setDateFromFilter(value);
        setCurrentPage(1);
    };

    const handleDateToFilterChange = (value: string) => {
        setDateToFilter(value);
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
                    const params: ScheduleParams = {
                        page,
                        pageSize,
                        clientName: clientNameFilter || undefined,
                        investorNickname: investorFilter || undefined,
                        dateFrom: dateFromFilter ? parseDateInput(dateFromFilter) : undefined,
                        dateTo: dateToFilter ? parseDateInput(dateToFilter) : undefined,
                        sortBy: sortConfig.key !== null ? columnToApiSortMap[sortConfig.key] : undefined,
                        sortDirection: sortConfig.direction
                    };
                    
                    const result = await scheduleService.getList(params);
                    return {
                        items: Array.isArray(result.items) ? result.items : [],
                        totalCount: result.totalCount || 0
                    };
                },
                fileName: 'schedules_export',
                transformData: (schedule) => ({
                    'Договор №': schedule.creditId,
                    'ФИО': schedule.clientName,
                    'Платеж': schedule.paymentAmount,
                    'Дата платежа': formatDate(schedule.paymentDate),
                    'Уведомлен': schedule.notified ? 'Да' : 'Нет'
                })
            });
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const tableData = scheduleData?.items.map(schedule => [
        schedule.creditId.toString(),
        schedule.clientName,
        schedule.paymentAmount.toString(),
        formatDate(schedule.paymentDate),
        schedule.notified ? 'Да' : 'Нет'
    ]) || [];

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>График платежей</CustomTitle>
                <ExportButton 
                    onClick={handleExport}
                    isExporting={isExporting}
                    exportProgress={exportProgress}
                />
            </TitleField>
            
            <FilterField>
                <CustomInput 
                    inputType="text"
                    placeholder="Клиент"
                    value={clientNameFilter}
                    onChange={(e) => handleClientNameFilterChange(e.target.value)}
                />
                <CustomInput 
                    inputType="text"
                    placeholder="Инвестор"
                    value={investorFilter}
                    onChange={(e) => handleInvestorFilterChange(e.target.value)}
                />
                <CustomInput 
                    inputType="date"
                    placeholder="Дата от"
                    value={dateFromFilter}
                    onChange={(e) => handleDateFromFilterChange(e.target.value)}
                />
                <CustomInput 
                    inputType="date"
                    placeholder="Дата до"
                    value={dateToFilter}
                    onChange={(e) => handleDateToFilterChange(e.target.value)}
                />
            </FilterField>
            
            {isLoading && <div>Загрузка...</div>}
            {error && <div>Ошибка: {error}</div>}
            
            {!isLoading && !error && (
                <>
                    <CustomTable 
                        columns={[
                            { name: "Договор №", isSortable: true },
                            { name: "ФИО", isSortable: true },
                            { name: "Платёж", isSortable: true },
                            { name: "Дата платежа", isSortable: true },
                            { name: "Уведомлён"},
                        ]} 
                        data={tableData}
                        onSort={handleSort}
                        sortConfig={sortConfig}
                    />
                    
                    <PaginationLayout>
                        <CountInfoTitle 
                            total={scheduleData?.totalCount || 0} 
                        />
                        
                        <Pagination
                            total={scheduleData?.totalCount || 0}
                            current={currentPage}
                            onChange={setCurrentPage}
                            itemsPerPage={pageSize}
                        />
                    </PaginationLayout>
                </>
            )}
        </PageLayout>
    );
};

export default SchedulePage;