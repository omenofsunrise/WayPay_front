import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import useClientToken from "../../api/hooks/useClientToken";
import { formatExactDate } from "../../utils/dateFormatter";
import BaseModal from "./BASE/modalCRUBase";

// Путь публичной страницы клиента (должен совпадать с маршрутом в App.tsx).
const CLIENT_PUBLIC_PATH = "/client-public";

// Абсолютная ссылка с токеном: берёт текущий origin — работает и на ПК, и на мобильных.
const buildClientPublicLink = (token: string): string =>
  `${window.location.origin}${CLIENT_PUBLIC_PATH}?token=${encodeURIComponent(
    token
  )}`;

interface ClientLinkModalProps {
  isOpen: boolean;
  clientId?: number | null;
  clientName?: string;
  onClose: () => void;
}

const ClientLinkModal: React.FC<ClientLinkModalProps> = ({
  isOpen,
  clientId,
  clientName,
  onClose,
}) => {
  const { generateTemporaryToken, isLoading, error } = useClientToken();
  const [link, setLink] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [tokenError, setTokenError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isOpen || !clientId) return;

    setLink("");
    setExpiresAt("");
    setTokenError("");
    setCopied(false);

    generateTemporaryToken(clientId).then((result) => {
      if (cancelled || !result) return;
      // Защита от «битой» ссылки: без валидного токена ссылку не собираем.
      if (!result.token) {
        setTokenError("Сервер не вернул токен. Попробуйте ещё раз.");
        return;
      }
      setLink(buildClientPublicLink(result.token));
      setExpiresAt(result.expiresAt);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, clientId, generateTemporaryToken]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Фолбэк для окружений без Clipboard API (или http).
      inputRef.current?.select();
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      title="Ссылка для клиента"
      subtitle={clientName || "Публичный доступ к договорам клиента"}
      appearance="compact-form"
      width="540px"
      onClose={onClose}
      onCancel={onClose}
      hideSaveButton
      hideCanselButton
    >
      <Card>
        <Hint>
          Отправьте клиенту эту ссылку — она откроется без авторизации на любом
          устройстве и покажет его договоры.
        </Hint>

        {isLoading && !link && <Muted>Формируем ссылку…</Muted>}

        {tokenError && !link && <ErrorText>{tokenError}</ErrorText>}

        {error && !link && (
          <ErrorText>Не удалось сформировать ссылку: {error}</ErrorText>
        )}

        {link && (
          <>
            <LinkRow>
              <LinkInput ref={inputRef} readOnly value={link} />
              <CopyButton type="button" onClick={handleCopy}>
                {copied ? "Скопировано" : "Копировать"}
              </CopyButton>
            </LinkRow>
            {expiresAt && (
              <Expires>
                Ссылка действует до {formatExactDate(new Date(expiresAt))}
              </Expires>
            )}
            <OpenLink href={link} target="_blank" rel="noopener noreferrer">
              Открыть в новой вкладке
            </OpenLink>
          </>
        )}
      </Card>
    </BaseModal>
  );
};

const Card = styled.div`
  padding: 6px 34px 28px;
  text-align: left;
`;

const Hint = styled.div`
  margin: 8px 0 16px;
  font-size: 13px;
  color: #6b7280;
`;

const LinkRow = styled.div`
  display: flex;
  gap: 8px;
`;

const LinkInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  color: #111827;
  background: #f9fafb;
  &:focus {
    outline: none;
    border-color: #007d88;
  }
`;

const CopyButton = styled.button`
  flex-shrink: 0;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  background: #007d88;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: #005f66;
  }
`;

const Expires = styled.div`
  margin-top: 10px;
  font-size: 12px;
  color: #6b7280;
`;

const OpenLink = styled.a`
  display: inline-block;
  margin-top: 12px;
  font-size: 13px;
  color: #007d88;
  font-weight: 600;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const Muted = styled.div`
  margin-top: 4px;
  font-size: 14px;
  color: #6b7280;
`;

const ErrorText = styled.div`
  margin-top: 4px;
  font-size: 13px;
  color: #dc2626;
`;

export default ClientLinkModal;
