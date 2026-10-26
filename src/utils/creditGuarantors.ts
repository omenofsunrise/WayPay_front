import type { Credit, CreditGuarantor } from "../api/types/credit";

/**
 * Поручители договора по порядку. Если бэкенд ещё не отдаёт список,
 * собираем одного поручителя из старых полей guarantor*.
 */
export const getCreditGuarantors = (credit: Credit | null): CreditGuarantor[] => {
  if (!credit) return [];
  if (credit.guarantors && credit.guarantors.length > 0) {
    return [...credit.guarantors].sort((a, b) => a.position - b.position);
  }
  if (!credit.guarantorFullname) return [];
  const isClient =
    credit.guarantorType === "Client" ||
    (!credit.guarantorType && !!credit.guarantorClientId);
  const id =
    (isClient
      ? credit.guarantorClientId ?? credit.guarantorId
      : credit.guarantorId) ?? 0;
  return [
    {
      position: 0,
      guarantorType: isClient ? "Client" : "Guarantor",
      id,
      clientId: isClient ? id : null,
      guarantorId: isClient ? null : id,
      fullname: credit.guarantorFullname,
      phone: credit.guarantorPhone,
      birthdate: credit.guarantorBirthdate,
      address: credit.guarantorAddress,
    },
  ];
};

/** Ключ поручителя: id клиента и id отдельного поручителя из разных таблиц. */
export const guarantorKey = (g: CreditGuarantor) => `${g.guarantorType}-${g.id}`;

/** ФИО всех поручителей через запятую — для коротких подписей. */
export const guarantorNames = (credit: Credit | null): string =>
  getCreditGuarantors(credit)
    .map((g) => g.fullname)
    .filter(Boolean)
    .join(", ");
