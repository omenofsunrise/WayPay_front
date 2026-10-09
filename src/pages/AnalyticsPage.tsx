import AnalyticItem from "../components/Analytics/AnalyticItem";
import PeriodField from "../components/ui/fields/PeriodField";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import styled from "styled-components";
import TitleField from "../components/ui/Layouts/TitleLayout";
import ScatterPlot from "../components/Dashboards/ScatterPlot";
import ColumnChart from "../components/Dashboards/ColumnChart";
import { useEffect, useMemo, useState } from "react";
import useAnalytic from "../api/hooks/useAnalytic";
import { useEmployee } from "../api/hooks/useEmployee";
import useCredit from "../api/hooks/useCredit";
import type { AnalyticParams, PredefinedPeriod } from "../api/types/analytic";

const SHORT_MONTHS = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Май",
  "Июн",
  "Июл",
  "Авг",
  "Сен",
  "Окт",
  "Ноя",
  "Дек",
];

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

const AnalyticsPage = () => {
  const [period, setPeriod] = useState<PredefinedPeriod>("ThisMonth");
  const {
    analyticData,
    isLoading,
    error,
    getAnalyticItems,
    sellInfoData,
    getSellInfo,
    getInvestmentDynamic,
    investmentDynamicData,
    getDebtDynamic,
    debtDynamicData,
  } = useAnalytic();

  const { paymentsStats, fetchPaymentsStats } = useEmployee();
  const { getCredits } = useCredit();
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    getAnalyticItems({ predefinedPeriod: period });
    getSellInfo({ predefinedPeriod: period });
    getInvestmentDynamic({ predefinedPeriod: period });
    getDebtDynamic({ predefinedPeriod: period });
  }, [
    period,
    getAnalyticItems,
    getSellInfo,
    getInvestmentDynamic,
    getDebtDynamic,
  ]);

  useEffect(() => {
    getCredits({ page: 1, pageSize: 1 });
  }, [getCredits]);

  useEffect(() => {
    fetchPaymentsStats(12);
  }, [fetchPaymentsStats]);

  const monthlyPaymentsData: ChartData[] = useMemo(() => {
    const byMonth = new Map(
      paymentsStats
        .filter((stat) => stat.year === currentYear)
        .map((stat) => [stat.month, stat])
    );

    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const stat = byMonth.get(month);
      return {
        label: SHORT_MONTHS[i],
        total: stat?.total ?? 0,
        bars: [
          {
            name: "Неподтверждённые, руб",
            value: stat?.notAssumed ?? 0,
            color: "rgba(209, 213, 219, 1)",
          },
          {
            name: "Подтверждённые, руб",
            value: stat?.assumed ?? 0,
            color: "rgba(0, 125, 136, 1)",
          },
        ],
      };
    });
  }, [paymentsStats, currentYear]);

  const monthlyPaymentsMax = useMemo(
    () => Math.max(...monthlyPaymentsData.map((d) => d.total), 100000),
    [monthlyPaymentsData]
  );

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return "0";
    return new Intl.NumberFormat("ru-RU").format(num);
  };

  const scatterPlotData = sellInfoData
    ? [
        ...sellInfoData.sellsSum.periods.map((period, index) => ({
          x: index,
          y: period.value,
          color: "rgba(0, 125, 136, 1)",
          label: "Продажи",
          name: period.periodName,
        })),
        ...sellInfoData.purchasesSum.periods.map((period, index) => ({
          x: index,
          y: period.value,
          color: "rgba(173, 179, 188, 1)",
          label: "Покупки",
          name: period.periodName,
        })),
        ...sellInfoData.cash.periods.map((period, index) => ({
          x: index,
          y: period.value,
          color: "rgba(37, 203, 161, 1)",
          label: "Остаток в кассе",
          name: period.periodName,
        })),
      ]
    : [];

  const maxY = Math.max(
    ...(scatterPlotData?.map((point) => point.y) || []),
    2500000
  );

  const minY = Math.min(...(scatterPlotData?.map((point) => point.y) || []), 0);

  const maxX = Math.max(...(scatterPlotData?.map((point) => point.x) || []), 6);

  const investmentData: ChartData[] =
    investmentDynamicData?.periods?.map((period) => ({
      label: period.periodName,
      total: period.value,
      bars: [
        {
          name: "Инвестиция",
          value: period.value,
          color: "rgba(37, 203, 161, 1)",
        },
      ],
    })) || [];

  const investmentMaxValue = Math.max(
    ...(investmentDynamicData?.periods?.map((p) => p.value) || []),
    1000000
  );

  const financialObligationsData: ChartData[] =
    debtDynamicData?.debtDynamic?.periods?.map((period, index) => {
      const paymentPeriod = debtDynamicData.paymentsDynamic?.periods?.[index];
      const paymentValue = paymentPeriod?.value || 0;
      const debtValue = period.value;

      return {
        label: period.periodName,
        total: paymentValue + debtValue,
        bars: [
          {
            name: "Сумма просрочки",
            value: debtValue,
            color: "rgba(0, 125, 136, 1)",
          },
          {
            name: "Сумма ежемесячных платежей",
            value: paymentValue,
            color: "rgba(173, 179, 188, 1)",
          },
        ],
      };
    }) || [];

  const handlePeriodChange = (
    period: string,
    startDate?: string,
    endDate?: string
  ) => {
    let params: AnalyticParams = {
      predefinedPeriod: period as PredefinedPeriod,
    };

    if (period === "Custom" && startDate && endDate) {
      params = {
        ...params,
        start: new Date(startDate),
        end: new Date(endDate),
      };
      setPeriod("Custom");
    } else {
      setPeriod(period as PredefinedPeriod);
    }

    getAnalyticItems(params);
    getSellInfo(params);
    getInvestmentDynamic(params);
    getDebtDynamic(params);
  };

  const debtMaxValue = Math.max(
    ...(financialObligationsData.map((item) => item.total) || []),
    800000
  );

  return (
    <PageLayout>
      <TitleField>
        <CustomTitle>Аналитика</CustomTitle>
      </TitleField>
      <FilterField style={{ margin: "0 0 10px" }}>
        <PeriodField value={period} onChange={handlePeriodChange} />
      </FilterField>
      <AnalyticsWrapper>
        <AnalyticsContainer>
          <AnalyticItem
            icon={
              <svg
                width="26"
                height="20"
                viewBox="0 0 22 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21.2988 13.4844H3.58008V1.01562C3.58008 0.653047 3.28641 0.359375 2.92383 0.359375H1.61133C1.24875 0.359375 0.955078 0.653047 0.955078 1.01562V14.7969C0.955078 15.5216 1.54283 16.1094 2.26758 16.1094H21.2988C21.6614 16.1094 21.9551 15.8157 21.9551 15.4531V14.1406C21.9551 13.778 21.6614 13.4844 21.2988 13.4844ZM19.9863 1.67188H15.144C14.2671 1.67188 13.8278 2.73213 14.448 3.35229L15.7769 4.68119L12.7676 7.69092L9.75826 4.6816C9.24557 4.16891 8.41459 4.16891 7.9023 4.6816L5.08494 7.49897C4.82859 7.75531 4.82859 8.1708 5.08494 8.42715L6.01271 9.35492C6.26906 9.61127 6.68455 9.61127 6.9409 9.35492L8.83008 7.46533L11.8394 10.4746C12.3521 10.9873 13.1831 10.9873 13.6954 10.4746L17.6329 6.53715L18.9618 7.86606C19.5819 8.48621 20.6422 8.04693 20.6422 7.17002V2.32812C20.6426 1.96555 20.3489 1.67188 19.9863 1.67188Z"
                  fill="#A63535"
                />
              </svg>
            }
            iconColor="rgba(255, 189, 189, 1)"
            label="Сумма инвестиций"
            value={formatNumber(analyticData?.investmentAmount)}
            changeValue={analyticData?.investmentAmountDiffrence}
          />

          <AnalyticItem
            icon={
              <svg
                width="26"
                height="18"
                viewBox="0 0 26 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24.9154 0.877344C23.4002 0.241797 21.8838 4.69827e-08 20.3682 4.69827e-08C15.5568 -0.000390578 10.7459 2.43516 5.93457 2.43516C4.72793 2.43516 3.52207 2.28203 2.31543 1.89922C2.17988 1.85625 2.04395 1.83594 1.91113 1.83594C1.23887 1.83594 0.651367 2.35625 0.651367 3.07852V15.4715C0.651367 15.9648 0.933789 16.4324 1.3873 16.6223C2.90254 17.2582 4.41895 17.5 5.93457 17.5C10.7459 17.5 15.5572 15.0645 20.3686 15.0645C21.5752 15.0645 22.7811 15.2176 23.9877 15.6004C24.1232 15.6434 24.2592 15.6637 24.392 15.6637C25.0643 15.6637 25.6518 15.1434 25.6518 14.4211V2.02852C25.6514 1.53477 25.3689 1.06758 24.9154 0.877344ZM13.1514 12.5C11.4252 12.5 10.0264 10.8207 10.0264 8.75C10.0264 6.67891 11.4256 5 13.1514 5C14.8771 5 16.2764 6.67891 16.2764 8.75C16.2764 10.8215 14.8768 12.5 13.1514 12.5Z"
                  fill="rgba(50, 129, 186, 1)"
                />
              </svg>
            }
            iconColor="rgba(172, 233, 221, 1)"
            label="Остаток в кассе всего"
            value={formatNumber(analyticData?.cash)}
            changeValue={analyticData?.cashDiffrence}
          />

          <AnalyticItem
            icon={
              <svg
                width="26"
                height="18"
                viewBox="0 0 26 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24.9154 0.877344C23.4002 0.241797 21.8838 4.69827e-08 20.3682 4.69827e-08C15.5568 -0.000390578 10.7459 2.43516 5.93457 2.43516C4.72793 2.43516 3.52207 2.28203 2.31543 1.89922C2.17988 1.85625 2.04395 1.83594 1.91113 1.83594C1.23887 1.83594 0.651367 2.35625 0.651367 3.07852V15.4715C0.651367 15.9648 0.933789 16.4324 1.3873 16.6223C2.90254 17.2582 4.41895 17.5 5.93457 17.5C10.7459 17.5 15.5572 15.0645 20.3686 15.0645C21.5752 15.0645 22.7811 15.2176 23.9877 15.6004C24.1232 15.6434 24.2592 15.6637 24.392 15.6637C25.0643 15.6637 25.6518 15.1434 25.6518 14.4211V2.02852C25.6514 1.53477 25.3689 1.06758 24.9154 0.877344ZM13.1514 12.5C11.4252 12.5 10.0264 10.8207 10.0264 8.75C10.0264 6.67891 11.4256 5 13.1514 5C14.8771 5 16.2764 6.67891 16.2764 8.75C16.2764 10.8215 14.8768 12.5 13.1514 12.5Z"
                  fill="rgba(50, 186, 143, 1)"
                />
              </svg>
            }
            iconColor="rgba(194, 234, 221, 1)"
            label="Фактически"
            value={formatNumber(analyticData?.currentCash)}
            changeValue={analyticData?.currentCashDiffrence}
          />

          <AnalyticItem
            icon={
              <svg
                width="26"
                height="18"
                viewBox="0 0 26 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24.9154 0.877344C23.4002 0.241797 21.8838 4.69827e-08 20.3682 4.69827e-08C15.5568 -0.000390578 10.7459 2.43516 5.93457 2.43516C4.72793 2.43516 3.52207 2.28203 2.31543 1.89922C2.17988 1.85625 2.04395 1.83594 1.91113 1.83594C1.23887 1.83594 0.651367 2.35625 0.651367 3.07852V15.4715C0.651367 15.9648 0.933789 16.4324 1.3873 16.6223C2.90254 17.2582 4.41895 17.5 5.93457 17.5C10.7459 17.5 15.5572 15.0645 20.3686 15.0645C21.5752 15.0645 22.7811 15.2176 23.9877 15.6004C24.1232 15.6434 24.2592 15.6637 24.392 15.6637C25.0643 15.6637 25.6518 15.1434 25.6518 14.4211V2.02852C25.6514 1.53477 25.3689 1.06758 24.9154 0.877344ZM13.1514 12.5C11.4252 12.5 10.0264 10.8207 10.0264 8.75C10.0264 6.67891 11.4256 5 13.1514 5C14.8771 5 16.2764 6.67891 16.2764 8.75C16.2764 10.8215 14.8768 12.5 13.1514 12.5Z"
                  fill="rgba(255, 142, 66, 1)"
                />
              </svg>
            }
            iconColor="rgba(255, 221, 198, 1)"
            label="Неподтверждённых договоров"
            value={formatNumber(analyticData?.unconfirmedCredits)}
            changeValue={analyticData?.unconfirmedCreditsDiffrence}
          />

          <AnalyticItem
            icon={
              <svg
                width="26"
                height="18"
                viewBox="0 0 26 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24.9154 0.877344C23.4002 0.241797 21.8838 4.69827e-08 20.3682 4.69827e-08C15.5568 -0.000390578 10.7459 2.43516 5.93457 2.43516C4.72793 2.43516 3.52207 2.28203 2.31543 1.89922C2.17988 1.85625 2.04395 1.83594 1.91113 1.83594C1.23887 1.83594 0.651367 2.35625 0.651367 3.07852V15.4715C0.651367 15.9648 0.933789 16.4324 1.3873 16.6223C2.90254 17.2582 4.41895 17.5 5.93457 17.5C10.7459 17.5 15.5572 15.0645 20.3686 15.0645C21.5752 15.0645 22.7811 15.2176 23.9877 15.6004C24.1232 15.6434 24.2592 15.6637 24.392 15.6637C25.0643 15.6637 25.6518 15.1434 25.6518 14.4211V2.02852C25.6514 1.53477 25.3689 1.06758 24.9154 0.877344ZM13.1514 12.5C11.4252 12.5 10.0264 10.8207 10.0264 8.75C10.0264 6.67891 11.4256 5 13.1514 5C14.8771 5 16.2764 6.67891 16.2764 8.75C16.2764 10.8215 14.8768 12.5 13.1514 12.5Z"
                  fill="rgba(255, 142, 66, 1)"
                />
              </svg>
            }
            iconColor="rgba(255, 221, 198, 1)"
            label="Неподтверждённых платежей"
            value={formatNumber(analyticData?.unconfirmedPayments)}
            changeValue={analyticData?.unconfirmedPaymentsDiffrence}
          />

          <AnalyticItem
            icon={
              <svg
                width="26"
                height="26"
                viewBox="0 0 61 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="30.0449" cy="30" r="30" fill="#DFD2F9" />
                <path
                  d="M22.2656 44.0777H38.7344V19.6289H22.2656V44.0777ZM24.2031 23.8841C25.6231 23.7514 26.7641 22.7398 26.9997 21.4399H34.0023C34.2369 22.7398 35.3769 23.7514 36.7969 23.8841V29.1438C35.5632 27.4451 33.2095 26.2964 30.5 26.2964C27.7915 26.2964 25.4368 27.4442 24.2031 29.1429V23.8841ZM32.5142 31.0265C32.3656 30.8523 32.1707 30.7656 31.9304 30.7656C31.7128 30.7656 31.5482 30.8266 31.4319 30.9513C31.3155 31.0751 31.2398 31.2847 31.2086 31.5792L31.1329 32.4051C31.0742 33.0188 30.9002 33.4821 30.6097 33.7961C30.3202 34.1118 29.8964 34.2674 29.3411 34.2674C29.0071 34.2674 28.7176 34.2055 28.4697 34.0817C28.2181 33.9579 28.0109 33.7855 27.8406 33.5697C27.6694 33.3513 27.5436 33.0921 27.4593 32.7906C27.4243 32.658 27.3998 32.5191 27.3798 32.3785H26.4375V31.328H27.3599C27.3873 31.0282 27.4375 30.7426 27.517 30.4738C27.6371 30.0625 28.1224 29.524 28.1224 29.524C28.1517 29.478 28.2019 29.448 28.2587 29.4409C28.3145 29.4356 28.3732 29.4533 28.4119 29.4904L28.9758 30.0175C29.0354 30.0723 29.0468 30.1607 29.0023 30.2297C29.0023 30.2297 28.6362 30.6241 28.5492 30.923C28.4631 31.2201 28.4186 31.5163 28.4186 31.8126C28.4186 32.1849 28.4886 32.4935 28.6306 32.7376C28.7725 32.9825 28.991 33.1037 29.2909 33.1037C29.5066 33.1037 29.6759 33.0435 29.8018 32.9233C29.9257 32.803 30.0033 32.5996 30.0392 32.3122L30.1253 31.3687C30.183 30.8116 30.3477 30.38 30.622 30.0785C30.8963 29.7752 31.3117 29.624 31.8679 29.624C32.1745 29.624 32.4479 29.6823 32.6891 29.7982C32.9294 29.9149 33.1328 30.0732 33.2993 30.2757C33.4649 30.4774 33.5888 30.7126 33.673 30.9814C33.7061 31.0928 33.7307 31.2095 33.7515 31.328H34.5614V32.3786H33.7657C33.7411 32.6245 33.6986 32.857 33.6352 33.0736C33.5264 33.4433 33.2038 33.8306 33.2038 33.8306C33.1773 33.8784 33.1271 33.912 33.0685 33.9208C33.0108 33.9279 32.9521 33.9102 32.9106 33.8722L32.3741 33.3778C32.3173 33.3265 32.3041 33.2451 32.34 33.1779C32.34 33.1779 32.5623 32.8852 32.6333 32.6323C32.7043 32.3803 32.7383 32.115 32.7383 31.8356C32.7384 31.4713 32.6655 31.2006 32.5142 31.0265ZM24.2031 34.5636C25.4368 36.2623 27.7915 37.4101 30.5 37.4101C33.2095 37.4101 35.5632 36.2623 36.7969 34.5627V39.8207C35.3769 39.9533 34.2369 40.9667 34.0023 42.2666H26.9987C26.7641 40.9667 25.6231 39.9533 24.2031 39.8207V34.5636Z"
                  fill="#8A43DC"
                />
                <path
                  d="M41.1562 16H19.8438C17.1683 16 15 18.0268 15 20.5276C15 23.0274 17.1684 25.0551 19.8438 25.0551H21.2969V22.3386C20.2279 22.3386 19.3594 21.5259 19.3594 20.5276C19.3594 19.5283 20.2279 18.7165 21.2969 18.7165H39.7031C40.7721 18.7165 41.6406 19.5283 41.6406 20.5276C41.6406 21.5259 40.7721 22.3386 39.7031 22.3386V25.0551H41.1562C43.8317 25.0551 46 23.0274 46 20.5276C46 18.0268 43.8317 16 41.1562 16Z"
                  fill="#8A43DC"
                />
                <path
                  d="M30.5005 25.2253C30.9603 25.2253 31.333 24.8769 31.333 24.4471C31.333 24.0173 30.9603 23.6689 30.5005 23.6689C30.0407 23.6689 29.668 24.0173 29.668 24.4471C29.668 24.8769 30.0407 25.2253 30.5005 25.2253Z"
                  fill="#8A43DC"
                />
                <path
                  d="M30.5005 40.0388C30.9603 40.0388 31.333 39.6904 31.333 39.2606C31.333 38.8308 30.9603 38.4824 30.5005 38.4824C30.0407 38.4824 29.668 38.8308 29.668 39.2606C29.668 39.6904 30.0407 40.0388 30.5005 40.0388Z"
                  fill="#8A43DC"
                />
              </svg>
            }
            iconColor="rgba(255, 218, 182, 1)"
            label="Сумма остатков"
            value={formatNumber(analyticData?.restAmount)}
            changeValue={analyticData?.restAmountDiffrence}
          />

          <AnalyticItem
            icon={
              <svg
                width="26"
                height="26"
                viewBox="0 0 25 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.458 0C5.76855 0 0.348633 5.41992 0.348633 12.1094C0.348633 18.7988 5.76855 24.2188 12.458 24.2188C19.1475 24.2188 24.5674 18.7988 24.5674 12.1094C24.5674 5.41992 19.1475 0 12.458 0ZM15.2461 17.0947L10.9395 13.9648C10.7881 13.8525 10.7002 13.6768 10.7002 13.4912V5.27344C10.7002 4.95117 10.9639 4.6875 11.2861 4.6875H13.6299C13.9521 4.6875 14.2158 4.95117 14.2158 5.27344V11.9971L17.3164 14.2529C17.5801 14.4434 17.6338 14.8096 17.4434 15.0732L16.0664 16.9678C15.8760 17.2266 15.5098 17.2852 15.2461 17.0947Z"
                  fill="#CA792D"
                />
              </svg>
            }
            iconColor="rgba(255, 218, 182, 1)"
            label="Сумма в просрочке"
            value={formatNumber(analyticData?.latePayment)}
            changeValue={analyticData?.latePaymentDiffrence}
          />

          <AnalyticItem
            icon={
              <svg
                width="26"
                height="25"
                viewBox="0 0 22 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.999 17.3964C7.89145 17.1536 7.70406 17.1289 7.62822 17.1289C7.55239 17.1289 7.36499 17.1531 7.26291 17.3828L6.98328 18.012C6.75104 18.5362 6.07073 18.4784 5.90849 17.9263L5.2949 15.8562L4.90808 17.1638C4.69334 17.8881 4.09214 18.375 3.41329 18.375H2.96158C2.63929 18.375 2.37825 18.0813 2.37825 17.7188C2.37825 17.3562 2.63929 17.0625 2.96158 17.0625H3.41329C3.58939 17.0625 3.74543 16.9362 3.80121 16.7483L4.46438 14.5072C4.58469 14.1049 4.91792 13.8342 5.2949 13.8342C5.67188 13.8342 6.0051 14.1045 6.12505 14.5072L6.63109 16.2151C7.35114 15.5511 8.60202 15.8173 9.03733 16.7959C9.10624 16.9509 9.23749 17.0399 9.37858 17.0527V13.6845L14.0452 8.47178V6.5625H9.08655C8.6053 6.5625 8.21155 6.11953 8.21155 5.57812V0H0.919918C0.435024 0 0.0449219 0.438867 0.0449219 0.984375V20.0156C0.0449219 20.5611 0.435024 21 0.919918 21H13.1699C13.6548 21 14.0449 20.5611 14.0449 20.0156V18.375L9.37821 18.3705C8.79051 18.3578 8.26332 17.9899 7.999 17.3964ZM14.0449 4.9998C14.0449 4.74141 13.9537 4.49121 13.7897 4.30664L10.2204 0.287109C10.0563 0.102539 9.83394 0 9.60061 0H9.37821V5.25H14.0449V4.9998ZM10.5449 14.2308V17.0625H13.0601L18.9547 10.386L16.4799 7.60184L10.5449 14.2308ZM20.7729 6.86314L19.6109 5.55598C19.2485 5.14828 18.6605 5.14828 18.2981 5.55598L17.3046 6.67365L19.7794 9.45779L20.7729 8.34012C21.1356 7.93242 21.1356 7.27084 20.7729 6.86314Z"
                  fill="#00464D"
                />
              </svg>
            }
            iconColor="rgba(153, 203, 207, 1)"
            label="Действующие договоры"
            value={formatNumber(analyticData?.activeCredits)}
            changeValue={analyticData?.activeCreditsDiffrence}
          />

          <AnalyticItem
            icon={
              <svg
                width="26"
                height="26"
                viewBox="0 0 60 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M40.1812 20.595L36.03 16.5C35.6976 16.1498 35.2983 15.8698 34.8558 15.6765C34.4133 15.4833 33.9366 15.3808 33.4537 15.375H22.395C21.4292 15.378 20.5038 15.7629 19.8209 16.4459C19.1379 17.1288 18.753 18.0542 18.75 19.02V40.98C18.753 41.9458 19.1379 42.8712 19.8209 43.5541C20.5038 44.2371 21.4292 44.622 22.395 44.625H37.605C38.5708 44.622 39.4962 44.2371 40.1791 43.5541C40.8621 42.8712 41.247 41.9458 41.25 40.98V23.1713C41.2515 22.6924 41.1579 22.2181 40.9744 21.7758C40.7909 21.3335 40.5213 20.9321 40.1812 20.595ZM38.5387 22.125H34.5V18.0862L38.5387 22.125ZM39 40.98C38.9971 41.3491 38.8491 41.7022 38.5882 41.9632C38.3272 42.2241 37.9741 42.3721 37.605 42.375H22.395C22.0259 42.3721 21.6728 42.2241 21.4118 41.9632C21.1509 41.7022 21.0029 41.3491 21 40.98V19.02C21.0029 18.6509 21.1509 18.2978 21.4118 18.0368C21.6728 17.7759 22.0259 17.6279 22.395 17.625H32.25V23.25C32.25 23.5484 32.3685 23.8345 32.5795 24.0455C32.7905 24.2565 33.0766 24.375 33.375 24.375H39V40.98Z"
                  fill="#ED8C2F"
                  stroke="#ED8C2F"
                  stroke-width="0.5"
                />
                <path
                  d="M26.6246 30.326C26.4128 30.1142 26.1255 29.9951 25.8259 29.9951C25.5263 29.9951 25.239 30.1142 25.0271 30.326C24.8153 30.5378 24.6963 30.8252 24.6963 31.1248C24.6963 31.4243 24.8153 31.7117 25.0271 31.9235L27.8396 34.736C27.9442 34.8414 28.0687 34.9251 28.2057 34.9823C28.3428 35.0394 28.4899 35.0688 28.6384 35.0688C28.7869 35.0688 28.9339 35.0394 29.071 34.9823C29.2081 34.9251 29.3326 34.8414 29.4371 34.736L35.0621 29.111C35.274 28.8872 35.3883 28.5885 35.3798 28.2804C35.3714 27.9724 35.2409 27.6803 35.0171 27.4685C34.7934 27.2567 34.4946 27.1424 34.1866 27.1508C33.8785 27.1593 33.5865 27.2897 33.3746 27.5135L28.5484 32.351L26.6246 30.326Z"
                  fill="#ED8C2F"
                  stroke="#ED8C2F"
                  stroke-width="0.5"
                />
              </svg>
            }
            iconColor="#FFE8A0"
            label="Закрытые договоры за период"
            value={formatNumber(analyticData?.closedCreditsPerPeriod)}
            changeValue={analyticData?.closedCreditsPerPeriodDiffrence}
          />
        </AnalyticsContainer>
        <ChartSection>
          <ScatterPlot
            title="Динамика продаж, покупок и остатка в кассе"
            data={scatterPlotData}
            xAxisLabel=""
            yAxisLabel="Сумма (руб)"
            maxX={maxX}
            maxY={maxY}
            minY={minY}
            yStep={maxY / 1}
            xStep={1}
            showLegend={true}
            xAxisCustomLabels={sellInfoData?.sellsSum.periods.map(
              (p) => p.periodName
            )}
            titleFontSize="20px"
          />
        </ChartSection>
        <ChartSection>
          <ColumnChart
            title="Динамика инвестиций"
            data={investmentData}
            maxValue={investmentMaxValue}
            step={Math.ceil(investmentMaxValue / 5)}
            titleFontSize="20px"
          />
        </ChartSection>
        <ChartSection>
          <ColumnChart
            title="Исполнение финансовых обязательств"
            data={financialObligationsData}
            maxValue={debtMaxValue}
            step={Math.ceil(debtMaxValue / 5)}
            titleFontSize="20px"
          />
        </ChartSection>
        <ChartSection>
          <HorizontalScroll>
            <MonthlyChartCanvas>
              <ColumnChart
                title={`Платежи по месяцам за ${currentYear}`}
                data={monthlyPaymentsData}
                maxValue={monthlyPaymentsMax}
                step={Math.ceil(monthlyPaymentsMax / 5)}
                titleFontSize="20px"
                tooltipAnchor="bar"
              />
            </MonthlyChartCanvas>
          </HorizontalScroll>
        </ChartSection>
      </AnalyticsWrapper>
    </PageLayout>
  );
};

const AnalyticsWrapper = styled.div`
  width: 100%;
  box-sizing: border-box;
`;

const AnalyticsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 22px;
  width: 100%;
  padding: 10px 80px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid rgba(209, 213, 219, 1);
  box-sizing: border-box;
`;

const ChartSection = styled.div`
  margin: 10px 0;
`;

const HorizontalScroll = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 125, 136, 0.35);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background-color: rgba(209, 213, 219, 0.4);
  }
`;

const MonthlyChartCanvas = styled.div`
  min-width: 960px;
`;

export default AnalyticsPage;
