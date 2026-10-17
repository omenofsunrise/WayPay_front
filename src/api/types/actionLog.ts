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
  // Он же в винительном падеже: «изменил клиента», а не «изменил клиент».
  entityNameAccusative: string;
  entityId?: string | null;
  title?: string | null;
  hasDetails: boolean;
}

// Поле объекта в понятном виде: название по-русски и значения строками.
export interface ActionLogField {
  field: string;
  name: string;
  was?: string | null;
  now?: string | null;
  isChange: boolean;
  // Служебное поле: прячем под «показать все поля».
  technical: boolean;
}

export interface ActionLogDetails extends ActionLogRecord {
  fields: ActionLogField[];
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
