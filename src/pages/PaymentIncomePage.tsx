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
import usePayment from '../api/hooks/usePayment';
import useExport from '../api/hooks/useExport';
import paymentService from '../api/services/paymentService';
import type { Payment, PaymentParams } from '../api/types/payment';
import { formatDate } from '../utils/dateFormatter';
import { formatMoney } from '../utils/formatPrice';
import { useAuth } from '../сontext/AuthContext';
import CustomSelect from '../components/ui/fields/CustomSelect';
import InvestorSelect from '../components/ui/fields/InvestorSelect';
import { TableTitle } from './BudgetPage';

const PaymentIncomePage = () => {
    const currentDate = new Date();
    const [fullnameFilter, setFullnameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: number | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    const pageSize = 10;
    const { authInfo } = useAuth();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [investorName, setInvestorName] = useState('');
    const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(null);

    const months = [
        { value: "1", label: "Январь" },
        { value: "2", label: "Февраль" },
        { value: "3", label: "Март" },
        { value: "4", label: "Апрель" },
        { value: "5", label: "Май" },
        { value: "6", label: "Июнь" },
        { value: "7", label: "Июль" },
        { value: "8", label: "Август" },
        { value: "9", label: "Сентябрь" },
        { value: "10", label: "Октябрь" },
        { value: "11", label: "Ноябрь" },
        { value: "12", label: "Декабрь" }
    ];

    const currentYear = currentDate.getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => {
        const year = currentYear - 2 + i;
        return { value: year.toString(), label: year.toString() };
    });

    const columnToApiSortMap: Record<number, string> = {
        0: 'creditId',
        1: 'clientFullname',
        2: 'paymentAmount',
        3: 'paymentDate'
    };
    
    const handleInvestorChange = (name: string, id?: number) => {
        setInvestorName(name);
        setSelectedInvestorId(id || null);
        setCurrentPage(1);
    };

    const { exportData, isExporting, exportProgress } = useExport<Payment>();

    const { 
        isLoading, 
        error, 
        data: paymentsData, 
        getPayments,
        confirmPayment,
        deletePayment
    } = usePayment();
    
    const getDateRangeForMonth = (month: number, year: number) => {
        const dateFrom = new Date(year, month - 1, 1);
        const dateTo = new Date(year, month, 0); // Последний день месяца
        
        return {
            dateFrom,
            dateTo
        };
    };
    
    const loadPayments = useCallback(async () => {
        const { dateFrom, dateTo } = getDateRangeForMonth(selectedMonth, selectedYear);
        
        const params: PaymentParams = {
            page: currentPage,
            pageSize,
            clientFullname: fullnameFilter || undefined,
            investorNickname: investorName || undefined,
            dateFrom,
            dateTo
        };

        if (sortConfig.key !== null) {
            params.sortBy = columnToApiSortMap[sortConfig.key];
            params.sortDirection = sortConfig.direction;
        }

        await getPayments(params);
    }, [currentPage, fullnameFilter, sortConfig, selectedMonth, selectedYear, selectedInvestorId, getPayments]);
    
    useEffect(() => {
        loadPayments();
    }, [currentPage, fullnameFilter, sortConfig, selectedMonth, selectedYear, selectedInvestorId, loadPayments]);

    const handleFilterChange = (value: string) => {
        setFullnameFilter(value);
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
            const { dateFrom, dateTo } = getDateRangeForMonth(selectedMonth, selectedYear);
            
            await exportData({
                fetchData: async (page, pageSize) => {
                    const params: PaymentParams = {
                        page,
                        pageSize,
                        clientFullname: fullnameFilter || undefined,
                        investorNickname: investorName || undefined,
                        dateFrom,
                        dateTo,
                        sortBy: sortConfig.key !== null ? columnToApiSortMap[sortConfig.key] : undefined,
                        sortDirection: sortConfig.direction
                    };
                    
                    const result = await paymentService.getPayments(params);
                    return {
                        items: Array.isArray(result?.items) ? result.items : [],
                        totalCount: result?.totalCount || 0
                    };
                },
                fileName: 'payments_export',
                transformData: (payment) => ({
                    'Договор №': payment.creditId,
                    'ФИО': payment.clientFullName,
                    'Платёж': payment.paymentAmount,
                    'Дата платежа': payment.paymentDate ? formatDate(payment.paymentDate) : '',
                    'Тип платежа': payment.type === 'cash' ? 'Наличными' : 'Картой',
                    'Платёж принял': payment.investorNickname || '',
                    'Подтверждён': payment.accepted ? 'Да' : 'Нет'
                })
            });
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const formatPaymentsData = (payments: Payment[] | undefined) => {
        if (!payments) return [];

        return payments.map(payment => [
            payment.creditId?.toString() || '',
            payment.clientFullName || '',
            formatMoney(payment.paymentAmount?.toString() || '0'),
            payment.paymentDate ? formatDate(payment.paymentDate) : '',
            payment.income === undefined ? '0' : formatMoney(payment.income.toString()),
            payment.employeeFullName || '',
            payment.accepted ? 'Да' : 'Нет'
        ]);
    };

    const handleConfirmPayment = async (rowData: any[]) => {
        const rowIndex = tableData.indexOf(rowData);
        const payment = paymentsData?.items[rowIndex];
        
        if (!payment) return;
        
        if (window.confirm('Вы уверены, что хотите подтвердить этот платёж?')) {
            try {
                await confirmPayment(payment.id);
                loadPayments();
            } catch (err) {
                console.error('Ошибка при подтверждении платежа:', err);
            }
        }
    };

    const handleDeletePayment = async (rowData: any[]) => {
        const rowIndex = tableData.indexOf(rowData);
        const payment = paymentsData?.items[rowIndex];
        
        if (!payment) return;
        
        if (payment.accepted) {
            alert('Нельзя удалить подтверждённый платёж');
            return;
        }
        
        if (window.confirm('Вы уверены, что хотите удалить этот платёж?')) {
            try {
                await deletePayment(payment.id);
                loadPayments();
            } catch (err) {
                console.error('Ошибка при удалении платежа:', err);
            }
        }
    };

    const tableData = formatPaymentsData(paymentsData?.items);

    const tableActions = [
        {
            label: 'Подтвердить',
            action: handleConfirmPayment,
            color: '#007D88',
            shouldShow: (rowData: any[]) => {
                const rowIndex = tableData.indexOf(rowData);
                const payment = paymentsData?.items[rowIndex];
                return payment && !payment.accepted && authInfo?.employee.role === 'бухгалтер';
            }
        },
        {
            label: 'Удалить',
            action: handleDeletePayment,
            color: '#EF4444',
            shouldShow: (rowData: any[]) => {
                const rowIndex = tableData.indexOf(rowData);
                const payment = paymentsData?.items[rowIndex];
                return payment && !payment.accepted;
            }
        }
    ];

    return (
        <PageLayout>
            <TitleField style={{gap: "35px"}}>
                <CustomTitle>Доходы по платежам</CustomTitle>
                {/* <ExportButton 
                    onClick={handleExport}
                    isExporting={isExporting}
                    exportProgress={exportProgress}
                /> */}
                <TableTitle>Всего доход: {formatMoney(paymentsData?.totalIncome?.toString() || '0')}</TableTitle>
                <TableTitle>Всего выплат: {formatMoney(paymentsData?.totalPayments?.toString() || '0')}</TableTitle>
            </TitleField>
            
            <FilterField>
                <CustomInput 
                    inputType="text"
                    placeholder="ФИО"
                    value={fullnameFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                />
                <CustomSelect
                    placeholder="Месяц"
                    value={selectedMonth.toString()}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    options={months}
                    style={{ flex: "0 1 200px" }}
                />
                <CustomSelect
                    placeholder="Год"
                    value={selectedYear.toString()}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    options={years}
                    style={{ flex: "0 1 150px" }}
                />
                <InvestorSelect
                    placeholder="Инвестор"
                    value={investorName}
                    onChange={handleInvestorChange}
                    onInvestorSelect={(investor) => {
                        handleInvestorChange(investor.name, investor.id);
                    }}
                />
            </FilterField>
            
            {isLoading && <div>Загрузка...</div>}
            {error && <div>Ошибка: {error}</div>}
            
            {!isLoading && !error && (
                <>
                    <CustomTable 
                        columns={[
                            { name: "Договор №", isSortable: true, align: "center" },
                            { name: "ФИО", isSortable: true, align: "left" },
                            { name: "Платёж", isSortable: true, align: "right" },
                            { name: "Дата платежа", isSortable: true, align: "right" },
                            { name: "Доход с платежа, руб", align: "right" },
                            { name: "Платёж принял", align: "left" },
                            { name: "Подтверждён", align: "center" },                
                        ]} 
                        data={tableData}
                        onSort={handleSort}
                        sortConfig={sortConfig}
                        contextMenuActions={tableActions}
                    />
                    
                    <PaginationLayout>
                        <CountInfoTitle 
                            total={paymentsData?.totalCount || 0} 
                        />
                        
                        <Pagination
                            total={paymentsData?.totalCount || 0}
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

export default PaymentIncomePage;