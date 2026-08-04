import { useState } from "react";
import styled from "styled-components";

import usePartnerPlace from "../api/hooks/usePartnerPlace";
import type { Credit } from "../api/types/credit";
import type { PaymentPending } from "../api/types/paymentPending";
import { formatMoney, parseMoney } from "../utils/formatPrice";

const ReceptionPage = () => {
  const {
    isSearching,
    isSubmitting,
    error,
    results,
    hasSearched,
    searchContracts,
    addPayment,
    deletePayment,
    clearError,
  } = usePartnerPlace();

  const [searchValue, setSearchValue] = useState("");
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);

  // Платежи, добавленные приёмкой в текущей сессии (их можно удалить)
  const [addedPayments, setAddedPayments] = useState<PaymentPending[]>([]);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedCredit(null);
    searchContracts(searchValue);
  };

  const handleSelect = (credit: Credit) => {
    setSelectedCredit(credit);
    setAmount("");
    setNote("");
    setFormError(null);
  };

  const handleBack = () => {
    setSelectedCredit(null);
    setFormError(null);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCredit) return;

    const parsed = parseMoney(amount);
    if (!parsed || parsed <= 0) {
      setFormError("Введите сумму платежа");
      return;
    }

    setFormError(null);
    try {
      const created = await addPayment({
        creditId: selectedCredit.id,
        amount: parsed,
        note: note.trim() || undefined,
      });
      setAddedPayments((prev) => [created, ...prev]);
      setAmount("");
      setNote("");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Не удалось добавить платёж"
      );
    }
  };

  const handleDeletePayment = async (payment: PaymentPending) => {
    if (!window.confirm("Удалить добавленный платёж?")) return;
    try {
      await deletePayment(payment.id);
      // Убираем из списка только после подтверждённого удаления на бэке.
      setAddedPayments((prev) => prev.filter((p) => p.id !== payment.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не удалось удалить платёж");
    }
  };

  const renderContractCard = (credit: Credit) => (
    <ContractCard key={credit.id} onClick={() => handleSelect(credit)}>
      <ContractMain>
        <ContractNumber>Договор № {credit.name}</ContractNumber>
        <ClientName>{credit.clientFullName}</ClientName>
        {credit.clientPhone && <MutedText>{credit.clientPhone}</MutedText>}
        {credit.guarantorFullname && (
          <MutedText>Поручитель: {credit.guarantorFullname}</MutedText>
        )}
      </ContractMain>
      <ContractAmounts>
        <AmountRow>
          <span>Сумма:</span>
          <strong>{formatMoney(String(credit.totalAmount ?? 0))}</strong>
        </AmountRow>
        <AmountRow>
          <span>Остаток:</span>
          <strong>{formatMoney(String(credit.rest ?? 0))}</strong>
        </AmountRow>
      </ContractAmounts>
    </ContractCard>
  );

  // ===== Экран выбранного договора =====
  if (selectedCredit) {
    return (
      <PageContainer>
        <BackButton onClick={handleBack}>← К результатам поиска</BackButton>

        <DetailCard>
          <ContractNumber>Договор № {selectedCredit.name}</ContractNumber>
          <ClientName>{selectedCredit.clientFullName}</ClientName>
          {selectedCredit.clientPhone && (
            <MutedText>{selectedCredit.clientPhone}</MutedText>
          )}
          {selectedCredit.guarantorFullname && (
            <MutedText>
              Поручитель: {selectedCredit.guarantorFullname}
            </MutedText>
          )}
          <DetailAmounts>
            <AmountRow>
              <span>Сумма договора:</span>
              <strong>
                {formatMoney(String(selectedCredit.totalAmount ?? 0))}
              </strong>
            </AmountRow>
            <AmountRow>
              <span>Остаток:</span>
              <strong>{formatMoney(String(selectedCredit.rest ?? 0))}</strong>
            </AmountRow>
          </DetailAmounts>
        </DetailCard>

        <SectionTitle>Добавить платёж</SectionTitle>
        <PaymentForm onSubmit={handleAddPayment}>
          <FormRow>
            <Label>Сумма платежа *</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </FormRow>
          <FormRow>
            <Label>Примечание</Label>
            <Input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Необязательно"
            />
          </FormRow>
          {formError && <ErrorMessage>{formError}</ErrorMessage>}
          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Добавление…" : "Добавить платёж"}
          </SubmitButton>
        </PaymentForm>

        {addedPayments.length > 0 && (
          <>
            <SectionTitle>Добавленные платежи</SectionTitle>
            <PaymentsList>
              {addedPayments.map((payment) => (
                <PaymentItem key={payment.id}>
                  <div>
                    <PaymentAmount>
                      {formatMoney(String(payment.amount ?? 0))}
                    </PaymentAmount>
                    {payment.notes && <MutedText>{payment.notes}</MutedText>}
                  </div>
                  <DeleteButton onClick={() => handleDeletePayment(payment)}>
                    Удалить
                  </DeleteButton>
                </PaymentItem>
              ))}
            </PaymentsList>
          </>
        )}

        {error && (
          <ErrorMessage onClick={clearError} style={{ cursor: "pointer" }}>
            {error}
          </ErrorMessage>
        )}
      </PageContainer>
    );
  }

  // ===== Экран поиска =====
  return (
    <PageContainer>
      <Title>Приём платежей</Title>

      <SearchForm onSubmit={handleSearch}>
        <Input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Имя клиента, поручителя или номер договора"
        />
        <SearchButton type="submit" disabled={isSearching}>
          {isSearching ? "Поиск…" : "Найти"}
        </SearchButton>
      </SearchForm>

      {error && (
        <ErrorMessage onClick={clearError} style={{ cursor: "pointer" }}>
          {error}
        </ErrorMessage>
      )}

      {isSearching && <MutedText>Идёт поиск…</MutedText>}

      {!isSearching && hasSearched && results.length === 0 && !error && (
        <EmptyState>Договоры не найдены</EmptyState>
      )}

      <ResultsList>{results.map(renderContractCard)}</ResultsList>
    </PageContainer>
  );
};

export default ReceptionPage;

const PageContainer = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 8px 0 0;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 12px;
`;

const Input = styled.input`
  flex: 1;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  color: #1f2937;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #007d88;
  }
`;

const SearchButton = styled.button`
  background-color: #007d88;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background-color: #006670;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ContractCard = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background-color: #ffffff;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: #007d88;
    box-shadow: 0 2px 8px rgba(0, 125, 136, 0.1);
  }
`;

const ContractMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ContractAmounts = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
  min-width: 160px;
`;

const DetailCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background-color: #ffffff;
`;

const DetailAmounts = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
`;

const ContractNumber = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
`;

const ClientName = styled.div`
  font-size: 15px;
  color: #374151;
`;

const MutedText = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

const AmountRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  color: #374151;
`;

const PaymentForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background-color: #ffffff;
`;

const FormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const SubmitButton = styled.button`
  align-self: flex-start;
  background-color: #007d88;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;

  &:hover:not(:disabled) {
    background-color: #006670;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PaymentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PaymentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #ffffff;
`;

const PaymentAmount = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
`;

const DeleteButton = styled.button`
  background: none;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background-color: #fee2e2;
  }
`;

const BackButton = styled.button`
  align-self: flex-start;
  background: none;
  border: none;
  color: #007d88;
  font-size: 14px;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  background-color: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #fecaca;
`;

const EmptyState = styled.div`
  padding: 32px;
  text-align: center;
  color: #6b7280;
  font-size: 15px;
`;
