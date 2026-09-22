import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import type { Investor } from "../../api/types/investor";
import type {
  InvestorCashPosition,
  InvestorCashPositionType,
} from "../../api/types/investor";
import type { InvestorPool } from "../../api/types/investorPool";
import type { PaginatedResponse } from "../../api/types/common";
import investorService from "../../api/services/investorService";
import investorPoolService from "../../api/services/investorPoolService";
import { extractErrorMessage } from "../../api/utils/errorMessage";
import { formatExactDate } from "../../utils/dateFormatter";
import BaseModal from "./BASE/modalCRUBase";
import CustomCalendar from "../ui/fields/CustomCalendar";
import CustomSelect from "../ui/fields/CustomSelect";
import CustomTable from "../ui/tables/CustomTable";
import DeleteButton from "../ui/Buttons/DeleteButton";
import Pagination from "../ui/fields/CustomPagination";
import PaginationLayout from "../ui/Layouts/PaginationLayout";
import CountInfoTitle from "../ui/Text/CountInfoTitle";

interface InvestorCashPositionModalProps {
  isOpen: boolean;
  investor: Investor | null;
  canEdit: boolean;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}

const DEFAULT_PAGE_SIZE = 10;

const getToday = () => new Date().toISOString().split("T")[0];

const toOperationDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    date.setHours(
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds()
    );
  } else {
    date.setHours(12, 0, 0, 0);
  }

  return date.toISOString();
};

const getPositionLabel = (position: InvestorCashPosition) => {
  if (position.position.toLowerCase() === "single") {
    return "Отдельная касса";
  }

  return position.poolName || `Пул #${position.poolId}`;
};

const InvestorCashPositionModal = ({
  isOpen,
  investor,
  canEdit,
  onClose,
  onChanged,
}: InvestorCashPositionModalProps) => {
  const isProtectedInvestor = Boolean(
    investor?.isCompany || investor?.isCompanyPool
  );
  const canManagePosition = canEdit && !isProtectedInvestor;
  const [positionType, setPositionType] =
    useState<InvestorCashPositionType>("Single");
  const [poolId, setPoolId] = useState("");
  const [operationDate, setOperationDate] = useState(getToday);
  const [pools, setPools] = useState<InvestorPool[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [history, setHistory] =
    useState<PaginatedResponse<InvestorCashPosition> | null>(null);
  const [latestPosition, setLatestPosition] =
    useState<InvestorCashPosition | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isPoolsLoading, setIsPoolsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!investor) return;

    setIsHistoryLoading(true);
    setModalError(null);
    try {
      const result = await investorService.getCashPositionHistory(
        investor.id,
        historyPage
      );
      setHistory(result);
      if (historyPage === 1) {
        setLatestPosition(result.items[0] || null);
      }
    } catch (error) {
      setHistory(null);
      setModalError(
        extractErrorMessage(error, "Не удалось загрузить историю кассы")
      );
    } finally {
      setIsHistoryLoading(false);
    }
  }, [historyPage, investor]);

  useEffect(() => {
    if (!isOpen || !investor) return;

    setPositionType("Single");
    setPoolId("");
    setOperationDate(getToday());
    setHistoryPage(1);
    setHistory(null);
    setLatestPosition(null);
    setModalError(null);

    if (!canManagePosition) {
      setPools([]);
      setIsPoolsLoading(false);
      return;
    }

    const loadPools = async () => {
      setIsPoolsLoading(true);
      try {
        const result = await investorPoolService.getInvestorPools({
          page: 1,
          pageSize: 100,
        });
        setPools(result.items || []);
      } catch (error) {
        setPools([]);
        setModalError(
          extractErrorMessage(error, "Не удалось загрузить список пулов")
        );
      } finally {
        setIsPoolsLoading(false);
      }
    };

    loadPools();
  }, [isOpen, investor, canManagePosition]);

  useEffect(() => {
    if (isOpen && investor) {
      loadHistory();
    }
  }, [isOpen, investor, loadHistory]);

  const poolOptions = useMemo(
    () => pools.map((pool) => ({ value: String(pool.id), label: pool.name })),
    [pools]
  );
  const isSamePosition = Boolean(
    latestPosition &&
      (positionType === "Single"
        ? latestPosition.position.toLowerCase() === "single"
        : latestPosition.position.toLowerCase() !== "single" &&
          Number(poolId) === latestPosition.poolId)
  );

  const handleMove = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!investor || !canManagePosition) return;

    if (positionType === "Pool" && !poolId) {
      setModalError("Выберите пул для перемещения кассы");
      return;
    }

    if (isSamePosition) {
      setModalError("Касса уже находится в выбранном положении");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    try {
      await investorService.moveCashPosition({
        investorId: investor.id,
        newPositionType: positionType,
        poolId: positionType === "Pool" ? Number(poolId) : null,
        date: toOperationDate(operationDate),
      });
      if (historyPage === 1) {
        await loadHistory();
      } else {
        setHistoryPage(1);
      }
      await onChanged();
    } catch (error) {
      setModalError(
        extractErrorMessage(error, "Не удалось переместить кассу инвестора")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (
    event: React.MouseEvent,
    position: InvestorCashPosition
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canManagePosition || deletingId !== null) return;

    if (!window.confirm("Удалить эту запись из истории перемещений кассы?")) {
      return;
    }

    setDeletingId(position.id);
    setModalError(null);
    try {
      await investorService.deleteCashPositionHistory(position.id);
      if ((history?.items.length || 0) === 1 && historyPage > 1) {
        setHistoryPage((page) => page - 1);
      } else {
        await loadHistory();
      }
      await onChanged();
    } catch (error) {
      setModalError(
        extractErrorMessage(error, "Не удалось удалить запись истории")
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen || !investor) return null;

  const historyData = (history?.items || []).map((position) => [
    position.id.toString(),
    formatExactDate(new Date(position.date || position.createdAt)),
    getPositionLabel(position),
    position.poolName || "—",
    canManagePosition ? (
      <DeleteButton
        onClick={(event) => handleDelete(event, position)}
        tooltip="Удалить запись"
        size={28}
      />
    ) : (
      ""
    ),
  ]);

  return (
    <BaseModal
      title={`Касса инвестора — ${investor.nickname || investor.fullName}`}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleMove}
      mode={canManagePosition ? "edit" : "view"}
      saveButtonText="Переместить"
      isSubmitting={isSubmitting}
      isSaveDisabled={
        !operationDate ||
        isPoolsLoading ||
        isHistoryLoading ||
        isSamePosition ||
        (positionType === "Pool" && !poolId)
      }
      width="900px"
      maxHeight="92vh"
    >
      <ModalContent>
        <CurrentPosition>
          <CurrentPositionLabel>Текущее положение кассы</CurrentPositionLabel>
          <CurrentPositionValue>
            {isHistoryLoading && !latestPosition
              ? "Загрузка..."
              : latestPosition
              ? getPositionLabel(latestPosition)
              : "История перемещений отсутствует"}
          </CurrentPositionValue>
        </CurrentPosition>

        {isProtectedInvestor && (
          <ProtectedInvestorNotice>
            Кассу собственной компании нельзя перемещать. Доступен только
            просмотр истории.
          </ProtectedInvestorNotice>
        )}

        {canManagePosition && (
          <MoveSection>
            <SectionTitle>Переместить кассу</SectionTitle>
            <FieldsRow>
              <Field>
                <FieldLabel>Новое положение</FieldLabel>
                <CustomSelect<InvestorCashPositionType>
                  value={positionType}
                  onChange={(event) => {
                    setPositionType(event.target.value);
                    if (event.target.value === "Single") setPoolId("");
                  }}
                  options={[
                    { value: "Single", label: "Отдельная касса" },
                    { value: "Pool", label: "В пуле" },
                  ]}
                  dropdownInPortal
                />
              </Field>

              {positionType === "Pool" && (
                <Field>
                  <FieldLabel>Пул</FieldLabel>
                  <CustomSelect<string>
                    value={poolId}
                    onChange={(event) => setPoolId(event.target.value)}
                    options={poolOptions}
                    placeholder={
                      isPoolsLoading ? "Загрузка пулов..." : "Выберите пул"
                    }
                    disabled={isPoolsLoading}
                    dropdownInPortal
                  />
                </Field>
              )}

              <Field>
                <FieldLabel>Дата перемещения</FieldLabel>
                <CustomCalendar
                  prefix=""
                  value={operationDate}
                  onChange={setOperationDate}
                />
              </Field>
            </FieldsRow>
            {isSamePosition && (
              <SamePositionNotice>
                Касса уже находится в выбранном положении. Выберите другое
                положение или другой пул.
              </SamePositionNotice>
            )}
          </MoveSection>
        )}

        {modalError && <ErrorMessage>{modalError}</ErrorMessage>}

        <HistorySection>
          <SectionTitle>История перемещений</SectionTitle>
          <CustomTable
            columns={[
              { name: "ID", isHidden: true },
              { name: "Дата и время", isSortable: false },
              { name: "Положение", align: "left" },
              { name: "Пул", align: "left" },
              { name: "", align: "center" },
            ]}
            data={historyData}
            isLoading={isHistoryLoading}
          />

          {!isHistoryLoading && historyData.length === 0 && (
            <EmptyHistory>Перемещений кассы пока нет</EmptyHistory>
          )}

          {(history?.totalCount || 0) > 0 && (
            <PaginationLayout>
              <CountInfoTitle total={history?.totalCount || 0} />
              <Pagination
                total={history?.totalCount || 0}
                current={historyPage}
                onChange={setHistoryPage}
                itemsPerPage={history?.pageSize || DEFAULT_PAGE_SIZE}
              />
            </PaginationLayout>
          )}
        </HistorySection>
      </ModalContent>
    </BaseModal>
  );
};

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
`;

const CurrentPosition = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid #d9e5e7;
  border-radius: 8px;
  background: #f2f8f8;
`;

const CurrentPositionLabel = styled.span`
  color: #50555c;
  font-size: 14px;
`;

const CurrentPositionValue = styled.strong`
  color: #007d88;
  text-align: right;
`;

const MoveSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HistorySection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  color: #30343a;
  font-size: 15px;
  font-weight: 600;
`;

const FieldsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const FieldLabel = styled.label`
  color: #50555c;
  font-size: 13px;
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  padding: 10px 12px;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 14px;
`;

const ProtectedInvestorNotice = styled.div`
  padding: 10px 12px;
  border: 1px solid #fde68a;
  border-radius: 6px;
  background: #fffbeb;
  color: #92400e;
  font-size: 14px;
`;

const SamePositionNotice = styled.div`
  color: #92400e;
  font-size: 13px;
`;

const EmptyHistory = styled.div`
  padding: 24px;
  color: #6b7280;
  text-align: center;
`;

export default InvestorCashPositionModal;
