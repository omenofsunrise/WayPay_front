import type { PaginationParams } from "./common";

export interface GuarantorRef {
  id: number;
  fullname: string;
  creditId: number;
}

export type ContactType =
  | "Email"
  | "WhatsAppPhone"
  | "AdditionalPhone"
  | "Telegram";

export const ContactType = {
  Email: "Email",
  WhatsAppPhone: "WhatsAppPhone",
  AdditionalPhone: "AdditionalPhone",
  Telegram: "Telegram",
} as const;

export interface ClientContact {
  id: number;
  value: string;
  type: ContactType;
  entityId: number;
  entityType: string;
  createdAt?: string;
}

export interface CreateContactRequest {
  clientId: number;
  type: ContactType;
  value: string;
}

export interface UpdateContactRequest {
  contactId: number;
  value: string;
}

export interface Client {
  id: number;
  fullName: string;
  phone: string;
  doc: string;
  birthdate: Date | null | string;
  docIssueDate: Date | null | string;
  docIssueYear: number;
  creditIds: number[];
  creditRestTerms: number[];
  registrationAddress: string;
  actualAddress?: string;
  secondPhone?: string;
  hasPassportPhoto?: boolean;
  guarantors?: GuarantorRef[];
  contacts?: ClientContact[];
}

export interface ClientParams extends PaginationParams {
  FullName?: string;
  Phone?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface ClientForm {
  fullName: string;
  phone: string;
  secondPhone?: string;
  doc: string;
  birthdate: string;
  docIssueDate: string;
  registrationAddress: string;
  actualAddress?: string;
}

export interface Client extends Omit<ClientForm, "birthdate" | "docIssueDate"> {
  id: number;
  birthdate: Date | string;
  docIssueDate: Date | string;
}

export interface ClientExistsResponse {
  exists: boolean;
}

export interface UploadPassportPhotoRequest {
  file: File;
}

export interface PassportPhotoResponse {
  hasPhoto: boolean;
  photoBase64?: string;
  contentType?: string;
  fileName?: string;
}

export interface Guarantor {
  id: number;
  fullName: string;
  phone: string;
  doc?: string;
  birthdate?: Date | null | string;
  address?: string;
}

export interface GuarantorForm {
  fullName: string;
  phone: string;
  doc: string;
  birthdate: string;
  address: string;
}

export type PassportPhotoType =
  (typeof PassportPhotoType)[keyof typeof PassportPhotoType];

export const PassportPhotoType = {
  MainPage: 1,
  RegistrationPage: 2,
} as const;

export interface UploadPhotoResponse {
  success: boolean;
  message: string;
  fileId?: string;
  photoType?: PassportPhotoType;
}
