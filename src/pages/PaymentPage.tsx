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
import type { Payment, PaymentParams, PaymentTab } from '../api/types/payment';
import { formatDate, parseDateInput } from '../utils/dateFormatter';
import { formatMoney } from '../utils/formatPrice';
import { useAuth } from '../сontext/AuthContext';
import InvestorSelect from '../components/ui/fields/InvestorSelect';
import CustomCalendar from '../components/ui/fields/CustomCalendar';
import PrintOptionModal from '../components/modal/PrintOptionModal';
import PaymentConfirmationGenerator from '../utils/doxcUtils/paymentConfirmationGenerator';
import PrintIcon from '../assets/ui/print.svg?react';
import UserSelect from '../components/ui/fields/UserSelect';
import { useEmployee } from '../api/hooks/useEmployee';
import CustomSelect from '../components/ui/fields/CustomSelect';
import type { EmployeeFullnames } from '../api/types/employee';

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
    const [employeeFullname, setEmployeeFullname] = useState('');
    const [confirmedFilter, setConfirmedFilter] = useState<string>('all');
    const [employees, setEmployees] = useState<EmployeeFullnames[]>([]);
    const columnToApiSortMap: Record<number, string> = {
        0: 'creditId',
        1: 'clientFullname',
        2: 'paymentAmount',
        3: 'paymentDate'
    };
    const [dateFromFilter, setDateFromFilter] = useState('');
    const [dateToFilter, setDateToFilter] = useState('');
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [selectedPaymentForPrint, setSelectedPaymentForPrint] = useState<Payment | null>(null);
    const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

    const { exportData, isExporting, exportProgress } = useExport<Payment>();

    const { fetchEmployeeFullnames } = useEmployee();
        
    const { 
        isLoading, 
        error, 
        data: paymentsData, 
        getPayments,
        confirmPayment,
        deletePayment
    } = usePayment();

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const employeeList = await fetchEmployeeFullnames();
                if (employeeList) {
                    setEmployees(employeeList);
                }
            } catch (err) {
                console.error('Ошибка при загрузке сотрудников:', err);
            }
        };

        loadEmployees();
    }, []);

    const employeeOptions = employees.map(employee => ({
        value: employee.fullName,
        label: employee.fullName,
        avatar: employee.photoPath
    }));

    const getPaymentTab = useCallback(async (paymentId: number): Promise<PaymentTab | null> => {
        try {
            const result = await paymentService.getPaymentTab(paymentId);
            return result;
        } catch (err) {
            console.error('Ошибка при получении данных для документа:', err);
            return null;
        }
    }, []);

    const paymentConfirmationGenerator = new PaymentConfirmationGenerator(getPaymentTab);
    
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
            employeeFullname: employeeFullname.trim() || undefined,
            dateFrom: dateFromFilter ? parseDateInput(dateFromFilter) : undefined,
            dateTo: dateToFilter ? parseDateInput(dateToFilter) : undefined
        };

        // Добавляем фильтр по подтверждению
        if (confirmedFilter === 'confirmed') {
            params.confirmed = true;
        } else if (confirmedFilter === 'not-confirmed') {
            params.confirmed = false;
        }
        // Для 'all' не добавляем параметр confirmed

        if (sortConfig.key !== null) {
            params.sortBy = columnToApiSortMap[sortConfig.key];
            params.sortDirection = sortConfig.direction;
        }

        await getPayments(params);
    }, [
        currentPage, 
        fullnameFilter, 
        investorName, 
        employeeFullname,
        confirmedFilter,
        dateFromFilter, 
        dateToFilter, 
        sortConfig, 
        getPayments
    ]);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            loadPayments();
        }, 500);

        return () => clearTimeout(timer);
    }, [currentPage, fullnameFilter, investorName, employeeFullname, confirmedFilter, dateFromFilter, dateToFilter, sortConfig, loadPayments]);

    const handleFilterChange = (value: string) => {
        setFullnameFilter(value);
        setCurrentPage(1);
    };

    const handleInvestorChange = (name: string) => {
        setInvestorName(name);
        setCurrentPage(1);
    };

    const handleEmployeeChange = (event: { target: { value: string } }) => {
        setEmployeeFullname(event.target.value);
        setCurrentPage(1);
    };

    const handleConfirmedChange = (event: { target: { value: string } }) => {
        setConfirmedFilter(event.target.value);
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
                        employeeFullname: employeeFullname.trim() || undefined,
                        dateFrom: dateFromFilter ? parseDateInput(dateFromFilter) : undefined,
                        dateTo: dateToFilter ? parseDateInput(dateToFilter) : undefined,
                        sortBy: sortConfig.key !== null ? columnToApiSortMap[sortConfig.key] : undefined,
                        sortDirection: sortConfig.direction
                    };

                    // Добавляем фильтр по подтверждению для экспорта
                    if (confirmedFilter === 'confirmed') {
                        params.confirmed = true;
                    } else if (confirmedFilter === 'not-confirmed') {
                        params.confirmed = false;
                    }
                    
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
            payment.accepted ? 'Да' : 'Нет',
            payment.id.toString()
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

    const handleRowClick = (rowData: any[], rowIndex: number) => {
        const id = rowData[rowData.length - 1];
        console.log(rowData);
        const payment = paymentsData?.items.find(c => c.id === Number(id));
        if (payment) {
            setSelectedPaymentForPrint(payment);
        }
    };

    const handlePrintPayment = async (rowData: any[]) => {
        const paymentId = parseInt(rowData[7]);
        const payment = paymentsData?.items.find(p => p.id === paymentId);
        
        if (!payment) {
            console.error('Платёж не найден для печати');
            return;
        }
        
        setSelectedPaymentForPrint(payment);
        setIsPrintModalOpen(true);
    };

    const handlePrintOptionSelect = async (optionKey: string) => {
        if (!selectedPaymentForPrint) return;

        try {
            setIsGeneratingDoc(true);

            if (optionKey === 'paymentConfirmation') {
                console.log('Генерация подтверждения оплаты для платежа:', selectedPaymentForPrint);
                
                await paymentConfirmationGenerator.generatePaymentConfirmation(selectedPaymentForPrint.id);
                
                console.log('Документ успешно сгенерирован и сохранен');
            }
        } catch (error) {
            console.error('Ошибка при генерации документа:', error);
            alert(`Произошла ошибка при генерации документа: ${
                error instanceof Error ? error.message : 'Неизвестная ошибка'
            }`);
        } finally {
            setIsGeneratingDoc(false);
            setIsPrintModalOpen(false);
            setSelectedPaymentForPrint(null);
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
            label: 'Печать чека',
            action: handlePrintPayment,
            color: '#8B5CF6',
            shouldShow: (rowData: any[]) => {
                const rowIndex = tableData.indexOf(rowData);
                const payment = paymentsData?.items[rowIndex];
                return payment;
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

    // Опции для фильтра по статусу подтверждения
    const confirmedOptions = [
        { value: 'all', label: 'Все' },
        { value: 'confirmed', label: 'Подтверждённые' },
        { value: 'not-confirmed', label: 'Не подтверждённые' }
    ];

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>История платежей</CustomTitle>
                <ExportButton 
                    icon={<PrintIcon />} 
                    onClick={() => {
                        if (!selectedPaymentForPrint) {
                            alert('Пожалуйста, выберите платёж в таблице (клик по строке)');
                        return;
                        }
                        setIsPrintModalOpen(true);
                    }}
                    >
                    Печать
                </ExportButton>
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
                <UserSelect
                    placeholder="Сотрудник"
                    value={employeeFullname}
                    onChange={handleEmployeeChange}
                    options={employeeOptions}
                />
                <CustomSelect
                    placeholder="Статус подтверждения"
                    value={confirmedFilter}
                    onChange={handleConfirmedChange}
                    options={confirmedOptions}
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
                            { name: "id", align: "center", isHidden: true },               
                        ]} 
                        data={tableData}
                        onSort={handleSort}
                        sortConfig={sortConfig}
                        onRowClick={handleRowClick}
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

            <PrintOptionModal
                isOpen={isPrintModalOpen}
                onClose={() => {
                    setIsPrintModalOpen(false);
                    setSelectedPaymentForPrint(null);
                }}
                onSelect={handlePrintOptionSelect}
                selectedPayment={selectedPaymentForPrint}
                modalTitle="Печать чека"
                printOptions={[
                    { 
                    key: 'paymentConfirmation', 
                    label: isGeneratingDoc ? 'Генерация...' : 'Чек', 
                    enabled: !isGeneratingDoc 
                    }
                ]}
            />
        </PageLayout>
    );
};

export default PaymentPage;