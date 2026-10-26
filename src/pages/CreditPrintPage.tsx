import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { formatDate } from "../utils/dateFormatter";
import { formatMoney } from "../utils/formatPrice";
import creditService from "../api/services/creditService";
import clientService from "../api/services/clientService";
import paymentService from "../api/services/paymentService";
import scheduleService from "../api/services/scheduleService";
import type { Credit } from "../api/types/credit";
import type { Client } from "../api/types/client";
import type { Payment } from "../api/types/payment";
import type { ScheduleDetails } from "../api/types/schedule";
import { getCreditGuarantors, guarantorKey } from "../utils/creditGuarantors";

const money = (value?: number) => formatMoney((value ?? 0).toString());

const paymentTypeLabel = (type?: string) => {
  switch (type) {
    case "cash":
      return "Наличные";
    case "card":
      return "Карта";
    case "paymentPlace":
      return "Терминал";
    default:
      return "—";
  }
};

const dash = (value?: string | number | null) => {
  if (value === null || value === undefined) return "—";
  const text = String(value).trim();
  return text === "" ? "—" : text;
};

const date = (value?: string | Date | null) => (value ? formatDate(value) : "—");

const CreditPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const creditId = Number(id);

  const [credit, setCredit] = useState<Credit | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schedule, setSchedule] = useState<ScheduleDetails[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "done">("loading");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!creditId || Number.isNaN(creditId)) {
        setStatus("error");
        return;
      }

      try {
        const creditData = await creditService.getCreditById(creditId);
        if (cancelled) return;
        setCredit(creditData);

        // Остальное грузим разом: страница печати бесполезна по частям.
        const [clientData, paymentsData, scheduleData] = await Promise.all([
          clientService.getClientById(creditData.clientId),
          paymentService.getPaymentsByCreditId({
            creditId,
            page: 1,
            pageSize: 500,
          }),
          scheduleService.getByCreditId(creditId, { page: 1, pageSize: 500 }),
        ]);

        if (cancelled) return;
        setClient(clientData);
        setPayments(paymentsData.items ?? []);
        setSchedule(scheduleData.items ?? []);
        setStatus("done");
      } catch (error) {
        console.error("Не удалось собрать данные для печати:", error);
        if (!cancelled) setStatus("error");
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [creditId]);

  const print = useCallback(() => window.print(), []);

  const paidCount = schedule.filter((item) => item.isPaid || item.payed).length;

  return (
    <Page>
      <Container>
        <TopBar>
          <Brand>WayPay</Brand>
          <PrintButton type="button" onClick={print}>
            Печать
          </PrintButton>
        </TopBar>

        {status === "loading" && <Muted>Загрузка данных…</Muted>}

        {status === "error" && (
          <ErrorCard>
            <ErrorTitle>Не удалось открыть данные</ErrorTitle>
            <Muted>
              Договор не найден или нет доступа. Закройте страницу и откройте
              печать из окна договора заново.
            </Muted>
          </ErrorCard>
        )}

        {status === "done" && credit && (
          <>
            <ClientHeader>
              <ClientName>{client?.fullName || credit.clientFullName}</ClientName>
              <CompanyName>
                Договор №{credit.id}
                {credit.name ? ` · ${credit.name}` : ""}
              </CompanyName>
            </ClientHeader>

            <Card>
              <CardHeader>
                <CardTitle>Клиент</CardTitle>
              </CardHeader>
              <FieldsGrid>
                <Field label="ФИО" value={dash(client?.fullName)} />
                <Field label="Телефон" value={dash(client?.phone)} />
                <Field label="Второй телефон" value={dash(client?.secondPhone)} />
                <Field label="Дата рождения" value={date(client?.birthdate)} />
                <Field label="Паспорт" value={dash(client?.doc)} />
                <Field label="Выдан" value={date(client?.docIssueDate)} />
                <Field
                  label="Адрес регистрации"
                  value={dash(client?.registrationAddress)}
                />
                <Field
                  label="Адрес фактический"
                  value={dash(client?.actualAddress)}
                />
              </FieldsGrid>
            </Card>

            {getCreditGuarantors(credit).map((g, index, all) => (
              <Card key={guarantorKey(g)}>
                <CardHeader>
                  <CardTitle>
                    {all.length > 1 ? `Поручитель ${index + 1}` : "Поручитель"}
                  </CardTitle>
                </CardHeader>
                <FieldsGrid>
                  <Field label="ФИО" value={dash(g.fullname)} />
                  <Field label="Телефон" value={dash(g.phone)} />
                  <Field
                    label="Паспорт"
                    value={dash(index === 0 ? credit.guarantor?.doc : undefined)}
                  />
                  <Field label="Адрес" value={dash(g.address)} />
                </FieldsGrid>
              </Card>
            ))}

            <Card>
              <CardHeader>
                <CardTitle>Договор №{credit.id}</CardTitle>
                <StatusBadge $active={credit.isActive}>
                  {credit.isActive ? "Активен" : "Закрыт"}
                </StatusBadge>
              </CardHeader>
              <FieldsGrid>
                <Field label="Дата договора" value={date(credit.creditDate)} />
                <Field label="Срок, мес." value={String(credit.termMonths ?? 0)} />
                <Field label="Сумма договора" value={money(credit.totalAmount)} />
                <Field label="Сумма без наценки" value={money(credit.totalClean)} />
                <Field label="Первый платёж" value={money(credit.firstPayment)} />
                <Field label="Начислено" value={money(credit.accured)} />
                <Field label="Оплачено" value={money(credit.payed)} />
                <Field label="Остаток" value={money(credit.rest)} />
                <Field label="Долг за месяц" value={money(credit.currentMonthDebt)} />
                <Field label="Просрочка" value={money(credit.debt)} />
                <Field label="Тип договора" value={dash(credit.creditTypeName)} />
                <Field label="Оформил" value={dash(credit.employeeName)} />
              </FieldsGrid>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Платежи</CardTitle>
              </CardHeader>
              {payments.length > 0 ? (
                <Table>
                  <thead>
                    <tr>
                      <Th>Дата</Th>
                      <Th $right>Сумма</Th>
                      <Th>Способ</Th>
                      <Th>Принял</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <Td>{date(payment.paymentDate)}</Td>
                        <Td $right>{money(payment.paymentAmount)}</Td>
                        <Td>{paymentTypeLabel(payment.type)}</Td>
                        <Td>{dash(payment.employeeFullName)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Muted>Платежей ещё не было.</Muted>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>График платежей</CardTitle>
              </CardHeader>
              {schedule.length > 0 ? (
                <>
                  <ScheduleSummary>
                    <span>Всего платежей: {schedule.length}</span>
                    <span>Оплачено: {paidCount}</span>
                    <span>Осталось: {schedule.length - paidCount}</span>
                  </ScheduleSummary>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Дата</Th>
                        <Th $right>Платёж</Th>
                        <Th $right>Остаток</Th>
                        <Th $right>Статус</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((item) => {
                        const paid = Boolean(item.isPaid || item.payed);
                        return (
                          <tr key={item.id}>
                            <Td>{date(item.paymentDate)}</Td>
                            <Td $right>{money(item.paymentAmount)}</Td>
                            <Td $right>{money(item.rest)}</Td>
                            <Td $right>
                              <PayFlag $paid={paid}>
                                {paid ? "Оплачен" : "Ожидается"}
                              </PayFlag>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </>
              ) : (
                <Muted>График платежей отсутствует.</Muted>
              )}
            </Card>
          </>
        )}
      </Container>
    </Page>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <FieldItem>
    <FieldLabel>{label}</FieldLabel>
    <FieldValue>{value}</FieldValue>
  </FieldItem>
);

const Page = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
  padding: 20px 12px 48px;
  box-sizing: border-box;

  @media print {
    background: #fff;
    padding: 0;
    min-height: 0;
  }
`;

const Container = styled.div`
  max-width: 760px;
  margin: 0 auto;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
`;

const Brand = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: #007d88;
  letter-spacing: 0.02em;
`;

/// Сама кнопка на печать попадать не должна.
const PrintButton = styled.button`
  padding: 8px 18px;
  border: none;
  border-radius: 8px;
  background: #007d88;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #006b74;
  }

  @media print {
    display: none;
  }
`;

const ClientHeader = styled.div`
  margin-bottom: 16px;
`;

const ClientName = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
`;

const CompanyName = styled.div`
  margin-top: 4px;
  font-size: 15px;
  color: #6b7280;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  @media print {
    box-shadow: none;
    border: 1px solid #e5e7eb;
    break-inside: avoid;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  overflow-wrap: anywhere;
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: ${(p) => (p.$active ? "#065f46" : "#6b7280")};
  background: ${(p) => (p.$active ? "#d1fae5" : "#e5e7eb")};
`;

const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (min-width: 560px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const FieldItem = styled.div`
  padding: 10px;
  border: 1px solid #eef0f3;
  border-radius: 8px;
  background: #f9fafb;
  min-width: 0;
`;

const FieldLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const FieldValue = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  overflow-wrap: anywhere;
`;

const ScheduleSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-bottom: 10px;
  font-size: 13px;
  color: #6b7280;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  tbody tr:nth-child(even) {
    background: #f9fafb;
  }

  @media print {
    tr {
      break-inside: avoid;
    }
  }
`;

const Th = styled.th<{ $right?: boolean }>`
  padding: 8px 10px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-align: ${(p) => (p.$right ? "right" : "left")};
  white-space: nowrap;
`;

const Td = styled.td<{ $right?: boolean }>`
  padding: 8px 10px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
  color: #374151;
  text-align: ${(p) => (p.$right ? "right" : "left")};
`;

const PayFlag = styled.span<{ $paid: boolean }>`
  font-weight: 600;
  color: ${(p) => (p.$paid ? "#059669" : "#b45309")};
`;

const Muted = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const ErrorCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`;

const ErrorTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: #b91c1c;
`;

export default CreditPrintPage;
