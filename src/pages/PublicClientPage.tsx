import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import useClientToken from "../api/hooks/useClientToken";
import type {
  PublicClientDto,
  PublicCreditDto,
} from "../api/types/clientToken";
import { formatMoney } from "../utils/formatPrice";
import { formatDate } from "../utils/dateFormatter";

const money = (value?: number) => formatMoney((value ?? 0).toString());

const paymentTypeLabel = (type?: string) => {
  switch ((type || "").toLowerCase()) {
    case "cash":
      return "Наличные";
    case "card":
      return "Карта";
    case "acquiring":
      return "Эквайринг";
    default:
      return type || "—";
  }
};

const PublicClientPage = () => {
  const [searchParams] = useSearchParams();
  const rawToken = searchParams.get("token");
  // Отсекаем мусорные значения ("undefined"/"null"), чтобы не слать заведомо 404-й запрос.
  const token =
    rawToken && rawToken !== "undefined" && rawToken !== "null"
      ? rawToken
      : null;
  const { getClientByTemporaryToken } = useClientToken();

  const [client, setClient] = useState<PublicClientDto | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "done">("loading");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!token) {
        setStatus("error");
        return;
      }
      setStatus("loading");
      const data = await getClientByTemporaryToken(token);
      if (cancelled) return;
      if (data) {
        setClient(data);
        setStatus("done");
      } else {
        setStatus("error");
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token, getClientByTemporaryToken]);

  return (
    <Page>
      <Container>
        <Brand>WayPay</Brand>

        {status === "loading" && <Muted>Загрузка данных…</Muted>}

        {status === "error" && (
          <ErrorCard>
            <ErrorTitle>Не удалось открыть данные</ErrorTitle>
            <Muted>
              Ссылка недействительна или срок её действия истёк. Попросите
              сотрудника сформировать новую ссылку.
            </Muted>
          </ErrorCard>
        )}

        {status === "done" && client && (
          <>
            <ClientHeader>
              <ClientName>{client.fullName}</ClientName>
              {client.companyName && (
                <CompanyName>{client.companyName}</CompanyName>
              )}
            </ClientHeader>

            {client.credits.length === 0 ? (
              <Muted>Договоров нет.</Muted>
            ) : (
              client.credits.map((credit) => (
                <CreditBlock key={credit.id} credit={credit} />
              ))
            )}
          </>
        )}
      </Container>
    </Page>
  );
};

const CreditBlock = ({ credit }: { credit: PublicCreditDto }) => {
  const schedule = credit.schedules;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{credit.name || `Договор №${credit.id}`}</CardTitle>
        <StatusBadge $active={credit.isActive}>
          {credit.isActive ? "Активен" : "Закрыт"}
        </StatusBadge>
      </CardHeader>

      <FieldsGrid>
        <Field label="Дата договора" value={formatDate(credit.creditDate)} />
        <Field label="Срок, мес." value={String(credit.termMonths ?? 0)} />
        <Field label="Сумма договора" value={money(credit.totalAmount)} />
        <Field label="Сумма без наценки" value={money(credit.totalClean)} />
        <Field label="Первый платёж" value={money(credit.firstPayment)} />
        <Field label="Начислено" value={money(credit.accured)} />
        <Field label="Оплачено" value={money(credit.payed)} />
        <Field label="Остаток" value={money(credit.rest)} />
        <Field label="Долг за месяц" value={money(credit.currentMonthDebt)} />
        <Field label="Просрочка" value={money(credit.debt)} />
      </FieldsGrid>

      {credit.supportPhone && (
        <Support>
          Поддержка:{" "}
          <a href={`tel:${credit.supportPhone}`}>{credit.supportPhone}</a>
        </Support>
      )}

      <SectionTitle>График платежей</SectionTitle>
      {schedule && schedule.items.length > 0 ? (
        <>
          <ScheduleSummary>
            <span>Осталось платежей: {schedule.leftPaymentsCounts ?? 0}</span>
            <span>Остаток по графику: {money(schedule.restAmount)}</span>
          </ScheduleSummary>
          <Table>
            <thead>
              <tr>
                <Th>Дата</Th>
                <Th $right>Платёж</Th>
                <Th $right>Статус</Th>
              </tr>
            </thead>
            <tbody>
              {schedule.items.map((item) => (
                <tr key={item.id}>
                  <Td>{formatDate(item.paymentDate)}</Td>
                  <Td $right>{money(item.paymentAmount)}</Td>
                  <Td $right>
                    <PayFlag $paid={item.isPayed}>
                      {item.isPayed ? "Оплачен" : "Ожидается"}
                    </PayFlag>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      ) : (
        <Muted>График платежей отсутствует.</Muted>
      )}

      <SectionTitle>История платежей</SectionTitle>
      {credit.payments && credit.payments.length > 0 ? (
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
            {credit.payments.map((payment) => (
              <tr key={payment.id}>
                <Td>{formatDate(payment.paymentDate)}</Td>
                <Td $right>{money(payment.paymentAmount)}</Td>
                <Td>{paymentTypeLabel(payment.type)}</Td>
                <Td>{payment.employeeFullName || "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Muted>Платежей ещё не было.</Muted>
      )}
    </Card>
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
`;

const Container = styled.div`
  max-width: 760px;
  margin: 0 auto;
`;

const Brand = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: #007d88;
  letter-spacing: 0.02em;
  margin-bottom: 16px;
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

const Support = styled.div`
  margin-top: 12px;
  font-size: 14px;
  color: #374151;

  a {
    color: #007d88;
    font-weight: 600;
    text-decoration: none;
  }
`;

const SectionTitle = styled.h3`
  margin: 20px 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
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

export default PublicClientPage;
