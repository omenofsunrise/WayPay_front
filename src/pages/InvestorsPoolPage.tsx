import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import styled from "styled-components";
import ExportButton from "../components/ui/Buttons/ExportButton";
import PageLayout from "../components/ui/Layouts/PageLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import type { Investor, InvestorReport } from "../api/types/investor";
import useInvestor from "../api/hooks/useInvestor";
import { formatDate, formatExactDate } from "../utils/dateFormatter";
import { formatPhoneHref } from "../utils/phoneUtils";
import { formatMoney, parseMoney } from "../utils/formatPrice";
import PhoneLink from "../components/ui/links/PhoneLink";
import investmentSvg from "../assets/ui/InvestorReport/investment.svg";
import paymentIncomeSvg from "../assets/ui/InvestorReport/PaymentIncome.svg";
import activeCreditsSvg from "../assets/ui/InvestorReport/credits.svg";
import investorIncomeScg from "../assets/ui/InvestorReport/investorIncome.svg";
import selfIncomeSvg from "../assets/ui/InvestorReport/selfIncome.svg";
import debtSvg from "../assets/ui/InvestorReport/debt.svg";
import commonIncomeSvg from "../assets/ui/InvestorReport/commonIncome.svg";
import shareSvg from "../assets/ui/InvestorReport/share.svg";
import balanceSvg from "../assets/ui/InvestorReport/balance.svg";
import allSelfIncomeSvg from "../assets/ui/InvestorReport/AllSelfIncome.svg";
import CustomTable, {
  type RowStyle,
  type TableAction,
} from "../components/ui/tables/CustomTable";
import { useInvestorPayout } from "../api/hooks/useInvestorPayout";
import type { InvestorPayout, PayoutSource } from "../api/types/investorPayout";
import PayoutModal from "../components/modal/PayoutModal";
import InvestorModal from "../components/modal/CrudInherited/InvestorModal";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import useCredit from "../api/hooks/useCredit";
import type { Credit } from "../api/types/credit";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import Pagination from "../components/ui/fields/CustomPagination";
import Tabs from "../components/ui/fields/Tabs";
import useInvestorPool from "../api/hooks/useInvestorPool";
import EditButton from "../components/ui/Buttons/EditButton";
import DeleteButton from "../components/ui/Buttons/DeleteButton";
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import GrayButton from "../components/ui/Buttons/GrayButton";
import type { InvestorPool, Reinvestment } from "../api/types/investorPool";
import BaseModal from "../components/modal/BASE/modalCRUBase";
import {
  InputContainer,
  InputLabel,
  InputRow,
} from "../components/Containers/InputComponents";
import CustomInput from "../components/ui/fields/CustomInput";
import CreatePoolModal from "../components/modal/CreatePoolModal";
import useInvestorContribution from "../api/hooks/useInvestorContribution";
import type { InvestorContribution } from "../api/types/investorContribution";
import InvestorSelect from "../components/ui/fields/InvestorSelect";
import CustomCalendar from "../components/ui/fields/CustomCalendar";
import { useAuth } from "../сontext/AuthContext";
import InvestorCashPositionModal from "../components/modal/InvestorCashPositionModal";

type InvestorsPoolPageProps = {
  enableReinvestments?: boolean;
  embedded?: boolean;
};

const InvestorsPoolPage = ({
  enableReinvestments = true,
  embedded = false,
}: InvestorsPoolPageProps) => {
  const { authInfo, hasRole } = useAuth();
  const isPoolV2 = authInfo?.employee?.poolV2 ?? false;
  const canManageCashPosition =
    hasRole("директор") || hasRole("суперадмин");
  const {
    getInvestors,
    getInvestorById,
    deleteInvestor,
    createInvestor,
    updateInvestor,
    addInvestment,
    updateInvestment,
    blockInvestor
  } = useInvestor();

  const {
    payouts,
    isLoading: isPayoutsLoading,
    fetchPoolPayouts,
    addPayout,
    removePayout,
    makePayoutAction,
  } = useInvestorPayout();

  const {
    data,
    getCredits,
    getCreditsByInvestorId,
    isLoading: isCreditsLoading,
  } = useCredit();

  const {
    getInvestorPools,
    createInvestorPool,
    updateInvestorPoolName,
    updateInvestorPoolPie,
    deleteInvestorPool,
    getInvestorPoolReport,
    reinvestInvestorPool,
    reportData,
    data: poolsData,
    getReinvestments,
  } = useInvestorPool();

  const {
    data: contributionsData,
    getProducts: getContributions,
    isLoading: isContributionsLoading,
    makeAction: makeContributionAction,
  } = useInvestorContribution();

  const [filteredCredits, setFilteredCredits] = useState<{
    items: Credit[];
    totalCount: number;
  } | null>(null);

  const [selectedInvestorForFilter, setSelectedInvestorForFilter] = useState<{
    id: number;
    name: string;
    type?: "investor" | "pool";
  } | null>(null);
  const [filteredContributions, setFilteredContributions] = useState<{
    items: InvestorContribution[];
    totalCount: number;
  } | null>(null);

  const [filteredPayouts, setFilteredPayouts] = useState<InvestorPayout[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [cashPositionInvestor, setCashPositionInvestor] =
    useState<Investor | null>(null);
  const [isCashPositionModalOpen, setIsCashPositionModalOpen] = useState(false);
  const [investorsData, setInvestorsData] = useState<any>(null);
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [currentInvestor, setCurrentInvestor] = useState<Investor | null>(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>("");
  const [selectedPoolId, setSelectedPoolId] = useState<string>("");
  const [report, setReport] = useState<InvestorReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewInvestorModalOpen, setIsViewInvestorModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "payouts" | "credits" | "investors" | "contributions" | "reinvestments"
  >("investors");
  const [dataTab, setDataTab] = useState<"general" | "expected" | "current">(
    "general"
  );
  const [creditsPage, setCreditsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [contributionsPage, setContributionsPage] = useState(1);
  const [investorsPage, setInvestorsPage] = useState(1);
  const [investorsCreditsPage, setInvestorsCreditsPage] = useState(1);
  const [isCreatePoolModalOpen, setIsCreatePoolModalOpen] = useState(false);
  const [isEditPoolModalOpen, setIsEditPoolModalOpen] = useState(false);
  const [newPoolName, setNewPoolName] = useState("");
  const pageSize = 10;
  const [pools, setPools] = useState<InvestorPool[]>([]);
  const [newPoolPie, setNewPoolPie] = useState<number>(0);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [selectedInvestorForPayout, setSelectedInvestorForPayout] =
    useState<Investor | null>(null);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentDate, setInvestmentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [isEditInvestmentModalOpen, setIsEditInvestmentModalOpen] =
    useState(false);
  const [selectedInvestmentForEdit, setSelectedInvestmentForEdit] = useState<{
    id: number;
    amount: number;
    date: string;
  } | null>(null);
  const [editInvestmentAmount, setEditInvestmentAmount] = useState("");
  const [editInvestmentDate, setEditInvestmentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedInvestorForInvestment, setSelectedInvestorForInvestment] =
    useState<Investor | null>(null);
  const [payoutSource, setPayoutSource] = useState<PayoutSource>("income");
  const [isInvestorCreditsModalOpen, setIsInvestorCreditsModalOpen] =
    useState(false);
  const [selectedInvestorForCredits, setSelectedInvestorForCredits] =
    useState<Investor | null>(null);
  const [investorCreditsData, setInvestorCreditsData] = useState<{
    items: Credit[];
    totalCount: number;
    totalDefferedIncome?: number;
  } | null>(null);
  const [isInvestorCreditsLoading, setIsInvestorCreditsLoading] =
    useState(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [reinvestmentsPage, setReinvestmentsPage] = useState(1);
  const [reinvestmentsData, setReinvestmentsData] = useState<{
    items: Reinvestment[];
    totalCount: number;
  } | null>(null);
  const [isReinvestmentsLoading, setIsReinvestmentsLoading] = useState(false);
  const [filteredReinvestments, setFilteredReinvestments] = useState<{
    items: Reinvestment[];
    totalCount: number;
  } | null>(null);

  useEffect(() => {
    if (selectedPoolId && activeTab === "credits") {
      setIsLoading(true);

      const fetchCredits = async () => {
        try {
          let creditsData;

          // Если выбран инвестор для фильтрации
          if (selectedInvestorForFilter?.id) {
            // Используем ID инвестора для фильтрации
            creditsData = await getCreditsByInvestorId(
              Number(selectedInvestorForFilter.id),
              creditsPage,
              pageSize
            );
            // Устанавливаем отфильтрованные данные
            setFilteredCredits(creditsData);
          } else {
            // Иначе загружаем все договоры пула
            creditsData = await getCredits({
              investorPoolId: Number(selectedPoolId),
              page: creditsPage,
              pageSize: pageSize,
            });
            // Очищаем отфильтрованные данные
            setFilteredCredits(null);
          }
        } catch (error) {
          console.error("Error fetching credits:", error);
          setFilteredCredits(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchCredits();
    }
  }, [
    selectedPoolId,
    creditsPage,
    activeTab,
    selectedInvestorForFilter,
    getCredits,
    getCreditsByInvestorId,
  ]);

  useEffect(() => {
    if (
      enableReinvestments &&
      selectedPoolId &&
      activeTab === "reinvestments"
    ) {
      const loadReinvestments = async () => {
        setIsReinvestmentsLoading(true);
        try {
          const reinvestments = await getReinvestments(
            Number(selectedPoolId),
            {
              page: reinvestmentsPage,
              pageSize: pageSize,
            },
            selectedInvestorForFilter?.id || 0 // 0 = все инвесторы
          );

          if (selectedInvestorForFilter?.id) {
            setFilteredReinvestments(reinvestments);
          } else {
            setReinvestmentsData(reinvestments);
            setFilteredReinvestments(null);
          }
        } catch (error) {
          console.error("Error fetching reinvestments:", error);
          setReinvestmentsData(null);
          setFilteredReinvestments(null);
        } finally {
          setIsReinvestmentsLoading(false);
        }
      };

      loadReinvestments();
    }
  }, [
    enableReinvestments,
    selectedPoolId,
    reinvestmentsPage,
    activeTab,
    selectedInvestorForFilter,
  ]);

  useEffect(() => {
    if (
      selectedPoolId &&
      activeTab === "contributions" &&
      selectedInvestorForFilter?.id
    ) {
      const fetchContributionsByInvestor = async () => {
        setIsLoading(true);
        try {
          const contributions = await getContributions(
            Number(selectedInvestorForFilter.id),
            Number(selectedPoolId),
            {
              page: contributionsPage,
              pageSize: pageSize,
            }
          );
          setFilteredContributions(contributions);
        } catch (error) {
          console.error("Error fetching contributions by investor:", error);
          setFilteredContributions(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchContributionsByInvestor();
    } else if (selectedPoolId && activeTab === "contributions") {
      setFilteredContributions(null);
      getContributions(undefined, Number(selectedPoolId), {
        page: contributionsPage,
        pageSize: pageSize,
      });
    }
  }, [
    selectedPoolId,
    contributionsPage,
    activeTab,
    selectedInvestorForFilter,
    getContributions,
  ]);

  const investorActions = (rowData: any[]): TableAction[] => {
    const [id] = rowData;
    const investor = investors.find((i) => i.id === Number(id));
    if (!investor) return [];

    const isBlocked = investor.isBlocked || false;
    const isOwnCash = investor.isCompanyPool || investor.isCompany || false;

    if (isPoolV2 && investor.isRemoved) return [];

    const actions: TableAction[] = [
      {
        label: "Редактировать",
        action: () => handleEditInvestor(investor),
        color: "#3B82F6",
      },
    ];

    if (isPoolV2 && !isOwnCash) {
      actions.push({
        label: "Управление кассой",
        action: () => {
          setCashPositionInvestor(investor);
          setIsCashPositionModalOpen(true);
        },
        color: "#007D88",
      });
    }

    if (isBlocked) {
      actions.push(
        {
          label: "Разблокировать инвестора",
          action: () => handleUnblockInvestor(investor),
          color: "#10B981",
        }
      );

      if (!isOwnCash) {
        actions.push({
          label: "Удалить",
          action: () => handleDeleteInvestor(investor),
          color: "#EF4444",
        });
      }
    } else {
      actions.push(
        {
          label: "Новая инвестиция",
          action: () => handleAddInvestment([investor.id.toString()]),
          color: "#10B981",
        },
        {
          label: "Выплатить",
          action: () => handlePayoutClick(investor),
          color: "#007D88",
        },
        {
          label: "Заблокировать инвестора",
          action: () => handleBlockInvestor(investor),
          color: "#F59E0B",
        }
      );

      if (!isOwnCash) {
        actions.push({
          label: "Удалить",
          action: () => handleDeleteInvestor(investor),
          color: "#EF4444",
        });
      }
    }

    return actions;
  };

  const handleContributionAction = async (
    id: number,
    action: "confirm" | "reject"
  ) => {
    try {
      await makeContributionAction(id, action);
      if (selectedPoolId) {
        if (selectedInvestorForFilter?.id) {
          // Если есть фильтр по инвестору, обновляем отфильтрованные данные
          const contributions = await getContributions(
            Number(selectedInvestorForFilter.id),
            Number(selectedPoolId),
            {
              page: contributionsPage,
              pageSize: pageSize,
            }
          );
          setFilteredContributions(contributions);
        } else {
          // Иначе обновляем общие данные
          getContributions(undefined, Number(selectedPoolId), {
            page: contributionsPage,
            pageSize: pageSize,
          });
        }
      }
    } catch (error) {
      console.error("Contribution action error:", error);
    }
  };

  const handleBlockInvestor = async (investor: Investor) => {
    if (isPoolV2 && investor.isRemoved) return;

    if (window.confirm('Вы уверены, что хотите заблокировать этого инвестора?')) {
      try {
        await blockInvestor(investor.id);
        await reloadData();
      } catch (error) {
        console.error('Error blocking investor:', error);
        alert('Произошла ошибка при блокировке инвестора');
      }
    }
  };

  const handleUnblockInvestor = async (investor: Investor) => {
    if (isPoolV2 && investor.isRemoved) return;

    if (window.confirm('Вы уверены, что хотите разблокировать этого инвестора?')) {
      try {
        await blockInvestor(investor.id);
        await reloadData();
      } catch (error) {
        console.error('Error unblocking investor:', error);
        alert('Произошла ошибка при разблокировке инвестора');
      }
    }
  };

  const handleEditInvestment = (contribution: InvestorContribution) => {
    let dateStr: string;
    if (contribution.date instanceof Date) {
      dateStr = contribution.date.toISOString().split("T")[0];
    } else {
      dateStr = new Date(contribution.date).toISOString().split("T")[0];
    }

    setSelectedInvestmentForEdit({
      id: contribution.id,
      amount: contribution.amount,
      date: dateStr,
    });
    setEditInvestmentAmount(contribution.amount.toString());
    setEditInvestmentDate(dateStr);
    setIsEditInvestmentModalOpen(true);
  };

  const handleUpdateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestmentForEdit) return;

    try {
      const amount = parseMoney(editInvestmentAmount);
      if (isNaN(amount) || amount <= 0) {
        alert("Пожалуйста, введите корректную сумму инвестиции");
        return;
      }

      const dateObj = new Date(editInvestmentDate);
      const today = new Date();

      const isToday = dateObj.toDateString() === today.toDateString();

      if (isToday) {
        dateObj.setHours(
          today.getHours(),
          today.getMinutes(),
          today.getSeconds(),
          today.getMilliseconds()
        );
      } else {
        dateObj.setHours(12, 0, 0, 0);
      }

      await updateInvestment(selectedInvestmentForEdit.id, amount, dateObj);

      setIsEditInvestmentModalOpen(false);
      setEditInvestmentAmount("");
      setEditInvestmentDate(today.toISOString().split("T")[0]);
      setSelectedInvestmentForEdit(null);

      await reloadData();
    } catch (err) {
      console.error("Ошибка при обновлении инвестиции:", err);
      alert("Произошла ошибка при обновлении инвестиции");
    }
  };

  useEffect(() => {
    if (selectedInvestorForCredits && isInvestorCreditsModalOpen) {
      const loadCredits = async () => {
        setIsInvestorCreditsLoading(true);
        try {
          const creditsData = await getCreditsByInvestorId(
            selectedInvestorForCredits.id,
            investorsCreditsPage,
            pageSize
          );
          setInvestorCreditsData(creditsData);
        } catch (error) {
          console.error("Error fetching investor credits:", error);
          setInvestorCreditsData(null);
        } finally {
          setIsInvestorCreditsLoading(false);
        }
      };

      loadCredits();
    }
  }, [investorsCreditsPage, isInvestorCreditsModalOpen]);

  useEffect(() => {
    if (selectedPoolId) {
      const fetchInvestors = async () => {
        try {
          const result = await getInvestors({
            poolId: Number(selectedPoolId),
            page: investorsPage,
            pageSize: pageSize,
          });
          if (result) {
            setInvestors(result.items);
            setInvestorsData(result);
          }
        } catch (error) {
          console.error("Error fetching investors:", error);
        }
      };
      fetchInvestors();
    }
  }, [selectedPoolId, getInvestors, investorsPage]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const pools = await getInvestorPools();
        if (pools?.items) {
          setPools(pools.items);
          if (pools.items.length > 0) {
            setSelectedPoolId(pools.items[0].id.toString());
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [getInvestorPools]);

  useEffect(() => {
    if (selectedPoolId) {
      const fetchReportData = async () => {
        setIsLoading(true);
        try {
          const reportData = await getInvestorPoolReport(
            Number(selectedPoolId)
          );
          setReport(reportData);
          fetchPoolPayouts(Number(selectedPoolId));
          getCredits({
            investorPoolId: Number(selectedPoolId),
            page: creditsPage,
            pageSize: pageSize,
          });
          getContributions(undefined, Number(selectedPoolId), {
            page: contributionsPage,
            pageSize: pageSize,
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchReportData();
    }
  }, [selectedPoolId, creditsPage, payoutsPage, contributionsPage]);

  useEffect(() => {
    if (selectedPoolId && activeTab === "investors") {
      const fetchInvestors = async () => {
        try {
          const result = await getInvestors({
            poolId: Number(selectedPoolId),
            page: investorsPage,
            pageSize: pageSize,
          });
          if (result) {
            setInvestors(result.items);
            setInvestorsData(result);
          }
        } catch (error) {
          console.error("Error fetching investors:", error);
        }
      };
      fetchInvestors();
    }
  }, [investorsPage, activeTab, selectedPoolId]);

  useEffect(() => {
    if (selectedPoolId && activeTab === "contributions") {
      getContributions(undefined, Number(selectedPoolId), {
        page: contributionsPage,
        pageSize: pageSize,
      });
    }
  }, [contributionsPage, activeTab, selectedPoolId]);

  useEffect(() => {
    if (selectedPoolId && activeTab === "payouts") {
      if (selectedInvestorForFilter?.id) {
        // Фильтруем выплаты по выбранному инвестору
        const filtered = payouts.filter(
          (payout) => payout.investorId === selectedInvestorForFilter.id
        );
        setFilteredPayouts(filtered);
      } else {
        // Показываем все выплаты пула
        setFilteredPayouts(payouts);
      }
    }
  }, [payouts, selectedInvestorForFilter, selectedPoolId, activeTab]);

  const handleInvestorDoubleClick = async (investor: Investor) => {
    setSelectedInvestorForCredits(investor);
    setIsInvestorCreditsLoading(true);
    setIsInvestorCreditsModalOpen(true);

    try {
      const creditsData = await getCreditsByInvestorId(
        investor.id,
        investorsCreditsPage,
        pageSize
      );

      setInvestorCreditsData(creditsData);
    } catch (error) {
      console.error("Error fetching investor credits:", error);
      setInvestorCreditsData(null);
    } finally {
      setIsInvestorCreditsLoading(false);
    }
  };

  const handleInvestorSelect = (investor: {
    id: number;
    nickname: string;
    fullName: string;
    phoneNumber: string;
    investorPie: number;
    investmentAmount: number;
    balance: number;
    type?: "investor" | "pool";
  }) => {
    setSelectedInvestorForFilter({
      id: investor.id,
      name: investor.nickname || investor.fullName,
      type: investor.type || "investor",
    });

    setSearchValue(investor.nickname || investor.fullName || "");

    // Сбрасываем пагинацию в зависимости от активной вкладки
    if (activeTab === "credits") {
      setCreditsPage(1);
    } else if (activeTab === "contributions") {
      setContributionsPage(1);
    } else if (activeTab === "payouts") {
      setPayoutsPage(1);
    }
  };

  const handleInvestorSelectChange = (value: string) => {
    if (!value || value === "") {
      setSelectedInvestorForFilter(null);
      setSearchValue("");

      // Сбрасываем фильтрацию в зависимости от активной вкладки
      if (activeTab === "credits") {
        setCreditsPage(1);
        if (selectedPoolId) {
          getCredits({
            investorPoolId: Number(selectedPoolId),
            page: 1,
            pageSize: pageSize,
          }).then((data) => {
            setFilteredCredits(null);
          });
        }
      } else if (activeTab === "payouts") {
        setPayoutsPage(1);
        setFilteredPayouts(payouts);
      } else if (activeTab === "contributions") {
        setContributionsPage(1);
      } else if (activeTab === "reinvestments") {
        setReinvestmentsPage(1);
      }
    } else {
      setSearchValue(value);
    }
  };

  const investorsTableData = investors.map((investor: Investor) => {
    const canManageInvestor = !(isPoolV2 && investor.isRemoved);
    const createDoubleClickCell = (content: React.ReactNode) => (
      <DoubleClickCell
        onDoubleClick={() => handleInvestorDoubleClick(investor)}
      >
        {content}
      </DoubleClickCell>
    );

    return [
      investor.id.toString(),
      createDoubleClickCell(investor.fullName ?? "-"),
      createDoubleClickCell(
        investor.phoneNumber ? (
          <PhoneLink
            href={formatPhoneHref(investor.phoneNumber)}
            onClick={(e) => e.stopPropagation()}
          >
            {investor.phoneNumber}
          </PhoneLink>
        ) : (
          "-"
        )
      ),
      createDoubleClickCell(
        investor.investmentAmount
          ? formatMoney(investor.investmentAmount.toString())
          : "-"
      ),
      createDoubleClickCell(
        investor.pieInPool !== null && investor.pieInPool !== undefined
          ? `${investor.pieInPool}%`
          : "-"
      ),
      createDoubleClickCell(
        investor.currentIncome
          ? formatMoney(investor.currentIncome.toString())
          : "-"
      ),
      canManageInvestor ? <EditButton onClick={() => handleEditInvestor(investor)} /> : null,
      canManageInvestor ? <DeleteButton onClick={() => handleDeleteInvestor(investor)} /> : null,
      canManageInvestor ? (
        <DarkCyanButton
          onClick={() => handleAddInvestment([investor.id.toString()])}
        >
          Новая инвестиция
        </DarkCyanButton>
      ) : null,
      canManageInvestor ? (
        <DarkCyanButton onClick={() => handlePayoutClick(investor)}>
          Выплатить
        </DarkCyanButton>
      ) : null,
    ];
  });

  const handleAddInvestment = (rowData: any[]) => {
    const investorId = Number(rowData[0]);
    const investor = investors.find((i) => i.id === investorId);

    if (investor && !(isPoolV2 && investor.isRemoved)) {
      setSelectedInvestorForInvestment(investor);
      setIsInvestmentModalOpen(true);
    }
  };

  const handleSubmitInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedInvestorForInvestment ||
      (isPoolV2 && selectedInvestorForInvestment.isRemoved)
    ) return;

    try {
      const amount = parseMoney(investmentAmount);
      if (isNaN(amount) || amount <= 0) {
        alert("Пожалуйста, введите корректную сумму инвестиции");
        return;
      }

      const dateObj = new Date(investmentDate);
      const today = new Date();

      const isToday = dateObj.toDateString() === today.toDateString();

      if (isToday) {
        dateObj.setHours(
          today.getHours(),
          today.getMinutes(),
          today.getSeconds(),
          today.getMilliseconds()
        );
        console.log("Сегодняшняя дата, время:", dateObj.toLocaleTimeString());
      } else {
        dateObj.setHours(12, 0, 0, 0);
        console.log("Не сегодняшняя дата, установлено 12:00");
      }

      await addInvestment(selectedInvestorForInvestment.id, amount, dateObj);

      setIsInvestmentModalOpen(false);
      setInvestmentAmount("");
      setInvestmentDate(today.toISOString().split("T")[0]);
      setSelectedInvestorForInvestment(null);

      await reloadData();
    } catch (err) {
      console.error("Ошибка при добавлении инвестиции:", err);
      alert("Произошла ошибка при добавлении инвестиции");
    }
  };

  const handlePayoutClick = (investor: Investor) => {
    if (isPoolV2 && investor.isRemoved) return;

    setSelectedInvestorForPayout(investor);
    setPayoutAmount("");
    setPayoutSource("income");
    setIsPayoutModalOpen(true);
  };

  const handleAddInvestor = () => {
    setCurrentInvestor(null);
    setIsInvestorModalOpen(true);
  };

  const handleReinvest = () => {
    if (
      window.confirm(
        "⚠️ ВНИМАНИЕ! ⚠️\n\n" +
          "ВСЕ ПЛАТЕЖИ СДЕЛАННЫЕ ДО РЕИНВЕСТИЦИИ НЕЛЬЗЯ БУДЕТ УДАЛИТЬ\n\n" +
          "Вы уверены, что хотите реинвестировать доходы ВСЕХ инвесторов?"
      )
    ) {
      reinvestInvestorPool(Number(selectedPoolId));
      reloadData();
    }
  };

  const handleEditInvestor = (investor: Investor) => {
    if (isPoolV2 && investor.isRemoved) return;

    setCurrentInvestor(investor);
    setIsInvestorModalOpen(true);
  };

  const handleDeleteInvestor = async (investor: Investor) => {
    if (isPoolV2 && investor.isRemoved) return;

    if (investor.isCompanyPool) {
      window.alert("Нельзя удалить свою компанию как инвестора");
      return;
    }
    if (window.confirm("Вы уверены, что хотите удалить этого инвестора?")) {
      try {
        await deleteInvestor(investor.id);
        await reloadData();
      } catch (error) {
        console.error("Error deleting investor:", error);
      }
    }
  };

  const handleInvestorSubmit = async (investorData: Partial<Investor>) => {
    if (isPoolV2 && currentInvestor?.isRemoved) return;

    try {
      if (currentInvestor) {
        const updatedInvestor = await updateInvestor(
          currentInvestor.id,
          investorData
        );
        if (updatedInvestor) {
          setInvestors(
            investors.map((inv) =>
              inv.id === currentInvestor.id ? updatedInvestor : inv
            )
          );
        }
      } else {
        const newInvestor = await createInvestor({
          ...investorData,
          poolId: Number(selectedPoolId),
        } as Omit<Investor, "id">);
        if (newInvestor) {
          setInvestors([...investors, newInvestor]);
        }
      }
      setIsInvestorModalOpen(false);

      await reloadData();
    } catch (error) {
      console.error("Error saving investor:", error);
    }
  };

  const reloadData = async () => {
    if (selectedPoolId) {
      try {
        const result = await getInvestors({
          poolId: Number(selectedPoolId),
          page: investorsPage,
          pageSize: pageSize,
        });
        if (result) {
          setInvestors(result.items);
          setInvestorsData(result);
        }

        const reportData = await getInvestorPoolReport(Number(selectedPoolId));
        setReport(reportData);

        await fetchPoolPayouts(Number(selectedPoolId));

        if (activeTab === "contributions") {
          getContributions(undefined, Number(selectedPoolId), {
            page: contributionsPage,
            pageSize: pageSize,
          });
        }

        if (enableReinvestments && activeTab === "reinvestments") {
          const reinvestments = await getReinvestments(
            Number(selectedPoolId),
            {
              page: reinvestmentsPage,
              pageSize: pageSize,
            },
            selectedInvestorForFilter?.id || 0
          );
          if (selectedInvestorForFilter?.id) {
            setFilteredReinvestments(reinvestments);
          } else {
            setReinvestmentsData(reinvestments);
          }
        }
      } catch (error) {
        console.error("Error reloading data:", error);
      }
    }
  };

  const contributionsTableData =
    (filteredContributions?.items || contributionsData?.items || []).map(
      (contribution: InvestorContribution) => [
        formatExactDate(new Date(contribution.date)),
        contribution.investorNickname || "-",
        formatMoney(contribution.amount.toString()),
        contribution.confirmed ? (
          <ConfirmedBadge>Подтверждено</ConfirmedBadge>
        ) : (
          <ActionButtons>
            <DarkCyanButton
              onClick={() =>
                handleContributionAction(contribution.id, "confirm")
              }
              disabled={isContributionsLoading}
            >
              Подтвердить
            </DarkCyanButton>
            <GrayButton
              onClick={() =>
                handleContributionAction(contribution.id, "reject")
              }
              disabled={isContributionsLoading}
            >
              Удалить
            </GrayButton>
            <EditButton onClick={() => handleEditInvestment(contribution)} />
          </ActionButtons>
        ),
      ]
    ) || [];

  const handleCreatePool = async () => {
    if (!newPoolName.trim()) return;

    try {
      const newPool = await createInvestorPool(
        {
          name: newPoolName,
          pie: newPoolPie,
        },
        Number(selectedInvestorId)
      );

      if (newPool) {
        setPools((prevPools) => [...prevPools, newPool]);
        setSelectedPoolId(newPool.id.toString());
      }

      setIsCreatePoolModalOpen(false);
      setNewPoolName("");
      setNewPoolPie(0);
    } catch (error) {
      console.error("Error creating pool:", error);
    }
  };

  const handleUpdatePoolName = async () => {
    if (!newPoolName.trim() || !selectedPoolId) return;

    try {
      await updateInvestorPoolName(Number(selectedPoolId), newPoolName);
      await updateInvestorPoolPie(Number(selectedPoolId), newPoolPie);

      setPools((prevPools) =>
        prevPools.map((pool) =>
          pool.id === Number(selectedPoolId)
            ? { ...pool, name: newPoolName, pie: newPoolPie }
            : pool
        )
      );

      setIsEditPoolModalOpen(false);
      setNewPoolName("");
      setNewPoolPie(0);
    } catch (error) {
      console.error("Error updating pool:", error);
    }
  };

  const handleDeletePool = async () => {
    if (!selectedPoolId) return;

    try {
      await deleteInvestorPool(Number(selectedPoolId));

      const updatedPools = pools.filter(
        (pool) => pool.id !== Number(selectedPoolId)
      );
      setPools(updatedPools);

      if (selectedPoolId === selectedPoolId.toString()) {
        if (updatedPools.length > 0) {
          setSelectedPoolId(updatedPools[0].id.toString());
        } else {
          setSelectedPoolId("");
          setInvestors([]);
          setReport(null);
        }
      }
    } catch (error) {
      console.error("Error deleting pool:", error);
    }
  };

  const generatePoolPdf = async (
    report: InvestorReport,
    pool: InvestorPool | undefined,
    payouts: InvestorPayout[],
    credits: Credit[]
  ) => {
    return new Promise<Blob>(async (resolve, reject) => {
      const pdfContainer = document.createElement("div");
      pdfContainer.style.position = "absolute";
      pdfContainer.style.left = "-9999px";
      pdfContainer.style.width = "800px";
      pdfContainer.style.padding = "20px";
      pdfContainer.style.fontFamily = "Arial, sans-serif";
      pdfContainer.style.backgroundColor = "rgba(249, 250, 250, 1)";
      document.body.appendChild(pdfContainer);

      const createCard = (icon: string, value: string, label: string) => `
                <div style="
                    background: rgba(255, 255, 255, 1);
                    border-radius: 10px;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    height: 100%;
                    flex: 1;
                    min-width: 200px;
                    margin-bottom: 16px;
                ">
                    <div style="
                        width: 50px;
                        height: 50px;
                        background: rgba(37, 203, 161, 0.1);
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 15px;
                    ">
                        <img src="${icon}" width="30" height="30" />
                    </div>
                    <div style="
                        font-size: 20px;
                        font-weight: 600;
                        color: #111827;
                        margin-bottom: 5px;
                    ">${value}</div>
                    <div style="
                        font-size: 14px;
                        color: #6B7280;
                    ">${label}</div>
                </div>
            `;

      pdfContainer.innerHTML = `
                <div style="
                    margin-bottom: 30px;
                    background: rgba(255, 255, 255, 1);
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                ">
                    <h1 style="
                        color: rgba(0, 125, 136, 1);
                        font-size: 24px;
                        margin-bottom: 5px;
                        border-bottom: 2px solid rgba(37, 203, 161, 1);
                        padding-bottom: 10px;
                    ">
                        Отчёт по пулу инвесторов: ${
                          pool?.name || "Неизвестный пул"
                        }
                    </h1>
                    <p style="
                        color: #6B7280;
                        font-size: 14px;
                        margin: 0;
                    ">
                        Дата формирования: ${formatDate(
                          new Date().toISOString()
                        )}
                    </p>
                </div>

                <div style="
                    margin-bottom: 30px;
                    background: rgba(255, 255, 255, 1);
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                ">
                    <h2 style="
                        color: rgba(0, 125, 136, 1);
                        font-size: 18px;
                        margin-top: 0;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                    ">
                        <span style="
                            display: inline-block;
                            width: 4px;
                            height: 20px;
                            background: rgba(37, 203, 161, 1);
                            margin-right: 10px;
                            border-radius: 2px;
                        "></span>
                        Финансовая информация пула
                    </h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        ${createCard(
                          investmentSvg,
                          formatMoney(report.investment.toString()),
                          "Общая инвестиция"
                        )}
                        
                        ${createCard(
                          activeCreditsSvg,
                          report.activeCreditsAmount.toString(),
                          "Незакрытые договоры"
                        )}
                        
                        ${createCard(
                          investorIncomeScg,
                          formatMoney(report.investorIncome.toString()),
                          "Доход инвесторов"
                        )}
                        
                        ${createCard(
                          selfIncomeSvg,
                          formatMoney(report.selfIncome.toString()),
                          "Собственный доход"
                        )}                            

                        ${createCard(
                          commonIncomeSvg,
                          formatMoney(report.allSelfIncome.toString()),
                          "Общий доход"
                        )}

                        ${createCard(
                          balanceSvg,
                          formatMoney(report.balance.toString()),
                          "Касса"
                        )}
                        
                        ${createCard(
                          debtSvg,
                          formatMoney(report.delinquencyAmount.toString()),
                          "Просрочки руб."
                        )}
                        ${createCard(
                          paymentIncomeSvg,
                          formatMoney(report.paymentIncome.toString()),
                          "Доходы по платежам в текущем месяце"
                        )}  
                    </div>
                </div>

                <div style="
                    background: rgba(255, 255, 255, 1);
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    margin-bottom: 30px;
                ">
                    <h2 style="
                        color: rgba(0, 125, 136, 1);
                        font-size: 18px;
                        margin-top: 0;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                    ">
                        <span style="
                            display: inline-block;
                            width: 4px;
                            height: 20px;
                            background: rgba(37, 203, 161, 1);
                            margin-right: 10px;
                            border-radius: 2px;
                        "></span>
                        История выплат пула
                    </h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: rgba(0, 125, 136, 1); color: white;">
                                <th style="padding: 12px; text-align: left; border-radius: 6px 0 0 0;">Дата выплаты</th>
                                <th style="padding: 12px; text-align: left;">Выплатил</th>
                                <th style="padding: 12px; text-align: right; border-radius: 0 6px 0 0;">Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payouts
                              .map(
                                (payout, index) => `
                                <tr style="border-bottom: 1px solid #E5E7EB; background: ${
                                  index % 2 === 0
                                    ? "rgba(255, 255, 255, 1)"
                                    : "rgba(249, 250, 250, 1)"
                                }">
                                    <td style="padding: 12px; color: #374151;">${formatDate(
                                      payout.payoutDate
                                    )}</td>
                                    <td style="padding: 12px; color: #374151;">${
                                      payout.employeeFullName
                                    }</td>
                                    <td style="padding: 12px; text-align: right; color: #374151; font-weight: 500;">${formatMoney(
                                      payout.amount.toString()
                                    )}</td>
                                </tr>
                            `
                              )
                              .join("")}
                            ${
                              payouts.length === 0
                                ? `
                                <tr>
                                    <td colspan="3" style="padding: 15px; text-align: center; color: #9CA3AF; background: rgba(255, 255, 255, 1);">
                                        Не было выплат
                                    </td>
                                </tr>
                            `
                                : ""
                            }
                        </tbody>
                    </table>
                </div>

                <div style="
                    padding: 15px;
                    text-align: center;
                    color: #6B7280;
                    font-size: 12px;
                    background: rgba(255, 255, 255, 1);
                    border-radius: 12px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                ">
                    <p>© ${new Date().getFullYear()} WayPay. Все права защищены.</p>
                </div>
            `;

      try {
        const canvas = await html2canvas(pdfContainer, {
          scale: 4,
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: pdfContainer.offsetWidth,
          height: pdfContainer.scrollHeight,
          windowWidth: pdfContainer.scrollWidth,
          windowHeight: pdfContainer.scrollHeight,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.85);
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        document.body.removeChild(pdfContainer);

        const pdfBlob = pdf.output("blob");
        resolve(pdfBlob);
      } catch (error) {
        document.body.removeChild(pdfContainer);
        reject(error);
      }
    });
  };

  const exportPoolToPdf = async () => {
    if (!report || !selectedPoolId) return;

    try {
      const currentPool = pools.find(
        (pool) => pool.id === Number(selectedPoolId)
      );
      const credits = data?.items || [];

      const pdfBlob = await generatePoolPdf(
        report,
        currentPool,
        payouts,
        credits
      );
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const downloadLink = document.createElement("a");
      downloadLink.href = pdfUrl;
      downloadLink.download = `Отчет_пула_${
        currentPool?.name || "Без_названия"
      }_${formatDate(new Date().toISOString())}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
    } catch (error) {
      console.error("Ошибка при генерации PDF:", error);
      alert("Произошла ошибка при генерации PDF");
    }
  };

  const investorsRowStyles = investors.reduce(
    (styles, investor, index) => {
      if (isPoolV2 && investor.isRemoved) {
        styles[index] = {
          backgroundColor: "#E5E7EB",
          color: "#374151",
          fontWeight: "normal",
        };
      } else if (investor.isBlocked) {
        styles[index] = {
          backgroundColor: "#FFEBEE",
          color: "black",
          fontWeight: "normal",
        };
      }
      return styles;
    },
    {} as Record<number, RowStyle>
  );

  const handleShareClick = async () => {
    if (!report || !selectedPoolId) return;

    try {
      const currentPool = pools.find(
        (pool) => pool.id === Number(selectedPoolId)
      );
      const credits = data?.items || [];

      const pdfBlob = await generatePoolPdf(
        report,
        currentPool,
        payouts,
        credits
      );

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
          files: [
            new File(
              [pdfBlob],
              `Отчет_пула_${currentPool?.name || "Без_названия"}.pdf`,
              { type: "application/pdf" }
            ),
          ],
        })
      ) {
        await navigator.share({
          title: `Отчёт пула ${currentPool?.name || "Без названия"}`,
          text: `Финансовый отчет по пулу инвесторов ${currentPool?.name}`,
          files: [
            new File(
              [pdfBlob],
              `Отчет_пула_${currentPool?.name || "Без_названия"}.pdf`,
              { type: "application/pdf" }
            ),
          ],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Отчёт пула ${currentPool?.name || "Без названия"}`,
          text: `Финансовый отчет по пулу инвесторов ${
            currentPool?.name
          }. Инвестиция: ${formatMoney(
            report.investment.toString()
          )}, Общий доход: ${formatMoney(report.allSelfIncome.toString())}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Ссылка скопирована в буфер обмена");
      }
    } catch (error) {
      console.error("Ошибка при попытке поделиться:", error);
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Ссылка скопирована в буфер обмена");
      } catch (err) {
        console.error("Не удалось скопировать ссылку:", err);
        prompt(
          "Скопируйте эту ссылку для общего доступа:",
          window.location.href
        );
      }
    }
  };

  const handlePayoutSubmit = async () => {
    if (
      !selectedInvestorForPayout ||
      !payoutAmount ||
      !report ||
      (isPoolV2 && selectedInvestorForPayout.isRemoved)
    ) return;

    const numericAmount = Number(payoutAmount.replace(/\D/g, ""));

    try {
      await addPayout({
        investorId: selectedInvestorForPayout.id,
        amount: numericAmount,
        payoutSource: payoutSource,
      });
      setIsPayoutModalOpen(false);
      setPayoutAmount("");

      await reloadData();
    } catch (error) {
      console.error("Payout error:", error);
    }
  };

  const getMaxPayoutAmount = (investor: Investor | null) => {
    if (!investor) return 0;

    if (investor.isBlocked) {
      return report?.balance || 0;
    }

    return investor.currentIncome || 0;
  };

  const getCurrentIncome = (investor: Investor | null) => {
    if (!investor) return 0;
    return investor.currentIncome || 0;
  };

  const tabs = [
    { id: "investors", label: "Инвесторы" },
    { id: "payouts", label: "История выплат" },
    { id: "credits", label: "Договоры" },
    { id: "contributions", label: "Инвестиции" },
    ...(enableReinvestments
      ? [{ id: "reinvestments", label: "Реинвестиции" }]
      : []),
  ];

  const dataTabs = [
    { id: "general", label: "Общие данные" },
    { id: "expected", label: "Ожидаемый доход" },
    { id: "current", label: "Текущий доход" },
  ];

  const handleClearFilter = () => {
    setSelectedInvestorForFilter(null);
    setSearchValue("");

    // Сбрасываем пагинацию в зависимости от активной вкладки
    if (activeTab === "credits") {
      setCreditsPage(1);
      if (selectedPoolId) {
        getCredits({
          investorPoolId: Number(selectedPoolId),
          page: 1,
          pageSize: pageSize,
        }).then((data) => {
          setFilteredCredits(null);
        });
      }
    } else if (activeTab === "payouts") {
      setPayoutsPage(1);
      setFilteredPayouts(payouts); // Сбрасываем фильтр выплат
    } else if (activeTab === "contributions") {
      setContributionsPage(1);
    } else if (activeTab === "reinvestments") {
      setReinvestmentsPage(1);
    }
  };

  const getReinvestmentTableData = () => {
    const items =
      filteredReinvestments?.items || reinvestmentsData?.items || [];

    return items.map((reinvestment: Reinvestment) => [
      reinvestment.id.toString(),
      formatExactDate(new Date(reinvestment.date)),
      reinvestment.investorNickname,
      formatMoney(reinvestment.amount.toString()),
    ]);
  };

  const handleDeletePayout = async (id: number) => {
    try {
      await removePayout(id);
      if (selectedInvestorId) {
        const updatedReport = await getInvestorPoolReport(
          Number(selectedInvestorId)
        );
        setReport(updatedReport);
      }
    } catch (error) {
      console.error("Delete payout error:", error);
    }
  };

  const payoutTableData = payouts.map((payout: InvestorPayout) => [
    formatDate(payout.payoutDate),
    payout.employeeFullName,
    payout.investorFullName,
    formatMoney(payout.amount.toString()),
    <DeleteButton onClick={() => handleDeletePayout(payout.id)}></DeleteButton>,
  ]);

  const creditsTableData = (filteredCredits?.items || data?.items || []).map(
    (credit: Credit) => {
      return [
        credit.id,
        formatDate(credit.creditDate.toString()),
        credit.clientFullName,
        credit.clientPhone ? (
          <PhoneLink
            href={formatPhoneHref(credit.clientPhone)}
            onClick={(e) => e.stopPropagation()}
          >
            {credit.clientPhone}
          </PhoneLink>
        ) : (
          "-"
        ),
        formatMoney(credit.accured.toString()),
        formatMoney(credit.payed.toString()),
        formatMoney(credit.rest.toString()),
        formatMoney(credit.debt.toString()),
        formatMoney(credit.defferedIncome.toString()),
      ];
    }
  );

  // Для собственной кассы пула в окне договоров показываем дополнительный
  // столбец с полным ожидаемым (отложенным) доходом по договору — до деления
  // на доли пула/инвестора.
  const showOwnCashExpectedIncome = Boolean(
    selectedInvestorForCredits?.isCompanyPool
  );

  const investorCreditsTableData = (() => {
    let totalExpectedIncome = 0;

    const rows =
      investorCreditsData?.items.map((credit: Credit, index: number) => {
        // Используем долю, зафиксированную на дату оформления договора.
        // Если бэкенд вернул историческое значение — берём его,
        // иначе fallback на текущую долю инвестора.
        const pieInPoolForCredit =
          credit.investorPieInPool !== undefined &&
          credit.investorPieInPool !== null
            ? credit.investorPieInPool
            : selectedInvestorForCredits?.pieInPool || 0;

        const expectedIncome =
          (((credit.defferedIncome * pieInPoolForCredit) / 100) *
            (selectedInvestorForCredits?.investorPie || 0)) /
          100;

        totalExpectedIncome += expectedIncome;

        const row: ReactNode[] = [
          credit.id,
          formatDate(credit.creditDate.toString()),
          credit.clientFullName,
          credit.clientPhone ? (
            <PhoneLink
              href={formatPhoneHref(credit.clientPhone)}
              onClick={(e) => e.stopPropagation()}
            >
              {credit.clientPhone}
            </PhoneLink>
          ) : (
            "-"
          ),
          formatMoney(expectedIncome.toString()),
        ];

        if (showOwnCashExpectedIncome) {
          row.push(formatMoney((credit.defferedIncome || 0).toString()));
        }

        return row;
      }) || [];

    if (rows.length > 0) {
      // Итого считается как сумма по историческим долям каждого договора
      const totalRow: ReactNode[] = [
        "",
        "",
        "",
        "Итого:",
        formatMoney(totalExpectedIncome.toString()),
      ];

      if (showOwnCashExpectedIncome) {
        totalRow.push(
          formatMoney((investorCreditsData.totalDefferedIncome || 0).toString())
        );
      }

      rows.push(totalRow);
    }

    return rows;
  })();

  const rowStyles = (filteredCredits?.items || data?.items || []).reduce(
    (styles, credit, index) => {
      const style: RowStyle = {};

      if (credit.debt > 0) {
        style.backgroundColor = "rgba(232, 216, 216, 1)";
      }

      if (!credit.isActive) {
        style.backgroundColor = "rgba(81, 213, 180, 1)";
        style.color = "black";
      }

      if (Object.keys(style).length > 0) {
        styles[index] = style;
      }

      return styles;
    },
    {} as { [key: number]: RowStyle }
  );

  const renderGeneralCards = () => (
    <>
      <ReportCard>
        <IconContainer>
          <Icon src={investmentSvg} alt="Investment" />
        </IconContainer>
        <ReportLabel>Инвестиции</ReportLabel>
        <ReportValue>{formatMoney(report.investment.toString())}</ReportValue>
      </ReportCard>

      <ReportCard>
        <IconContainer>
          <Icon src={activeCreditsSvg} alt="Active credits" />
        </IconContainer>
        <ReportLabel>Незакрытые договоры</ReportLabel>
        <ReportValue>{report.activeCreditsAmount}</ReportValue>
      </ReportCard>

      <ReportCard>
        <IconContainer>
          <Icon src={balanceSvg} alt="Balance" />
        </IconContainer>
        <ReportLabel>Касса</ReportLabel>
        <ReportValue>{formatMoney(report.balance.toString())}</ReportValue>
      </ReportCard>

      <ReportCard>
        <IconContainer>
          <Icon src={debtSvg} alt="Debt" />
        </IconContainer>
        <ReportLabel>Просрочки</ReportLabel>
        <ReportValue $tone="warning">
          {formatMoney(report.delinquencyAmount.toString())}
        </ReportValue>
      </ReportCard>
    </>
  );

  const renderExpectedIncomeCards = () => (
    <>
      <ReportCard>
        <IconContainer>
          <Icon src={commonIncomeSvg} alt="Total income" />
        </IconContainer>
        <ReportLabel>Общий доход</ReportLabel>
        <ReportValue>
          {formatMoney(report.allSelfIncome.toString())}
        </ReportValue>
      </ReportCard>
    </>
  );

  const renderCurrentIncomeCards = () => (
    <>
      <ReportCard>
        <IconContainer>
          <Icon src={investorIncomeScg} alt="Investor income" />
        </IconContainer>
        <ReportLabel>Текущий доход пула</ReportLabel>
        <ReportValue>
          {formatMoney(report.investorPaymentIncome?.toString() || "0")}
        </ReportValue>
      </ReportCard>

      <ReportCard>
        <IconContainer>
          <Icon src={selfIncomeSvg} alt="Self income" />
        </IconContainer>
        <ReportLabel>Текущий собственный доход</ReportLabel>
        <ReportValue>
          {formatMoney(report.selfPaymentIncome?.toString() || "0")}
        </ReportValue>
      </ReportCard>

      <ReportCard>
        <IconContainer>
          <Icon src={paymentIncomeSvg} alt="paymentIncome" />
        </IconContainer>
        <ReportLabel>Текущий доход</ReportLabel>
        <ReportValue>
          {formatMoney(report.paymentIncome.toString())}
        </ReportValue>
      </ReportCard>
    </>
  );

  const currentPool = pools.find(
    (pool) => pool.id === Number(selectedPoolId)
  );
  const poolInitials = (currentPool?.name || "П")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const openEditPoolModal = () => {
    setNewPoolName(currentPool?.name || "");
    setNewPoolPie(currentPool?.pie || 0);
    setIsEditPoolModalOpen(true);
  };

  return (
    <PageLayout>
      {!embedded && (
        <TitleField>
          <CustomTitle>Пулы инвесторов</CustomTitle>
          <ExportButton onClick={exportPoolToPdf} />
          <ExportButton
            children={"Поделиться"}
            icon={<ShareIcon />}
            onClick={handleShareClick}
            disabled={!report}
          />
        </TitleField>
      )}

      <ContentContainer>
        <PoolTabsContainer>
          {currentPool && (
            <>
              <PoolBreadcrumb>
                <span>Пулы инвесторов</span>
                <b>/</b>
                <strong>{currentPool.name}</strong>
              </PoolBreadcrumb>

              <PoolIdentityRow>
                <PoolAvatar>{poolInitials}</PoolAvatar>
                <PoolIdentity>
                  <PoolName>{currentPool.name}</PoolName>
                  <PoolCreated>
                    Создан {formatDate(currentPool.createdAt.toString())}
                  </PoolCreated>
                </PoolIdentity>

                <PoolSwitcher
                  value=""
                  aria-label="Сменить пул"
                  onChange={(event) => {
                    setSelectedPoolId(event.target.value);
                    setSelectedInvestorForFilter(null);
                    setSearchValue("");
                  }}
                >
                  <option value="" disabled>
                    Сменить пул
                  </option>
                  {pools.map((pool) => (
                    <option key={pool.id} value={pool.id.toString()}>
                      {pool.name}
                    </option>
                  ))}
                </PoolSwitcher>

                <PoolHeaderActions>
                  <PoolSecondaryButton type="button" onClick={openEditPoolModal}>
                    <PoolButtonIcon viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                    </PoolButtonIcon>
                    Редактировать
                  </PoolSecondaryButton>
                  <PoolPrimaryButton type="button" onClick={handleAddInvestor}>
                    <span aria-hidden="true">+</span>
                    Добавить инвестора
                  </PoolPrimaryButton>
                  <PoolMoreMenu>
                    <PoolMoreButton aria-label="Другие действия">
                      <span />
                      <span />
                      <span />
                    </PoolMoreButton>
                    <PoolMoreDropdown>
                      <button
                        type="button"
                        onClick={() => setIsCreatePoolModalOpen(true)}
                      >
                        Создать пул
                      </button>
                      <button type="button" onClick={exportPoolToPdf}>
                        Экспортировать отчёт
                      </button>
                      <button type="button" onClick={handleShareClick}>
                        Поделиться
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => {
                          if (window.confirm(`Удалить пул "${currentPool.name}"?`)) {
                            handleDeletePool();
                          }
                        }}
                      >
                        Удалить пул
                      </button>
                    </PoolMoreDropdown>
                  </PoolMoreMenu>
                </PoolHeaderActions>
              </PoolIdentityRow>
            </>
          )}

          {report && (
            <>
              <TabsContainer>
                <Tabs<"general" | "expected" | "current">
                  tabs={dataTabs}
                  activeTab={dataTab}
                  onChange={(tabId) => setDataTab(tabId)}
                />
              </TabsContainer>

              <ReportDataContainer>
                {dataTab === "general" && renderGeneralCards()}
                {dataTab === "expected" && renderExpectedIncomeCards()}
                {dataTab === "current" && renderCurrentIncomeCards()}
              </ReportDataContainer>
            </>
          )}
        </PoolTabsContainer>

        <TabsHeaderContainer>
          <TabsContainer style={{ marginBottom: 0, flex: 1 }}>
            <Tabs<
              | "payouts"
              | "credits"
              | "investors"
              | "contributions"
              | "reinvestments"
            >
              tabs={tabs}
              activeTab={activeTab}
              onChange={(tabId) => {
                setActiveTab(tabId);
                // При переключении вкладок сбрасываем фильтр
                if (tabId !== "credits") {
                  setSelectedInvestorForFilter(null);
                  setSearchValue("");
                }
              }}
              addButton={
                activeTab === "investors" &&
                pools.length > 0 &&
                enableReinvestments ? (
                  <DarkCyanButton
                    children="Реинвестировать"
                    onClick={handleReinvest}
                  />
                ) : null
              }
            />
          </TabsContainer>

          <SearchContainer>
            {(activeTab === "credits" ||
              activeTab === "contributions" ||
              activeTab === "payouts" ||
              activeTab === "reinvestments") && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <InvestorSelect
                  value={searchValue}
                  poolId={Number.parseInt(selectedPoolId)}
                  onChange={handleInvestorSelectChange}
                  onInvestorSelect={handleInvestorSelect}
                  placeholder="Инвесторы"
                  customPlaceholder=""
                  disabled={!selectedPoolId}
                  hasError={false}
                />
              </div>
            )}
          </SearchContainer>
        </TabsHeaderContainer>

        {activeTab === "payouts" && (
          <>
            <CustomTable
              columns={[
                { name: "Дата выплаты", isSortable: true },
                { name: "Выплатил", align: "left" },
                { name: "Инвестор", align: "left" },
                { name: "Выплата, руб", isSortable: true, align: "left" },
                { name: "", align: "center" },
              ]}
              data={filteredPayouts.map((payout: InvestorPayout) => [
                formatDate(payout.payoutDate),
                payout.employeeFullName,
                payout.investorFullName,
                formatMoney(payout.amount.toString()),
                <DeleteButton
                  onClick={() => handleDeletePayout(payout.id)}
                ></DeleteButton>,
              ])}
              isLoading={isPayoutsLoading}
            />
            <PaginationLayout>
              <CountInfoTitle total={filteredPayouts?.length || 0} />
              <Pagination
                total={filteredPayouts?.length || 0}
                current={payoutsPage}
                onChange={(page) => setPayoutsPage(page)}
                itemsPerPage={pageSize}
              />
            </PaginationLayout>
          </>
        )}

        {enableReinvestments && activeTab === "reinvestments" && (
          <>
            <CustomTable
              columns={[
                { name: "ID", isSortable: true },
                { name: "Дата и время реинвестиции", isSortable: true },
                { name: "Инвестор", align: "left" },
                { name: "Сумма", align: "right", isSortable: true },
              ]}
              data={getReinvestmentTableData()}
              isLoading={isReinvestmentsLoading}
            />
            <PaginationLayout>
              <CountInfoTitle
                total={
                  selectedInvestorForFilter
                    ? filteredReinvestments?.totalCount || 0
                    : reinvestmentsData?.totalCount || 0
                }
              />
              <Pagination
                total={
                  selectedInvestorForFilter
                    ? filteredReinvestments?.totalCount || 0
                    : reinvestmentsData?.totalCount || 0
                }
                current={reinvestmentsPage}
                onChange={(page) => setReinvestmentsPage(page)}
                itemsPerPage={pageSize}
              />
            </PaginationLayout>
          </>
        )}

        {activeTab === "credits" && (
          <>
            {isCreditsLoading ? (
              <div>Загрузка договоров...</div>
            ) : (
              <CustomTable
                columns={[
                  { name: "№" },
                  { name: "Дата договора" },
                  { name: "Клиент", align: "left" },
                  { name: "Телефон", align: "left" },
                  { name: "Начислено", align: "left" },
                  { name: "Уплачено", align: "left" },
                  { name: "Остаток", align: "left" },
                  { name: "Долг", align: "left" },
                  { name: "Отложенный доход", align: "left" },
                ]}
                data={creditsTableData}
                isLoading={isCreditsLoading}
                rowStyles={rowStyles}
              />
            )}
            <PaginationLayout>
              <CountInfoTitle total={data?.totalCount || 0} />
              <Pagination
                total={data?.totalCount || 0}
                current={creditsPage}
                onChange={(page) => setCreditsPage(page)}
                itemsPerPage={pageSize}
              />
            </PaginationLayout>
          </>
        )}

        {activeTab === "investors" && (
          <>
            <CustomTable
              columns={[
                { name: "id", isHidden: true },
                { name: "ФИО", align: "left" },
                { name: "Телефон", align: "left" },
                { name: "Инвестиция", align: "right" },
                { name: "Доля", align: "right" },
                { name: "Текущий доход", align: "right" },
                { name: "", align: "center" },
                { name: "", align: "center" },
                { name: "", align: "center" },
              ]}
              data={investorsTableData}
              contextMenuActions={investorActions}
              rowStyles={investorsRowStyles}
              isLoading={isLoading}
            />
            <PaginationLayout>
              <CountInfoTitle total={investorsData?.totalCount || 0} />
              <Pagination
                total={investorsData?.totalCount || 0}
                current={investorsPage}
                onChange={(page) => setInvestorsPage(page)}
                itemsPerPage={pageSize}
              />
            </PaginationLayout>
            <InvestorModal
              mode={currentInvestor ? "edit-pool" : "create-pool"}
              isOpen={isInvestorModalOpen}
              onClose={() => setIsInvestorModalOpen(false)}
              onSubmit={handleInvestorSubmit}
              initialData={
                currentInvestor
                  ? {
                      id: currentInvestor.id,
                      nickname: currentInvestor.nickname,
                      fullName: currentInvestor.fullName,
                      phoneNumber: currentInvestor.phoneNumber,
                      investorPie: currentInvestor.investorPie,
                      investmentAmount: currentInvestor.investmentAmount,
                      balance: currentInvestor.balance,
                      isCompany: currentInvestor.isCompany,
                      isBlocked: currentInvestor.isBlocked,
                      poolId: currentInvestor.poolId,
                    }
                  : undefined
              }
            />
          </>
        )}

        {activeTab === "contributions" && (
          <>
            <CustomTable
              columns={[
                { name: "Дата и время", isSortable: true },
                { name: "Инвестор", align: "left" },
                { name: "Сумма", align: "right" },
                { name: "Действия", align: "center" },
              ]}
              data={contributionsTableData}
              isLoading={isContributionsLoading}
            />
            <PaginationLayout>
              <CountInfoTitle
                total={
                  selectedInvestorForFilter
                    ? filteredContributions?.totalCount || 0
                    : contributionsData?.totalCount || 0
                }
              />
              <Pagination
                total={
                  selectedInvestorForFilter
                    ? filteredContributions?.totalCount || 0
                    : contributionsData?.totalCount || 0
                }
                current={contributionsPage}
                onChange={(page) => setContributionsPage(page)}
                itemsPerPage={pageSize}
              />
            </PaginationLayout>
          </>
        )}

        {isEditInvestmentModalOpen && selectedInvestmentForEdit && (
          <BaseModal
            title={`Редактирование инвестиции`}
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

        {isInvestorCreditsModalOpen && selectedInvestorForCredits && (
          <BaseModal
            title={`Договоры инвестора ${selectedInvestorForCredits?.fullName}`}
            onClose={() => {
              setIsInvestorCreditsModalOpen(false);
              setSelectedInvestorForCredits(null);
              setInvestorCreditsData(null);
              setInvestorsCreditsPage(1);
            }}
            onCancel={() => {
              setIsInvestorCreditsModalOpen(false);
              setSelectedInvestorForCredits(null);
              setInvestorCreditsData(null);
              setInvestorsCreditsPage(1);
            }}
            onSave={() => setIsInvestorCreditsModalOpen(false)}
            isSaveDisabled={false}
            mode="view"
            width="90vw"
          >
            {isInvestorCreditsLoading ? (
              <LoadingMessage>Загрузка...</LoadingMessage>
            ) : !investorCreditsData ||
              investorCreditsData.items.length === 0 ? (
              <NoDataMessage>У инвестора нет договоров</NoDataMessage>
            ) : (
              <CreditsTableContainer>
                <CustomTable
                  columns={[
                    { name: "№" },
                    { name: "Дата договора" },
                    { name: "Клиент", align: "left" },
                    { name: "Телефон", align: "left" },
                    { name: "Отложенный доход инвестора", align: "left" },
                    ...(showOwnCashExpectedIncome
                      ? [
                          {
                            name: "Ожидаемый доход от инвестора",
                            align: "left" as const,
                          },
                        ]
                      : []),
                  ]}
                  hasTotalsRow={true}
                  data={investorCreditsTableData}
                  isLoading={false}
                />
                <PaginationLayout>
                  <CountInfoTitle
                    total={investorCreditsData?.totalCount || 0}
                  />
                  <Pagination
                    total={investorCreditsData?.totalCount || 0}
                    current={investorsCreditsPage}
                    onChange={(page) => {
                      setInvestorsCreditsPage(page);
                      if (selectedInvestorForCredits) {
                        getCreditsByInvestorId(
                          selectedInvestorForCredits.id,
                          page,
                          pageSize
                        ).then((data) => setInvestorCreditsData(data));
                      }
                    }}
                    itemsPerPage={pageSize}
                  />
                </PaginationLayout>
              </CreditsTableContainer>
            )}
          </BaseModal>
        )}

        <PayoutModal
          isOpen={isPayoutModalOpen}
          onClose={() => setIsPayoutModalOpen(false)}
          amount={payoutAmount}
          onAmountChange={setPayoutAmount}
          onSubmit={handlePayoutSubmit}
          maxAmount={getMaxPayoutAmount(selectedInvestorForPayout)}
          balance={report?.balance || 0}
          isLoading={isPayoutsLoading}
          currentIncome={getCurrentIncome(selectedInvestorForPayout)}
          poolSelfIncome={
            selectedInvestorForPayout?.isCompanyPool
              ? report?.selfPaymentIncome || 0
              : null
          }
          investment={selectedInvestorForPayout?.investmentAmount || 0}
          firstContribution={
            selectedInvestorForPayout?.firstContribution || null
          }
          payoutSource={payoutSource}
          onPayoutSourceChange={setPayoutSource}
          isCompany={false}
        />

        <InvestorModal
          mode="view"
          isOpen={isViewInvestorModalOpen}
          onClose={() => setIsViewInvestorModalOpen(false)}
          onSubmit={async () => false}
          initialData={
            currentInvestor
              ? {
                  id: currentInvestor.id,
                  nickname: currentInvestor.nickname,
                  fullName: currentInvestor.fullName,
                  phoneNumber: currentInvestor.phoneNumber,
                  investorPie: currentInvestor.investorPie,
                  investmentAmount: currentInvestor.investmentAmount,
                  balance: currentInvestor.balance,
                  isCompany: currentInvestor.isCompany,
                  isBlocked: currentInvestor.isBlocked,
                  poolId: currentInvestor.poolId,
                }
              : undefined
          }
        />

        <InvestorCashPositionModal
          isOpen={isCashPositionModalOpen}
          investor={cashPositionInvestor}
          canEdit={canManageCashPosition}
          onClose={() => {
            setIsCashPositionModalOpen(false);
            setCashPositionInvestor(null);
          }}
          onChanged={reloadData}
        />

        <CreatePoolModal
          isOpen={isCreatePoolModalOpen}
          onClose={() => setIsCreatePoolModalOpen(false)}
          title="Создать новый пул"
          value={newPoolName}
          pieValue={newPoolPie}
          onChange={setNewPoolName}
          onPieChange={setNewPoolPie}
          onSubmit={handleCreatePool}
          submitText="Создать"
          showPieField={true}
        />

        <CreatePoolModal
          isOpen={isEditPoolModalOpen}
          onClose={() => setIsEditPoolModalOpen(false)}
          title="Редактировать пул"
          value={newPoolName}
          pieValue={newPoolPie}
          onChange={setNewPoolName}
          onPieChange={setNewPoolPie}
          onSubmit={handleUpdatePoolName}
          submitText="Сохранить"
          showPieField={true}
        />

        {isInvestmentModalOpen && selectedInvestorForInvestment && (
          <BaseModal
            title={`Добавить инвестицию для ${
              selectedInvestorForInvestment.fullName ||
              selectedInvestorForInvestment.nickname
            }`}
            onClose={() => setIsInvestmentModalOpen(false)}
            onCancel={() => setIsInvestmentModalOpen(false)}
            onSave={handleSubmitInvestment}
            isSaveDisabled={
              !investmentAmount ||
              isNaN(parseFloat(investmentAmount)) ||
              parseFloat(investmentAmount) <= 0
            }
            mode="edit"
          >
            <form onSubmit={handleSubmitInvestment} style={{ padding: "20px" }}>
              {enableReinvestments && (
                <div
                  style={{
                    backgroundColor: "#fff3cd",
                    color: "#856404",
                    padding: "12px 16px",
                    borderRadius: "4px",
                    marginBottom: "20px",
                    border: "1px solid #ffeeba",
                    fontSize: "14px",
                  }}
                >
                  ⚠️ Рекомендуется сначала сделать реинвестицию, а затем
                  добавлять новую инвестицию
                </div>
              )}

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
                    value={
                      investmentDate
                        ? new Date(investmentDate).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(dateString) => setInvestmentDate(dateString)}
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

const InvestorCreditsContainer = styled.div`
  max-height: 70vh;
  overflow-y: auto;
`;

const InvestorInfo = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #dee2e6;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #495057;
  min-width: 140px;
`;

const InfoValue = styled.span`
  color: #212529;
  font-size: 15px;
`;

const CreditsTableContainer = styled.div`
  overflow: hidden;
  margin-top: 20px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-size: 16px;
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-size: 16px;
  background: #f8f9fa;
  border-radius: 8px;
`;

const CreditsCount = styled.div`
  padding: 16px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  font-weight: 600;
  color: #495057;
  text-align: right;
`;

const PoolTabsContainer = styled.div`
  margin-bottom: 24px;
`;

const PoolBreadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #64748b;
  font-size: 13px;
  text-align: left;

  b {
    font-weight: 400;
  }

  strong {
    color: #253247;
    font-weight: 500;
  }
`;

const PoolIdentityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  text-align: left;
`;

const PoolAvatar = styled.div`
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  border-radius: 50%;
  background: #ddf5f5;
  color: #087d88;
  font-size: 18px;
  font-weight: 700;
`;

const PoolIdentity = styled.div`
  min-width: 145px;
`;

const PoolName = styled.div`
  overflow: hidden;
  color: #172033;
  font-size: 21px;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PoolCreated = styled.div`
  margin-top: 4px;
  color: #718096;
  font-size: 12px;
`;

const PoolSwitcher = styled.select`
  height: 38px;
  min-width: 126px;
  margin-left: 4px;
  padding: 0 34px 0 13px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #253247;
  font-size: 13px;
  cursor: pointer;
`;

const PoolHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
`;

const PoolButtonIcon = styled.svg`
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

const PoolSecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 38px;
  padding: 0 16px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #253247;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    border-color: #007d88;
    color: #007d88;
  }
`;

const PoolPrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 38px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: #007d88;
  color: #fff;
  font-size: 13px;
  cursor: pointer;

  span {
    font-size: 22px;
    font-weight: 300;
    line-height: 1;
  }

  &:hover {
    background: #0096a3;
  }
`;

const PoolMoreMenu = styled.details`
  position: relative;
`;

const PoolMoreButton = styled.summary`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #475569;
  cursor: pointer;
  list-style: none;

  &::-webkit-details-marker {
    display: none;
  }

  span {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: currentColor;
  }
`;

const PoolMoreDropdown = styled.div`
  position: absolute;
  z-index: 30;
  top: calc(100% + 6px);
  right: 0;
  min-width: 190px;
  padding: 6px;
  border: 1px solid #e3e9ef;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14);

  button {
    display: block;
    width: 100%;
    padding: 9px 10px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: #253247;
    font-size: 13px;
    text-align: left;
    cursor: pointer;
  }

  button:hover {
    background: #f0f9fa;
    color: #007d88;
  }

  button.danger {
    color: #dc2626;
  }
`;

const TabsContainer = styled.div`
  margin: 16px 0 12px;
`;

const ContentContainer = styled.div`
  margin-top: 0px;
  padding: 0;
`;

const ReportDataContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  width: 100%;
  margin-bottom: 0;
`;

const ReportCard = styled.div`
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 10px;
  align-items: center;
  min-height: 74px;
  padding: 12px 14px;
  background-color: #fff;
  border: 1px solid #e3e9ef;
  border-radius: 10px;
`;

const IconContainer = styled.div`
  grid-column: 1;
  grid-row: 1 / span 2;
  display: grid;
  place-items: center;
`;

const Icon = styled.img`
  width: 34px;
  height: 34px;
`;

const ReportLabel = styled.span`
  grid-column: 2;
  grid-row: 1;
  align-self: end;
  color: #718096;
  font-size: 12px;
  line-height: 1.3;
  text-align: left;
`;

const ReportValue = styled.span<{ $tone?: "warning" }>`
  grid-column: 2;
  grid-row: 2;
  align-self: start;
  margin-top: 3px;
  font-size: 20px;
  font-weight: 700;
  color: ${({ $tone }) => ($tone === "warning" ? "#d97706" : "#111827")};
  text-align: left;
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
  font-weight: 500;
`;

const ShareIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.00001 2.50216C8.99998 1.91022 9.20982 1.33743 9.59224 0.885601C9.97466 0.43377 10.5049 0.132162 11.0887 0.0343785C11.6725 -0.0634049 12.2721 0.0489702 12.7809 0.351533C13.2896 0.654095 13.6747 1.12725 13.8675 1.6869C14.0604 2.24655 14.0485 2.85645 13.8341 3.4082C13.6197 3.95995 13.2167 4.41782 12.6965 4.70044C12.1764 4.98305 11.5729 5.0721 10.9934 4.95176C10.4138 4.83141 9.89563 4.50948 9.53101 4.04316L4.91502 6.35116C5.02912 6.77597 5.02912 7.22336 4.91502 7.64816L9.53302 9.95816C9.91574 9.47098 10.4657 9.14326 11.0764 9.03854C11.687 8.93382 12.3147 9.05956 12.8379 9.39139C13.3611 9.72321 13.7424 10.2375 13.908 10.8345C14.0736 11.4315 14.0116 12.0687 13.734 12.6226C13.4564 13.1765 12.9831 13.6076 12.4057 13.8323C11.8284 14.057 11.1882 14.0594 10.6092 13.8389C10.0302 13.6184 9.55374 13.1908 9.27213 12.6389C8.99051 12.0871 8.92383 11.4504 9.08502 10.8522L4.46702 8.54216C4.14602 8.95136 3.7054 9.25027 3.20652 9.39725C2.70765 9.54423 2.17535 9.53196 1.68377 9.36216C1.19219 9.19236 0.765807 8.87348 0.464002 8.44992C0.162198 8.02637 0 7.51924 0 6.99916C0 6.47908 0.162198 5.97195 0.464002 5.5484C0.765807 5.12485 1.19219 4.80596 1.68377 4.63616C2.17535 4.46636 2.70765 4.45409 3.20652 4.60107C3.7054 4.74805 4.14602 5.04696 4.46702 5.45616L9.08502 3.14916C9.02854 2.93813 8.99996 2.72062 9.00001 2.50216ZM11.502 1.00016C11.1038 1.00016 10.7219 1.15835 10.4403 1.43994C10.1587 1.72153 10.0005 2.10344 10.0005 2.50166C10.0005 2.89988 10.1587 3.2818 10.4403 3.56338C10.7219 3.84497 11.1038 4.00316 11.502 4.00316C11.9002 4.00316 12.2821 3.84497 12.5637 3.56338C12.8453 3.2818 13.0035 2.89988 13.0035 2.50166C13.0035 2.10344 12.8453 1.72153 12.5637 1.43994C12.2821 1.15835 11.9002 1.00016 11.502 1.00016ZM11.5 10.0002C11.1022 10.0002 10.7207 10.1582 10.4394 10.4395C10.1581 10.7208 10 11.1023 10 11.5002C10 11.898 10.1581 12.2795 10.4394 12.5608C10.7207 12.8421 11.1022 13.0002 11.5 13.0002C11.8978 13.0002 12.2794 12.8421 12.5607 12.5608C12.842 12.2795 13 11.898 13 11.5002C13 11.1023 12.842 10.7208 12.5607 10.4395C12.2794 10.1582 11.8978 10.0002 11.5 10.0002ZM1.00002 7.00016C1.00002 7.19714 1.03881 7.3922 1.1142 7.57419C1.18958 7.75617 1.30007 7.92153 1.43936 8.06082C1.57864 8.20011 1.744 8.3106 1.92599 8.38598C2.10798 8.46136 2.30303 8.50016 2.50002 8.50016C2.697 8.50016 2.89205 8.46136 3.07404 8.38598C3.25603 8.3106 3.42139 8.20011 3.56068 8.06082C3.69996 7.92153 3.81045 7.75617 3.88583 7.57419C3.96122 7.3922 4.00002 7.19714 4.00002 7.00016C4.00002 6.60234 3.84198 6.22081 3.56068 5.9395C3.27937 5.6582 2.89784 5.50016 2.50002 5.50016C2.10219 5.50016 1.72066 5.6582 1.43936 5.9395C1.15805 6.22081 1.00002 6.60234 1.00002 7.00016Z"
      fill="black"
    />
  </svg>
);

const DoubleClickCell = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 0;

  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }

  a {
    text-decoration: none;
    color: inherit;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const TabsHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin: 30px 0 20px;
  width: 100%;
`;

const SearchContainer = styled.div`
  min-width: 300px;
  max-width: 400px;
  width: 100%;
  display: flex;
  justify-content: flex-end;

  @media (max-width: 768px) {
    min-width: 200px;
    max-width: 300px;
  }
`;

export default InvestorsPoolPage;
