import React, { createContext, useCallback, useContext, useState } from "react";
import ClientFeedbackModal from "../components/modal/ClientFeedbackModal";

interface ClientFeedbackContextValue {
  // Открыть окно отзыва о клиенте (например, после последнего платежа).
  promptClientFeedback: (clientId: number, clientName?: string) => void;
}

const ClientFeedbackContext = createContext<ClientFeedbackContextValue | null>(
  null
);

export const ClientFeedbackProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientName, setClientName] = useState<string | undefined>(undefined);

  const promptClientFeedback = useCallback((id: number, name?: string) => {
    setClientId(id);
    setClientName(name);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setClientId(null);
    setClientName(undefined);
  }, []);

  return (
    <ClientFeedbackContext.Provider value={{ promptClientFeedback }}>
      {children}
      <ClientFeedbackModal
        isOpen={isOpen}
        clientId={clientId}
        clientName={clientName}
        onClose={handleClose}
      />
    </ClientFeedbackContext.Provider>
  );
};

export const useClientFeedbackPrompt = (): ClientFeedbackContextValue => {
  const ctx = useContext(ClientFeedbackContext);
  if (!ctx) {
    // Безопасный no-op, если провайдер не подключён.
    return { promptClientFeedback: () => {} };
  }
  return ctx;
};
