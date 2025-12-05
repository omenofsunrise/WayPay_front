import { useState, useCallback, useEffect } from 'react';
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import CustomInput from "../../components/ui/fields/CustomInput";
import Pagination from "../../components/ui/fields/CustomPagination";
import CustomTable, { type RowStyle } from "../../components/ui/tables/CustomTable";
import FilterField from "../../components/ui/Layouts/FilterField";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import PaginationLayout from "../../components/ui/Layouts/PaginationLayout";
import TitleField from "../../components/ui/Layouts/TitleLayout";
import CountInfoTitle from "../../components/ui/Text/CountInfoTitle";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import EmployeeModal from "../../components/modal/CrudInherited/EmployeeModal";
import { useEmployee } from "../../api/hooks/useEmployee";
import type { Employee, EmployeeFilterRequest } from '../../api/types/employee';
import CustomSelect from '../../components/ui/fields/CustomSelect';
import Avatar from '../../components/Profile/Avatar';
import { FILE_BASE_URL } from '../../api/client';
import { useAuth } from '../../сontext/AuthContext';
import BaseModal from '../../components/modal/BASE/modalCRUBase';
import { EditOutlined } from '@ant-design/icons';
import { message } from 'antd';
import Checkbox from '../../components/ui/CheckBoxes/Checkbox';
import ConfirmModal from '../../components/modal/ConfirmationModal';

interface EmployeePageProps {
    onViewEmployee: (id: number) => void;
}

const EmployeePage = ({ onViewEmployee }: EmployeePageProps) => {
    const [nameFilter, setNameFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: number | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    const pageSize = 10;
    const { authInfo, hasRole } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [localEmployees, setLocalEmployees] = useState<Employee[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
    const [phoneValue, setPhoneValue] = useState('');
    const [currentPhoneEmployeeId, setCurrentPhoneEmployeeId] = useState<number | null>(null);
    const [isSavingPhone, setIsSavingPhone] = useState(false);
    const [isSurchargeModalOpen, setIsSurchargeModalOpen] = useState(false);
    const [surchargeValue, setSurchargeValue] = useState(0);
    const [currentSurchargeEmployeeId, setCurrentSurchargeEmployeeId] = useState<number | null>(null);
    const [isSavingSurcharge, setIsSavingSurcharge] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [roleValue, setRoleValue] = useState('');
    const [currentRoleEmployeeId, setCurrentRoleEmployeeId] = useState<number | null>(null);
    const [isSavingRole, setIsSavingRole] = useState(false);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [employeeToBlock, setEmployeeToBlock] = useState<Employee | null>(null);
    const [updatingPermissions, setUpdatingPermissions] = useState<Record<number, boolean>>({});
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState<{
        employee: Employee;
        newValue: boolean;
    } | null>(null);

    const columnToApiSortMap: Record<number, string> = {
        0: 'id',
        1: 'fullName',
        2: 'role'
    };
    
    const defaultEmployee: Employee = {
        id: 0,
        fullName: '',
        phone: '',
        address: '',
        role: 'сотрудник',
        permissions: null,
        minSurcharge: 0,
        photoPath: '',
        isBlocked: false
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
        togglePermission
    } = useEmployee();
    
    const loadEmployees = useCallback(async () => {
        const params: EmployeeFilterRequest = {
            page: currentPage,
            pageSize,
            fullName: nameFilter || undefined,
            role: roleFilter as any
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

    const handleFilterChange = (value: string) => {
        setNameFilter(value);
        setCurrentPage(1);
    };

    const handleOpenRoleModal = (employee: Employee, e: React.MouseEvent) => {
        e.preventDefault();
        setRoleValue(employee.role);
        setCurrentRoleEmployeeId(employee.id);
        setIsRoleModalOpen(true);
    };

    const handleSaveRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentRoleEmployeeId || !roleValue) return;
        
        setIsSavingRole(true);
        try {
            await updateEmployeeRole(currentRoleEmployeeId, roleValue);
            await loadEmployees();
            setIsRoleModalOpen(false);
            message.success('Роль успешно обновлена');
        } catch (error) {
            console.error('Ошибка при сохранении роли:', error);
            message.error('Не удалось обновить роль');
        } finally {
            setIsSavingRole(false);
        }
    };
    
    const canEditEmployee = (employee: Employee): boolean => {
        if (!authInfo) return false;
        if (employee.id === authInfo.employee.id) return false;
        
        if (hasRole('суперадмин') || hasRole('директор')) {
            return true;
        }
        
        if (hasRole('админ')) {
            return employee.role === 'сотрудник';
        }
        
        return false;
    };

    const canDeleteEmployee = (employee: Employee): boolean => {
        if (!authInfo) return false;
        if (employee.id === authInfo.employee.id) return false;
        
        if (hasRole('суперадмин') || hasRole('директор')) {
            return true;
        }
        
        if (hasRole('админ')) {
            return employee.role === 'сотрудник';
        }
        
        return false;
    };

    const isEmployeeBlocked = (employee: Employee): boolean => {
        return employee.isBlocked === true;
    };

    const hasAccountingPermission = (employee: Employee): boolean => {
        if (!employee.permissions) return false;
        return employee.permissions.some(permission => permission.code === 'MANAGE_ACCOUNTING');
    };

   const handleToggleAccountingPermission = async (employee: Employee, newValue: boolean) => {
    setUpdatingPermissions(prev => ({ ...prev, [employee.id]: true }));
    
    try {
        await togglePermission(employee.id, 'MANAGE_ACCOUNTING');
        
        // Обновляем локальное состояние
        setLocalEmployees(prev => prev.map(e => {
            if (e.id === employee.id) {
                const permissions = e.permissions || [];
                
                if (newValue) {
                    // Добавляем разрешение текущему сотруднику
                    if (!permissions.some(p => p.code === 'MANAGE_ACCOUNTING')) {
                        return {
                            ...e,
                            permissions: [...permissions, { code: 'MANAGE_ACCOUNTING', name: 'Управление финансами' }]
                        };
                    }
                } else {
                    // Удаляем разрешение у текущего сотрудника
                    return {
                        ...e,
                        permissions: permissions.filter(p => p.code !== 'MANAGE_ACCOUNTING')
                    };
                }
            }
            
            // Для всех остальных сотрудников: если включаем право у одного,
            // то отключаем у всех остальных
            if (newValue && e.id !== employee.id) {
                return {
                    ...e,
                    permissions: (e.permissions || []).filter(p => p.code !== 'MANAGE_ACCOUNTING')
                };
            }
            
            return e;
        }));
        
        message.success(newValue ? 'Право на ведение бухгалтерии предоставлено' : 'Право на ведение бухгалтерии отозвано');
    } catch (error) {
        console.error('Ошибка при обновлении разрешения:', error);
        message.error('Не удалось обновить разрешение');
        // Возвращаем состояние к предыдущему
        await loadEmployees();
    } finally {
        setUpdatingPermissions(prev => ({ ...prev, [employee.id]: false }));
    }
};

    const handleCheckboxChange = (employee: Employee, checked: boolean) => {
        const currentPermission = hasAccountingPermission(employee);
        
        // Показываем окно подтверждения только если значение меняется
        if (currentPermission !== checked) {
            setConfirmModalData({
                employee,
                newValue: checked
            });
            setConfirmModalOpen(true);
        }
    };

    const handleConfirmPermissionChange = async () => {
        if (!confirmModalData) return;
        
        const { employee, newValue } = confirmModalData;
        
        // Закрываем модальное окно подтверждения
        setConfirmModalOpen(false);
        
        // Выполняем изменение разрешения
        await handleToggleAccountingPermission(employee, newValue);
        
        // Сбрасываем данные
        setConfirmModalData(null);
    };

    const handleCancelPermissionChange = () => {
        setConfirmModalOpen(false);
        setConfirmModalData(null);
    };

    const handleSort = (columnIndex: number) => {
        if (!columnToApiSortMap[columnIndex]) return;
        
        setSortConfig(prev => {
            if (prev.key === columnIndex) {
                return {
                    key: columnIndex,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                };
            }
            return {
                key: columnIndex,
                direction: 'asc'
            };
        });
    };

    const handleCreateEmployee = () => {
        setModalMode('create');
        setSelectedEmployee(defaultEmployee);
        setIsModalOpen(true);
    };

    const handleDeleteEmployee = async (rowData: any[]) => {
        const [id] = rowData;
        const employeeId = Number(id);
        const employee = localEmployees.find(e => e.id === employeeId);
        
        if (!employee) return;
        
        if (!canDeleteEmployee(employee)) {
            if (employee.id === authInfo?.employee.id) {
                message.error('Нельзя удалить самого себя');
            } else {
                message.error('Недостаточно прав для удаления этого сотрудника');
            }
            return;
        }

        if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
            try {
                setLocalEmployees(prev => prev.filter(e => e.id !== employeeId));
                setTotalCount(prev => prev - 1);
                
                await deleteEmployee(employeeId);
                message.success('Сотрудник успешно удален');
                
                await loadEmployees();
            } catch (err: any) {
                console.error('Ошибка при удалении сотрудника:', err);
                loadEmployees();
                
                window.alert('Нельзя удалить сотрудника создавшего договор(ы). Вы можете заблокировать сотрудника чтобы ограничить доступ к программе.')
            }
        }
    };
    
    const handleBlockEmployee = async (rowData: any[]) => {
        const [id] = rowData;
        const employeeId = Number(id);
        const employee = localEmployees.find(e => e.id === employeeId);
        
        if (!employee) return;
        
        if (!canDeleteEmployee(employee)) {
            if (employee.id === authInfo?.employee.id) {
                message.error('Нельзя заблокировать самого себя');
            } else {
                message.error('Недостаточно прав для блокирования этого сотрудника');
            }
            return;
        }

        if (window.confirm('Вы уверены, что хотите заблокировать этого сотрудника?')) {
            try {
                await toggleEmployeeBlock(employeeId);
                message.success('Сотрудник успешно заблокирован');
                await loadEmployees();
            } catch (err: any) {
                console.error('Ошибка при блокировке сотрудника:', err);
                message.error('Не удалось заблокировать сотрудника');
            }
        }
    };

    const handleUnblockEmployee = async (rowData: any[]) => {
        const [id] = rowData;
        const employeeId = Number(id);
        const employee = localEmployees.find(e => e.id === employeeId);
        
        if (!employee) return;
        
        if (!canDeleteEmployee(employee)) {
            message.error('Недостаточно прав для разблокирования этого сотрудника');
            return;
        }

        if (window.confirm('Вы уверены, что хотите разблокировать этого сотрудника?')) {
            try {
                await toggleEmployeeBlock(employeeId);
                message.success('Сотрудник успешно разблокирован');
                await loadEmployees();
            } catch (err: any) {
                console.error('Ошибка при разблокировке сотрудника:', err);
                message.error('Не удалось разблокировать сотрудника');
            }
        }
    };

    const handleSubmitEmployee = async (employeeData: Partial<Employee>) => {
        try {
            if (modalMode === 'create') {
                const newEmployee = {
                    ...defaultEmployee,
                    ...employeeData,
                    id: Math.max(0, ...localEmployees.map(e => e.id)) + 1,
                    photoPath: ''
                };
                
                setLocalEmployees(prev => [...prev, newEmployee]);
                setTotalCount(prev => prev + 1);
                
                const createdEmployee = await createEmployee({
                    fullName: employeeData.fullName || '',
                    phone: employeeData.phone || '',
                    address: employeeData.address,
                    minSurcharge: employeeData.minSurcharge || 0,
                    role: employeeData.role || 'сотрудник'
                });
                
                setLocalEmployees(prev => 
                    prev.map(e => 
                        e.id === newEmployee.id ? createdEmployee : e
                    )
                );
                message.success('Сотрудник успешно создан');
            } else if (modalMode === 'edit' && selectedEmployee?.id) {
                setLocalEmployees(prev => 
                    prev.map(e => 
                        e.id === selectedEmployee.id 
                            ? { ...e, ...employeeData } 
                            : e
                    )
                );
                
                await updateEmployee({
                    id: selectedEmployee.id,
                    fullName: employeeData.fullName || '',
                    address: employeeData.address,
                    phone: employeeData.phone || '',
                });
                message.success('Данные сотрудника обновлены');
            }
            
            setIsModalOpen(false);
        } catch (err) {
            console.error('Ошибка при сохранении сотрудника:', err);
            message.error('Не удалось сохранить данные сотрудника');
            loadEmployees();
            throw err;
        }
    };

    const canEditSurcharge = (employee: Employee): boolean => {
        if (!authInfo) return false;
        
        if (employee.id === authInfo.employee.id) {
            return hasRole('суперадмин') || hasRole('директор') || hasRole('админ');
        }
        
        if (hasRole('суперадмин') || hasRole('директор')) {
            return true;
        }
        
        if (hasRole('админ')) {
            return employee.role === 'сотрудник';
        }
        
        return false;
    };

    const handleRowDoubleClick = (rowData: any[]) => {
        const employeeId = Number(rowData[0]);
        onViewEmployee(employeeId);
    };

    const handleOpenPhoneModal = (employee: Employee, e: React.MouseEvent) => {
        e.preventDefault();
        setPhoneValue(employee.phone);
        setCurrentPhoneEmployeeId(employee.id);
        setIsPhoneModalOpen(true);
    };

    const handleOpenSurchargeModal = (employee: Employee, e: React.MouseEvent) => {
        e.preventDefault();
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
            message.success('Телефон успешно обновлен');
        } catch (error) {
            console.error('Ошибка при сохранении телефона:', error);
            message.error('Не удалось обновить телефон');
        } finally {
            setIsSavingPhone(false);
        }
    };

    const handleSaveSurcharge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentSurchargeEmployeeId) return;
        
        setIsSavingSurcharge(true);
        try {
            await updateEmployeeMinSurcharge(currentSurchargeEmployeeId, surchargeValue);
            await loadEmployees();
            setIsSurchargeModalOpen(false);
            message.success('Надбавка успешно обновлена');
        } catch (error) {
            console.error('Ошибка при сохранении надбавки:', error);
            message.error('Не удалось обновить надбавку');
        } finally {
            setIsSavingSurcharge(false);
        }
    };

    const getTableActions = (rowData: any[]) => {
        const [id] = rowData;
        const employeeId = Number(id);
        const employee = localEmployees.find(e => e.id === employeeId);
        
        if (!employee) return [];
        
        const actions = [];
        
        if (canDeleteEmployee(employee)) {
            actions.push({
                label: 'Удалить',
                action: handleDeleteEmployee,
                color: '#EF4444'
            });
        }
        
        if (canDeleteEmployee(employee)) {
            actions.push({
                label: employee.isBlocked ? 'Разблокировать' : 'Заблокировать',
                action: employee.isBlocked ? handleUnblockEmployee : handleBlockEmployee,
                color: employee.isBlocked ? '#10B981' : '#EF4444'
            });
        }
        
        return actions;
    };

    const tableData = localEmployees.map((employee, index) => [
        employee.id.toString(),
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar 
                src={employee.photoPath ? FILE_BASE_URL + employee.photoPath : null} 
                name={employee.fullName}
            />
            {employee.fullName}
        </div>,
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {employee.role}
            {canEditEmployee(employee) && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRoleModal(employee, e);
                    }}
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#1890ff', 
                        cursor: 'pointer' 
                    }}
                >
                    <EditOutlined />
                </button>
            )}
        </div>,
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {employee.minSurcharge}
            {canEditSurcharge(employee) && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSurchargeModal(employee, e);
                    }}
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#1890ff', 
                        cursor: 'pointer' 
                    }}
                >
                    <EditOutlined />
                </button>
            )}
        </div>,
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {employee.phone}
            {canEditEmployee(employee) && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPhoneModal(employee, e);
                    }}
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#1890ff', 
                        cursor: 'pointer' 
                    }}
                >
                    <EditOutlined />
                </button>
            )}
        </div>,
        employee.address || '-',
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Checkbox
                checked={hasAccountingPermission(employee)}
                onChange={(checked) => handleCheckboxChange(employee, checked)}
            />
        </div>
    ]);

    const rowStyles: { [rowIndex: number]: RowStyle } = {};
        localEmployees.forEach((employee, index) => {
            if (isEmployeeBlocked(employee)) {
                rowStyles[index] = {
                    backgroundColor: 'rgba(254, 202, 202, 0.3)',
                };
            }
    });

    return (
        <PageLayout>
            <TitleField style={{marginTop: 0 }}>
                <CustomTitle style={{marginTop: 0 }}>Сотрудники</CustomTitle>
            </TitleField>
            
            <FilterField>
                <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    width: '50%', 
                    alignItems: 'center' 
                }}>
                    <CustomInput 
                        inputType="text"
                        placeholder="ФИО сотрудника"
                        value={nameFilter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        style={{ flex: 1 }}
                    />
                </div>
                <DarkCyanButton 
                    style={{ width: "15vw", marginLeft: 'auto' }}
                    onClick={handleCreateEmployee}
                >
                    + Новый сотрудник
                </DarkCyanButton>
            </FilterField>
            
            {employeesLoading && <div>Загрузка...</div>}
            {employeesError && <div>Ошибка: {employeesError}</div>}
            
            {!employeesLoading && !employeesError && (
                <>
                    <CustomTable 
                        columns={[
                            { name: "ID", isSortable: true },
                            { name: "ФИО", isSortable: true, align: "left" },
                            { name: "Роль", isSortable: true, align: "left" },
                            { name: "Мин. надбавка", align: "left" },
                            { name: "Телефон", isSortable: false, align: "left" },
                            { name: "Адрес", isSortable: false, align: "left" },
                            { name: "Бухгалтерия", isSortable: false, align: "center" },
                        ]} 
                        data={tableData}
                        onRowDoubleClick={handleRowDoubleClick}
                        contextMenuActions={getTableActions}
                        onSort={handleSort}
                        sortConfig={sortConfig}
                        rowStyles={rowStyles}
                    />
                    
                    <PaginationLayout>
                        <CountInfoTitle 
                            total={totalCount} 
                        />
                        
                        <Pagination
                            total={totalCount}
                            current={currentPage}
                            onChange={setCurrentPage}
                            itemsPerPage={pageSize}
                        />
                    </PaginationLayout>
                </>
            )}
            
            <EmployeeModal
                mode={modalMode}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitEmployee}
                initialData={selectedEmployee || defaultEmployee}
            />

            {isPhoneModalOpen && (
                <BaseModal
                    title="Изменение телефона"
                    onClose={() => setIsPhoneModalOpen(false)}
                    onCancel={() => setIsPhoneModalOpen(false)}
                    onSave={handleSavePhone}
                    isSubmitting={isSavingPhone}
                >
                    <CustomInput
                        inputType="text"
                        value={phoneValue}
                        onChange={(e) => setPhoneValue(e.target.value)}
                        placeholder="Введите новый телефон"
                    />
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
                    <CustomInput
                        inputType="number"
                        value={surchargeValue.toString()}
                        onChange={(e) => setSurchargeValue(Number(e.target.value))}
                        placeholder="Введите новую надбавку"
                        min={0}
                    />
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
                    <CustomSelect
                        style={{marginLeft: "25px"}}
                        value={roleValue}
                        onChange={(e) => setRoleValue(e.target.value)}
                        options={[
                            { value: 'сотрудник', label: 'Сотрудник' },
                            { value: 'админ', label: 'Администратор' },
                        ]}
                        placeholder="Выберите роль"
                    />
                </BaseModal>
            )}

            {isBlockModalOpen && employeeToBlock && (
                <BaseModal
                    title="Нельзя удалить сотрудника"
                    onClose={() => setIsBlockModalOpen(false)}
                    onCancel={() => setIsBlockModalOpen(false)}
                    onSave={handleBlockEmployee}
                    isSubmitting={false}
                >
                    <div style={{ padding: '16px' }}>
                        <p>Нельзя удалить сотрудника, у которого есть активные договоры.</p>
                        <p>Вместо удаления предлагаем заблокировать доступ сотрудника.</p>
                        <p>Заблокировать сотрудника <strong>{employeeToBlock.fullName}</strong>?</p>
                    </div>
                </BaseModal>
            )}

            {confirmModalOpen && confirmModalData && (
                <ConfirmModal
                    isOpen={confirmModalOpen}
                    title="Подтверждение изменения права на бухгалтерию"
                    message={
                        confirmModalData.newValue 
                            ? `Только один сотрудник может иметь право на ведение бухгалтерии, права у остальных сотрудников на ведение бухгалтерии анулируются. Вы действительно хотите предоставить право на ведение бухгалтерии сотруднику ${confirmModalData.employee.fullName}?`
                            : `Вы действительно хотите отозвать право на ведение бухгалтерии у сотрудника ${confirmModalData.employee.fullName}? У вас не останется бухгалтеров`
                    }
                    confirmText={confirmModalData.newValue ? "Предоставить" : "Отозвать"}
                    cancelText="Отмена"
                    onConfirm={handleConfirmPermissionChange}
                    onCancel={handleCancelPermissionChange}
                    confirmColor={confirmModalData.newValue ? "#10B981" : "#EF4444"}
                />
            )}

        </PageLayout>
    );
};

export default EmployeePage;