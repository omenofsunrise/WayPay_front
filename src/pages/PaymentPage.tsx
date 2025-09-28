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
import { formatDate, parseDateInput } from '../utils/dateFormatter';
import { formatMoney } from '../utils/formatPrice';
import { useAuth } from '../сontext/AuthContext';
import InvestorSelect from '../components/ui/fields/InvestorSelect';
import CustomCalendar from '../components/ui/fields/CustomCalendar';

const PaymentPage = () => {
    const [fullnameFilter, setFullnameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: number | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    const pageSize = 10;
    const { authInfo } = useAuth();
    const [investorName, setInvestorName] = useState('');
    const columnToApiSortMap: Record<number, string> = {
        0: 'creditId',
        1: 'clientFullname',
        2: 'paymentAmount',
        3: 'paymentDate'
    };
    const [dateFromFilter, setDateFromFilter] = useState('');
    const [dateToFilter, setDateToFilter] = useState('');

    const { exportData, isExporting, exportProgress } = useExport<Payment>();

    const { 
        isLoading, 
        error, 
        data: paymentsData, 
        getPayments,
        confirmPayment,
        deletePayment
    } = usePayment();
    
    const handleDateFromFilterChange = (value: string) => {
        setDateFromFilter(value);
        setCurrentPage(1);
    };

    const handleDateToFilterChange = (value: string) => {
        setDateToFilter(value);
        setCurrentPage(1);
    };

    const loadPayments = useCallback(async () => {
        const params: PaymentParams = {
            page: currentPage,
            pageSize,
            clientFullname: fullnameFilter.trim() || undefined,
            investorNickname: investorName.trim() || undefined,
            dateFrom: dateFromFilter ? parseDateInput(dateFromFilter) : undefined,
            dateTo: dateToFilter ? parseDateInput(dateToFilter) : undefined
        };

        if (sortConfig.key !== null) {
            params.sortBy = columnToApiSortMap[sortConfig.key];
            params.sortDirection = sortConfig.direction;
        }

        await getPayments(params);
    }, [currentPage, fullnameFilter, investorName, dateFromFilter, dateToFilter, sortConfig, getPayments]);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            loadPayments();
        }, 500);

        return () => clearTimeout(timer);
    }, [currentPage, fullnameFilter, investorName, dateFromFilter, dateToFilter, sortConfig, loadPayments]);

    const handleFilterChange = (value: string) => {
        setFullnameFilter(value);
        setCurrentPage(1);
    };

    const handleInvestorChange = (name: string) => {
        setInvestorName(name);
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
                    const params: PaymentParams = {
                        page,
                        pageSize,
                        clientFullname: fullnameFilter.trim() || undefined,
                        investorNickname: investorName.trim() || undefined,
                        dateFrom: dateFromFilter ? parseDateInput(dateFromFilter) : undefined,
                        dateTo: dateToFilter ? parseDateInput(dateToFilter) : undefined,
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
                    'Платёж': formatMoney(payment.paymentAmount.toString()),
                    'Дата платежа': payment.paymentDate ? formatDate(payment.paymentDate) : '',
                    'Тип платежа': payment.type === 'cash' ? 'Наличными' : 'Картой',
                    'Платёж принял': payment.employeeFullName || '',
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
            payment.type === 'cash' ? 'Наличными' : `Картой ${payment.bankCardDetails}`,
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
            <TitleField>
                <CustomTitle>История платежей</CustomTitle>
                <ExportButton 
                    onClick={handleExport}
                    isExporting={isExporting}
                    exportProgress={exportProgress}
                />
            </TitleField>
            
            <FilterField style={{gap: "15px"}}>
                <CustomInput 
                    inputType="text"
                    placeholder="Клиент"
                    value={fullnameFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                />
                <InvestorSelect
                    placeholder="Инвестор"
                    value={investorName}
                    onChange={handleInvestorChange}
                    onInvestorSelect={(investor) => {
                        console.log('Selected investor:', investor);
                    }}
                />
                <CustomCalendar 
                    prefix="От"
                    value={dateFromFilter}
                    onChange={handleDateFromFilterChange}
                />
                <CustomCalendar
                    prefix="До"
                    value={dateToFilter}
                    onChange={handleDateToFilterChange}
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
                            { name: "Тип платежа", align: "left" },
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

export default PaymentPage;