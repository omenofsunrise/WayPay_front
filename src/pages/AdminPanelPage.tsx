import { useAuth } from "../сontext/AuthContext";
import PageLayout from "../components/ui/Layouts/PageLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CustomTable, {
  type RowStyle,
  type Column,
} from "../components/ui/tables/CustomTable";
import { useState, useCallback, useEffect, useRef } from "react";
import useCompany from "../api/hooks/useCompany";
import CompanyModal, {
  type CompanyModalData,
} from "../components/modal/CrudInherited/CompanyModal";
import type { Company, SubscriptionStatistic } from "../api/types/company";
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import BaseModal from "../components/modal/BASE/modalCRUBase";
import CustomInput from "../components/ui/fields/CustomInput";
import { formatDate } from "../utils/dateFormatter";
import { formatPhoneHref } from "../utils/phoneUtils";
import PhoneLink from "../components/ui/links/PhoneLink";
import CustomPhoneInput from "../components/ui/fields/PhoneInput";
import Pagination from "../components/ui/fields/CustomPagination";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import useAdminPanel from "../api/hooks/useAdminPanel";
import {
  NotificationType,
  type SendNotificationRequest,
} from "../api/types/notification";
import styled from "styled-components";
import { useEmployee } from "../api/hooks/useEmployee";
import CreditApplicationCompaniesManager from "../components/CreditApplicationCompaniesManager";
import BroadcastCampaignsManager from "../components/AdminPanel/BroadcastCampaignsManager";
import ToggleSwitch from "../components/ui/Toggles/ToggleSwitch";

const SALES_MODE_STORAGE_KEY = "adminSalesMode";

const PaymentType = {
  ACQUIRING: 0,
  CASH: 1,
  FREE: 2,
} as const;

type PaymentTypeValue = (typeof PaymentType)[keyof typeof PaymentType];

const formatCurrency = (cost: number): string => {
  const rubles = cost / 100;
  return `${new Intl.NumberFormat("ru-RU").format(rubles)} ₽`;
};

const formatDateTime = (date?: Date | string): string => {
  if (!date) return "Нет данных";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Нет данных";

  return parsed.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPeriodDays = (startAt: string, endAt: string): number => {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(
    0,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
};

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    days: number,
    cost: number,
    paymentType: PaymentTypeValue
  ) => void;
  companyName: string;
  isSubmitting: boolean;
}

const SubscriptionModal = ({
  isOpen,
  onClose,
  onConfirm,
  companyName,
  isSubmitting,
}: SubscriptionModalProps) => {
  const [days, setDays] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [paymentType, setPaymentType] = useState<PaymentTypeValue>(
    PaymentType.CASH
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericDays = parseInt(days);
    const numericCost = parseInt(cost);

    if (isNaN(numericDays) || numericDays <= 0) {
      alert("Количество дней должно быть больше 0");
      return;
    }

    if (
      paymentType === PaymentType.CASH &&
      (isNaN(numericCost) || numericCost <= 0)
    ) {
      alert("При оплате наличными сумма должна быть больше 0");
      return;
    }

    if (paymentType === PaymentType.FREE) {
      onConfirm(numericDays, 0, paymentType);
    } else {
      onConfirm(numericDays, numericCost * 100, paymentType);
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title={`Добавление подписки для: ${companyName}`}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              color: "black",
            }}
          >
            Тип оплаты:
          </label>
          <select
            value={paymentType}
            onChange={(e) =>
              setPaymentType(parseInt(e.target.value) as PaymentTypeValue)
            }
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
              backgroundColor: "white",
              color: "black",
              borderRadius: "4px",
            }}
          >
            <option value={PaymentType.CASH}>Наличные</option>
            <option value={PaymentType.FREE}>Бесплатно по акции</option>
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              color: "black",
            }}
          >
            Количество дней:
          </label>
          <CustomInput
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="Введите количество дней"
            min="1"
          />
        </div>

        {paymentType === PaymentType.CASH && (
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
                color: "black",
              }}
            >
              Стоимость (₽):
            </label>
            <CustomInput
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="Введите стоимость"
              min="0"
            />
          </div>
        )}
      </div>
    </BaseModal>
  );
};

interface Tab {
  id: string;
  label: string;
  content?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  addButton?: React.ReactNode;
}

const LocalTabs = ({ tabs, activeTab, onChange, addButton }: TabsProps) => {
  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <>
      <TabsContainer>
        <TabsList>
          {tabs.map((tab) => (
            <TabItem
              key={tab.id}
              $isActive={activeTab === tab.id}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
              {activeTab === tab.id && <ActiveTabIndicator />}
            </TabItem>
          ))}
          {addButton && <AddButtonContainer>{addButton}</AddButtonContainer>}
        </TabsList>
      </TabsContainer>

      {activeTabContent && (
        <TabContentContainer>{activeTabContent}</TabContentContainer>
      )}
    </>
  );
};

const TabsContainer = styled.div`
  width: 100%;
  border-bottom: 1px solid rgba(209, 213, 219, 1);
  margin-bottom: 20px;
`;

const TabsList = styled.ul`
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 24px;
  align-items: center;
`;

const TabItem = styled.li<{ $isActive: boolean }>`
  position: relative;
  padding: 12px 0;
  cursor: pointer;
  font-size: 14px;
  font-weight: ${(props) => (props.$isActive ? "600" : "400")};
  color: ${(props) =>
    props.$isActive ? "rgba(0, 125, 136, 1)" : "rgba(107, 114, 128, 1)"};
  transition: all 0.2s ease;

  &:hover {
    color: rgba(0, 125, 136, 0.8);
  }
`;

const ActiveTabIndicator = styled.div`
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: rgba(0, 125, 136, 1);
  border-radius: 2px 2px 0 0;
`;

const AddButtonContainer = styled.li`
  margin-left: auto;
  padding: 4px 0;
`;

const TabContentContainer = styled.div`
  margin-top: 20px;
`;

interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  partnerName: string;
  isSubmitting: boolean;
}

const PayoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  partnerName,
  isSubmitting,
}: PayoutModalProps) => {
  const [amount, setAmount] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert("Сумма должна быть больше 0");
      return;
    }
    onConfirm(numericAmount);
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title={`Выплата партнеру: ${partnerName}`}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div style={{ padding: "20px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "bold",
            color: "black",
          }}
        >
          Сумма выплаты (₽):
        </label>
        <CustomInput
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Введите сумму"
        />
      </div>
    </BaseModal>
  );
};

interface CompanyCabinetModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  statistics: SubscriptionStatistic[];
  isLoading: boolean;
  error: string | null;
  isPartner: boolean;
  salesMode: boolean;
}

const CompanyCabinetModal = ({
  isOpen,
  onClose,
  company,
  statistics,
  isLoading,
  error,
  isPartner,
  salesMode,
}: CompanyCabinetModalProps) => {
  if (!isOpen || !company) return null;

  const paidSubscriptions = statistics.filter((item) => !item.isFree);
  const freeSubscriptions = statistics.filter((item) => item.isFree);
  const giftedDays = freeSubscriptions.reduce(
    (sum, item) => sum + getPeriodDays(item.startAt, item.endAt),
    0
  );
  const paidTotal = paidSubscriptions.reduce((sum, item) => sum + item.cost, 0);

  return (
    <BaseModal
      title={`Личный кабинет: ${company.name}`}
      onClose={onClose}
      onCancel={onClose}
      mode="view"
      hideCanselButton
      width="900px"
      maxHeight="92vh"
    >
      <CabinetContent>
        <CabinetSection>
          <CabinetSectionTitle>Данные компании</CabinetSectionTitle>
          <CabinetGrid>
            <CabinetItem>
              <CabinetLabel>ID</CabinetLabel>
              <CabinetValue>#{company.id}</CabinetValue>
            </CabinetItem>
            <CabinetItem>
              <CabinetLabel>{isPartner ? "Партнер" : "Компания"}</CabinetLabel>
              <CabinetValue>{company.name || "Нет данных"}</CabinetValue>
            </CabinetItem>
            <CabinetItem>
              <CabinetLabel>Директор</CabinetLabel>
              <CabinetValue>{company.chief || "Нет данных"}</CabinetValue>
            </CabinetItem>
            <CabinetItem>
              <CabinetLabel>Телефон</CabinetLabel>
              <CabinetValue>
                {company.phone ? (
                  <PhoneLink href={formatPhoneHref(company.phone)}>
                    {company.phone}
                  </PhoneLink>
                ) : (
                  "Нет данных"
                )}
              </CabinetValue>
            </CabinetItem>
            {!isPartner && (
              <>
                <CabinetItem>
                  <CabinetLabel>Лицензия до</CabinetLabel>
                  <CabinetValue>
                    {company.licenceDate
                      ? formatDate(company.licenceDate)
                      : "Нет данных"}
                  </CabinetValue>
                </CabinetItem>
                <CabinetItem>
                  <CabinetLabel>Договоров за 10 дней</CabinetLabel>
                  <CabinetValue>
                    {company.createdCreditsCount ?? 0}
                  </CabinetValue>
                </CabinetItem>
                <CabinetItem>
                  <CabinetLabel>Договоров всего</CabinetLabel>
                  <CabinetValue>{company.totalCredits ?? 0}</CabinetValue>
                </CabinetItem>
              </>
            )}
            {isPartner && (
              <CabinetItem>
                <CabinetLabel>Баланс</CabinetLabel>
                <CabinetValue>
                  {formatCurrency((company.balance ?? 0) * 100)}
                </CabinetValue>
              </CabinetItem>
            )}
            {!salesMode && (
              <CabinetItem>
                <CabinetLabel>Последний вход</CabinetLabel>
                <CabinetValue>
                  {formatDateTime(company.lastActive)}
                </CabinetValue>
              </CabinetItem>
            )}
          </CabinetGrid>
        </CabinetSection>

        <CabinetSection>
          <CabinetSectionTitle>Итоги по подпискам</CabinetSectionTitle>
          <SummaryGrid>
            <SummaryItem>
              <CabinetLabel>Всего записей</CabinetLabel>
              <SummaryValue>{statistics.length}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <CabinetLabel>Платных продлений</CabinetLabel>
              <SummaryValue>{paidSubscriptions.length}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <CabinetLabel>Подаренных продлений</CabinetLabel>
              <SummaryValue>{freeSubscriptions.length}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <CabinetLabel>Подаренные дни</CabinetLabel>
              <SummaryValue>{giftedDays}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <CabinetLabel>Оплачено всего</CabinetLabel>
              <SummaryValue>{formatCurrency(paidTotal)}</SummaryValue>
            </SummaryItem>
          </SummaryGrid>
        </CabinetSection>

        <CabinetSection>
          <CabinetSectionTitle>История подписки</CabinetSectionTitle>
          {isLoading && (
            <CabinetMuted>Загрузка истории подписки...</CabinetMuted>
          )}
          {error && <CabinetError>{error}</CabinetError>}
          {!isLoading && !error && statistics.length === 0 && (
            <CabinetMuted>История подписки пока пустая</CabinetMuted>
          )}
          {!isLoading && statistics.length > 0 && (
            <CabinetTableWrapper>
              <CabinetTable>
                <thead>
                  <tr>
                    <th>Тип</th>
                    <th>Дни</th>
                    <th>Стоимость</th>
                    <th>Начало</th>
                    <th>Окончание</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.map((item) => {
                    const days = getPeriodDays(item.startAt, item.endAt);
                    return (
                      <tr key={item.id}>
                        <td>
                          <SubscriptionBadge $isFree={item.isFree}>
                            {item.isFree ? "Подарено" : item.type || "Оплата"}
                          </SubscriptionBadge>
                        </td>
                        <td>{days}</td>
                        <td>
                          {item.isFree ? "0 ₽" : formatCurrency(item.cost)}
                        </td>
                        <td>{formatDate(item.startAt)}</td>
                        <td>{formatDate(item.endAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </CabinetTable>
            </CabinetTableWrapper>
          )}
        </CabinetSection>
      </CabinetContent>
    </BaseModal>
  );
};

const CabinetContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 8px 4px 4px;
`;

const CabinetSection = styled.section`
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
`;

const CabinetSectionTitle = styled.h3`
  margin: 0 0 14px;
  color: #111827;
  font-size: 17px;
  line-height: 1.3;
  font-weight: 700;
`;

const CabinetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const CabinetItem = styled.div`
  min-width: 0;
  padding: 12px;
  border: 1px solid #eef0f3;
  border-radius: 8px;
  background: #f9fafb;
`;

const CabinetLabel = styled.div`
  margin-bottom: 5px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.3;
`;

const CabinetValue = styled.div`
  color: #111827;
  font-size: 15px;
  line-height: 1.35;
  font-weight: 600;
  overflow-wrap: anywhere;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryItem = styled(CabinetItem)`
  background: #f8fbfb;
`;

const SummaryValue = styled(CabinetValue)`
  color: #007d88;
`;

const CabinetMuted = styled.div`
  color: #6b7280;
  font-size: 14px;
  line-height: 1.4;
`;

const CabinetError = styled.div`
  color: #dc2626;
  font-size: 14px;
  line-height: 1.4;
`;

const CabinetTableWrapper = styled.div`
  max-height: 320px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const CabinetTable = styled.table`
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;

  th,
  td {
    padding: 11px 12px;
    border-bottom: 1px solid #f3f4f6;
    color: #374151;
    font-size: 13px;
    line-height: 1.35;
    text-align: left;
    white-space: nowrap;
  }

  th {
    position: sticky;
    top: 0;
    background: #ffffff;
    color: #6b7280;
    font-weight: 600;
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

const SearchBar = styled.div`
  max-width: 360px;
  margin-bottom: 16px;
`;

const SalesModeToggle = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 15px 20px 0 auto;
  font-size: 14px;
  color: rgba(80, 85, 92, 1);
  user-select: none;
`;

const SubscriptionBadge = styled.span<{ $isFree: boolean }>`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 3px 9px;
  border-radius: 999px;
  color: ${(props) => (props.$isFree ? "#92400e" : "#065f46")};
  background: ${(props) => (props.$isFree ? "#fef3c7" : "#d1fae5")};
  font-size: 12px;
  font-weight: 700;
`;

const AdminPanelPage = () => {
  const { hasRole } = useAuth();
  const [nameFilter, setNameFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [salesMode, setSalesMode] = useState<boolean>(
    () => localStorage.getItem(SALES_MODE_STORAGE_KEY) === "true"
  );
  const pageSize = 10;
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isLoading,
    error,
    company,
    companies,
    totalCount,
    getAllCompanies,
    createCompany,
    deleteCompany,
    changeLicenceDate,
    changePhone,
    getSubscriptionStatistics,
    payoutPartner,
  } = useCompany();

  const { updateDirectorFullname, setSelfCompany } = useEmployee();

  const {
    sendNotification,
    isLoading: isNotificationLoading,
    error: notificationError,
  } = useAdminPanel();

  const [activeTab, setActiveTab] = useState<
    | "companies"
    | "partners"
    | "credit-applications"
    | "notifications"
    | "broadcast"
  >("companies");

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyModalData | null>(null);

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isCompanyCabinetOpen, setIsCompanyCabinetOpen] = useState(false);
  const [isDirectorModalOpen, setIsDirectorModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [cabinetCompany, setCabinetCompany] = useState<Company | null>(null);
  const [cabinetStatistics, setCabinetStatistics] = useState<
    SubscriptionStatistic[]
  >([]);
  const [isCabinetStatisticsLoading, setIsCabinetStatisticsLoading] =
    useState(false);
  const [cabinetStatisticsError, setCabinetStatisticsError] = useState<
    string | null
  >(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [selectedPartnerName, setSelectedPartnerName] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [directorValue, setDirectorValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [notificationType, setNotificationType] = useState<NotificationType>(
    NotificationType.AllUsers
  );
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [targetId, setTargetId] = useState<string>("");
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  // Запоминаем режим продажи между сессиями
  useEffect(() => {
    localStorage.setItem(SALES_MODE_STORAGE_KEY, String(salesMode));
  }, [salesMode]);

  const loadCompanies = useCallback(
    async (isPartner: boolean = false, page: number = 1, search: string = nameFilter) => {
      await getAllCompanies(isPartner, page, pageSize, search || null);
    },
    [getAllCompanies, nameFilter, pageSize]
  );

  useEffect(() => {
    if (activeTab === "companies" || activeTab === "partners") {
      loadCompanies(activeTab === "partners", currentPage);
    }
  }, [loadCompanies, activeTab, currentPage]);

  const handleSearchChange = (value: string) => {
    setNameFilter(value);
    setCurrentPage(1);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadCompanies(activeTab === "partners", page);
  };

  const handleCreateCompany = () => {
    setModalMode("create");
    setSelectedCompany({
      phone: "",
      licenceDate: new Date(),
      chief: "",
      company: "",
    });
    setIsCompanyModalOpen(true);
  };

  const handleCreatePartner = () => {
    setModalMode("create");
    setSelectedCompany({
      phone: "",
      licenceDate: new Date("2099-12-31"),
      chief: "",
      company: "",
    });
    setIsCompanyModalOpen(true);
  };

  const handleOpenPhoneEdit = (companyId: number, currentPhone: string) => {
    setEditingCompanyId(companyId);
    setPhoneValue(currentPhone);
    setIsPhoneModalOpen(true);
  };

  const handleOpenSubscriptionAdd = (
    companyId: number,
    companyName: string
  ) => {
    setEditingCompanyId(companyId);
    setSelectedCompanyName(companyName);
    setIsSubscriptionModalOpen(true);
  };

  const handleOpenCompanyCabinet = async (companyId: number) => {
    const selected = companies.find((item) => item.id === companyId) || null;
    if (!selected) return;

    setCabinetCompany(selected);
    setCabinetStatistics([]);
    setCabinetStatisticsError(null);
    setIsCompanyCabinetOpen(true);
    setIsCabinetStatisticsLoading(true);

    const statistics = await getSubscriptionStatistics(companyId);
    if (statistics) {
      setCabinetStatistics(statistics);
    } else {
      setCabinetStatisticsError("Не удалось загрузить историю подписки");
    }

    setIsCabinetStatisticsLoading(false);
  };

  const handleOpenDirectorEdit = (
    companyId: number,
    currentDirector: string
  ) => {
    setEditingCompanyId(companyId);
    setDirectorValue(currentDirector);
    setIsDirectorModalOpen(true);
  };

  const handleOpenPayoutModal = (companyId: number, partnerName: string) => {
    setEditingCompanyId(companyId);
    setSelectedPartnerName(partnerName);
    setIsPayoutModalOpen(true);
  };

  const handleEnterCopany = (companyId: number) => {
    setSelfCompany(companyId);
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompanyId) return;

    setIsSaving(true);
    try {
      const success = await changePhone(editingCompanyId, phoneValue);
      if (success) {
        await loadCompanies(activeTab === "partners", currentPage);
        setIsPhoneModalOpen(false);
      } else {
        alert("Не удалось сохранить изменения");
      }
    } catch (err) {
      console.error("Ошибка при изменении телефона:", err);
      alert("Произошла ошибка при сохранении");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSubscription = async (
    days: number,
    cost: number,
    paymentType: PaymentTypeValue
  ) => {
    if (!editingCompanyId) return;

    setIsSaving(true);
    try {
      const success = await changeLicenceDate(
        editingCompanyId,
        days,
        cost,
        paymentType
      );
      if (success) {
        alert(`Подписка успешно добавлена!`);
        await loadCompanies(activeTab === "partners", currentPage);
        setIsSubscriptionModalOpen(false);
      } else {
        alert("Не удалось добавить подписку");
      }
    } catch (err) {
      console.error("Ошибка при добавлении подписки:", err);
      alert("Произошла ошибка при добавлении подписки");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDirector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompanyId) return;

    setIsSaving(true);
    try {
      await updateDirectorFullname(editingCompanyId, directorValue);
      await loadCompanies(activeTab === "partners", currentPage);
      setIsDirectorModalOpen(false);
    } catch (err) {
      console.error("Ошибка при изменении имени директора:", err);
      alert("Произошла ошибка при сохранении");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePayout = async (amount: number) => {
    if (!editingCompanyId) return;

    setIsSaving(true);
    try {
      await payoutPartner(editingCompanyId, amount);
      alert(`Выплата ${amount} ₽ успешно выполнена!`);
      await loadCompanies(true, currentPage);
      setIsPayoutModalOpen(false);
    } catch (err) {
      console.error("Ошибка при выплате:", err);
      alert("Произошла ошибка при выплате");
    } finally {
      setIsSaving(false);
    }
  };

  const isLicenseExpiringSoon = (
    licenceDate: Date | null | undefined
  ): boolean => {
    if (!licenceDate) return false;

    const today = new Date();
    const licenseEnd = new Date(licenceDate);
    const timeDiff = licenseEnd.getTime() - today.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    return daysDiff <= 30;
  };

  const isLicenseExpired = (licenceDate: Date | null | undefined): boolean => {
    if (!licenceDate) return false;

    const today = new Date();
    const licenseEnd = new Date(licenceDate);
    const timeDiff = licenseEnd.getTime() - today.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    return daysDiff <= 0;
  };

  const handleDeleteCompany = async (rowData: any[]) => {
    const [id, name] = rowData;

    if (!window.confirm("Вы уверены, что хотите удалить эту компанию?")) {
      return;
    }

    const userInput = prompt(
      `Для подтверждения удаления компании "${name}", введите её название:`
    );

    if (userInput === name) {
      try {
        await deleteCompany(Number(id));
        await loadCompanies(activeTab === "partners", currentPage);
      } catch (err) {
        console.error("Ошибка при удалении компании:", err);
        alert("Не удалось удалить компанию");
      }
    } else if (userInput !== null) {
      alert("Название компании не совпадает. Удаление отменено.");
    }
  };

  const handleSubmitCompany = async (data: CompanyModalData) => {
    try {
      if (modalMode === "create") {
        await createCompany({
          AdminPhone: data.phone,
          LicenceDate: data.licenceDate,
          AdminName: data.chief,
          CompanyName: data.company,
          IsPartner: activeTab === "partners",
        });
      }
      await loadCompanies(activeTab === "partners", currentPage);
      setIsCompanyModalOpen(false);
    } catch (err) {
      console.error("Ошибка при сохранении компании:", err);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      alert("Заполните заголовок и сообщение");
      return;
    }

    setIsSendingNotification(true);
    try {
      const notificationData: SendNotificationRequest = {
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        employeeId:
          notificationType === NotificationType.Single && targetId
            ? parseInt(targetId)
            : null,
        clientId: null,
        deviceToken: null,
        avatarPath: null,
      };

      await sendNotification(notificationData);
      alert("Рассылка отправлена успешно!");

      setNotificationTitle("");
      setNotificationMessage("");
      setTargetId("");
    } catch (err) {
      console.error("Ошибка при отправке рассылки:", err);
      alert("Произошла ошибка при отправке рассылки");
    } finally {
      setIsSendingNotification(false);
    }
  };

  const getTableColumns = (): Column[] => {
    if (activeTab === "partners") {
      const columns: Column[] = [
        { name: "ID", align: "right" },
        { name: "Название партнера", align: "left" },
        { name: "Директор", align: "left" },
        { name: "Телефон", align: "left" },
        { name: "Баланс (₽)", align: "right" },
      ];
      if (!salesMode) {
        columns.push({ name: "Последний заход в сеть", align: "right" });
      }
      return columns;
    }
    const columns: Column[] = [
      { name: "ID", align: "right" },
      { name: "Название компании", align: "left" },
      { name: "Директор", align: "left" },
      { name: "Телефон", align: "left" },
      { name: "Лицензия заканчивается", align: "right" },
      { name: "Договоров за последние 10 дней", align: "right" },
      { name: "Договоров всего", align: "right" },
    ];
    if (!salesMode) {
      columns.push({ name: "Последний заход в сеть", align: "right" });
    }
    return columns;
  };

  const formatLastActive = (lastActive?: Date) =>
    new Date(lastActive).toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const tableData = hasRole("суперадмин")
    ? companies.map((company) => {
        if (activeTab === "partners") {
          const row: React.ReactNode[] = [
            company.id.toString(),
            company.name,
            <span
              onClick={() => handleOpenDirectorEdit(company.id, company.chief)}
              style={{ cursor: "pointer", textDecoration: "underline" }}
            >
              {company.chief}
            </span>,
            <PhoneLink
              href={formatPhoneHref(company.phone)}
              onClick={() => handleOpenPhoneEdit(company.id, company.phone)}
            >
              {company.phone}
            </PhoneLink>,
            (company.balance?.toLocaleString() || "0") + "₽",
          ];
          if (!salesMode) {
            row.push(formatLastActive(company.lastActive));
          }
          return row;
        }
        const row: React.ReactNode[] = [
          company.id.toString(),
          company.name,
          <span
            onClick={() => handleOpenDirectorEdit(company.id, company.chief)}
            style={{ cursor: "pointer", textDecoration: "underline" }}
          >
            {company.chief}
          </span>,
          <PhoneLink
            href={formatPhoneHref(company.phone)}
            onClick={() => handleOpenPhoneEdit(company.id, company.phone)}
          >
            {company.phone}
          </PhoneLink>,
          company.licenceDate ? formatDate(company.licenceDate) : "Нет данных",
          company.createdCreditsCount,
          company.totalCredits,
        ];
        if (!salesMode) {
          row.push(formatLastActive(company.lastActive));
        }
        return row;
      })
    : company
    ? [
        [
          company.id.toString(),
          company.name,
          company.chief,
          company.phone,
          company.licenceDate ? formatDate(company.licenceDate) : "Нет данных",
        ],
      ]
    : [];

  const rowStyles = tableData.reduce((styles, rowData, index) => {
    const company = companies[index];

    if (
      activeTab !== "partners" &&
      company &&
      isLicenseExpiringSoon(company.licenceDate)
    ) {
      styles[index] = {
        backgroundColor: "#FFEBEE",
        color: "black",
        fontWeight: "normal",
      };
    }

    if (
      activeTab !== "partners" &&
      company &&
      isLicenseExpired(company.licenceDate)
    ) {
      styles[index] = {
        backgroundColor: "rgba(145, 104, 104, 1)",
        fontWeight: "normal",
      };
    }

    return styles;
  }, {} as Record<number, RowStyle>);

  const broadcastContent = <BroadcastCampaignsManager />;

  const tableActionsAll = hasRole("суперадмин")
    ? activeTab === "partners"
      ? [
          {
            label: "Личный кабинет",
            action: (rowData: any[]) =>
              handleOpenCompanyCabinet(Number(rowData[0])),
            color: "#007D88",
          },
          {
            label: "Зайти в компанию",
            action: (rowData: any[]) => handleEnterCopany(Number(rowData[0])),
            color: "#EF4444",
          },
          {
            label: "Добавить подписку",
            action: (rowData: any[]) =>
              handleOpenSubscriptionAdd(Number(rowData[0]), rowData[1]),
            color: "#10B981",
          },
          {
            label: "Выплатить",
            action: (rowData: any[]) =>
              handleOpenPayoutModal(Number(rowData[0]), rowData[1]),
            color: "#3B82F6",
          },
          {
            label: "Изм. директора",
            action: (rowData: any[]) =>
              handleOpenDirectorEdit(Number(rowData[0]), rowData[2]),
            color: "#3B82F6",
          },
          {
            label: "Изм. телефон",
            action: (rowData: any[]) =>
              handleOpenPhoneEdit(Number(rowData[0]), rowData[3]),
            color: "#3B82F6",
          },
          {
            label: "Удалить",
            action: handleDeleteCompany,
            color: "#EF4444",
          },
        ]
      : [
          {
            label: "Личный кабинет",
            action: (rowData: any[]) =>
              handleOpenCompanyCabinet(Number(rowData[0])),
            color: "#007D88",
          },
          {
            label: "Зайти в компанию",
            action: (rowData: any[]) => handleEnterCopany(Number(rowData[0])),
            color: "#EF4444",
          },
          {
            label: "Добавить подписку",
            action: (rowData: any[]) =>
              handleOpenSubscriptionAdd(Number(rowData[0]), rowData[1]),
            color: "#10B981",
          },
          {
            label: "Изм. директора",
            action: (rowData: any[]) =>
              handleOpenDirectorEdit(Number(rowData[0]), rowData[2]),
            color: "#3B82F6",
          },
          {
            label: "Изм. телефон",
            action: (rowData: any[]) =>
              handleOpenPhoneEdit(Number(rowData[0]), rowData[3]),
            color: "#3B82F6",
          },
          {
            label: "Удалить",
            action: handleDeleteCompany,
            color: "#EF4444",
          },
        ]
    : [];

  const tableActions = tableActionsAll.filter(
    (action) => !(salesMode && action.label === "Зайти в компанию")
  );

  const companiesContent = (
    <>
      {!isLoading && !error && (
        <>
          <SearchBar>
            <CustomInput
              inputType="text"
              placeholder="Поиск по названию или телефону"
              value={nameFilter}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </SearchBar>

          <CustomTable
            columns={getTableColumns()}
            data={tableData}
            rowStyles={rowStyles}
            contextMenuActions={tableActions}
            onRowDoubleClick={(rowData) =>
              handleOpenCompanyCabinet(Number(rowData[0]))
            }
          />

          <PaginationLayout>
            <CountInfoTitle total={totalCount} />

            <Pagination
              total={totalCount}
              current={currentPage}
              onChange={handlePageChange}
              itemsPerPage={pageSize}
            />
          </PaginationLayout>
        </>
      )}
    </>
  );

  const creditApplicationsContent = <CreditApplicationCompaniesManager />;

  const notificationsContent = (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <form onSubmit={handleSendNotification}>
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              color: "black",
              textAlign: "left",
            }}
          >
            Тип рассылки:
          </label>
          <select
            value={notificationType}
            onChange={(e) =>
              setNotificationType(parseInt(e.target.value) as NotificationType)
            }
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
              backgroundColor: "white",
              color: "black",
              borderRadius: "4px",
            }}
          >
            <option value={NotificationType.AllUsers}>
              Всем пользователям
            </option>
            <option value={NotificationType.Clients}>Клиентам</option>
            <option value={NotificationType.Employees}>Сотрудникам</option>
          </select>
        </div>

        <div style={{ margin: "0px", padding: "0" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              color: "black",
              textAlign: "left",
            }}
          >
            Заголовок уведомления:
          </label>
          <CustomInput
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            placeholder="Введите заголовок"
            required
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              color: "black",
              textAlign: "left",
            }}
          >
            Сообщение:
          </label>
          <textarea
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            placeholder="Введите текст сообщения"
            style={{
              width: "100%",
              minHeight: "120px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              resize: "vertical",
              color: "black",
              backgroundColor: "white",
            }}
            required
          />
        </div>

        <DarkCyanButton
          type="submit"
          disabled={isSendingNotification}
          style={{ width: "200px" }}
        >
          {isSendingNotification ? "Отправка..." : "Отправить рассылку"}
        </DarkCyanButton>

        {notificationError && (
          <div style={{ color: "red", marginTop: "10px" }}>
            Ошибка: {notificationError}
          </div>
        )}
      </form>
    </div>
  );

  const tabs = [
    {
      id: "companies",
      label: "Компании",
      content: companiesContent,
    },
    {
      id: "partners",
      label: "Партнёры",
      content: companiesContent,
    },
    {
      id: "credit-applications",
      label: "Заявкополучатели",
      content: creditApplicationsContent,
    },
    {
      id: "notifications",
      label: "Рассылка",
      content: notificationsContent,
    },
    {
      id: "broadcast",
      label: "Рекламные кампании",
      content: broadcastContent,
    },
  ];

  const addButton =
    activeTab === "companies" && hasRole("суперадмин") ? (
      <DarkCyanButton
        style={{ width: "15vw", maxHeight: "50px" }}
        onClick={handleCreateCompany}
      >
        + Новая компания
      </DarkCyanButton>
    ) : activeTab === "partners" && hasRole("суперадмин") ? (
      <DarkCyanButton
        style={{ width: "15vw", maxHeight: "50px" }}
        onClick={handleCreatePartner}
      >
        + Новый партнер
      </DarkCyanButton>
    ) : activeTab === "credit-applications" &&
      hasRole("суперадмин") ? null : null;

  if (!hasRole("суперадмин")) {
    return (
      <PageLayout>
        <TitleField>
          <CustomTitle>Моя компания</CustomTitle>
        </TitleField>
        {isLoading && <div>Загрузка...</div>}
        {error && <div>Ошибка: {error}</div>}
        {!isLoading && !error && company && (
          <CustomTable
            columns={[
              { name: "ID" },
              { name: "Название компании", align: "left" },
              { name: "Директор", align: "left" },
              { name: "Телефон", align: "left" },
              { name: "Лицензия заканчивается", align: "center" },
            ]}
            data={tableData}
          />
        )}
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <TitleField>
        <CustomTitle>Управление лицензиями</CustomTitle>
        <SalesModeToggle title="Скрывает данные, которые не должен видеть клиент рядом">
          Режим продажи
          <ToggleSwitch checked={salesMode} onChange={setSalesMode} />
        </SalesModeToggle>
      </TitleField>

      <LocalTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => {
          setActiveTab(
            tabId as
              | "companies"
              | "partners"
              | "notifications"
              | "credit-applications"
              | "broadcast"
          );
          setCurrentPage(1);
          setNameFilter("");
        }}
        addButton={addButton}
      />

      {isLoading && (activeTab === "companies" || activeTab === "partners") && (
        <div>Загрузка...</div>
      )}
      {error && (activeTab === "companies" || activeTab === "partners") && (
        <div>Ошибка: {error}</div>
      )}

      {isCompanyModalOpen && (
        <CompanyModal
          mode={modalMode}
          isOpen={isCompanyModalOpen}
          onClose={() => setIsCompanyModalOpen(false)}
          onSubmit={handleSubmitCompany}
          initialData={
            selectedCompany || {
              phone: "",
              licenceDate:
                activeTab === "partners" ? new Date("2099-12-31") : new Date(),
              chief: "",
              company: "",
            }
          }
        />
      )}

      {isPhoneModalOpen && (
        <BaseModal
          title="Изменение телефона"
          onClose={() => setIsPhoneModalOpen(false)}
          onCancel={() => setIsPhoneModalOpen(false)}
          onSave={handleSavePhone}
          isSubmitting={isSaving}
        >
          <CustomPhoneInput
            value={phoneValue}
            onChange={(e) => setPhoneValue(e)}
          />
        </BaseModal>
      )}

      {isSubscriptionModalOpen && (
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          onConfirm={handleSaveSubscription}
          companyName={selectedCompanyName}
          isSubmitting={isSaving}
        />
      )}

      <CompanyCabinetModal
        isOpen={isCompanyCabinetOpen}
        onClose={() => setIsCompanyCabinetOpen(false)}
        company={cabinetCompany}
        statistics={cabinetStatistics}
        isLoading={isCabinetStatisticsLoading}
        error={cabinetStatisticsError}
        isPartner={activeTab === "partners"}
        salesMode={salesMode}
      />

      {isDirectorModalOpen && (
        <BaseModal
          title="Изменение имени директора"
          onClose={() => setIsDirectorModalOpen(false)}
          onCancel={() => setIsDirectorModalOpen(false)}
          onSave={handleSaveDirector}
          isSubmitting={isSaving}
        >
          <CustomInput
            value={directorValue}
            onChange={(e) => setDirectorValue(e.target.value)}
          />
        </BaseModal>
      )}

      <PayoutModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        onConfirm={handlePayout}
        partnerName={selectedPartnerName}
        isSubmitting={isSaving}
      />
    </PageLayout>
  );
};

export default AdminPanelPage;