import { useState, useEffect } from "react";
import styled from "styled-components";
import PageLayout from "../components/ui/Layouts/PageLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import type { Investor, InvestorReport } from "../api/types/investor";
import useInvestor from "../api/hooks/useInvestor";
import { formatDate } from "../utils/dateFormatter";
import { formatMoney, parseMoney } from "../utils/formatPrice";
import investmentSvg from "../assets/ui/InvestorReport/investment.svg";
import paymentIncomeSvg from "../assets/ui/InvestorReport/PaymentIncome.svg";
import investorIncomeScg from "../assets/ui/InvestorReport/investorIncome.svg";
import commonIncomeSvg from "../assets/ui/InvestorReport/commonIncome.svg";
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
import InvestorModal from "../components/modal/CrudInherited/InvestorModal";

const pageSize = 5;

const InvestorReportV2Page = () => {
  const {
    getInvestors,
    updateInvestment,
    addInvestment,
  } = useInvestor();

  const {
    payouts,
    isLoading: isPayoutsLoading,
    fetchPayouts,
    addPayout,
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
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [investorModalMode, setInvestorModalMode] = useState<
    "create" | "edit"
  >("create");
  const [investorForEdit, setInvestorForEdit] = useState<Investor | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentDate, setInvestmentDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  const [activeTab, setActiveTab] = useState<"payouts" | "investments">(
    "payouts"
  );

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

  const selectedInvestor =
    investors.find((inv) => inv.id.toString() === selectedInvestorId) ?? null;
  const selectedInvestorLabel =
    selectedInvestor?.nickname || selectedInvestor?.fullName || "";

  const refreshInvestorsAndReport = async () => {
    const [investorsResult, reportResult] = await Promise.all([
      getInvestors(),
      investorService.getInvestorPoolReportV2(),
    ]);
    if (investorsResult?.items) {
      setInvestors(investorsResult.items);
    }
    setReport(reportResult);
  };

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

  const selectInvestorForAction = (investor: Investor) => {
    setSelectedInvestorId(investor.id.toString());
    setContributionsPage(1);
    setPayoutsPage(1);
    fetchPayouts(investor.id);
    getContributions(investor.id, undefined, { page: 1, pageSize });
  };

  const openPayoutModalForInvestor = (investor: Investor) => {
    selectInvestorForAction(investor);
    setPayoutAmount("");
    setPayoutSource("income");
    setActiveTab("payouts");
    setIsPayoutModalOpen(true);
  };

  const openInvestmentModalForInvestor = (investor: Investor) => {
    selectInvestorForAction(investor);
    setInvestmentAmount("");
    setInvestmentDate(new Date().toISOString().split("T")[0]);
    setActiveTab("investments");
    setIsInvestmentModalOpen(true);
  };

  const openCreateInvestorModal = () => {
    setInvestorModalMode("create");
    setInvestorForEdit(null);
    setIsInvestorModalOpen(true);
  };

  const openEditInvestorModal = (investor: Investor) => {
    selectInvestorForAction(investor);
    setInvestorModalMode("edit");
    setInvestorForEdit(investor);
    setIsInvestorModalOpen(true);
  };

  useEffect(() => {
    if (!selectedInvestorId) return;
    getContributions(Number(selectedInvestorId), undefined, {
      page: contributionsPage,
      pageSize,
    });
  }, [selectedInvestorId, contributionsPage, getContributions]);

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
      await Promise.all([
        fetchPayouts(Number(selectedInvestorId)),
        refreshInvestorsAndReport(),
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestorId) return;

    try {
      const amount = parseMoney(investmentAmount);
      if (isNaN(amount) || amount <= 0) {
        alert("Пожалуйста, введите корректную сумму инвестиции");
        return;
      }

      const dateObj = new Date(investmentDate);
      const today = new Date();

      if (dateObj.toDateString() === today.toDateString()) {
        dateObj.setHours(
          today.getHours(),
          today.getMinutes(),
          today.getSeconds(),
          today.getMilliseconds()
        );
      } else {
        dateObj.setHours(12, 0, 0, 0);
      }

      await addInvestment(Number(selectedInvestorId), amount, dateObj);

      setIsInvestmentModalOpen(false);
      setInvestmentAmount("");
      setInvestmentDate(today.toISOString().split("T")[0]);
      await Promise.all([
        refreshInvestorsAndReport(),
        getContributions(Number(selectedInvestorId), undefined, {
          page: contributionsPage,
          pageSize,
        }),
      ]);
    } catch (err) {
      console.error("Ошибка при добавлении инвестиции:", err);
      alert("Произошла ошибка при добавлении инвестиции");
    }
  };

  const handleSubmitInvestor = async (investorData: Omit<Investor, "id">) => {
    const savedInvestor =
      investorModalMode === "edit" && investorForEdit
        ? await investorService.updateInvestor(investorForEdit.id, investorData)
        : await investorService.createInvestor(investorData);

    await refreshInvestorsAndReport();
    if (savedInvestor) {
      selectInvestorForAction(savedInvestor);
    }
    return true;
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

  const renderPoolSummaryCards = () =>
    report && (
      <>
        <ReportCard>
          <IconContainer>
            <Icon src={investmentSvg} alt="" />
          </IconContainer>
          <ReportValue>{formatMoney(report.investment.toString())}</ReportValue>
          <ReportLabel>Инвестиция</ReportLabel>
        </ReportCard>
        <ReportCard>
          <IconContainer>
            <Icon src={balanceSvg} alt="" />
          </IconContainer>
          <ReportValue>{formatMoney(report.balance.toString())}</ReportValue>
          <ReportLabel>Касса</ReportLabel>
        </ReportCard>
        <ReportCard>
          <IconContainer>
            <Icon src={paymentIncomeSvg} alt="" />
          </IconContainer>
          <ReportValue>{formatMoney(report.paymentIncome.toString())}</ReportValue>
          <ReportLabel>Текущий доход</ReportLabel>
        </ReportCard>
        <ReportCard>
          <IconContainer>
            <Icon src={investorIncomeScg} alt="" />
          </IconContainer>
          <ReportValue>
            {formatMoney(report.investorPaymentIncome.toString())}
          </ReportValue>
          <ReportLabel>Доход инвесторов</ReportLabel>
        </ReportCard>
        <ReportCard>
          <IconContainer>
            <Icon src={commonIncomeSvg} alt="" />
          </IconContainer>
          <ReportValue>
            {formatMoney(report.selfPaymentIncome.toString())}
          </ReportValue>
          <ReportLabel>Собственный доход</ReportLabel>
        </ReportCard>
      </>
    );

  // ── Tables ────────────────────────────────────────────────────────────────

  const investorsTableData = investors.map((inv) => [
    inv.id,
    inv.nickname || "—",
    inv.fullName,
    inv.phoneNumber,
    formatMoney(inv.investmentAmount.toString()),
    formatMoney(inv.balance.toString()),
    `${inv.investorPie}%`,
    inv.currentIncome != null
      ? formatMoney(String(inv.currentIncome))
      : "—",
  ]);

  const contributionsTableData =
    contributionsData?.items.map((c: InvestorContribution) => [
      formatDate(c.date.toString()),
      formatMoney(c.amount.toString()),
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

  const displayedPayouts = (payouts ?? []).slice(
    (payoutsPage - 1) * pageSize,
    payoutsPage * pageSize
  );

  const payoutTableData = displayedPayouts.map((p: InvestorPayout) => [
    formatDate(p.payoutDate),
    p.employeeFullName,
    formatMoney(p.amount.toString()),
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

  const investorTableActions = (rowData: unknown[]) => {
    const investorId = Number(rowData[0]);
    const investor = investors.find((inv) => inv.id === investorId);
    if (!investor) return [];

    return [
      {
        label: "Выплатить",
        action: () => openPayoutModalForInvestor(investor),
        color: "#3B82F6",
        disabled: !isSuperUser,
      },
      {
        label: "Редактировать",
        action: () => openEditInvestorModal(investor),
        color: "#F59E0B",
        disabled: !isSuperUser,
      },
      {
        label: "Добавить инвестицию",
        action: () => openInvestmentModalForInvestor(investor),
        color: "#007D88",
      },
    ];
  };

  return (
    <PageLayout>
      <TitleField>
        <CustomTitle>Инвесторы</CustomTitle>
        {isSuperUser && (
          <DarkCyanButton onClick={openCreateInvestorModal}>
            + Новый инвестор
          </DarkCyanButton>
        )}
      </TitleField>

      <ContentContainer>
        <PoolSummarySection>
          <SectionTitle>Общие данные по пулу инвесторов</SectionTitle>
          {report && (
            <ReportDataContainer>{renderPoolSummaryCards()}</ReportDataContainer>
          )}
        </PoolSummarySection>

        <InvestorsSection>
          <SectionTitle>Инвесторы</SectionTitle>
          <CustomTable
            columns={[
              { name: "ID", isHidden: true },
              { name: "Никнейм", align: "left" },
              { name: "ФИО", align: "left" },
              { name: "Телефон", align: "left" },
              { name: "Инвестиция", align: "left" },
              { name: "Касса", align: "left" },
              { name: "Доля", align: "left" },
              { name: "Текущий доход", align: "left" },
            ]}
            data={investorsTableData}
            isLoading={isLoading}
            contextMenuActions={investorTableActions}
          />
        </InvestorsSection>

        <TabsContainer>
          <Tabs<"payouts" | "investments">
            tabs={[
              { id: "payouts", label: "Выплаты" },
              { id: "investments", label: "Инвестиции" },
            ]}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId)}
          />
        </TabsContainer>

        {activeTab === "payouts" && (
          <OperationSection>
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
                <DarkCyanButton
                  onClick={() =>
                    selectedInvestor && openPayoutModalForInvestor(selectedInvestor)
                  }
                  disabled={!selectedInvestor}
                >
                  {selectedInvestorLabel
                    ? `Выплатить: ${selectedInvestorLabel}`
                    : "Выплатить инвестору"}
                </DarkCyanButton>
              )}
            </InvestorInfoContainer>

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
        )}

        {activeTab === "investments" && (
          <OperationSection>
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
            </InvestorInfoContainer>

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
        )}

        <PayoutModal
          isOpen={isPayoutModalOpen}
          onClose={() => setIsPayoutModalOpen(false)}
          amount={payoutAmount}
          onAmountChange={setPayoutAmount}
          onSubmit={handlePayoutSubmit}
          investorName={selectedInvestorLabel}
          investment={selectedInvestor?.investmentAmount || 0}
          payoutSource={payoutSource}
          onPayoutSourceChange={setPayoutSource}
          firstContribution={null}
          maxAmount={selectedInvestor?.currentIncome || 0}
          balance={selectedInvestor?.balance || 0}
          isLoading={isPayoutsLoading}
          currentIncome={selectedInvestor?.currentIncome || 0}
          investorIncome={
            selectedInvestor?.isCompany
              ? null
              : selectedInvestor?.currentIncome || 0
          }
          selfIncome={
            selectedInvestor?.isCompany
              ? selectedInvestor?.currentIncome || 0
              : null
          }
          isCompany={selectedInvestor?.isCompany || false}
        />

        <InvestorModal
          mode={investorModalMode}
          isOpen={isInvestorModalOpen}
          onClose={() => setIsInvestorModalOpen(false)}
          onSubmit={handleSubmitInvestor}
          initialData={
            investorForEdit || {
              id: 0,
              nickname: "",
              fullName: "",
              phoneNumber: "",
              investorPie: 0,
              investmentAmount: 0,
              balance: 0,
              isCompany: false,
              isBlocked: false,
              activeUntil: new Date().toISOString().split("T")[0],
              currentIncome: 0,
            }
          }
        />

        {isInvestmentModalOpen && (
          <BaseModal
            title={
              selectedInvestorLabel
                ? `Добавить инвестицию: ${selectedInvestorLabel}`
                : "Добавить инвестицию"
            }
            onClose={() => setIsInvestmentModalOpen(false)}
            onCancel={() => setIsInvestmentModalOpen(false)}
            onSave={handleSubmitInvestment}
            isSaveDisabled={
              !investmentAmount || parseMoney(investmentAmount) <= 0
            }
            mode="create"
          >
            <form onSubmit={handleSubmitInvestment} style={{ padding: "20px" }}>
              <InputRow>
                <InputLabel>Сумма инвестиции:</InputLabel>
                <InputContainer>
                  <CustomInput
                    name="investmentAmount"
                    inputType="rubles"
                    placeholder="Сумма"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                  />
                </InputContainer>
              </InputRow>
              <InputRow>
                <InputLabel>Дата инвестиции</InputLabel>
                <InputContainer>
                  <CustomCalendar
                    placeholder="Дата инвестиции"
                    value={investmentDate}
                    onChange={(dateString) => setInvestmentDate(dateString)}
                  />
                </InputContainer>
              </InputRow>
            </form>
          </BaseModal>
        )}

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

const PoolSummarySection = styled.section`
  margin-bottom: 24px;
`;

const InvestorsSection = styled.section`
  margin-bottom: 24px;
`;

const InvestorInfoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const SelectWrapper = styled.div`
  flex-grow: 1;
  max-width: 400px;
`;

const TabsContainer = styled.div`
  margin: 0 0 20px;
`;

const ReportDataContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  width: 100%;
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
