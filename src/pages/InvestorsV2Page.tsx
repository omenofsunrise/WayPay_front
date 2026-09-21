import { useState } from "react";
import styled from "styled-components";
import Tabs from "../components/ui/fields/Tabs";
import InvestorPage from "./InvestorPage";
import InvestorReportPage from "./InvestorReportPage";
import InvestorsPoolPage from "./InvestorsPoolPage";

type InvestorsV2Tab = "investors" | "investor-report" | "pools";

const InvestorsV2Page = () => {
  const [activeTab, setActiveTab] = useState<InvestorsV2Tab>("investors");

  return (
    <InvestorsV2Container>
      <Tabs<InvestorsV2Tab>
        tabs={[
          { id: "investors", label: "Инвесторы" },
          { id: "investor-report", label: "Отчёт инвесторов" },
          { id: "pools", label: "Пулы и отчёт" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <TabPanel $isActive={activeTab === "investors"}>
        <InvestorPage />
      </TabPanel>
      <TabPanel $isActive={activeTab === "investor-report"}>
        <InvestorReportPage />
      </TabPanel>
      <TabPanel $isActive={activeTab === "pools"}>
        <InvestorsPoolPage />
      </TabPanel>
    </InvestorsV2Container>
  );
};

const InvestorsV2Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 100%;
  margin: 0 20px;

  > div:first-child {
    margin-bottom: 0;
  }
`;

const TabPanel = styled.div<{ $isActive: boolean }>`
  display: ${(props) => (props.$isActive ? "flex" : "none")};
  flex: 1;
  min-height: 0;

  > div {
    margin: 0;
    width: 100%;
  }
`;

export default InvestorsV2Page;
