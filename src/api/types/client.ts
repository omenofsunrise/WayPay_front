import type { PaginationParams } from "./common";

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
  secondPhone?: string;
  hasPassportPhoto?: boolean;
}

export interface ClientParams extends PaginationParams {
  FullName?: string;
  Phone?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ClientForm {
  fullName: string;
  phone: string;
  secondPhone?: string;
  doc: string;
  birthdate: string;
  docIssueDate: string;
  registrationAddress: string;
}

export interface Client extends Omit<ClientForm, 'birthdate' | 'docIssueDate'> {
  id: number;
  birthdate: Date;
  docIssueDate: Date;
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