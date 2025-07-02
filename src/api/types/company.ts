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
}

export interface CompanyCreateRequest {
  AdminPhone: string;
  LicenceDate: Date;
}

export interface CompanyListItem {
  id: number;
  name: string;
  phone: string;
}