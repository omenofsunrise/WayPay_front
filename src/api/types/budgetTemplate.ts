export type BudgetTemplateType = "Income" | "Outcome";

export interface BudgetTemplate {
  id: number;
  companyId?: number;
  type: BudgetTemplateType;
  name: string;
  amount: number;
  comment?: string;
  dayOfMonth?: number;
  isActive: boolean;
  investorId?: number | null;
  investorPoolId?: number | null;
  companyShare?: number;
  employeeId?: number;
  createdAt?: string;
  updatedAt?: string;
  investor?: {
    id: number;
    nickname?: string;
    fullName?: string;
  } | null;
  pool?: {
    id: number;
    name?: string;
  } | null;
}

export interface BudgetTemplateParams {
  type?: BudgetTemplateType;
  isActive?: boolean;
}

export interface CreateBudgetTemplateDto {
  name: string;
  amount: number;
  comment?: string;
  dayOfMonth?: number;
  // На бэкенде поле type в теле не описано, но мы отправляем его явно,
  // чтобы шаблон создавался как постоянный расход (Outcome), а не доход.
  type?: BudgetTemplateType;
  investorId?: number;
  investorPoolId?: number;
  companyShare?: number;
}

export interface UpdateBudgetTemplateDto {
  name: string;
  amount: number;
  comment?: string;
  dayOfMonth?: number;
  isActive?: boolean;
  investorId?: number;
  investorPoolId?: number;
  companyShare?: number;
}
