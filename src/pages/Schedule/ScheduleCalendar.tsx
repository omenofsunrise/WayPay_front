import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import styled, { css } from "styled-components";
import { Info, Maximize2, Minimize2 } from "lucide-react";
import CustomInput from "../../components/ui/fields/CustomInput";
import CustomCalendar from "../../components/ui/fields/CustomCalendar";
import ObjectTypeSelect from "../../components/ui/fields/ObjectTypeSelect";
import BaseModal from "../../components/modal/BASE/modalCRUBase";
import NewPaymentModal from "../../components/modal/NewPaymentModal";
import useSchedule from "../../api/hooks/useSchedule";
import usePayment from "../../api/hooks/usePayment";
import useSender from "../../api/hooks/useSender";
import creditService from "../../api/services/creditService";
import type { ScheduleDetails } from "../../api/types/schedule";
import type { Credit } from "../../api/types/credit";
import { formatDate, parseDateInput } from "../../utils/dateFormatter";
import { formatMoney } from "../../utils/formatPrice";
import { sendWhatsAppMessage } from "../../utils/sendWhatsAppMessage";

type SchedulePaymentStatus =
  | "paid"
  | "overdue"
  | "transferred"
  | "called"
  | "pending";

const schedulePaymentStatusMeta: Record<
  SchedulePaymentStatus,
  {
    label: string;
    background: string;
    border: string;
    accent: string;
    color: string;
  }
> = {
  paid: {
    label: "Оплачен",
    background: "#f0fdf4",
    border: "#86efac",
    accent: "#22c55e",
    color: "#166534",
  },
  overdue: {
    label: "Просрочен",
    background: "#fef2f2",
    border: "#fca5a5",
    accent: "#ef4444",
    color: "#991b1b",
  },
  transferred: {
    label: "Перенесен",
    background: "#eff6ff",
    border: "#93c5fd",
    accent: "#3b82f6",
    color: "#1d4ed8",
  },
  called: {
    label: "Обзвонен",
    background: "#ecfeff",
    border: "#67e8f9",
    accent: "#0891b2",
    color: "#155e75",
  },
  pending: {
    label: "Ожидает",
    background: "#fffbeb",
    border: "#fde68a",
    accent: "#f59e0b",
    color: "#92400e",
  },
};

const toDateInputValue = (date: Date | string): string => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
};

const getCalendarClientName = (payment: ScheduleDetails): string => {
  return payment.clientName?.trim() || "Без имени";
};

const getCalendarClientKey = (payment: ScheduleDetails): string => {
  return `${getCalendarClientName(payment)}|${payment.clientPhone || ""}`;
};

const formatMoneyValue = (value?: number | string | null): string => {
  return formatMoney(String(value ?? 0));
};

const getDayKey = (date: Date | string): string => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(parsed.getDate()).padStart(2, "0")}`;
};

const getMonthKey = (date: Date | string): string => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
};

const getCalendarMonthsByPayments = (payments: ScheduleDetails[]) => {
  const map = new Map<string, { key: string; label: string }>();
  payments.forEach((payment) => {
    const parsed = new Date(payment.paymentDate);
    if (Number.isNaN(parsed.getTime())) return;
    const key = getMonthKey(parsed);
    if (!key || map.has(key)) return;
    map.set(key, {
      key,
      label: parsed.toLocaleDateString("ru-RU", {
        month: "long",
        year: "numeric",
      }),
    });
  });
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
};

const getMonthDayColumns = (year: number, month: number) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const cols: { key: string; label: string }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    cols.push({ key, label: String(day) });
  }
  return cols;
};

const CALENDAR_MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const isSchedulePaid = (schedule: ScheduleDetails): boolean => {
  return (
    schedule.status === "Payed" || Boolean(schedule.payed ?? schedule.isPaid)
  );
};

const isScheduleOverdue = (schedule: ScheduleDetails): boolean => {
  if (schedule.status === "Overdue") return true;
  if (schedule.status === "Pending" || schedule.status === "Payed")
    return false;
  if (isSchedulePaid(schedule)) return false;
  const paymentDate = new Date(schedule.paymentDate);
  paymentDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return paymentDate < today;
};

const isSchedulePendingSoon = (schedule: ScheduleDetails): boolean => {
  if (schedule.status === "Pending") return true;
  if (isSchedulePaid(schedule) || isScheduleOverdue(schedule)) return false;

  const paymentDate = new Date(schedule.paymentDate);
  paymentDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilPayment = Math.ceil(
    (paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilPayment >= 0 && daysUntilPayment <= 3;
};

const isScheduleTransferred = (schedule: ScheduleDetails): boolean => {
  const text = `${schedule.comment || ""} ${
    schedule.userComment || ""
  }`.toLowerCase();
  return text.includes("перенес") || text.includes("перенос");
};

const getSchedulePaymentStatus = (
  schedule: ScheduleDetails
): SchedulePaymentStatus => {
  if (isSchedulePaid(schedule)) return "paid";
  if (isScheduleTransferred(schedule)) return "transferred";
  if (isScheduleOverdue(schedule)) return "overdue";
  if (schedule.notified) return "called";
  return isSchedulePendingSoon(schedule) ? "pending" : "called";
};

const getDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const addDaysToIsoDate = (date: string, days: number): string => {
  const parsed = new Date(date);
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().split("T")[0];
};

const todayIsoDate = (): string => new Date().toISOString().split("T")[0];

const CALENDAR_PAST_DAYS = 30;
const CALENDAR_FUTURE_DAYS = 90;
const CALENDAR_WINDOW_STEP_DAYS = 30;
const CALENDAR_MAX_SPAN_DAYS = 720;
const CALENDAR_SCROLL_EDGE_PX = 140;

interface SelectedObjectType {
  id: number;
  name: string;
}

const ScheduleCalendar = () => {
  const [calendarSearch, setCalendarSearch] = useState("");
  const [calendarSearchQuery, setCalendarSearchQuery] = useState("");
  const [calendarDateFrom, setCalendarDateFrom] = useState("");
  const [calendarDateTo, setCalendarDateTo] = useState("");
  const [calendarOverdueOnly, setCalendarOverdueOnly] = useState(false);
  const [calendarOverdues, setCalendarOverdues] = useState("");
  const [calendarObjectTypeName, setCalendarObjectTypeName] = useState("");
  const [selectedCalendarObjectType, setSelectedCalendarObjectType] =
    useState<SelectedObjectType | null>(null);

  const [calendarPage, setCalendarPage] = useState(1);
  const [calendarWindowStart, setCalendarWindowStart] = useState(() =>
    addDaysToIsoDate(todayIsoDate(), -CALENDAR_PAST_DAYS)
  );
  const [calendarWindowEnd, setCalendarWindowEnd] = useState(() =>
    addDaysToIsoDate(todayIsoDate(), CALENDAR_FUTURE_DAYS)
  );

  const [isCalendarFullscreen, setIsCalendarFullscreen] = useState(false);
  const [calendarFsMonth, setCalendarFsMonth] = useState(
    () => new Date().getMonth() + 1
  );
  const [calendarFsYear, setCalendarFsYear] = useState(() =>
    new Date().getFullYear()
  );

  const [selectedCalendarSchedule, setSelectedCalendarSchedule] =
    useState<ScheduleDetails | null>(null);
  const [scheduleComment, setScheduleComment] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isStatusInfoModalOpen, setIsStatusInfoModalOpen] = useState(false);
  const [isSavingScheduleComment, setIsSavingScheduleComment] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedScheduleForPayment, setSelectedScheduleForPayment] =
    useState<ScheduleDetails | null>(null);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);

  const calendarScrollRef = useRef<HTMLDivElement>(null);
  const calendarAnchorWidthRef = useRef<number | null>(null);
  const calendarExtendingRef = useRef(false);

  const {
    isLoading,
    error,
    calendarData,
    calendarSummary,
    getCalendar,
    updateSchedule,
  } = useSchedule();
  const { createPayment } = usePayment();
  const { GetFilledGuarantorSchedule } = useSender();

  const hasCalendarDateFilter = Boolean(calendarDateFrom || calendarDateTo);

  const loadCalendarSchedules = useCallback(async () => {
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (isCalendarFullscreen) {
      const mm = String(calendarFsMonth).padStart(2, "0");
      const lastDay = new Date(calendarFsYear, calendarFsMonth, 0).getDate();
      startDate = `${calendarFsYear}-${mm}-01`;
      endDate = `${calendarFsYear}-${mm}-${String(lastDay).padStart(2, "0")}`;
    } else if (hasCalendarDateFilter) {
      startDate = calendarDateFrom || undefined;
      endDate = calendarDateTo || undefined;
    } else {
      startDate = calendarWindowStart;
      endDate = calendarWindowEnd;
    }

    await getCalendar({
      StartDate: startDate ? parseDateInput(startDate) : undefined,
      EndDate: endDate ? parseDateInput(endDate) : undefined,
      Search: calendarSearchQuery || undefined,
      Overdue: calendarOverdueOnly || undefined,
      Overdues: calendarOverdues ? Number(calendarOverdues) : undefined,
      ClientsCount: 50,
      ClientsPage: calendarPage,
      CreditTypeId: selectedCalendarObjectType?.id || undefined,
    });

    calendarExtendingRef.current = false;
  }, [
    isCalendarFullscreen,
    calendarFsMonth,
    calendarFsYear,
    hasCalendarDateFilter,
    calendarDateFrom,
    calendarDateTo,
    calendarWindowStart,
    calendarWindowEnd,
    calendarSearchQuery,
    calendarOverdueOnly,
    calendarOverdues,
    selectedCalendarObjectType,
    calendarPage,
    getCalendar,
  ]);

  useEffect(() => {
    loadCalendarSchedules();
  }, [loadCalendarSchedules]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setCalendarSearchQuery(calendarSearch.trim());
      setCalendarPage(1);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [calendarSearch]);

  const handleCalendarScroll = useCallback(() => {
    if (
      isCalendarFullscreen ||
      hasCalendarDateFilter ||
      isLoading ||
      calendarExtendingRef.current
    ) {
      return;
    }
    const el = calendarScrollRef.current;
    if (!el) return;

    if (
      getDaysBetween(calendarWindowStart, calendarWindowEnd) >=
      CALENDAR_MAX_SPAN_DAYS
    ) {
      return;
    }

    const atLeftEdge = el.scrollLeft <= CALENDAR_SCROLL_EDGE_PX;
    const atRightEdge =
      el.scrollLeft + el.clientWidth >=
      el.scrollWidth - CALENDAR_SCROLL_EDGE_PX;

    if (atLeftEdge) {
      calendarExtendingRef.current = true;
      calendarAnchorWidthRef.current = el.scrollWidth;
      setCalendarWindowStart((prev) =>
        addDaysToIsoDate(prev, -CALENDAR_WINDOW_STEP_DAYS)
      );
    } else if (atRightEdge) {
      calendarExtendingRef.current = true;
      setCalendarWindowEnd((prev) =>
        addDaysToIsoDate(prev, CALENDAR_WINDOW_STEP_DAYS)
      );
    }
  }, [
    isCalendarFullscreen,
    hasCalendarDateFilter,
    isLoading,
    calendarWindowStart,
    calendarWindowEnd,
  ]);

  useEffect(() => {
    if (!isCalendarFullscreen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsCalendarFullscreen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCalendarFullscreen]);

  useLayoutEffect(() => {
    const el = calendarScrollRef.current;
    if (el && calendarAnchorWidthRef.current !== null) {
      const delta = el.scrollWidth - calendarAnchorWidthRef.current;
      if (delta > 0) {
        el.scrollLeft += delta;
      }
      calendarAnchorWidthRef.current = null;
    }
  }, [calendarData]);

  const openScheduleCommentModal = (schedule: ScheduleDetails) => {
    setSelectedCalendarSchedule(schedule);
    setScheduleComment(schedule.userComment || "");
    setScheduleDate(toDateInputValue(schedule.paymentDate));
    setIsCommentModalOpen(true);
  };

  const handleCalendarPaymentClick = (
    event: React.MouseEvent,
    schedule: ScheduleDetails
  ) => {
    event.preventDefault();
    event.stopPropagation();
    openScheduleCommentModal(schedule);
  };

  const handleCalendarCellClick = (payments: ScheduleDetails[]) => {
    if (payments.length === 1) {
      openScheduleCommentModal(payments[0]);
    }
  };

  const handleSaveScheduleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCalendarSchedule || !scheduleDate) return;

    setIsSavingScheduleComment(true);
    const success = await updateSchedule({
      id: selectedCalendarSchedule.id,
      date: new Date(scheduleDate).toISOString(),
      userComment: scheduleComment.trim() || null,
    });
    setIsSavingScheduleComment(false);

    if (!success) {
      alert("Не удалось сохранить комментарий");
      return;
    }

    setIsCommentModalOpen(false);
    setSelectedCalendarSchedule(null);
    await loadCalendarSchedules();
  };

  const handleOpenPaymentFromScheduleModal = async () => {
    if (!selectedCalendarSchedule) return;
    try {
      const credit = await creditService.getCreditById(
        selectedCalendarSchedule.creditId
      );
      setSelectedCredit(credit);
      setSelectedScheduleForPayment(selectedCalendarSchedule);
      setIsPaymentModalOpen(true);
      setIsCommentModalOpen(false);
    } catch (error) {
      console.error("Ошибка при загрузке данных кредита:", error);
      alert("Не удалось загрузить данные кредита");
    }
  };

  const handleNotifyFromScheduleModal = async () => {
    if (!selectedCalendarSchedule) return;
    const success = await sendWhatsAppMessage(
      selectedCalendarSchedule.id,
      selectedCalendarSchedule.clientPhone
    );

    if (success) {
      await loadCalendarSchedules();
    }
  };

  const handleSavePayment = async (paymentData: {
    paymentDate: string;
    principalAmount: number;
    paymentMethod: "cash" | "card";
    bankCardId?: number;
  }) => {
    try {
      if (!selectedScheduleForPayment) return;

      const paymentRequest = {
        creditId: selectedScheduleForPayment.creditId,
        paymentAmount: paymentData.principalAmount,
        datePayment: paymentData.paymentDate,
        type: paymentData.paymentMethod,
        bankCardId: paymentData.bankCardId,
      };

      await createPayment(paymentRequest);
      await loadCalendarSchedules();
      setIsPaymentModalOpen(false);
      setSelectedScheduleForPayment(null);
      setSelectedCredit(null);
    } catch (error) {
      console.error("Ошибка при сохранении платежа:", error);
      throw error;
    }
  };

  const selectedScheduleStatus = selectedCalendarSchedule
    ? getSchedulePaymentStatus(selectedCalendarSchedule)
    : "pending";

  const safeCalendarData = Array.isArray(calendarData) ? calendarData : [];
  const isCalendarDayView = isCalendarFullscreen;
  const calendarColumns = isCalendarDayView
    ? getMonthDayColumns(calendarFsYear, calendarFsMonth)
    : getCalendarMonthsByPayments(safeCalendarData);
  const getCalendarGroupKey = (date: Date | string) =>
    isCalendarDayView ? getDayKey(date) : getMonthKey(date);

  const calendarClients = Array.from(
    new Map(
      safeCalendarData.map((item) => {
        const key = getCalendarClientKey(item);
        return [key, { key, name: getCalendarClientName(item) }];
      })
    ).values()
  );

  const calendarPaymentsByClient = safeCalendarData.reduce((acc, item) => {
    const clientKey = getCalendarClientKey(item);
    const colKey = getCalendarGroupKey(item.paymentDate);
    if (!colKey) return acc;
    if (!acc[clientKey]) acc[clientKey] = {};
    if (!acc[clientKey][colKey]) acc[clientKey][colKey] = [];
    acc[clientKey][colKey].push(item);
    return acc;
  }, {} as Record<string, Record<string, ScheduleDetails[]>>);

  return (
    <>
      <CalendarToolbar>
        <CalendarFilterGroup>
          <SearchField>
            <CustomInput
              inputType="text"
              placeholder="Поиск по ФИО"
              value={calendarSearch}
              onChange={(e) => setCalendarSearch(e.target.value)}
            />
            {calendarSearch && (
              <SearchClearButton
                type="button"
                onClick={() => {
                  setCalendarSearch("");
                  setCalendarSearchQuery("");
                  setCalendarPage(1);
                }}
                aria-label="Очистить поиск"
              >
                ×
              </SearchClearButton>
            )}
          </SearchField>
        </CalendarFilterGroup>

        <CalendarFilterGroup>
          <ObjectTypeSelect
            value={calendarObjectTypeName}
            onChange={(value) => {
              setCalendarObjectTypeName(value);
              if (!value) setSelectedCalendarObjectType(null);
              setCalendarPage(1);
            }}
            onObjectTypeSelect={(type) => {
              setSelectedCalendarObjectType(type);
              setCalendarObjectTypeName(type.name);
              setCalendarPage(1);
            }}
            placeholder="Папка договора"
            entityType="credit"
          />
        </CalendarFilterGroup>

        <CalendarFilterGroup>
          <CustomCalendar
            prefix="От"
            value={calendarDateFrom}
            onChange={(date) => {
              setCalendarDateFrom(date);
              setCalendarPage(1);
            }}
          />
        </CalendarFilterGroup>

        <CalendarFilterGroup>
          <CustomCalendar
            prefix="До"
            value={calendarDateTo}
            onChange={(date) => {
              setCalendarDateTo(date);
              setCalendarPage(1);
            }}
          />
        </CalendarFilterGroup>

        <CalendarFilterGroup>
          <CustomInput
            inputType="number"
            placeholder="Кол-во просрочек"
            value={calendarOverdues}
            min="1"
            onChange={(e) => {
              setCalendarOverdues(e.target.value.replace(/[^0-9]/g, ""));
              setCalendarPage(1);
            }}
          />
        </CalendarFilterGroup>

        <CalendarSwitchLabel>
          <CalendarSwitchInput
            type="checkbox"
            checked={calendarOverdueOnly}
            onChange={(e) => {
              setCalendarOverdueOnly(e.target.checked);
              setCalendarPage(1);
            }}
          />
          <CalendarSwitchSlider />
          <span>Только просрочки</span>
        </CalendarSwitchLabel>

        <CalendarInfoButton
          type="button"
          onClick={() => setIsStatusInfoModalOpen(true)}
          title="Статусы платежей"
        >
          <Info size={16} strokeWidth={2.2} />
          <span>Статусы платежей</span>
        </CalendarInfoButton>

        <CalendarInfoButton
          type="button"
          onClick={() => setIsCalendarFullscreen(true)}
          title="Открыть таблицу на весь экран"
        >
          <Maximize2 size={16} strokeWidth={2.2} />
          <span>На весь экран</span>
        </CalendarInfoButton>
      </CalendarToolbar>

      <CalendarTableWrapper $fullscreen={isCalendarFullscreen}>
        {isCalendarFullscreen && (
          <CalendarFullscreenBar>
            <CalendarMonthNav>
              <CalendarMonthSelect
                value={calendarFsMonth}
                onChange={(e) => setCalendarFsMonth(Number(e.target.value))}
              >
                {CALENDAR_MONTH_NAMES.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </CalendarMonthSelect>
              <CalendarMonthSelect
                value={calendarFsYear}
                onChange={(e) => setCalendarFsYear(Number(e.target.value))}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </CalendarMonthSelect>
            </CalendarMonthNav>
            <CalendarInfoButton
              type="button"
              onClick={() => setIsCalendarFullscreen(false)}
              title="Свернуть (Esc)"
            >
              <Minimize2 size={16} strokeWidth={2.2} />
              <span>Свернуть</span>
            </CalendarInfoButton>
          </CalendarFullscreenBar>
        )}

        <CalendarSummaryBar>
          <CalendarSummaryItem>
            <CalendarSummaryLabel>Всего платежей</CalendarSummaryLabel>
            <CalendarSummaryValue>
              {calendarSummary.totalCount}
            </CalendarSummaryValue>
          </CalendarSummaryItem>
          <CalendarSummaryItem>
            <CalendarSummaryLabel>Просрочек</CalendarSummaryLabel>
            <CalendarSummaryValue $danger={calendarSummary.totalOverdues > 0}>
              {calendarSummary.totalOverdues}
            </CalendarSummaryValue>
          </CalendarSummaryItem>
          <CalendarSummaryItem>
            <CalendarSummaryLabel>Сумма просрочек</CalendarSummaryLabel>
            <CalendarSummaryValue $danger={calendarSummary.overduesAmount > 0}>
              {formatMoneyValue(calendarSummary.overduesAmount)}
            </CalendarSummaryValue>
          </CalendarSummaryItem>
        </CalendarSummaryBar>

        {error && <div>Ошибка: {error}</div>}

        {!error && (
          <CalendarGridScroll
            ref={calendarScrollRef}
            onScroll={handleCalendarScroll}
            $fullscreen={isCalendarFullscreen}
          >
            {isLoading && (
              <CalendarLoadingOverlay>Загрузка…</CalendarLoadingOverlay>
            )}
            <CalendarGrid $columns={calendarColumns.length}>
              <CalendarHeaderCell>
                {isCalendarDayView ? "Клиент / число" : "Клиент / месяц"}
              </CalendarHeaderCell>
              {calendarColumns.map((col) => (
                <CalendarHeaderCell key={col.key}>
                  {col.label}
                </CalendarHeaderCell>
              ))}

              {calendarClients.length === 0 && (
                <CalendarEmptyCell $columns={calendarColumns.length + 1}>
                  Нет платежей за выбранный период
                </CalendarEmptyCell>
              )}

              {calendarClients.map((client) => [
                <CalendarClientCell key={`${client.key}-client`}>
                  {client.name}
                </CalendarClientCell>,
                ...calendarColumns.map((col) => {
                  const payments =
                    calendarPaymentsByClient[client.key]?.[col.key] || [];
                  return (
                    <CalendarPaymentCell
                      key={`${client.key}-${col.key}`}
                      $isClickable={payments.length > 0}
                      onClick={() => handleCalendarCellClick(payments)}
                    >
                      {payments.length === 0 ? (
                        <CalendarEmptyMark>—</CalendarEmptyMark>
                      ) : (
                        payments.map((payment) => {
                          const status = getSchedulePaymentStatus(payment);
                          return (
                            <PaymentChip
                              key={payment.id}
                              type="button"
                              $status={status}
                              $hasComment={Boolean(
                                payment.userComment?.trim()
                              )}
                              onClick={(event) =>
                                handleCalendarPaymentClick(event, payment)
                              }
                              title="Открыть платеж"
                            >
                              <PaymentChipAmount>
                                {formatMoneyValue(payment.paymentAmount)}
                              </PaymentChipAmount>
                              <PaymentChipDate>
                                {formatDate(payment.paymentDate)}
                              </PaymentChipDate>
                            </PaymentChip>
                          );
                        })
                      )}
                    </CalendarPaymentCell>
                  );
                }),
              ])}
            </CalendarGrid>
          </CalendarGridScroll>
        )}
      </CalendarTableWrapper>

      {isCommentModalOpen && selectedCalendarSchedule && (
        <BaseModal
          title="Платеж из календаря"
          onClose={() => setIsCommentModalOpen(false)}
          onCancel={() => setIsCommentModalOpen(false)}
          onSave={handleSaveScheduleComment}
          saveButtonText="Сохранить"
          isSubmitting={isSavingScheduleComment}
          width="720px"
        >
          <ScheduleCommentForm>
            <ScheduleModalHeaderCard $status={selectedScheduleStatus}>
              <ScheduleModalHeaderMain>
                <ScheduleModalClientName>
                  {selectedCalendarSchedule.clientName || "Без имени"}
                </ScheduleModalClientName>
              </ScheduleModalHeaderMain>
              <ScheduleModalMetaGrid>
                <ScheduleModalMetaItem>
                  <ScheduleModalLabel>Договор</ScheduleModalLabel>
                  <ScheduleModalValue>
                    №{selectedCalendarSchedule.creditId}
                  </ScheduleModalValue>
                </ScheduleModalMetaItem>
                <ScheduleModalMetaItem>
                  <ScheduleModalLabel>Платеж</ScheduleModalLabel>
                  <ScheduleModalValue>
                    {formatMoneyValue(selectedCalendarSchedule.paymentAmount)}
                  </ScheduleModalValue>
                </ScheduleModalMetaItem>
                <ScheduleModalMetaItem>
                  <ScheduleModalLabel>Остаток</ScheduleModalLabel>
                  <ScheduleModalValue>
                    {formatMoneyValue(selectedCalendarSchedule.rest)}
                  </ScheduleModalValue>
                </ScheduleModalMetaItem>
                <ScheduleModalMetaItem>
                  <ScheduleModalLabel>Телефон клиента</ScheduleModalLabel>
                  <ScheduleModalValue>
                    {selectedCalendarSchedule.clientPhone || "Нет данных"}
                  </ScheduleModalValue>
                </ScheduleModalMetaItem>
                {selectedCalendarSchedule.guarantorFullname && (
                  <ScheduleModalMetaItem>
                    <ScheduleModalLabel>Поручитель</ScheduleModalLabel>
                    <ScheduleModalValue>
                      {selectedCalendarSchedule.guarantorFullname}
                    </ScheduleModalValue>
                  </ScheduleModalMetaItem>
                )}
                {selectedCalendarSchedule.guarantorPhone && (
                  <ScheduleModalMetaItem>
                    <ScheduleModalLabel>Телефон поручителя</ScheduleModalLabel>
                    <ScheduleModalValue>
                      {selectedCalendarSchedule.guarantorPhone}
                    </ScheduleModalValue>
                  </ScheduleModalMetaItem>
                )}
              </ScheduleModalMetaGrid>
            </ScheduleModalHeaderCard>

            <ScheduleOperationsRow>
              <ScheduleOperationButton
                type="button"
                onClick={handleOpenPaymentFromScheduleModal}
              >
                Добавить платеж
              </ScheduleOperationButton>
              <ScheduleOperationButton
                type="button"
                onClick={handleNotifyFromScheduleModal}
              >
                Отправить уведомление
              </ScheduleOperationButton>
            </ScheduleOperationsRow>

            <ModalField>
              <InputLabel>Дата платежа</InputLabel>
              <CustomCalendar
                prefix=""
                value={scheduleDate}
                onChange={setScheduleDate}
              />
            </ModalField>

            <ModalField>
              <InputLabel>Комментарий</InputLabel>
              <CommentTextarea
                value={scheduleComment}
                onChange={(e) => setScheduleComment(e.target.value)}
                placeholder="Комментарий по платежу"
                rows={4}
              />
            </ModalField>
          </ScheduleCommentForm>
        </BaseModal>
      )}

      {isStatusInfoModalOpen && (
        <BaseModal
          title="Статусы платежей"
          onClose={() => setIsStatusInfoModalOpen(false)}
          onCancel={() => setIsStatusInfoModalOpen(false)}
          hideSaveButton
          width="520px"
        >
          <StatusInfoList>
            {(
              Object.keys(schedulePaymentStatusMeta) as SchedulePaymentStatus[]
            ).map((status) => (
              <StatusInfoItem key={status}>
                <StatusInfoDot $status={status} />
                <StatusInfoTitle>
                  {schedulePaymentStatusMeta[status].label}
                </StatusInfoTitle>
              </StatusInfoItem>
            ))}
          </StatusInfoList>
        </BaseModal>
      )}

      <NewPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedScheduleForPayment(null);
          setSelectedCredit(null);
        }}
        onSubmit={handleSavePayment}
        creditId={selectedScheduleForPayment?.creditId || 0}
        clientName={selectedScheduleForPayment?.clientName || ""}
        investorName={selectedCredit?.investorNickname || ""}
        clientPhone={selectedScheduleForPayment?.clientPhone || ""}
        currentDebt={selectedCredit?.rest || 0}
        currentMonthDebt={selectedScheduleForPayment?.paymentAmount || 0}
      />
    </>
  );
};

const CalendarToolbar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 12px;
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
`;

const CalendarFilterGroup = styled.div`
  min-width: 210px;
`;

const SearchField = styled.div`
  position: relative;
  width: 100%;
`;

const SearchClearButton = styled.button`
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: #e5e7eb;
  color: #374151;
  font-size: 17px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #d1d5db;
  }
`;

const CalendarSwitchLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const CalendarSwitchInput = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
`;

const CalendarSwitchSlider = styled.span`
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: #cbd5e1;
  transition: background-color 0.2s ease;

  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.24);
    transition: transform 0.2s ease;
  }

  ${CalendarSwitchInput}:checked + & {
    background: #007d88;
  }

  ${CalendarSwitchInput}:checked + &::after {
    transform: translateX(18px);
  }
`;

const CalendarInfoButton = styled.button`
  height: 34px;
  padding: 0 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #007d88;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease, border-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    border-color: #007d88;
    background: #f0fdfa;
  }
`;

const CalendarSummaryBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
`;

const CalendarSummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 140px;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
`;

const CalendarSummaryLabel = styled.span`
  font-size: 12px;
  color: #64748b;
`;

const CalendarSummaryValue = styled.span<{ $danger?: boolean }>`
  font-size: 18px;
  font-weight: 700;
  color: ${(props) => (props.$danger ? "#dc2626" : "#111827")};
`;

const CalendarTableWrapper = styled.div<{ $fullscreen: boolean }>`
  ${(props) =>
    props.$fullscreen &&
    css`
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: #ffffff;
    `}
`;

const CalendarFullscreenBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;

const CalendarMonthNav = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CalendarMonthSelect = styled.select`
  height: 36px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #111827;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: #007d88;
  }
`;

const CalendarGridScroll = styled.div<{ $fullscreen?: boolean }>`
  position: relative;
  overflow: auto;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  max-height: ${(props) =>
    props.$fullscreen ? "none" : "calc(100vh - 280px)"};
  ${(props) =>
    props.$fullscreen &&
    css`
      flex: 1;
      min-height: 0;
    `}
`;

const CalendarLoadingOverlay = styled.div`
  position: sticky;
  top: 0;
  left: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  background: rgba(248, 250, 252, 0.92);
  border-bottom: 1px solid #e2e8f0;
`;

const CalendarGrid = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: 260px repeat(
      ${(props) => props.$columns},
      minmax(130px, 160px)
    );
  min-width: max-content;
`;

const CalendarHeaderCell = styled.div`
  position: sticky;
  top: 0;
  z-index: 4;
  padding: 10px 12px;
  border-right: 1px solid #cbd5e1;
  border-bottom: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
  text-align: center;

  &:first-child {
    position: sticky;
    left: 0;
    z-index: 5;
    text-align: left;
    box-shadow: 4px 0 6px -3px rgba(15, 23, 42, 0.18);
  }
`;

const CalendarClientCell = styled.div`
  position: sticky;
  left: 0;
  z-index: 3;
  padding: 10px 12px;
  border-right: 1px solid #cbd5e1;
  border-bottom: 1px solid #cbd5e1;
  background: #ffffff;
  color: #111827;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 4px 0 6px -3px rgba(15, 23, 42, 0.12);
`;

const CalendarPaymentCell = styled.div<{ $isClickable?: boolean }>`
  min-height: 70px;
  padding: 6px;
  border-right: 1px solid #cbd5e1;
  border-bottom: 1px solid #cbd5e1;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: stretch;
  justify-content: center;
  cursor: ${(props) => (props.$isClickable ? "pointer" : "default")};
`;

const CalendarEmptyMark = styled.span`
  color: #cbd5e1;
  text-align: center;
  font-size: 13px;
`;

const CalendarEmptyCell = styled.div<{ $columns: number }>`
  grid-column: span ${(props) => props.$columns};
  padding: 28px;
  color: #6b7280;
  text-align: center;
`;

const PaymentChip = styled.button<{
  $status: SchedulePaymentStatus;
  $hasComment: boolean;
}>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  min-height: 58px;
  padding: 7px 8px;
  border: 1px solid
    ${(props) => schedulePaymentStatusMeta[props.$status].border};
  border-left: 3px solid
    ${(props) => schedulePaymentStatusMeta[props.$status].accent};
  border-radius: 7px;
  background: ${(props) => schedulePaymentStatusMeta[props.$status].background};
  color: #111827;
  cursor: pointer;

  &::after {
    content: ${(props) => (props.$hasComment ? '"💬"' : '""')};
    position: absolute;
    top: 3px;
    right: 5px;
    font-size: 10px;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
    transform: translateY(-1px);
  }
`;

const PaymentChipAmount = styled.span`
  font-size: 12px;
  font-weight: 800;
`;

const PaymentChipDate = styled.span`
  font-size: 11px;
  color: #64748b;
`;

const ScheduleCommentForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 4px;
`;

const ScheduleModalHeaderCard = styled.div<{ $status: SchedulePaymentStatus }>`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid
    ${(props) => schedulePaymentStatusMeta[props.$status].border};
  border-left: 4px solid
    ${(props) => schedulePaymentStatusMeta[props.$status].accent};
  background: ${(props) => schedulePaymentStatusMeta[props.$status].background};
  color: #111827;
`;

const ScheduleModalHeaderMain = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const ScheduleModalClientName = styled.strong`
  color: #111827;
  font-size: 18px;
  line-height: 1.25;
`;

const ScheduleModalMetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const ScheduleModalMetaItem = styled.div`
  min-width: 0;
  padding: 10px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.72);
`;

const ScheduleModalLabel = styled.div`
  margin-bottom: 4px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.25;
`;

const ScheduleModalValue = styled.div`
  color: #111827;
  font-size: 14px;
  line-height: 1.3;
  font-weight: 700;
  overflow-wrap: anywhere;
`;

const ScheduleOperationsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const ScheduleOperationButton = styled.button`
  min-height: 38px;
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    border-color: #007d88;
    color: #007d88;
    background: #f8fbfb;
  }
`;

const ModalField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InputLabel = styled.label`
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
`;

const CommentTextarea = styled.textarea`
  width: 100%;
  min-height: 96px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: #111827;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #007d88;
  }
`;

const StatusInfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px;
`;

const StatusInfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatusInfoDot = styled.span<{ $status: SchedulePaymentStatus }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${(props) => schedulePaymentStatusMeta[props.$status].accent};
`;

const StatusInfoTitle = styled.div`
  color: #111827;
  font-size: 14px;
  font-weight: 700;
`;

export default ScheduleCalendar;