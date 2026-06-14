import type { Permission } from "../types/auth";

/**
 * Список доступных прав (permission codes) с человекочитаемыми описаниями.
 *
 * Используется как источник опций для конструктора кастомных ролей,
 * т.к. отдельного GET-эндпоинта со списком permissions на бэкенде нет.
 * При появлении новых кодов на бэкенде — добавлять их сюда (и в union `Permission` в `types/auth.ts`).
 */
export interface PermissionDefinition {
  code: Permission;
  description: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  { code: "CREATE_CREDITS", description: "Создание договоров" },
  { code: "EDIT_CREDITS", description: "Редактирование договоров" },
  { code: "DELETE_CREDITS", description: "Удаление договоров" },
  { code: "VIEW_CREDITS", description: "Просмотр договоров" },
  { code: "VIEW_ALL_CREDITS", description: "Просмотр всех договоров" },
  { code: "VIEW_ANALYTIC", description: "Просмотр аналитики" },
  { code: "MANAGE_ACCOUNTING", description: "Управление бухгалтерией" },
  { code: "FORBID_CREATING_CREDITS", description: "Запрет создания договоров" },
  { code: "FORBID_CREATING_PAYMENTS", description: "Запрет создания платежей" },
  { code: "FORBID_DELETING_PAYMENTS", description: "Запрет удаления платежей" },
  {
    code: "FORBID_CREDIT_APPLICATIONS",
    description: "Запрет заявок на договор",
  },
];

/** Карта код → описание для быстрого вывода названия права. */
export const PERMISSION_DESCRIPTIONS: Record<string, string> =
  PERMISSION_DEFINITIONS.reduce((acc, { code, description }) => {
    acc[code] = description;
    return acc;
  }, {} as Record<string, string>);

/** Базовые роли, на основе которых можно создавать кастомные роли. */
export const CUSTOM_ROLE_BASE_OPTIONS: { value: string; label: string }[] = [
  { value: "сотрудник", label: "Сотрудник" },
  { value: "админ", label: "Администратор" },
];
