import { useState, useCallback, useEffect } from 'react';
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import ExportButton from "../components/ui/Buttons/ExportButton";
import CustomInput from "../components/ui/fields/CustomInput";
import Pagination from "../components/ui/fields/CustomPagination";
import CustomTable, { type Column, type RowStyle, type TableAction } from "../components/ui/tables/CustomTable";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
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
import { useAuth } from '../сontext/AuthContext';
import { formatDate } from '../utils/dateFormatter';
import { formatPhoneHref } from '../utils/phoneUtils';
import PhoneLink from '../components/ui/links/PhoneLink';
import PrintOptionModal from '../components/modal/PrintOptionModal';
import PrintIcon from '../assets/ui/print.svg?react';
import InvestorDocxGenerator from '../utils/doxcUtils/investorDocxGenerator';
import CustomCalendar from '../components/ui/fields/CustomCalendar';

const InvestorPage = () => {
    const [nameFilter, setNameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: number | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    const pageSize = 10;
    const { hasRole } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
    const investorDocGenerator = new InvestorDocxGenerator();
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [investorForPrint, setInvestorForPrint] = useState<Investor | null>(null);
    const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(null);
        
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
    
    const handleAddInvestment = (rowData: any[]) => {
        if (!canEdit) return;
        
        const [id] = rowData;
        setSelectedInvestor(investorsData?.items.find(i => i.id === Number(id)) || null);
        setIsInvestmentModalOpen(true);
    };

    const handleSubmitInvestment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvestor) return;

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

    const canEdit = hasRole('директор') || hasRole('суперадмин');

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
            isBlocked: false,
            activeUntil: new Date().toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    };

    const handleEditInvestor = (investor: Investor) => {
        if (!canEdit) return;
        
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

    const handleRowDoubleClick = (rowData: any[], rowIndex: number) => {
        const investor = investorsData?.items.find(i => i.id === Number(rowData[0]));
        if (investor) {
            if (canEdit) {
                handleEditInvestor(investor);
            } else {
                handleViewInvestor(investor);
            }
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

    const tableData = investorsData?.items?.map(investor => {
        if (!investor || investor.id === undefined || investor.id === null) {
            return [
                '',
                ...(canEdit ? [''] : []),
                ...(canEdit ? [''] : []),
                '',
                ...(canEdit ? [''] : []),
                formatMoney('0'),
                formatMoney('0'),
                '',
            ];
        }

        return [
            investor.id.toString(),
            investor.nickname || '',
            ...(canEdit? [investor.fullName || ''] : []),
            ...(canEdit? [investor.phoneNumber ? <PhoneLink href={formatPhoneHref(investor.phoneNumber)}>{investor.phoneNumber}</PhoneLink> : ''] : []),
            ...(canEdit? [investor.investorPie || ''] : []),
            ...(canEdit? [formatMoney((investor.investmentAmount || 0).toString()) || ''] : []),
            formatMoney((investor.balance || 0).toString()),
            formatDate(investor.activeUntil),
            investor.isBlocked?.toString() || 'false',
        ];
    }) ?? [];

    const rowStyles = tableData.reduce((styles, rowData, index) => {
        const isBlockedIndex = canEdit ? 8 : 4;
        const isBlocked = rowData[isBlockedIndex] === 'true';
        
        if (index === selectedRowIndex) {
            styles[index] = {
                backgroundColor: 'rgba(0, 125, 136, 1)',
                color: 'white',
            };
        } 
        // Иначе применяем обычные цвета по статусу
        else if (isBlocked) {
            styles[index] = {
                backgroundColor: '#FFEBEE',
                color: 'black',
                fontWeight: 'normal'
            };
        } else {
            styles[index] = {
                backgroundColor: '#C8E6C9',
                color: 'black',
                fontWeight: 'normal'
            };
        }
        
        return styles;
    }, {} as Record<number, RowStyle>);
    
    const tableActions = (rowData: any[]): TableAction[] => {
        const [id] = rowData;
        const investor = investorsData?.items.find(i => i.id === Number(id));
        const isBlocked = investor?.isBlocked || false;

        const actions: TableAction[] = [
            {
                label: 'Печать договора',
                action: (rowData) => {
                    const [id] = rowData;
                    const investor = investorsData?.items.find(i => i.id === Number(id));
                    if (investor) {
                        setInvestorForPrint(investor);
                        setIsPrintModalOpen(true);
                    }
                },
                color: '#3B82F6'
            }
        ];

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
                    },
                    {
                        label: 'Удалить',
                        action: (rowData) => handleDeleteInvestor(rowData),
                        color: '#EF4444'
                    }
                );
            } else {
                actions.push(
                    {
                        label: 'Добавить инвестицию',
                        action: (rowData) => handleAddInvestment(rowData),
                        color: '#10B981'
                    },
                    {
                        label: 'Удалить',
                        action: (rowData) => handleDeleteInvestor(rowData),
                        color: '#EF4444'
                    },
                    {
                        label: 'Заблокировать инвестора',
                        action: (rowData) => handleBlockInvestor(rowData),
                        color: '#F59E0B'
                    }
                );
            }
        }

        return actions;
    };

    const handleBlockInvestor = async (rowData: any[]) => {
        if (!canEdit) return;
        
        const [id] = rowData;
        
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
        { name: "Никнейм", align: "left" },
        ...(canEdit)
            ? [{ name: "ФИО (видно только директору)", isSortable: true, align: "left" } as Column]
            : [],
        ...(canEdit)
            ? [{ name: "Телефон", align: "left" } as Column]
            : [],
        ...(canEdit)
            ? [{ name: "Доля инвестора", isSortable: true, align: "right" } as Column]
            : [],
        ...(canEdit)
            ? [{ name: "Инвестиция", isSortable: true, align: "right" } as Column]
            : [],
        { name: "Касса", isSortable: true, align: "right" },
        { name: "Дата окончания договора" },
        { name: "isBlocked", isHidden: true },
    ];

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Инвесторы</CustomTitle>
                {/* Кнопка печати добавлена слева от экспорта */}
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
                <ExportButton 
                    onClick={handleExport}
                    isExporting={isExporting}
                    exportProgress={exportProgress}
                >
                    Экспорт
                </ExportButton>
            </TitleField>
            
            {canEdit && (
                <FilterField>
                    <DarkCyanButton 
                        style={{ width: "15vw", marginLeft: "auto" }}
                        onClick={handleCreateInvestor}
                    >
                        + Новый инвестор
                    </DarkCyanButton>
                </FilterField>
            )}
            
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
                    isCompany: false,
                    isBlocked: false,
                    activeUntil: new Date().toISOString().split('T')[0]
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
        </PageLayout>
    );
};

export default InvestorPage;
