import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { AuthInfo, Permission, Role } from '../api/types/auth';
import { authStorage } from '../api/utils/auth-storage';

interface AuthContextType {
  authInfo: AuthInfo | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  hasPermission: (permission: Permission, checkAdmins?: boolean) => boolean;
  hasRole: (role: Role | Role[]) => boolean;
  forbiddenRole: (role: Role) => boolean;
  isSuperAdminCompany: () => boolean;
  isSuperAdminId: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPER_ROLES: Role[] = ['админ', 'суперадмин', 'директор'];
const ALWAYS_TRUE_ROLES: Role[] = ['суперадмин', 'директор'];

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthInfo = async () => {
    if (!authStorage.getAccessToken()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<AuthInfo>('/Auth/info');
      setAuthInfo(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setAuthInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthInfo();
  }, []);

  const hasPermission = (permission: Permission, checkAdmins: boolean = false): boolean => {
    if (!authInfo) return false;
    
    if (ALWAYS_TRUE_ROLES.includes(authInfo.employee.role)) {
      return true;
    }
    
    if (!checkAdmins && SUPER_ROLES.includes(authInfo.employee.role)) {
      return true;
    }
    
    return authInfo.employee.permissions.includes(permission);
  };

  const hasRole = (role: Role | Role[]): boolean => {
    if (!authInfo) return false;
    
    if (Array.isArray(role)) {
      return role.includes(authInfo.employee.role);
    }
    
    return authInfo.employee.role === role;
  };

  const forbiddenRole = (role: Role): boolean => {
    if (!authInfo) return false;
    return authInfo.employee.role !== role;
  };

  const isSuperAdminCompany = (): boolean => {
    if (!authInfo) return false;
    return authInfo.employee.companyId === 1;
  };

  const isSuperAdminId = (): boolean => {
    if (!authInfo) return false;
    return authInfo.employee.id === 1 || authInfo.employee.id === 4;
  };

  return (
    <AuthContext.Provider value={{ 
      authInfo, 
      isLoading, 
      error, 
      refresh: fetchAuthInfo,
      hasPermission,
      hasRole,
      forbiddenRole,
      isSuperAdminCompany,
      isSuperAdminId
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};