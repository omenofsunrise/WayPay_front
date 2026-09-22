import type { ButtonTypeMap } from "@mui/material";
import type { PaginationParams } from "./common";

export interface ScheduleItem {
  paymentDate: Date;
  paymentAmount: number;
  comment: string;
}

export interface SchedulePreviewParams {
  startDate: Date;
  termMonths: number;
  totalAmount: number;
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
  sortDirection?: "asc" | "desc";
  investorId?: number;
  poolId?: number;
  creditTypeId?: number;
  schouldBeVisited?: boolean;
}

export interface ScheduleCalendarParams {
  StartDate?: Date;
  EndDate?: Date;
  Search?: string;
  Overdue?: boolean;
  Overdues?: number;
  ClientsCount?: number;
  ClientsPage?: number;
  CreditTypeId?: number;
}

export interface UpdateScheduleRequest {
  id: number;
  date: string;
  userComment?: string | null;
}

export interface CalendarSummary {
  totalCount: number;
  totalOverdues: number;
  overduesAmount: number;
}

export interface CalendarResult extends CalendarSummary {
  items: ScheduleDetails[];
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
  payed?: boolean;
  userComment?: string | null;
  status?: "Payed" | "Overdue" | "Pending";
}

export type VisitMode = 0 | 1 | 2 | 3;

export interface SetShouldBeVisitedDto {
  currentId: number;
  creditId?: number | null;
  mode: VisitMode;
  nearestCount?: number | null;
  schouldBe: boolean;
}
