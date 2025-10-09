import styled, { keyframes } from 'styled-components';
import { useEffect, useState, useRef } from 'react';
import type { ScheduleAnalitycResponse } from '../../api/types/analytic';

interface PieChartProps {
  title: string;
  data: ScheduleAnalitycResponse;
  period?: string;
  showPercentages?: boolean;
}

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatCurrency = (num: number): string => {
  return `${formatNumber(num)} ₽`;
};

const PieChart = ({ title, data, period, showPercentages = true }: PieChartProps) => {
  const prevDataRef = useRef<ScheduleAnalitycResponse>(data);
  const [animatedData, setAnimatedData] = useState<ScheduleAnalitycResponse>(data);

  useEffect(() => {
    const duration = 1000;
    const startTime = performance.now();
    
    const animateData = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimatedData(prev => ({
        expectedIncome: Math.floor(
          prevDataRef.current.expectedIncome + 
          progress * (data.expectedIncome - prevDataRef.current.expectedIncome)
        ),
        realIncome: Math.floor(
          prevDataRef.current.realIncome + 
          progress * (data.realIncome - prevDataRef.current.realIncome)
        ),
        debt: Math.floor(
          prevDataRef.current.debt + 
          progress * (data.debt - prevDataRef.current.debt)
        ),
        incomePercent: prev.incomePercent,
        debtPercent: prev.debtPercent
      }));
      
      if (progress < 1) {
        requestAnimationFrame(animateData);
      } else {
        // В конце анимации устанавливаем точные проценты
        setAnimatedData(data);
      }
    };
    
    requestAnimationFrame(animateData);
    prevDataRef.current = data;
  }, [data]);

  // Подготавливаем данные для круговой диаграммы
  const chartData = [
    {
      name: 'Реальные поступления',
      value: animatedData.realIncome,
      color: '#10B981', // зеленый
      description: 'Фактически поступившие средства'
    },
    {
      name: 'Просрочка',
      value: animatedData.debt,
      color: '#EF4444', // красный
      description: 'Задолженность'
    },
    {
      name: 'Ожидаемые поступления',
      value: Math.max(0, animatedData.expectedIncome - animatedData.realIncome),
      color: '#6B7280', // серый
      description: 'Ожидаемые, но еще не поступившие средства'
    }
  ].filter(item => item.value > 0);

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const calculatePercentage = (value: number) => totalValue > 0 ? (value / totalValue) * 100 : 0;

  // Строим пути для SVG
  let cumulativePercentage = 0;
  const paths = chartData.map((item) => {
    const percentage = calculatePercentage(item.value);
    const startX = 50 + 50 * Math.cos(2 * Math.PI * cumulativePercentage / 100);
    const startY = 50 + 50 * Math.sin(2 * Math.PI * cumulativePercentage / 100);
    cumulativePercentage += percentage;
    const endX = 50 + 50 * Math.cos(2 * Math.PI * cumulativePercentage / 100);
    const endY = 50 + 50 * Math.sin(2 * Math.PI * cumulativePercentage / 100);

    const largeArcFlag = percentage > 50 ? 1 : 0;

    return {
      path: `M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY} Z`,
      color: item.color,
      name: item.name,
      value: item.value,
      percentage: percentage,
      description: item.description
    };
  });

  const hasData = chartData.length > 0;
  const completionRate = data.expectedIncome > 0 ? (data.realIncome / data.expectedIncome) * 100 : 0;
  const debtToIncomeRatio = data.realIncome > 0 ? (data.debt / data.realIncome) * 100 : 0;

  return (
    <ChartContainer>
      <ChartHeader>
        <ChartTitle>{title}</ChartTitle>
        {period && <ChartPeriod>{period}</ChartPeriod>}
      </ChartHeader>
      
      <ChartContent>
        <PieChartWrapper>
          <svg width="200" height="200" viewBox="0 0 100 100">
            {hasData ? (
              <>
                {paths.map((segment, index) => (
                  <AnimatedPath
                    key={index}
                    d={segment.path}
                    fill={segment.color}
                    stroke="white"
                    strokeWidth="1"
                  />
                ))}
                <circle cx="50" cy="50" r="30" fill="white" />
                <text x="50" y="45" textAnchor="middle" dominantBaseline="middle" fontSize="8">
                  Выполнение
                </text>
                <text x="50" y="55" textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="bold">
                  {completionRate.toFixed(1)}%
                </text>
              </>
            ) : (
              <>
                <circle cx="50" cy="50" r="50" fill="#f0f0f0" />
                <circle cx="50" cy="50" r="30" fill="white" />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#666">
                  Нет данных
                </text>
              </>
            )}
          </svg>
        </PieChartWrapper>

        <StatsContainer>
          <StatItem>
            <StatLabel>Ожидаемый доход:</StatLabel>
            <StatValue>{formatCurrency(animatedData.expectedIncome)}</StatValue>
          </StatItem>
          
          <StatItem>
            <StatLabel>Реальный доход:</StatLabel>
            <StatValue color="#10B981">{formatCurrency(animatedData.realIncome)}</StatValue>
            {showPercentages && (
              <StatPercent>({completionRate.toFixed(1)}% от ожидаемого)</StatPercent>
            )}
          </StatItem>
          
          <StatItem>
            <StatLabel>Просрочка:</StatLabel>
            <StatValue color="#EF4444">{formatCurrency(animatedData.debt)}</StatValue>
            {showPercentages && (
              <StatPercent>({debtToIncomeRatio.toFixed(1)}% от реальных поступлений)</StatPercent>
            )}
          </StatItem>
        </StatsContainer>

        <Legend>
          {hasData ? (
            paths.map((segment, index) => (
              <LegendItem key={index}>
                <LegendColor style={{ backgroundColor: segment.color }} />
                <LegendText>
                  <div>
                    <LegendName>{segment.name}</LegendName>
                    <LegendDescription>{segment.description}</LegendDescription>
                  </div>
                  <LegendValues>
                    <AnimatedValue>{formatCurrency(segment.value)}</AnimatedValue>
                    {showPercentages && (
                      <LegendPercentage>({segment.percentage.toFixed(1)}%)</LegendPercentage>
                    )}
                  </LegendValues>
                </LegendText>
              </LegendItem>
            ))
          ) : (
            <NoDataMessage>Данные по поступлениям отсутствуют</NoDataMessage>
          )}
        </Legend>
      </ChartContent>
    </ChartContainer>
  );
};

// Анимации
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
`;

const scaleIn = keyframes`
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

// Стилизованные компоненты
const AnimatedPath = styled.path`
  animation: ${scaleIn} 0.5s ease-out forwards;
`;

const AnimatedValue = styled.div`
  display: inline-block;
  animation: ${fadeIn} 0.5s ease-out forwards;
  font-weight: bold;
`;

const ChartContainer = styled.div`
  background: white;
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  font-family: sans-serif;
  color: black;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ChartTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
`;

const ChartPeriod = styled.div`
  font-size: 12px;
  color: #6B7280;
  background: #F3F4F6;
  padding: 4px 8px;
  border-radius: 6px;
`;

const ChartContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const PieChartWrapper = styled.div`
  display: flex;
  justify-content: center;
  transition: all 0.3s ease;
`;

const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #F9FAFB;
  border-radius: 8px;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #6B7280;
  flex: 1;
`;

const StatValue = styled.div<{ color?: string }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.color || '#1F2937'};
  text-align: right;
`;

const StatPercent = styled.div`
  font-size: 12px;
  color: #6B7280;
  width: 100%;
  text-align: right;
`;

const Legend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: all 0.3s ease;
`;

const LegendColor = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.3s ease;
`;

const LegendText = styled.div`
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex: 1;
  gap: 12px;
`;

const LegendName = styled.div`
  color: #1F2937;
  font-weight: 500;
  margin-bottom: 2px;
`;

const LegendDescription = styled.div`
  font-size: 12px;
  color: #6B7280;
`;

const LegendValues = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
`;

const LegendPercentage = styled.div`
  font-size: 12px;
  color: #6B7280;
  margin-top: 2px;
`;

const NoDataMessage = styled.div`
  font-size: 14px;
  color: #999;
  text-align: center;
  width: 100%;
  padding: 20px 0;
  animation: ${fadeIn} 0.5s ease-out;
`;

export default PieChart;