import styled from "styled-components"
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton"
import FilterField from "../components/ui/Layouts/FilterField"
import PageLayout from "../components/ui/Layouts/PageLayout"
import TitleField from "../components/ui/Layouts/TitleLayout"
import CustomTitle from "../components/ui/Text/CustomTitle"
import CustomSelect from "../components/ui/fields/CustomSelect"
import { useState, useCallback, useEffect } from "react"
import ExportButton from "../components/ui/Buttons/ExportButton"
import CustomTable from "../components/ui/tables/CustomTable"
import Pagination from "../components/ui/fields/CustomPagination"
import PaginationLayout from "../components/ui/Layouts/PaginationLayout"
import CountInfoTitle from "../components/ui/Text/CountInfoTitle"
import useBudgetIncome from "../api/hooks/useBudgetIncome"
import useBudgetOutcome from "../api/hooks/useBudgetOutcome"
import { formatMoney } from "../utils/formatPrice"
import OutcomeModal from "../components/modal/CrudInherited/OutcomeModal"
import IncomeModal from "../components/modal/CrudInherited/IncomeModal"
import InvestorSelectModal from "../components/modal/CrudInherited/InvestorSelectModal"
import InvestorModal from "../components/modal/CrudInherited/InvestorModal"
import { BudgetService } from "../api/services/budgetService"
import { formatDate } from "../utils/dateFormatter"
import * as XLSX from 'xlsx';

interface Investor {
  id: number;
  nickname: string;
  fullName: string;
  phoneNumber: string;
  investorPie: number;
  investmentAmount: number;
  balance: number;
}

interface IncomeState {
    items?: any[];
    totalCount?: number;
    totalIncomeAmount?: number;
    page?: number;
}

interface OutcomeState {
    items?: any[];
    totalCount?: number;
    totalOutcomeAmount?: number;
    page?: number;
}

interface Income {
  id: number;
  amount: number;
  date: string;
  comment: string;
  investorName?: string;
  investorId?: number;
}

interface Outcome {
  id: number;
  amount: number;
  date: string;
  comment: string;
}

const BudgetPage = () => {
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [showOutcomeModal, setShowOutcomeModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [newIncome, setNewIncome] = useState({
        amount: '',
        comment: '',
        investorId: ''
    });
    const [newOutcome, setNewOutcome] = useState({
        amount: '',
        comment: ''
    });
    const [investors, setInvestors] = useState<Investor[]>([]);
    const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
    const [isViewInvestorModalOpen, setIsViewInvestorModalOpen] = useState(false);
    const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);

    const [incomes, setIncomes] = useState<IncomeState>({});
    const [outcomes, setOutcomes] = useState<OutcomeState>({});

    const isCurrentMonthAndYear = 
        selectedMonth === currentDate.getMonth() + 1 && 
        selectedYear === currentDate.getFullYear();

    const { 
        getIncomes, 
        createIncome, 
        deleteIncome,
        isLoading: isLoadingIncomes 
    } = useBudgetIncome();

    const { 
        getOutcomes, 
        createOutcome, 
        deleteOutcome,
        isLoading: isLoadingOutcomes 
    } = useBudgetOutcome();

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

    const pageSize = 10;

    const fetchData = useCallback(async () => {
        try {
            const incomeData = await getIncomes({
                month: selectedMonth,
                year: selectedYear,
                page: 1,
                pageSize
            });
            if (incomeData) setIncomes(incomeData);
            
            const outcomeData = await getOutcomes({
                month: selectedMonth,
                year: selectedYear,
                page: 1,
                pageSize
            });
            if (outcomeData) setOutcomes(outcomeData);

        } catch (error) {
            console.error("Error fetching budget data:", error);
        }
    }, [selectedMonth, selectedYear, getIncomes, getOutcomes]);

    const incomeContextMenuActions = [
        {
            label: "Удалить",
            action: (rowData: any[]) => {
                const id = rowData[0];
                if (window.confirm("Вы уверены, что хотите удалить этот приход?")) {
                    handleDeleteIncome(id);
                }
            },
            color: "red"
        }
    ];

    const outcomeContextMenuActions = [
        {
            label: "Удалить",
            action: (rowData: any[]) => {
                const id = rowData[0];
                if (window.confirm("Вы уверены, что хотите удалить этот расход?")) {
                    handleDeleteOutcome(id);
                }
            },
            color: "red"
        }
    ];

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleIncomePageChange = async (page: number) => {
        try {
            const incomeData = await getIncomes({
                month: selectedMonth,
                year: selectedYear,
                page,
                pageSize
            });
            if (incomeData) setIncomes(incomeData);
        } catch (error) {
            console.error("Error fetching incomes:", error);
        }
    };

    const handleOutcomePageChange = async (page: number) => {
        const outcomeData = await getOutcomes({
            month: selectedMonth,
            year: selectedYear,
            page,
            pageSize
        });
        if (outcomeData) setOutcomes(outcomeData);
    };

    const handleExportBudget = async () => {
        setIsExporting(true);
        setExportProgress(0);
        
        try {
            let allIncomes: Income[] = [];
            let page = 1;
            let totalIncomes = 0;
            
            do {
                setExportProgress(Math.min(30, Math.floor((page - 1) * 30 / 5)));
                const incomeData = await BudgetService.getIncomes({
                    month: selectedMonth,
                    year: selectedYear,
                    page,
                    pageSize: 100
                });
                
                if (incomeData?.items) {
                    allIncomes = [...allIncomes, ...incomeData.items];
                    totalIncomes = incomeData.totalCount || 0;
                }
                page++;
            } while (allIncomes.length < totalIncomes);

            let allOutcomes: Outcome[] = [];
            page = 1;
            let totalOutcomes = 0;
            
            do {
                setExportProgress(30 + Math.min(30, Math.floor((page - 1) * 30 / 5)));
                const outcomeData = await BudgetService.getOutcomes({
                    month: selectedMonth,
                    year: selectedYear,
                    page,
                    pageSize: 100
                });
                
                if (outcomeData?.items) {
                    allOutcomes = [...allOutcomes, ...outcomeData.items];
                    totalOutcomes = outcomeData.totalCount || 0;
                }
                page++;
            } while (allOutcomes.length < totalOutcomes);

            setExportProgress(70);
            
            const incomeSheetData = allIncomes.map(income => ({
                'Тип': 'приход',
                'ID': income.id,
                'Сумма': formatMoney(income.amount?.toString() || '0'),
                'Дата': income.date ? formatDate(income.date) : '',
                'Комментарий': income.comment || '',
            }));

            const outcomeSheetData = allOutcomes.map(outcome => ({
                'Тип': 'Расход',
                'ID': outcome.id,
                'Сумма': formatMoney(outcome.amount?.toString() || '0'),
                'Дата': outcome.date ? formatDate(outcome.date) : '',
                'Комментарий': outcome.comment || '',
            }));

            const combinedData = [...incomeSheetData, ...outcomeSheetData];
            
            const totalIncome = allIncomes.reduce((sum, item) => sum + (item.amount || 0), 0);
            const totalOutcome = allOutcomes.reduce((sum, item) => sum + (item.amount || 0), 0);
            const balance = totalIncome - totalOutcome;

            const summaryData = [
                {},
                { 'Тип': 'ИТОГО', 'Сумма': '' },
                { 'Тип': 'Общий приход', 'Сумма': formatMoney(totalIncome.toString()) },
                { 'Тип': 'Общий расход', 'Сумма': formatMoney(totalOutcome.toString()) },
                { 'Тип': 'Баланс', 'Сумма': formatMoney(balance.toString()) }
            ];

            setExportProgress(90);
            
            const workbook = XLSX.utils.book_new();
            
            const mainWorksheet = XLSX.utils.json_to_sheet(combinedData);
            XLSX.utils.book_append_sheet(workbook, mainWorksheet, 'Бюджет');
            
            const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Итоги');
            
            const monthName = months.find(m => m.value === selectedMonth.toString())?.label || selectedMonth;
            const fileName = `Бюджет_${monthName}_${selectedYear}`;
            
            setExportProgress(95);
            
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
            
            setExportProgress(100);
        } catch (error) {
            console.error("Error exporting budget data:", error);
            alert("Произошла ошибка при экспорте данных бюджета");
        } finally {
            setIsExporting(false);
        }
    };

    const prepareTableData = (data: any[] = []) => {
        return data.map(item => {
            if (!item) return ['', '', '', ''];
            
            const amount = item.amount !== undefined ? formatMoney(item.amount.toString()) : '';
            
            let date = '';
            try {
                date = item.date ? new Date(item.date).toLocaleDateString() : '';
            } catch (e) {
                console.error("Invalid date format:", item.createdAt);
                date = '';
            }
            
            const comment = item.comment || '';
            
            return [
                item.id || '',
                amount,
                date,
                item.investorNickname || item.comment
            ];
        }).filter(row => row !== null);
    };

    const handleSelectInvestor = (investor: Investor) => {
        setSelectedInvestor(investor);
        setNewIncome(prev => ({...prev, investorId: investor.id.toString()}));
        setIsInvestorModalOpen(false);
    };

    const handleAddIncome = async () => {
        try {
            const result = await createIncome({
                amount: parseFloat(newIncome.amount),
                comment: newIncome.comment,
                investorId: parseInt(newIncome.investorId)
            });
            
            if (result) {
                setShowIncomeModal(false);
                setNewIncome({ amount: '', comment: '', investorId: '' });
                setSelectedInvestor(null);
                await fetchData();
                return true;
            }
        } catch (error) {
            console.error("Error adding income:", error);
            alert("Произошла ошибка при добавлении прихода");
            return false;
        }
    };

    const handleAddOutcome = async () => {
        try {
            const result = await createOutcome({
                amount: parseFloat(newOutcome.amount),
                comment: newOutcome.comment
            });
            
            if (result) {
                setShowOutcomeModal(false);
                setNewOutcome({ amount: '', comment: '' });
                await fetchData();
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error adding outcome:", error);
            return false;
        }
    };

    const handleDeleteIncome = async (id: number) => {
        try {
            await deleteIncome(id);
            await fetchData();
        } catch (error) {
            console.error("Error deleting income:", error);
        }
    };

    const handleDeleteOutcome = async (id: number) => {
        try {
            await deleteOutcome(id);
            await fetchData();
        } catch (error) {
            console.error("Error deleting outcome:", error);
        }
    };

    const totalBalance = (incomes?.totalIncomeAmount || 0) - (outcomes?.totalOutcomeAmount || 0);

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Бюджет</CustomTitle>
                <CustomTitle>{formatMoney(totalBalance.toString())}</CustomTitle>
                <ExportButton 
                    onClick={handleExportBudget}
                    isExporting={isExporting}
                    exportProgress={exportProgress}
                    title="Экспорт бюджета"
                />
            </TitleField>

            <FilterField>
                <div style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "500px", marginRight: "auto" }}>
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
                </div>
            </FilterField>

            <TablesContainer>
                <TableWrapper>
                    <TableHeader>
                        <TableTitle>
                            Приходы: {incomes?.totalIncomeAmount !== undefined ? 
                                formatMoney(incomes.totalIncomeAmount.toString()) : 
                                '0'}
                        </TableTitle>
                        <DarkCyanButton 
                            style={{ width: "120px" }}
                            onClick={() => setShowIncomeModal(true)}
                        >
                            + Добавить
                        </DarkCyanButton>
                    </TableHeader>
                    <CustomTable 
                        columns={[
                            { name: "id" },
                            { name: "Сумма", align: "left" },
                            { name: "Дата", isSortable: true, align: "left" },
                            { name: "Инвестора никнейм", align: "left" },
                        ]} 
                        data={prepareTableData(incomes?.items)}
                        contextMenuActions={incomeContextMenuActions}
                        isLoading={isLoadingIncomes}
                    />
                    <PaginationLayout>
                        <CountInfoTitle 
                            total={incomes?.totalCount || 0} 
                            current={incomes?.items?.length || 0}
                        />
                        <Pagination
                            total={incomes?.totalCount || 0}
                            current={incomes?.page || 1}
                            onChange={handleIncomePageChange}
                            itemsPerPage={pageSize}
                        />
                    </PaginationLayout>
                </TableWrapper>

                <TableWrapper>
                    <TableHeader>
                        <TableTitle>
                            Расходы: {outcomes?.totalOutcomeAmount ? 
                                formatMoney(outcomes.totalOutcomeAmount.toString()) : 
                                '0'}
                        </TableTitle>
                        <DarkCyanButton 
                            style={{ width: "120px" }}
                            onClick={() => setShowOutcomeModal(true)}
                        >
                            + Добавить
                        </DarkCyanButton>
                    </TableHeader>
                    <CustomTable 
                        columns={[
                            { name: "id" },
                            { name: "Сумма", align: "left" },
                            { name: "Дата", isSortable: true, align: "left" },
                            { name: "Комментарий", align: "left" },
                        ]} 
                        data={prepareTableData(outcomes?.items)}
                        contextMenuActions={outcomeContextMenuActions}
                        isLoading={isLoadingOutcomes}
                    />
                    <PaginationLayout>
                        <CountInfoTitle 
                            total={outcomes?.totalCount || 0} 
                            current={outcomes?.items?.length || 0}
                        />
                        <Pagination
                            total={outcomes?.totalCount || 0}
                            current={outcomes?.page || 1}
                            onChange={handleOutcomePageChange}
                            itemsPerPage={pageSize}
                        />
                    </PaginationLayout>
                </TableWrapper>
            </TablesContainer>

            <IncomeModal
                show={showIncomeModal}
                onClose={() => {
                    setShowIncomeModal(false);
                    setSelectedInvestor(null);
                }}
                onSave={async (e) => {
                    e.preventDefault();
                    await handleAddIncome();
                }}
                newIncome={newIncome}
                setNewIncome={setNewIncome}
                investors={investors}
            />

            <OutcomeModal
                show={showOutcomeModal}
                onClose={() => setShowOutcomeModal(false)}
                onSave={(e) => {
                    e.preventDefault();
                    handleAddOutcome();
                }}
                newOutcome={newOutcome}
                setNewOutcome={setNewOutcome}
            />

            <InvestorSelectModal
                isOpen={isInvestorModalOpen}
                onClose={() => setIsInvestorModalOpen(false)}
                onSubmit={handleSelectInvestor}
            />

            {selectedInvestor && (
                <InvestorModal
                    mode="view"
                    isOpen={isViewInvestorModalOpen}
                    onClose={() => setIsViewInvestorModalOpen(false)}
                    onSubmit={async () => false}
                    initialData={{
                        id: selectedInvestor.id,
                        nickname: selectedInvestor.nickname,
                        fullName: selectedInvestor.fullName,
                        phoneNumber: selectedInvestor.phoneNumber,
                        investorPie: selectedInvestor.investorPie,
                        investmentAmount: selectedInvestor.investmentAmount,
                        balance: selectedInvestor.balance,
                        isCompany: false,
                        isBlocked: false
                    }}
                />
            )}
        </PageLayout>
    );
};

export default BudgetPage;

const TablesContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 20px;
`;

const TableWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const TableHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
`;

export const TableTitle = styled.h3`
    font-size: 22px;
    font-weight: 500;
    margin: 0;
    color: #333;
    text-align: left;
`;