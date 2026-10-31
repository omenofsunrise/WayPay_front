import { useAuth } from "../сontext/AuthContext";
import PageLayout from "../components/ui/Layouts/PageLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CustomTable, {
  type RowStyle,
  type Column,
} from "../components/ui/tables/CustomTable";
import { useState, useCallback, useEffect } from "react";
import useCompany from "../api/hooks/useCompany";
import CompanyModal, {
  type CompanyModalData,
} from "../components/modal/CrudInherited/CompanyModal";
import type { Company, SubscriptionStatistic } from "../api/types/company";
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import BaseModal from "../components/modal/BASE/modalCRUBase";
import CustomInput from "../components/ui/fields/CustomInput";
import { formatDate } from "../utils/dateFormatter";
import { formatMoney } from "../utils/formatPrice";
import {
  formatPhoneHref,
  formatPhoneForSearch,
  maskSearchPhone,
} from "../utils/phoneUtils";
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
import UserSelect from "../components/ui/fields/UserSelect";
import CreditApplicationCompaniesManager from "../components/CreditApplicationCompaniesManager";
import BroadcastCampaignsManager from "../components/AdminPanel/BroadcastCampaignsManager";
import BlacklistPlusUsersManager from "../components/AdminPanel/BlacklistPlusUsersManager";
import TelegramCollectorManager from "../components/AdminPanel/TelegramCollectorManager";
import CustomTextArea from "../components/ui/fields/CustomTextArea";
import ToggleSwitch from "../components/ui/Toggles/ToggleSwitch";
import Tabs from "../components/ui/fields/Tabs";
import CustomSelect from "../components/ui/fields/CustomSelect";

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

const getLicenseStatus = (
  licenceDate: Date | null | undefined
): "expired" | "expiring" | "ok" => {
  if (!licenceDate) return "ok";
  const days =
    (new Date(licenceDate).getTime() - Date.now()) / (1000 * 3600 * 24);
  if (days <= 0) return "expired";
  if (days <= 30) return "expiring";
  return "ok";
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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numericDays = parseInt(days);
    const numericCost = parseInt(cost);

    if (isNaN(numericDays) || numericDays <= 0) {
      setError("Количество дней должно быть больше 0");
      return;
    }
    if (
      paymentType === PaymentType.CASH &&
      (isNaN(numericCost) || numericCost <= 0)
    ) {
      setError("При оплате наличными укажите сумму больше 0");
      return;
    }

    onConfirm(
      numericDays,
      paymentType === PaymentType.FREE ? 0 : numericCost * 100,
      paymentType
    );
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title={`Добавление подписки: ${companyName}`}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <ModalForm>
        <ModalField>
          <ModalLabel>Тип оплаты</ModalLabel>
          <CustomSelect
            value={paymentType}
            onChange={(e) => {
              setPaymentType(e.target.value as PaymentTypeValue);
              setError(null);
            }}
            options={[
              { value: PaymentType.CASH, label: "Наличные" },
              { value: PaymentType.FREE, label: "Бесплатно по акции" },
            ]}
          />
        </ModalField>

        <ModalField>
          <ModalLabel>Количество дней</ModalLabel>
          <CustomInput
            type="number"
            value={days}
            onChange={(e) => {
              setDays(e.target.value);
              setError(null);
            }}
            placeholder="Количество дней"
            min="1"
          />
        </ModalField>

        {paymentType === PaymentType.CASH && (
          <ModalField>
            <ModalLabel>Стоимость (₽)</ModalLabel>
            <CustomInput
              type="number"
              value={cost}
              onChange={(e) => {
                setCost(e.target.value);
                setError(null);
              }}
              placeholder="Сумма"
              min="0"
            />
          </ModalField>
        )}

        {error && <ModalError>{error}</ModalError>}
      </ModalForm>
    </BaseModal>
  );
};

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Укажите сумму больше 0");
      return;
    }
    onConfirm(numericAmount);
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title={`Выплата партнёру: ${partnerName}`}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <ModalForm>
        <ModalField>
          <ModalLabel>Сумма выплаты (₽)</ModalLabel>
          <CustomInput
            type="text"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            placeholder="Введите сумму"
          />
        </ModalField>
        {error && <ModalError>{error}</ModalError>}
      </ModalForm>
    </BaseModal>
  );
};

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  companyName: string;
  isSubmitting: boolean;
}

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  companyName,
  isSubmitting,
}: DeleteConfirmModalProps) => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue !== companyName) {
      setError("Название компании не совпадает");
      return;
    }
    onConfirm();
  };

  const handleClose = () => {
    setInputValue("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Удаление компании"
      onClose={handleClose}
      onCancel={handleClose}
      onSave={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <ModalForm>
        <ModalField>
          <ModalLabel>
            Для подтверждения введите название компании:{" "}
            <strong>{companyName}</strong>
          </ModalLabel>
          <CustomInput
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
            }}
            placeholder="Название компании"
          />
        </ModalField>
        {error && <ModalError>{error}</ModalError>}
      </ModalForm>
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
  const licenseStatus = !isPartner
    ? getLicenseStatus(company.licenceDate)
    : "ok";

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
                <CabinetItem
                  style={
                    licenseStatus === "expired"
                      ? { background: "#FEF2F2", borderColor: "#FECACA" }
                      : licenseStatus === "expiring"
                      ? { background: "#FFFBEB", borderColor: "#FDE68A" }
                      : undefined
                  }
                >
                  <CabinetLabel>Лицензия до</CabinetLabel>
                  <CabinetValue
                    style={
                      licenseStatus === "expired"
                        ? { color: "#991B1B" }
                        : licenseStatus === "expiring"
                        ? { color: "#92400E" }
                        : undefined
                    }
                  >
                    {company.licenceDate
                      ? formatDate(company.licenceDate)
                      : "Нет данных"}
                    {licenseStatus === "expired" && " — просрочена"}
                    {licenseStatus === "expiring" && " — скоро истекает"}
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
                  {formatMoney((company.balance ?? 0).toString())}
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

        {!isPartner && !isLoading && (
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
                <SummaryValue>
                  {formatMoney((paidTotal / 100).toString())}
                </SummaryValue>
              </SummaryItem>
            </SummaryGrid>
          </CabinetSection>
        )}

        {!isPartner && (
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
                            {item.isFree ? "—" : formatCurrency(item.cost)}
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
        )}
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

  tbody tr:hover td {
    background: #f9fafb;
  }
`;

const SearchBar = styled.div`
  max-width: 480px;
  margin-bottom: 16px;
`;

const SearchWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 11px;
  display: flex;
  align-items: center;
  pointer-events: none;
  z-index: 1;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 14px;
  padding: 2px 4px;
  line-height: 1;
  border-radius: 4px;
  transition: color 0.15s;

  &:hover {
    color: #374151;
  }
`;

const ModalForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 30px;
`;

const ModalField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ModalLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

const ModalError = styled.div`
  padding: 10px 12px;
  border-radius: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 13px;
`;

const LoadingText = styled.div`
  padding: 20px;
  color: #6b7280;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: "";
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #e5e7eb;
    border-top-color: #007d88;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
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
  color: ${(props) => (props.$isFree ? "#3730a3" : "#065f46")};
  background: ${(props) => (props.$isFree ? "#e0e7ff" : "#d1fae5")};
  font-size: 12px;
  font-weight: 700;
`;

const NotificationForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 500px;
  padding: 4px 0;
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Toast = styled.div<{ $type: "success" | "error" | "warning" }>`
  padding: 14px 20px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  min-width: 300px;
  max-width: 400px;
  background: ${(props) =>
    props.$type === "success"
      ? "#10b981"
      : props.$type === "error"
      ? "#ef4444"
      : "#f59e0b"};

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const AdminPanelPage = () => {
  const { hasRole, refresh } = useAuth();
  const [nameFilter, setNameFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [salesMode, setSalesMode] = useState<boolean>(
    () => localStorage.getItem(SALES_MODE_STORAGE_KEY) === "true"
  );
  const pageSize = 10;

  // Запоминаем режим продажи между сессиями
  useEffect(() => {
    localStorage.setItem(SALES_MODE_STORAGE_KEY, String(salesMode));
  }, [salesMode]);

  const handleSearchChange = (value: string) => {
    // телефоноподобный ввод форматируем в "8 (XXX) XXX-XX-XX" на лету,
    // текст с буквами (название) оставляем как есть
    setNameFilter(maskSearchPhone(value));
    setCurrentPage(1);
  };

  const [activeTab, setActiveTab] = useState<
    | "companies"
    | "partners"
    | "credit-applications"
    | "notifications"
    | "broadcast"
    | "blacklist-plus"
    | "telegram-blacklist"
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

  const [toasts, setToasts] = useState<
    { id: number; type: "success" | "error" | "warning"; message: string }[]
  >([]);

  const addToast = useCallback(
    (type: "success" | "error" | "warning", message: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState("");

  const [isCreditAppCreateOpen, setIsCreditAppCreateOpen] = useState(false);

  const [activeBroadcastTab, setActiveBroadcastTab] = useState<
    "campaigns" | "channels" | "chats"
  >("campaigns");
  const [isBroadcastCreateOpen, setIsBroadcastCreateOpen] = useState(false);
  const [broadcastRefreshTick, setBroadcastRefreshTick] = useState(0);

  const [notificationType, setNotificationType] = useState<NotificationType>(
    NotificationType.AllUsers
  );
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [targetId, setTargetId] = useState<string>("");
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  const {
    isLoading,
    error,
    company,
    companies,
    companiesTotalCount,
    getAllCompanies,
    createCompany,
    deleteCompany,
    changeLicenceDate,
    changePhone,
    getSubscriptionStatistics,
    payoutPartner,
  } = useCompany();

  const { updateDirectorFullname, setSelfCompany, fetchEmployees, employees } =
    useEmployee();

  const {
    sendNotification,
    isLoading: isNotificationLoading,
    error: notificationError,
  } = useAdminPanel();

  const loadCompanies = useCallback(
    async (isPartner: boolean = false) => {
      await getAllCompanies({
        partners: isPartner,
        page: currentPage,
        pageSize,
        // телефон приводим к формату базы "8 (XXX) XXX-XX-XX", остальное шлём как есть
        search: formatPhoneForSearch(nameFilter),
      });
    },
    [getAllCompanies, currentPage, nameFilter]
  );

  useEffect(() => {
    if (notificationType === NotificationType.Single && !employees) {
      fetchEmployees({ page: 1, pageSize: 200 });
    }
  }, [notificationType]);

  // Серверная пагинация/поиск: перезапрос при смене вкладки, страницы или поиска.
  // Поиск с дебаунсом, чтобы не слать запрос на каждый символ.
  useEffect(() => {
    if (activeTab !== "companies" && activeTab !== "partners") return;
    const isPartner = activeTab === "partners";
    const timeout = setTimeout(() => {
      loadCompanies(isPartner);
    }, 300);
    return () => clearTimeout(timeout);
  }, [loadCompanies, activeTab]);

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

  // Изменено: открытие модального окна для добавления подписки
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

  const handleEnterCopany = async (companyId: number) => {
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      localStorage.setItem(
        "enteredCompanyName",
        company.name || `#${companyId}`
      );
    }
    await setSelfCompany(companyId);
    await refresh();
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompanyId) return;

    setIsSaving(true);
    try {
      const success = await changePhone(editingCompanyId, phoneValue);
      if (success) {
        await loadCompanies(activeTab === "partners");
        setIsPhoneModalOpen(false);
      } else {
        addToast("error", "Не удалось сохранить изменения");
      }
    } catch (err) {
      console.error("Ошибка при изменении телефона:", err);
      addToast("error", "Произошла ошибка при сохранении");
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
        addToast("success", "Подписка успешно добавлена");
        await loadCompanies(activeTab === "partners");
        setIsSubscriptionModalOpen(false);
      } else {
        addToast("error", "Не удалось добавить подписку");
      }
    } catch (err) {
      console.error("Ошибка при добавлении подписки:", err);
      addToast("error", "Произошла ошибка при добавлении подписки");
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
      await loadCompanies(activeTab === "partners");
      setIsDirectorModalOpen(false);
    } catch (err) {
      console.error("Ошибка при изменении имени директора:", err);
      addToast("error", "Произошла ошибка при сохранении");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePayout = async (amount: number) => {
    if (!editingCompanyId) return;

    setIsSaving(true);
    try {
      await payoutPartner(editingCompanyId, amount);
      addToast("success", `Выплата ${amount} ₽ успешно выполнена`);
      await loadCompanies(true);
      setIsPayoutModalOpen(false);
    } catch (err) {
      console.error("Ошибка при выплате:", err);
      addToast("error", "Произошла ошибка при выплате");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCompany = (rowData: any[]) => {
    const [id, name] = rowData;
    setDeleteTargetId(Number(id));
    setDeleteTargetName(name as string);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsSaving(true);
    try {
      await deleteCompany(deleteTargetId);
      await loadCompanies(activeTab === "partners");
      setIsDeleteModalOpen(false);
      addToast("success", "Компания успешно удалена");
    } catch (err) {
      console.error("Ошибка при удалении компании:", err);
      addToast("error", "Не удалось удалить компанию");
    } finally {
      setIsSaving(false);
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
      loadCompanies(activeTab === "partners");
      setIsCompanyModalOpen(false);
    } catch (err) {
      console.error("Ошибка при сохранении компании:", err);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      addToast("warning", "Заполните заголовок и сообщение");
      return;
    }
    if (notificationType === NotificationType.Single && !targetId) {
      addToast("warning", "Выберите сотрудника");
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

      const ok = await sendNotification(notificationData);
      if (ok) {
        addToast("success", "Рассылка отправлена успешно");
        setNotificationTitle("");
        setNotificationMessage("");
        setTargetId("");
      } else {
        addToast("error", "Не удалось отправить рассылку");
      }
    } catch (err) {
      console.error("Ошибка при отправке рассылки:", err);
      addToast("error", "Произошла ошибка при отправке рассылки");
    } finally {
      setIsSendingNotification(false);
    }
  };

  // Пагинация и поиск выполняются на сервере (GET /Company/all?page&pageSize&search),
  // поэтому companies — это уже текущая страница; фильтровать/резать локально не нужно.
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
      { name: "Лицензия до", align: "right" },
      { name: "За 10 дней", align: "right" },
      { name: "Всего", align: "right" },
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
    });

  const tableData = hasRole("суперадмин")
    ? companies.map((company) => {
        if (activeTab === "partners") {
          const row: React.ReactNode[] = [
            company.id.toString(),
            company.name,
            company.chief,
            company.phone ? (
              <PhoneLink href={formatPhoneHref(company.phone)}>
                {company.phone}
              </PhoneLink>
            ) : (
              "Не указан"
            ),
            formatMoney((company.balance ?? 0).toString()),
          ];
          if (!salesMode) {
            row.push(formatLastActive(company.lastActive));
          }
          return row;
        }
        const row: React.ReactNode[] = [
          company.id.toString(),
          company.name,
          company.chief,
          company.phone ? (
            <PhoneLink href={formatPhoneHref(company.phone)}>
              {company.phone}
            </PhoneLink>
          ) : (
            "Не указан"
          ),
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
    if (activeTab === "partners") return styles;
    const company = companies[index];
    if (!company) return styles;
    const status = getLicenseStatus(company.licenceDate);
    if (status === "expiring") {
      styles[index] = {
        backgroundColor: "#FFFBEB",
        color: "#92400E",
        fontWeight: "normal",
      };
    } else if (status === "expired") {
      styles[index] = {
        backgroundColor: "#FEF2F2",
        color: "#991B1B",
        fontWeight: "normal",
      };
    }
    return styles;
  }, {} as Record<number, RowStyle>);

  const broadcastContent = (
    <BroadcastCampaignsManager
      activeTab={activeBroadcastTab}
      onTabChange={setActiveBroadcastTab}
      isCreateModalOpen={isBroadcastCreateOpen}
      setIsCreateModalOpen={setIsBroadcastCreateOpen}
      refreshChannelsTick={broadcastRefreshTick}
    />
  );

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
            color: "#6366F1",
          },
          {
            label: "Выплатить",
            action: (rowData: any[]) =>
              handleOpenPayoutModal(Number(rowData[0]), rowData[1]),
            color: "#3B82F6",
          },
          {
            label: "Изм. директора",
            action: (rowData: any[]) => {
              const company = companies.find(
                (c) => c.id === Number(rowData[0])
              );
              handleOpenDirectorEdit(Number(rowData[0]), company?.chief || "");
            },
            color: "#6B7280",
          },
          {
            label: "Изм. телефон",
            action: (rowData: any[]) => {
              const company = companies.find(
                (c) => c.id === Number(rowData[0])
              );
              handleOpenPhoneEdit(Number(rowData[0]), company?.phone || "");
            },
            color: "#6B7280",
          },
          {
            label: "Удалить",
            action: handleDeleteCompany,
            color: "#EF4444",
            dividerBefore: true,
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
            color: "#6366F1",
          },
          {
            label: "Добавить подписку",
            action: (rowData: any[]) =>
              handleOpenSubscriptionAdd(Number(rowData[0]), rowData[1]),
            color: "#10B981",
          },
          {
            label: "Изм. директора",
            action: (rowData: any[]) => {
              const company = companies.find(
                (c) => c.id === Number(rowData[0])
              );
              handleOpenDirectorEdit(Number(rowData[0]), company?.chief || "");
            },
            color: "#6B7280",
          },
          {
            label: "Изм. телефон",
            action: (rowData: any[]) => {
              const company = companies.find(
                (c) => c.id === Number(rowData[0])
              );
              handleOpenPhoneEdit(Number(rowData[0]), company?.phone || "");
            },
            color: "#6B7280",
          },
          {
            label: "Удалить",
            action: handleDeleteCompany,
            color: "#EF4444",
            dividerBefore: true,
          },
        ]
    : [];

  // В режиме продажи скрываем «Зайти в компанию», чтобы клиент рядом не видел вход в чужой аккаунт
  const tableActions = tableActionsAll.filter(
    (action) => !(salesMode && action.label === "Зайти в компанию")
  );

  const companiesContent = (
    <>
      <SearchBar>
        <SearchWrapper>
          <SearchIcon>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle
                cx="6.5"
                cy="6.5"
                r="5"
                stroke="#9CA3AF"
                strokeWidth="1.5"
              />
              <path
                d="M10.5 10.5L14 14"
                stroke="#9CA3AF"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </SearchIcon>
          <CustomInput
            inputType="text"
            placeholder="Поиск по номеру, названию или телефону"
            value={nameFilter}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ paddingLeft: "36px" }}
          />
          {nameFilter && (
            <ClearButton
              onClick={() => {
                setNameFilter("");
                setCurrentPage(1);
              }}
            >
              ✕
            </ClearButton>
          )}
        </SearchWrapper>
      </SearchBar>

      {!isLoading && !error && (
        <>
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
            <CountInfoTitle total={companiesTotalCount} />

            <Pagination
              total={companiesTotalCount}
              current={currentPage}
              onChange={setCurrentPage}
              itemsPerPage={pageSize}
            />
          </PaginationLayout>
        </>
      )}
    </>
  );

  const creditApplicationsContent = (
    <CreditApplicationCompaniesManager
      isCreateModalOpen={isCreditAppCreateOpen}
      setIsCreateModalOpen={setIsCreditAppCreateOpen}
    />
  );

  const notificationsContent = (
    <NotificationForm onSubmit={handleSendNotification}>
      <ModalField>
        <ModalLabel>Тип рассылки</ModalLabel>
        <CustomSelect
          value={notificationType}
          onChange={(e) =>
            setNotificationType(parseInt(e.target.value) as NotificationType)
          }
          options={[
            { value: NotificationType.AllUsers, label: "Всем пользователям" },
            { value: NotificationType.Clients, label: "Клиентам" },
            { value: NotificationType.Employees, label: "Сотрудникам" },
            { value: NotificationType.Single, label: "Одному пользователю" },
          ]}
          dropdownInPortal
        />
      </ModalField>

      {notificationType === NotificationType.Single && (
        <ModalField>
          <ModalLabel>Сотрудник</ModalLabel>
          <UserSelect
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="Выберите сотрудника"
            options={
              employees?.items.map((emp) => ({
                value: emp.id.toString(),
                label: emp.fullName,
                avatar: emp.photoPath,
              })) ?? []
            }
          />
        </ModalField>
      )}

      <ModalField>
        <ModalLabel>Заголовок уведомления</ModalLabel>
        <CustomInput
          value={notificationTitle}
          onChange={(e) => setNotificationTitle(e.target.value)}
          placeholder="Введите заголовок"
        />
      </ModalField>

      <ModalField>
        <ModalLabel>Сообщение</ModalLabel>
        <CustomTextArea
          value={notificationMessage}
          onChange={(e) => setNotificationMessage(e.target.value)}
          placeholder="Введите текст сообщения"
          rows={5}
        />
      </ModalField>

      {notificationError && (
        <ModalError>Ошибка: {notificationError}</ModalError>
      )}

      <DarkCyanButton
        type="submit"
        disabled={isSendingNotification}
        style={{ width: "200px" }}
      >
        {isSendingNotification ? "Отправка..." : "Отправить рассылку"}
      </DarkCyanButton>
    </NotificationForm>
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
    {
      id: "blacklist-plus",
      label: "ЧС+",
      content: <BlacklistPlusUsersManager />,
    },
    {
      id: "telegram-blacklist",
      label: "Telegram → ЧС+",
      content: <TelegramCollectorManager />,
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
    ) : activeTab === "credit-applications" && hasRole("суперадмин") ? (
      <DarkCyanButton
        style={{ width: "15vw", maxHeight: "50px" }}
        onClick={() => setIsCreditAppCreateOpen(true)}
      >
        + Новый заявкополучатель
      </DarkCyanButton>
    ) : activeTab === "broadcast" &&
      activeBroadcastTab === "campaigns" &&
      hasRole("суперадмин") ? (
      <DarkCyanButton
        style={{ width: "15vw", maxHeight: "50px" }}
        onClick={() => setIsBroadcastCreateOpen(true)}
      >
        + Создать кампанию
      </DarkCyanButton>
    ) : activeTab === "broadcast" &&
      activeBroadcastTab === "channels" &&
      hasRole("суперадмин") ? (
      <DarkCyanButton
        style={{ width: "15vw", maxHeight: "50px" }}
        onClick={() => setBroadcastRefreshTick((t) => t + 1)}
      >
        Обновить
      </DarkCyanButton>
    ) : null;

  if (!hasRole("суперадмин")) {
    return (
      <PageLayout>
        <TitleField>
          <CustomTitle>Моя компания</CustomTitle>
        </TitleField>
        {isLoading && <LoadingText>Загрузка...</LoadingText>}
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

      <Tabs
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
              | "blacklist-plus"
              | "telegram-blacklist"
          );
          setCurrentPage(1);
          setNameFilter("");
        }}
        addButton={addButton}
        fontSize={18}
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
          <ModalForm>
            <ModalField>
              <ModalLabel>Номер телефона</ModalLabel>
              <CustomPhoneInput
                value={phoneValue}
                onChange={(e) => setPhoneValue(e)}
              />
            </ModalField>
          </ModalForm>
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
          <ModalForm>
            <ModalField>
              <ModalLabel>ФИО директора</ModalLabel>
              <CustomInput
                value={directorValue}
                onChange={(e) => setDirectorValue(e.target.value)}
                placeholder="Введите ФИО директора"
              />
            </ModalField>
          </ModalForm>
        </BaseModal>
      )}

      <PayoutModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        onConfirm={handlePayout}
        partnerName={selectedPartnerName}
        isSubmitting={isSaving}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        companyName={deleteTargetName}
        isSubmitting={isSaving}
      />

      <ToastContainer>
        {toasts.map((t) => (
          <Toast key={t.id} $type={t.type}>
            {t.type === "success" ? "✓ " : t.type === "error" ? "✕ " : "⚠ "}
            {t.message}
          </Toast>
        ))}
      </ToastContainer>
    </PageLayout>
  );
};

export default AdminPanelPage;
