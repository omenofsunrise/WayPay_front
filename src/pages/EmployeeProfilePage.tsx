import styled from 'styled-components';
import PageLayout from '../components/ui/Layouts/PageLayout';
import CustomTitle from '../components/ui/Text/CustomTitle';
import ModalInfoTitle from '../components/ui/Text/ModalInfoTitle';
import UserContainer from '../components/Profile/UserContainer';
import ColumnChart from '../components/Dashboards/ColumnChart';
import ScatterPlot from '../components/Dashboards/ScatterPlot';
import ResultsContainer from '../components/Profile/ResultsContainer';
import creditsAmountSvg from '../assets/ui/analitic/creditsAmount.svg';
import paymentsSvg from '../assets/ui/analitic/payments.svg';
import { useEmployee } from '../api/hooks/useEmployee';
import { useEffect, useMemo } from 'react';

const EmployeeProfile = () => {
    const { creditsStats, fetchCreditsStats } = useEmployee();
    
    useEffect(() => {
        fetchCreditsStats(12);
    }, [fetchCreditsStats]);

    const scatterPlotData = useMemo(() => 
        creditsStats.map((stat, index) => ({
            x: index + 1,
            y: stat.count,
            color: 'rgba(0, 125, 136, 1)',
            name: getMonthName(stat.month),
            value: stat.count
        })), 
        [creditsStats]
    );

    const { currentMonthCount, percentageChange } = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        const currentMonthStat = creditsStats.find(
            stat => stat.month === currentMonth && stat.year === currentYear
        );
        
        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear--;
        }
        
        const prevMonthStat = creditsStats.find(
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
    }, [creditsStats]);

    
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
    
    const chartData = [
        {
            label: 'Июнь',
            total: 105000,
            bars: [
                { name: 'Неподтверждённые, руб', value: 50000, color: 'rgba(209, 213, 219, 1)' },
                { name: 'Подтверждённые, руб', value: 55000, color: 'rgba(0, 125, 136, 1)' },
            ]
        },
        {
            label: 'Июль',
            total: 95000,
            bars: [
                { name: 'Неподтверждённые, руб', value: 35000, color: 'rgba(209, 213, 219, 1)' },
                { name: 'Подтверждённые, руб', value: 60000, color: 'rgba(0, 125, 136, 1)' },
            ]
        },
        {
            label: 'Авг',
            total: 85000,
            bars: [
                { name: 'Неподтверждённые, руб', value: 40000, color: 'rgba(209, 213, 219, 1)' },
                { name: 'Подтверждённые, руб', value: 45000, color: 'rgba(0, 125, 136, 1)' },
            ]
        },
        {
            label: 'Сен',
            total: 120000,
            bars: [
                { name: 'Неподтверждённые, руб', value: 40000, color: 'rgba(209, 213, 219, 1)' },
                { name: 'Подтверждённые, руб', value: 80000, color: 'rgba(0, 125, 136, 1)' },
            ]
        },
        {
            label: 'Окт',
            total: 110000,
            bars: [
                { name: 'Неподтверждённые, руб', value: 40000, color: 'rgba(209, 213, 219, 1)' },
                { name: 'Подтверждённые, руб', value: 70000, color: 'rgba(0, 125, 136, 1)' },
            ]
        },
        {
            label: 'Ноя',
            total: 95000,
            bars: [
                { name: 'Неподтверждённые, руб', value: 40000, color: 'rgba(209, 213, 219, 1)' },
                { name: 'Подтверждённые, руб', value: 55000, color: 'rgba(0, 125, 136, 1)' },
            ]
        },
        {
            label: 'Дек',
            total: 125000,
            bars: [
                { name: 'Неподтверждённые, руб', value: 40000, color: 'rgba(209, 213, 219, 1)' },
                { name: 'Подтверждённые, руб', value: 85000, color: 'rgba(0, 125, 136, 1)' },
            ]
        },
        {
            label: 'Янв',
            total: 115000,
            bars: [
                { name: 'Неподтверждённые, руб', value: 65000, color: 'rgba(209, 213, 219, 1)' },
                { name: 'Подтверждённые, руб', value: 50000, color: 'rgba(0, 125, 136, 1)' },
            ]
        },
        {
            label: 'Фев',
            total: 90000,
            bars: [
                { name: 'Неподтверждённые, руб', value: 30000, color: 'rgba(209, 213, 219, 1)' },
                { name: 'Подтверждённые, руб', value: 60000, color: 'rgba(0, 125, 136, 1)' },
            ]
        },
        {
            label: 'Мар',
            total: 130000,
            bars: [
                { name: 'Неподтверждённые, руб', value: 40000, color: 'rgba(209, 213, 219, 1)' },
                { name: 'Подтверждённые, руб', value: 90000, color: 'rgba(0, 125, 136, 1)' },
            ]
        },
        {
            label: 'Апр',
            total: 75000,
            bars: [
                { name: 'Неподтверждённые, руб', value: 30000, color: 'rgba(209, 213, 219, 1)' },
                { name: 'Подтверждённые, руб', value: 45000, color: 'rgba(0, 125, 136, 1)' },
            ]
        },
        {
            label: 'Май',
            total: 110000,
            bars: [
                { name: 'Неподтверждённые, руб', value: 40000, color: 'rgba(209, 213, 219, 1)' },
                { name: 'Подтверждённые, руб', value: 70000, color: 'rgba(0, 125, 136, 1)' },
            ]
        }
    ];

    return (
        <PageLayout>
            <CustomTitle>Профиль</CustomTitle>
            <ModalInfoTitle style={{marginBottom: "0" }}>Личные данные и статистика</ModalInfoTitle>
            
            <ProfileContent>
                <UserContainer />
                
                <ChartWrapper>
                    <ColumnChart 
                        height={220}
                        title="Платежей принял" 
                        data={chartData} 
                        maxValue={140000} 
                        step={20000} 
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
                        percentageChange={percentageChange}
                    />
                    <ResultsContainer
                        icon={<img src={paymentsSvg} alt="Платежи" />}
                        title="Платежи в этом месяце"
                        value="540 000 ₽"
                        percentageChange={{ value: -3, hasChange: true, isPositive: false }}
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

export default EmployeeProfile;