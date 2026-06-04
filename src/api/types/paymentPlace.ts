import type { Company } from "./company";

export interface PaymentPlace {
  id: number;
  companyId: number;
  name: string;
  phone: string;
  isDeleted: boolean;
  createdAt: string;
  payed: boolean;
  paymentUrl: string | null;
  paymentExpiresAt: string | null;
  subscriptionId: string | null;
  company: Company | null;
}

export interface CreatePaymentPlaceRequest {
  name: string;
  phone: string;
}

export interface UpdatePaymentPlaceRequest {
  name: string;
  phone: string;
}
