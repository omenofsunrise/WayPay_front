import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import ExportButton from "../components/ui/Buttons/ExportButton";
import PageLayout from "../components/ui/Layouts/PageLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import type { Investor, InvestorReport } from "../api/types/investor";
import useInvestor from "../api/hooks/useInvestor";
import CustomSelect from "../components/ui/fields/CustomSelect";
import { formatDate } from "../utils/dateFormatter";
import { formatMoney, parseMoney } from "../utils/formatPrice";
import { formatPhoneHref } from "../utils/phoneUtils";
import { PHONE_LINK_COLOR } from "../components/ui/links/PhoneLink";
import ModalInfoTitle from "../components/ui/Text/ModalInfoTitle";
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
} from "../components/ui/tables/CustomTable";
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
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
import { useAuth } from "../сontext/AuthContext";
import useInvestorContribution from "../api/hooks/useInvestorContribution";
import type { InvestorContribution } from "../api/types/investorContribution";
import GrayButton from "../components/ui/Buttons/GrayButton";
import { getInvestorPayouts } from "../api/services/investorPayoutService";
import { FaLock, FaUnlock } from "react-icons/fa";
import BaseModal from "../components/modal/BASE/modalCRUBase";
import {
  InputContainer,
  InputLabel,
  InputRow,
} from "../components/Containers/InputComponents";
import CustomInput from "../components/ui/fields/CustomInput";
import CustomCalendar from "../components/ui/fields/CustomCalendar";
import type { DeletedInvestorInfo } from "../api/types/deletedInvestor";
import { deleteInvestorPayout } from "../api/services/investorPayoutService";
import investorContributionService from "../api/services/investorContributionService";

const DELETED_OPTION_VALUE = "deleted";

type InvestorReportPageProps = {
  initialInvestorId?: number | "deleted" | null;
  embedded?: boolean;
  onBack?: () => void;
  autoOpenPayout?: boolean;
  onPayoutOpened?: () => void;
};

const InvestorReportPage = ({
  initialInvestorId,
  embedded = false,
  onBack,
  autoOpenPayout = false,
  onPayoutOpened,
}: InvestorReportPageProps) => {
  const {
    getInvestors,
    currentInvestor,
    getInvestorById,
    getInvestorReport,
    updateInvestment,
    updateInvestor,
    getDeletedInfo,
  } = useInvestor();
  const {
    payouts,
    isLoading: isPayoutsLoading,
    fetchPayouts,
    addPayout,
    removePayout,
    makePayoutAction,
  } = useInvestorPayout();
  const {
    investorCredits,
    getCreditsByInvestorId,
    isLoading: isCreditsLoading,
  } = useCredit();
  const { hasRole } = useAuth();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>(
    initialInvestorId === "deleted"
      ? DELETED_OPTION_VALUE
      : initialInvestorId
        ? initialInvestorId.toString()
        : ""
  );
  const [report, setReport] = useState<InvestorReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [payoutSource, setPayoutSource] = useState<PayoutSource>("income");
  const [isViewInvestorModalOpen, setIsViewInvestorModalOpen] = useState(false);

  const [dataTab, setDataTab] = useState<"general" | "expected" | "current">(
    "general"
  );
  const [operationsTab, setOperationsTab] = useState<
    "payouts" | "credits" | "contributions"
  >("payouts");

  const {
    data: contributionsData,
    isLoading: isContributionsLoading,
    getProducts: getContributions,
    makeAction: makeContributionAction,
  } = useInvestorContribution();

  // Состояния для редактирования инвестиции
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

  const [contributionsPage, setContributionsPage] = useState(1);
  const [creditsPage, setCreditsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const pageSize = 5;

  const [deletedInfo, setDeletedInfo] = useState<DeletedInvestorInfo | null>(
    null
  );
  const [isDeletedLoading, setIsDeletedLoading] = useState(false);
  const [deletedPayoutsPage, setDeletedPayoutsPage] = useState(1);
  const [deletedContributionsPage, setDeletedContributionsPage] = useState(1);
  const [deletedOperationsTab, setDeletedOperationsTab] = useState<
    "payouts" | "contributions"
  >("payouts");

  const isDeletedView = selectedInvestorId === DELETED_OPTION_VALUE;

  useEffect(() => {
    if (initialInvestorId) {
      setSelectedInvestorId(
        initialInvestorId === "deleted"
          ? DELETED_OPTION_VALUE
          : initialInvestorId.toString()
      );
    }
  }, [initialInvestorId]);

  const fetchDeletedInfo = useCallback(async () => {
    setIsDeletedLoading(true);
    try {
      const result = await getDeletedInfo();
      setDeletedInfo(result);
    } finally {
      setIsDeletedLoading(false);
    }
  }, [getDeletedInfo]);

  useEffect(() => {
    const fetchInvestors = async () => {
      setIsLoading(true);
      try {
        const result = await getInvestors();
        if (result?.items) {
          setInvestors(result.items);
          if (!initialInvestorId) {
            const companyInvestor = result.items.find(
              (investor) => investor.isCompany
            );
            if (companyInvestor) {
              setSelectedInvestorId(companyInvestor.id.toString());
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvestors();
  }, [getInvestors, initialInvestorId]);

  const handleUpdateInvestor = async (investorData: Partial<Investor>) => {
    if (!currentInvestor) return false;
    const updated = await updateInvestor(currentInvestor.id, investorData);
    if (!updated) return false;
    await getInvestorById(currentInvestor.id);
    setIsViewInvestorModalOpen(false);
    return true;
  };

  const isSuperUser = hasRole("директор") || hasRole("суперадмин");

  useEffect(() => {
    if (autoOpenPayout && report && currentInvestor) {
      setIsPayoutModalOpen(true);
      onPayoutOpened?.();
    }
  }, [autoOpenPayout, currentInvestor, onPayoutOpened, report]);

  useEffect(() => {
    if (!selectedInvestorId) return;
    if (isDeletedView) {
      setReport(null);
      fetchDeletedInfo();
      return;
    }
    const fetchReportData = async () => {
      setIsLoading(true);
      try {
        await getInvestorById(Number(selectedInvestorId));
        const reportData = await getInvestorReport(Number(selectedInvestorId));
        setReport(reportData);
        fetchPayouts(Number(selectedInvestorId));
        getCreditsByInvestorId(
          Number(selectedInvestorId),
          creditsPage,
          pageSize
        );

        getContributions(Number(selectedInvestorId), undefined, {
          page: contributionsPage,
          pageSize: pageSize,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchReportData();
  }, [
    selectedInvestorId,
    creditsPage,
    payoutsPage,
    contributionsPage,
    getContributions,
    isDeletedView,
    fetchDeletedInfo,
  ]);

  // Обработчик редактирования инвестиции
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

  // Обработчик обновления инвестиции
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

      // Перезагружаем данные
      if (selectedInvestorId) {
        getContributions(Number(selectedInvestorId), undefined, {
          page: contributionsPage,
          pageSize: pageSize,
        });
        const updatedReport = await getInvestorReport(
          Number(selectedInvestorId)
        );
        setReport(updatedReport);
      }
    } catch (err) {
      console.error("Ошибка при обновлении инвестиции:", err);
      alert("Произошла ошибка при обновлении инвестиции");
    }
  };

  const handleInvestorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedInvestorId(e.target.value);
    setCreditsPage(1);
    setPayoutsPage(1);
    setContributionsPage(1);
    setDeletedPayoutsPage(1);
    setDeletedContributionsPage(1);
    setDeletedOperationsTab("payouts");
  };

  const handleDeleteDeletedPayout = async (id: number) => {
    try {
      await deleteInvestorPayout(id);
      await fetchDeletedInfo();
    } catch (error) {
      console.error("Delete deleted payout error:", error);
    }
  };

  const handleDeleteDeletedContribution = async (id: number) => {
    try {
      await investorContributionService.makeAction(id, "reject");
      await fetchDeletedInfo();
    } catch (error) {
      console.error("Delete deleted contribution error:", error);
    }
  };

  const handleContributionAction = async (
    id: number,
    action: "confirm" | "reject"
  ) => {
    try {
      await makeContributionAction(id, action);
      if (selectedInvestorId) {
        getContributions(Number(selectedInvestorId), undefined, {
          page: contributionsPage,
          pageSize: pageSize,
        });
      }
    } catch (error) {
      console.error("Contribution action error:", error);
    }
  };

  const handlePayoutAction = async (
    id: number,
    action: "confirm" | "reject"
  ) => {
    try {
      await makePayoutAction(id, action);
      if (selectedInvestorId) {
        getInvestorPayouts(Number(selectedInvestorId));
      }
    } catch (error) {
      console.error("Contribution action error:", error);
    }
  };

  const contributionsTableData =
    contributionsData?.items.map((contribution: InvestorContribution) => [
      formatDate(contribution.date.toString()),
      formatMoney(contribution.amount.toString()),
      <ContributionActions>
        {!contribution.confirmed && (
          <DarkCyanButton
            onClick={() => handleEditInvestment(contribution)}
            disabled={isContributionsLoading}
          >
            Редактирование
          </DarkCyanButton>
        )}
        <GrayButton
          style={{ marginRight: 0 }}
          onClick={() => handleContributionAction(contribution.id, "reject")}
          disabled={isContributionsLoading}
        >
          Удалить
        </GrayButton>
        <LockToggleButton
          type="button"
          onClick={() =>
            !contribution.confirmed &&
            handleContributionAction(contribution.id, "confirm")
          }
          disabled={isContributionsLoading || contribution.confirmed}
          $locked={contribution.confirmed}
          title={
            contribution.confirmed
              ? "Инвестиция закрыта — редактирование запрещено"
              : "Закрыть инвестицию (после этого её нельзя будет редактировать)"
          }
          aria-label={contribution.confirmed ? "Закрыто" : "Закрыть инвестицию"}
        >
          {contribution.confirmed ? <FaLock /> : <FaUnlock />}
        </LockToggleButton>
      </ContributionActions>,
    ]) || [];

  const generatePdf = async (
    report: InvestorReport,
    currentInvestor: Investor | null,
    payouts: InvestorPayout[]
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
                        Отчёт для инвестора
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
                        margin-bottom: 15px;
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
                        Информация об инвесторе
                    </h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <p style="margin: 5px 0; color: #374151;"><strong>Псевдоним:</strong> ${
                              currentInvestor?.nickname || "Не указан"
                            }</p>
                            <p style="margin: 5px 0; color: #374151;"><strong>Телефон:</strong> ${
                              currentInvestor?.phoneNumber
                                ? `<a href="${formatPhoneHref(
                                    currentInvestor.phoneNumber
                                  )}" style="color:${PHONE_LINK_COLOR};text-decoration:none;">${
                                    currentInvestor.phoneNumber
                                  }</a>`
                                : "Не указан"
                            }</p>
                        </div>
                        <div>
                            <p style="margin: 5px 0; color: #374151;"><strong>Статус:</strong> 
                                <span style="color: ${
                                  currentInvestor?.isBlocked
                                    ? "#EF4444"
                                    : "rgba(37, 203, 161, 1)"
                                }">
                                    ${
                                      currentInvestor?.isBlocked
                                        ? "Заблокирован"
                                        : "Активен"
                                    }
                                </span>
                            </p>
                            <p style="margin: 5px 0; color: #374151;"><strong>Дата регистрации инвестора:</strong> ${formatDate(
                              report.createdAt
                            )}</p>
                        </div>
                    </div>
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
                        Финансовая информация
                    </h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        ${createCard(
                          investmentSvg,
                          formatMoney(report.investment.toString()),
                          "Инвестиция"
                        )}
                        
                        ${createCard(
                          activeCreditsSvg,
                          report.activeCreditsAmount.toString(),
                          "Незакрытые договоры"
                        )}
                        
                        ${
                          report.isCompany
                            ? createCard(
                                commonIncomeSvg,
                                formatMoney(
                                  (
                                    report.investorIncome + report.selfIncome
                                  ).toString()
                                ),
                                "Доход компании"
                              )
                            : createCard(
                                shareSvg,
                                currentInvestor?.investorPie.toString() + "%",
                                "Доля инвестора"
                              )
                        }
                        
                        ${
                          !report.isCompany
                            ? createCard(
                                investorIncomeScg,
                                formatMoney(report.investorIncome.toString()),
                                "Доход инвестора"
                              )
                            : ""
                        }
                        
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
                          allSelfIncomeSvg,
                          formatMoney(report.allSelfIncome.toString()),
                          "Доход от инвесторов."
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
                        История выплат
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

  const exportToPdf = async (
    report: InvestorReport,
    currentInvestor: Investor | null,
    payouts: InvestorPayout[]
  ) => {
    try {
      const pdfBlob = await generatePdf(report, currentInvestor, payouts);
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const downloadLink = document.createElement("a");
      downloadLink.href = pdfUrl;
      downloadLink.download = `Отчет_инвестора_${
        currentInvestor?.nickname || currentInvestor?.fullName || "Без_названия"
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

  const handleShareClick = async () => {
    if (!report || !currentInvestor) return;

    try {
      const pdfBlob = await generatePdf(report, currentInvestor, payouts);

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
          files: [
            new File(
              [pdfBlob],
              `Отчет_инвестора_${
                currentInvestor.nickname || currentInvestor.fullName
              }.pdf`,
              { type: "application/pdf" }
            ),
          ],
        })
      ) {
        await navigator.share({
          title: `Отчёт инвестора ${
            currentInvestor.nickname || currentInvestor.fullName
          }`,
          text: `Финансовый отчет по инвестору ${
            currentInvestor.nickname || currentInvestor.fullName
          }`,
          files: [
            new File(
              [pdfBlob],
              `Отчет_инвестора_${
                currentInvestor.nickname || currentInvestor.fullName
              }.pdf`,
              { type: "application/pdf" }
            ),
          ],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Отчёт инвестора ${
            currentInvestor.nickname || currentInvestor.fullName
          }`,
          text: `Финансовый отчет по инвестору ${
            currentInvestor.nickname || currentInvestor.fullName
          }. Инвестиция: ${formatMoney(
            report.investment.toString()
          )}, Доход: ${formatMoney(report.investorIncome.toString())}`,
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
    if (!selectedInvestorId || !payoutAmount || !currentInvestor || !report)
      return;

    const numericAmount = Number(payoutAmount.replace(/\D/g, ""));
    let maxAllowedAmount = 0;

    maxAllowedAmount = report.balance;

    if (numericAmount > maxAllowedAmount) {
      alert(
        `Нельзя выплатить больше чем ${formatMoney(
          maxAllowedAmount.toString()
        )}`
      );
      return;
    }

    try {
      await addPayout({
        investorId: Number(selectedInvestorId),
        amount: numericAmount,
        payoutSource: payoutSource,
      });
      setIsPayoutModalOpen(false);
      setPayoutAmount("");

      const updatedReport = await getInvestorReport(Number(selectedInvestorId));
      setReport(updatedReport);
    } catch (error) {
      console.error("Payout error:", error);
    }
  };

  const handleDeletePayout = async (id: number) => {
    try {
      await removePayout(id);
      if (selectedInvestorId) {
        const updatedReport = await getInvestorReport(
          Number(selectedInvestorId)
        );
        setReport(updatedReport);
      }
    } catch (error) {
      console.error("Delete payout error:", error);
    }
  };

  const investorOptions = [
    ...investors.map((investor) => ({
      value: investor.id.toString(),
      label: investor.nickname || `Investor ${investor.id}`,
    })),
    { value: DELETED_OPTION_VALUE, label: "Удалённые" },
  ];

  const deletedPayoutsPaged = (deletedInfo?.payouts ?? []).slice(
    (deletedPayoutsPage - 1) * pageSize,
    deletedPayoutsPage * pageSize
  );

  const deletedContributionsPaged = (deletedInfo?.contributions ?? []).slice(
    (deletedContributionsPage - 1) * pageSize,
    deletedContributionsPage * pageSize
  );

  const deletedPayoutsTableData = deletedPayoutsPaged.map((payout) => [
    formatDate(payout.payoutDate),
    payout.investor?.nickname ||
      payout.investor?.fullName ||
      `Investor ${payout.investorId}`,
    formatMoney(payout.amount.toString()),
    <ActionButtons>
      <GrayButton
        onClick={() => handleDeleteDeletedPayout(payout.id)}
        disabled={isDeletedLoading}
      >
        Удалить
      </GrayButton>
    </ActionButtons>,
  ]);

  const deletedContributionsTableData = deletedContributionsPaged.map(
    (contribution) => [
      formatDate(contribution.date),
      contribution.investor?.nickname ||
        contribution.investor?.fullName ||
        `Investor ${contribution.investorId}`,
      formatMoney(contribution.amount.toString()),
      <ActionButtons>
        <GrayButton
          onClick={() => handleDeleteDeletedContribution(contribution.id)}
          disabled={isDeletedLoading}
        >
          Удалить
        </GrayButton>
      </ActionButtons>,
    ]
  );

  const payoutTableData = payouts.map((payout: InvestorPayout) => [
    formatDate(payout.payoutDate),
    payout.employeeFullName,
    formatMoney(payout.amount.toString()),
    payout.confirmed ? (
      <ConfirmedBadge></ConfirmedBadge>
    ) : (
      <ActionButtons>
        <DarkCyanButton
          style={{ margin: "0 auto" }}
          onClick={() => handlePayoutAction(payout.id, "confirm")}
          disabled={isContributionsLoading}
        >
          Подтвердить
        </DarkCyanButton>
        <GrayButton
          onClick={() => handlePayoutAction(payout.id, "reject")}
          disabled={isContributionsLoading}
        >
          Удалить
        </GrayButton>
      </ActionButtons>
    ),
  ]);

  const creditsTableData =
    investorCredits?.items.map((credit: Credit) => {
      const hasDebt = credit.debt > 0;
      const isActive = credit.isActive;

      return [
        formatDate(credit.creditDate.toString()),
        credit.clientFullName,
        credit.clientPhone,
        formatMoney(credit.accured.toString()),
        formatMoney(credit.payed.toString()),
        formatMoney(credit.rest.toString()),
        formatMoney(credit.debt.toString()),
        hasDebt,
        isActive,
      ];
    }) || [];

  const rowStyles = investorCredits?.items.reduce((styles, credit, index) => {
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
  }, {} as { [key: number]: RowStyle });

  const renderGeneralCards = () => (
    <>
      <ReportCard>
        <IconContainer>
          <Icon src={investmentSvg} alt="Investment" />
        </IconContainer>
        <ReportValue>{formatMoney(report.investment.toString())}</ReportValue>
        <ReportLabel>Инвестиции</ReportLabel>
      </ReportCard>

      <ReportCard>
        <IconContainer>
          <Icon src={activeCreditsSvg} alt="Active credits" />
        </IconContainer>
        <ReportValue>{report.activeCreditsAmount}</ReportValue>
        <ReportLabel>Незакрытые договоры</ReportLabel>
      </ReportCard>

      {report.isCompany ? (
        <></>
      ) : (
        <>
          <ReportCard>
            <IconContainer>
              <Icon src={shareSvg} alt="Total income" />
            </IconContainer>
            <ReportValue>
              {currentInvestor?.investorPie.toString() + "%"}
            </ReportValue>
            <ReportLabel>Доля инвестора</ReportLabel>
          </ReportCard>
        </>
      )}

      <ReportCard>
        <IconContainer>
          <Icon src={balanceSvg} alt="Balance" />
        </IconContainer>
        <ReportValue>{formatMoney(report.balance.toString())}</ReportValue>
        <ReportLabel>Касса</ReportLabel>
      </ReportCard>

      <ReportCard>
        <IconContainer>
          <Icon src={debtSvg} alt="Debt" />
        </IconContainer>
        <ReportValue $tone="warning">
          {formatMoney(report.delinquencyAmount.toString())}
        </ReportValue>
        <ReportLabel>Просрочки</ReportLabel>
      </ReportCard>
    </>
  );

  const renderExpectedIncomeCards = () => (
    <>
      {report.isCompany ? (
        <>
          <ReportCard>
            <IconContainer>
              <Icon src={commonIncomeSvg} alt="Company income" />
            </IconContainer>
            <ReportValue>
              {formatMoney(report.allSelfIncome.toString())}
            </ReportValue>
            <ReportLabel>Доход компании</ReportLabel>
          </ReportCard>

          <ReportCard>
            <IconContainer>
              <Icon src={allSelfIncomeSvg} alt="allSelfIncome" />
            </IconContainer>
            <ReportValue>
              {formatMoney(report.investorIncome.toString())}
            </ReportValue>
            <ReportLabel>Доход от инвесторов</ReportLabel>
          </ReportCard>
        </>
      ) : (
        <>
          <ReportCard>
            <IconContainer>
              <Icon src={investorIncomeScg} alt="Investor income" />
            </IconContainer>
            <ReportValue>
              {formatMoney(report.investorIncome.toString())}
            </ReportValue>
            <ReportLabel>Доход инвестора</ReportLabel>
          </ReportCard>

          <ReportCard>
            <IconContainer>
              <Icon src={selfIncomeSvg} alt="Self income" />
            </IconContainer>
            <ReportValue>
              {formatMoney(report.selfIncome.toString())}
            </ReportValue>
            <ReportLabel>Собственный доход</ReportLabel>
          </ReportCard>
        </>
      )}

      {!report.isCompany && (
        <ReportCard>
          <IconContainer>
            <Icon src={commonIncomeSvg} alt="Total income" />
          </IconContainer>
          <ReportValue>
            {formatMoney(
              (report.investorIncome + report.selfIncome).toString()
            )}
          </ReportValue>
          <ReportLabel>Общий доход</ReportLabel>
        </ReportCard>
      )}
    </>
  );

  const renderCurrentIncomeCards = () => (
    <>
      {report.isCompany ? (
        <>
          <ReportCard>
            <IconContainer>
              <Icon src={paymentIncomeSvg} alt="paymentIncome" />
            </IconContainer>
            <ReportValue>
              {formatMoney(report.paymentIncome.toString())}
            </ReportValue>
            <ReportLabel>Текущий доход </ReportLabel>
          </ReportCard>

          <ReportCard>
            <IconContainer>
              <Icon src={allSelfIncomeSvg} alt="allSelfIncome" />
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
              <Icon src={investorIncomeScg} alt="Investor income" />
            </IconContainer>
            <ReportValue>
              {formatMoney(report.investorPaymentIncome.toString())}
            </ReportValue>
            <ReportLabel>Текущий доход инвестора</ReportLabel>
          </ReportCard>

          <ReportCard>
            <IconContainer>
              <Icon src={commonIncomeSvg} alt="Company income" />
            </IconContainer>
            <ReportValue>
              {formatMoney(report.selfPaymentIncome.toString())}
            </ReportValue>
            <ReportLabel>Текущий собственный доход </ReportLabel>
          </ReportCard>

          <ReportCard>
            <IconContainer>
              <Icon src={selfIncomeSvg} alt="Self income" />
            </IconContainer>
            <ReportValue>
              {formatMoney(report.paymentIncome.toString())}
            </ReportValue>
            <ReportLabel>Текущий общий доход </ReportLabel>
          </ReportCard>
        </>
      )}
    </>
  );

  return (
    <PageLayout>
      {!embedded && (
        <TitleField>
          <CustomTitle>Отчёт для инвесторов</CustomTitle>
          {isSuperUser && !isDeletedView && (
            <>
              <ExportButton
                onClick={() =>
                  report &&
                  currentInvestor &&
                  exportToPdf(report, currentInvestor, payouts)
                }
                disabled={!report}
              />
              <ExportButton
                children={"Поделиться"}
                icon={<ShareIcon />}
                onClick={handleShareClick}
                disabled={!report}
              />
            </>
          )}
        </TitleField>
      )}

      <ContentContainer>
        {embedded && isDeletedView && (
          <DeletedReportHeader>
            <BreadcrumbButton type="button" onClick={onBack}>Инвесторы</BreadcrumbButton>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <strong>Удалённые инвесторы</strong>
          </DeletedReportHeader>
        )}
        {embedded && !isDeletedView && currentInvestor && (
          <InvestorProfileHeader>
            <BreadcrumbButton type="button" onClick={onBack}>
              Инвесторы
            </BreadcrumbButton>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <span>{currentInvestor.nickname || currentInvestor.fullName}</span>

            <InvestorIdentityRow>
              <InvestorAvatar>
                {(currentInvestor.nickname || currentInvestor.fullName || "И")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </InvestorAvatar>
              <InvestorIdentity>
                <InvestorName>
                  {currentInvestor.nickname || currentInvestor.fullName || `Инвестор ${currentInvestor.id}`}
                </InvestorName>
                <InvestorMeta>
                  {[currentInvestor.fullName, currentInvestor.phoneNumber]
                    .filter(Boolean)
                    .join(" · ")}
                </InvestorMeta>
                {report && <InvestorMeta>Создан {formatDate(report.createdAt)}</InvestorMeta>}
              </InvestorIdentity>
              {isSuperUser && (
                <EditInvestorButton
                  type="button"
                  onClick={() => setIsViewInvestorModalOpen(true)}
                >
                  <ButtonIcon viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                  </ButtonIcon>
                  Редактировать
                </EditInvestorButton>
              )}
              <DarkCyanButton onClick={() => setIsPayoutModalOpen(true)}>
                <ButtonIcon viewBox="0 0 24 24" aria-hidden="true">
                  <ellipse cx="12" cy="5" rx="8" ry="3" />
                  <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
                  <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
                </ButtonIcon>
                Выплатить
              </DarkCyanButton>
              {isSuperUser && (
                <ReportActionsMenu>
                  <ReportMoreButton type="button" aria-label="Другие действия">
                    <span />
                    <span />
                    <span />
                  </ReportMoreButton>
                  <ReportActionsDropdown>
                    <button
                      type="button"
                      disabled={!report}
                      onClick={(event) => {
                        handleShareClick();
                        event.currentTarget.closest("details")?.removeAttribute("open");
                      }}
                    >
                      Поделиться
                    </button>
                  </ReportActionsDropdown>
                </ReportActionsMenu>
              )}
            </InvestorIdentityRow>
          </InvestorProfileHeader>
        )}

        {!embedded && report && !isDeletedView && (
          <CreationDate>Инвестор создан {formatDate(report.createdAt)}</CreationDate>
        )}

        {!embedded && <InvestorInfoContainer>
          <SelectWithViewWrapper>
            <SelectWrapper>
              <CustomSelect
                value={selectedInvestorId}
                onChange={handleInvestorChange}
                options={investorOptions}
                placeholder="Выберите инвестора"
                customPlaceholder="Выберите инвестора"
                disabled={isLoading}
              />
            </SelectWrapper>
            {isSuperUser && !isDeletedView && (
              <EditInvestorButton
                type="button"
                onClick={() => setIsViewInvestorModalOpen(true)}
                disabled={!selectedInvestorId}
              >
                Редактировать
              </EditInvestorButton>
            )}
          </SelectWithViewWrapper>
          {!isDeletedView && (
            <DarkCyanButton
              onClick={() => setIsPayoutModalOpen(true)}
              style={{ marginLeft: "auto" }}
            >
              Выплатить инвестору
            </DarkCyanButton>
          )}
        </InvestorInfoContainer>}

        {!isDeletedView && (
          <TabsContainer>
            <Tabs<"general" | "expected" | "current">
              tabs={[
                { id: "general", label: "Общие данные" },
                { id: "expected", label: "Ожидаемый доход" },
                { id: "current", label: "Текущий доход" },
              ]}
              activeTab={dataTab}
              onChange={(tabId) => setDataTab(tabId)}
            />
          </TabsContainer>
        )}

        {report && !isDeletedView && (
          <ReportDataContainer>
            {dataTab === "general" && renderGeneralCards()}
            {dataTab === "expected" && renderExpectedIncomeCards()}
            {dataTab === "current" && renderCurrentIncomeCards()}
          </ReportDataContainer>
        )}

        <OperationsCard>
          <OperationsHeader>
            <ModalInfoTitle>История операций</ModalInfoTitle>
            {isSuperUser && report && currentInvestor && !isDeletedView && (
              <HistoryExportButton
                type="button"
                onClick={() => exportToPdf(report, currentInvestor, payouts)}
              >
                <ButtonIcon viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14 3h7v7" />
                  <path d="m10 14 11-11" />
                  <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
                </ButtonIcon>
                Экспорт
              </HistoryExportButton>
            )}
          </OperationsHeader>

          {isDeletedView ? (
          <>
            <TabsContainer>
              <Tabs<"payouts" | "contributions">
                tabs={[
                  { id: "payouts", label: "История выплат" },
                  { id: "contributions", label: "История инвестиций" },
                ]}
                activeTab={deletedOperationsTab}
                onChange={(tabId) => setDeletedOperationsTab(tabId)}
              />
            </TabsContainer>

            {deletedOperationsTab === "payouts" ? (
              <>
                <CustomTable
                  columns={[
                    { name: "Дата выплаты", isSortable: true },
                    { name: "Инвестор (удалён)", align: "left" },
                    { name: "Выплата, руб", isSortable: true, align: "left" },
                    { name: "Действия", align: "center" },
                  ]}
                  data={deletedPayoutsTableData}
                  isLoading={isDeletedLoading}
                />
                <PaginationLayout>
                  <CountInfoTitle total={deletedInfo?.payouts?.length || 0} />
                  <Pagination
                    total={deletedInfo?.payouts?.length || 0}
                    current={deletedPayoutsPage}
                    onChange={(page) => setDeletedPayoutsPage(page)}
                    itemsPerPage={pageSize}
                  />
                </PaginationLayout>
              </>
            ) : (
              <>
                <CustomTable
                  columns={[
                    { name: "Дата", isSortable: true },
                    { name: "Инвестор (удалён)", align: "left" },
                    {
                      name: "Сумма инвестиции, руб",
                      isSortable: true,
                      align: "left",
                    },
                    { name: "Действия", align: "center" },
                  ]}
                  data={deletedContributionsTableData}
                  isLoading={isDeletedLoading}
                />
                <PaginationLayout>
                  <CountInfoTitle
                    total={deletedInfo?.contributions?.length || 0}
                  />
                  <Pagination
                    total={deletedInfo?.contributions?.length || 0}
                    current={deletedContributionsPage}
                    onChange={(page) => setDeletedContributionsPage(page)}
                    itemsPerPage={pageSize}
                  />
                </PaginationLayout>
              </>
            )}
          </>
          ) : (
          <>
            <TabsContainer>
              <Tabs<"payouts" | "credits" | "contributions">
                tabs={[
                  { id: "payouts", label: "История выплат" },
                  { id: "credits", label: "Договоры" },
                  { id: "contributions", label: "История инвестиций" },
                ]}
                activeTab={operationsTab}
                onChange={(tabId) => setOperationsTab(tabId)}
              />
            </TabsContainer>

            {operationsTab === "payouts" ? (
              <>
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
                    onChange={(page) => setPayoutsPage(page)}
                    itemsPerPage={pageSize}
                  />
                </PaginationLayout>
              </>
            ) : operationsTab === "credits" ? (
              <>
                <CustomTable
                  columns={[
                    { name: "Дата договора", isSortable: true },
                    { name: "Клиент", align: "left" },
                    { name: "Телефон", align: "left" },
                    { name: "Начислено", isSortable: true, align: "left" },
                    { name: "Уплачено", align: "left" },
                    { name: "Остаток", align: "left" },
                    { name: "Долг", align: "left" },
                    { name: "Долг", align: "left", isHidden: true },
                    { name: "Долг", align: "left", isHidden: true },
                  ]}
                  data={creditsTableData}
                  isLoading={isCreditsLoading}
                  rowStyles={rowStyles}
                />
                <PaginationLayout>
                  <CountInfoTitle total={investorCredits?.totalCount || 0} />
                  <Pagination
                    total={investorCredits?.totalCount || 0}
                    current={creditsPage}
                    onChange={(page) => setCreditsPage(page)}
                    itemsPerPage={pageSize}
                  />
                </PaginationLayout>
              </>
            ) : (
              <>
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
                    onChange={(page) => setContributionsPage(page)}
                    itemsPerPage={pageSize}
                  />
                </PaginationLayout>
              </>
            )}
          </>
          )}
        </OperationsCard>

        {/* Модальное окно редактирования инвестиции */}
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

        <PayoutModal
          isOpen={isPayoutModalOpen}
          onClose={() => setIsPayoutModalOpen(false)}
          amount={payoutAmount}
          onAmountChange={setPayoutAmount}
          onSubmit={handlePayoutSubmit}
          investment={report?.investment || 0}
          payoutSource={payoutSource}
          onPayoutSourceChange={setPayoutSource}
          firstContribution={currentInvestor?.firstContribution || null}
          maxAmount={
            currentInvestor?.isBlocked
              ? report?.balance || 0
              : report?.isCompany
              ? (report?.investorIncome || 0) + (report?.selfIncome || 0)
              : report?.investorIncome || 0
          }
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

        <InvestorModal
          mode="edit"
          isOpen={isViewInvestorModalOpen}
          onClose={() => setIsViewInvestorModalOpen(false)}
          onSubmit={handleUpdateInvestor}
          initialData={
            currentInvestor
              ? {
                  id: currentInvestor.id,
                  nickname: currentInvestor.nickname,
                  fullName: currentInvestor.fullName,
                  phoneNumber: currentInvestor.phoneNumber,
                  investorPie: currentInvestor.investorPie,
                  investmentAmount: currentInvestor.investmentAmount ?? 0,
                  balance: currentInvestor.balance,
                  isCompany: currentInvestor.isCompany,
                  isBlocked: currentInvestor.isBlocked,
                }
              : undefined
          }
        />
      </ContentContainer>
    </PageLayout>
  );
};

const TabsContainer = styled.div`
  margin: 16px 0 12px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
`;

const ConfirmButton = styled.button`
  background: rgba(37, 203, 161, 1);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: rgba(29, 163, 129, 1);
  }

  &:disabled {
    background: rgba(37, 203, 161, 0.5);
    cursor: not-allowed;
  }
`;

const RejectButton = styled.button`
  background: rgba(239, 68, 68, 1);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: rgba(220, 38, 38, 1);
  }

  &:disabled {
    background: rgba(239, 68, 68, 0.5);
    cursor: not-allowed;
  }
`;

const ConfirmedBadge = styled.span`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
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

const ContentContainer = styled.div`
  margin-top: 0px;
  padding: 0;
`;

const OperationsCard = styled.section`
  position: relative;
  margin: 20px -25px -25px;
  padding: 18px 24px 20px;
  border: 1px solid #e3e9ef;
  border-radius: 14px;
  background: #fff;

  &::before {
    content: "";
    position: absolute;
    right: -1px;
    bottom: 100%;
    left: -1px;
    height: 20px;
    background: rgba(249, 250, 250, 1);
  }

  ${TabsContainer} {
    margin: 14px 0 12px;
  }
`;

const OperationsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 {
    color: #172033;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.35;
  }
`;

const HistoryExportButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 7px 13px;
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

const DeletedReportHeader = styled.div`
  padding: 12px 0 20px;
  border-bottom: 1px solid #e3e9ef;
  color: #64748b;
  font-size: 13px;

  strong { color: #172033; }
`;

const InvestorProfileHeader = styled.div`
  padding: 0 0 0;
  border-bottom: 1px solid #e3e9ef;
  color: #64748b;
  font-size: 13px;
  text-align: left;
`;

const BreadcrumbButton = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  color: #64748b;
  font: inherit;
  cursor: pointer;

  &:hover { color: #007d88; }
`;

const BreadcrumbSeparator = styled.span`
  margin: 0 8px;
`;

const InvestorIdentityRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  margin-top: 12px;
  padding-bottom: 14px;
  text-align: left;

  @media (max-width: 760px) {
    flex-wrap: wrap;
  }
`;

const InvestorAvatar = styled.div`
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #dff5f5;
  color: #007d88;
  font-size: 18px;
  font-weight: 700;
`;

const InvestorIdentity = styled.div`
  flex: 1;
  min-width: 180px;
  text-align: left;
`;

const InvestorName = styled.div`
  color: #172033;
  font-size: 20px;
  font-weight: 700;
`;

const InvestorMeta = styled.div`
  margin-top: 3px;
  color: #718096;
  font-size: 13px;
`;

const EditInvestorButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #253247;
  font-size: 14px;
  cursor: pointer;

  &:hover:not(:disabled) { border-color: #007d88; color: #007d88; }
  &:disabled { cursor: not-allowed; opacity: 0.5; }
`;

const ButtonIcon = styled.svg`
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex: 0 0 auto;
`;

const ReportActionsMenu = styled.details`
  position: relative;

  &[open] > summary {
    border-color: #007d88;
    color: #007d88;
  }
`;

const ReportMoreButton = styled.summary`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 40px;
  height: 40px;
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

const ReportActionsDropdown = styled.div`
  position: absolute;
  z-index: 20;
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

  button:hover:not(:disabled) {
    background: #f0f9fa;
    color: #007d88;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const CreationDate = styled.div`
  font-size: 14px;
  color: black;
  font-weight: 400;
  margin-bottom: 24px;
  text-align: left;
  margin-left: 0;
  padding-left: 0;
`;

const InvestorInfoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
`;

const SelectWithViewWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-grow: 1;
  max-width: 400px;
`;

const SelectWrapper = styled.div`
  flex-grow: 1;
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

export default InvestorReportPage;
