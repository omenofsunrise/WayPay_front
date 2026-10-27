
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import CustomInput from "../ui/fields/CustomInput";
import Checkbox from "../ui/CheckBoxes/Checkbox";
import CustomCalendar from "../ui/fields/CustomCalendar";
import BankCardSelect from "../ui/fields/BankCardSelect";
import { useAuth } from "../../сontext/AuthContext";
import { useClientFeedbackPrompt } from "../../сontext/ClientFeedbackContext";
import type { CreatePaymentResponse } from "../../api/types/payment";
import { formatPhoneHref } from "../../utils/phoneUtils";
import PhoneLink from "../ui/links/PhoneLink";
import BaseModal from "./BASE/modalCRUBase";

export interface NewPaymentModalProps {
  creditId: number;
  investorName: string;
  clientName: string;
  clientPhone: string;
  currentDebt: number;
  currentMonthDebt: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentData: {
    paymentDate: string;
    principalAmount: number;
    paymentMethod: "cash" | "card";
    bankCardId?: number;
  }) => Promise<CreatePaymentResponse | number | null | void>;
  onPrintReceipt?: (paymentId: number) => void;
  clientId?: number;
}

export const PRINT_RECEIPT_STORAGE_KEY = "new-payment-print-receipt-preference";

const NewPaymentModal: React.FC<NewPaymentModalProps> = ({
  creditId,
  clientName,
  investorName,
  clientPhone,
  currentDebt,
  currentMonthDebt,
  isOpen,
  onClose,
  onSubmit,
  onPrintReceipt,
  clientId,
}) => {
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [principalAmount, setPrincipalAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">();
  const [selectedBankCardId, setSelectedBankCardId] = useState<number>(0);
  const [selectedBankCardDetails, setSelectedBankCardDetails] =
    useState<string>("");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [remainingDebt, setRemainingDebt] = useState<number>(currentDebt);
  const [isDebtPaid, setIsDebtPaid] = useState<boolean>(currentDebt <= 0);
  const [printReceipt, setPrintReceipt] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { denyPermission } = useAuth();
  const { promptClientFeedback } = useClientFeedbackPrompt();

  // Загрузка предпочтений печати
  useEffect(() => {
    const savedPrintPreference = localStorage.getItem(
      PRINT_RECEIPT_STORAGE_KEY
    );
    if (savedPrintPreference) {
      try {
        const preference = JSON.parse(savedPrintPreference);
        setPrintReceipt(preference === true);
      } catch (error) {
        console.error("Ошибка при загрузке настройки печати:", error);
        setPrintReceipt(false);
      }
    }
  }, []);

  // Сброс состояния при открытии
  useEffect(() => {
    if (isOpen) {
      setPaymentDate("");
      setPrincipalAmount("");
      setPaymentMethod(undefined);
      setSelectedBankCardId(0);
      setSelectedBankCardDetails("");
      setTotalAmount(0);
      setRemainingDebt(currentDebt);
      setIsDebtPaid(currentDebt <= 0);
      setIsSubmitting(false);
    }
  }, [isOpen, currentDebt]);

  // Обновление состояния долга
  useEffect(() => {
    setIsDebtPaid(currentDebt <= 0);
    setRemainingDebt(currentDebt - totalAmount);
  }, [currentDebt, totalAmount]);

  const formatMoney = (value: number): string => {
    return value.toLocaleString("ru-RU") + "₽";
  };

  const parseAmount = (formatted: string): number => {
    return parseInt(formatted.replace(/[^\d]/g, "")) || 0;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (inputValue === "₽" || inputValue === "") {
      setPrincipalAmount("");
      setTotalAmount(0);
      return;
    }

    const numericValue = parseAmount(inputValue);
    const validatedValue = Math.min(numericValue, currentDebt);
    const formattedValue = formatMoney(validatedValue);

    setPrincipalAmount(formattedValue);
    setTotalAmount(validatedValue);
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!paymentDate || totalAmount <= 0 || !paymentMethod || isDebtPaid)
      return;

    if (paymentMethod === "card" && !selectedBankCardId) {
      return;
    }

    const paymentData = {
      paymentDate,
      principalAmount: totalAmount,
      paymentMethod,
    };

    setIsSubmitting(true);

    try {
      const result = await onSubmit(
        paymentMethod === "card" && selectedBankCardId
          ? { ...paymentData, bankCardId: selectedBankCardId }
          : paymentData
      );

      // Ответ может быть числом (id, старое поведение) или объектом платежа.
      const resultObj = result && typeof result === "object" ? result : null;
      const paymentId = typeof result === "number" ? result : resultObj?.id;
      const isLast = resultObj?.isLast ?? false;
      const feedbackClientId = resultObj?.clientId ?? clientId;

      if (printReceipt && paymentId && onPrintReceipt) {
        await onPrintReceipt(paymentId);
      }

      onClose();

      // Последний платёж по договору — предлагаем оценить клиента.
      if (isLast && feedbackClientId) {
        promptClientFeedback(feedbackClientId, clientName);
      }
    } catch (error) {
      console.error("Ошибка при создании платежа:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCashChange = (checked: boolean) => {
    if (checked) {
      setPaymentMethod("cash");
      setSelectedBankCardId(0);
      setSelectedBankCardDetails("");
    } else {
      setPaymentMethod(null);
    }
  };

  const handleCardChange = (checked: boolean) => {
    if (checked) {
      setPaymentMethod("card");
    } else {
      setPaymentMethod(null);
      setSelectedBankCardId(0);
      setSelectedBankCardDetails("");
    }
  };

  const handleBankCardSelect = (bankCard: { id: number; details: string }) => {
    setSelectedBankCardId(bankCard.id);
    setSelectedBankCardDetails(bankCard.details);
  };

  const handlePrintReceiptChange = (checked: boolean) => {
    setPrintReceipt(checked);
    localStorage.setItem(PRINT_RECEIPT_STORAGE_KEY, JSON.stringify(checked));
  };

  if (!isOpen) return null;

  const canCreatePayment = denyPermission("FORBID_CREATING_PAYMENTS");
  const isSaveDisabled =
    isSubmitting ||
    !paymentDate ||
    totalAmount <= 0 ||
    !paymentMethod ||
    totalAmount > currentDebt ||
    (paymentMethod === "card" && !selectedBankCardId);

  return (
    <BaseModal
      isOpen={isOpen}
      title="Новый платёж"
      subtitle="Укажите сумму, дату и способ оплаты"
      appearance="compact-form"
      width="680px"
      maxHeight="calc(100vh - 32px)"
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      cancelButtonText={!canCreatePayment || isDebtPaid ? "Закрыть" : "Отмена"}
      saveButtonText="Создать платёж"
      hideSaveButton={!canCreatePayment || isDebtPaid}
      isSaveDisabled={isSaveDisabled}
      isSubmitting={isSubmitting}
      submittingText="Создание..."
    >
      <ModalContent>
        <ModalWrapper>
          {!canCreatePayment && (
            <PermissionWarning>
              У вас недостаточно прав для создания платежей
            </PermissionWarning>
          )}
          {isDebtPaid ? (
            <DebtPaidMessage>
              <h3>Договор полностью погашен</h3>
              <p>
                По данному договору нет задолженности. Новые платежи не
                принимаются.
              </p>
            </DebtPaidMessage>
          ) : (
            <>
              {canCreatePayment && (
                <>
                  <SectionTitle>Сведения о договоре</SectionTitle>

                  <FormRow>
                    <InputGroup>
                      <InputLabel>№ договора</InputLabel>
                      <CustomInput value={creditId.toString()} readOnly />
                    </InputGroup>

                    <InputGroup>
                      <InputLabel>Инвестор</InputLabel>
                      <CustomInput value={investorName} readOnly />
                    </InputGroup>
                  </FormRow>

                  <FormRow>
                    <InputGroup>
                      <InputLabel>Клиент</InputLabel>
                      <CustomInput value={clientName} readOnly />
                    </InputGroup>

                    <InputGroup>
                      <InputLabel>Телефон</InputLabel>
                      <PhoneLinkBox
                        href={formatPhoneHref(clientPhone)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {clientPhone}
                      </PhoneLinkBox>
                    </InputGroup>
                  </FormRow>

                  <SectionTitle $separated>Сведения о платеже</SectionTitle>

                  <FormRow>
                    <InputGroup>
                      <InputLabel>Дата платежа</InputLabel>
                      <CustomCalendar
                        value={paymentDate}
                        onChange={setPaymentDate}
                      />
                    </InputGroup>

                    <InputGroup>
                      <InputLabel>Сумма платежа</InputLabel>
                      <CustomInput
                        inputType="rubles"
                        placeholder="Сумма"
                        value={principalAmount}
                        onChange={handleAmountChange}
                        max={currentDebt}
                      />
                      {totalAmount > currentDebt && (
                        <ErrorText>
                          Сумма платежа не может превышать остаток долга
                        </ErrorText>
                      )}
                    </InputGroup>
                  </FormRow>

                  <FormRow>
                    <InputGroup>
                      <InputLabel>Текущая задолженность</InputLabel>
                      <CustomInput
                        value={formatMoney(currentMonthDebt)}
                        readOnly
                      />
                    </InputGroup>

                    <InputGroup>
                      <InputLabel>Остаток всего долга</InputLabel>
                      <CustomInput
                        value={formatMoney(Math.max(0, remainingDebt))}
                        readOnly
                      />
                    </InputGroup>
                  </FormRow>

                  <FormRow>
                    <InputGroup>
                      <CheckboxWrapper>
                        <Checkbox
                          label="Распечатать чек после создания платежа"
                          checked={printReceipt}
                          onChange={handlePrintReceiptChange}
                        />
                      </CheckboxWrapper>
                    </InputGroup>
                  </FormRow>

                  <FormRow>
                    <InputGroup>
                      <InputLabel>Способ оплаты</InputLabel>
                      <PaymentMethodContainer>
                        <CheckboxWrapper>
                          <Checkbox
                            label="Наличными"
                            checked={paymentMethod === "cash"}
                            onChange={handleCashChange}
                          />
                        </CheckboxWrapper>

                        <CheckboxWrapper>
                          <Checkbox
                            label="Картой"
                            checked={paymentMethod === "card"}
                            onChange={handleCardChange}
                          />
                        </CheckboxWrapper>
                      </PaymentMethodContainer>
                    </InputGroup>
                  </FormRow>

                  {paymentMethod === "card" && (
                    <FormRow>
                      <InputGroup>
                        <InputLabel>Банковская карта</InputLabel>
                        <BankCardSelect
                          value={selectedBankCardDetails}
                          onChange={(details) =>
                            setSelectedBankCardDetails(details)
                          }
                          onBankCardSelect={handleBankCardSelect}
                          placeholder="Выберите карту"
                          clientId={clientId}
                          selectedCardId={selectedBankCardId}
                        />
                        {paymentMethod === "card" && !selectedBankCardId && (
                          <ErrorText>
                            Пожалуйста, выберите банковскую карту
                          </ErrorText>
                        )}
                      </InputGroup>
                    </FormRow>
                  )}
                </>
              )}
            </>
          )}

        </ModalWrapper>
      </ModalContent>
    </BaseModal>
  );
};

const ModalContent = styled.div`
  padding: 6px 34px 24px;
  text-align: left;
`;

const ModalWrapper = styled.div`
  width: 100%;
`;

const SectionTitle = styled.h3<{ $separated?: boolean }>`
  margin: ${({ $separated }) => ($separated ? "22px 0 16px" : "8px 0 16px")};
  padding-top: ${({ $separated }) => ($separated ? "18px" : "0")};
  color: #07818a;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  text-align: left;
  border-top: ${({ $separated }) => ($separated ? "1px solid #dfe6ed" : "0")};
`;

const PermissionWarning = styled.div`
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 8px;
  font-size: 14px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const InputGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const PhoneLinkBox = styled(PhoneLink)`
  display: inline-flex;
  align-items: center;
  padding: 0px 12px;
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 5px;
  font-size: 14px;
  background: #f9fafb;
  min-height: 38px;
`;

const InputLabel = styled.label`
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
  text-align: left;
`;

const PaymentMethodContainer = styled.div`
  display: flex;
  gap: 24px;

  @media (max-width: 768px) {
    gap: 12px;
    flex-direction: column;
  }
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DebtPaidMessage = styled.div`
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;

  h3 {
    color: #28a745;
    margin-bottom: 10px;
  }

  p {
    color: #6c757d;
    margin: 0;
  }
`;

const ErrorText = styled.span`
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
`;

export default NewPaymentModal;
