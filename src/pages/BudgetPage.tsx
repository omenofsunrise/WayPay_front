import styled from "styled-components"
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton"
import CustomInput from "../components/ui/fields/CustomInput"
import FilterField from "../components/ui/Layouts/FilterField"
import PageLayout from "../components/ui/Layouts/PageLayout"
import TitleField from "../components/ui/Layouts/TitleLayout"
import CustomTitle from "../components/ui/Text/CustomTitle"
import CustomSelect from "../components/ui/fields/CustomSelect"
import { useState, useCallback } from "react"
import ExportButton from "../components/ui/Buttons/ExportButton"
import CustomTable from "../components/ui/tables/CustomTable"
import Pagination from "../components/ui/fields/CustomPagination"
import PaginationLayout from "../components/ui/Layouts/PaginationLayout"
import CountInfoTitle from "../components/ui/Text/CountInfoTitle"

const BudgetPage = () => {
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString().padStart(2, '0'));
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

    const months = [
        { value: "01", label: "Январь" },
        { value: "02", label: "Февраль" },
        { value: "03", label: "Март" },
        { value: "04", label: "Апрель" },
        { value: "05", label: "Май" },
        { value: "06", label: "Июнь" },
        { value: "07", label: "Июль" },
        { value: "08", label: "Август" },
        { value: "09", label: "Сентябрь" },
        { value: "10", label: "Октябрь" },
        { value: "11", label: "Ноябрь" },
        { value: "12", label: "Декабрь" }
    ];

    const currentYear = currentDate.getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => {
        const year = currentYear - 2 + i;
        return { value: year.toString(), label: year.toString() };
    });

    // Моковые данные для доходов
    const allIncomeData = [
        { id: 1, amount: "15 000 Р", date: "01.05.2023", comment: "Зарплата" },
        { id: 2, amount: "5 000 Р", date: "10.05.2023", comment: "Фриланс" },
        { id: 3, amount: "2 500 Р", date: "15.05.2023", comment: "Продажа вещей" },
        { id: 4, amount: "1 000 Р", date: "20.05.2023", comment: "Кэшбэк" },
        { id: 5, amount: "3 000 Р", date: "25.05.2023", comment: "Премия" },
        { id: 6, amount: "1 200 Р", date: "28.05.2023", comment: "Дивиденды" },
        { id: 7, amount: "4 500 Р", date: "30.05.2023", comment: "Подработка" }
    ];

    // Моковые данные для расходов
    const allExpenseData = [
        { id: 1, amount: "3 000 Р", date: "02.05.2023", comment: "Продукты" },
        { id: 2, amount: "1 500 Р", date: "05.05.2023", comment: "Транспорт" },
        { id: 3, amount: "2 000 Р", date: "12.05.2023", comment: "Кафе" },
        { id: 4, amount: "5 000 Р", date: "18.05.2023", comment: "Аренда" },
        { id: 5, amount: "2 300 Р", date: "20.05.2023", comment: "Коммунальные" },
        { id: 6, amount: "1 700 Р", date: "22.05.2023", comment: "Развлечения" },
        { id: 7, amount: "800 Р", date: "25.05.2023", comment: "Подарки" },
        { id: 8, amount: "1 200 Р", date: "28.05.2023", comment: "Одежда" }
    ];

    const [incomePage, setIncomePage] = useState(1);
    const [expensePage, setExpensePage] = useState(1);
    const pageSize = 4;

    // Получение данных для текущей страницы доходов
    const getCurrentIncomeData = useCallback(() => {
        const startIndex = (incomePage - 1) * pageSize;
        return allIncomeData.slice(startIndex, startIndex + pageSize);
    }, [incomePage]);

    // Получение данных для текущей страницы расходов
    const getCurrentExpenseData = useCallback(() => {
        const startIndex = (expensePage - 1) * pageSize;
        return allExpenseData.slice(startIndex, startIndex + pageSize);
    }, [expensePage]);

    // Преобразование данных для таблицы
    const prepareTableData = (data: any[]) => {
        return data.map(item => [
            item.id,
            item.amount,
            item.date,
            item.comment
        ]);
    };

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Бюджет</CustomTitle>
                <CustomTitle>1 000 Р</CustomTitle>
                <ExportButton />
            </TitleField>

            <FilterField>
                <div style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "500px", marginRight: "auto" }}>
                    <CustomSelect
                        placeholder="Месяц"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        options={months}
                        style={{ flex: "0 1 200px" }}
                    />
                    <CustomSelect
                        placeholder="Год"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        options={years}
                        style={{ flex: "0 1 150px" }}
                    />
                </div>
                <DarkCyanButton style={{ width: "15vw" }}>
                    + Добавить
                </DarkCyanButton>
            </FilterField>

            <TablesContainer>
                <TableWrapper>
                    <TableTitle>Доходы</TableTitle>
                    <CustomTable 
                        columns={[
                            { name: "id" },
                            { name: "Сумма", align: "left" },
                            { name: "Дата", isSortable: true, align: "left" },
                            { name: "Комментарий", align: "left" },
                        ]} 
                        data={prepareTableData(getCurrentIncomeData())}
                    />
                    <PaginationLayout>
                        <CountInfoTitle 
                            total={allIncomeData.length} 
                            current={getCurrentIncomeData().length}
                        />
                        <Pagination
                            total={allIncomeData.length}
                            current={incomePage}
                            onChange={setIncomePage}
                            itemsPerPage={pageSize}
                        />
                    </PaginationLayout>
                </TableWrapper>

                <TableWrapper>
                    <TableTitle>Расходы</TableTitle>
                    <CustomTable 
                        columns={[
                            { name: "id" },
                            { name: "Сумма", align: "left" },
                            { name: "Дата", isSortable: true, align: "left" },
                            { name: "Комментарий", align: "left" },
                        ]} 
                        data={prepareTableData(getCurrentExpenseData())}
                    />
                    <PaginationLayout>
                        <CountInfoTitle 
                            total={allExpenseData.length} 
                            current={getCurrentExpenseData().length}
                        />
                        <Pagination
                            total={allExpenseData.length}
                            current={expensePage}
                            onChange={setExpensePage}
                            itemsPerPage={pageSize}
                        />
                    </PaginationLayout>
                </TableWrapper>
            </TablesContainer>
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