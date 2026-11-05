import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { getUserActivityStats, type UserActivityStats } from "../../api/userActivity";

const UserActivityPanel = () => {
  const [stats, setStats] = useState<UserActivityStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setStats(await getUserActivityStats(30));
    } catch {
      setError("Не удалось загрузить статистику активности");
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!stats) return <Muted>Загрузка...</Muted>;

  return (
    <Wrap>
      <Cards>
        <Card><Value>{stats.onlineNow}</Value><Label>Сейчас онлайн</Label></Card>
        <Card><Value>{stats.uniqueUsers}</Value><Label>Уникальных за 30 дней</Label></Card>
        <Card><Value>{stats.interactedUsers}</Value><Label>Взаимодействовали</Label></Card>
        <Card><Value>{stats.events}</Value><Label>Событий активности</Label></Card>
      </Cards>
      <Title>Активность по дням</Title>
      <Table>
        <thead><tr><th>Дата</th><th>Пользователи</th><th>Действия</th></tr></thead>
        <tbody>
          {stats.byDay.slice().reverse().map((day) => (
            <tr key={day.date}><td>{day.date}</td><td>{day.uniqueUsers}</td><td>{day.interactions}</td></tr>
          ))}
        </tbody>
      </Table>
    </Wrap>
  );
};

const Wrap = styled.div`padding: 8px 0 24px;`;
const Cards = styled.div`display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); gap: 12px; margin-bottom: 28px; @media (max-width: 700px) { grid-template-columns: repeat(2, 1fr); }`;
const Card = styled.div`padding: 18px; border: 1px solid #dfe6ed; border-radius: 10px; background: #fff;`;
const Value = styled.div`font-size: 28px; font-weight: 700; color: #007d88;`;
const Label = styled.div`margin-top: 5px; color: #667085; font-size: 13px;`;
const Title = styled.h3`margin: 0 0 12px; color: #172033;`;
const Table = styled.table`width: 100%; border-collapse: collapse; th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #edf0f3; } th { color: #667085; font-weight: 600; }`;
const Muted = styled.div`color: #667085; padding: 24px 0;`;
const ErrorText = styled(Muted)`color: #b42318;`;

export default UserActivityPanel;
