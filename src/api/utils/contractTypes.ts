export interface BuyerData {
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: Date;
  passportSeries: string;
  passportNumber: string;
  passportIssueDate: Date;
  passportIssuedBy: string;
  passportDepartmentCode: string;
  address: string;
  phone: string;
}

export interface SellerData {
  lastName: string;
  firstName: string;
  middleName: string;
  ogrnip: string;
  legalAddress: string;
  inn: string;
  bankAccount: string;
  bankName: string;
  corrAccount: string;
  bankInn: string;
  bankBik: string;
  email: string;
  shopAddress: string;
}

export interface ProductData {
  name: string;
  model: string;
  specs: string;
  basePrice: number;
  markup: number;
  totalPrice: number;
  installmentMonths: number;
}

export interface GuarantorData {
  lastName: string;
  firstName: string;
  middleName: string;
  relation: string;
}

export interface ContractData {
  contractNumber: string;
  contractDate: Date;
  city: string;
  initialPayment: number;
  initialPaymentDate: Date;
  finalPaymentDate: Date;
  paymentDay: number;
  guarantor?: GuarantorData;
}