import styled, { keyframes } from 'styled-components';
import { useEffect, useState, useRef } from 'react';
import type { ScheduleAnalitycResponse } from '../../api/types/analytic';
import { formatMoney } from '../../utils/formatPrice';
import { Divider } from '@mui/material';

interface PieChartProps {
  title: string;
  data: ScheduleAnalitycResponse;
  isMainChart?: boolean;
  onYearChange?: (year: number) => void;
  currentYear?: number;
}

const SchedulePieChart = ({ 
  title, 
  data, 
  isMainChart = false, 
  onYearChange,
  currentYear = new Date().getFullYear()
}: PieChartProps) => {
  const prevDataRef = useRef<ScheduleAnalitycResponse>(data);
  const [animatedData, setAnimatedData] = useState<ScheduleAnalitycResponse>(data);
  const [displayYear, setDisplayYear] = useState(currentYear);

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
        debtPercent: prev.debtPercent,
        title: prev.title
      }));
      
      if (progress < 1) {
        requestAnimationFrame(animateData);
      } else {
        setAnimatedData(data);
      }
    };
    
    requestAnimationFrame(animateData);
    prevDataRef.current = data;
  }, [data]);

  const handleYearChange = (direction: 'prev' | 'next') => {
    const newYear = direction === 'prev' ? displayYear - 1 : displayYear + 1;
    setDisplayYear(newYear);
    if (onYearChange) {
      onYearChange(newYear);
    }
  };

  const chartData = [
    {
      name: 'Поступления',
      value: animatedData.realIncome,
      percent: animatedData.incomePercent,
      color: 'rgba(37, 203, 161, 1)',
      description: 'Фактически поступившие средства'
    },
    {
      name: 'Просрочка',
      value: animatedData.debt,
      percent: animatedData.debtPercent,
      color: 'rgba(255, 90, 90, 1)',
      description: 'Задолженность'
    }
  ];

  const createPaths = () => {
    const paths = [];
    let cumulativePercentage = 0;

    const validData = chartData.filter(item => item.percent > 0);

    if (validData.length === 0) {
      return [];
    }

    if (validData.length === 1 && validData[0].percent === 100) {
      const item = validData[0];
      
      const fullCirclePath = `M 50 50 L 100 50 A 50 50 0 1 1 50 0 A 50 50 0 1 1 100 50 Z`;
      
      paths.push({
        path: fullCirclePath,
        color: item.color,
        name: item.name,
        value: item.value,
        percentage: item.percent,
        description: item.description
      });
      
      return paths;
    }

    const startAngle = -120;
    const gapSize = 1;
    const cornerRadius = 2;
    
    const totalPercentage = validData.reduce((sum, item) => sum + item.percent, 0);
    const adjustedData = validData.map(item => ({
      ...item,
      adjustedPercent: item.percent - (item.percent / totalPercentage) * gapSize * validData.length
    }));

    for (let i = 0; i < adjustedData.length; i++) {
      const item = adjustedData[i];
      
      const startAngleDeg = startAngle + cumulativePercentage * 3.6;
      const endAngleDeg = startAngleDeg + item.adjustedPercent * 3.6;
      
      const startAngleRad = (startAngleDeg * Math.PI) / 180;
      const endAngleRad = (endAngleDeg * Math.PI) / 180;
      
      const innerRadius = 37;
      const outerRadius = 50;
      
      const startXInner = 50 + innerRadius * Math.cos(startAngleRad);
      const startYInner = 50 + innerRadius * Math.sin(startAngleRad);
      const startXOuter = 50 + outerRadius * Math.cos(startAngleRad);
      const startYOuter = 50 + outerRadius * Math.sin(startAngleRad);
      
      const endXInner = 50 + innerRadius * Math.cos(endAngleRad);
      const endYInner = 50 + innerRadius * Math.sin(endAngleRad);
      const endXOuter = 50 + outerRadius * Math.cos(endAngleRad);
      const endYOuter = 50 + outerRadius * Math.sin(endAngleRad);
      
      const largeArcFlag = item.adjustedPercent > 50 ? 1 : 0;

      const path = `
        M ${startXInner} ${startYInner}
        L ${startXOuter} ${startYOuter}
        A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endXOuter} ${endYOuter}
        L ${endXInner} ${endYInner}
        A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startXInner} ${startYInner}
        Z
      `;

      const middleAngleDeg = (startAngleDeg + endAngleDeg) / 2;
      const middleAngleRad = (middleAngleDeg * Math.PI) / 180;
      
      const textRadius = outerRadius + 12;
      const textX = 50 + textRadius * Math.cos(middleAngleRad);
      const textY = 50 + textRadius * Math.sin(middleAngleRad);

      paths.push({
        path: path,
        color: item.color,
        name: item.name,
        value: item.value,
        percentage: item.percent,
        description: item.description,
        startAngle: startAngleDeg,
        endAngle: endAngleDeg,
        textX: textX,
        textY: textY,
        textAngle: middleAngleDeg
      });
      
      cumulativePercentage += item.adjustedPercent;
      
      if (i < adjustedData.length - 1) {
        cumulativePercentage += gapSize;
      }
    }

    return paths;
  };

  const paths = createPaths();
  const hasData = data.expectedIncome > 0 || data.realIncome > 0 || data.debt > 0;
  const hasChartData = paths.length > 0;

  const getSingleSegmentColor = () => {
    if (animatedData.realIncome > 0 && animatedData.debt === 0) {
      return 'rgba(37, 203, 161, 1)';
    } else if (animatedData.debt > 0 && animatedData.realIncome === 0) {
      return 'rgba(255, 90, 90, 1)'; 
    }
    return 'rgba(37, 203, 161, 1)';
  };

  const singleSegmentColor = getSingleSegmentColor();

  return (
    <ChartContainer $isMainChart={isMainChart}>
      <ChartHeader>
        <ChartTitle>{title}</ChartTitle>
        {isMainChart && (
          <YearNavigation>
            <YearArrow 
              onClick={() => handleYearChange('prev')}
              aria-label="Предыдущий год"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 1L1 7L7 13" stroke="#50555C" stroke-width="1.50532" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </YearArrow>
            <YearArrow 
              onClick={() => handleYearChange('next')}
              aria-label="Следующий год"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 13L7 7L1 1" stroke="#50555C" stroke-width="1.50532" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </YearArrow>
          </YearNavigation>
        )}
      </ChartHeader>
      
      <ChartContent $isMainChart={isMainChart}>
        <PieChartWrapper $isMainChart={isMainChart}>
          <svg 
            width={isMainChart ? "720" : "280"} 
            height={isMainChart ? "300" : "200"} 
            viewBox="0 0 100 100"
          >
            {hasData && hasChartData ? (
              <>
                {paths.length > 1 ? (
                  <>
                    {paths.map((segment, index) => (
                      <g key={index}>
                        <AnimatedPath
                          d={segment.path}
                          fill={segment.color}
                          stroke="white"
                          strokeWidth="1"
                        />
                        {/* {segment.percentage > 5 && (
                          <text
                            x={segment.textX}
                            y={segment.textY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="11"
                            fontWeight="300"
                            fill={segment.color}
                            style={{
                              filter: 'drop-shadow(0 0 1px white) drop-shadow(0 0 1px white)',
                            }}
                          >
                            {Math.round(segment.percentage)}%
                          </text>
                        )} */}
                      </g>
                    ))}
                  </>
                ) : (
                  <>
                    <circle cx="50" cy="50" r="50" fill={singleSegmentColor} />
                    <circle cx="50" cy="50" r="37" fill="white" />
                    <text 
                      x="50" 
                      y="50" 
                      textAnchor="middle" 
                      dominantBaseline="middle" 
                      fontSize="8"
                      fill="#6B7280"
                    >
                      {animatedData.realIncome > 0 ? '' : ''}
                    </text>
                  </>
                )}
              </>
            ) : (
              <>
                <circle cx="50" cy="50" r="50" fill="#f0f0f0" />
                <circle cx="50" cy="50" r="37" fill="white" />
                <text 
                  x="50" 
                  y="50" 
                  textAnchor="middle" 
                  dominantBaseline="middle" 
                  fontSize="8"
                  fill="#6B7280"
                >
                  Нет данных
                </text>
              </>
            )}
          </svg>
        </PieChartWrapper>

        <StatsContainer $isMainChart={isMainChart}>
          <StatItem>
            <StatLabel>Ожидаемые платежи:</StatLabel>
            <StatValue>{formatMoney(animatedData.expectedIncome.toString())}</StatValue>
          </StatItem>
          
          <StatItem>
            <StatLabel>Оплатили:</StatLabel>
            <StatValue color="rgba(0, 125, 136, 1)">
              {formatMoney(animatedData.realIncome.toString())}
            </StatValue>
          </StatItem>
          
          <Divider />
          
          {animatedData.debt > 0 && (
            <StatItem>
              <StatLabel>Остаток:</StatLabel>
              <StatValue color="rgba(255, 90, 90, 1)">
                {formatMoney(animatedData.debt.toString())}
              </StatValue>
            </StatItem>
          )}
        </StatsContainer>
      </ChartContent>
    </ChartContainer>
  );
};

const YearNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
`;

const YearArrow = styled.button`
  background: transparent;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: none;
  
  &:hover {
    background: #e9ecef;
  }

  &:active {
    background: #dee2e6;
  }
`;

const YearDisplay = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  min-width: 40px;
  text-align: center;
`;

const scaleIn = keyframes`
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const AnimatedPath = styled.path`
  animation: ${scaleIn} 0.5s ease-out forwards;
  stroke-linecap: round;
  stroke-linejoin: round;
  border-radius: 10px;
`;

const ChartContainer = styled.div<{ $isMainChart?: boolean }>`
  background: white;
  border-radius: 12px;
  padding: 20px;
  width: auto;
  font-family: sans-serif;
  color: black;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  ${props => props.$isMainChart && `
    height: 100%;
    display: flex;
    width: 100%;
    flex-direction: column;
  `}

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

const ChartContent = styled.div<{ $isMainChart?: boolean }>`
  display: flex;
  ${props => props.$isMainChart 
    ? `
      flex-direction: column;
      align-items: center;
      gap: 24px;
      height: 100%;
    ` 
    : `
      align-items: center;
      gap: 24px;
    `
  }
`;

const PieChartWrapper = styled.div<{ $isMainChart?: boolean }>`
  flex-shrink: 0;
  transition: all 0.3s ease;
  position: relative;
  ${props => props.$isMainChart && `
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;
    padding: 0;
    flex: 1;
  `}
`;

const StatsContainer = styled.div<{ $isMainChart?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  width: 100%;
  ${props => props.$isMainChart && `
    width: 100%;
  `}
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
  text-align: left;
  flex: 1;
`;

const StatValue = styled.div<{ color?: string }>`
  font-size: 17px;
  font-weight: 600;
  color: ${props => props.color || '#1F2937'};
  text-align: right;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export default SchedulePieChart;