import type { UserType } from "../types/auth";

export interface StoredAccount {
  id: string;
  accessToken: string;
  refreshToken: string;
  sessionId?: string | null;
  userType?: UserType | null;
  label?: string;
  employeeId?: number;
  companyName?: string;
}

export const MAX_ACCOUNTS = 3;

class AuthStorage {
  private readonly ACCESS_TOKEN_KEY = "access_token";
  private readonly REFRESH_TOKEN_KEY = "refresh_token";
  private readonly USER_TYPE_KEY = "user_type";
  private readonly SESSION_ID_KEY = "session_id";
  // Мультиаккаунт
  private readonly ACCOUNTS_KEY = "wp_accounts";
  private readonly ACTIVE_ACCOUNT_KEY = "wp_active_account";

  // ===== Активный аккаунт (старые ключи — источник правды для совместимости) =====
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getUserType(): UserType | null {
    return localStorage.getItem(this.USER_TYPE_KEY) as UserType | null;
  }

  setUserType(type: UserType): void {
    localStorage.setItem(this.USER_TYPE_KEY, type);
    this.patchActiveAccount({ userType: type });
  }

  isPaymentPlace(): boolean {
    return this.getUserType() === "payment_place";
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getSessionId(): string | null {
    return localStorage.getItem(this.SESSION_ID_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    this.patchActiveAccount({ accessToken, refreshToken });
  }

  setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    this.patchActiveAccount({ accessToken: token });
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Полный выход — стираем всё (включая все аккаунты).
  clear(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_TYPE_KEY);
    localStorage.removeItem(this.SESSION_ID_KEY);
    localStorage.removeItem(this.ACCOUNTS_KEY);
    localStorage.removeItem(this.ACTIVE_ACCOUNT_KEY);
  }

  // ===== Мультиаккаунт =====
  getAccounts(): StoredAccount[] {
    try {
      const raw = localStorage.getItem(this.ACCOUNTS_KEY);
      return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
    } catch {
      return [];
    }
  }

  private saveAccounts(accounts: StoredAccount[]): void {
    localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  getActiveAccountId(): string | null {
    return localStorage.getItem(this.ACTIVE_ACCOUNT_KEY);
  }

  // Миграция: для уже залогиненных создаём аккаунт из старых ключей.
  ensureSeeded(): void {
    if (!this.isAuthenticated()) return;
    if (this.getActiveAccountId() && this.getAccounts().length > 0) return;
    const acc: StoredAccount = {
      id: this.genId(),
      accessToken: this.getAccessToken() as string,
      refreshToken: this.getRefreshToken() || "",
      sessionId: this.getSessionId(),
      userType: this.getUserType(),
    };
    this.saveAccounts([acc]);
    localStorage.setItem(this.ACTIVE_ACCOUNT_KEY, acc.id);
  }

  private genId(): string {
    try {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
      }
    } catch {
      /* ignore */
    }
    return `acc_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  }

  // Применяет данные аккаунта в активные (старые) ключи.
  private applyActive(acc: StoredAccount): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, acc.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, acc.refreshToken);
    localStorage.setItem(this.ACTIVE_ACCOUNT_KEY, acc.id);
    if (acc.userType) localStorage.setItem(this.USER_TYPE_KEY, acc.userType);
    if (acc.sessionId) localStorage.setItem(this.SESSION_ID_KEY, acc.sessionId);
    else localStorage.removeItem(this.SESSION_ID_KEY);
  }

  // Точечно обновляет активный аккаунт в списке (при refresh токена и т.п.).
  private patchActiveAccount(patch: Partial<StoredAccount>): void {
    const id = this.getActiveAccountId();
    if (!id) return;
    const accounts = this.getAccounts();
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx === -1) return;
    accounts[idx] = { ...accounts[idx], ...patch };
    this.saveAccounts(accounts);
  }

  // Добавить аккаунт после успешного входа и сделать активным.
  addAccount(data: {
    accessToken: string;
    refreshToken: string;
    sessionId?: string | null;
  }): StoredAccount {
    const accounts = this.getAccounts();
    const acc: StoredAccount = {
      id: this.genId(),
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      sessionId: data.sessionId ?? null,
    };
    accounts.push(acc);
    // Ограничение по количеству — выкидываем самый старый.
    while (accounts.length > MAX_ACCOUNTS) {
      accounts.shift();
    }
    this.saveAccounts(accounts);
    this.applyActive(acc);
    return acc;
  }

  // Переключиться на аккаунт.
  switchAccount(id: string): boolean {
    const acc = this.getAccounts().find((a) => a.id === id);
    if (!acc) return false;
    this.applyActive(acc);
    return true;
  }

  // Удалить аккаунт.
  removeAccount(id: string): { removedActive: boolean; nextId: string | null } {
    const accounts = this.getAccounts();
    const wasActive = this.getActiveAccountId() === id;
    const rest = accounts.filter((a) => a.id !== id);
    this.saveAccounts(rest);
    if (wasActive) {
      if (rest.length > 0) {
        this.applyActive(rest[0]);
        return { removedActive: true, nextId: rest[0].id };
      }
      this.clear();
      return { removedActive: true, nextId: null };
    }
    return { removedActive: false, nextId: this.getActiveAccountId() };
  }

  // Обновить метаданные активного аккаунта (после /Auth/info) + дедуп по employeeId.
  updateActiveAccountInfo(info: {
    label?: string;
    employeeId?: number;
    userType?: UserType;
    companyName?: string;
  }): void {
    const id = this.getActiveAccountId();
    if (!id) return;
    let accounts = this.getAccounts();
    // Дедуп: если такой сотрудник уже есть в другом аккаунте — убираем дубликат.
    if (info.employeeId != null) {
      accounts = accounts.filter(
        (a) => a.id === id || a.employeeId !== info.employeeId
      );
    }
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx !== -1) {
      accounts[idx] = { ...accounts[idx], ...info };
    }
    this.saveAccounts(accounts);
  }
}

export const authStorage = new AuthStorage();
