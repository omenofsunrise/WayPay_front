export type PaymentPendingStatus = "Created" | "Transferred" | string;

export interface PaymentPending {
  id: number;
  companyId: number;
  creditId: number;
  amount: number;
  isTransferred: boolean;
  createdById: number;
  createdAt: string;
  transferredAt: string | null;
  os: string | null;
  notes: string | null;
  status: PaymentPendingStatus;
}

export interface CreatePaymentPendingRequest {
  creditId: number;
  amount: number;
  os?: string;
  note?: string;
}

export interface PaymentPendingParams {
  page?: number;
  pageSize?: number;
  includeTransferred?: boolean;
}
