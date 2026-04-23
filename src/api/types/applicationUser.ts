export interface CreditApplicationUsersResponse {
  id: string;
  name: string;
  phone: string;
}

export interface CreateCreditApplicationUser {
  name: string;
  phone: string;
}

export interface UpdateCreditApplicationRequest {
  id: string;
  name?: string;
  phone?: string;
}