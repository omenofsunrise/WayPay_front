import AnalyticItem from "../components/Analytics/AnalyticItem";
import PeriodField from "../components/ui/fields/PeriodField";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout"
import CustomTitle from "../components/ui/Text/CustomTitle";
import styled from "styled-components";
import TitleField from "../components/ui/Layouts/TitleLayout";
import ScatterPlot from "../components/Dashboards/ScatterPlot";

const AnalyticsPage = () => {
    const financialData: PointData[] = [
        { x: 1, y: 1200000, color: "rgba(0, 125, 136, 1)", label: "Сумма продаж", name: "Янв" },
        { x: 2, y: 1800000, color: "rgba(0, 125, 136, 1)", label: "Сумма продаж", name: "Фев" },
        { x: 3, y: 1500000, color: "rgba(0, 125, 136, 1)", label: "Сумма продаж", name: "Мар" },
        { x: 4, y: 2100000, color: "rgba(0, 125, 136, 1)", label: "Сумма продаж", name: "Апр" },
        { x: 5, y: 1900000, color: "rgba(0, 125, 136, 1)", label: "Сумма продаж", name: "Май" },
        { x: 6, y: 2300000, color: "rgba(0, 125, 136, 1)", label: "Сумма продаж", name: "Июн" },
        
        { x: 1, y: 800000, color: "rgba(37, 203, 161, 1)", label: "Сумма покупок", name: "Янв" },
        { x: 2, y: 950000, color: "rgba(37, 203, 161, 1)", label: "Сумма покупок", name: "Фев" },
        { x: 3, y: 1100000, color: "rgba(37, 203, 161, 1)", label: "Сумма покупок", name: "Мар" },
        { x: 4, y: 1050000, color: "rgba(37, 203, 161, 1)", label: "Сумма покупок", name: "Апр" },
        { x: 5, y: 1200000, color: "rgba(37, 203, 161, 1)", label: "Сумма покупок", name: "Май" },
        { x: 6, y: 1400000, color: "rgba(37, 203, 161, 1)", label: "Сумма покупок", name: "Июн" },
        
        { x: 1, y: 400000, color: "rgba(255, 90, 90, 1)", label: "Остаток в кассе", name: "Янв" },
        { x: 2, y: 850000, color: "rgba(255, 90, 90, 1)", label: "Остаток в кассе", name: "Фев" },
        { x: 3, y: 400000, color: "rgba(255, 90, 90, 1)", label: "Остаток в кассе", name: "Мар" },
        { x: 4, y: 1050000, color: "rgba(255, 90, 90, 1)", label: "Остаток в кассе", name: "Апр" },
        { x: 5, y: 700000, color: "rgba(255, 90, 90, 1)", label: "Остаток в кассе", name: "Май" },
        { x: 6, y: 900000, color: "rgba(255, 90, 90, 1)", label: "Остаток в кассе", name: "Июн" },
    ];

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Аналитика</CustomTitle>
            </TitleField>
            <FilterField>
                <PeriodField></PeriodField>
            </FilterField>
            <AnalyticsWrapper>
                <AnalyticsContainer>
                    <AnalyticItem
                        icon={
                            <svg width="22" height="17" viewBox="0 0 22 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21.2988 13.4844H3.58008V1.01562C3.58008 0.653047 3.28641 0.359375 2.92383 0.359375H1.61133C1.24875 0.359375 0.955078 0.653047 0.955078 1.01562V14.7969C0.955078 15.5216 1.54283 16.1094 2.26758 16.1094H21.2988C21.6614 16.1094 21.9551 15.8157 21.9551 15.4531V14.1406C21.9551 13.778 21.6614 13.4844 21.2988 13.4844ZM19.9863 1.67188H15.144C14.2671 1.67188 13.8278 2.73213 14.448 3.35229L15.7769 4.68119L12.7676 7.69092L9.75826 4.6816C9.24557 4.16891 8.41459 4.16891 7.9023 4.6816L5.08494 7.49897C4.82859 7.75531 4.82859 8.1708 5.08494 8.42715L6.01271 9.35492C6.26906 9.61127 6.68455 9.61127 6.9409 9.35492L8.83008 7.46533L11.8394 10.4746C12.3521 10.9873 13.1831 10.9873 13.6954 10.4746L17.6329 6.53715L18.9618 7.86606C19.5819 8.48621 20.6422 8.04693 20.6422 7.17002V2.32812C20.6426 1.96555 20.3489 1.67188 19.9863 1.67188Z" fill="#A63535"/>
                            </svg>
                        }
                        iconColor="rgba(255, 189, 189, 1)"
                        label="Сумма инвестиций"
                        value="1 000 000"
                        changeValue={5}
                    />

                    <AnalyticItem
                        icon={
                            <svg width="26" height="18" viewBox="0 0 26 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24.9154 0.877344C23.4002 0.241797 21.8838 4.69827e-08 20.3682 4.69827e-08C15.5568 -0.000390578 10.7459 2.43516 5.93457 2.43516C4.72793 2.43516 3.52207 2.28203 2.31543 1.89922C2.17988 1.85625 2.04395 1.83594 1.91113 1.83594C1.23887 1.83594 0.651367 2.35625 0.651367 3.07852V15.4715C0.651367 15.9648 0.933789 16.4324 1.3873 16.6223C2.90254 17.2582 4.41895 17.5 5.93457 17.5C10.7459 17.5 15.5572 15.0645 20.3686 15.0645C21.5752 15.0645 22.7811 15.2176 23.9877 15.6004C24.1232 15.6434 24.2592 15.6637 24.392 15.6637C25.0643 15.6637 25.6518 15.1434 25.6518 14.4211V2.02852C25.6514 1.53477 25.3689 1.06758 24.9154 0.877344ZM13.1514 12.5C11.4252 12.5 10.0264 10.8207 10.0264 8.75C10.0264 6.67891 11.4256 5 13.1514 5C14.8771 5 16.2764 6.67891 16.2764 8.75C16.2764 10.8215 14.8768 12.5 13.1514 12.5Z" fill="#008067"/>
                            </svg>
                        }
                        iconColor="rgba(172, 233, 221, 1)"
                        label="Остаток в кассе"
                        value="$8,567"
                        changeValue={-5.3}
                    />

                    <AnalyticItem
                        icon={
                            <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.458 0C5.76855 0 0.348633 5.41992 0.348633 12.1094C0.348633 18.7988 5.76855 24.2188 12.458 24.2188C19.1475 24.2188 24.5674 18.7988 24.5674 12.1094C24.5674 5.41992 19.1475 0 12.458 0ZM15.2461 17.0947L10.9395 13.9648C10.7881 13.8525 10.7002 13.6768 10.7002 13.4912V5.27344C10.7002 4.95117 10.9639 4.6875 11.2861 4.6875H13.6299C13.9521 4.6875 14.2158 4.95117 14.2158 5.27344V11.9971L17.3164 14.2529C17.5801 14.4434 17.6338 14.8096 17.4434 15.0732L16.0664 16.9678C15.876 17.2266 15.5098 17.2852 15.2461 17.0947Z" fill="#CA792D"/>
                            </svg>
                        }
                        iconColor="rgba(255, 218, 182, 1)"
                        label="Сумма в просрочке"
                        value="345"
                        changeValue={0}
                    />

                    <AnalyticItem
                        icon={
                            <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.999 17.3964C7.89145 17.1536 7.70406 17.1289 7.62822 17.1289C7.55239 17.1289 7.36499 17.1531 7.26291 17.3828L6.98328 18.012C6.75104 18.5362 6.07073 18.4784 5.90849 17.9263L5.2949 15.8562L4.90808 17.1638C4.69334 17.8881 4.09214 18.375 3.41329 18.375H2.96158C2.63929 18.375 2.37825 18.0813 2.37825 17.7188C2.37825 17.3562 2.63929 17.0625 2.96158 17.0625H3.41329C3.58939 17.0625 3.74543 16.9362 3.80121 16.7483L4.46438 14.5072C4.58469 14.1049 4.91792 13.8342 5.2949 13.8342C5.67188 13.8342 6.0051 14.1045 6.12505 14.5072L6.63109 16.2151C7.35114 15.5511 8.60202 15.8173 9.03733 16.7959C9.10624 16.9509 9.23749 17.0399 9.37858 17.0527V13.6845L14.0452 8.47178V6.5625H9.08655C8.6053 6.5625 8.21155 6.11953 8.21155 5.57812V0H0.919918C0.435024 0 0.0449219 0.438867 0.0449219 0.984375V20.0156C0.0449219 20.5611 0.435024 21 0.919918 21H13.1699C13.6548 21 14.0449 20.5611 14.0449 20.0156V18.375L9.37821 18.3705C8.79051 18.3578 8.26332 17.9899 7.999 17.3964ZM14.0449 4.9998C14.0449 4.74141 13.9537 4.49121 13.7897 4.30664L10.2204 0.287109C10.0563 0.102539 9.83394 0 9.60061 0H9.37821V5.25H14.0449V4.9998ZM10.5449 14.2308V17.0625H13.0601L18.9547 10.386L16.4799 7.60184L10.5449 14.2308ZM20.7729 6.86314L19.6109 5.55598C19.2485 5.14828 18.6605 5.14828 18.2981 5.55598L17.3046 6.67365L19.7794 9.45779L20.7729 8.34012C21.1356 7.93242 21.1356 7.27084 20.7729 6.86314Z" fill="#00464D"/>
                            </svg>
                        }
                        iconColor="rgba(153, 203, 207, 1)"
                        label="Действующие договоры"
                        value="345"
                        changeValue={0}
                    />
                </AnalyticsContainer>

                <ChartSection>
                    <ScatterPlot
                        title="Динамика продаж, покупок и остатка в кассе"
                        data={financialData}
                        xAxisLabel=""
                        yAxisLabel="Сумма (руб)"
                        maxX={6}
                        maxY={2500000}
                        xStep={1}
                        yStep={500000}
                        height={200}
                        showLegend={true}
                        xAxisCustomLabels={["Янв", "Фев", "Мар", "Апр", "Май", "Июн"]}
                        titleFontSize="15px"
                    />
                </ChartSection>
            </AnalyticsWrapper>
        </PageLayout>
    )
}

const AnalyticsWrapper = styled.div`
    width: 100%;
    box-sizing: border-box;
`;

const AnalyticsContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    width: 100%;
    padding: 20px 80px;
    background-color: #f8fafc;
    border-radius: 8px;
    border: 1px solid rgba(209, 213, 219, 1);
    box-sizing: border-box;
    margin-bottom: 24px;
`;

const ChartSection = styled.div`
    width: 60%;
    box-sizing: border-box;
`;

export default AnalyticsPage;

// Типы для данных графика
interface PointData {
    x: number;
    y: number;
    color: string;
    label?: string;
    value?: number;
    name?: string;
}