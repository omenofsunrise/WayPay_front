import React, { useState } from 'react';
import styled from 'styled-components';
import CustomTitle from '../ui/Text/CustomTitle';
import TitleField from '../ui/Layouts/TitleLayout';

interface BarData {
  name: string;
  value: number;
  color: string;
}

interface ChartData {
  label: string;
  total: number;
  bars: BarData[];
}

interface ColumnChartProps {
  title: string;
  data: ChartData[];
  maxValue: number;
  step: number;
  height?: number | string;
}

const ColumnChart: React.FC<ColumnChartProps> = ({ title, data, maxValue, step, height = 300 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const yAxisValues = [];
  for (let i = 0; i <= maxValue; i += step) {
    yAxisValues.push(i);
  }

  const legendItems = data.length > 0 
    ? data[0].bars.map(bar => ({ name: bar.name, color: bar.color }))
    : [];

  return (
    <ChartContainer>
        <TitleField style={{ marginTop: "0" }}>
            <CustomTitle>{title}</CustomTitle>
            <Legend>
                {legendItems.map((item, index) => (
                <LegendItem key={index}>
                    <LegendColor color={item.color} />
                    <LegendText>{item.name}</LegendText>
                </LegendItem>
                ))}
            </Legend>
        </TitleField>

        <ChartContent height={height}>
            <YAxis>
                {yAxisValues.map((value, index) => (
                <YAxisLabel key={index}>
                    {value.toLocaleString()}
                </YAxisLabel>
                ))}
            </YAxis>

            <BarsContainer>
                {/* Add horizontal dashed lines for each Y-axis value */}
                {yAxisValues.map((value, index) => (
                  <HorizontalLine 
                    key={`line-${index}`}
                    position={(value / maxValue) * 100}
                  />
                ))}
                
                {data.map((item, index) => (
                <BarGroup 
                    key={index}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    {item.bars.map((bar, barIndex) => {
                    const nextValuesSum = item.bars
                        .slice(barIndex + 1)
                        .reduce((sum, b) => sum + b.value, 0);
                    
                    return (
                        <StackedBar 
                        key={barIndex}
                        height={(bar.value / maxValue) * 100}
                        offset={(nextValuesSum / maxValue) * 100}
                        color={bar.color}
                        isHovered={hoveredIndex !== null && hoveredIndex !== index}
                        />
                    );
                    })}
                    
                    {hoveredIndex === index && (
                    <Tooltip>
                        <TooltipContent>
                        <TooltipTitle>Всего: {item.total.toLocaleString()} ₽</TooltipTitle>
                        {item.bars.map((bar, barIndex) => (
                            <TooltipItem key={barIndex}>
                            {bar.name}: {bar.value.toLocaleString()} ₽
                            </TooltipItem>
                        ))}
                        </TooltipContent>
                        <TooltipArrow />
                    </Tooltip>
                    )}
                </BarGroup>
                ))}
            </BarsContainer>
        </ChartContent>

        <XAxis>
        {data.map((item, index) => (
            <XAxisLabel key={index}>{item.label}</XAxisLabel>
        ))}
        </XAxis>
    </ChartContainer>
  );
};

const ChartContainer = styled.div`
  background-color: white;
  border-radius: 10px;
  border: 1px solid rgba(209, 213, 219, 1);
  padding: 20px;
  position: relative;
  font-family: 'Inter', sans-serif;
  height: auto;
`;

const ChartTitle = styled.h3`
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
`;

const Legend = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LegendColor = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  background-color: ${props => props.color};
  border-radius: 4px;
`;

const LegendText = styled.span`
  font-size: 14px;
  color: #4B5563;
`;

const ChartContent = styled.div<{ height?: number | string }>`
  display: flex;
  height: ${props => typeof props.height === 'number' ? `${props.height}px` : props.height || '300px'};
  position: relative;
`;

const YAxis = styled.div`
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-between;
  height: 100%;
  margin-right: 10px;
`;

const YAxisLabel = styled.span`
  font-size: 12px;
  color: #6B7280;
`;

const BarsContainer = styled.div`
    display: flex;
    flex-grow: 1;
    align-items: flex-end;
    gap: 20px;
    padding: 20px 20px 0 20px;
    border-width: 0 0 1px 1px;
    border-style: solid;
    border-color: rgba(209, 213, 219, 1);
    position: relative;
`;

const HorizontalLine = styled.div<{ position: number }>`
  position: absolute;
  top: ${props => 100 - props.position}%;
  left: 0;
  right: 0;
  height: 1px;
  background: repeating-linear-gradient(
    to right,
    rgba(209, 213, 219, 1),
    rgba(209, 213, 219, 1) 2px,
    transparent 2px,
    transparent 4px
  );
  z-index: 0;
`;

const BarGroup = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 2px;
  flex: 1;
  min-width: 0;
  position: relative;
  height: 100%;
  margin-bottom: 2px;
  z-index: 1;
`;

const StackedBar = styled.div<{ height: number; offset: number; color: string; isHovered: boolean }>`
  position: absolute;
  width: 100%;
  height: calc(${props => props.height}% - ${props => props.offset > 0 ? '-10px' : '0px'});
  bottom: calc(${props => props.offset}% + ${props => props.offset > 0 ? '-10px' : '0px'});
  background-color: ${props => props.isHovered ? `color-mix(in srgb, ${props.color} 40%, #E5E7EB)` : props.color};
  border-radius: ${props => props.offset === 0 ? '5px' : '5px'};
  transition: background-color 0.2s ease;
`;

const XAxis = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
`;

const XAxisLabel = styled.span`
  font-size: 12px;
  color: #6B7280;
  text-align: center;
  flex-grow: 1;
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  margin-bottom: 10px;
`;

const TooltipContent = styled.div`
  background-color: #000;
  color: white;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  white-space: nowrap;
`;

const TooltipTitle = styled.div`
  font-weight: 600;
  margin-bottom: 6px;
`;

const TooltipItem = styled.div`
  margin-bottom: 2px;
`;

const TooltipArrow = styled.div`
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #000;
`;

export default ColumnChart;