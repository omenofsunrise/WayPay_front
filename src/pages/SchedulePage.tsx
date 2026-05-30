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
import { sendWhatsAppMessage, sendCustomWhatsAppMessage } from '../utils/sendWhatsAppMessage';
import useSender from '../api/hooks/useSender';
import PaymentConfirmationGenerator from '../utils/doxcUtils/paymentConfirmationGenerator';
import type { PaymentTab } from '../api/types/payment';
import paymentService from '../api/services/paymentService';
import { useResponsivePageSize } from '../utils/useResponsivePageSize';
import BaseModal from '../components/modal/BASE/modalCRUBase';

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

const GuarantorWhatsAppIcon = () => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.8437 3.11431C16.8886 2.14984 15.751 1.38511 14.4974 0.864691C13.2437 0.344271 11.899 0.078567 10.5416 0.083064C4.85413 0.083064 0.218709 4.71848 0.218709 10.406C0.218709 12.2289 0.697876 13.9997 1.59371 15.5622L0.135376 20.9164L5.60413 19.4789C7.11454 20.3018 8.81246 20.7393 10.5416 20.7393C16.2291 20.7393 20.8645 16.1039 20.8645 10.4164C20.8645 7.65598 19.7916 5.06223 17.8437 3.11431ZM10.5416 18.9893C8.99996 18.9893 7.48954 18.5726 6.16663 17.7914L5.85413 17.6039L2.60413 18.4581L3.46871 15.2914L3.26038 14.9685C2.40365 13.6008 1.94884 12.0198 1.94788 10.406C1.94788 5.67681 5.80204 1.82265 10.5312 1.82265C12.8229 1.82265 14.9791 2.71848 16.5937 4.34348C17.3933 5.13917 18.027 6.08571 18.4579 7.1282C18.8888 8.17068 19.1085 9.28836 19.1041 10.4164C19.125 15.1456 15.2708 18.9893 10.5416 18.9893ZM15.25 12.5726C14.9895 12.4476 13.7187 11.8226 13.4895 11.7289C13.25 11.6456 13.0833 11.6039 12.9062 11.8539C12.7291 12.1143 12.2395 12.6976 12.0937 12.8643C11.9479 13.0414 11.7916 13.0622 11.5312 12.9268C11.2708 12.8018 10.4375 12.5206 9.45829 11.6456C8.68746 10.9581 8.17704 10.1143 8.02079 9.8539C7.87496 9.59348 7.99996 9.45806 8.13538 9.32265C8.24996 9.20806 8.39579 9.02056 8.52079 8.87473C8.64579 8.7289 8.69788 8.61431 8.78121 8.44765C8.86454 8.27056 8.82288 8.12473 8.76038 7.99973C8.69788 7.87473 8.17704 6.6039 7.96871 6.08306C7.76038 5.58306 7.54163 5.64556 7.38538 5.63515H6.88538C6.70829 5.63515 6.43746 5.69765 6.19788 5.95806C5.96871 6.21848 5.30204 6.84348 5.30204 8.11431C5.30204 9.38515 6.22913 10.6143 6.35413 10.781C6.47913 10.9581 8.17704 13.5622 10.7604 14.6768C11.375 14.9476 11.8541 15.1039 12.2291 15.2185C12.8437 15.4164 13.4062 15.3851 13.8541 15.3226C14.3541 15.2497 15.3854 14.6976 15.5937 14.0935C15.8125 13.4893 15.8125 12.9789 15.7395 12.8643C15.6666 12.7497 15.5104 12.6976 15.25 12.5726Z" fill="#F5A623"/>
  </svg>
);

const NotifyCell = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
`;

type TabType = 'calendar' | 'schedule' | 'table';

const ACTIVE_TAB_STORAGE_KEY = 'schedule_page_active_tab';

// Интерфейс для выбранной сущности
interface SelectedEntity {
  id: number;
  name: string;
  type: 'investor' | 'pool';
}

type SchedulePaymentStatus = 'paid' | 'overdue' | 'transferred' | 'called' | 'pending';

const schedulePaymentStatusMeta: Record<SchedulePaymentStatus, {
    label: string;
    background: string;
    border: string;
    accent: string;
    color: string;
}> = {
    paid: {
        label: 'Оплачен',
        background: '#f0fdf4',
        border: '#86efac',
        accent: '#22c55e',
        color: '#166534'
    },
    overdue: {
        label: 'Просрочен',
        background: '#fef2f2',
        border: '#fca5a5',
        accent: '#ef4444',
        color: '#991b1b'
    },
    transferred: {
        label: 'Перенесен',
        background: '#eff6ff',
        border: '#93c5fd',
        accent: '#3b82f6',
        color: '#1d4ed8'
    },
    called: {
        label: 'Обзвонен',
        background: '#ecfeff',
        border: '#67e8f9',
        accent: '#0891b2',
        color: '#155e75'
    },
    pending: {
        label: 'Ожидает',
        background: '#fffbeb',
        border: '#fde68a',
        accent: '#f59e0b',
        color: '#92400e'
    }
};

const toDateInputValue = (date: Date | string): string => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
};

const getMonthKey = (date: Date | string): string => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '';
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
};

const getCalendarMonths = (startDate: string, endDate: string) => {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), 11, 1);
    start.setDate(1);
    end.setDate(1);

    const months: { key: string; label: string }[] = [];
    const cursor = new Date(start);
    while (cursor <= end && months.length < 24) {
        months.push({
            key: getMonthKey(cursor),
            label: cursor.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' })
        });
        cursor.setMonth(cursor.getMonth() + 1);
    }
    return months;
};

const getCalendarMonthsByPayments = (payments: ScheduleDetails[], fallbackStartDate: string, fallbackEndDate: string) => {
    const validDates = payments
        .map(payment => new Date(payment.paymentDate))
        .filter(date => !Number.isNaN(date.getTime()));

    if (validDates.length === 0) {
        return getCalendarMonths(fallbackStartDate, fallbackEndDate);
    }

    const minDate = new Date(Math.min(...validDates.map(date => date.getTime())));
    const maxDate = new Date(Math.max(...validDates.map(date => date.getTime())));

    minDate.setDate(1);
    maxDate.setDate(1);

    return getCalendarMonths(
        minDate.toISOString().split('T')[0],
        maxDate.toISOString().split('T')[0]
    );
};

const isSchedulePaid = (schedule: ScheduleDetails): boolean => {
    return Boolean(schedule.payed ?? schedule.isPaid);
};

const isScheduleOverdue = (schedule: ScheduleDetails): boolean => {
    if (isSchedulePaid(schedule)) return false;
    const paymentDate = new Date(schedule.paymentDate);
    paymentDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return paymentDate < today;
};

const isScheduleTransferred = (schedule: ScheduleDetails): boolean => {
    const text = `${schedule.comment || ''} ${schedule.userComment || ''}`.toLowerCase();
    return text.includes('перенес') || text.includes('перенос');
};

const getSchedulePaymentStatus = (schedule: ScheduleDetails): SchedulePaymentStatus => {
    if (isSchedulePaid(schedule)) return 'paid';
    if (isScheduleTransferred(schedule)) return 'transferred';
    if (isScheduleOverdue(schedule)) return 'overdue';
    if (schedule.notified) return 'called';
    return 'pending';
};

const getDefaultCalendarDateRange = () => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(end.getMonth() + 3);
    end.setDate(28);

    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
};

const getDaysBetween = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const addDaysToIsoDate = (date: string, days: number): string => {
    const parsed = new Date(date);
    parsed.setDate(parsed.getDate() + days);
    return parsed.toISOString().split('T')[0];
};

const SchedulePage = () => {
    const [activeTab, setActiveTab] = useState<TabType>(() => {
        const savedTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY) as TabType;
        return savedTab && (savedTab === 'calendar' || savedTab === 'schedule' || savedTab === 'table') 
            ? savedTab 
            : 'calendar';
    });
    
    const [clientNameFilter, setClientNameFilter] = useState('');
    const [calendarSearch, setCalendarSearch] = useState('');
    const [calendarSearchQuery, setCalendarSearchQuery] = useState('');
    const [calendarDateFrom, setCalendarDateFrom] = useState(() => getDefaultCalendarDateRange().start);
    const [calendarDateTo, setCalendarDateTo] = useState(() => getDefaultCalendarDateRange().end);
    const [calendarOverdueOnly, setCalendarOverdueOnly] = useState(false);
    const [calendarOverdues, setCalendarOverdues] = useState('');
    const [calendarDateRangeWarning, setCalendarDateRangeWarning] = useState('');
    const [calendarPage, setCalendarPage] = useState(1);
    const [selectedCalendarSchedule, setSelectedCalendarSchedule] = useState<ScheduleDetails | null>(null);
    const [scheduleComment, setScheduleComment] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [isSavingScheduleComment, setIsSavingScheduleComment] = useState(false);
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
    const { GetFilledGuarantorSchedule } = useSender();
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
        calendarData,
        getList,
        getCalendar,
        updateSchedule
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
        if (!shouldShowScheduleTab && (activeTab === 'schedule' || activeTab === 'calendar')) {
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

    const loadCalendarSchedules = useCallback(async () => {
        let safeEndDate = calendarDateTo;
        if (calendarDateFrom && calendarDateTo && getDaysBetween(calendarDateFrom, calendarDateTo) > 120) {
            safeEndDate = addDaysToIsoDate(calendarDateFrom, 120);
            setCalendarDateTo(safeEndDate);
            setCalendarDateRangeWarning('Диапазон календаря ограничен 120 днями.');
        } else {
            setCalendarDateRangeWarning('');
        }

        await getCalendar({
            StartDate: calendarDateFrom ? parseDateInput(calendarDateFrom) : undefined,
            EndDate: safeEndDate ? parseDateInput(safeEndDate) : undefined,
            Search: calendarSearchQuery || undefined,
            Overdue: calendarOverdueOnly || undefined,
            Overdues: calendarOverdues ? Number(calendarOverdues) : undefined,
            ClientsCount: 50,
            ClientsPage: calendarPage
        });
    }, [calendarDateFrom, calendarDateTo, calendarSearchQuery, calendarOverdueOnly, calendarOverdues, calendarPage, getCalendar]);

    useEffect(() => {
        if (activeTab === 'calendar') {
            loadCalendarSchedules();
        }
    }, [activeTab, loadCalendarSchedules]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setCalendarSearchQuery(calendarSearch.trim());
            setCalendarPage(1);
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [calendarSearch]);

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

    const openScheduleCommentModal = (schedule: ScheduleDetails) => {
        setSelectedCalendarSchedule(schedule);
        setScheduleComment(schedule.userComment || '');
        setScheduleDate(toDateInputValue(schedule.paymentDate));
        setIsCommentModalOpen(true);
    };

    const handleSaveScheduleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCalendarSchedule || !scheduleDate) return;

        setIsSavingScheduleComment(true);
        const success = await updateSchedule({
            id: selectedCalendarSchedule.id,
            date: new Date(scheduleDate).toISOString(),
            userComment: scheduleComment.trim() || null
        });
        setIsSavingScheduleComment(false);

        if (!success) {
            alert('Не удалось сохранить комментарий');
            return;
        }

        setIsCommentModalOpen(false);
        setSelectedCalendarSchedule(null);
        await loadCalendarSchedules();
        if (activeTab === 'table') {
            await loadSchedules();
        }
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
                    'Комментарий': schedule.userComment || '',
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

        const handleGuarantorWhatsAppClick = async () => {
            if (!schedule.guarantorPhone) return;
            const message = await GetFilledGuarantorSchedule(schedule.id);
            if (!message) {
                alert('Не удалось получить сообщение для поручителя');
                return;
            }
            await sendCustomWhatsAppMessage(schedule.guarantorPhone, message);
        };

        return [
            schedule.creditId.toString(),
            schedule.clientName,
            formattedAmount,
            formattedDate,
            schedule.userComment || '—',
            (
                <NotifyCell>
                    {schedule.notified ? (
                        <IconButton
                            onClick={handleWhatsAppClick}
                            title="Отправить повторно"
                        >
                            <CheckIcon />
                        </IconButton>
                    ) : (
                        <IconButton
                            onClick={handleWhatsAppClick}
                            title="Отправить уведомление"
                        >
                            <WhatsAppIcon />
                        </IconButton>
                    )}
                    {schedule.guarantorPhone && (
                        <IconButton
                            onClick={handleGuarantorWhatsAppClick}
                            title="Отправить данные договора поручителю"
                        >
                            <GuarantorWhatsAppIcon />
                        </IconButton>
                    )}
                </NotifyCell>
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

    const safeCalendarData = Array.isArray(calendarData) ? calendarData : [];
    const calendarMonths = getCalendarMonthsByPayments(safeCalendarData, calendarDateFrom, calendarDateTo);
    const calendarClients = Array.from(new Map(
        safeCalendarData.map(item => [item.clientName, item.clientName])
    ).values());
    const calendarPaymentsByClient = safeCalendarData.reduce((acc, item) => {
        const clientKey = item.clientName || 'Без имени';
        const monthKey = getMonthKey(item.paymentDate);
        if (!acc[clientKey]) acc[clientKey] = {};
        if (!acc[clientKey][monthKey]) acc[clientKey][monthKey] = [];
        acc[clientKey][monthKey].push(item);
        return acc;
    }, {} as Record<string, Record<string, ScheduleDetails[]>>);

    const tabs = [
        ...(shouldShowScheduleTab ? [{
            id: 'calendar',
            label: 'Календарь',
            content: (
                <>
                    <CalendarToolbar>
                        <CalendarFilterGroup>
                            <SearchField>
                                <CustomInput
                                    inputType="text"
                                    placeholder="Поиск по ФИО"
                                    value={calendarSearch}
                                    onChange={(e) => setCalendarSearch(e.target.value)}
                                />
                                {calendarSearch && (
                                    <SearchClearButton
                                        type="button"
                                        onClick={() => {
                                            setCalendarSearch('');
                                            setCalendarSearchQuery('');
                                            setCalendarPage(1);
                                        }}
                                        aria-label="Очистить поиск"
                                    >
                                        ×
                                    </SearchClearButton>
                                )}
                            </SearchField>
                        </CalendarFilterGroup>
                        <CalendarFilterGroup>
                            <CustomCalendar
                                prefix="От"
                                value={calendarDateFrom}
                                onChange={(date) => {
                                    setCalendarDateFrom(date);
                                    setCalendarPage(1);
                                }}
                            />
                        </CalendarFilterGroup>
                        <CalendarFilterGroup>
                            <CustomCalendar
                                prefix="До"
                                value={calendarDateTo}
                                onChange={(date) => {
                                    setCalendarDateTo(date);
                                    setCalendarPage(1);
                                }}
                            />
                        </CalendarFilterGroup>
                        <CalendarToggleLabel>
                            <input
                                type="checkbox"
                                checked={calendarOverdueOnly}
                                onChange={(e) => {
                                    setCalendarOverdueOnly(e.target.checked);
                                    setCalendarPage(1);
                                }}
                            />
                            Только просрочки
                        </CalendarToggleLabel>
                        <CalendarFilterGroup>
                            <CustomInput
                                inputType="number"
                                placeholder="Кол-во просрочек"
                                value={calendarOverdues}
                                min="1"
                                onChange={(e) => {
                                    setCalendarOverdues(e.target.value.replace(/[^0-9]/g, ''));
                                    setCalendarPage(1);
                                }}
                            />
                        </CalendarFilterGroup>
                    </CalendarToolbar>
                    {calendarDateRangeWarning && (
                        <CalendarWarning>{calendarDateRangeWarning}</CalendarWarning>
                    )}
                    <CalendarLegend>
                        {(Object.keys(schedulePaymentStatusMeta) as SchedulePaymentStatus[]).map(status => (
                            <LegendItem key={status}>
                                <LegendDot $status={status} />
                                {schedulePaymentStatusMeta[status].label}
                            </LegendItem>
                        ))}
                    </CalendarLegend>

                    {isLoading && <div>Загрузка...</div>}
                    {error && <div>Ошибка: {error}</div>}
                    {!isLoading && !error && (
                        <CalendarGridScroll>
                            <CalendarGrid $columns={calendarMonths.length}>
                                <CalendarHeaderCell>Клиент / месяц</CalendarHeaderCell>
                                {calendarMonths.map(month => (
                                    <CalendarHeaderCell key={month.key}>{month.label}</CalendarHeaderCell>
                                ))}

                                {calendarClients.length === 0 && (
                                    <CalendarEmptyCell $columns={calendarMonths.length + 1}>
                                        Нет платежей за выбранный период
                                    </CalendarEmptyCell>
                                )}

                                {calendarClients.map(clientName => [
                                    <CalendarClientCell key={`${clientName}-client`}>{clientName}</CalendarClientCell>,
                                    ...calendarMonths.map(month => {
                                            const payments = calendarPaymentsByClient[clientName]?.[month.key] || [];
                                            return (
                                                <CalendarPaymentCell key={`${clientName}-${month.key}`}>
                                                    {payments.length === 0 ? (
                                                        <CalendarEmptyMark>—</CalendarEmptyMark>
                                                    ) : (
                                                        payments.map(payment => {
                                                            const status = getSchedulePaymentStatus(payment);
                                                            return (
                                                                <PaymentChip
                                                                    key={payment.id}
                                                                    type="button"
                                                                    $status={status}
                                                                    $hasComment={Boolean(payment.userComment?.trim())}
                                                                    onClick={() => openScheduleCommentModal(payment)}
                                                                    title={schedulePaymentStatusMeta[status].label}
                                                                >
                                                                    <PaymentStatusLabel $status={status}>
                                                                        {schedulePaymentStatusMeta[status].label}
                                                                    </PaymentStatusLabel>
                                                                    <PaymentChipAmount>
                                                                        {formatMoney(payment.paymentAmount.toString())}
                                                                    </PaymentChipAmount>
                                                                    <PaymentChipDate>{formatDate(payment.paymentDate)}</PaymentChipDate>
                                                                </PaymentChip>
                                                            );
                                                        })
                                                    )}
                                                </CalendarPaymentCell>
                                            );
                                    })
                                ])}
                            </CalendarGrid>
                        </CalendarGridScroll>
                    )}
                </>
            )
        }] : []),
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
                                    { name: "Комментарий", align: "left" },
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

            {isCommentModalOpen && selectedCalendarSchedule && (
                <BaseModal
                    title="Комментарий к платежу"
                    onClose={() => setIsCommentModalOpen(false)}
                    onCancel={() => setIsCommentModalOpen(false)}
                    onSave={handleSaveScheduleComment}
                    saveButtonText="Сохранить"
                    isSubmitting={isSavingScheduleComment}
                    width="560px"
                >
                    <ScheduleCommentForm>
                        <ScheduleInfoBox>
                            <strong>{selectedCalendarSchedule.clientName}</strong>
                            <span>Договор №{selectedCalendarSchedule.creditId}</span>
                            <span>{formatMoney(selectedCalendarSchedule.paymentAmount.toString())}</span>
                        </ScheduleInfoBox>

                        <ModalField>
                            <InputLabel>Дата платежа</InputLabel>
                            <CustomCalendar
                                prefix=""
                                value={scheduleDate}
                                onChange={setScheduleDate}
                            />
                        </ModalField>

                        <ModalField>
                            <InputLabel>Комментарий</InputLabel>
                            <CommentTextarea
                                value={scheduleComment}
                                onChange={(e) => setScheduleComment(e.target.value)}
                                placeholder="Комментарий по платежу"
                                rows={4}
                            />
                        </ModalField>
                    </ScheduleCommentForm>
                </BaseModal>
            )}

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

const CalendarToolbar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
`;

const CalendarFilterGroup = styled.div`
  min-width: 210px;
`;

const SearchField = styled.div`
  position: relative;
  width: 100%;
`;

const SearchClearButton = styled.button`
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: #e5e7eb;
  color: #374151;
  font-size: 17px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #d1d5db;
  }
`;

const CalendarToggleLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
`;

const CalendarWarning = styled.div`
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid #fde68a;
  border-radius: 8px;
  background: #fffbeb;
  color: #92400e;
  font-size: 14px;
`;

const CalendarLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: -4px 0 14px;
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #ffffff;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
`;

const LegendDot = styled.span<{ $status: SchedulePaymentStatus }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => schedulePaymentStatusMeta[props.$status].accent};
`;

const CalendarGridScroll = styled.div`
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  max-height: calc(100vh - 280px);
`;

const CalendarGrid = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: 260px repeat(${props => props.$columns}, minmax(130px, 160px));
  min-width: max-content;
`;

const CalendarHeaderCell = styled.div`
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 10px 12px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
  text-align: center;

  &:first-child {
    left: 0;
    z-index: 3;
    text-align: left;
  }
`;

const CalendarClientCell = styled.div`
  position: sticky;
  left: 0;
  z-index: 1;
  padding: 10px 12px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  color: #111827;
  font-size: 13px;
  font-weight: 600;
`;

const CalendarPaymentCell = styled.div`
  min-height: 70px;
  padding: 6px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: stretch;
  justify-content: center;
`;

const CalendarEmptyMark = styled.span`
  color: #cbd5e1;
  text-align: center;
  font-size: 13px;
`;

const CalendarEmptyCell = styled.div<{ $columns: number }>`
  grid-column: span ${props => props.$columns};
  padding: 28px;
  color: #6b7280;
  text-align: center;
`;

const PaymentChip = styled.button<{ $status: SchedulePaymentStatus; $hasComment: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  min-height: 58px;
  padding: 7px 8px;
  border: 1px solid ${props => schedulePaymentStatusMeta[props.$status].border};
  border-left: 3px solid ${props => schedulePaymentStatusMeta[props.$status].accent};
  border-radius: 7px;
  background: ${props => schedulePaymentStatusMeta[props.$status].background};
  color: #111827;
  cursor: pointer;

  &::after {
    content: ${props => props.$hasComment ? '"💬"' : '""'};
    position: absolute;
    top: 3px;
    right: 5px;
    font-size: 10px;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
    transform: translateY(-1px);
  }
`;

const PaymentStatusLabel = styled.span<{ $status: SchedulePaymentStatus }>`
  color: ${props => schedulePaymentStatusMeta[props.$status].color};
  font-size: 10px;
  font-weight: 800;
  line-height: 1.1;
  text-transform: uppercase;
`;

const PaymentChipAmount = styled.span`
  font-size: 12px;
  font-weight: 800;
`;

const PaymentChipDate = styled.span`
  font-size: 11px;
  color: #64748b;
`;

const ScheduleCommentForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 4px;
`;

const ScheduleInfoBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
  color: #111827;
  font-size: 14px;
`;

const ModalField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CommentTextarea = styled.textarea`
  width: 100%;
  min-height: 96px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: #111827;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #007d88;
  }
`;

export default SchedulePage;
