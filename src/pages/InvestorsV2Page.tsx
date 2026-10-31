import { useEffect, useState } from "react";
import styled from "styled-components";
import { useSearchParams } from "react-router-dom";
import Tabs from "../components/ui/fields/Tabs";
import { useAuth } from "../сontext/AuthContext";
import InvestorPage from "./InvestorPage";
import InvestorReportPage from "./InvestorReportPage";
import InvestorsPoolPage from "./InvestorsPoolPage";

type InvestorsTab = "investors" | "pools";

const InvestorsV2Page = () => {
  const { authInfo } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get("tab") === "pools" ? "pools" : "investors";
  const investorQueryValue = searchParams.get("investorId");
  const queryInvestorId = Number(investorQueryValue);
  const [activeTab, setActiveTab] = useState<InvestorsTab>(queryTab);
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | "deleted" | null>(
    investorQueryValue === "deleted"
      ? "deleted"
      : Number.isFinite(queryInvestorId) && queryInvestorId > 0
        ? queryInvestorId
        : null
  );

  const isPoolV2 = authInfo?.employee?.poolV2 ?? false;

  useEffect(() => {
    setActiveTab(queryTab);
    setSelectedInvestorId(
      investorQueryValue === "deleted"
        ? "deleted"
        : Number.isFinite(queryInvestorId) && queryInvestorId > 0
          ? queryInvestorId
          : null
    );
  }, [investorQueryValue, queryInvestorId, queryTab]);

  const handleTabChange = (tab: InvestorsTab) => {
    setActiveTab(tab);
    setSelectedInvestorId(null);
    setSearchParams(tab === "pools" ? { tab: "pools" } : {});
  };

  const handleOpenReport = (investorId: number, action?: "payout") => {
    setActiveTab("investors");
    setSelectedInvestorId(investorId);
    setSearchParams({
      investorId: investorId.toString(),
      ...(action ? { action } : {}),
    });
  };

  const handleBackToInvestors = () => {
    setSelectedInvestorId(null);
    setSearchParams({});
  };

  const handleOpenDeletedReport = () => {
    setActiveTab("investors");
    setSelectedInvestorId("deleted");
    setSearchParams({ investorId: "deleted" });
  };

  return (
    <InvestorsContainer>
      <SectionHeader>
        <SectionTitle>Инвесторы</SectionTitle>
        <Tabs<InvestorsTab>
          tabs={[
            { id: "investors", label: "Инвесторы" },
            { id: "pools", label: "Пулы инвесторов" },
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
          fontSize={16}
        />
      </SectionHeader>

      <SectionContent>
        {activeTab === "investors" ? (
          selectedInvestorId ? (
            <InvestorReportPage
              embedded
              initialInvestorId={selectedInvestorId}
              onBack={handleBackToInvestors}
              autoOpenPayout={searchParams.get("action") === "payout"}
              onPayoutOpened={() =>
                setSearchParams({ investorId: selectedInvestorId.toString() })
              }
            />
          ) : (
            <InvestorPage
              embedded
              onOpenReport={handleOpenReport}
              onOpenDeletedReport={handleOpenDeletedReport}
            />
          )
        ) : (
          <InvestorsPoolPage embedded enableReinvestments={!isPoolV2} />
        )}
      </SectionContent>
    </InvestorsContainer>
  );
};

const InvestorsContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 100%;
  margin: 0 20px 24px;
`;

const SectionHeader = styled.div`
  text-align: left;
  padding: 26px 24px 0;

  > div:last-child {
    margin-top: 18px;
    margin-bottom: 0;
  }

  > div:last-child ul {
    gap: 26px;
  }

  > div:last-child li {
    padding: 14px 8px 16px;
  }

  > div:last-child li > div {
    height: 3px;
  }
`;

const SectionTitle = styled.h1`
  width: fit-content;
  margin: 0;
  color: #111827;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  text-align: left;
`;

const SectionContent = styled.div`
  flex: 1;
  min-width: 0;
  padding: 22px 24px 24px;

  > div {
    width: 100%;
    margin: 0;
    background: transparent;
  }
`;

export default InvestorsV2Page;
