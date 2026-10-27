import { useState } from "react";
import styled from "styled-components";
import { Check, MoreVertical, Plus } from "react-feather";
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
      <SectionHeader>
        <Title>Аккаунты</Title>
        <CountBadge>{accounts.length} из {MAX_ACCOUNTS}</CountBadge>
      </SectionHeader>
      <Hint>Переключайтесь без повторного входа</Hint>

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
              {isActive && (
                <ActiveBadge>
                  <Check size={16} />
                  Текущий
                </ActiveBadge>
              )}
              <Remove
                type="button"
                title="Удалить аккаунт с устройства"
                aria-label={`Удалить аккаунт ${acc.label || "Аккаунт"} с устройства`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(acc.id);
                }}
              >
                <MoreVertical size={20} />
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
        <Plus size={20} />
        Добавить аккаунт
      </AddButton>
      <LimitHint>
        {accounts.length >= MAX_ACCOUNTS
          ? `Достигнут лимит в ${MAX_ACCOUNTS} аккаунта.`
          : `Доступно ещё ${MAX_ACCOUNTS - accounts.length} аккаунта`}
      </LimitHint>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-width: 0;
  padding: 24px;
  border: 1px solid #dfe6ed;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 3px 12px rgba(15, 23, 42, 0.035);
  box-sizing: border-box;
  text-align: left;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h2`
  margin: 0;
  color: #172033;
  font-size: 22px;
  line-height: 1.2;
`;

const CountBadge = styled.span`
  padding: 5px 10px;
  border-radius: 999px;
  background: #e5f5f6;
  color: #007d88;
  font-size: 13px;
  font-weight: 700;
`;

const Hint = styled.p`
  margin: 6px 0 20px;
  color: #7a8495;
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
  padding: 16px 18px;
  border: 1px solid ${(p) => (p.$active ? "#cfe8ea" : "#e5e7eb")};
  background: ${(p) => (p.$active ? "#fbfefe" : "#fff")};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: #007d88;
  }
`;

const Avatar = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #007d88;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
  flex-shrink: 0;
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const Name = styled.div`
  font-weight: 700;
  color: #111827;
  font-size: 15px;
`;

const Sub = styled.div`
  color: #6b7280;
  font-size: 13px;
`;

const ActiveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #007d88;
  background: #d7f0f1;
  padding: 7px 12px;
  border-radius: 10px;
  flex-shrink: 0;
`;

const Remove = styled.button`
  background: none;
  border: none;
  display: grid;
  place-items: center;
  padding: 6px;
  color: #9ca3af;
  cursor: pointer;
  flex-shrink: 0;
  &:hover {
    color: #ef4444;
  }
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 11px 18px;
  border: 1px dashed #007d88;
  background: #fff;
  color: #007d88;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: auto;
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
  margin-top: 10px;
  color: #9ca3af;
  font-size: 13px;
`;

export default AccountSwitcher;
