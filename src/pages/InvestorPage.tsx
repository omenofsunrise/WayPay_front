import { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import ExportButton from "../components/ui/Buttons/ExportButton";
import CustomInput from "../components/ui/fields/CustomInput";
import Pagination from "../components/ui/fields/CustomPagination";
import CustomTable, { type Column, type RowStyle, type TableAction } from "../components/ui/tables/CustomTable";
import PageLayout from "../components/ui/Layouts/PageLayout";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import CustomTitle from "../components/ui/Text/CustomTitle";
import InvestorModal from '../components/modal/CrudInherited/InvestorModal';
import useExport from '../api/hooks/useExport';
import type { Investor, InvestorParams } from '../api/types/investor';
import investorService from '../api/services/investorService';
import useInvestor from '../api/hooks/useInvestor';
import { formatMoney, parseMoney } from '../utils/formatPrice';
import BaseModal from '../components/modal/BASE/modalCRUBase';
import { InputContainer, InputLabel, InputRow } from '../components/Containers/InputComponents';
import useInvestorShare from "../api/hooks/useInvestorShare";
import { useAuth } from '../сontext/AuthContext';
import { formatDate } from '../utils/dateFormatter';
import { formatPhoneHref } from '../utils/phoneUtils';
import PhoneLink from '../components/ui/links/PhoneLink';
import PrintOptionModal from '../components/modal/PrintOptionModal';
import PrintIcon from '../assets/ui/print.svg?react';
import InvestorDocxGenerator from '../utils/doxcUtils/investorDocxGenerator';
import CustomCalendar from '../components/ui/fields/CustomCalendar';
import { useResponsivePageSize } from '../utils/useResponsivePageSize';
import InvestorCashPositionModal from '../components/modal/InvestorCashPositionModal';

type InvestorPageProps = {
    embedded?: boolean;
    onOpenReport?: (investorId: number, action?: "payout") => void;
    onOpenDeletedReport?: () => void;
};

const InvestorPage = ({
    embedded = false,
    onOpenReport,
    onOpenDeletedReport,
}: InvestorPageProps) => {
    const [nameFilter, setNameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: number | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    const [isPageSizeReady, setIsPageSizeReady] = useState(false);
    const { authInfo, hasRole } = useAuth();
    const isPoolV2 = authInfo?.employee?.poolV2 ?? false;
    const canEdit = hasRole('директор') || hasRole('суперадмин');
    // Временные ссылки включены не всем компаниям.
    const investorShareEnabled = authInfo?.employee?.investorShareEnabled ?? false;
    const { createShareLink } = useInvestorShare();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
    const investorDocGenerator = new InvestorDocxGenerator();
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [investorForPrint, setInvestorForPrint] = useState<Investor | null>(null);
    const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(null);
    const [cashPositionInvestor, setCashPositionInvestor] = useState<Investor | null>(null);
    const [isCashPositionModalOpen, setIsCashPositionModalOpen] = useState(false);
    
    // Используем хук для адаптивного размера страницы
    const { pageSize: responsivePageSize, containerRef } = useResponsivePageSize({
        defaultPageSize: 10,
        minPageSize: 1,
        maxPageSize: 50,
        rowHeight: 32,
        headerHeight: 300,
        paginationHeight: 60,
    });

    const pageSizeRef = useRef(responsivePageSize);
    const itemsPerPage = responsivePageSize;
        
    const columnToApiSortMap: Record<number, string> = canEdit
        ? {
            0: 'id',
            1: 'nickname',
            2: 'phoneNumber',
            3: 'investorPie',
            4: 'investmentAmount',
            5: 'balance',
        }
        : { 0: 'id', 1: 'nickname', 2: 'balance' };
    
    const { exportData, isExporting, exportProgress } = useExport<Investor>();

    const { 
        isLoading, 
        error, 
        data: investorsData, 
        getInvestors,
        createInvestor,
        updateInvestor,
        deleteInvestor,
        addInvestment,
        checkInvestorCredits,
        blockInvestor,
        clearInvestor,
        getInvestorAgreement
    } = useInvestor();
    
    const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
    const [investmentAmount, setInvestmentAmount] = useState('');
    const [investmentDate, setInvestmentDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    
    // Обновляем ref при изменении pageSize
    useEffect(() => {
        pageSizeRef.current = responsivePageSize;
        setIsPageSizeReady(true);
    }, [responsivePageSize]);
    
    const handleAddInvestment = (rowData: any[]) => {
        if (!canEdit) return;
        
        const [id] = rowData;
        const investor = investorsData?.items.find(i => i.id === Number(id));
        if (isPoolV2 && investor?.isRemoved) return;

        setSelectedInvestor(investor || null);
        setIsInvestmentModalOpen(true);
    };

    const handleSubmitInvestment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvestor || (isPoolV2 && selectedInvestor.isRemoved)) return;

        try {
            const amount = parseMoney(investmentAmount);
            if (isNaN(amount) || amount <= 0) {
                alert('Пожалуйста, введите корректную сумму инвестиции');
                return;
            }

            // Создаем объект даты из выбранной даты
            const dateObj = new Date(investmentDate);
            const today = new Date();
            
            // Проверяем, является ли выбранная дата сегодняшней
            const isToday = dateObj.toDateString() === today.toDateString();
            
            if (isToday) {
                dateObj.setHours(
                    today.getHours(),
                    today.getMinutes(),
                    today.getSeconds(),
                    today.getMilliseconds()
                );
                console.log('Сегодняшняя дата, время:', dateObj.toLocaleTimeString());
            } else {
                dateObj.setHours(12, 0, 0, 0);
                console.log('Не сегодняшняя дата, установлено 12:00');
            }

            await addInvestment(selectedInvestor.id, amount, dateObj);

            setIsInvestmentModalOpen(false);
            setInvestmentAmount('');
            setInvestmentDate(today.toISOString().split('T')[0]);
            setSelectedInvestor(null); 
            await loadInvestors();
        } catch (err) {
            console.error('Ошибка при добавлении инвестиции:', err);
            alert('Произошла ошибка при добавлении инвестиции');
        }
    };

    const loadInvestors = useCallback(async () => {
        if (!isPageSizeReady) return;
        
        const params: InvestorParams = {
            page: currentPage,
            pageSize: itemsPerPage,
            name: nameFilter || undefined
        };

        if (sortConfig.key !== null) {
            params.sortBy = columnToApiSortMap[sortConfig.key];
            params.sortDirection = sortConfig.direction;
        }

        await getInvestors(params);
    }, [currentPage, nameFilter, sortConfig, getInvestors, itemsPerPage, isPageSizeReady]);
    
    useEffect(() => {
        if (isPageSizeReady) {
            loadInvestors();
        }
    }, [currentPage, nameFilter, sortConfig, loadInvestors, isPageSizeReady]);

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
                    'Телефон': investor.phoneNumber,
                    'Доля инвестора': investor.investorPie + '%',
                    'Сумма инвестиций': formatMoney(investor.investmentAmount.toString()),
                    'Баланс': formatMoney(investor.balance.toString()),
                })
            });
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const handleCreateInvestor = () => {
        if (!canEdit) return;
        
        setModalMode('create');
        setSelectedInvestor({
            id: 0,
            nickname: '',
            fullName: '',
            phoneNumber: '',
            investorPie: 0,
            investmentAmount: 0,
            balance: 0,
            isCompany: false,
            isBlocked: false
        });
        setIsModalOpen(true);
    };

    const handleEditInvestor = (investor: Investor) => {
        if (!canEdit || (isPoolV2 && investor.isRemoved)) return;
        
        setModalMode('edit');
        setSelectedInvestor(investor);
        setIsModalOpen(true);
    };

    const handleDeleteInvestor = async (rowData: any[]) => {
        if (!canEdit) return;
        
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

        if (isPoolV2 && investorToDelete.isRemoved) return;
        
        if (investorToDelete.isCompany) {
            alert('Нельзя удалить свою компанию из инвесторов');
            return;
        }
        
        if (await checkInvestorCredits(Number(id)))
        {
            alert('Нельзя удалить инвестора, привязанного к договору');
            return;
        }
        
        if (window.confirm('Вы уверены, что хотите удалить этого инвестора?')) {
            try {
                await deleteInvestor(Number(id));
                loadInvestors();
            } catch (err) {
                alert('Произошла ошибка');
            }
        }
    };

    const handleSubmitInvestor = async (investorData: Partial<Investor>) => {
        if (modalMode === 'edit' && isPoolV2 && selectedInvestor?.isRemoved) {
            return false;
        }

        try {
            if (modalMode === 'create') {
                await createInvestor(investorData as Omit<Investor, 'id'>);
            } else if (modalMode === 'edit' && selectedInvestor?.id) {
                await updateInvestor(selectedInvestor.id, investorData);
            }
            loadInvestors();
            return true;
        } catch (err) {
            console.error('Ошибка при сохранении инвестора:', err);
            return false;
        }
    };

    const handleRowDoubleClick = (rowData: any[]) => {
        const investor = investorsData?.items.find(i => i.id === Number(rowData[0]));
        if (investor) {
            onOpenReport?.(investor.id);
        }
    };

    const handlePrintContract = async (option: string, investor: Investor) => {
        try {
            if (option === 'investorContract') {
                const agreementData = await getInvestorAgreement(investor.id);
                
                await investorDocGenerator.generateInvestorContract(
                    agreementData,
                    investor.nickname || investor.fullName || 'Инвестор'
                );
            }
        } catch (error) {
            console.error('Ошибка при печати договора:', error);
            alert('Отказано в доступа к данным для печати');
        }
    };

    const handlePrintOptionSelect = (option: string) => {
        if (investorForPrint) {
            handlePrintContract(option, investorForPrint);
        }
        setIsPrintModalOpen(false);
    };

    const handleRowClick = (rowData: any[], rowIndex: number) => {
        const [id] = rowData;
        const investorId = Number(id);
        setSelectedInvestorId(investorId === selectedInvestorId ? null : investorId);
        
        // Устанавливаем инвестора для печати при клике на строке
        const investor = investorsData?.items.find(i => i.id === investorId);
        if (investor) {
            setInvestorForPrint(investor);
        }
    };

    const selectedRowIndex = investorsData?.items?.findIndex(i => i.id === selectedInvestorId) ?? -1;

    const tableData = investorsData?.items?.map((investor, investorIndex) => {
        if (!investor || investor.id === undefined || investor.id === null) {
            return canEdit
                ? ['', '', '', '', formatMoney('0'), formatMoney('0'), 'false']
                : ['', '', formatMoney('0'), 'false'];
        }

        return [
            investor.id.toString(),
            <InvestorIdentityCell>
                <InvestorListAvatar $tone={investorIndex % 5}>
                    {(investor.nickname || investor.fullName || 'И').trim().charAt(0).toUpperCase()}
                </InvestorListAvatar>
                <div>
                    {onOpenReport ? (
                        <InvestorReportLink
                            type="button"
                            $selected={investor.id === selectedInvestorId}
                            onClick={(event) => {
                                event.stopPropagation();
                                onOpenReport(investor.id);
                            }}
                        >
                            {investor.nickname || investor.fullName || `Инвестор ${investor.id}`}
                            {investor.id === selectedInvestorId && <span aria-hidden="true">›</span>}
                        </InvestorReportLink>
                    ) : investor.nickname || ''}
                    {investor.fullName && investor.fullName !== investor.nickname && (
                        <InvestorFullName>{investor.fullName}</InvestorFullName>
                    )}
                </div>
            </InvestorIdentityCell>,
            ...(canEdit? [investor.phoneNumber ? <InvestorPhoneLink href={formatPhoneHref(investor.phoneNumber)}>{investor.phoneNumber}</InvestorPhoneLink> : ''] : []),
            ...(canEdit? [`${investor.investorPie || 0} %`] : []),
            ...(canEdit? [formatMoney((investor.investmentAmount || 0).toString()) || ''] : []),
            formatMoney((investor.balance || 0).toString()),
            investor.isBlocked?.toString() || 'false',
        ];
    }) ?? [];

    const rowStyles = (investorsData?.items || []).reduce((styles, investor, index) => {
        if (index === selectedRowIndex) {
            styles[index] = {
                backgroundColor: '#E8F8F9',
                color: '#172033',
            };
        } else if (isPoolV2 && investor.isRemoved) {
            styles[index] = {
                backgroundColor: '#E5E7EB',
                color: '#374151',
                fontWeight: 'normal'
            };
        } else if (investor.isBlocked) {
            styles[index] = {
                backgroundColor: '#FFEBEE',
                color: 'black',
                fontWeight: 'normal'
            };
        } else {
            styles[index] = {
                backgroundColor: '#FFFFFF',
                color: '#172033',
                fontWeight: 'normal'
            };
        }
        
        return styles;
    }, {} as Record<number, RowStyle>);
    
    const tableActions = (rowData: any[]): TableAction[] => {
        const [id] = rowData;
        const investor = investorsData?.items.find(i => i.id === Number(id));
        const isBlocked = investor?.isBlocked || false;
        const isOwnCash = investor?.isCompany || false;
        const isRemoved = isPoolV2 && investor?.isRemoved;

        const actions: TableAction[] = [
            ...(onOpenReport ? [{
                label: 'Открыть отчёт',
                icon: <ReportActionIcon />,
                action: () => investor && onOpenReport(investor.id),
                color: '#1f2937'
            }] : [])
        ];

        if (canEdit && !isRemoved) {
            actions.push({
                label: 'Редактировать',
                icon: <EditActionIcon />,
                action: () => investor && handleEditInvestor(investor),
                color: '#1f2937'
            });
            if (onOpenReport) {
                actions.push({
                    label: 'Выплатить инвестору',
                    icon: <PayoutActionIcon />,
                    action: () => investor && onOpenReport(investor.id, "payout"),
                    color: '#1f2937'
                });
            }
        }

        actions.push({
            label: 'Печать договора',
            icon: <PrintActionIcon />,
            action: (rowData) => {
                const [id] = rowData;
                const investor = investorsData?.items.find(i => i.id === Number(id));
                if (investor) {
                    setInvestorForPrint(investor);
                    setIsPrintModalOpen(true);
                }
            },
            color: '#1f2937',
            dividerBefore: actions.length > 0
        });

        if (isRemoved) return actions;

        if (isPoolV2 && !investor?.isCompany && !investor?.isCompanyPool) {
            actions.push({
                label: 'Управление кассой',
                action: () => {
                    if (!investor) return;
                    setCashPositionInvestor(investor);
                    setIsCashPositionModalOpen(true);
                },
                color: '#007D88'
            });
        }

        if (canEdit && investorShareEnabled && !isBlocked) {
            actions.push({
                label: 'Временная ссылка',
                action: (rowData) => handleCreateShareLink(rowData),
                color: '#2563EB'
            });
        }

        if (canEdit) {
            if (isBlocked) {
                actions.push(
                    {
                        label: 'Разблокировать инвестора',
                        action: (rowData) => handleBlockInvestor(rowData),
                        color: '#F59E0B'
                    },
                    {
                        label: 'Аннулировать инвестора',
                        action: (rowData) => handleClearInvestor(rowData),
                        color: 'rgba(255, 158, 66, 1)'
                    }
                );
                if (!isOwnCash) {
                    actions.push({
                        label: 'Удалить',
                        action: (rowData) => handleDeleteInvestor(rowData),
                        color: '#EF4444'
                    });
                }
            } else {
                actions.push({
                    label: 'Добавить инвестицию',
                    action: (rowData) => handleAddInvestment(rowData),
                    color: '#10B981'
                });
                if (!isOwnCash) {
                    actions.push({
                        label: 'Удалить',
                        action: (rowData) => handleDeleteInvestor(rowData),
                        color: '#EF4444'
                    });
                }
                actions.push({
                    label: 'Заблокировать инвестора',
                    action: (rowData) => handleBlockInvestor(rowData),
                    color: '#F59E0B'
                });
            }
        }

        return actions;
    };

    // Ссылку инвестор откроет без входа в систему, поэтому показывать её в
    // окне незачем — сразу кладём в буфер обмена и говорим, сколько живёт.
    const handleCreateShareLink = async (rowData: any[]) => {
        const [id] = rowData;
        const investorId = Number(id);
        if (!investorId) return;

        const created = await createShareLink(investorId);
        if (!created?.token) {
            alert('Не удалось создать ссылку. Попробуйте ещё раз.');
            return;
        }

        const link = `${window.location.origin}/investor-public?token=${created.token}`;
        const minutes = created.expiresAt
            ? Math.max(
                1,
                Math.round(
                    (new Date(created.expiresAt).getTime() - Date.now()) / 60000
                )
            )
            : null;
        const note = minutes ? ` Действует ${minutes} мин.` : '';

        try {
            await navigator.clipboard.writeText(link);
            alert(`Ссылка скопирована.${note}`);
        } catch {
            prompt(`Скопируйте ссылку для инвестора.${note}`, link);
        }
    };

    const handleBlockInvestor = async (rowData: any[]) => {
        if (!canEdit) return;
        
        const [id] = rowData;
        const investor = investorsData?.items.find(i => i.id === Number(id));
        if (isPoolV2 && investor?.isRemoved) return;
        
        if (isNaN(Number(id))) {
            console.error('Неверный ID инвестора');
            return;
        }

        if (window.confirm('Вы уверены, что хотите заблокировать этого инвестора?')) {
            try {
                await blockInvestor(Number(id));
                loadInvestors();
            } catch (err) {
                alert('Произошла ошибка при блокировке инвестора');
            }
        }
    };

    const handleClearInvestor = async (rowData: any[]) => {
        if (!canEdit) return;
        
        const [id] = rowData;
        const investor = investorsData?.items.find(i => i.id === Number(id));
        if (isPoolV2 && investor?.isRemoved) return;
        
        if (isNaN(Number(id))) {
            console.error('Неверный ID инвестора');
            return;
        }

        if (window.confirm('Вы уверены, что хотите анулировать этого инвестора?')) {
            try {
                await clearInvestor(Number(id));
                loadInvestors();
            } catch (err) {
                alert('Произошла ошибка при анулировании инвестора');
            }
        }
    };

    const columns: Column[] = [
        { name: "id", isHidden: true },
        { name: "Инвестор", align: "left", isSortable: true, width: canEdit ? "31%" : "60%" },
        ...(canEdit)
            ? [{ name: "Телефон", align: "left", width: "19%" } as Column]
            : [],
        ...(canEdit)
            ? [{ name: "Доля", isSortable: true, align: "right", width: "12%" } as Column]
            : [],
        ...(canEdit)
            ? [{ name: "Инвестиции", isSortable: true, align: "right", width: "18%" } as Column]
            : [],
        { name: "Касса", isSortable: true, align: "right", width: canEdit ? "15%" : "35%" },
        { name: "isBlocked", isHidden: true },
    ];

    return (
        <InvestorListLayout ref={containerRef} $embedded={embedded}>
            <InvestorToolbar $embedded={embedded}>
                {!embedded && <CustomTitle>Инвесторы</CustomTitle>}
                {embedded && <ToolbarSpacer />}
                {!embedded && (
                    <ExportButton
                        icon={<PrintIcon />}
                        onClick={() => {
                            if (!investorForPrint) {
                                alert('Пожалуйста, выберите инвестора из таблицы (клик по строке)');
                                return;
                            }
                            setIsPrintModalOpen(true);
                        }}
                    >
                        Печать
                    </ExportButton>
                )}
                <ExportButton 
                    onClick={handleExport}
                    isExporting={isExporting}
                    exportProgress={exportProgress}
                >
                    Экспорт
                </ExportButton>
                {embedded && canEdit && (
                    <DarkCyanButton
                        style={{ marginLeft: "12px" }}
                        onClick={handleCreateInvestor}
                    >
                        + Добавить инвестора
                    </DarkCyanButton>
                )}
            </InvestorToolbar>
            
            <InvestorFilterField>
                <SearchIcon aria-hidden="true" />
                <InvestorSearchInput
                    type="text"
                    placeholder="Поиск по имени или телефону"
                    value={nameFilter}
                    onChange={(event) => handleFilterChange(event.target.value)}
                />
                {canEdit && !embedded && (
                    <DarkCyanButton 
                        style={{ width: "15vw", marginLeft: "auto" }}
                        onClick={handleCreateInvestor}
                    >
                        + Новый инвестор
                    </DarkCyanButton>
                )}
            </InvestorFilterField>
            
            {isLoading && <div>Загрузка...</div>}
            {error && <div>Ошибка: {error}</div>}
            
            {!isLoading && !error && investorsData && (
                <>
                    <CustomTable 
                        columns={columns} 
                        data={tableData}
                        rowStyles={rowStyles}
                        onRowDoubleClick={handleRowDoubleClick}
                        onRowClick={handleRowClick}
                        selectedRow={selectedRowIndex >= 0 ? selectedRowIndex : null}
                        contextMenuActions={(rowData) => tableActions(rowData)}
                        onSort={handleSort}
                        sortConfig={sortConfig}
                        showContextMenuButton
                        contextMenuButtonActionLimit={3}
                    />
                    
                    <InvestorPaginationLayout>
                        <CountInfoTitle 
                            total={investorsData?.totalCount || 0} 
                        />
                        
                        <Pagination
                            total={investorsData?.totalCount || 0}
                            current={currentPage}
                            onChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                        />
                    </InvestorPaginationLayout>
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
                    isCompany: false,
                    isBlocked: false
                }}
            />

            {isInvestmentModalOpen && selectedInvestor && (
                <BaseModal
                    title={`Добавить инвестицию для ${selectedInvestor.nickname}`}
                    onClose={() => setIsInvestmentModalOpen(false)}
                    onCancel={() => setIsInvestmentModalOpen(false)}
                    onSave={handleSubmitInvestment}
                    isSaveDisabled={!investmentAmount || isNaN(parseFloat(investmentAmount)) || parseFloat(investmentAmount) <= 0}
                    mode="edit"
                >
                    <form onSubmit={handleSubmitInvestment} style={{ padding: '20px' }}>
                        <InputRow>
                            <InputLabel>Сумма инвестиции:</InputLabel>
                            <InputContainer>
                                <CustomInput
                                    name="investmentAmount"
                                    inputType="rubles"
                                    placeholder="Сумма"
                                    value={investmentAmount}
                                    onChange={(e) => setInvestmentAmount(e.target.value)}
                                />
                            </InputContainer>
                        </InputRow>
                        <InputRow>
                            <InputLabel>Дата инвестиции:</InputLabel>
                            <InputContainer>
                                <CustomCalendar
                                    placeholder="Дата инвестиции"
                                    value={investmentDate ? new Date(investmentDate).toISOString().split('T')[0] : ''}
                                    onChange={(dateString) => setInvestmentDate(dateString)}
                                />
                            </InputContainer>
                        </InputRow>
                    </form>
                </BaseModal>
            )}

            <PrintOptionModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                onSelect={handlePrintOptionSelect}
                selectedCredit={null}
                selectedInvestor={investorForPrint}
                printOptions={[
                    { key: 'investorContract', label: 'Договор с инвестором', enabled: true }
                ]}
                modalTitle="Выберите тип договора для печати"
            />

            <InvestorCashPositionModal
                isOpen={isCashPositionModalOpen}
                investor={cashPositionInvestor}
                canEdit={canEdit}
                onClose={() => {
                    setIsCashPositionModalOpen(false);
                    setCashPositionInvestor(null);
                }}
                onChanged={loadInvestors}
            />
        </InvestorListLayout>
    );
};

export default InvestorPage;

const ReportActionIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 3h7l4 4v14H7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M14 3v5h4M10 12h5M10 16h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
);

const EditActionIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m5 16-1 4 4-1L19 8l-3-3L5 16Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="m14.5 6.5 3 3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
);

const PayoutActionIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="1.7" />
        <path d="M5 6v5c0 1.66 3.13 3 7 3s7-1.34 7-3V6M5 11v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
);

const PrintActionIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M7 14h10v7H7z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
);

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

const InvestorListLayout = styled(PageLayout)<{ $embedded: boolean }>`
    position: relative;
    min-width: 0;
    min-height: 0;
    margin: ${({ $embedded }) => ($embedded ? '0' : '0 20px')};
    background: transparent;
    color: #172033;
    font-size: 14px;

    table {
        table-layout: fixed;
    }

    table th,
    table td {
        border-right: 0;
    }

    table thead th {
        height: 40px;
        padding: 10px 16px;
        background: #f8fafc;
        color: #596579;
        font-size: 13px;
        font-weight: 600;
    }

    table tbody tr {
        height: 68px;
        box-shadow: none !important;
    }

    table tbody td {
        padding: 8px 16px;
        border-right: 0;
        color: #26344c;
        font-size: 15px;
    }

    table thead th:last-child {
        padding: 0;
    }

    table tbody td:last-child {
        padding: 0 10px 0 4px;
    }

    table tbody tr::after {
        left: 0;
        width: 100%;
        background: #e6ebf0;
    }

    @media (max-width: 800px) {
        table thead th,
        table tbody td {
            padding-right: 9px;
            padding-left: 9px;
        }
    }
`;

const InvestorToolbar = styled.div<{ $embedded: boolean }>`
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    ${({ $embedded }) => $embedded && `
        position: absolute;
        top: -94px;
        right: 0;
        z-index: 2;
    `}

    > button {
        height: 38px;
        margin: 0;
        border: 1px solid #d7e0e8;
        border-radius: 8px;
        font-size: 14px;
    }

    > button:last-of-type {
        min-width: 164px;
        border-color: #007d88;
    }
`;

const InvestorFilterField = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    margin: 0 0 16px;

    > svg {
        position: absolute;
        left: 15px;
        z-index: 1;
        width: 19px;
        height: 19px;
        color: #718096;
        pointer-events: none;
    }
`;

const InvestorSearchInput = styled.input`
    width: 100%;
    height: 42px;
    padding: 0 16px 0 44px;
    border: 1px solid #d9e1e8;
    border-radius: 8px;
    background: #fff;
    color: #172033;
    font: inherit;
    outline: none;

    &::placeholder {
        color: #8792a3;
    }

    &:focus {
        border-color: #007d88;
        box-shadow: 0 0 0 2px rgba(0, 125, 136, 0.08);
    }
`;

const InvestorPaginationLayout = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 54px;
    margin-top: 10px;

    p {
        margin: 0;
        color: #526074;
        font-size: 13px;
        font-weight: 400;
    }

    > div:last-child {
        margin-top: 0;
        margin-left: auto;
        gap: 6px;
    }

`;

const InvestorReportLink = styled.button<{ $selected: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0;
    border: 0;
    background: transparent;
    color: ${({ $selected }) => ($selected ? '#007d88' : '#172033')};
    font: inherit;
    font-weight: 600;
    cursor: pointer;

    span {
        color: #007d88;
        font-size: 20px;
        line-height: 1;
    }

    &:hover {
        color: #007d88;
    }
`;

const ToolbarSpacer = styled.div`
    margin-left: auto;
`;

const InvestorIdentityCell = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
`;

const avatarTones = [
    { background: '#ddf5f5', color: '#087d88' },
    { background: '#ececfc', color: '#4a60a2' },
    { background: '#e4f6ee', color: '#2f8b6b' },
    { background: '#fff0e3', color: '#8f5734' },
    { background: '#e3edff', color: '#365fa3' },
];

const InvestorListAvatar = styled.div<{ $tone: number }>`
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    border-radius: 50%;
    background: ${({ $tone }) => avatarTones[$tone]?.background || avatarTones[0].background};
    color: ${({ $tone }) => avatarTones[$tone]?.color || avatarTones[0].color};
    font-size: 15px;
    font-weight: 700;
`;

const InvestorFullName = styled.div`
    margin-top: 2px;
    color: #718096;
    font-size: 13px;
    font-weight: 400;
`;

const InvestorPhoneLink = styled(PhoneLink)`
    color: #26344c;
`;
