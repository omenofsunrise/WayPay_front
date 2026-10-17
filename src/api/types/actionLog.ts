// Запись журнала действий: кто что сделал в компании.
export interface ActionLogRecord {
  id: number;
  createdAt: string;
  companyId?: number | null;
  companyName?: string | null;
  employeeId?: number | null;
  employeeName: string;
  action: "created" | "updated" | "deleted" | string;
  actionName: string;
  entity: string;
  entityName: string;
  entityId?: string | null;
  title?: string | null;
  hasDetails: boolean;
}

// То же плюс содержимое попапа: при создании и удалении весь объект,
// при изменении только изменённые поля как { was, now }.
export interface ActionLogDetails extends ActionLogRecord {
  payload?: Record<string, unknown> | null;
}

export interface ActionLogPage {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: ActionLogRecord[];
}

export interface ActionLogEntity {
  entity: string;
  name: string;
}

export interface ActionLogFilters {
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
  employeeId?: number;
  companyId?: number;
  entity?: string;
  action?: string;
  search?: string;
}
