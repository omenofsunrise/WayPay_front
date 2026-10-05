import { useState, useCallback, useEffect, useMemo } from "react";
import styled from "styled-components";
import { formatPhoneHref } from "../../utils/phoneUtils";
import CustomInput from "../../components/ui/fields/CustomInput";
import CustomSelect from "../../components/ui/fields/CustomSelect";
import Pagination from "../../components/ui/fields/CustomPagination";
import CustomTable, {
  type RowStyle,
} from "../../components/ui/tables/CustomTable";
import EmployeeModal from "../../components/modal/CrudInherited/EmployeeModal";
import BaseModal from "../../components/modal/BASE/modalCRUBase";
import { useEmployee } from "../../api/hooks/useEmployee";
import { usePermission } from "../../api/hooks/usePermission";
import type { Employee, EmployeeFilterRequest } from "../../api/types/employee";
import Avatar from "../../components/Profile/Avatar";
import { FILE_BASE_URL } from "../../api/client";
import { useAuth } from "../../сontext/AuthContext";
import PhoneLink from "../../components/ui/links/PhoneLink";
import Checkbox from "../../components/ui/CheckBoxes/Checkbox";

// ─── Toast ────────────────────────────────────────────────────────────────────

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Toast = styled.div<{ $type: "success" | "error" | "warning" }>`
  padding: 14px 20px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  min-width: 300px;
  max-width: 420px;
  background: ${(p) =>
    p.$type === "success"
      ? "#10b981"
      : p.$type === "error"
      ? "#ef4444"
      : "#f59e0b"};

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// ─── Confirm modal ─────────────────────────────────────────────────────────────

const ConfirmText = styled.p`
  padding: 16px 30px;
  font-size: 15px;
  color: #374151;
  line-height: 1.5;
  white-space: pre-line;
`;

// ─── Styled components ─────────────────────────────────────────────────────────

const SearchBar = styled.div`
  width: min(336px, 100%);
  flex: 0 1 336px;
`;

const SearchWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  input {
    height: 46px;
    max-width: none;
    border-color: #d4dee8;
    border-radius: 8px;
    font-size: 14px;
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 11px;
  display: flex;
  align-items: center;
  pointer-events: none;
  z-index: 1;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 14px;
  padding: 2px 4px;
  line-height: 1;
  border-radius: 4px;
  transition: color 0.15s;

  &:hover {
    color: #374151;
  }
`;

const AvatarCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InlineCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CenteredCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MutedText = styled.span`
  color: #9ca3af;
  font-size: 12px;
`;

const EditBtn = styled.button`
  background: none;
  border: none;
  padding: 2px 4px;
  cursor: pointer;
  color: #9ca3af;
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  transition: color 0.15s;
  flex-shrink: 0;

  &:hover {
    color: #007d88;
  }
`;

const ModalForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 30px;
`;

const ModalField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ModalLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

const EmployeePageContainer = styled.main`
  width: 100%;
  padding-bottom: 40px;
  text-align: left;
`;

const PageHeader = styled.header`
  margin: 0 4px 27px;

  h1 {
    margin: 0 0 4px;
    color: #0b1932;
    font-size: 32px;
    line-height: 1.25;
    letter-spacing: -0.7px;
  }

  p {
    margin: 0;
    color: #6b7c94;
    font-size: 15px;
  }
`;

const EmployeesCard = styled.section`
  padding: 29px 27px 25px;
  border: 1px solid rgba(226, 234, 241, 0.78);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 10px 34px rgba(37, 65, 91, 0.045);

  @media (max-width: 760px) {
    padding: 20px 16px;
  }
`;

const FiltersRow = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 28px;

  @media (max-width: 860px) {
    align-items: stretch;
    flex-wrap: wrap;
  }
`;

const RoleFilter = styled.div`
  width: 226px;
  flex: 0 0 226px;

  > div,
  select {
    min-height: 46px;
  }
`;

const CreateEmployeeButton = styled.button`
  min-width: 214px;
  height: 46px;
  margin-left: auto;
  padding: 0 24px;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(100deg, #008690, #09b7ad);
  color: #fff;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(0, 139, 145, 0.14);

  &:hover {
    border-color: transparent;
    filter: brightness(1.04);
  }

  &:focus-visible {
    outline: 2px solid rgba(0, 139, 145, 0.3);
    outline-offset: 2px;
  }
`;

const TableVisual = styled.div`
  overflow-x: auto;

  > div {
    border-color: #dfe7ee;
    border-radius: 10px;
    scrollbar-gutter: auto;
  }

  table {
    min-width: 1050px;
  }

  th {
    padding: 15px 12px !important;
    background: #f4f7f9 !important;
    color: #415169;
    font-size: 13px;
    font-weight: 600;
  }

  td {
    height: 54px;
    padding: 7px 12px !important;
    color: #34445b;
    font-size: 13px;
  }

  th,
  td {
    border-color: #dfe7ee !important;
  }

  tbody tr::after {
    left: 0 !important;
    width: 100% !important;
    background: #dfe7ee !important;
  }
`;

const TableState = styled.div`
  padding: 24px;
  color: #63738a;
  text-align: center;
`;

const CardFooter = styled.footer`
  min-height: 62px;
  padding-top: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
`;

const TotalText = styled.span`
  color: #10213b;
  font-size: 17px;
  font-weight: 500;
`;

const PaginationHolder = styled.div`
  margin-left: auto;

  > div {
    margin-top: 0;
  }
`;

// ─── Icons ─────────────────────────────────────────────────────────────────────

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M9.5 2L12 4.5L4.5 12H2v-2.5L9.5 2z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EmployeePageProps {
  onViewEmployee: (id: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const EmployeePage = ({ onViewEmployee }: EmployeePageProps) => {
  const [nameFilter, setNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const pageSize = 10;
  const { authInfo, hasRole, isSuperAdminIdUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [localEmployees, setLocalEmployees] = useState<Employee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [currentPhoneEmployeeId, setCurrentPhoneEmployeeId] = useState<
    number | null
  >(null);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isSurchargeModalOpen, setIsSurchargeModalOpen] = useState(false);
  const [surchargeValue, setSurchargeValue] = useState(0);
  const [currentSurchargeEmployeeId, setCurrentSurchargeEmployeeId] = useState<
    number | null
  >(null);
  const [isSavingSurcharge, setIsSavingSurcharge] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleValue, setRoleValue] = useState("");
  const [currentRoleEmployeeId, setCurrentRoleEmployeeId] = useState<
    number | null
  >(null);
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Toast
  const [toasts, setToasts] = useState<
    { id: number; type: "success" | "error" | "warning"; message: string }[]
  >([]);

  const addToast = useCallback(
    (type: "success" | "error" | "warning", msg: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, message: msg }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000
      );
    },
    []
  );

  // Confirm modal
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    isSubmitting: boolean;
  }>({ isOpen: false, message: "", onConfirm: () => {}, isSubmitting: false });

  const openConfirm = (msg: string, onConfirm: () => void) => {
    setConfirmState({
      isOpen: true,
      message: msg,
      onConfirm,
      isSubmitting: false,
    });
  };

  const closeConfirm = () =>
    setConfirmState((prev) => ({
      ...prev,
      isOpen: false,
      isSubmitting: false,
    }));

  const handleConfirm = async () => {
    setConfirmState((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await confirmState.onConfirm();
    } finally {
      closeConfirm();
    }
  };

  const columnToApiSortMap: Record<number, string> = {
    0: "id",
    1: "fullName",
    2: "role",
  };

  const defaultEmployee: Employee = {
    id: 0,
    fullName: "",
    phone: "",
    address: "",
    role: "сотрудник",
    permissions: null,
    minSurcharge: 0,
    photoPath: "",
    isBlocked: false,
    confirmedAmount: 0,
    unconfirmedAmount: 0,
  };

  const {
    employeesLoading,
    employeesError,
    fetchEmployees,
    updateEmployee,
    createEmployee,
    deleteEmployee,
    toggleEmployeeBlock,
    updateEmployeeMinSurcharge,
    updateEmployeePhone,
    updateEmployeeRole,
    togglePermission,
  } = useEmployee();

  const { customRoles, fetchCustomRoles } = usePermission();

  useEffect(() => {
    fetchCustomRoles().catch(() => {});
  }, [fetchCustomRoles]);

  const loadEmployees = useCallback(async () => {
    const params: EmployeeFilterRequest = {
      page: currentPage,
      pageSize,
      fullName: nameFilter || undefined,
      role:
        roleFilter && roleFilter.startsWith("role:")
          ? (roleFilter.slice("role:".length) as any)
          : undefined,
    };

    if (sortConfig.key !== null) {
      params.sortBy = columnToApiSortMap[sortConfig.key];
      params.sortDirection = sortConfig.direction;
    }

    const result = await fetchEmployees(params);
    if (result) {
      setLocalEmployees(result.items);
      setTotalCount(result.totalCount);
    }
  }, [currentPage, nameFilter, roleFilter, sortConfig, fetchEmployees]);

  useEffect(() => {
    loadEmployees();
  }, [currentPage, nameFilter, roleFilter, sortConfig, loadEmployees]);

  const filteredEmployees = useMemo(
    () =>
      localEmployees.filter(
        (emp) => !isSuperAdminIdUser(emp.id) && emp.role !== "суперадмин"
      ),
    [localEmployees, isSuperAdminIdUser]
  );
  const filteredOutCount = localEmployees.length - filteredEmployees.length;

  const roleSelectOptions = useMemo(
    () => [
      { value: "", label: "Все роли" },
      { value: "role:сотрудник", label: "Сотрудник" },
      { value: "role:админ", label: "Администратор" },
      ...customRoles.map((r) => ({
        value: `custom:${r.id}`,
        label: `${r.name} (кастомная)`,
      })),
    ],
    [customRoles]
  );

  const editRoleOptions = useMemo(
    () => [
      { value: "role:сотрудник", label: "Сотрудник" },
      { value: "role:админ", label: "Администратор" },
      ...customRoles.map((r) => ({
        value: `custom:${r.id}`,
        label: `${r.name} (кастомная)`,
      })),
    ],
    [customRoles]
  );

  const handleOpenRoleModal = (employee: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setRoleValue(
      employee.customRole
        ? `custom:${employee.customRole.id}`
        : `role:${employee.role}`
    );
    setCurrentRoleEmployeeId(employee.id);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoleEmployeeId || !roleValue) return;

    const payload = roleValue.startsWith("custom:")
      ? { role: null, customRoleId: Number(roleValue.slice("custom:".length)) }
      : { role: roleValue.slice("role:".length), customRoleId: null };

    setIsSavingRole(true);
    try {
      await updateEmployeeRole(currentRoleEmployeeId, payload);
      await loadEmployees();
      setIsRoleModalOpen(false);
      addToast("success", "Роль успешно обновлена");
    } catch {
      addToast("error", "Не удалось обновить роль");
    } finally {
      setIsSavingRole(false);
    }
  };

  const hasAccountingPermission = (employee: Employee): boolean =>
    employee.permissions?.some((p) => p.code === "MANAGE_ACCOUNTING") || false;

  const canEditAccounting = (employee: Employee): boolean => {
    if (!authInfo || employee.role === "суперадмин") return false;
    return hasRole("суперадмин") || hasRole("директор");
  };

  const getCurrentAccountant = useCallback(
    () =>
      localEmployees.find((e) =>
        e.permissions?.some((p) => p.code === "MANAGE_ACCOUNTING")
      ),
    [localEmployees]
  );

  const handleToggleAccounting = useCallback(
    async (employee: Employee) => {
      if (!employee.id) return;

      if (!canEditAccounting(employee)) {
        addToast("error", "У вас нет прав для изменения права на бухгалтерию");
        return;
      }

      const hasPermission = hasAccountingPermission(employee);

      if (employee.id === authInfo?.employee?.id && hasPermission) {
        addToast("error", "Вы не можете лишить себя права на бухгалтерию");
        return;
      }

      const currentAccountant = getCurrentAccountant();
      const confirmMsg = hasPermission
        ? `Снять право на бухгалтерию с ${employee.fullName}?`
        : `Назначить право на бухгалтерию ${employee.fullName}?${
            currentAccountant && currentAccountant.id !== employee.id
              ? `\n\nУ текущего бухгалтера (${currentAccountant.fullName}) право будет автоматически снято.`
              : ""
          }`;

      openConfirm(confirmMsg, async () => {
        const isGranting = !hasPermission;
        try {
          if (isGranting) {
            setLocalEmployees((prev) =>
              prev.map((e) => {
                if (e.id === employee.id) {
                  const perms = e.permissions || [];
                  if (!perms.some((p) => p.code === "MANAGE_ACCOUNTING")) {
                    return {
                      ...e,
                      permissions: [
                        ...perms,
                        {
                          id: 10,
                          code: "MANAGE_ACCOUNTING",
                          description: "разрешение вести бухгалтерский учёт",
                        },
                      ],
                    };
                  }
                  return e;
                }
                if (currentAccountant && e.id === currentAccountant.id) {
                  return {
                    ...e,
                    permissions:
                      e.permissions?.filter(
                        (p) => p.code !== "MANAGE_ACCOUNTING"
                      ) || null,
                  };
                }
                return e;
              })
            );
          } else {
            setLocalEmployees((prev) =>
              prev.map((e) =>
                e.id === employee.id
                  ? {
                      ...e,
                      permissions:
                        e.permissions?.filter(
                          (p) => p.code !== "MANAGE_ACCOUNTING"
                        ) || null,
                    }
                  : e
              )
            );
          }

          await togglePermission(employee.id, "MANAGE_ACCOUNTING");
          addToast(
            "success",
            isGranting
              ? `Право на бухгалтерию назначено ${employee.fullName}`
              : `Право на бухгалтерию снято с ${employee.fullName}`
          );
          await loadEmployees();
        } catch {
          addToast("error", "Не удалось изменить право на бухгалтерию");
          await loadEmployees();
        }
      });
    },
    [
      togglePermission,
      localEmployees,
      authInfo,
      loadEmployees,
      getCurrentAccountant,
    ]
  );

  const canEditEmployee = (employee: Employee): boolean => {
    if (!authInfo || employee.id === authInfo.employee.id) return false;
    if (hasRole("суперадмин") || hasRole("директор")) return true;
    if (hasRole("админ")) return employee.role === "сотрудник";
    return false;
  };

  const canDeleteEmployee = (employee: Employee): boolean => {
    if (!authInfo || employee.id === authInfo.employee.id) return false;
    if (hasRole("суперадмин") || hasRole("директор")) return true;
    if (hasRole("админ")) return employee.role === "сотрудник";
    return false;
  };

  const isEmployeeBlocked = (employee: Employee): boolean =>
    employee.isBlocked === true;

  const handleSort = (columnIndex: number) => {
    if (!columnToApiSortMap[columnIndex]) return;
    setSortConfig((prev) =>
      prev.key === columnIndex
        ? {
            key: columnIndex,
            direction: prev.direction === "asc" ? "desc" : "asc",
          }
        : { key: columnIndex, direction: "asc" }
    );
  };

  const handleCreateEmployee = () => {
    setModalMode("create");
    setSelectedEmployee(defaultEmployee);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = (rowData: any[]) => {
    const employeeId = Number(rowData[0]);
    const employee = localEmployees.find((e) => e.id === employeeId);
    if (!employee) return;

    if (!canDeleteEmployee(employee)) {
      addToast(
        "error",
        employee.id === authInfo?.employee.id
          ? "Нельзя удалить самого себя"
          : "Недостаточно прав для удаления этого сотрудника"
      );
      return;
    }

    openConfirm(
      "Вы уверены, что хотите удалить этого сотрудника?",
      async () => {
        try {
          setLocalEmployees((prev) => prev.filter((e) => e.id !== employeeId));
          setTotalCount((prev) => prev - 1);
          await deleteEmployee(employeeId);
          addToast("success", "Сотрудник успешно удалён");
          await loadEmployees();
        } catch {
          loadEmployees();
          addToast(
            "error",
            "Нельзя удалить сотрудника с договорами. Вы можете заблокировать его доступ."
          );
        }
      }
    );
  };

  const handleBlockEmployee = (rowData: any[]) => {
    const employeeId = Number(rowData[0]);
    const employee = localEmployees.find((e) => e.id === employeeId);
    if (!employee) return;

    if (!canDeleteEmployee(employee)) {
      addToast(
        "error",
        employee.id === authInfo?.employee.id
          ? "Нельзя заблокировать самого себя"
          : "Недостаточно прав для блокировки этого сотрудника"
      );
      return;
    }

    openConfirm(
      "Вы уверены, что хотите заблокировать этого сотрудника?",
      async () => {
        try {
          await toggleEmployeeBlock(employeeId);
          addToast("success", "Сотрудник заблокирован");
          await loadEmployees();
        } catch {
          addToast("error", "Не удалось заблокировать сотрудника");
        }
      }
    );
  };

  const handleUnblockEmployee = (rowData: any[]) => {
    const employeeId = Number(rowData[0]);
    const employee = localEmployees.find((e) => e.id === employeeId);
    if (!employee) return;

    if (!canDeleteEmployee(employee)) {
      addToast("error", "Недостаточно прав для разблокировки этого сотрудника");
      return;
    }

    openConfirm(
      "Вы уверены, что хотите разблокировать этого сотрудника?",
      async () => {
        try {
          await toggleEmployeeBlock(employeeId);
          addToast("success", "Сотрудник разблокирован");
          await loadEmployees();
        } catch {
          addToast("error", "Не удалось разблокировать сотрудника");
        }
      }
    );
  };

  const handleSubmitEmployee = async (employeeData: Partial<Employee>) => {
    try {
      if (modalMode === "create") {
        const newEmployee = {
          ...defaultEmployee,
          ...employeeData,
          id: Math.max(0, ...localEmployees.map((e) => e.id)) + 1,
          photoPath: "",
        };
        setLocalEmployees((prev) => [...prev, newEmployee]);
        setTotalCount((prev) => prev + 1);

        const created = await createEmployee({
          fullName: employeeData.fullName || "",
          phone: employeeData.phone || "",
          address: employeeData.address,
          minSurcharge: employeeData.minSurcharge || 0,
          role:
            employeeData.customRoleId != null
              ? undefined
              : employeeData.role || "сотрудник",
          customRoleId: employeeData.customRoleId ?? null,
        });
        setLocalEmployees((prev) =>
          prev.map((e) => (e.id === newEmployee.id ? created : e))
        );
        addToast("success", "Сотрудник успешно создан");
      } else if (modalMode === "edit" && selectedEmployee?.id) {
        setLocalEmployees((prev) =>
          prev.map((e) =>
            e.id === selectedEmployee.id ? { ...e, ...employeeData } : e
          )
        );
        await updateEmployee({
          id: selectedEmployee.id,
          fullName: employeeData.fullName || "",
          address: employeeData.address,
          phone: employeeData.phone || "",
        });
        addToast("success", "Данные сотрудника обновлены");
      }
      setIsModalOpen(false);
    } catch {
      addToast("error", "Не удалось сохранить данные сотрудника");
      loadEmployees();
      throw new Error("save failed");
    }
  };

  const canEditSurcharge = (employee: Employee): boolean => {
    if (!authInfo) return false;
    if (employee.id === authInfo.employee.id)
      return hasRole("суперадмин") || hasRole("директор") || hasRole("админ");
    if (hasRole("суперадмин") || hasRole("директор")) return true;
    if (hasRole("админ")) return employee.role === "сотрудник";
    return false;
  };

  const handleRowDoubleClick = (rowData: any[]) =>
    onViewEmployee(Number(rowData[0]));

  const handleOpenPhoneModal = (employee: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhoneValue(employee.phone);
    setCurrentPhoneEmployeeId(employee.id);
    setIsPhoneModalOpen(true);
  };

  const handleOpenSurchargeModal = (
    employee: Employee,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSurchargeValue(employee.minSurcharge);
    setCurrentSurchargeEmployeeId(employee.id);
    setIsSurchargeModalOpen(true);
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPhoneEmployeeId || !phoneValue) return;
    setIsSavingPhone(true);
    try {
      await updateEmployeePhone(currentPhoneEmployeeId, phoneValue);
      await loadEmployees();
      setIsPhoneModalOpen(false);
      addToast("success", "Телефон успешно обновлён");
    } catch {
      addToast("error", "Не удалось обновить телефон");
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSaveSurcharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSurchargeEmployeeId) return;
    setIsSavingSurcharge(true);
    try {
      await updateEmployeeMinSurcharge(
        currentSurchargeEmployeeId,
        surchargeValue
      );
      await loadEmployees();
      setIsSurchargeModalOpen(false);
      addToast("success", "Надбавка успешно обновлена");
    } catch {
      addToast("error", "Не удалось обновить надбавку");
    } finally {
      setIsSavingSurcharge(false);
    }
  };

  const getTableActions = (rowData: any[]) => {
    const employee = localEmployees.find((e) => e.id === Number(rowData[0]));
    if (!employee) return [];
    const actions = [];
    if (canDeleteEmployee(employee)) {
      actions.push({
        label: employee.isBlocked ? "Разблокировать" : "Заблокировать",
        action: employee.isBlocked
          ? handleUnblockEmployee
          : handleBlockEmployee,
        color: employee.isBlocked ? "#10B981" : "#F59E0B",
      });
      actions.push({
        label: "Удалить",
        action: handleDeleteEmployee,
        color: "#EF4444",
        dividerBefore: true,
      });
    }
    return actions;
  };

  const tableData = filteredEmployees.map((employee) => [
    employee.id.toString(),
    <AvatarCell>
      <Avatar
        src={employee.photoPath ? FILE_BASE_URL + employee.photoPath : null}
        name={employee.fullName}
      />
      {employee.fullName}
    </AvatarCell>,
    <InlineCell>
      {employee.customRole ? (
        <span title={`Кастомная роль (база: ${employee.role})`}>
          {employee.customRole.name}
        </span>
      ) : (
        employee.role
      )}
      {canEditEmployee(employee) && (
        <EditBtn
          onClick={(e) => handleOpenRoleModal(employee, e)}
          title="Изменить роль"
        >
          <PencilIcon />
        </EditBtn>
      )}
    </InlineCell>,
    <InlineCell>
      {employee.minSurcharge}
      {canEditSurcharge(employee) && (
        <EditBtn
          onClick={(e) => handleOpenSurchargeModal(employee, e)}
          title="Изменить надбавку"
        >
          <PencilIcon />
        </EditBtn>
      )}
    </InlineCell>,
    <InlineCell>
      {employee.phone ? (
        <PhoneLink
          href={formatPhoneHref(employee.phone)}
          onClick={(e) => e.stopPropagation()}
        >
          {employee.phone}
        </PhoneLink>
      ) : (
        "—"
      )}
      {canEditEmployee(employee) && (
        <EditBtn
          onClick={(e) => handleOpenPhoneModal(employee, e)}
          title="Изменить телефон"
        >
          <PencilIcon />
        </EditBtn>
      )}
    </InlineCell>,
    employee.address || "—",
    <CenteredCell>
      {employee.role !== "суперадмин" && canEditAccounting(employee) ? (
        <Checkbox
          checked={hasAccountingPermission(employee)}
          onChange={() => handleToggleAccounting(employee)}
        />
      ) : employee.role === "суперадмин" ? (
        <MutedText>—</MutedText>
      ) : (
        <MutedText>{hasAccountingPermission(employee) ? "✓" : "—"}</MutedText>
      )}
    </CenteredCell>,
  ]);

  const rowStyles: { [rowIndex: number]: RowStyle } = {};
  filteredEmployees.forEach((employee, index) => {
    if (isEmployeeBlocked(employee)) {
      rowStyles[index] = { backgroundColor: "rgba(254, 202, 202, 0.3)" };
    }
  });

  return (
    <EmployeePageContainer>
      <PageHeader>
        <h1>Сотрудники</h1>
        <p>Управляйте списком сотрудников, их ролями и контактной информацией.</p>
      </PageHeader>

      <EmployeesCard>
        <FiltersRow>
          <SearchBar>
            <SearchWrapper>
              <SearchIcon>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle
                    cx="6.5"
                    cy="6.5"
                    r="5"
                    stroke="#9CA3AF"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10.5 10.5L14 14"
                    stroke="#9CA3AF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </SearchIcon>
              <CustomInput
                inputType="text"
                placeholder="Поиск по ФИО..."
                value={nameFilter}
                onChange={(e) => {
                  setNameFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ paddingLeft: "36px" }}
              />
              {nameFilter && (
                <ClearButton
                  onClick={() => {
                    setNameFilter("");
                    setCurrentPage(1);
                  }}
                  aria-label="Очистить поиск"
                >
                  ✕
                </ClearButton>
              )}
            </SearchWrapper>
          </SearchBar>

          <RoleFilter>
            <CustomSelect
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={roleSelectOptions}
              dropdownInPortal
            />
          </RoleFilter>

          <CreateEmployeeButton onClick={handleCreateEmployee}>
            +&nbsp;&nbsp; Новый сотрудник
          </CreateEmployeeButton>
        </FiltersRow>

        {employeesLoading && <TableState>Загрузка...</TableState>}
        {employeesError && (
          <TableState>Ошибка: {employeesError}</TableState>
        )}

        {!employeesLoading && !employeesError && (
          <>
            <TableVisual>
              <CustomTable
                columns={[
                  { name: "ID", isSortable: true },
                  { name: "ФИО", isSortable: true, align: "left" },
                  { name: "Роль", isSortable: true, align: "left" },
                  { name: "Мин. надбавка", align: "left" },
                  { name: "Телефон", align: "left" },
                  { name: "Адрес", align: "left" },
                  { name: "Бухгалтерия", align: "center" },
                ]}
                data={tableData}
                onRowDoubleClick={handleRowDoubleClick}
                contextMenuActions={getTableActions}
                onSort={handleSort}
                sortConfig={sortConfig}
                rowStyles={rowStyles}
                multiSelect
              />
            </TableVisual>

            <CardFooter>
              <TotalText>Всего: {totalCount - filteredOutCount}</TotalText>
              <PaginationHolder>
                <Pagination
                  total={totalCount - filteredOutCount}
                  current={currentPage}
                  onChange={setCurrentPage}
                  itemsPerPage={pageSize}
                />
              </PaginationHolder>
            </CardFooter>
          </>
        )}
      </EmployeesCard>

      <EmployeeModal
        mode={modalMode}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitEmployee}
        initialData={selectedEmployee || defaultEmployee}
        customRoles={customRoles}
      />

      {isPhoneModalOpen && (
        <BaseModal
          title="Изменение телефона"
          onClose={() => setIsPhoneModalOpen(false)}
          onCancel={() => setIsPhoneModalOpen(false)}
          onSave={handleSavePhone}
          isSubmitting={isSavingPhone}
        >
          <ModalForm>
            <ModalField>
              <ModalLabel>Номер телефона</ModalLabel>
              <CustomInput
                inputType="text"
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value)}
                placeholder="Введите новый телефон"
              />
            </ModalField>
          </ModalForm>
        </BaseModal>
      )}

      {isSurchargeModalOpen && (
        <BaseModal
          title="Изменение минимальной надбавки"
          onClose={() => setIsSurchargeModalOpen(false)}
          onCancel={() => setIsSurchargeModalOpen(false)}
          onSave={handleSaveSurcharge}
          isSubmitting={isSavingSurcharge}
        >
          <ModalForm>
            <ModalField>
              <ModalLabel>Минимальная надбавка</ModalLabel>
              <CustomInput
                inputType="number"
                value={surchargeValue.toString()}
                onChange={(e) => setSurchargeValue(Number(e.target.value))}
                placeholder="Введите новую надбавку"
                min={0}
              />
            </ModalField>
          </ModalForm>
        </BaseModal>
      )}

      {isRoleModalOpen && (
        <BaseModal
          title="Изменение роли сотрудника"
          onClose={() => setIsRoleModalOpen(false)}
          onCancel={() => setIsRoleModalOpen(false)}
          onSave={handleSaveRole}
          isSubmitting={isSavingRole}
        >
          <ModalForm>
            <ModalField>
              <ModalLabel>Роль</ModalLabel>
              <CustomSelect
                value={roleValue}
                onChange={(e) => setRoleValue(e.target.value)}
                options={editRoleOptions}
                placeholder="Выберите роль"
                dropdownInPortal
              />
            </ModalField>
          </ModalForm>
        </BaseModal>
      )}

      {/* Confirm modal */}
      {confirmState.isOpen && (
        <BaseModal
          title="Подтверждение"
          onClose={closeConfirm}
          onCancel={closeConfirm}
          onSave={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
          isSubmitting={confirmState.isSubmitting}
          saveButtonText="Подтвердить"
          width="400px"
        >
          <ConfirmText>{confirmState.message}</ConfirmText>
        </BaseModal>
      )}

      <ToastContainer>
        {toasts.map((t) => (
          <Toast key={t.id} $type={t.type}>
            {t.type === "success" ? "✓ " : t.type === "error" ? "✕ " : "⚠ "}
            {t.message}
          </Toast>
        ))}
      </ToastContainer>
    </EmployeePageContainer>
  );
};

export default EmployeePage;
