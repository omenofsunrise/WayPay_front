import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import useWhatsAppSender from "../../api/hooks/useWhatsAppSender";
import type {
  SenderReport,
  SenderReportDetails,
} from "../../api/types/whatsappSender";

interface SenderReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const money = (value: number): string =>
  `${(value ?? 0).toLocaleString("ru-RU")} ₽`;

const formatDateTime = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Локальная дата в формате YYYY-MM-DD для input[type=date].
const toInputDate = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const PAGE_SIZE = 50;

const SenderReportModal: React.FC<SenderReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { getReport, getReportDetails } = useWhatsAppSender();
  const [date, setDate] = useState<string>(() => toInputDate(new Date()));
  const [report, setReport] = useState<SenderReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>("");

  // Детализация с пагинацией и фильтром по статусу.
  const [details, setDetails] = useState<SenderReportDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState<"all" | "ok" | "fail">(
    "all"
  );
  const [detailsPage, setDetailsPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const result = await getReport(
      date ? new Date(date).toISOString() : undefined
    );
    if (!result) setLoadError("Не удалось загрузить отчёт");
    setReport(result);
    setLoading(false);
  }, [date, getReport]);

  useEffect(() => {
    if (isOpen) {
      setDetailsOpen(false);
      setDetails(null);
      load();
    }
  }, [isOpen, load]);

  const loadDetails = useCallback(
    async (page: number, success: "all" | "ok" | "fail") => {
      const result = await getReportDetails({
        date: date ? new Date(date).toISOString() : undefined,
        isSuccess: success === "all" ? undefined : success === "ok",
        page,
        pageSize: PAGE_SIZE,
      });
      setDetails(result);
    },
    [date, getReportDetails]
  );

  useEffect(() => {
    if (isOpen && detailsOpen) {
      loadDetails(detailsPage, detailsSuccess);
    }
  }, [isOpen, detailsOpen, detailsPage, detailsSuccess, loadDetails]);

  if (!isOpen) return null;

  const s = report?.summary;

  return (
    <Overlay onClick={onClose}>
      <Content onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Отчёт по рассылкам</Title>
          <Close onClick={onClose}>✖</Close>
        </Header>

        <Toolbar>
          <DateField>
            <label>Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </DateField>
          <RefreshBtn onClick={load} disabled={loading}>
            {loading ? "Загрузка…" : "Обновить"}
          </RefreshBtn>
        </Toolbar>

        {loadError && <ErrorText>{loadError}</ErrorText>}

        {s && (
          <SummaryGrid>
            <SummaryCard>
              <SummaryValue>{s.total}</SummaryValue>
              <SummaryLabel>Всего</SummaryLabel>
            </SummaryCard>
            <SummaryCard>
              <SummaryValue $tone="ok">{s.successful}</SummaryValue>
              <SummaryLabel>Успешно</SummaryLabel>
            </SummaryCard>
            <SummaryCard>
              <SummaryValue $tone="fail">{s.failed}</SummaryValue>
              <SummaryLabel>Ошибки</SummaryLabel>
            </SummaryCard>
            <SummaryCard>
              <SummaryValue>
                {Math.round((s.successRate ?? 0) * 100) / 100}%
              </SummaryValue>
              <SummaryLabel>Успешность</SummaryLabel>
            </SummaryCard>
            <SummaryCard>
              <SummaryValue>{money(s.successfulAmount)}</SummaryValue>
              <SummaryLabel>Сумма (успешно)</SummaryLabel>
            </SummaryCard>
          </SummaryGrid>
        )}

        {report && report.senders.length > 0 && (
          <Section>
            <SectionTitle>По рассылкам</SectionTitle>
            {report.senders.map((sender) => (
              <SenderRow key={sender.senderId}>
                <SenderRowMain>
                  <b>#{sender.senderId}</b> · {sender.senderType}
                  {sender.eventDays > 0 && ` · за ${sender.eventDays} дн.`}
                </SenderRowMain>
                <SenderRowStats>
                  <span>{sender.total} всего</span>
                  <OkText>{sender.successful} ок</OkText>
                  <FailText>{sender.failed} ошибок</FailText>
                  <span>
                    {Math.round((sender.successRate ?? 0) * 100) / 100}%
                  </span>
                </SenderRowStats>
              </SenderRow>
            ))}
          </Section>
        )}

        {report && report.recentFailures.length > 0 && (
          <Section>
            <SectionTitle>Последние ошибки</SectionTitle>
            {report.recentFailures.map((f, idx) => (
              <FailureRow key={idx}>
                <div>
                  <b>{f.clientName}</b> · {money(f.paymentAmount)} ·{" "}
                  {formatDateTime(f.sentAt)}
                </div>
                <FailureMsg>{f.errorMessage || "—"}</FailureMsg>
              </FailureRow>
            ))}
          </Section>
        )}

        {report && report.senders.length === 0 && !loading && (
          <EmptyText>За выбранную дату отправок не было.</EmptyText>
        )}

        <DetailsToggle
          onClick={() => {
            setDetailsPage(1);
            setDetailsOpen((v) => !v);
          }}
        >
          {detailsOpen
            ? "Скрыть детализацию"
            : "Показать детализацию по сообщениям"}
        </DetailsToggle>

        {detailsOpen && (
          <Section>
            <FilterRow>
              <FilterBtn
                $active={detailsSuccess === "all"}
                onClick={() => {
                  setDetailsPage(1);
                  setDetailsSuccess("all");
                }}
              >
                Все
              </FilterBtn>
              <FilterBtn
                $active={detailsSuccess === "ok"}
                onClick={() => {
                  setDetailsPage(1);
                  setDetailsSuccess("ok");
                }}
              >
                Успешные
              </FilterBtn>
              <FilterBtn
                $active={detailsSuccess === "fail"}
                onClick={() => {
                  setDetailsPage(1);
                  setDetailsSuccess("fail");
                }}
              >
                С ошибкой
              </FilterBtn>
            </FilterRow>

            {details && details.items.length > 0 ? (
              <DetailsTable>
                <thead>
                  <tr>
                    <th>Клиент</th>
                    <th>Сумма</th>
                    <th>Бот</th>
                    <th>Статус</th>
                    <th>Отправлено</th>
                  </tr>
                </thead>
                <tbody>
                  {details.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.clientName}</td>
                      <td>{money(item.paymentAmount)}</td>
                      <td>{item.botName || `#${item.channelBotId}`}</td>
                      <td>
                        {item.isSuccess ? (
                          <OkText>Успешно</OkText>
                        ) : (
                          <FailText title={item.errorMessage ?? ""}>
                            Ошибка
                          </FailText>
                        )}
                      </td>
                      <td>{formatDateTime(item.sentAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </DetailsTable>
            ) : (
              <EmptyText>Нет записей.</EmptyText>
            )}

            {details && details.totalPages > 1 && (
              <Pager>
                <PagerBtn
                  disabled={detailsPage <= 1}
                  onClick={() => setDetailsPage((p) => Math.max(1, p - 1))}
                >
                  ←
                </PagerBtn>
                <span>
                  {details.page} / {details.totalPages}
                </span>
                <PagerBtn
                  disabled={detailsPage >= details.totalPages}
                  onClick={() =>
                    setDetailsPage((p) => Math.min(details.totalPages, p + 1))
                  }
                >
                  →
                </PagerBtn>
              </Pager>
            )}
          </Section>
        )}
      </Content>
    </Overlay>
  );
};

export default SenderReportModal;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
`;

const Content = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 900px;
  max-width: 95vw;
  max-height: 92vh;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
`;

const Close = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #9ca3af;
  &:hover {
    color: #111827;
  }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 16px;
`;

const DateField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  label {
    font-size: 12px;
    color: #6b7280;
  }
  input {
    padding: 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
  }
`;

const RefreshBtn = styled.button`
  padding: 9px 16px;
  border-radius: 8px;
  border: none;
  background: #007d88;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
`;

const SummaryCard = styled.div<{ $tone?: "ok" | "fail" }>`
  background: #f9f9f9;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 12px;
  text-align: center;
`;

const SummaryValue = styled.div<{ $tone?: "ok" | "fail" }>`
  font-size: 20px;
  font-weight: 700;
  color: ${(p) =>
    p.$tone === "ok" ? "#059669" : p.$tone === "fail" ? "#dc2626" : "#111827"};
`;

const SummaryLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h4`
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: #374151;
`;

const SenderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const SenderRowMain = styled.div`
  font-size: 13px;
  color: #374151;
`;

const SenderRowStats = styled.div`
  display: flex;
  gap: 14px;
  font-size: 13px;
  color: #6b7280;
`;

const OkText = styled.span`
  color: #059669;
  font-weight: 600;
`;

const FailText = styled.span`
  color: #dc2626;
  font-weight: 600;
`;

const FailureRow = styled.div`
  padding: 8px 12px;
  border-left: 3px solid #ef4444;
  background: #fef2f2;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 13px;
  color: #374151;
`;

const FailureMsg = styled.div`
  font-size: 12px;
  color: #b91c1c;
  margin-top: 2px;
`;

const EmptyText = styled.div`
  text-align: center;
  color: #9ca3af;
  padding: 20px;
  font-size: 14px;
`;

const ErrorText = styled.div`
  color: #dc2626;
  font-size: 13px;
  margin-bottom: 12px;
`;

const DetailsToggle = styled.button`
  background: none;
  border: none;
  color: #007d88;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  padding: 6px 0;
  margin-bottom: 8px;
  &:hover {
    text-decoration: underline;
  }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const FilterBtn = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid ${(p) => (p.$active ? "#007d88" : "#d1d5db")};
  background: ${(p) => (p.$active ? "#007d88" : "#fff")};
  color: ${(p) => (p.$active ? "#fff" : "#374151")};
  font-size: 13px;
  cursor: pointer;
`;

const DetailsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th,
  td {
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1px solid #f0f0f0;
  }
  th {
    color: #6b7280;
    font-weight: 600;
  }
`;

const Pager = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 12px;
  font-size: 13px;
  color: #6b7280;
`;

const PagerBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
