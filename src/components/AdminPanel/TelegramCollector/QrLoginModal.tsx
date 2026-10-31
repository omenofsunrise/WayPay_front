import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { QRCodeSVG } from "qrcode.react";
import telegramCollectorService from "../../../api/services/telegramCollectorService";
import type { QrLoginState } from "../../../api/types/telegramCollector";
import BaseModal from "../../modal/BASE/modalCRUBase";
import CustomInput from "../../ui/fields/CustomInput";
import { ErrorMessage, Field, getErrorMessage, Hint, Label, ModalForm, SecondaryButton } from "./ui";

interface Props {
  onClose: () => void;
  onDone: () => void;
}

const ACTIVE = new Set(["Waiting", "Password", "Checking"]);

/**
 * Вход по QR-коду: сканируют в Telegram на телефоне, код из Telegram не нужен.
 * Сервер обновляет QR примерно раз в 30 секунд, вкладка опрашивает его состояние.
 */
const QrLoginModal = ({ onClose, onDone }: Props) => {
  const [state, setState] = useState<QrLoginState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const qrIdRef = useRef<string | null>(null);
  const doneRef = useRef(false);

  const start = useCallback(async () => {
    setError(null);
    setState(null);
    setPassword("");
    try {
      const started = await telegramCollectorService.startQrLogin();
      qrIdRef.current = started.qrId;
      setState(started);
    } catch (startError) {
      setError(getErrorMessage(startError));
    }
  }, []);

  useEffect(() => {
    void start();
    return () => {
      // Окно закрыли, не войдя: останавливаем вход на сервере.
      if (qrIdRef.current) void telegramCollectorService.cancelQrLogin(qrIdRef.current).catch(() => undefined);
    };
  }, [start]);

  useEffect(() => {
    if (!state || !ACTIVE.has(state.status)) return;
    const timer = window.setTimeout(async () => {
      try {
        setState(await telegramCollectorService.getQrLogin(state.qrId));
      } catch (pollError) {
        setError(getErrorMessage(pollError));
        setState({ ...state, status: "Failed", url: null });
      }
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (state?.status === "Done" && !doneRef.current) {
      doneRef.current = true;
      qrIdRef.current = null;
      onDone();
    }
  }, [state?.status, onDone]);

  const handlePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!state || !password.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      setState(await telegramCollectorService.submitQrPassword(state.qrId, password));
      setPassword("");
    } catch (passwordError) {
      setError(getErrorMessage(passwordError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = state?.status;
  const needsPassword = status === "Password" || status === "Checking";
  const finished = !!state && !ACTIVE.has(state.status) && state.status !== "Done";
  const minutesLeft = state ? Math.max(1, Math.ceil(state.expiresInSeconds / 60)) : 0;

  return (
    <BaseModal
      title="Вход в Telegram по QR-коду"
      onClose={onClose}
      onCancel={onClose}
      onSave={handlePassword}
      hideSaveButton={!needsPassword}
      isSaveDisabled={status === "Checking" || !password.trim()}
      isSubmitting={isSubmitting || status === "Checking"}
      saveButtonText="Войти"
    >
      <ModalForm>
        {!state && !error && <Hint>Готовим QR-код…</Hint>}

        {status === "Waiting" && (
          <>
            <QrBox>
              {state?.url ? <QRCodeSVG value={state.url} size={220} marginSize={2} /> : <Hint>Готовим QR-код…</Hint>}
            </QrBox>
            <Steps>
              <li>Откройте Telegram на телефоне под аккаунтом, который состоит в чатах.</li>
              <li>
                <b>Настройки → Устройства → Подключить устройство</b>.
              </li>
              <li>Наведите камеру на этот QR-код.</li>
            </Steps>
            <Hint>QR-код обновляется сам. Окно ждёт ещё около {minutesLeft} мин.</Hint>
          </>
        )}

        {needsPassword && (
          <Field>
            <Label>Облачный пароль</Label>
            <CustomInput
              autoFocus
              type="password"
              value={password}
              disabled={status === "Checking"}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Hint>
              {status === "Checking"
                ? "Проверяем пароль…"
                : "QR-код принят. На аккаунте включена двухэтапная проверка — введите её пароль."}
            </Hint>
          </Field>
        )}

        {state?.error && <ErrorMessage>{state.error}</ErrorMessage>}
        {error && <ErrorMessage>{error}</ErrorMessage>}

        {(finished || (!state && error)) && (
          <div>
            <SecondaryButton type="button" onClick={() => void start()}>
              Обновить QR-код
            </SecondaryButton>
          </div>
        )}
      </ModalForm>
    </BaseModal>
  );
};

const QrBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 236px;
  padding: 8px;
  background: #fff;
  border: 1px solid #e4e7ec;
  border-radius: 10px;
`;

const Steps = styled.ol`
  margin: 0;
  padding-left: 20px;
  color: #344054;
  font-size: 14px;
  line-height: 1.6;
`;

export default QrLoginModal;
