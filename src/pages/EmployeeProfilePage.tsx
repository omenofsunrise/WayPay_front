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

const EmployeeProfile = () => {
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
                { name: 'Неподтверждённые, руб', value: 50000, color: 'rgba(209, 213, 219, 1)' },
                { name: 'Подтверждённые, руб', value: 80000, color: 'rgba(0, 125, 136, 1)' },
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
                        maxValue={130000} 
                        step={20000} 
                    />
                </ChartWrapper>
            </ProfileContent>
            <BottomSection>
                <ScatterPlotWrapper>
                    <ScatterPlot
                        title="Количество договоров"
                        data={[
                            { x: 1, y: 20, color: 'rgba(0, 125, 136, 1)', name: 'Июнь', value: 15000 },
                            { x: 2, y: 40, color: 'rgba(0, 125, 136, 1)', name: 'Июль', value: 25000 },
                            { x: 3, y: 35, color: 'rgba(0, 125, 136, 1)', name: 'Август', value: 22000 },
                            { x: 4, y: 50, color: 'rgba(0, 125, 136, 1)', name: 'Сентябрь', value: 32000 },
                            { x: 5, y: 45, color: 'rgba(0, 125, 136, 1)', name: 'Октябрь', value: 28000 },
                            { x: 6, y: 60, color: 'rgba(0, 125, 136, 1)', name: 'Ноябрь', value: 40000 },
                            { x: 7, y: 55, color: 'rgba(0, 125, 136, 1)', name: 'Декабрь', value: 38000 },
                            { x: 8, y: 70, color: 'rgba(0, 125, 136, 1)', name: 'Январь', value: 45000 },
                            { x: 9, y: 65, color: 'rgba(0, 125, 136, 1)', name: 'Февраль', value: 42000 },
                            { x: 10, y: 80, color: 'rgba(0, 125, 136, 1)', name: 'Март', value: 52000 },
                            { x: 11, y: 75, color: 'rgba(0, 125, 136, 1)', name: 'Апрель', value: 48000 },
                            { x: 12, y: 90, color: 'rgba(0, 125, 136, 1)', name: 'Май', value: 60000 }
                        ]}
                        xAxisLabel=""
                        yAxisLabel=""
                        maxX={12}
                        maxY={100}
                        xStep={1}
                        yStep={20}
                        height={220}
                        showLegend={false}
                        xAxisCustomLabels={['Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май']}
                    />
                </ScatterPlotWrapper>
                
                <ResultsWrapper>
                    <ResultsContainer
                        icon={<img src={creditsAmountSvg} alt="Кредиты" />}
                        title="Кол-во договоров в этом месяце"
                        value="200"
                        percentageChange={5}
                    />
                    <ResultsContainer
                        icon={<img src={paymentsSvg} alt="Платежи" />}
                        title="Платежи в этом месяце"
                        value="540 000 ₽"
                        percentageChange={-3}
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