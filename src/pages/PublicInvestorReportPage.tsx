import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import useInvestorShare from "../api/hooks/useInvestorShare";
import type { InvestorSharedReportResponse } from "../api/types/investorShare";
import { formatMoney } from "../utils/formatPrice";
import { formatDate } from "../utils/dateFormatter";

const money = (value?: number) => formatMoney((value ?? 0).toString());

const PublicInvestorReportPage = () => {
  const [searchParams] = useSearchParams();
  const rawToken = searchParams.get("token");
  // Отсекаем мусорные значения, чтобы не слать заведомо 404-й запрос.
  const token =
    rawToken && rawToken !== "undefined" && rawToken !== "null"
      ? rawToken
      : null;
  const { getSharedReport } = useInvestorShare();

  const [data, setData] = useState<InvestorSharedReportResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "done">("loading");

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

        {status === "done" && report && (
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
                  value={money(report.investment)}
                  accent
                />
                <Tile label="Баланс" value={money(report.balance)} accent />
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
                <Tile label="Поступления" value={money(report.paymentIncome)} />
                <Tile
                  label="Ваша доля поступлений"
                  value={money(report.investorPaymentIncome)}
                />
                <Tile
                  label="Начислено вам"
                  value={money(report.investorIncome)}
                />
              </Grid>
            </Card>

            {data?.expiresAt && (
              <Footer>
                Ссылка действует до {formatDate(data.expiresAt)}
              </Footer>
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
