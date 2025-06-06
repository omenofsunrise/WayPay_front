import styled from 'styled-components';
import PageLayout from '../components/ui/Layouts/PageLayout';
import CustomTitle from '../components/ui/Text/CustomTitle';
import ModalInfoTitle from '../components/ui/Text/ModalInfoTitle';
import UserContainer from '../components/Profile/UserContainer';
import ColumnChart from '../components/Dashboards/ColumnChart';

const EmployeeProfile = () => {
    const chartData = [
        {
            label: 'Июн',
            total: 105000,
            bars: [
                { name: 'Неподтверждённые, руб', value: 50000, color: 'rgba(209, 213, 219, 1)' },
            { name: 'Подтверждённые, руб', value: 55000, color: 'rgba(0, 125, 136, 1)' },
            ]
        },
        {
            label: 'Июл',
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
      <ModalInfoTitle>Личные данные и статистика</ModalInfoTitle>
      
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
    </PageLayout>
  );
};

const ProfileContent = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;

  @media (max-width: 1200px) {
    flex-direction: column;
  }
`;

const ChartWrapper = styled.div`
  flex: 4;
`;

export default EmployeeProfile;