import { useState, useCallback, useEffect } from 'react';
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import ExportButton from "../../components/ui/Buttons/ExportButton";
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
import useExport from '../../api/hooks/useExport';
import type { Employee, EmployeeFilterRequest } from '../../api/types/employee';
import employeeService from '../../api/services/employeeService';
import CustomSelect from '../../components/ui/fields/CustomSelect';
import Avatar from '../../components/Profile/Avatar';
import { BASE_URL } from '../../api/client';

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
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [localEmployees, setLocalEmployees] = useState<Employee[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    
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

    const { exportData, isExporting, exportProgress } = useExport<Employee>();

    const { 
        employees,
        employeesLoading, 
        employeesError, 
        fetchEmployees,
        updateEmployee,
        createEmployee,
        deleteEmployee
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

    const handleEditEmployee = (employee: Employee) => {
        setModalMode('edit');
        setSelectedEmployee(employee);
        setIsModalOpen(true);
    };

    const handleViewEmployee = (employee: Employee) => {
        setModalMode('view');
        setSelectedEmployee(employee);
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
        employee.minSurcharge.toString(),
        employee.phone,
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
                <CustomInput 
                    inputType="text"
                    placeholder="ФИО сотрудника"
                    value={nameFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                />
                <CustomSelect
                    options={roleOptions}
                    value={roleFilter || ''}
                    onChange={(e) => handleRoleFilterChange(e.target.value)}
                />
                <DarkCyanButton 
                    style={{ width: "15vw" }}
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
        </PageLayout>
    );
};

export default EmployeePage;