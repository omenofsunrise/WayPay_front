import { useState, useCallback, useEffect } from 'react';
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import CustomInput from "../../components/ui/fields/CustomInput";
import Pagination from "../../components/ui/fields/CustomPagination";
import CustomTable from "../../components/ui/tables/CustomTable";
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
import { BASE_URL } from '../../api/client';
import { useAuth } from '../../сontext/AuthContext';
import BaseModal from '../../components/modal/BASE/modalCRUBase';
import { EditOutlined } from '@ant-design/icons';
import styled from 'styled-components';

interface EmployeePageProps {
    onViewEmployee: (id: number) => void;
}

interface PermissionDisplay {
  code: string;
  label: string;
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
        photoPath: ''
    };

    const { 
        employees,
        employeesLoading, 
        employeesError, 
        fetchEmployees,
        updateEmployee,
        createEmployee,
        deleteEmployee,
        updateEmployeeMinSurcharge,
        updateEmployeePhone,
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

    const handleRoleFilterChange = (value: string) => {
        setRoleFilter(value || undefined);
        setCurrentPage(1);
    };

    const canEditEmployee = (employee: Employee): boolean => {
        if (!authInfo) return false;
        if (employee.id === authInfo.employee.id) return false;
        
        if (hasRole('суперадмин') || hasRole('директор')) {
        return true;
        }
        
        if (hasRole('админ')) {
        return employee.role === 'сотрудник' || employee.role === 'бухгалтер';
        }
        
        return false;
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
        if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
            try {
                setLocalEmployees(prev => prev.filter(e => e.id !== Number(id)));
                setTotalCount(prev => prev - 1);
                
                await deleteEmployee(Number(id));
                
                await loadEmployees();
            } catch (err) {
                console.error('Ошибка при удалении сотрудника:', err);
                loadEmployees();
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
            }
            
            setIsModalOpen(false);
        } catch (err) {
            console.error('Ошибка при сохранении сотрудника:', err);
            loadEmployees();
            throw err;
        }
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
        } catch (error) {
            console.error('Ошибка при сохранении телефона:', error);
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
        } catch (error) {
            console.error('Ошибка при сохранении надбавки:', error);
        } finally {
            setIsSavingSurcharge(false);
        }
    };

    const tableData = localEmployees.map(employee => [
        employee.id.toString(),
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar 
            src={employee.photoPath ? BASE_URL + employee.photoPath : null} 
            name={employee.fullName}
            />
            {employee.fullName}
        </div>,
        employee.role,
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {employee.minSurcharge}
            {canEditEmployee(employee) && (
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
    ]);

    const tableActions = [
        {
            label: 'Удалить',
            action: handleDeleteEmployee,
            color: '#EF4444'
        }
    ];

    const roleOptions = [
        { value: '', label: 'Все роли' },
        { value: 'админ', label: 'Администратор' },
        { value: 'бухгалтер', label: 'Бухгалтер' },
        { value: 'сотрудник', label: 'Сотрудник' },
    ];

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
                    <CustomSelect
                        options={roleOptions}
                        value={roleFilter || ''}
                        onChange={(e) => handleRoleFilterChange(e.target.value)}
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
                        ]} 
                        data={tableData}
                        onRowDoubleClick={handleRowDoubleClick}
                        contextMenuActions={tableActions}
                        onSort={handleSort}
                        sortConfig={sortConfig}
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
        </PageLayout>
    );
};

const PermissionsPanel = styled.div`
  margin-top: 20px;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
`;

const PermissionsTitle = styled.h3`
  margin-bottom: 12px;
  font-size: 16px;
  color: #333;
`;

const PermissionItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
`;

const PermissionLabel = styled.span`
  font-size: 14px;
`;

export default EmployeePage;