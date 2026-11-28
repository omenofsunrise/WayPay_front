import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import useInvestorShare from "../api/hooks/useInvestorShare";
import type {
  InvestorSharedCredit,
  InvestorSharedReportResponse,
} from "../api/types/investorShare";
import { formatMoney } from "../utils/formatPrice";
import { formatDate } from "../utils/dateFormatter";
import { getInvestorReportDisplayValues } from "../utils/investorReportDisplay";

const money = (value?: number) => formatMoney((value ?? 0).toString());

const PublicInvestorReportPage = () => {
  const [searchParams] = useSearchParams();
  const rawToken = searchParams.get("token");
  // Отсекаем мусорные значения, чтобы не слать заведомо 404-й запрос.
  const token =
    rawToken && rawToken !== "undefined" && rawToken !== "null"
      ? rawToken
      : null;
  const { getSharedReport, getSharedCredits } = useInvestorShare();

  const [data, setData] = useState<InvestorSharedReportResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "done">("loading");
  // Договоры копим по страницам: у инвестора их может быть тысяча, и
  // вываливать всё разом незачем.
  const [credits, setCredits] = useState<InvestorSharedCredit[]>([]);
  const [page, setPage] = useState(1);
  const [totalCredits, setTotalCredits] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!token) {
        setStatus("error");
        return;
      }
      setStatus("loading");
      const response = await getSharedReport(token);
      if (cancelled) return;
      if (response?.report) {
        setData(response);
        setCredits(response.credits?.items ?? []);
        setTotalCredits(response.credits?.totalCount ?? 0);
        setPageSize(response.credits?.pageSize || 20);
        setPage(response.credits?.page || 1);
        setStatus("done");
      } else {
        setStatus("error");
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token, getSharedReport]);

  const report = data?.report;
  const reportValues = report && getInvestorReportDisplayValues(report);
  const hasMoreCredits = credits.length < totalCredits;

  const loadMoreCredits = async () => {
    if (!token || isLoadingMore) return;
    setIsLoadingMore(true);
    const next = await getSharedCredits(token, page + 1, pageSize);
    if (next?.items?.length) {
      setCredits((current) => [...current, ...next.items]);
      setPage(next.page || page + 1);
      setTotalCredits(next.totalCount ?? totalCredits);
    }
    setIsLoadingMore(false);
  };
  // Ссылка живёт полчаса, поэтому важна не дата, а время.
  const expiresAtLabel = data?.expiresAt
    ? new Date(data.expiresAt).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <Page>
      <Container>
        <Brand>WayPay</Brand>

        {status === "loading" && <Muted>Загрузка данных…</Muted>}

        {status === "error" && (
          <ErrorCard>
            <ErrorTitle>Не удалось открыть кассу</ErrorTitle>
            <Muted>
              Ссылка недействительна или срок её действия истёк. Попросите
              сотрудника сформировать новую ссылку.
            </Muted>
          </ErrorCard>
        )}

        {status === "done" && report && reportValues && (
          <>
            <Header>
              <Name>{report.nickName || report.fullName}</Name>
              {report.nickName && report.fullName !== report.nickName && (
                <Secondary>{report.fullName}</Secondary>
              )}
              <Secondary>
                Инвестор с {formatDate(report.createdAt)}
              </Secondary>
            </Header>

            <Card>
              <CardTitle>Касса</CardTitle>
              <Grid>
                <Tile
                  label="Инвестиция"
                  value={money(reportValues.investment)}
                  accent
                />
                <Tile label="Баланс" value={money(reportValues.balance)} accent />
                <Tile
                  label="Активных договоров"
                  value={String(report.activeCreditsAmount ?? 0)}
                />
                <Tile label="Просрочка" value={money(report.delinquencyAmount)} />
              </Grid>
            </Card>

            <Card>
              <CardTitle>Доход</CardTitle>
              <Grid>
                <Tile label="Поступления" value={money(reportValues.paymentIncome)} />
                <Tile
                  label="Ваша доля поступлений"
                  value={money(reportValues.investorPaymentIncome)}
                />
                <Tile
                  label="Начислено вам"
                  value={money(report.investorIncome)}
                />
              </Grid>
            </Card>

            <Card>
              <CardTitle>
                Договоры с вашими деньгами
                {totalCredits > 0 && <CountBadge>{totalCredits}</CountBadge>}
              </CardTitle>
              {credits.length === 0 ? (
                <Muted>Пока ни одного договора.</Muted>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Договор</Th>
                      <Th>Дата</Th>
                      <Th $right>Сумма</Th>
                      <Th $right>Оплачено</Th>
                      <Th $right>Остаток</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {credits.map((credit) => (
                      <tr key={credit.id}>
                        <Td>
                          <CreditName>
                            {credit.name || `Договор №${credit.id}`}
                          </CreditName>
                          <CreditClient>
                            {credit.clientFullName || "—"}
                            {credit.fromPool && " · из пула"}
                            {!credit.isActive && " · закрыт"}
                          </CreditClient>
                        </Td>
                        <Td>{formatDate(credit.creditDate)}</Td>
                        <Td $right>{money(credit.totalAmount)}</Td>
                        <Td $right>{money(credit.payed)}</Td>
                        <Td $right>{money(credit.rest)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {hasMoreCredits && (
                <MoreRow>
                  <MoreButton
                    type="button"
                    onClick={loadMoreCredits}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? "Загружаю…" : "Показать ещё"}
                  </MoreButton>
                  <Muted>
                    Показано {credits.length} из {totalCredits}
                  </Muted>
                </MoreRow>
              )}
            </Card>

            {data?.expiresAt && (
              <Footer>Ссылка действует до {expiresAtLabel}</Footer>
            )}
          </>
        )}
      </Container>
    </Page>
  );
};

const Tile = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <TileItem $accent={accent}>
    <TileLabel>{label}</TileLabel>
    <TileValue>{value}</TileValue>
  </TileItem>
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

const Header = styled.div`
  margin-bottom: 16px;
`;

const Name = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
`;

const Secondary = styled.div`
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

const CardTitle = styled.h2`
  margin: 0 0 14px;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
`;

const TileItem = styled.div<{ $accent?: boolean }>`
  padding: 12px 14px;
  border: 1px solid ${({ $accent }) => ($accent ? "#b6e0e4" : "#e5e7eb")};
  border-radius: 10px;
  background: ${({ $accent }) => ($accent ? "rgba(0, 125, 136, 0.06)" : "#fff")};
`;

const TileLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const TileValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #111827;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th<{ $right?: boolean }>`
  text-align: ${({ $right }) => ($right ? "right" : "left")};
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
`;

const Td = styled.td<{ $right?: boolean }>`
  text-align: ${({ $right }) => ($right ? "right" : "left")};
  padding: 10px;
  font-size: 14px;
  color: #111827;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
`;

const CreditName = styled.div`
  font-weight: 600;
`;

const CreditClient = styled.div`
  margin-top: 2px;
  font-size: 12px;
  color: #6b7280;
`;

const CountBadge = styled.span`
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  vertical-align: middle;
`;

const MoreRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  flex-wrap: wrap;
`;

const MoreButton = styled.button`
  padding: 9px 16px;
  border: 1px solid #b6e0e4;
  border-radius: 9px;
  background: rgba(0, 125, 136, 0.06);
  color: #007d88;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const Muted = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const Footer = styled.div`
  font-size: 13px;
  color: #6b7280;
  text-align: center;
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

export default PublicInvestorReportPage;
