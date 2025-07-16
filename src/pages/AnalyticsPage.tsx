import { FiDollarSign, FiPackage, FiUsers } from "react-icons/fi";
import AnalyticItem from "../components/Analytics/AnalyticItem";
import PeriodField from "../components/ui/fields/PeriodField";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout"
import TitleField from "../components/ui/Layouts/TitleLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import styled from "styled-components";

const AnalyticsPage = () => {
    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Аналитика</CustomTitle>
            </TitleField>
            <FilterField>
                <PeriodField></PeriodField>
            </FilterField>
            <AnalyticsContainer>
      <AnalyticItem
        icon={<FiUsers size={20} color="#fff" />}
        iconColor="#4F46E5"
        label="Сумма инвестиций"
        value="1 000 000"
        changeValue={5}
      />

      <AnalyticItem
        icon={<FiDollarSign size={20} color="#fff" />}
        iconColor="#10B981"
        label="Общий доход"
        value="$8,567"
        changeValue={-5.3}
      />

      <AnalyticItem
        icon={<FiPackage size={20} color="#fff" />}
        iconColor="#F59E0B"
        label="Заказов"
        value="345"
        changeValue={0}
      />
    </AnalyticsContainer>

        </PageLayout>
    )
}

const AnalyticsContainer = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background-color: #f8fafc;
  border-radius: 8px;
`;

export default AnalyticsPage;