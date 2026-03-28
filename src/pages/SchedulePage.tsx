import { useState, useCallback, useEffect, useRef } from 'react';
import ExportButton from "../components/ui/Buttons/ExportButton";
import CustomInput from "../components/ui/fields/CustomInput";
import Pagination from "../components/ui/fields/CustomPagination";
import CustomTable, { type RowStyle } from "../components/ui/tables/CustomTable";
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
import CustomCalendar from '../components/ui/fields/CustomCalendar';
import styled from 'styled-components';
import { formatMoney } from '../utils/formatPrice';
import InvestorSelect from '../components/ui/fields/InvestorSelect';
import useCompany from '../api/hooks/useCompany';
import Tabs from '../components/ui/fields/Tabs';
import SchedulePieChart from '../components/Dashboards/SchedulePieChart';
import type { ScheduleAnalitycResponse } from '../api/types/analytic';
import PaginationDots from '../components/ui/Pagination/PaginationDots';
import useAnalytic from '../api/hooks/useAnalytic';
import NewPaymentModal from '../components/modal/NewPaymentModal';
import usePayment from '../api/hooks/usePayment';
import creditService from '../api/services/creditService';
import type { Credit } from '../api/types/credit';
import { useAuth } from '../сontext/AuthContext';
import ViewCreditModal from '../components/modal/ViewCreditModal';
import { sendWhatsAppMessage } from '../utils/sendWhatsAppMessage';
import PaymentConfirmationGenerator from '../utils/doxcUtils/paymentConfirmationGenerator';
import type { PaymentTab } from '../api/types/payment';
import paymentService from '../api/services/paymentService';
import { useResponsivePageSize } from '../utils/useResponsivePageSize';

const CheckIcon = () => (
  <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.3227 1.73849C15.5053 1.54252 15.6047 1.28333 15.6 1.01552C15.5952 0.747705 15.4867 0.492182 15.2973 0.30278C15.1079 0.113379 14.8524 0.00488629 14.5846 0.000161053C14.3168 -0.00456418 14.0576 0.0948468 13.8616 0.277449L5.63297 8.50612L2.22848 5.10163C2.03251 4.91903 1.77332 4.81961 1.50551 4.82434C1.23769 4.82907 0.982171 4.93756 0.792769 5.12696C0.603368 5.31636 0.494877 5.57188 0.490151 5.8397C0.485426 6.10751 0.584836 6.3667 0.767438 6.56266L4.90245 10.6977C5.09628 10.8913 5.35902 11 5.63297 11C5.90691 11 6.16966 10.8913 6.36349 10.6977L15.3227 1.73849Z" fill="#50555C"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.8437 3.11431C16.8886 2.14984 15.751 1.38511 14.4974 0.864691C13.2437 0.344271 11.899 0.078567 10.5416 0.083064C4.85413 0.083064 0.218709 4.71848 0.218709 10.406C0.218709 12.2289 0.697876 13.9997 1.59371 15.5622L0.135376 20.9164L5.60413 19.4789C7.11454 20.3018 8.81246 20.7393 10.5416 20.7393C16.2291 20.7393 20.8645 16.1039 20.8645 10.4164C20.8645 7.65598 19.7916 5.06223 17.8437 3.11431ZM10.5416 18.9893C8.99996 18.9893 7.48954 18.5726 6.16663 17.7914L5.85413 17.6039L2.60413 18.4581L3.46871 15.2914L3.26038 14.9685C2.40365 13.6008 1.94884 12.0198 1.94788 10.406C1.94788 5.67681 5.80204 1.82265 10.5312 1.82265C12.8229 1.82265 14.9791 2.71848 16.5937 4.34348C17.3933 5.13917 18.027 6.08571 18.4579 7.1282C18.8888 8.17068 19.1085 9.28836 19.1041 10.4164C19.125 15.1456 15.2708 18.9893 10.5416 18.9893ZM15.25 12.5726C14.9895 12.4476 13.7187 11.8226 13.4895 11.7289C13.25 11.6456 13.0833 11.6039 12.9062 11.8539C12.7291 12.1143 12.2395 12.6976 12.0937 12.8643C11.9479 13.0414 11.7916 13.0622 11.5312 12.9268C11.2708 12.8018 10.4375 12.5206 9.45829 11.6456C8.68746 10.9581 8.17704 10.1143 8.02079 9.8539C7.87496 9.59348 7.99996 9.45806 8.13538 9.32265C8.24996 9.20806 8.39579 9.02056 8.52079 8.87473C8.64579 8.7289 8.69788 8.61431 8.78121 8.44765C8.86454 8.27056 8.82288 8.12473 8.76038 7.99973C8.69788 7.87473 8.17704 6.6039 7.96871 6.08306C7.76038 5.58306 7.54163 5.64556 7.38538 5.63515H6.88538C6.70829 5.63515 6.43746 5.69765 6.19788 5.95806C5.96871 6.21848 5.30204 6.84348 5.30204 8.11431C5.30204 9.38515 6.22913 10.6143 6.35413 10.781C6.47913 10.9581 8.17704 13.5622 10.7604 14.6768C11.375 14.9476 11.8541 15.1039 12.2291 15.2185C12.8437 15.4164 13.4062 15.3851 13.8541 15.3226C14.3541 15.2497 15.3854 14.6976 15.5937 14.0935C15.8125 13.4893 15.8125 12.9789 15.7395 12.8643C15.6666 12.7497 15.5104 12.6976 15.25 12.5726Z" fill="#2CB742"/>
  </svg>
);

type TabType = 'schedule' | 'table';

const ACTIVE_TAB_STORAGE_KEY = 'schedule_page_active_tab';

// Интерфейс для выбранной сущности
interface SelectedEntity {
  id: number;
  name: string;
  type: 'investor' | 'pool';
}

const SchedulePage = () => {
    const [activeTab, setActiveTab] = useState<TabType>(() => {
        const savedTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY) as TabType;
        return savedTab && (savedTab === 'schedule' || savedTab === 'table') 
            ? savedTab 
            : 'schedule';
    });
    
    const [clientNameFilter, setClientNameFilter] = useState('');
    const [investorFilter, setInvestorFilter] = useState('');
    const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
    const [dateFromFilter, setDateFromFilter] = useState('');
    const [dateToFilter, setDateToFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: number | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [currentChartIndex, setCurrentChartIndex] = useState(0);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedScheduleForPayment, setSelectedScheduleForPayment] = useState<ScheduleDetails | null>(null);
    const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
    const { hasRole, hasPermission } = useAuth();
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingCreditId, setViewingCreditId] = useState<number | null>(null);
    const [isPageSizeReady, setIsPageSizeReady] = useState(false);
    const { getScheduleAnalityc } = useAnalytic();
    const { createPayment } = usePayment();
    const [scheduleAnalytics, setScheduleAnalytics] = useState<ScheduleAnalitycResponse[]>([]);
    const chartsContainerRef = useRef<HTMLDivElement>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const columnToApiSortMap: Record<number, string> = {
        0: 'creditid',
        1: 'client',
        2: 'amount',
        3: 'date'
    };
    
    // Используем хук для адаптивного размера страницы
    const { pageSize: responsivePageSize, containerRef } = useResponsivePageSize({
        defaultPageSize: 10,
        minPageSize: 1,
        maxPageSize: 50,
        rowHeight: 30,
        headerHeight: 300,
        paginationHeight: 65,
    });
    
    const pageSizeRef = useRef(responsivePageSize);
    const itemsPerPage = responsivePageSize;
    
    const { exportData, isExporting, exportProgress } = useExport<ScheduleDetails>();

    const { 
        isLoading, 
        error, 
        scheduleData, 
        getList
    } = useSchedule();
    
    const shouldShowScheduleTab = hasRole('директор') || hasRole('суперадмин') || hasPermission('MANAGE_ACCOUNTING', true) || hasRole('админ');
    
    const saveActiveTabToStorage = useCallback((tab: TabType) => {
        localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
    }, []);

    // Обновляем ref при изменении pageSize
    useEffect(() => {
        pageSizeRef.current = responsivePageSize;
        setIsPageSizeReady(true);
    }, [responsivePageSize]);

    useEffect(() => {
        if (!shouldShowScheduleTab && activeTab === 'schedule') {
            setActiveTab('table');
        }
    }, [shouldShowScheduleTab, activeTab]);

    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
        saveActiveTabToStorage(tab);
    }, [saveActiveTabToStorage]);

    useEffect(() => {
        const loadScheduleAnalytics = async () => {
            try {
                const currentYear = new Date().getFullYear();
                const result = await getScheduleAnalityc(currentYear);
                if (result) {
                    setScheduleAnalytics(result);
                }
            } catch (err) {
                console.error('Ошибка загрузки аналитики графика:', err);
            }
        };

        if (activeTab === 'schedule') {
            loadScheduleAnalytics();
        }
    }, [activeTab, getScheduleAnalityc]);

    useEffect(() => {
        const container = chartsContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const chartHeight = container.scrollHeight / (scheduleAnalytics.length - 1 || 1);
            const newIndex = Math.floor(scrollTop / chartHeight);
            
            if (newIndex !== currentChartIndex && newIndex >= 0 && newIndex < (scheduleAnalytics.length - 1 || 1)) {
                setCurrentChartIndex(newIndex);
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [scheduleAnalytics.length, currentChartIndex]);

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setViewingCreditId(null);
    };

    const handlePrintReceipt = async (paymentId: number) => {
        try {
        await paymentConfirmationGenerator.generatePaymentConfirmation(paymentId);
        console.log('Чек успешно сгенерирован');
        } catch (error) {
        console.error('Ошибка при печати чека:', error);
        alert('Платёж создан, но произошла ошибка при печати чека');
        }
    };

    const handleDotClick = (index: number) => {
        setCurrentChartIndex(index);
        const container = chartsContainerRef.current;
        if (container) {
            const chartHeight = container.scrollHeight / (scheduleAnalytics.length - 1 || 1);
            container.scrollTo({
                top: index * chartHeight,
                behavior: 'smooth'
            });
        }
    };

    const handleOpenPaymentModal = async (schedule: ScheduleDetails) => {
        try {
            const credit = await creditService.getCreditById(schedule.creditId);
            setSelectedCredit(credit);
            setSelectedScheduleForPayment(schedule);
            setIsPaymentModalOpen(true);
        } catch (error) {
            console.error('Ошибка при загрузке данных кредита:', error);
            alert('Не удалось загрузить данные кредита');
        }
    };

    const handleSavePayment = async (paymentData: {
        paymentDate: string;
        principalAmount: number;
        paymentMethod: 'cash' | 'card';
        bankCardId?: number;
    }) => {
        try {
            if (!selectedScheduleForPayment) return;
            
            const paymentRequest = {
                creditId: selectedScheduleForPayment.creditId,
                paymentAmount: paymentData.principalAmount,
                datePayment: paymentData.paymentDate,
                type: paymentData.paymentMethod,
                bankCardId: paymentData.bankCardId
            };
            
            const result = await createPayment(paymentRequest);
            
            await loadSchedules();
            setIsPaymentModalOpen(false);
            setSelectedScheduleForPayment(null);
            setSelectedCredit(null);
            
            return result;
        } catch (error) {
            console.error('Ошибка при сохранении платежа:', error);
            throw error;
        }
    };

    const getRowStyles = (
        tableData: any[][], 
        scheduleData?: { items: ScheduleDetails[] }
    ): Record<number, RowStyle> => {
        const styles: Record<number, RowStyle> = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!scheduleData?.items) return styles;

        scheduleData.items.forEach((schedule, index) => {
            const paymentDate = new Date(schedule.paymentDate);
            paymentDate.setHours(0, 0, 0, 0);

            if (index === selectedRow) {
                styles[index] = {
                    backgroundColor: '#007D88',
                    color: 'white',
                    fontWeight: 'normal'
                };
            } 
            else if (paymentDate < today) {
                styles[index] = {
                    backgroundColor: '#FFEBEE',
                    color: 'black',
                    fontWeight: 'normal'
                };
            }
            else {
                styles[index] = {
                    backgroundColor: 'white',
                    color: 'black',
                    fontWeight: 'normal'
                };
            }
        });

        return styles;
    };

    const handleRowClick = (rowData: any[], rowIndex: number) => {
        setSelectedRow(rowIndex === selectedRow ? null : rowIndex);
    };

    const handleRowDoubleClick = (rowData: any[]) => {
        const schedule = scheduleData?.items.find(s => 
            s.creditId.toString() === rowData[0] && 
            s.clientName === rowData[1]
        );
        
        if (schedule) {
            setViewingCreditId(schedule.creditId);
            setIsViewModalOpen(true);
        }
    };
        
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

    const loadSchedules = useCallback(async () => {
        if (!isPageSizeReady) return;
        
        const params: ScheduleParams = {
            page: currentPage,
            pageSize: itemsPerPage,
            clientName: clientNameFilter || undefined,
            dateFrom: dateFromFilter ? parseDateInput(dateFromFilter) : undefined,
            dateTo: dateToFilter ? parseDateInput(dateToFilter) : undefined
        };

        if (selectedEntity && selectedEntity.id != 0) {
            if (selectedEntity.type === 'investor') {
                params.investorId = selectedEntity.id;
            } else if (selectedEntity.type === 'pool') {
                params.poolId = selectedEntity.id;
            }
        }

        if (sortConfig.key !== null) {
            params.sortBy = columnToApiSortMap[sortConfig.key];
            params.sortDirection = sortConfig.direction;
        }

        await getList(params);
    }, [currentPage, clientNameFilter, investorFilter, dateFromFilter, dateToFilter, sortConfig, selectedEntity, getList, itemsPerPage, isPageSizeReady]);
    
    useEffect(() => {
        if (activeTab === 'table' && isPageSizeReady) {
            loadSchedules();
        }
    }, [currentPage, clientNameFilter, investorFilter, dateFromFilter, dateToFilter, sortConfig, loadSchedules, activeTab, selectedEntity, isPageSizeReady]);

    const handleClientNameFilterChange = (value: string) => {
        setClientNameFilter(value);
        setCurrentPage(1);
    };

    const handleInvestorFilterChange = (value: string) => {
        setInvestorFilter(value);
        setSelectedEntity(null);
        setCurrentPage(1);
    };

    const handleEntitySelect = (investor: { 
        id: number; 
        nickname: string; 
        fullName: string; 
        phoneNumber: string;
        investorPie: number;
        investmentAmount: number;
        balance: number;
        type?: 'investor' | 'pool';
    }) => {
        setInvestorFilter(investor.nickname || investor.fullName);
        setSelectedEntity({
            id: investor.id,
            name: investor.nickname || investor.fullName,
            type: investor.type || 'investor'
        });
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

                    if (selectedEntity && selectedEntity.id != 0) {
                        if (selectedEntity.type === 'investor') {
                            params.investorId = selectedEntity.id;
                        } else if (selectedEntity.type === 'pool') {
                            params.poolId = selectedEntity.id;
                        }
                    }
                    
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
                    'Телефон': schedule.clientPhone,
                    'ФИО поручителя': schedule.guarantorFullname,
                    'Телефон поручителя': schedule.guarantorPhone,
                    'Платеж': formatMoney(schedule.paymentAmount.toString()),
                    'Дата платежа': formatDate(schedule.paymentDate),
                    'Уведомлен': schedule.notified ? 'Да' : 'Нет'
                })
            });
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const tableActions = [
        {
            label: 'Договор',
            action: (rowData: any[]) => {
                const schedule = scheduleData?.items.find(s => 
                    s.creditId.toString() === rowData[0] && 
                    s.clientName === rowData[1]
                );
                
                if (schedule) {
                    const schedule = scheduleData?.items.find(s => 
                        s.creditId.toString() === rowData[0] && 
                        s.clientName === rowData[1]
                    );
                    
                    if (schedule) {
                        setViewingCreditId(schedule.creditId);
                        setIsViewModalOpen(true);
                    }
                }
            },
            color: '#007D88'
        },
        {
            label: 'Добавить платёж',
            action: (rowData: any[]) => {
                const schedule = scheduleData?.items.find(s => 
                    s.creditId.toString() === rowData[0] && 
                    s.clientName === rowData[1]
                );
                
                if (schedule) {
                    handleOpenPaymentModal(schedule);
                }
            },
            color: '#008b8b'
        }
    ];
    
    const tableData = scheduleData?.items.map(schedule => {
        const formattedAmount = formatMoney(schedule.paymentAmount.toString());
        const formattedDate = formatDate(schedule.paymentDate);
        
        const handleWhatsAppClick = async () => {
            const success = await sendWhatsAppMessage(
                schedule.id,
                schedule.clientPhone,
            );
            
            if (success) {
                loadSchedules();
            }
        };
        
        return [
            schedule.creditId.toString(),
            schedule.clientName,
            formattedAmount,
            formattedDate,
            schedule.notified ? (
                <button 
                    onClick={handleWhatsAppClick}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0'
                    }}
                    title="Отправить повторно"
                >
                    <CheckIcon />
                </button>
            ) : (
                <button 
                    onClick={handleWhatsAppClick}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0'
                    }}
                    title="Отправить уведомление"
                >
                    <WhatsAppIcon />
                </button>
            )
        ];
    }) || [];

    const rowStyles = getRowStyles(tableData, scheduleData);

    const mainChart = scheduleAnalytics[0];
    
    const additionalCharts = scheduleAnalytics.slice(1);

    const loadScheduleAnalyticsForYear = async (year: number) => {
        try {
            const result = await getScheduleAnalityc(year);
            if (result) {
            setScheduleAnalytics(result);
            }
        } catch (err) {
            console.error('Ошибка загрузки аналитики графика:', err);
        }
    };

    useEffect(() => {
        if (activeTab === 'schedule') {
            loadScheduleAnalyticsForYear(selectedYear);
        }
    }, [activeTab, selectedYear, getScheduleAnalityc]);

    const renderMainChart = () => {
    if (!mainChart) {
        return <EmptyChart>Нет данных для отображения</EmptyChart>;
    }

    return (
        <MainChartCard>
        <SchedulePieChart 
            title={`${mainChart.title}`}
            data={mainChart}
            isMainChart={true}
            currentYear={selectedYear}
            onYearChange={(year) => {
            setSelectedYear(year);
            loadScheduleAnalyticsForYear(year);
            }}
        />
        </MainChartCard>
    );
    };

    const renderAdditionalCharts = () => {
        if (additionalCharts.length === 0) {
            return <EmptyChart>Нет дополнительных данных</EmptyChart>;
        }

        return (
            <ChartsScrollContainer ref={chartsContainerRef}>
                {additionalCharts.map((chartData, index) => (
                    <ChartCard key={index}>
                        <SchedulePieChart 
                            title={`${chartData.title}`}
                            data={chartData}
                        />
                    </ChartCard>
                ))}
            </ChartsScrollContainer>
        );
    };

    const tabs = [
        ...(shouldShowScheduleTab ? [{
            id: 'schedule',
            label: 'График',
            content: (
                <ScheduleContainer>
                    <LeftContainer>
                        {renderMainChart()}
                    </LeftContainer>
                    <RightContainer>
                        {renderAdditionalCharts()}
                        {additionalCharts.length > 0 && (
                            <ChartsNavigation>
                                <PaginationDots 
                                    count={additionalCharts.length} 
                                    activeIndex={currentChartIndex}
                                    onClick={handleDotClick}
                                    className="vertical"
                                />
                            </ChartsNavigation>
                        )}
                    </RightContainer>
                </ScheduleContainer>
            )
        }] : []),
        {
            id: 'table',
            label: 'Таблица',
            content: (
                <>
                    <FilterContainer>
                        <FilterField>
                            <InputWrapper>
                                <CustomInput
                                    inputType="text"
                                    placeholder="Клиент"
                                    value={clientNameFilter}
                                    onChange={(e) => handleClientNameFilterChange(e.target.value)}
                                    
                                />
                            </InputWrapper>
                            <InputWrapper>
                                <InvestorSelect
                                    placeholder="Инвестор или пул"
                                    value={investorFilter}
                                    onChange={handleInvestorFilterChange}
                                    onInvestorSelect={handleEntitySelect}
                                    includePools={true}
                                />
                            </InputWrapper>
                            <DateInputWrapper>
                                <CustomCalendar 
                                    prefix="От"
                                    value={dateFromFilter}
                                    onChange={handleDateFromFilterChange}
                                />
                            </DateInputWrapper>
                            <DateInputWrapper>
                                <CustomCalendar
                                    prefix="До"
                                    value={dateToFilter}
                                    onChange={handleDateToFilterChange}
                                />
                            </DateInputWrapper>
                        </FilterField>
                    </FilterContainer>
                    
                    {isLoading && <div>Загрузка...</div>}
                    {error && <div>Ошибка: {error}</div>}
                    
                    {!isLoading && !error && (
                        <>
                            <CustomTable 
                                columns={[
                                    { name: "Договор №", isSortable: true },
                                    { name: "ФИО", isSortable: true, align: "left" },
                                    { name: "Платёж", isSortable: true, align: "right" },
                                    { name: "Дата платежа", isSortable: true, align: "right" },
                                    { name: "Уведомлён", align: "center" },
                                ]} 
                                data={tableData}
                                onSort={handleSort}
                                onRowClick={handleRowClick}
                                onRowDoubleClick={handleRowDoubleClick}
                                sortConfig={sortConfig}
                                rowStyles={rowStyles}
                                selectedRow={selectedRow}
                                contextMenuActions={tableActions}
                            />
                            
                            <PaginationLayout>
                                <CountInfoTitle 
                                    total={scheduleData?.totalCount || 0} 
                                />
                                
                                <Pagination
                                    total={scheduleData?.totalCount || 0}
                                    current={currentPage}
                                    onChange={setCurrentPage}
                                    itemsPerPage={itemsPerPage}
                                />
                            </PaginationLayout>
                        </>
                    )}
                </>
            )
        }
    ];

    return (
        <PageLayout ref={containerRef}>
            <TitleField>
                <CustomTitle>Ожидаемые платежи</CustomTitle>
                <ExportButton 
                    onClick={handleExport}
                    isExporting={isExporting}
                    exportProgress={exportProgress}
                />
            </TitleField>
            
            <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={handleTabChange}
            />

            <NewPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedScheduleForPayment(null);
                    setSelectedCredit(null);
                }}
                onSubmit={handleSavePayment}
                creditId={selectedScheduleForPayment?.creditId || 0}
                clientName={selectedScheduleForPayment?.clientName || ''}
                investorName={selectedCredit?.investorNickname || ''}
                clientPhone={selectedScheduleForPayment?.clientPhone || ''}
                currentDebt={selectedCredit?.rest || 0}
                currentMonthDebt={selectedScheduleForPayment?.paymentAmount || 0}
                onPrintReceipt={handlePrintReceipt}
            />

            <ViewCreditModal
                id={viewingCreditId || 0}
                isOpen={isViewModalOpen}
                onClose={handleCloseViewModal}
            />
        </PageLayout>
    );
};

const ScheduleContainer = styled.div`
  display: flex;
  gap: 20px;
  height: 600px;
`;

const LeftContainer = styled.div`
  flex: 1;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RightContainer = styled.div`
  flex: 1;
  display: flex;
  gap: 20px;
`;

const ChartsNavigation = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChartsScrollContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  padding-right: 10px;

  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const MainChartCard = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChartCard = styled.div`
`;

const EmptyChart = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 16px;
  background: white;
  border-radius: 8px;
  padding: 20px;
`;

const FilterContainer = styled.div`
  margin-bottom: 20px;
`;

const FilterField = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
`;

const InputWrapper = styled.div`
  flex: 1;
  min-width: 200px;
`;

const DateInputWrapper = styled.div`
  flex: 1;
  min-width: 180px;
`;

const FilterInfo = styled.div`
  margin-bottom: 16px;
  padding: 8px 12px;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  color: #0050b3;
  font-size: 14px;
`;

export default SchedulePage;