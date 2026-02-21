import type { PaginationParams } from './common';

export interface ScheduleItem {
    paymentDate: Date;
    paymentAmount: number;
    comment: string;
}

export interface SchedulePreviewParams {
    creditDate: Date;
    termMonths: number;
    paymentDay: number;
    totalAmount: number;
    nextMonthStart: boolean;
    turnOfRounding: boolean;
}

export interface ScheduleParams extends PaginationParams {
    creditId?: number;
    includePayed?: boolean;
    clientName?: string;
    investorNickname?: string;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

export interface ScheduleDetails {
    id: number;
    creditId: number;
    rest: number;
    paymentDate: Date;
    paymentAmount: number;
    clientName: string;
    comment: string;
    notified: boolean;
    isPaid?: boolean;
    paidDate?: Date;
    clientPhone: string;
    guarantorFullname?: string;
    guarantorPhone?: string;
}