import { useState } from "react";
import styled from "styled-components";
import {
  authStorage,
  MAX_ACCOUNTS,
  type StoredAccount,
} from "../../api/utils/auth-storage";

const AccountSwitcher = () => {
  const [accounts, setAccounts] = useState<StoredAccount[]>(() =>
    authStorage.getAccounts()
  );
  const activeId = authStorage.getActiveAccountId();

  const handleSwitch = (id: string) => {
    if (id === activeId) return;
    if (!authStorage.switchAccount(id)) return;
    // Сбрасываем пин и перезагружаем — App запросит пин нового аккаунта.
    sessionStorage.removeItem("lastActivity");
    window.location.href = "/credits";
  };

  const handleAdd = () => {
    if (accounts.length >= MAX_ACCOUNTS) return;
    sessionStorage.setItem("wp_add_account", "1");
    window.location.href = "/auth";
  };

  const handleRemove = (id: string) => {
    if (!window.confirm("Удалить этот аккаунт из списка на устройстве?"))
      return;
    const res = authStorage.removeAccount(id);
    if (res.removedActive) {
      sessionStorage.removeItem("lastActivity");
      window.location.href = res.nextId ? "/credits" : "/auth";
      return;
    }
    setAccounts(authStorage.getAccounts());
  };

  return (
    <Wrapper>
      <Title>Аккаунты</Title>
      <Hint>
        Можно войти в несколько аккаунтов (до {MAX_ACCOUNTS}) и переключаться
        между ними без выхода из основного.
      </Hint>

      <List>
        {accounts.map((acc) => {
          const isActive = acc.id === activeId;
          return (
            <Card
              key={acc.id}
              $active={isActive}
              onClick={() => handleSwitch(acc.id)}
            >
              <Avatar>{(acc.label || "?").charAt(0).toUpperCase()}</Avatar>
              <Info>
                <Name>{acc.label || "Аккаунт"}</Name>
                <Sub>
                  {isActive
                    ? "Текущий аккаунт"
                    : "Нажмите, чтобы переключиться"}
                </Sub>
              </Info>
              {isActive && <ActiveBadge>активный</ActiveBadge>}
              <Remove
                title="Удалить аккаунт с устройства"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(acc.id);
                }}
              >
                ×
              </Remove>
            </Card>
          );
        })}
      </List>

      <AddButton
        type="button"
        onClick={handleAdd}
        disabled={accounts.length >= MAX_ACCOUNTS}
      >
        + Добавить аккаунт
      </AddButton>
      {accounts.length >= MAX_ACCOUNTS && (
        <LimitHint>Достигнут лимит в {MAX_ACCOUNTS} аккаунта.</LimitHint>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  max-width: 560px;
  padding: 8px 4px;
`;

const Title = styled.h2`
  margin: 0 0 6px;
  font-size: 20px;
  color: #111827;
`;

const Hint = styled.p`
  margin: 0 0 16px;
  color: #6b7280;
  font-size: 14px;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Card = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid ${(p) => (p.$active ? "#007d88" : "#e5e7eb")};
  background: ${(p) => (p.$active ? "#f0f9fa" : "#fff")};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: #007d88;
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #007d88;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const Name = styled.div`
  font-weight: 600;
  color: #111827;
  font-size: 15px;
`;

const Sub = styled.div`
  color: #6b7280;
  font-size: 13px;
`;

const ActiveBadge = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #007d88;
  background: #d7f0f1;
  padding: 3px 10px;
  border-radius: 999px;
  flex-shrink: 0;
`;

const Remove = styled.button`
  background: none;
  border: none;
  font-size: 22px;
  line-height: 1;
  color: #9ca3af;
  cursor: pointer;
  flex-shrink: 0;
  &:hover {
    color: #ef4444;
  }
`;

const AddButton = styled.button`
  margin-top: 16px;
  padding: 11px 18px;
  border: 1px dashed #007d88;
  background: #fff;
  color: #007d88;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: all 0.15s ease;
  &:hover:not(:disabled) {
    background: #f0f9fa;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LimitHint = styled.div`
  margin-top: 8px;
  color: #9ca3af;
  font-size: 13px;
`;

export default AccountSwitcher;
