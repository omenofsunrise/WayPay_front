import type { PaginationParams } from "./common";

export type ApplicationStatus = typeof ApplicationStatus[keyof typeof ApplicationStatus];

export const ApplicationStatus = {
    Pending: 1,
    Accepted: 2,
    Decline: 3,
} as const;

export interface CreditApplicationResponse {
    id: number;

    productName: string;
    productPrice: number;
    firstPayment: number;
    termMonths: number;
    markupAmount: number;
    monthlyPayment: number;

    region: string;
    district: string;

    createdDate: Date;

    clientId: number;
    fullname: string;
    avatarPath?: string;
}

export interface GetCreditApplicationsQuery extends PaginationParams{
    minPrice?: number;

    maxPrice?: number;

    minTerm?: number;

    maxTerm?: number;

    regionId?: number;
    districtId?: number;
}

export interface SelfCreditApplicationResponse {
    id: number;

    companyName: string;
    
    productName: string;

    productPrice: number;

    firstPayment: number;

    termMonths: number;

    region: string;
    district: string;

    status: ApplicationStatus;

    createdDate: Date;

    approvedDate: Date;

    employeeId: number;
    employeeName: string;
    employeeAvatar: string

    clientId: number;
    clientName: string;
    clientPhone: string;
}