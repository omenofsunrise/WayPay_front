import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import SchedulePieChart from "../../components/Dashboards/SchedulePieChart";
import PaginationDots from "../../components/ui/Pagination/PaginationDots";
import useAnalytic from "../../api/hooks/useAnalytic";
import type { ScheduleAnalitycResponse } from "../../api/types/analytic";

const ScheduleCharts = () => {
  const { getScheduleAnalityc } = useAnalytic();
  const [scheduleAnalytics, setScheduleAnalytics] = useState<ScheduleAnalitycResponse[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentChartIndex, setCurrentChartIndex] = useState(0);
  const chartsContainerRef = useRef<HTMLDivElement>(null);

  const loadScheduleAnalytics = async (year: number) => {
    try {
      const result = await getScheduleAnalityc(year);
      if (result) {
        setScheduleAnalytics(result);
      }
    } catch (err) {
      console.error("Ошибка загрузки аналитики графика:", err);
    }
  };

  useEffect(() => {
    loadScheduleAnalytics(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    const container = chartsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const chartHeight = container.scrollHeight / (scheduleAnalytics.length - 1 || 1);
      const newIndex = Math.floor(scrollTop / chartHeight);

      if (
        newIndex !== currentChartIndex &&
        newIndex >= 0 &&
        newIndex < (scheduleAnalytics.length - 1 || 1)
      ) {
        setCurrentChartIndex(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [scheduleAnalytics.length, currentChartIndex]);

  const handleDotClick = (index: number) => {
    setCurrentChartIndex(index);
    const container = chartsContainerRef.current;
    if (container) {
      const chartHeight = container.scrollHeight / (scheduleAnalytics.length - 1 || 1);
      container.scrollTo({
        top: index * chartHeight,
        behavior: "smooth",
      });
    }
  };

  const mainChart = scheduleAnalytics[0];
  const additionalCharts = scheduleAnalytics.slice(1);

  const renderMainChart = () => {
    if (!mainChart) {
      return <EmptyChart>Нет данных для отображения</EmptyChart>;
    }

    return (
      <MainChartCard>
        <SchedulePieChart
          title={mainChart.title}
          data={mainChart}
          isMainChart={true}
          currentYear={selectedYear}
          onYearChange={(year) => {
            setSelectedYear(year);
            loadScheduleAnalytics(year);
          }}
        />
      </MainChartCard>
    );
  };

  const renderAdditionalCharts = () => {
    if (additionalCharts.length === 0) {
      return <EmptyChart>Нет дополнительных данных</EmptyChart>;
    }

    return (
      <ChartsScrollContainer ref={chartsContainerRef}>
        {additionalCharts.map((chartData, index) => (
          <ChartCard key={index}>
            <SchedulePieChart title={chartData.title} data={chartData} />
          </ChartCard>
        ))}
      </ChartsScrollContainer>
    );
  };

  return (
    <ScheduleContainer>
      <LeftContainer>{renderMainChart()}</LeftContainer>
      <RightContainer>
        {renderAdditionalCharts()}
        {additionalCharts.length > 0 && (
          <ChartsNavigation>
            <PaginationDots
              count={additionalCharts.length}
              activeIndex={currentChartIndex}
              onClick={handleDotClick}
              className="vertical"
            />
          </ChartsNavigation>
        )}
      </RightContainer>
    </ScheduleContainer>
  );
};

const ScheduleContainer = styled.div`
  display: flex;
  gap: 20px;
  height: 600px;
`;

const LeftContainer = styled.div`
  flex: 1;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RightContainer = styled.div`
  flex: 1;
  display: flex;
  gap: 20px;
`;

const ChartsNavigation = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChartsScrollContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  padding-right: 10px;

  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const MainChartCard = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChartCard = styled.div``;

const EmptyChart = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 16px;
  background: white;
  border-radius: 8px;
  padding: 20px;
`;

export default ScheduleCharts;