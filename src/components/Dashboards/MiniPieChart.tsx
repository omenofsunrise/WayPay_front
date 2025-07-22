import styled from 'styled-components';

interface DataItem {
  name: string;
  value: number;
  color: string;
}

interface MiniPieChartProps {
  title: string;
  total: number;
  data: DataItem[];
}

const MiniPieChart = ({ title, total, data }: MiniPieChartProps) => {
  // Рассчитываем проценты для каждого сегмента
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const calculatePercentage = (value: number) => (value / totalValue) * 100;

  // Генерируем SVG path для каждого сегмента
  let cumulativePercentage = 0;
  const paths = data.map((item) => {
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

  return (
    <ChartContainer>
      <ChartTitle>{title}</ChartTitle>
      <ChartContent>
        <PieChartWrapper>
          <svg width="100" height="100" viewBox="0 0 100 100">
            {paths.map((segment, index) => (
              <path
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
              {total}
            </text>
          </svg>
        </PieChartWrapper>
        <Legend>
          {paths.map((segment, index) => (
            <LegendItem key={index}>
              <LegendColor style={{ backgroundColor: segment.color }} />
              <LegendText>
                <div>{segment.name}</div>
                <div>{segment.value}</div>
              </LegendText>
            </LegendItem>
          ))}
        </Legend>
      </ChartContent>
    </ChartContainer>
  );
};

// Стилизованные компоненты
const ChartContainer = styled.div`
  background: white;
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 10px;
  padding: 16px;
  width: 100%;
  font-family: sans-serif;
  color: black;
`;

const ChartTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
`;

const ChartContent = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const PieChartWrapper = styled.div`
  width: 100px;
  height: 100px;
`;

const Legend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
`;

const LegendText = styled.div`
  font-size: 12px;
  display: flex;
  gap: 8px;

  & div:last-child {
    font-weight: bold;
  }
`;

export default MiniPieChart;