import type { PaginationParams } from './common';

export interface ScheduleItem {
    paymentDate: Date;
    paymentAmount: number;
}

export interface SchedulePreviewParams {
    creditDate: Date;
    termMonths: number;
    paymentDay: number;
    totalAmount: number;
}

export interface ScheduleParams extends PaginationParams {
    creditId?: number;
}

export interface ScheduleDetails {
    id: number;
    creditId: number;
    paymentDate: Date;
    paymentAmount: number;
    isPaid: boolean;
    paidDate?: Date;
}