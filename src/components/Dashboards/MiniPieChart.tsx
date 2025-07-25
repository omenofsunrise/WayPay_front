import styled, { keyframes } from 'styled-components';
import { useEffect, useState, useRef } from 'react';

interface DataItem {
  name: string;
  value: number;
  color: string;
}

interface MiniPieChartProps {
  title: string;
  total?: number;
  data: DataItem[];
}

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const MiniPieChart = ({ title, total, data }: MiniPieChartProps) => {
  const prevDataRef = useRef<DataItem[]>(data);
  const prevTotalRef = useRef<number>(total || 0);
  
  const [animatedData, setAnimatedData] = useState<DataItem[]>(data);
  const [animatedTotal, setAnimatedTotal] = useState(total || 0);

  useEffect(() => {
    const currentTotal = total || 0;
    if (currentTotal !== prevTotalRef.current) {
      const duration = 1000;
      const startTime = performance.now();
      const startValue = prevTotalRef.current;
      const endValue = currentTotal;
      const delta = endValue - startValue;
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setAnimatedTotal(Math.floor(startValue + progress * delta));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
      prevTotalRef.current = currentTotal;
    }

    const duration = 1000;
    const startTime = performance.now();
    
    const animateData = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimatedData(prev => 
        prev.map((item, index) => {
          const prevItem = prevDataRef.current[index] || { value: 0 };
          const currentItem = data[index] || { value: 0 };
          const delta = currentItem.value - prevItem.value;
          
          return {
            ...item,
            value: Math.floor(prevItem.value + progress * delta)
          };
        })
      );
      
      if (progress < 1) {
        requestAnimationFrame(animateData);
      }
    };
    
    requestAnimationFrame(animateData);
    prevDataRef.current = data;
  }, [data, total]);

  const totalValue = animatedData.reduce((sum, item) => sum + item.value, 0);
  const calculatePercentage = (value: number) => totalValue > 0 ? (value / totalValue) * 100 : 0;

  let cumulativePercentage = 0;
  const paths = animatedData.map((item) => {
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
    };
  });

  const hasData = data.length > 0 && data.some(item => item.value > 0);
  const displayTotal = total === undefined || total === null ? '100%' : formatNumber(animatedTotal);

  return (
    <ChartContainer>
      <ChartTitle>{title}</ChartTitle>
      <ChartContent>
        <PieChartWrapper>
          <svg width="150" height="150" viewBox="0 0 100 100">
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
                <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="10">
                  Всего
                </text>
                <text x="50" y="65" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold">
                  {displayTotal}
                </text>
              </>
            ) : (
              <>
                <circle cx="50" cy="50" r="50" fill="#f0f0f0" />
                <circle cx="50" cy="50" r="30" fill="white" />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#666">
                  Нет данных
                </text>
              </>
            )}
          </svg>
        </PieChartWrapper>
        <Legend>
          {hasData ? (
            paths.map((segment, index) => (
              <LegendItem key={index}>
                <LegendColor style={{ backgroundColor: segment.color }} />
                <LegendText>
                  <LegendName>{segment.name}</LegendName>
                  <AnimatedValue>
                    {formatNumber(segment.value)}
                  </AnimatedValue>
                </LegendText>
              </LegendItem>
            ))
          ) : (
            <NoDataMessage>Данные отсутствуют</NoDataMessage>
          )}
        </Legend>
      </ChartContent>
    </ChartContainer>
  );
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
`;

const scaleIn = keyframes`
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

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
  border-radius: 10px;
  padding: 16px;
  width: 100%;
  font-family: sans-serif;
  color: black;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ChartTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
`;

const ChartContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const PieChartWrapper = styled.div`
  width: 150px;
  height: 150px;
  transition: all 0.3s ease;
`;

const Legend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 250px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
`;

const LegendColor = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.3s ease;
`;

const LegendText = styled.div`
  font-size: 14px;
  display: flex;
  gap: 12px;
  width: 100%;
  justify-content: space-between;
  align-items: center;
`;

const LegendName = styled.div`
  color: #666;
  flex-grow: 1;
  text-align: left;
`;

const NoDataMessage = styled.div`
  font-size: 14px;
  color: #999;
  text-align: center;
  width: 100%;
  padding: 10px 0;
  animation: ${fadeIn} 0.5s ease-out;
`;

export default MiniPieChart;