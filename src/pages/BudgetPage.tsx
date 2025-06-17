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
import CustomInput from "../components/ui/fields/CustomInput"
import useBudgetIncome from "../api/hooks/useBudgetIncome"
import useBudgetOutcome from "../api/hooks/useBudgetOutcome"
import { formatMoney } from "../utils/formatPrice"
import OutcomeModal from "../components/modal/CrudInherited/OutcomeModal"
import IncomeModal from "../components/modal/CrudInherited/IncomeModal"

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

const BudgetPage = () => {
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [showOutcomeModal, setShowOutcomeModal] = useState(false);
    const [newIncome, setNewIncome] = useState({
        amount: '',
        comment: '',
        investorId: ''
    });
    const [newOutcome, setNewOutcome] = useState({
        amount: '',
        comment: ''
    });

    // Initialize with empty states
    const [incomes, setIncomes] = useState<IncomeState>({});
    const [outcomes, setOutcomes] = useState<OutcomeState>({});

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
                if (window.confirm("Вы уверены, что хотите удалить этот доход?")) {
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

    const prepareTableData = (data: any[] = []) => {
        return data.map(item => {
            // Проверяем наличие обязательных полей
            if (!item) return ['', '', '', '']; // или можно вернуть null и отфильтровать потом
            
            const amount = item.amount !== undefined ? formatMoney(item.amount.toString()) : '';
            
            let date = '';
            try {
                date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
            } catch (e) {
                console.error("Invalid date format:", item.createdAt);
                date = '';
            }
            
            const comment = item.comment || '';
            
            return [
                item.id || '',
                amount,
                date,
                comment
            ];
        }).filter(row => row !== null); // если мы возвращали null для некорректных данных
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
                await fetchData(); // Обновляем данные
                return true; // Успешное выполнение
            }
        } catch (error) {
            console.error("Error adding income:", error);
            alert("Произошла ошибка при добавлении дохода"); // Показываем пользователю
            return false; // Ошибка
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
            }
        } catch (error) {
            console.error("Error adding outcome:", error);
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
                <ExportButton />
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
                <div style={{ display: "flex", gap: "10px" }}>
                    <DarkCyanButton 
                        style={{ width: "15vw" }}
                        onClick={() => setShowIncomeModal(true)}
                    >
                        + Доход
                    </DarkCyanButton>
                    <DarkCyanButton 
                        style={{ width: "15vw" }}
                        onClick={() => setShowOutcomeModal(true)}
                    >
                        + Расход
                    </DarkCyanButton>
                </div>
            </FilterField>

            <TablesContainer>
                <TableWrapper>
                    <TableTitle>
                        Доходы: {incomes?.totalIncomeAmount !== undefined ? 
                            formatMoney(incomes.totalIncomeAmount.toString()) : 
                            '0'}
                    </TableTitle>
                    <CustomTable 
                        columns={[
                            { name: "id" },
                            { name: "Сумма", align: "left" },
                            { name: "Дата", isSortable: true, align: "left" },
                            { name: "Комментарий", align: "left" },
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
                    <TableTitle>Расходы: {outcomes?.totalOutcomeAmount ? formatMoney(outcomes.totalOutcomeAmount.toString()) : '0'}</TableTitle>
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
                onClose={() => setShowIncomeModal(false)}
                onSave={(e) => {
                    e.preventDefault();
                    handleAddIncome();
                }}
                newIncome={newIncome}
                setNewIncome={setNewIncome}
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

const TableTitle = styled.h3`
    font-size: 22px;
    font-weight: 500;
    margin: 0;
    color: #333;
    text-align: left;
`;