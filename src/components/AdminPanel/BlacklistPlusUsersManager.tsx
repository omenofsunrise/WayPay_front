import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import adminPanelService, {
  type BlacklistPlusAdminUser,
} from "../../api/services/adminPanelService";
import BaseModal from "../modal/BASE/modalCRUBase";
import DarkCyanButton from "../ui/Buttons/DarkCyanButton";
import CustomInput from "../ui/fields/CustomInput";
import CustomSelect from "../ui/fields/CustomSelect";
import Pagination from "../ui/fields/CustomPagination";
import ToggleSwitch from "../ui/Toggles/ToggleSwitch";

const PAGE_SIZE = 20;
const PaymentType = { CASH: 1, FREE: 2 } as const;

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : "Произошла ошибка";
};

const BlacklistPlusUsersManager = () => {
  const [users, setUsers] = useState<BlacklistPlusAdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subscriptionUser, setSubscriptionUser] =
    useState<BlacklistPlusAdminUser | null>(null);
  const [days, setDays] = useState("30");
  const [cost, setCost] = useState("");
  const [paymentType, setPaymentType] = useState<1 | 2>(PaymentType.FREE);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminPanelService.getBlacklistPlusUsers({
        search: search.trim() || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setUsers(response.items);
      setTotalCount(response.totalCount);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timeout = window.setTimeout(loadUsers, 300);
    return () => window.clearTimeout(timeout);
  }, [loadUsers]);

  const handleModerationChange = async (
    user: BlacklistPlusAdminUser,
    isModerated: boolean
  ) => {
    setProcessingUserId(user.id);
    setError(null);
    setSuccess(null);
    try {
      const updated = await adminPanelService.setBlacklistPlusModeration(
        user.id,
        isModerated
      );
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setSuccess(
        isModerated
          ? `Пользователь ${user.fullName || user.phone} прошёл модерацию`
          : `Модерация пользователя ${user.fullName || user.phone} отключена`
      );
    } catch (moderationError) {
      setError(getErrorMessage(moderationError));
    } finally {
      setProcessingUserId(null);
    }
  };

  const openSubscriptionModal = (user: BlacklistPlusAdminUser) => {
    setSubscriptionUser(user);
    setDays("30");
    setCost("");
    setPaymentType(PaymentType.FREE);
    setError(null);
  };

  const handleAddSubscription = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!subscriptionUser) return;

    const parsedDays = Number(days);
    const parsedCost = Number(cost);
    if (!Number.isInteger(parsedDays) || parsedDays < 1 || parsedDays > 3650) {
      setError("Укажите срок подписки от 1 до 3650 дней");
      return;
    }
    if (
      paymentType === PaymentType.CASH &&
      (!Number.isFinite(parsedCost) || parsedCost <= 0)
    ) {
      setError("Для оплаты наличными укажите сумму больше 0");
      return;
    }

    setProcessingUserId(subscriptionUser.id);
    setError(null);
    setSuccess(null);
    try {
      const result = await adminPanelService.addBlacklistPlusSubscription(
        subscriptionUser.id,
        {
          days: parsedDays,
          cost: paymentType === PaymentType.FREE ? 0 : parsedCost * 100,
          paymentType,
        }
      );
      setUsers((current) =>
        current.map((item) =>
          item.id === subscriptionUser.id
            ? {
                ...item,
                subscriptionStatus: "active",
                subscriptionEndAt: result.endAt,
              }
            : item
        )
      );
      setSuccess(
        `Подписка для ${subscriptionUser.fullName || subscriptionUser.phone} добавлена`
      );
      setSubscriptionUser(null);
    } catch (subscriptionError) {
      setError(getErrorMessage(subscriptionError));
    } finally {
      setProcessingUserId(null);
    }
  };

  return (
    <Container>
      <Toolbar>
        <SearchField>
          <CustomInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Телефон, ФИО или никнейм"
          />
        </SearchField>
        <Count>Пользователей: {totalCount}</Count>
      </Toolbar>

      {success && <SuccessMessage>{success}</SuccessMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Телефон</th>
              <th>Последний вход</th>
              <th>Подписка</th>
              <th>Модерация</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {!isLoading && users.length === 0 && (
              <tr>
                <EmptyCell colSpan={6}>Пользователи не найдены</EmptyCell>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <UserName>{user.fullName || "Без имени"}</UserName>
                  {user.nickname && <Secondary>@{user.nickname}</Secondary>}
                  {user.isDeleted && <DeletedBadge>Удалён</DeletedBadge>}
                </td>
                <td>{user.phone || "—"}</td>
                <td>{formatDate(user.lastActiveAt)}</td>
                <td>
                  <StatusBadge $active={user.subscriptionStatus === "active"}>
                    {user.subscriptionStatus === "active"
                      ? `Активна до ${formatDate(user.subscriptionEndAt)}`
                      : user.subscriptionStatus === "pending"
                        ? "Ожидает оплаты"
                        : "Нет активной"}
                  </StatusBadge>
                </td>
                <td>
                  <ModerationControl>
                    <ToggleSwitch
                      checked={user.isModerated}
                      disabled={processingUserId === user.id || user.isDeleted}
                      onChange={(checked) => handleModerationChange(user, checked)}
                    />
                    <span>{user.isModerated ? "Да" : "Нет"}</span>
                  </ModerationControl>
                </td>
                <td>
                  <DarkCyanButton
                    disabled={processingUserId === user.id || user.isDeleted}
                    onClick={() => openSubscriptionModal(user)}
                  >
                    Добавить подписку
                  </DarkCyanButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {isLoading && <LoadingOverlay>Загрузка...</LoadingOverlay>}
      </TableWrapper>

      {totalCount > PAGE_SIZE && (
        <Pagination
          total={totalCount}
          current={page}
          itemsPerPage={PAGE_SIZE}
          onChange={setPage}
        />
      )}

      {subscriptionUser && (
        <BaseModal
          title={`Подписка ЧС+: ${subscriptionUser.fullName || subscriptionUser.phone}`}
          onClose={() => setSubscriptionUser(null)}
          onCancel={() => setSubscriptionUser(null)}
          onSave={handleAddSubscription}
          isSubmitting={processingUserId === subscriptionUser.id}
        >
          <ModalForm>
            <Field>
              <Label>Тип оплаты</Label>
              <CustomSelect
                value={paymentType}
                onChange={(event) => {
                  setPaymentType(Number(event.target.value) as 1 | 2);
                  setError(null);
                }}
                options={[
                  { value: PaymentType.FREE, label: "Бесплатно" },
                  { value: PaymentType.CASH, label: "Наличные" },
                ]}
              />
            </Field>
            <Field>
              <Label>Количество дней</Label>
              <CustomInput
                type="number"
                min="1"
                max="3650"
                value={days}
                onChange={(event) => setDays(event.target.value)}
              />
            </Field>
            {paymentType === PaymentType.CASH && (
              <Field>
                <Label>Стоимость, ₽</Label>
                <CustomInput
                  type="number"
                  min="1"
                  value={cost}
                  onChange={(event) => setCost(event.target.value)}
                />
              </Field>
            )}
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </ModalForm>
        </BaseModal>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const SearchField = styled.div`
  width: min(460px, 100%);
`;

const Count = styled.div`
  color: #667085;
  font-size: 14px;
`;

const TableWrapper = styled.div`
  position: relative;
  overflow-x: auto;
  min-height: 160px;
  border: 1px solid #e4e7ec;
  border-radius: 10px;
  background: #fff;
`;

const Table = styled.table`
  width: 100%;
  min-width: 1080px;
  border-collapse: collapse;

  th,
  td {
    padding: 14px 16px;
    border-bottom: 1px solid #eef0f3;
    color: #344054;
    font-size: 14px;
    text-align: left;
    vertical-align: middle;
  }

  th {
    color: #667085;
    background: #f9fafb;
    font-size: 12px;
    font-weight: 600;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`;

const UserName = styled.div`
  color: #101828;
  font-weight: 600;
`;

const Secondary = styled.div`
  margin-top: 3px;
  color: #667085;
  font-size: 12px;
`;

const DeletedBadge = styled.span`
  display: inline-flex;
  margin-top: 5px;
  padding: 2px 7px;
  border-radius: 999px;
  color: #b42318;
  background: #fee4e2;
  font-size: 11px;
  font-weight: 600;
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 999px;
  color: ${({ $active }) => ($active ? "#067647" : "#475467")};
  background: ${({ $active }) => ($active ? "#ecfdf3" : "#f2f4f7")};
  font-size: 12px;
  font-weight: 600;
`;

const ModerationControl = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
`;

const EmptyCell = styled.td`
  padding: 40px !important;
  color: #667085 !important;
  text-align: center !important;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #007d88;
  background: rgba(255, 255, 255, 0.75);
  font-weight: 600;
`;

const SuccessMessage = styled.div`
  padding: 11px 14px;
  border: 1px solid #abefc6;
  border-radius: 8px;
  color: #067647;
  background: #ecfdf3;
  font-size: 14px;
`;

const ErrorMessage = styled.div`
  padding: 11px 14px;
  border: 1px solid #fecdca;
  border-radius: 8px;
  color: #b42318;
  background: #fef3f2;
  font-size: 14px;
`;

const ModalForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 30px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  color: #344054;
  font-size: 13px;
  font-weight: 600;
`;

export default BlacklistPlusUsersManager;
