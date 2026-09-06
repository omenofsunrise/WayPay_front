import { useState, useEffect } from "react";
import styled from "styled-components";
import PageLayout from "../components/ui/Layouts/PageLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import type { Investor, InvestorReport } from "../api/types/investor";
import useInvestor from "../api/hooks/useInvestor";
import { formatDate } from "../utils/dateFormatter";
import { formatMoney, parseMoney } from "../utils/formatPrice";
import ModalInfoTitle from "../components/ui/Text/ModalInfoTitle";
import investmentSvg from "../assets/ui/InvestorReport/investment.svg";
import paymentIncomeSvg from "../assets/ui/InvestorReport/PaymentIncome.svg";
import investorIncomeScg from "../assets/ui/InvestorReport/investorIncome.svg";
import selfIncomeSvg from "../assets/ui/InvestorReport/selfIncome.svg";
import commonIncomeSvg from "../assets/ui/InvestorReport/commonIncome.svg";
import shareSvg from "../assets/ui/InvestorReport/share.svg";
import allSelfIncomeSvg from "../assets/ui/InvestorReport/AllSelfIncome.svg";
import balanceSvg from "../assets/ui/InvestorReport/balance.svg";
import CustomTable from "../components/ui/tables/CustomTable";
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import GrayButton from "../components/ui/Buttons/GrayButton";
import { useInvestorPayout } from "../api/hooks/useInvestorPayout";
import type { InvestorPayout, PayoutSource } from "../api/types/investorPayout";
import PayoutModal from "../components/modal/PayoutModal";
import { useAuth } from "../сontext/AuthContext";
import useInvestorContribution from "../api/hooks/useInvestorContribution";
import type { InvestorContribution } from "../api/types/investorContribution";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import Pagination from "../components/ui/fields/CustomPagination";
import Tabs from "../components/ui/fields/Tabs";
import BaseModal from "../components/modal/BASE/modalCRUBase";
import {
  InputContainer,
  InputLabel,
  InputRow,
} from "../components/Containers/InputComponents";
import CustomInput from "../components/ui/fields/CustomInput";
import CustomCalendar from "../components/ui/fields/CustomCalendar";
import { FaLock, FaUnlock } from "react-icons/fa";
import investorService from "../api/services/investorService";
import CustomSelect from "../components/ui/fields/CustomSelect";

const pageSize = 5;

const InvestorReportV2Page = () => {
  const { getInvestors, updateInvestment } = useInvestor();

  const {
    payouts,
    isLoading: isPayoutsLoading,
    fetchPayouts,
    addPayout,
    removePayout,
    makePayoutAction,
  } = useInvestorPayout();

  const {
    data: contributionsData,
    isLoading: isContributionsLoading,
    getProducts: getContributions,
    makeAction: makeContributionAction,
  } = useInvestorContribution();

  const { hasRole } = useAuth();

  const [investors, setInvestors] = useState<Investor[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>("");
  const [report, setReport] = useState<InvestorReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [payoutSource, setPayoutSource] = useState<PayoutSource>("income");

  const [dataTab, setDataTab] = useState<"general" | "current">("general");

  const [contributionsPage, setContributionsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);

  const [isEditInvestmentModalOpen, setIsEditInvestmentModalOpen] =
    useState(false);
  const [selectedInvestmentForEdit, setSelectedInvestmentForEdit] = useState<{
    id: number;
    amount: number;
    date: string;
  } | null>(null);
  const [editInvestmentAmount, setEditInvestmentAmount] = useState("");
  const [editInvestmentDate, setEditInvestmentDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  const isSuperUser = hasRole("директор") || hasRole("суперадмин");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [investorsResult, reportResult] = await Promise.all([
          getInvestors(),
          investorService.getInvestorPoolReportV2(),
        ]);
        if (investorsResult?.items) {
          setInvestors(investorsResult.items);
          const first = investorsResult.items[0];
          if (first) {
            setSelectedInvestorId(first.id.toString());
            fetchPayouts(first.id);
            getContributions(first.id, undefined, { page: 1, pageSize });
          }
        }
        setReport(reportResult);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleInvestorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedInvestorId(e.target.value);
    setContributionsPage(1);
    setPayoutsPage(1);
    fetchPayouts(id);
    getContributions(id, undefined, { page: 1, pageSize });
  };

  const handleEditInvestment = (c: InvestorContribution) => {
    const dateStr = new Date(c.date).toISOString().split("T")[0];
    setSelectedInvestmentForEdit({ id: c.id, amount: c.amount, date: dateStr });
    setEditInvestmentAmount(c.amount.toString());
    setEditInvestmentDate(dateStr);
    setIsEditInvestmentModalOpen(true);
  };

  const handleUpdateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestmentForEdit) return;
    try {
      const amount = parseMoney(editInvestmentAmount);
      if (isNaN(amount) || amount <= 0) return;
      const dateObj = new Date(editInvestmentDate);
      const today = new Date();
      if (dateObj.toDateString() === today.toDateString()) {
        dateObj.setHours(
          today.getHours(),
          today.getMinutes(),
          today.getSeconds()
        );
      } else {
        dateObj.setHours(12, 0, 0, 0);
      }
      await updateInvestment(selectedInvestmentForEdit.id, amount, dateObj);
      setIsEditInvestmentModalOpen(false);
      if (selectedInvestorId) {
        getContributions(Number(selectedInvestorId), undefined, {
          page: contributionsPage,
          pageSize,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayoutSubmit = async () => {
    if (!selectedInvestorId || !payoutAmount || !report) return;
    const numericAmount = Number(payoutAmount.replace(/\D/g, ""));
    try {
      await addPayout({
        investorId: Number(selectedInvestorId),
        amount: numericAmount,
        payoutSource,
      });
      setIsPayoutModalOpen(false);
      setPayoutAmount("");
      fetchPayouts(Number(selectedInvestorId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleContributionAction = async (
    id: number,
    action: "confirm" | "reject"
  ) => {
    await makeContributionAction(id, action);
    if (selectedInvestorId) {
      getContributions(Number(selectedInvestorId), undefined, {
        page: contributionsPage,
        pageSize,
      });
    }
  };

  const handlePayoutAction = async (
    id: number,
    action: "confirm" | "reject"
  ) => {
    await makePayoutAction(id, action);
    if (selectedInvestorId) fetchPayouts(Number(selectedInvestorId));
  };

  // ── Cards ─────────────────────────────────────────────────────────────────

  const renderGeneralCards = () =>
    report && (
      <>
        <ReportCard>
          <IconContainer>
            <Icon src={investmentSvg} alt="" />
          </IconContainer>
          <ReportValue>{formatMoney(report.investment.toString())}</ReportValue>
          <ReportLabel>Инвестиция</ReportLabel>
        </ReportCard>
        {!report.isCompany && (
          <ReportCard>
            <IconContainer>
              <Icon src={shareSvg} alt="" />
            </IconContainer>
            <ReportValue>—</ReportValue>
            <ReportLabel>Доля инвестора</ReportLabel>
          </ReportCard>
        )}
        <ReportCard>
          <IconContainer>
            <Icon src={balanceSvg} alt="" />
          </IconContainer>
          <ReportValue>{formatMoney(report.balance.toString())}</ReportValue>
          <ReportLabel>Касса</ReportLabel>
        </ReportCard>
      </>
    );

  const renderCurrentIncomeCards = () =>
    report && (
      <>
        {report.isCompany ? (
          <>
            <ReportCard>
              <IconContainer>
                <Icon src={paymentIncomeSvg} alt="" />
              </IconContainer>
              <ReportValue>
                {formatMoney(report.paymentIncome.toString())}
              </ReportValue>
              <ReportLabel>Текущий доход</ReportLabel>
            </ReportCard>
            <ReportCard>
              <IconContainer>
                <Icon src={allSelfIncomeSvg} alt="" />
              </IconContainer>
              <ReportValue>
                {formatMoney(report.investorPaymentIncome.toString())}
              </ReportValue>
              <ReportLabel>Доход от инвесторов</ReportLabel>
            </ReportCard>
          </>
        ) : (
          <>
            <ReportCard>
              <IconContainer>
                <Icon src={investorIncomeScg} alt="" />
              </IconContainer>
              <ReportValue>
                {formatMoney(report.investorPaymentIncome.toString())}
              </ReportValue>
              <ReportLabel>Текущий доход инвестора</ReportLabel>
            </ReportCard>
            <ReportCard>
              <IconContainer>
                <Icon src={commonIncomeSvg} alt="" />
              </IconContainer>
              <ReportValue>
                {formatMoney(report.selfPaymentIncome.toString())}
              </ReportValue>
              <ReportLabel>Текущий собственный доход</ReportLabel>
            </ReportCard>
            <ReportCard>
              <IconContainer>
                <Icon src={selfIncomeSvg} alt="" />
              </IconContainer>
              <ReportValue>
                {formatMoney(report.paymentIncome.toString())}
              </ReportValue>
              <ReportLabel>Текущий общий доход</ReportLabel>
            </ReportCard>
          </>
        )}
      </>
    );

  // ── Tables ────────────────────────────────────────────────────────────────

  const investorsTableData = investors.map((inv) => [
    inv.fullName,
    inv.phoneNumber,
    `${formatMoney(inv.investmentAmount.toString())} ₽`,
    `${formatMoney(inv.balance.toString())} ₽`,
    `${inv.investorPie}%`,
    inv.currentIncome != null
      ? `${formatMoney(String(inv.currentIncome))} ₽`
      : "—",
  ]);

  const contributionsTableData =
    contributionsData?.items.map((c: InvestorContribution) => [
      formatDate(c.date.toString()),
      `${formatMoney(c.amount.toString())} ₽`,
      <ContributionActions>
        {!c.confirmed && (
          <DarkCyanButton
            onClick={() => handleEditInvestment(c)}
            disabled={isContributionsLoading}
          >
            Редактирование
          </DarkCyanButton>
        )}
        <GrayButton
          style={{ marginRight: 0 }}
          onClick={() => handleContributionAction(c.id, "reject")}
          disabled={isContributionsLoading}
        >
          Удалить
        </GrayButton>
        <LockToggleButton
          type="button"
          onClick={() =>
            !c.confirmed && handleContributionAction(c.id, "confirm")
          }
          disabled={isContributionsLoading || c.confirmed}
          $locked={c.confirmed}
        >
          {c.confirmed ? <FaLock /> : <FaUnlock />}
        </LockToggleButton>
      </ContributionActions>,
    ]) ?? [];

  const payoutTableData = (payouts ?? []).map((p: InvestorPayout) => [
    formatDate(p.payoutDate),
    p.employeeFullName,
    `${formatMoney(p.amount.toString())} ₽`,
    p.confirmed ? (
      <ConfirmedBadge />
    ) : (
      <ActionButtons>
        <DarkCyanButton
          onClick={() => handlePayoutAction(p.id, "confirm")}
          disabled={isPayoutsLoading}
        >
          Подтвердить
        </DarkCyanButton>
        <GrayButton
          onClick={() => handlePayoutAction(p.id, "reject")}
          disabled={isPayoutsLoading}
        >
          Удалить
        </GrayButton>
      </ActionButtons>
    ),
  ]);

  const investorOptions = investors.map((inv) => ({
    value: inv.id.toString(),
    label: inv.nickname || inv.fullName,
  }));

  return (
    <PageLayout>
      <TitleField>
        <CustomTitle>Инвесторы V2</CustomTitle>
      </TitleField>

      <ContentContainer>
        {/* Сводная таблица всех инвесторов */}
        <ModalInfoTitle>Инвесторы</ModalInfoTitle>
        <CustomTable
          columns={[
            { name: "ФИО", align: "left" },
            { name: "Телефон", align: "left" },
            { name: "Инвестиция", align: "left" },
            { name: "Касса", align: "left" },
            { name: "Доля", align: "left" },
            { name: "Текущий доход", align: "left" },
          ]}
          data={investorsTableData}
          isLoading={isLoading}
        />

        {/* Отчёт */}
        <TabsContainer>
          <Tabs<"general" | "current">
            tabs={[
              { id: "general", label: "Общие данные" },
              { id: "current", label: "Текущий доход" },
            ]}
            activeTab={dataTab}
            onChange={(tabId) => setDataTab(tabId)}
          />
        </TabsContainer>

        {report && (
          <ReportDataContainer>
            {dataTab === "general" && renderGeneralCards()}
            {dataTab === "current" && renderCurrentIncomeCards()}
          </ReportDataContainer>
        )}

        {/* Операции по конкретному инвестору */}
        <InvestorInfoContainer>
          <SelectWrapper>
            <CustomSelect
              value={selectedInvestorId}
              onChange={handleInvestorChange}
              options={investorOptions}
              placeholder="Выберите инвестора"
              disabled={isLoading}
            />
          </SelectWrapper>
          {isSuperUser && (
            <DarkCyanButton onClick={() => setIsPayoutModalOpen(true)}>
              Выплатить инвестору
            </DarkCyanButton>
          )}
        </InvestorInfoContainer>

        <ModalInfoTitle>История операций</ModalInfoTitle>

        {/* Инвестиции */}
        <OperationSection>
          <SectionTitle>Инвестиции</SectionTitle>
          <CustomTable
            columns={[
              { name: "Дата", isSortable: true },
              {
                name: "Сумма инвестиции, руб",
                isSortable: true,
                align: "left",
              },
              { name: "Действия", align: "center" },
            ]}
            data={contributionsTableData}
            isLoading={isContributionsLoading}
          />
          <PaginationLayout>
            <CountInfoTitle total={contributionsData?.totalCount || 0} />
            <Pagination
              total={contributionsData?.totalCount || 0}
              current={contributionsPage}
              onChange={setContributionsPage}
              itemsPerPage={pageSize}
            />
          </PaginationLayout>
        </OperationSection>

        {/* Выплаты */}
        <OperationSection>
          <SectionTitle>Выплаты</SectionTitle>
          <CustomTable
            columns={[
              { name: "Дата выплаты", isSortable: true },
              { name: "Выплатил", align: "left" },
              { name: "Выплата, руб", isSortable: true, align: "left" },
              { name: "Действия", align: "center" },
            ]}
            data={payoutTableData}
            isLoading={isPayoutsLoading}
          />
          <PaginationLayout>
            <CountInfoTitle total={payouts?.length || 0} />
            <Pagination
              total={payouts?.length || 0}
              current={payoutsPage}
              onChange={setPayoutsPage}
              itemsPerPage={pageSize}
            />
          </PaginationLayout>
        </OperationSection>

        <PayoutModal
          isOpen={isPayoutModalOpen}
          onClose={() => setIsPayoutModalOpen(false)}
          amount={payoutAmount}
          onAmountChange={setPayoutAmount}
          onSubmit={handlePayoutSubmit}
          investment={report?.investment || 0}
          payoutSource={payoutSource}
          onPayoutSourceChange={setPayoutSource}
          firstContribution={null}
          maxAmount={report?.balance || 0}
          balance={report?.balance || 0}
          isLoading={isPayoutsLoading}
          currentIncome={
            report?.isCompany
              ? report?.paymentIncome || 0
              : report?.investorPaymentIncome || 0
          }
          expectedIncome={
            report?.isCompany
              ? report?.allSelfIncome || 0
              : report?.investorIncome || 0
          }
          investorIncome={report?.investorPaymentIncome || 0}
          selfIncome={report?.selfPaymentIncome || 0}
          isCompany={report?.isCompany || false}
        />

        {isEditInvestmentModalOpen && selectedInvestmentForEdit && (
          <BaseModal
            title="Редактирование инвестиции"
            onClose={() => setIsEditInvestmentModalOpen(false)}
            onCancel={() => setIsEditInvestmentModalOpen(false)}
            onSave={handleUpdateInvestment}
            isSaveDisabled={
              !editInvestmentAmount ||
              isNaN(parseFloat(editInvestmentAmount)) ||
              parseFloat(editInvestmentAmount) <= 0
            }
            mode="edit"
          >
            <form onSubmit={handleUpdateInvestment} style={{ padding: "20px" }}>
              <InputRow>
                <InputLabel>Сумма инвестиции:</InputLabel>
                <InputContainer>
                  <CustomInput
                    name="investmentAmount"
                    inputType="rubles"
                    placeholder="Сумма"
                    value={editInvestmentAmount}
                    onChange={(e) => setEditInvestmentAmount(e.target.value)}
                  />
                </InputContainer>
              </InputRow>
              <InputRow>
                <InputLabel>Дата инвестиции</InputLabel>
                <InputContainer>
                  <CustomCalendar
                    placeholder="Дата инвестиции"
                    value={editInvestmentDate}
                    onChange={(dateString) => setEditInvestmentDate(dateString)}
                  />
                </InputContainer>
              </InputRow>
            </form>
          </BaseModal>
        )}
      </ContentContainer>
    </PageLayout>
  );
};

// ── Styled ────────────────────────────────────────────────────────────────────

const ContentContainer = styled.div``;

const InvestorInfoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const SelectWrapper = styled.div`
  flex-grow: 1;
  max-width: 400px;
`;

const TabsContainer = styled.div`
  margin: 30px 0 20px;
`;

const ReportDataContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  width: 100%;
  margin-bottom: 32px;
`;

const ReportCard = styled.div`
  background-color: white;
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  padding-bottom: 20px;
`;

const IconContainer = styled.div`
  position: absolute;
  top: 25px;
  left: 25px;
`;

const Icon = styled.img`
  width: 50px;
  height: 50px;
`;

const ReportLabel = styled.span`
  font-size: 15px;
  color: black;
  margin: 7px 0 0;
  padding-left: 25px;
`;

const ReportValue = styled.span`
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 90px 0 0;
  padding-left: 25px;
`;

const OperationSection = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
`;

const ConfirmedBadge = styled.span`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
`;

const ContributionActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 20px;
`;

const LockToggleButton = styled.button<{ $locked: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid
    ${({ $locked }) =>
      $locked ? "rgba(107, 114, 128, 0.4)" : "rgba(0, 125, 136, 1)"};
  background: ${({ $locked }) =>
    $locked ? "rgba(243, 244, 246, 1)" : "rgba(0, 125, 136, 0.08)"};
  color: ${({ $locked }) => ($locked ? "#6b7280" : "rgba(0, 125, 136, 1)")};
  cursor: ${({ $locked }) => ($locked ? "default" : "pointer")};
  transition: all 0.15s ease;
  padding: 0;
  flex-shrink: 0;
  svg {
    width: 15px;
    height: 15px;
  }
  &:hover:not(:disabled) {
    background: rgba(0, 125, 136, 0.15);
  }
  &:disabled {
    opacity: ${({ $locked }) => ($locked ? 1 : 0.5)};
  }
`;

export default InvestorReportV2Page;
