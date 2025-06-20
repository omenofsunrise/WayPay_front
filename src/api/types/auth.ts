export type Permission = 
  | 'CREATE_CREDITS'
  | 'DELETE_CREDITS'
  | 'VIEW_CREDITS'
;

export type Role = 'админ' | 'сотрудник' | 'директор' | 'суперадмин' | 'бухгалтер';

export interface AuthInfo {
  type: 'employee';
  employee: {
    id: number;
    fullName: string;
    role: Role;
    permissions: Permission[];
    minSurcharge: number;
  };
}