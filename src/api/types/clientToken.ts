// Типы для временного токена клиента и публичного просмотра данных клиента.
// Публичная страница по токену НЕ показывает служебные поля:
// hasClientApproved, clientRejectsAmount, accepted, investorNickname, income —
// поэтому они намеренно НЕ включены в типы ниже.

// Ответ POST /api/Client/temporary-token/generate
export interface TemporaryTokenResponse {
  clientId: number;
  companyId: number;
  token: string;
  createdAt: string;
  expiresAt: string;
}

// Платёж в публичном ответе (без accepted / investorNickname / income).
export interface PublicPaymentDto {
  id: number;
  creditId: number;
  paymentAmount: number;
  paymentDate: string;
  type: string;
  bankCardId?: number;
  bankCardDetails?: string;
  clientFullName?: string;
  employeeFullName?: string;
}

export interface PublicScheduleItemDto {
  id: number;
  paymentAmount: number;
  paymentDate: string;
  isPayed: boolean;
}

export interface PublicSchedulesDto {
  items: PublicScheduleItemDto[];
  restAmount: number;
  leftPaymentsCounts: number;
}

// Договор в публичном ответе (без hasClientApproved / clientRejectsAmount).
export interface PublicCreditDto {
  id: number;
  name: string;
  creditDate: string;
  totalAmount: number;
  totalClean: number;
  isActive: boolean;
  termMonths: number;
  firstPayment: number;
  accured: number;
  payed: number;
  rest: number;
  currentMonthDebt: number;
  debt: number;
  supportPhone?: string;
  payments: PublicPaymentDto[];
  schedules: PublicSchedulesDto;
}

// Ответ GET /api/Client/by/temporary-token
export interface PublicClientDto {
  id: number;
  fullName: string;
  companyName: string;
  credits: PublicCreditDto[];
}
