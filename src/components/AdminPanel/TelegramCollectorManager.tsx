import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import telegramCollectorService from "../../api/services/telegramCollectorService";
import type { CollectorStatus } from "../../api/types/telegramCollector";
import AccountsPanel from "./TelegramCollector/AccountsPanel";
import CandidatesPanel from "./TelegramCollector/CandidatesPanel";
import { Badge, ErrorMessage, getErrorMessage, Muted } from "./TelegramCollector/ui";

type View = "candidates" | "accounts";

/**
 * Вкладка «Telegram → ЧС+»: нейросеть находит в Telegram-чатах людей, о которых
 * пишут как о должниках или мошенниках; сотрудник проверяет и добавляет в ЧС+.
 */
const TelegramCollectorManager = () => {
  const [view, setView] = useState<View>("candidates");
  const [status, setStatus] = useState<CollectorStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await telegramCollectorService.getStatus());
      setError(null);
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const timer = window.setInterval(loadStatus, 30_000);
    return () => window.clearInterval(timer);
  }, [loadStatus]);

  const pending = status?.candidates.Pending ?? 0;

  return (
    <Container>
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {status && (
        <StatusBar>
          <Badge $tone={status.enabled ? "green" : "gray"}>
            {status.enabled ? "Сборщик включён" : "Сборщик выключен на этом сервере"}
          </Badge>
          {status.enabled && !status.telegramConfigured && (
            <Badge $tone="red">Не заданы api_id / api_hash</Badge>
          )}
          <Badge $tone={status.llmConfigured ? "teal" : "red"}>
            {status.llmConfigured ? `Нейросеть: ${status.llmModel}` : "Нет ключа нейросети"}
          </Badge>
          {!status.blacklistCreatorConfigured && (
            <Badge $tone="amber">Не задан системный аккаунт ЧС+ — добавлять не от кого</Badge>
          )}
          <Muted>
            За сутки разобрано: {status.processedLastDay}
            {status.failedLastDay > 0 ? ` (не разобрано из-за ошибок: ${status.failedLastDay})` : ""}
            {status.queueLength > 0 ? ` · в очереди: ${status.queueLength}` : ""}
          </Muted>
        </StatusBar>
      )}

      <Switcher>
        <SwitchButton $active={view === "candidates"} onClick={() => setView("candidates")}>
          Кандидаты{pending > 0 ? ` (${pending})` : ""}
        </SwitchButton>
        <SwitchButton $active={view === "accounts"} onClick={() => setView("accounts")}>
          Аккаунты и чаты
        </SwitchButton>
      </Switcher>

      {view === "candidates" ? (
        <CandidatesPanel onChanged={loadStatus} />
      ) : (
        <AccountsPanel
          canConnect={!!status?.enabled && !!status?.telegramConfigured}
          onChanged={loadStatus}
        />
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const Switcher = styled.div`
  display: inline-flex;
  align-self: flex-start;
  padding: 3px;
  border-radius: 10px;
  background: #f2f4f7;
`;

const SwitchButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  border: 0;
  border-radius: 8px;
  color: ${({ $active }) => ($active ? "#101828" : "#667085")};
  background: ${({ $active }) => ($active ? "#fff" : "transparent")};
  box-shadow: ${({ $active }) => ($active ? "0 1px 3px rgba(16, 24, 40, 0.1)" : "none")};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

export default TelegramCollectorManager;
