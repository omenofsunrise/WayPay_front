import { useLocation, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import {
  useEffect,
  useState,
  type ChangeEvent,
  useCallback,
  useMemo,
} from "react";
import CustomTitle from "../components/ui/Text/CustomTitle";
import PageLayout from "../components/ui/Layouts/PageLayout";
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import GrayButton from "../components/ui/Buttons/GrayButton";
import EntitySelectContainer from "../components/ui/Layouts/EntitySelectContainer";
import ClientSelectModal from "../components/modal/CrudInherited/ClientSelectModal";
import InvestorSelectModal from "../components/modal/CrudInherited/InvestorSelectModal";
import ProductsTable from "../components/ui/tables/ProductTable";
import PaymentScheduleTable, {
  type PaymentScheduleItem,
} from "../components/ui/tables/PaymentScheduleTable";
import CustomInput from "../components/ui/fields/CustomInput";
import useSchedule from "../api/hooks/useSchedule";
import useCredit from "../api/hooks/useCredit";
import type {
  CreateCreditRequest,
  CreditPaymentMethod,
  UpdateCreditRequest,
} from "../api/types/credit";
import type { Investor } from "../api/types/investor";
import { useAuth } from "../сontext/AuthContext";
import { type Guarantor } from "../components/modal/CrudInherited/GuarantorModal";
import Checkbox from "../components/ui/CheckBoxes/Checkbox";
import type { EntityType } from "../api/types/objectType";
import ObjectTypeSelect from "../components/ui/fields/ObjectTypeSelect";
import { formatMoney } from "../utils/formatPrice";
import DateModalInput from "../components/ui/fields/DateModalInput";
import CustomCalendar from "../components/ui/fields/CustomCalendar";
import useInvestor from "../api/hooks/useInvestor";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";

const MARKUP_TYPE_STORAGE_KEY = "credit_product_markup_type";
const TURN_OF_ROUNDING_KEY = "turn_of_rounding";
const NEXT_MONTH_START_STORAGE_KEY = "credit_next_month_start";
const IN_DEBT_STORAGE_KEY = "credit_in_debt";
const CREDIT_DRAFT_STORAGE_KEY = "credit_draft";

interface Client {
  id: number;
  fullName: string;
  phone?: string;
  doc?: string;
  birthdate?: string | Date;
  docIssueDate?: string | Date;
  docIssueYear?: number;
  registrationAddress?: string;
  secondPhone?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  markup: number;
  totalPrice: number;
}

interface SelectedObjectType {
  id: number;
  name: string;
  entityType: EntityType;
}

const NewCreditPage = () => {
  const navigate = useNavigate();
  const { authInfo } = useAuth();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const location = useLocation();
  const [contractDate, setContractDate] = useState<string | null>(
    new Date().toISOString().split("T")[0]
  );
  const [client, setClient] = useState<Client | null>(null);
  const [guarantor, setGuarantor] = useState<Guarantor | null>(null);
  const [guarantorClient, setGuarantorClient] = useState<Client | null>(null);
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [selectedPool, setSelectedPool] = useState<Investor | null>(null);
  const [modalType, setModalType] = useState<
    "client" | "guarantorClient" | "investor" | null
  >(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isGuarantorClientModalOpen, setIsGuarantorClientModalOpen] =
    useState(false);
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalSum, setTotalSum] = useState(0);
  const [initialPaymentPercent, setInitialPaymentPercent] =
    useState<string>("");
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<string>("");
  const [initialPaymentMode, setInitialPaymentMode] = useState<
    "percent" | "amount"
  >("percent");
  const [months, setMonths] = useState<string>("");
  const [creditName, setCreditName] = useState<string>("");
  // Выбор способа оплаты показываем только компаниям, которым его включили.
  const paymentMethodEnabled = authInfo?.employee.paymentMethodEnabled ?? false;
  const [paymentMethod, setPaymentMethod] =
    useState<CreditPaymentMethod>("cash");

  const [turnOfRounding, setTurnOfRounding] = useState<boolean>(() => {
    const savedturnOfRounding = localStorage.getItem(TURN_OF_ROUNDING_KEY);
    return savedturnOfRounding === "true";
  });
  const [debtComment, setDebtComment] = useState<string>("");
  const [paymentDue, setPaymentDue] = useState<string>("1");
  const [startPaymentDate, setStartPaymentDate] = useState<string | null>(null);
  const {
    getPreview,
    previewData,
    isLoading: isScheduleLoading,
  } = useSchedule();
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>(
    []
  );
  const {
    createCredit,
    updateCredit,
    getCreateCreditRequest,
    isLoading: isCreditLoading,
  } = useCredit();
  const { getInvestorById } = useInvestor();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [objectTypeName, setObjectTypeName] = useState<string>("");
  const [tabTypeName, setTabTypeName] = useState<string>("");
  const [selectedObjectType, setSelectedObjectType] =
    useState<SelectedObjectType | null>(null);
  const [selectedTabType, setSelectedTabType] =
    useState<SelectedObjectType | null>(null);
  const [markupType, setMarkupType] = useState<"percent" | "fixed">(() => {
    const savedMarkupType = localStorage.getItem(MARKUP_TYPE_STORAGE_KEY);
    return savedMarkupType === "percent" || savedMarkupType === "fixed"
      ? savedMarkupType
      : "percent";
  });
  const [nextMonthStart, setNextMonthStart] = useState<boolean>(() => {
    const savedNextMonthStart = localStorage.getItem(
      NEXT_MONTH_START_STORAGE_KEY
    );
    return savedNextMonthStart === "true";
  });
  const [inDebt, setInDebt] = useState<boolean>(() => {
    const savedInDebt = localStorage.getItem(IN_DEBT_STORAGE_KEY);
    return savedInDebt === "true";
  });
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const creditApplicationData = location.state?.creditApplication;

  // Загрузка черновика при первой инициализации
  useEffect(() => {
    if (isDraftLoaded) return;
    const draftRaw = localStorage.getItem(CREDIT_DRAFT_STORAGE_KEY);
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        setContractDate(
          draft.contractDate ?? new Date().toISOString().split("T")[0]
        );
        setClient(draft.client ?? null);
        setGuarantor(draft.guarantor ?? null);
        setGuarantorClient(draft.guarantorClient ?? null);
        setInvestor(draft.investor ?? null);
        setSelectedPool(draft.selectedPool ?? null);
        setProducts(draft.products ?? []);
        setTotalSum(draft.totalSum ?? 0);
        setInitialPaymentPercent(draft.initialPaymentPercent ?? "");
        setInitialPaymentAmount(draft.initialPaymentAmount ?? "");
        setMonths(draft.months ?? "");
        setCreditName(draft.creditName ?? "");
        setStartPaymentDate(draft.startPaymentDate ?? null);
        setDebtComment(draft.debtComment ?? "");
        setPaymentDue(draft.paymentDue ?? "1");
        setNextMonthStart(draft.nextMonthStart ?? false);
        setInDebt(draft.inDebt ?? false);
        setObjectTypeName(draft.objectTypeName ?? "");
        setTabTypeName(draft.tabTypeName ?? "");
        setSelectedObjectType(draft.selectedObjectType ?? null);
        setSelectedTabType(draft.selectedTabType ?? null);
        setPaymentSchedule(draft.paymentSchedule ?? []);
        setHasDraft(true);
        setIsDraftLoaded(true);
      } catch (e) {
        console.error("Failed to load draft", e);
        setIsDraftLoaded(true);
      }
    } else {
      setIsDraftLoaded(true);
    }
  }, [isDraftLoaded]);

  useEffect(() => {
    let isMounted = true;

    const loadCreditData = async () => {
      if (!isEditMode || !id) return;

      try {
        const creditData = await getCreateCreditRequest(parseInt(id));
        if (!isMounted) return;

        if (creditData) {
          // Логируем полученные данные
          console.log("Received credit data:", creditData);
          console.log("Products:", creditData.products);

          // Проверяем первый продукт
          if (creditData.products && creditData.products[0]) {
            const firstProduct = creditData.products[0];
            console.log("First product:", {
              surcharge: firstProduct.surcharge,
              surchargeAmount: firstProduct.surchargeAmount,
              price: firstProduct.price,
            });
          }

          setCreditName(creditData.name || "");
          setContractDate(
            creditData.creditDate
              ? new Date(creditData.creditDate).toISOString().split("T")[0]
              : null
          );
          setTurnOfRounding(creditData.turnOfRounding);
          // У договоров, заведённых до появления настройки, способ пустой —
          // показываем наличные, но в базе так и останется пусто, пока не сохранят.
          setPaymentMethod(creditData.paymentMethod ?? "cash");

          setStartPaymentDate(
            creditData.startPaymentDay
              ? new Date(creditData.startPaymentDay).toISOString().split("T")[0]
              : null
          );

          if (
            creditData.startPaymentDay &&
            creditData.startPaymentDay.toString() === "0001-01-01T00:00:00"
          ) {
            console.log("alert)");
            window.alert(
              "Внимание: Начало выплат у старых договоров нужно ввести заново для редактирования!"
            );
          }

          setInDebt(creditData.inDebt || false);
          setDebtComment(creditData.debtComment);

          // Determine markup type from the first product
          const firstProduct = creditData.products && creditData.products[0];
          let determinedMarkupType: "percent" | "fixed" = "percent";

          if (firstProduct) {
            if (
              firstProduct.surchargeAmount !== undefined &&
              firstProduct.surchargeAmount !== null
            ) {
              determinedMarkupType = "fixed";
              console.log(
                "Markup type determined as FIXED, surchargeAmount:",
                firstProduct.surchargeAmount
              );
            } else if (
              firstProduct.surcharge !== undefined &&
              firstProduct.surcharge !== null
            ) {
              determinedMarkupType = "percent";
              console.log(
                "Markup type determined as PERCENT, surcharge:",
                firstProduct.surcharge
              );
            }
          }

          // Set markup type
          setMarkupType(determinedMarkupType);

          setClient({
            id: creditData.clientId,
            fullName: creditData.clientFullname,
            phone: creditData.clientId.toString() || "",
          });

          if (!creditData.inDebt) {
            if (creditData.investorId) {
              const loadedInvestor = await getInvestorById(
                creditData.investorId
              );
              if (!isMounted) return;

              setInvestor({
                id: creditData.investorId,
                nickname:
                  loadedInvestor?.nickname || creditData.investorNickname || "",
                fullName:
                  loadedInvestor?.fullName || creditData.investorId.toString(),
                phoneNumber:
                  loadedInvestor?.phoneNumber ||
                  creditData.investorId.toString(),
                investorPie:
                  loadedInvestor?.investorPie || creditData.investorId || 0,
                investmentAmount:
                  loadedInvestor?.investmentAmount ||
                  creditData.investorId ||
                  0,
                balance: loadedInvestor?.balance || creditData.investorId || 0,
                isCompany: loadedInvestor?.isCompany || false,
                isCompanyPool: loadedInvestor?.isCompanyPool,
                isPool: false,
              });
            } else if (creditData.poolId) {
              setSelectedPool({
                id: creditData.poolId,
                nickname: creditData.investorNickname || "",
                fullName: creditData.poolId.toString() || "",
                phoneNumber: creditData.poolId.toString() || "",
                investorPie: creditData.poolId || 0,
                investmentAmount: creditData.poolId || 0,
                balance: creditData.poolId.toString() || 0,
                isPool: true,
              });
            }
          }

          if (creditData.guarantorClientId) {
            setGuarantorClient({
              id: creditData.guarantorClientId,
              fullName: creditData.guarantorFullname,
            });
          } else if (creditData.guarantor) {
            setGuarantor({
              id: null,
              fullName: creditData.guarantor.fullName,
              phone: creditData.guarantor.phone || "",
              doc: creditData.guarantor.doc || "",
              birthdate: creditData.guarantor.birthdate,
              address: creditData.guarantor.address || "",
            });
          }

          if (creditData.creditTypeId) {
            setSelectedObjectType({
              id: creditData.creditTypeId,
              name: creditData.creditTypeName,
              entityType: "credit",
            });
            setObjectTypeName(creditData.creditTypeName);
          }

          // Format products using the determined markup type
          const formattedProducts = creditData.products.map(
            (product, index) => {
              let markup = 0;
              let totalPrice = product.price;

              console.log(`Processing product ${index}:`, {
                name: product.name,
                price: product.price,
                surcharge: product.surcharge,
                surchargeAmount: product.surchargeAmount,
                determinedMarkupType,
              });

              if (determinedMarkupType === "percent") {
                // For percent markup
                markup = product.surcharge || 0;
                totalPrice =
                  product.price * (1 + (product.surcharge || 0) / 100);
                console.log(`Percent markup: ${markup}% = ${totalPrice} total`);
              } else {
                // For fixed amount markup
                markup = product.surchargeAmount || 0;
                totalPrice = product.price + (product.surchargeAmount || 0);
                console.log(`Fixed markup: ${markup} ₽ = ${totalPrice} total`);
              }

              return {
                id: index + 1,
                name: product.name,
                price: product.price,
                quantity: 1,
                markup: markup,
                totalPrice: totalPrice,
              };
            }
          );

          console.log("Formatted products:", formattedProducts);
          setProducts(formattedProducts);

          const newTotalSum = formattedProducts.reduce(
            (sum, product) => sum + product.totalPrice,
            0
          );
          setTotalSum(newTotalSum);

          if (
            creditData.firstPayment !== undefined &&
            creditData.firstPayment !== null
          ) {
            const firstPayment = Number(creditData.firstPayment);
            if (!isNaN(firstPayment)) {
              const formattedAmount = formatMoney(firstPayment.toString());
              setInitialPaymentAmount(formattedAmount);

              if (newTotalSum > 0) {
                const percent = Math.round((firstPayment / newTotalSum) * 100);
                setInitialPaymentPercent(percent.toString());
              }
            }
          }

          if (creditData.termMonths) {
            setMonths(creditData.termMonths.toString());
          }
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных кредита:", error);
        window.alert("Не удалось загрузить данные кредита");
      }
    };

    loadCreditData();

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, getCreateCreditRequest, getInvestorById]);

  useEffect(() => {
    if (creditApplicationData) {
      if (creditApplicationData.clientId) {
        setClient({
          id: creditApplicationData.clientId,
          fullName: creditApplicationData.clientName,
          phone: creditApplicationData.clientPhone || "",
        });
      }

      const today = new Date().toISOString().split("T")[0];
      setContractDate(today);

      if (
        creditApplicationData.productName &&
        creditApplicationData.productPrice
      ) {
        setProducts([
          {
            id: Date.now(),
            name: creditApplicationData.productName,
            price: creditApplicationData.productPrice,
            quantity: 1,
            markup: creditApplicationData.percent * 100,
            totalPrice:
              creditApplicationData.productPrice *
              (1 + creditApplicationData.percent),
          },
        ]);
        setTotalSum(
          creditApplicationData.productPrice *
            (1 + creditApplicationData.percent)
        );
      }

      if (creditApplicationData.termMonths) {
        setMonths(creditApplicationData.termMonths.toString());
      }

      if (
        creditApplicationData.firstPayment !== undefined &&
        creditApplicationData.firstPayment !== null
      ) {
        const firstPayment = Number(creditApplicationData.firstPayment);
        if (!isNaN(firstPayment)) {
          const formattedAmount = formatMoney(firstPayment.toString());
          setInitialPaymentAmount(formattedAmount);
          handleAmountChange(null, formattedAmount);

          if (totalSum > 0) {
            const percent = Math.round((firstPayment / totalSum) * 100);
            setInitialPaymentPercent(percent.toString());
          }
        }
      }
    }
  }, [creditApplicationData]);

  useEffect(() => {
    console.log(startPaymentDate);
  }, [startPaymentDate]);

  // Сохранение черновика
  useEffect(() => {
    if (!isDraftLoaded || isEditMode) return;
    const draft = {
      contractDate,
      client,
      guarantor,
      guarantorClient,
      investor,
      selectedPool,
      products,
      totalSum,
      initialPaymentPercent,
      initialPaymentAmount,
      months,
      creditName,
      debtComment,
      paymentDue,
      nextMonthStart,
      inDebt,
      objectTypeName,
      tabTypeName,
      selectedObjectType,
      selectedTabType,
      paymentSchedule,
      turnOfRounding,
      paymentMethod,
      startPaymentDate,
    };
    try {
      localStorage.setItem(CREDIT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setHasDraft(true);
    } catch (e) {
      console.error("Failed to save draft", e);
    }
  }, [
    isDraftLoaded,
    isEditMode,
    contractDate,
    client,
    guarantor,
    guarantorClient,
    investor,
    selectedPool,
    startPaymentDate,
    products,
    totalSum,
    initialPaymentPercent,
    initialPaymentAmount,
    months,
    creditName,
    debtComment,
    paymentDue,
    nextMonthStart,
    turnOfRounding,
    paymentMethod,
    inDebt,
    objectTypeName,
    tabTypeName,
    selectedObjectType,
    selectedTabType,
    paymentSchedule,
  ]);

  const handleMarkupTypeChange = useCallback((type: "percent" | "fixed") => {
    setMarkupType(type);
    localStorage.setItem(MARKUP_TYPE_STORAGE_KEY, type);
  }, []);

  const handleTurnOfRoundingChange = useCallback((checked: boolean) => {
    setTurnOfRounding(checked);
    localStorage.setItem(TURN_OF_ROUNDING_KEY, checked.toString());
  }, []);

  const parseAmount = useCallback((formatted: string): number => {
    return parseInt(formatted.replace(/[^\d]/g, "")) || 0;
  }, []);

  const resetDraft = useCallback(() => {
    localStorage.removeItem(CREDIT_DRAFT_STORAGE_KEY);
    setHasDraft(false);
    setContractDate(new Date().toISOString().split("T")[0]);
    setClient(null);
    setGuarantor(null);
    setGuarantorClient(null);
    setInvestor(null);
    setSelectedPool(null);
    setProducts([
      {
        id: Date.now(),
        name: ``,
        price: 0,
        quantity: 1,
        markup: 0,
        totalPrice: 0,
      },
    ]);
    setTotalSum(0);
    setInitialPaymentPercent("");
    setInitialPaymentAmount("");
    setMonths("");
    setCreditName("");
    setDebtComment("");
    setPaymentDue("1");
    setInDebt(false);
    setObjectTypeName("");
    setTabTypeName("");
    setSelectedObjectType(null);
    setSelectedTabType(null);
    setPaymentSchedule([]);
    setStartPaymentDate(null);
  }, []);

  const handleObjectTypeSelect = useCallback(
    (objectType: SelectedObjectType) => {
      setSelectedObjectType(objectType);
      setObjectTypeName(objectType.name);
    },
    []
  );

  const handleObjectTypeNameChange = useCallback((value: string) => {
    setObjectTypeName(value);
    if (!value) {
      setSelectedObjectType(null);
    }
  }, []);

  const handleInDebtChange = useCallback((checked: boolean) => {
    setInDebt(checked);
    localStorage.setItem(IN_DEBT_STORAGE_KEY, checked.toString());

    if (checked) {
      setInvestor(null);
      setSelectedPool(null);
    }
  }, []);

  const requiresInvestmentSource = !inDebt;

  const handleCreateOrUpdateCredit = useCallback(async () => {
    if (
      !client ||
      !contractDate ||
      (requiresInvestmentSource && !investor && !selectedPool)
    ) {
      return;
    }

    if (guarantorClient && guarantorClient.id === client.id) {
      window.alert("Клиент не может быть одновременно и поручителем");
      return;
    }

    const creditData: CreateCreditRequest | UpdateCreditRequest = {
      clientId: client.id,
      name: creditName,
      debtComment: debtComment,
      creditDate: new Date(contractDate),
      firstPayment: initialPaymentAmount
        ? parseAmount(initialPaymentAmount)
        : 0,
      termMonths: parseInt(months),
      startPaymentDay: new Date(startPaymentDate),
      turnOfRounding: turnOfRounding,
      // У компаний без настройки поле не отправляем, чтобы в базе осталось
      // пусто: пусто значит «не спрашивали», а не «наличными».
      paymentMethod: paymentMethodEnabled ? paymentMethod : undefined,
      inDebt: inDebt,
      products: products
        .filter((product) => product.name.trim() !== "" && product.price > 0)
        .map((product) => ({
          name: product.name,
          price: product.price,
          ...(markupType === "percent"
            ? { surcharge: product.markup }
            : { surchargeAmount: product.markup }),
        })),
      creditTypeId: null,
      GuarantorClientId: null,
    };

    if (selectedObjectType && selectedObjectType.id) {
      creditData.creditTypeId = selectedObjectType.id;
    }

    if (guarantorClient) {
      creditData.GuarantorClientId = guarantorClient.id;
    } else if (guarantor) {
      creditData.guarantor = {
        fullName: guarantor.fullName,
        phone: guarantor.phone,
        birthdate: guarantor.birthdate
          ? new Date(guarantor.birthdate)
          : undefined,
        address: guarantor.address,
        doc: guarantor.doc,
      };
    }

    if (!inDebt) {
      if (selectedPool) {
        creditData.poolId = selectedPool.poolId || selectedPool.id;
      }

      if (investor) {
        creditData.investorId = investor.id;
      }
    }

    setSubmitError(null);

    try {
      let createdCredit;

      if (isEditMode && id) {
        const updateData = {
          ...creditData,
          id: parseInt(id),
        } as UpdateCreditRequest;

        createdCredit = await updateCredit(updateData);
      } else {
        createdCredit = await createCredit(creditData as CreateCreditRequest);
      }

      if (createdCredit) {
        localStorage.removeItem(CREDIT_DRAFT_STORAGE_KEY);
        setHasDraft(false);
        navigate("/credits");
      }
    } catch (err) {
      const requestError = err as {
        response?: { data?: string | { message?: string } };
        message?: string;
      };
      const responseData = requestError.response?.data;
      const errorMessage =
        typeof responseData === "string"
          ? responseData
          : responseData?.message
          ? responseData.message
          : requestError.message ||
            "Не удалось сохранить договор. Попробуйте ещё раз.";
      setSubmitError(errorMessage);
    }
  }, [
    client,
    contractDate,
    investor,
    selectedPool,
    guarantor,
    guarantorClient,
    initialPaymentAmount,
    months,
    startPaymentDate,
    paymentDue,
    nextMonthStart,
    turnOfRounding,
    products,
    parseAmount,
    createCredit,
    updateCredit,
    navigate,
    markupType,
    selectedObjectType,
    creditName,
    isEditMode,
    id,
    inDebt,
    requiresInvestmentSource,
  ]);

  const generateSchedulePreview = useCallback(async () => {
    if (!contractDate || !months || !paymentDue || totalSum <= 0) return;

    try {
      const initialPayment = initialPaymentAmount
        ? parseAmount(initialPaymentAmount)
        : 0;
      const creditAmount = totalSum - initialPayment;

      const previewParams = {
        termMonths: parseInt(months),
        totalAmount: creditAmount,
        turnOfRounding: turnOfRounding,
        startDate: new Date(startPaymentDate),
      };

      await getPreview(previewParams);
    } catch (error) {
      console.error("[PaymentSchedule] ❌ Ошибка при генерации превью:", error);
    }
  }, [
    contractDate,
    months,
    startPaymentDate,
    paymentDue,
    totalSum,
    initialPaymentAmount,
    parseAmount,
    getPreview,
    turnOfRounding,
  ]);

  useEffect(() => {
    if (previewData) {
      const initialPayment = initialPaymentAmount
        ? parseAmount(initialPaymentAmount)
        : 0;
      const creditAmount = totalSum - initialPayment;

      const formattedSchedule = previewData.map((item, index) => {
        const previousPayments = previewData
          .slice(0, index)
          .reduce((sum, payment) => sum + payment.paymentAmount, 0);
        const remainingAmount = creditAmount - previousPayments;

        return {
          id: index + 1,
          date: new Date(item.paymentDate).toLocaleDateString("ru-RU"),
          remainingAmount: Math.max(0, remainingAmount),
          requiredPayment: item.paymentAmount,
          comment: item.comment,
        };
      });

      if (initialPayment > 0) {
        formattedSchedule.unshift({
          id: 0,
          date: new Date(contractDate!).toLocaleDateString("ru-RU"),
          remainingAmount: totalSum,
          requiredPayment: initialPayment,
          comment: "Первоначальный взнос",
        });
      }

      setPaymentSchedule(formattedSchedule);
    }
  }, [previewData, totalSum, initialPaymentAmount, contractDate, parseAmount]);

  useEffect(() => {
    if (contractDate && months && paymentDue && totalSum > 0) {
      generateSchedulePreview();
    } else {
      if (paymentSchedule.length > 0) {
        setPaymentSchedule([]);
      }
    }
  }, [
    contractDate,
    months,
    paymentDue,
    totalSum,
    nextMonthStart,
    turnOfRounding,
    generateSchedulePreview,
  ]);

  const handlePercentChange = useCallback(
    (e?: ChangeEvent<HTMLInputElement>, value?: string) => {
      if (e != null) value = e.target.value;

      if (value === "" || /^\d*$/.test(value)) {
        setInitialPaymentPercent(value);

        if (value === "") {
          setInitialPaymentAmount("");
        } else if (totalSum > 0) {
          const percent = parseInt(value);
          if (!isNaN(percent)) {
            const amount = Math.round((totalSum * percent) / 100);
            setInitialPaymentAmount(formatMoney(amount.toString()));
          }
        }
      }
    },
    [totalSum, formatMoney]
  );

  const openInvestorModal = () => {
    setModalType("investor");
    setIsInvestorModalOpen(true);
  };

  const handleAmountChange = useCallback(
    (e?: ChangeEvent<HTMLInputElement>, inputValue?: string) => {
      if (e != null) inputValue = e.target.value;

      if (inputValue === "₽" || inputValue === "") {
        setInitialPaymentAmount("");
        setInitialPaymentPercent("");
        return;
      }

      const numericValue = parseAmount(inputValue);

      const formattedValue = formatMoney(numericValue.toString());

      setInitialPaymentAmount(formattedValue);

      if (totalSum > 0 && numericValue > 0) {
        const percent = Math.round((numericValue / totalSum) * 100);
        setInitialPaymentPercent(percent.toString());
      } else {
        setInitialPaymentPercent("");
      }
    },
    [totalSum, parseAmount, formatMoney]
  );

  const handleSelectClient = (client: Client) => {
    if (modalType === "client") {
      setClient(client);
    } else if (modalType === "guarantorClient") {
      setGuarantorClient(client);
      setGuarantor(null);
    }
    setIsClientModalOpen(false);
    setIsGuarantorClientModalOpen(false);
  };

  const hasEmptyProductNames = products.every(
    (product) => product.name.trim() === ""
  );

  const isFormValid =
    client &&
    contractDate &&
    startPaymentDate &&
    (!requiresInvestmentSource || investor || selectedPool) &&
    !hasEmptyProductNames &&
    products.length > 0 &&
    products.some((product) => product.name.trim() !== "" && product.price > 0);

  const handleSelectInvestor = (selectedEntity: {
    id: number;
    nickname?: string;
    name?: string;
    fullName?: string;
    phoneNumber?: string;
    investorPie?: number;
    pie?: number;
    investmentAmount?: number;
    balance?: number;
    isCompany?: boolean;
    type: "investor" | "pool";
  }) => {
    if (selectedEntity.type === "pool") {
      setSelectedPool({
        id: selectedEntity.id,
        nickname: selectedEntity.name || selectedEntity.nickname || "",
        fullName: selectedEntity.fullName || selectedEntity.name || "",
        phoneNumber: selectedEntity.phoneNumber || "",
        investorPie: selectedEntity.pie || 0,
        investmentAmount: selectedEntity.investmentAmount || 0,
        balance: selectedEntity.balance || 0,
        isPool: true,
      });
      setInvestor(null);
    } else {
      setInvestor({
        id: selectedEntity.id,
        nickname: selectedEntity.nickname || "",
        fullName: selectedEntity.fullName || "",
        phoneNumber: selectedEntity.phoneNumber || "",
        investorPie: selectedEntity.investorPie || 0,
        investmentAmount: selectedEntity.investmentAmount || 0,
        balance: selectedEntity.balance || 0,
        isCompany: selectedEntity.isCompany,
        isPool: false,
      });
      setSelectedPool(null);
    }
    setIsInvestorModalOpen(false);
  };

  const openClientModal = (type: "client" | "guarantorClient") => {
    setModalType(type);
    if (type === "client") {
      setIsClientModalOpen(true);
    } else {
      setIsGuarantorClientModalOpen(true);
    }
  };

  const handleMonthsBlur = (value: string) => {
    const numericValue = Number(value) || 0;
    if (numericValue > 180) {
      setMonths("180");
    } else if (numericValue < 1) {
      setMonths("1");
    }

  };

  const getSelectedEntityDisplayName = () => {
    if (investor) return investor.nickname;
    if (selectedPool) return selectedPool.nickname;
    return "";
  };

  const getSelectedEntityPhone = () => {
    if (investor) return investor.phoneNumber;
    if (selectedPool) return selectedPool.phoneNumber;
    return "";
  };

  const clearSelectedEntity = () => {
    setInvestor(null);
    setSelectedPool(null);
  };

  const getGuarantorDisplayInfo = () => {
    if (guarantorClient) {
      return {
        primaryValue: guarantorClient.fullName,
        secondaryValue: guarantorClient.phone,
        type: "client",
      };
    } else if (guarantor) {
      return {
        primaryValue: guarantor.fullName,
        secondaryValue: guarantor.phone,
        type: "custom",
      };
    }
    return {
      primaryValue: "",
      secondaryValue: "",
      type: null,
    };
  };

  const clearGuarantor = () => {
    setGuarantor(null);
    setGuarantorClient(null);
  };

  const guarantorInfo = getGuarantorDisplayInfo();

  const plusIcon = (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11 1.66675V20.3334M20.3333 11.0001L1.66663 11.0001"
        stroke="rgba(80, 85, 92, 1)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );

  const initialPaymentNumeric = useMemo(
    () => (initialPaymentAmount ? parseAmount(initialPaymentAmount) : 0),
    [initialPaymentAmount, parseAmount]
  );

  const monthlyPayment = useMemo(() => {
    if (!previewData || previewData.length === 0) return 0;
    const scheduledOnly = previewData.filter((p) => p.paymentAmount > 0);
    if (scheduledOnly.length === 0) return 0;
    const total = scheduledOnly.reduce((sum, p) => sum + p.paymentAmount, 0);
    return Math.round(total / scheduledOnly.length);
  }, [previewData]);

  const totalRepayment = useMemo(() => {
    const scheduled = (previewData ?? []).reduce(
      (sum, p) => sum + p.paymentAmount,
      0
    );
    return scheduled + initialPaymentNumeric;
  }, [previewData, initialPaymentNumeric]);

  const overpayment = useMemo(() => {
    if (totalRepayment <= 0 || totalSum <= 0) return 0;
    return Math.max(0, totalRepayment - totalSum);
  }, [totalRepayment, totalSum]);

  return (
    <PageLayout>
      {isEditMode && (
        <PageHeader>
          <CustomTitle>Редактирование договора</CustomTitle>
        </PageHeader>
      )}

      <StickySummaryBar>
        <SummaryGrid>
          <SummaryCard>
            <SummaryIcon $accent="default">
              <AttachMoneyOutlinedIcon fontSize="small" />
            </SummaryIcon>
            <SummaryItemBody>
              <SummaryLabel>Сумма товаров</SummaryLabel>
              <SummaryValue>
                {totalSum > 0 ? formatMoney(totalSum.toString()) : "—"}
              </SummaryValue>
            </SummaryItemBody>
          </SummaryCard>

          <SummaryCard>
            <SummaryIcon $accent="info">
              <AccountBalanceWalletOutlinedIcon fontSize="small" />
            </SummaryIcon>
            <SummaryItemBody>
              <SummaryLabel>Первый взнос</SummaryLabel>
              <SummaryValue>
                {initialPaymentNumeric > 0
                  ? `${formatMoney(initialPaymentNumeric.toString())}${
                      initialPaymentPercent
                        ? ` · ${initialPaymentPercent}%`
                        : ""
                    }`
                  : "—"}
              </SummaryValue>
            </SummaryItemBody>
          </SummaryCard>

          <SummaryCard>
            <SummaryIcon $accent="default">
              <CalendarMonthOutlinedIcon fontSize="small" />
            </SummaryIcon>
            <SummaryItemBody>
              <SummaryLabel>Срок</SummaryLabel>
              <SummaryValue>{months ? `${months} мес.` : "—"}</SummaryValue>
            </SummaryItemBody>
          </SummaryCard>

          <SummaryCard>
            <SummaryIcon $accent="info">
              <TrendingUpOutlinedIcon fontSize="small" />
            </SummaryIcon>
            <SummaryItemBody>
              <SummaryLabel>Ежемесячный платёж</SummaryLabel>
              <SummaryValue>
                {monthlyPayment > 0
                  ? formatMoney(monthlyPayment.toString())
                  : "—"}
              </SummaryValue>
            </SummaryItemBody>
          </SummaryCard>

          {overpayment > 0 && (
            <SummaryCard $variant="danger">
              <SummaryIcon $accent="danger">
                <WarningAmberOutlinedIcon fontSize="small" />
              </SummaryIcon>
              <SummaryItemBody>
                <SummaryLabel>Переплата</SummaryLabel>
                <SummaryValue>
                  {formatMoney(overpayment.toString())}
                </SummaryValue>
              </SummaryItemBody>
            </SummaryCard>
          )}
        </SummaryGrid>

        {hasDraft && !isEditMode && (
          <HeaderActions>
            <GrayButton
              icon={<RestartAltOutlinedIcon fontSize="small" />}
              onClick={resetDraft}
            >
              Сбросить черновик
            </GrayButton>
          </HeaderActions>
        )}
      </StickySummaryBar>

      <ContentStack>
        <TopDetailsCard>
          <SectionAccentBar $accent="teal" />
          <TopDetailsRow>
            <TopField $basis="320px">
              <CompactField>
                <DescriptionOutlinedIcon fontSize="small" />
                <DateInputWrapper>
                  <CustomCalendar
                    prefix=""
                    value={contractDate || ""}
                    onChange={(date) => setContractDate(date || null)}
                    onReset={() => setContractDate(null)}
                  />
                </DateInputWrapper>
              </CompactField>
            </TopField>

            {!inDebt ? (
              <TopField $basis="390px">
                <CompactField>
                  <PersonOutlineIcon fontSize="small" />
                  <EntitySelectWrapper>
                    <EntitySelectContainer
                      mode="create"
                      primaryValue={getSelectedEntityDisplayName()}
                      secondaryValue={getSelectedEntityPhone()}
                      placeholder="Выберите инвестора или пул"
                      onSelect={openInvestorModal}
                      onClear={clearSelectedEntity}
                      customIcon={plusIcon}
                    />
                  </EntitySelectWrapper>
                </CompactField>
              </TopField>
            ) : inDebt ? (
              <TopField $basis="390px">
                <CompactField>
                  <PersonOutlineIcon fontSize="small" />
                  <EntitySelectWrapper>
                    <CustomInput
                      placeholder="Кем выдан долг"
                      value={debtComment}
                      onChange={(e) => setDebtComment(e.target.value)}
                    />
                  </EntitySelectWrapper>
                </CompactField>
              </TopField>
            ) : null}

            <TopField $basis="360px">
              <CompactField>
                <DescriptionOutlinedIcon fontSize="small" />
                <CustomInput
                  inputType="text"
                  placeholder="Имя договора"
                  value={creditName}
                  onChange={(e) => setCreditName(e.target.value)}
                />
              </CompactField>
            </TopField>

            <TopField $basis="390px">
              <CompactField>
                <Inventory2OutlinedIcon fontSize="small" />
                <ObjectTypeSelect
                  value={objectTypeName}
                  onChange={handleObjectTypeNameChange}
                  onObjectTypeSelect={handleObjectTypeSelect}
                  placeholder="Выберите тип договора"
                  entityType="credit"
                />
              </CompactField>
            </TopField>

            <TopDebtSetting $active={inDebt}>
              <Checkbox
                label="Договор в долг"
                checked={inDebt}
                onChange={handleInDebtChange}
              />
            </TopDebtSetting>
          </TopDetailsRow>
        </TopDetailsCard>

        <PersonRow>
          <SectionCard $accent="teal">
            <SectionAccentBar $accent="teal" />
            <SectionBody>
              <SectionHeader>
                <SectionIcon>
                  <PersonOutlineIcon fontSize="small" />
                </SectionIcon>
                <SectionTitle>Покупатель</SectionTitle>
              </SectionHeader>
              <WideEntitySelectWrapper>
                <EntitySelectContainer
                  mode="create"
                  primaryValue={client?.fullName || ""}
                  secondaryValue={client?.phone}
                  placeholder="Выберите покупателя"
                  onSelect={() => openClientModal("client")}
                  onClear={() => setClient(null)}
                  customIcon={plusIcon}
                />
              </WideEntitySelectWrapper>
            </SectionBody>
          </SectionCard>

          <SectionCard $accent="orange">
            <SectionAccentBar $accent="orange" />
            <SectionBody>
              <SectionHeader>
                <SectionIcon $accent="orange">
                  <ShieldOutlinedIcon fontSize="small" />
                </SectionIcon>
                <SectionTitle>
                  Поручитель <SectionOptional>(не обязательно)</SectionOptional>
                </SectionTitle>
              </SectionHeader>
              <WideEntitySelectWrapper>
                <EntitySelectContainer
                  mode="create"
                  primaryValue={guarantorInfo.primaryValue}
                  secondaryValue={guarantorInfo.secondaryValue}
                  placeholder="Выберите поручителя"
                  onSelect={() => openClientModal("guarantorClient")}
                  onClear={clearGuarantor}
                  customIcon={plusIcon}
                />
              </WideEntitySelectWrapper>
            </SectionBody>
          </SectionCard>
        </PersonRow>

        <SectionCard $accent="teal">
          <SectionAccentBar $accent="teal" />
          <SectionBody>
            <SectionTopRow>
              <SectionHeader>
                <SectionIcon>
                  <Inventory2OutlinedIcon fontSize="small" />
                </SectionIcon>
                <SectionTitle>Список товаров</SectionTitle>
              </SectionHeader>
              <MarkupPillContainer role="group" aria-label="Тип наценки">
                <MarkupPill
                  type="button"
                  $active={markupType === "percent"}
                  onClick={() => handleMarkupTypeChange("percent")}
                  aria-pressed={markupType === "percent"}
                >
                  %
                </MarkupPill>
                <MarkupPill
                  type="button"
                  $active={markupType === "fixed"}
                  onClick={() => handleMarkupTypeChange("fixed")}
                  aria-pressed={markupType === "fixed"}
                >
                  ₽
                </MarkupPill>
              </MarkupPillContainer>
            </SectionTopRow>

            <ProductsTableWrapper>
              <ProductsTable
                products={products}
                onProductsChange={setProducts}
                onTotalSumChange={setTotalSum}
                markupType={markupType}
              />
            </ProductsTableWrapper>

            <TotalSumRow>
              <TotalSumGroup>
                <TotalSumLabel>Итого товаров на сумму</TotalSumLabel>
                <TotalSumValue>
                  {formatMoney(totalSum.toString())}
                </TotalSumValue>
              </TotalSumGroup>
              <ProductSettings>
                <RoundingControl>
                  <RoundingCopy>
                    <RoundingLabel>
                      Округление суммы <InfoBadge title="Сумма будет округляться до заданного шага">i</InfoBadge>
                    </RoundingLabel>
                    <RoundingHint>
                      Сумма будет округляться до заданного шага
                    </RoundingHint>
                  </RoundingCopy>
                  <SwitchButton
                    type="button"
                    $active={turnOfRounding}
                    onClick={() => handleTurnOfRoundingChange(!turnOfRounding)}
                    aria-label="Округление суммы"
                    aria-pressed={turnOfRounding}
                  />
                </RoundingControl>
                {paymentMethodEnabled && (
                  <PaymentControl>
                    <PaymentLabel>Способ оплаты</PaymentLabel>
                    <Segmented role="group" aria-label="Способ оплаты">
                      <SegmentedButton
                      type="button"
                      $active={paymentMethod === "cash"}
                      onClick={() => setPaymentMethod("cash")}
                      aria-pressed={paymentMethod === "cash"}
                    >
                      Наличными
                      </SegmentedButton>
                      <SegmentedButton
                      type="button"
                      $active={paymentMethod === "transfer"}
                      onClick={() => setPaymentMethod("transfer")}
                      aria-pressed={paymentMethod === "transfer"}
                    >
                      Переводом
                      </SegmentedButton>
                    </Segmented>
                  </PaymentControl>
                )}
              </ProductSettings>
            </TotalSumRow>
          </SectionBody>
        </SectionCard>

        <PaymentRow>
          <PaymentParamsCard $accent="teal">
            <SectionBody>
              <SectionHeader>
                <SectionIcon>
                  <PaymentsOutlinedIcon fontSize="small" />
                </SectionIcon>
                <SectionHeading>
                  <SectionTitle>Параметры выплат</SectionTitle>
                  <SectionSubtitle>Настройте условия договора</SectionSubtitle>
                </SectionHeading>
              </SectionHeader>

              <PaymentScheduleInputs>
                <InputGroup>
                  <InputLabel>Первоначальный взнос</InputLabel>
                  <ContributionSegmented role="group" aria-label="Формат первоначального взноса">
                    <ContributionButton
                      type="button"
                      $active={initialPaymentMode === "percent"}
                      onClick={() => setInitialPaymentMode("percent")}
                      aria-pressed={initialPaymentMode === "percent"}
                    >
                      В процентах
                    </ContributionButton>
                    <ContributionButton
                      type="button"
                      $active={initialPaymentMode === "amount"}
                      onClick={() => setInitialPaymentMode("amount")}
                      aria-pressed={initialPaymentMode === "amount"}
                    >
                      В рублях
                    </ContributionButton>
                  </ContributionSegmented>
                  {initialPaymentMode === "percent" ? (
                    <SuffixInput>
                      <CustomInput
                        inputType="number"
                        placeholder="0"
                        value={initialPaymentPercent}
                        onChange={handlePercentChange}
                        max={100}
                      />
                      <InputSuffix>%</InputSuffix>
                    </SuffixInput>
                  ) : (
                    <CustomInput
                      inputType="rubles"
                      placeholder="0 ₽"
                      value={initialPaymentAmount}
                      onChange={handleAmountChange}
                      disabled={totalSum <= 0}
                    />
                  )}
                </InputGroup>
                <InputGroup>
                  <InputLabel>Сумма</InputLabel>
                  <ReadOnlyAmount>{initialPaymentAmount || "0 ₽"}</ReadOnlyAmount>
                </InputGroup>
                <InputGroup>
                  <InputRow>
                    <InputLabel style={{ flex: 1 }}>Месяцев</InputLabel>
                    <InputLabel style={{ flex: 1 }}>Начало выплат</InputLabel>
                  </InputRow>
                  <InputRow>
                    <CustomInput
                      inputType="number"
                      placeholder="Месяцев"
                      value={months}
                      onChange={(e) =>
                        setMonths(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      onBlur={(e) => handleMonthsBlur(e.target.value)}
                      style={{ flex: 1 }}
                      min="1"
                      max="60"
                    />
                    <DateModalInput
                      onChange={(e) => setStartPaymentDate(e)}
                      value={startPaymentDate}
                    />
                  </InputRow>
                </InputGroup>

                {submitError && (
                  <SubmitErrorBanner role="alert" aria-live="assertive">
                    <SubmitErrorIcon aria-hidden="true">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 1.667a8.333 8.333 0 1 0 0 16.666 8.333 8.333 0 0 0 0-16.666Zm0 4.166a.833.833 0 0 1 .833.834v3.333a.833.833 0 1 1-1.666 0V6.667A.833.833 0 0 1 10 5.833Zm0 8.334a1.042 1.042 0 1 1 0-2.084 1.042 1.042 0 0 1 0 2.084Z"
                          fill="currentColor"
                        />
                      </svg>
                    </SubmitErrorIcon>
                    <SubmitErrorContent>
                      <SubmitErrorTitle>
                        {isEditMode
                          ? "Не удалось сохранить изменения"
                          : "Не удалось создать договор"}
                      </SubmitErrorTitle>
                      <SubmitErrorMessage>{submitError}</SubmitErrorMessage>
                    </SubmitErrorContent>
                    <SubmitErrorClose
                      type="button"
                      onClick={() => setSubmitError(null)}
                      aria-label="Закрыть сообщение об ошибке"
                    >
                      ×
                    </SubmitErrorClose>
                  </SubmitErrorBanner>
                )}

                <ButtonWrapper>
                  <GrayButton onClick={() => navigate(-1)}>Отменить</GrayButton>
                  <DarkCyanButton
                    style={{ marginRight: "auto" }}
                    disabled={
                      !isFormValid || isScheduleLoading || isCreditLoading
                    }
                    onClick={handleCreateOrUpdateCredit}
                  >
                    {isScheduleLoading || isCreditLoading
                      ? "Загрузка..."
                      : isEditMode
                      ? "Сохранить изменения"
                      : "Создать договор"}
                  </DarkCyanButton>
                </ButtonWrapper>
              </PaymentScheduleInputs>
            </SectionBody>
          </PaymentParamsCard>

          <PaymentScheduleCard $accent="teal">
            <SectionBody>
              <SectionHeader>
                <SectionIcon>
                  <CalendarMonthOutlinedIcon fontSize="small" />
                </SectionIcon>
                <SectionTitle>График выплат</SectionTitle>
              </SectionHeader>
              <PaymentScheduleTableWrapper>
                <PaymentScheduleTable
                  data={paymentSchedule}
                  isLoading={isScheduleLoading}
                />
              </PaymentScheduleTableWrapper>
            </SectionBody>
          </PaymentScheduleCard>
        </PaymentRow>
      </ContentStack>

      <ClientSelectModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSubmit={handleSelectClient}
        title="Выбор покупателя"
      />

      <ClientSelectModal
        isOpen={isGuarantorClientModalOpen}
        onClose={() => setIsGuarantorClientModalOpen(false)}
        onSubmit={handleSelectClient}
        title="Выбор поручителя"
        createTitle="Создание поручителя"
        namePlaceholder="ФИО поручителя"
      />

      <InvestorSelectModal
        isOpen={isInvestorModalOpen}
        onClose={() => setIsInvestorModalOpen(false)}
        onSubmit={handleSelectInvestor}
        includePools={true}
      />
    </PageLayout>
  );
};

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 16px;
  min-width: 0;
`;

const StickySummaryBar = styled.div`
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: stretch;
  gap: 12px;
  padding: 8px 0 10px;
  margin: 0 0 12px;
  background-color: rgba(249, 250, 250, 1);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
`;

const HeaderActions = styled.div`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;

  & > button {
    margin: 0;
    height: 48px;
    padding: 0 18px;
    border-radius: 14px;
    background: #eef1f5;
    color: #475467;
    font-size: 14px;
  }
`;

const SummaryGrid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  min-width: 0;
`;

type SummaryVariant = "default" | "danger";
type SummaryAccent = "default" | "info" | "danger";

const summaryCardPalette: Record<
  SummaryVariant,
  { bg: string; border: string }
> = {
  default: { bg: "#FFFFFF", border: "#E2E8F0" },
  danger: { bg: "#FFF5F5", border: "#FECACA" },
};

const summaryIconPalette: Record<SummaryAccent, { bg: string; color: string }> =
  {
    default: { bg: "rgba(0, 125, 136, 0.1)", color: "#007D88" },
    info: { bg: "rgba(59, 130, 246, 0.1)", color: "#2563EB" },
    danger: { bg: "rgba(239, 68, 68, 0.1)", color: "#B71C1C" },
  };

const SummaryCard = styled.div<{ $variant?: SummaryVariant }>`
  display: flex;
  align-items: center;
  min-height: 78px;
  box-sizing: border-box;
  gap: 10px;
  padding: 10px 14px;
  background-color: ${({ $variant = "default" }) =>
    summaryCardPalette[$variant].bg};
  border: 1px solid
    ${({ $variant = "default" }) => summaryCardPalette[$variant].border};
  border-radius: 10px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }
`;

const SummaryIcon = styled.div<{ $accent?: SummaryAccent }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
  background-color: ${({ $accent = "default" }) =>
    summaryIconPalette[$accent].bg};
  color: ${({ $accent = "default" }) => summaryIconPalette[$accent].color};

  svg {
    font-size: 20px;
  }
`;

const SummaryItemBody = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const SummaryLabel = styled.span`
  font-size: 11px;
  color: #667085;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 1px;
`;

const SummaryValue = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #101828;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ContentStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
`;

const accentBarPalette: Record<"teal" | "orange" | "gray", string> = {
  teal: "#007D88",
  orange: "#F5A623",
  gray: "#CBD5E1",
};

const SectionCard = styled.section<{ $accent?: "teal" | "orange" | "gray" }>`
  display: flex;
  gap: 20px;
  padding: 18px 20px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  align-items: stretch;
  min-width: 0;
  flex: 1;
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.025);
`;

const TopDetailsCard = styled.section`
  display: flex;
  align-items: stretch;
  gap: 24px;
  min-width: 0;
  padding: 18px 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.025);
`;

const TopDetailsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  width: 100%;
  min-width: 0;

  @media (max-width: 1280px) {
    flex-wrap: wrap;
  }
`;

const TopField = styled.div<{ $basis: string }>`
  flex: 0 1 ${({ $basis }) => $basis};
  width: ${({ $basis }) => $basis};
  min-width: 210px;

  @media (max-width: 1280px) {
    flex: 1 1 280px;
    width: auto;
  }
`;

const TopDebtSetting = styled.div<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  height: 46px;
  padding: 0 14px;
  box-sizing: border-box;
  border: 1px solid ${({ $active }) => ($active ? "#7AC4CA" : "#CBD5E1")};
  border-radius: 9px;
  background-color: ${({ $active }) =>
    $active ? "rgba(0, 125, 136, 0.08)" : "#F8FAFC"};
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover {
    border-color: #7ac4ca;
    background-color: rgba(0, 125, 136, 0.06);
  }

  & > div {
    align-items: center;
    width: auto;
  }

  & > div > div {
    margin-top: 0;
  }

  & span {
    color: #344054;
    font-size: 14px;
    line-height: 1;
    white-space: nowrap;
  }

  @media (max-width: 1280px) {
    flex: 0 0 auto;
  }
`;

const SectionAccentBar = styled.div<{ $accent?: "teal" | "orange" | "gray" }>`
  width: 4px;
  align-self: stretch;
  flex-shrink: 0;
  border-radius: 2px;
  background-color: ${({ $accent = "teal" }) => accentBarPalette[$accent]};
`;

const SectionBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-width: 0;
`;

const SectionTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const sectionIconPalette: Record<
  "teal" | "orange" | "gray",
  { bg: string; color: string }
> = {
  teal: { bg: "rgba(0, 125, 136, 0.1)", color: "#007D88" },
  orange: { bg: "rgba(245, 166, 35, 0.12)", color: "#B45309" },
  gray: { bg: "#F1F5F9", color: "#475569" },
};

const SectionIcon = styled.span<{ $accent?: "teal" | "orange" | "gray" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background-color: ${({ $accent = "teal" }) => sectionIconPalette[$accent].bg};
  color: ${({ $accent = "teal" }) => sectionIconPalette[$accent].color};
`;

const SectionTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #000;
`;

const SectionHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SectionSubtitle = styled.div`
  color: #7b8aa5;
  font-size: 12px;
  font-weight: 400;
`;

const SectionOptional = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: rgba(80, 85, 92, 1);
  margin-left: 4px;
`;

const PersonRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;

  @media (min-width: 992px) {
    flex-direction: row;
  }
`;

const TotalSumRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 20px;
  border-top: 1px solid #e4e7ec;
`;

const TotalSumGroup = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const TotalSumLabel = styled.span`
  font-size: 14px;
  color: rgba(80, 85, 92, 1);
`;

const TotalSumValue = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: #101828;
`;

const ProductSettings = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;

  & > * {
    min-height: 44px;
    padding: 0 24px;
    border-left: 1px solid #e4e7ec;
  }

  @media (max-width: 820px) {
    width: 100%;
    margin-left: 0;
    flex-wrap: wrap;
    gap: 16px;

    & > * {
      padding: 0;
      border-left: 0;
    }
  }
`;

const RoundingControl = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 18px;
`;

const RoundingCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const RoundingLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #475467;
`;

const RoundingHint = styled.span`
  font-size: 11px;
  color: #98a2b3;
  white-space: nowrap;
`;

const InfoBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border: 1px solid #667085;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  color: #667085;
`;

const SwitchButton = styled.button<{ $active: boolean }>`
  position: relative;
  width: 42px;
  min-width: 42px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "#168b96" : "#d0d5dd")};
  cursor: pointer;
  transition: background-color 0.2s ease;

  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16);
    transform: translateX(${({ $active }) => ($active ? "18px" : "0")});
    transition: transform 0.2s ease;
  }

  &:focus-visible {
    outline: 2px solid rgba(22, 139, 150, 0.35);
    outline-offset: 2px;
  }
`;

const PaymentControl = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PaymentLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #667085;
  white-space: nowrap;
`;

const Segmented = styled.div`
  display: inline-flex;
  padding: 3px;
  background: #f2f4f7;
  border: 1px solid #e4e7ec;
  border-radius: 10px;
`;

const SegmentedButton = styled.button<{ $active: boolean }>`
  height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: 7px;
  background: ${({ $active }) => ($active ? "#ffffff" : "transparent")};
  color: ${({ $active }) => ($active ? "#147d87" : "#667085")};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.15s ease;
  box-shadow: ${({ $active }) =>
    $active
      ? "0 1px 2px rgba(16, 24, 40, 0.08), 0 0 0 1px rgba(16, 24, 40, 0.02)"
      : "none"};

  &:hover {
    color: ${({ $active }) => ($active ? "#147d87" : "#344054")};
  }

  &:focus-visible {
    outline: 2px solid rgba(22, 139, 150, 0.35);
  }
`;

const MarkupPillContainer = styled.div`
  display: inline-flex;
  padding: 3px;
  background-color: #f2f4f7;
  border: 1px solid #dbe2ea;
  border-radius: 999px;
`;

const MarkupPill = styled.button<{ $active: boolean }>`
  min-width: 54px;
  height: 32px;
  padding: 0 12px;
  border: none;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "#078d99" : "transparent")};
  color: ${({ $active }) => ($active ? "#FFFFFF" : "#475569")};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? "#007D88" : "rgba(0, 125, 136, 0.08)"};
    color: ${({ $active }) => ($active ? "#FFFFFF" : "#007D88")};
  }

  &:focus-visible {
    outline: 2px solid #007d88;
    outline-offset: 2px;
  }
`;

const ProductsTableWrapper = styled.div`
  overflow-x: auto;
`;

const EntitySelectWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WideEntitySelectWrapper = styled(EntitySelectWrapper)`
  & input {
    min-height: 46px;
    padding: 0 44px 0 14px;
    border-color: #cbd5e1;
    border-radius: 7px;
  }

  & > div > button {
    width: 46px;
    height: 46px;
    margin-left: 10px;
    padding: 0;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
  }
`;

const CompactField = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;

  & > svg {
    position: absolute;
    left: 14px;
    z-index: 2;
    color: #667085;
    pointer-events: none;
  }

  & > div {
    width: 100%;
  }

  & input {
    min-height: 46px;
    padding-left: 44px !important;
    border-color: #cbd5e1 !important;
    border-radius: 7px !important;
    color: #344054;
  }

  & ${EntitySelectWrapper} input {
    height: 46px;
    box-sizing: border-box;
  }

  & ${EntitySelectWrapper} > div > button {
    width: 46px;
    height: 46px;
    margin-left: 8px;
    padding: 0;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
  }
`;


const SubmitErrorBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  margin: 0 5px 12px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 4px solid #dc2626;
  border-radius: 8px;
  color: #7f1d1d;
  font-size: 14px;
  line-height: 1.45;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  animation: submitErrorSlideIn 180ms ease-out;

  @keyframes submitErrorSlideIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const SubmitErrorIcon = styled.span`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626;
  margin-top: 1px;
`;

const SubmitErrorContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const SubmitErrorTitle = styled.div`
  font-weight: 600;
  color: #991b1b;
  margin-bottom: 2px;
`;

const SubmitErrorMessage = styled.div`
  color: #7f1d1d;
  word-wrap: break-word;
`;

const SubmitErrorClose = styled.button`
  flex-shrink: 0;
  background: none;
  border: none;
  color: #991b1b;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  transition: background-color 120ms ease;

  &:hover {
    background-color: rgba(220, 38, 38, 0.1);
  }

  &:focus-visible {
    outline: 2px solid #dc2626;
    outline-offset: 1px;
  }
`;

const DateInputWrapper = styled.div`
  width: 100%;
  min-width: 0;

  & > div > div:first-child {
    height: 46px;
    max-height: 46px;
    box-sizing: border-box;
    border-color: #cbd5e1;
    border-radius: 7px;
  }
`;

const ButtonWrapper = styled.div`
  margin-top: 8px;
  display: flex;
  gap: 10px;

  & > button {
    height: 42px;
    padding: 0 18px;
    border-radius: 9px;
    flex: 1;
    margin: 0 !important;
    font-size: 14px;
  }

  & > button:first-child {
    flex: 0.75;
    background: #f0f2f5;
    color: #475467;
  }

  & > button:last-child {
    flex: 1.25;
    padding: 0 20px;
    background: #168b96;
    color: #ffffff;
    font-weight: 500;
  }
`;

const PaymentRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: stretch;

  @media (min-width: 992px) {
    flex-direction: row;
  }
`;

const PaymentParamsCard = styled(SectionCard)`
  @media (min-width: 992px) {
    flex: 0 0 410px;
  }
`;

const PaymentScheduleCard = styled(SectionCard)`
  @media (min-width: 992px) {
    flex: 1;
    min-width: 0;
  }
`;

const PaymentScheduleInputs = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const PaymentScheduleTableWrapper = styled.div`
  flex: 1;
  overflow-x: auto;
  width: 100%;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ContributionSegmented = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #e4e7ec;
  border-radius: 9px;
  overflow: hidden;
  background: #f8fafc;
`;

const ContributionButton = styled.button<{ $active: boolean }>`
  height: 38px;
  padding: 0 12px;
  border: 0;
  border-right: 1px solid #e4e7ec;
  background: ${({ $active }) =>
    $active ? "rgba(22, 139, 150, 0.08)" : "transparent"};
  color: ${({ $active }) => ($active ? "#147d87" : "#667085")};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:last-child {
    border-right: 0;
  }

  &:focus-visible {
    position: relative;
    outline: 2px solid rgba(22, 139, 150, 0.35);
    outline-offset: -2px;
  }
`;

const SuffixInput = styled.div`
  position: relative;

  & input {
    padding-right: 36px;
  }
`;

const InputSuffix = styled.span`
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  color: #667085;
  font-size: 14px;
  pointer-events: none;
`;

const ReadOnlyAmount = styled.div`
  display: flex;
  align-items: center;
  min-height: 38px;
  padding: 5px 15px;
  border: 1px solid #d0d5dd;
  border-radius: 7px;
  background: #ffffff;
  color: #101828;
  font-size: 14px;
`;

const InputLabel = styled.label`
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-right: auto;
  text-align: left;
  margin-bottom: 0;
  padding-bottom: 0;
`;

const InputRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 0;
  padding-bottom: 0;
  width: 100%;

  @media (min-width: 576px) {
    flex-direction: row;
    width: 100%;
    max-width: 440px;
  }
`;

export default NewCreditPage;
