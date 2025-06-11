import styled from 'styled-components';
import PageLayout from '../../components/ui/Layouts/PageLayout';
import CustomTitle from '../../components/ui/Text/CustomTitle';
import ModalInfoTitle from '../../components/ui/Text/ModalInfoTitle';
import UserContainer from '../../components/Profile/UserContainer';
import ColumnChart from '../../components/Dashboards/ColumnChart';
import ScatterPlot from '../../components/Dashboards/ScatterPlot';
import ResultsContainer from '../../components/Profile/ResultsContainer';
import creditsAmountSvg from '../../assets/ui/analitic/creditsAmount.svg';
import paymentsSvg from '../../assets/ui/analitic/payments.svg';
import { useEmployee } from '../../api/hooks/useEmployee';
import { useEffect, useMemo, useState } from 'react';
import CreditTypes from '../../components/ui/fields/CreditTypes';
import type { Employee } from '../../api/types/employee';

interface EmployeeProfilePageProps {
    employeeId?: number;
}

const EmployeeProfilePage = ({ employeeId }: EmployeeProfilePageProps) => {
    const { 
        authInfo,
        creditsStats, 
        paymentsStats,
        employeeCreditsStats,
        employeePaymentsStats,
        fetchCreditsStats, 
        fetchPaymentsStats,
        fetchEmployeeById,
        fetchEmployeeCreditsStats,
        fetchEmployeePaymentsStats
    } = useEmployee();
    
    useEffect(() => {
            if (employeeId) {
                fetchEmployeeById(employeeId).then(setEmployee);
                fetchEmployeeCreditsStats(employeeId, 12);
                fetchEmployeePaymentsStats(employeeId, 12);
            } else {
                fetchCreditsStats(12);
                fetchPaymentsStats(12);
            }
    }, [employeeId, /* остальные зависимости */]);

    const statsToUse = employeeId ? employeeCreditsStats : creditsStats;
    const paymentsToUse = employeeId ? employeePaymentsStats : paymentsStats;

    const [employee, setEmployee] = useState<Employee | null>(null);
    
    const scatterPlotData = useMemo(() => 
        statsToUse.map((stat, index) => ({
            x: index + 1,
            y: stat.count,
            color: 'rgba(0, 125, 136, 1)',
            name: getMonthName(stat.month),
            value: stat.count
        })), 
        [statsToUse]
    );

const paymentsChartData = useMemo(() => 
    paymentsToUse.map(stat => ({
        label: getShortMonthName(stat.month),
        total: stat.total,
        bars: [
            { 
                name: 'Неподтверждённые, руб', 
                value: stat.notAssumed, 
                color: 'rgba(209, 213, 219, 1)' 
            },
            { 
                name: 'Подтверждённые, руб', 
                value: stat.assumed, 
                color: 'rgba(0, 125, 136, 1)' 
            },
        ]
    })),
[paymentsToUse]); // Используем paymentsToUse вместо paymentsStats

const { currentMonthCount, percentageChange: creditsPercentageChange } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const currentMonthStat = statsToUse.find(
        stat => stat.month === currentMonth && stat.year === currentYear
    );
    
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth === 0) {
        prevMonth = 12;
        prevYear--;
    }
    
    const prevMonthStat = statsToUse.find(
        stat => stat.month === prevMonth && stat.year === prevYear
    );

    const currentCount = currentMonthStat?.count || 0;
    const prevCount = prevMonthStat?.count || 0;
    
    let change = 0;
    let hasChange = false;
    
    if (prevCount > 0 && currentCount > 0) {
        change = ((currentCount - prevCount) / prevCount) * 100;
        hasChange = true;
    } else if (prevCount === 0 && currentCount > 0) {
        change = 100;
        hasChange = true;
    } else if (currentCount === 0 && prevCount > 0) {
        change = -100;
        hasChange = true;
    }

    return {
        currentMonthCount: currentCount,
        percentageChange: {
            value: Math.round(change),
            hasChange,
            isPositive: change > 0,
            isNeutral: change === 0
        }
    };
}, [statsToUse]);

    const { currentMonthPayments, paymentsPercentageChange } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const currentMonthStat = paymentsToUse.find(
        stat => stat.month === currentMonth && stat.year === currentYear
    );
    
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth === 0) {
        prevMonth = 12;
        prevYear--;
    }
    
    const prevMonthStat = paymentsToUse.find(
        stat => stat.month === prevMonth && stat.year === prevYear
    );

    const currentTotal = currentMonthStat?.total || 0;
    const prevTotal = prevMonthStat?.total || 0;
    
    let change = 0;
    let hasChange = false;
    
    if (prevTotal > 0 && currentTotal > 0) {
        change = ((currentTotal - prevTotal) / prevTotal) * 100;
        hasChange = true;
    } else if (prevTotal === 0 && currentTotal > 0) {
        change = 100;
        hasChange = true;
    } else if (currentTotal === 0 && prevTotal > 0) {
        change = -100;
        hasChange = true;
    }

    return {
        currentMonthPayments: currentTotal,
        paymentsPercentageChange: {
            value: Math.round(change),
            hasChange,
            isPositive: change > 0,
            isNeutral: change === 0
        }
    };
}, [paymentsToUse]);

    function getMonthName(month: number): string {
        const months = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        return months[month - 1] || '';
    }

    function getShortMonthName(month: number): string {
        const months = [
            'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
            'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
        ];
        return months[month - 1] || '';
    }

    function formatPaymentAmount(amount: number): string {
        return new Intl.NumberFormat('ru-RU', { 
            style: 'decimal',
            maximumFractionDigits: 0 
        }).format(amount) + ' ₽';
    }

    return (
        <PageLayout>
            <CustomTitle style={{margin: "0"}}>
                {employeeId ? `Профиль сотрудника` : `Мой профиль`}
            </CustomTitle>
            <ModalInfoTitle style={{marginBottom: "0" }}>
                {employeeId ? 'Данные и статистика сотрудника' : 'Личные данные и статистика'}
            </ModalInfoTitle>
            
            <ProfileContent>
                <UserContainer employee={employeeId ? employee : authInfo?.employee} />
                
                <ChartWrapper>
                    <ColumnChart 
                        height={220}
                        title="Статистика платежей" 
                        data={paymentsChartData} 
                        maxValue={Math.max(...paymentsChartData.map(d => d.total), 100000)} 
                        step={Math.ceil(Math.max(...paymentsChartData.map(d => d.total), 100000) / 5)} 
                    />
                </ChartWrapper>
            </ProfileContent>
            <BottomSection>
                <ScatterPlotWrapper>
                    <ScatterPlot
                        title="Количество договоров"
                        data={scatterPlotData}
                        xAxisLabel=""
                        yAxisLabel=""
                        maxX={12}
                        maxY={Math.max(...scatterPlotData.map(d => d.y), 10)}
                        xStep={1}
                        yStep={Math.ceil(Math.max(...scatterPlotData.map(d => d.y), 10) / 5)}
                        height={220}
                        showLegend={false}
                        xAxisCustomLabels={creditsStats.map(stat => getShortMonthName(stat.month))}
                    />
                </ScatterPlotWrapper>
                
                <ResultsWrapper>
                    <ResultsContainer
                        icon={<img src={creditsAmountSvg} alt="Кредиты" />}
                        title="Кол-во договоров в этом месяце"
                        value={currentMonthCount.toString()}
                        percentageChange={creditsPercentageChange}
                    />
                    <ResultsContainer
                        icon={<img src={paymentsSvg} alt="Платежи" />}
                        title="Платежи в этом месяце"
                        value={formatPaymentAmount(currentMonthPayments)}
                        percentageChange={paymentsPercentageChange}
                    />
                </ResultsWrapper>
            </BottomSection>
        </PageLayout>
    );
};

const ProfileContent = styled.div`
    display: flex;
    gap: 15px;
    margin: 10px 0;
    
    @media (max-width: 1200px) {
        flex-direction: column;
    }
`;

const BottomSection = styled.div`
    display: flex;
    gap: 15px;
    margin: 0;
    
    @media (max-width: 1200px) {
        flex-direction: column;
    }
`;

const ChartWrapper = styled.div`
    flex: 4;
`;

const ScatterPlotWrapper = styled.div`
    flex: 2.5;
`;

const ResultsWrapper = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 15px;
    
    & > div {
        flex: 1;
    }
`;

export default EmployeeProfilePage;