export interface Company {
  id: number;
  name: string;
  phone: string;
  city: string;
  officeAddress: string;
  bank: string;
  chief: string;
  licenceDate?: Date;
  inn?: string;
  email?: string;
  photoPath?: string;
  lastActive?: Date;
  createdCreditsCount?: number; 
  totalCredits?: number;
}

export interface CompanyCreateRequest {
  AdminPhone: string;
  LicenceDate: Date;
  AdminName: string;
  CompanyName: string;
}

export interface CompanyListItem {
  id: number;
  name: string;
  phone: string;
  photoPath?: string;
}

export interface CommonInfo {
  id: number;
  licenceDate: Date;
  directorFullname: string;
  phone: string;
}

export interface CompaneAccountDetails {
  company: string;
  accountDetails: string;
}