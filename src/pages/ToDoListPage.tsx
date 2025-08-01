import React, { useEffect, useState } from "react";
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import CustomSelect from "../components/ui/fields/CustomSelect";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import TaskListContainer from "../components/ToDo/TaskListContainer";
import styled from "styled-components";
import useTask from "../api/hooks/useTask";
import type { Task, TaskParams } from "../api/types/task";
import CreateTaskModal from "../components/modal/CrudInherited/CreateTaskModal";
import EditTaskModal from "../components/modal/CrudInherited/EditTaskModal";
import { useAuth } from "../сontext/AuthContext";
import SelectPriority from "../components/ui/fields/SelectPriority";
import ToggleSwitch from "../components/ui/Toggles/ToggleSwitch";
import Checkbox from "../components/ui/CheckBoxes/Checkbox";
import { useEmployee } from "../api/hooks/useEmployee";
import CompletedTasksModal from "../components/ToDo/CompletedTasksModal";
import { useTaskCount } from "../сontext/TaskCountContext";

const ToDoListPage = () => {
    const { authInfo, hasRole } = useAuth();
    const currentUserId = authInfo?.employee.id;
    const isAdmin = hasRole('админ') || hasRole('директор') || hasRole('суперадмин');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [assigneeOptions, setAssigneeOptions] = useState<{value: string, label: string}[]>([
        { value: "", label: "Все исполнители" }
    ]);
    const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
    const [filters, setFilters] = useState<TaskParams>({
        onlyMine: false,
        includeCompleted: true,
        priority: undefined,
        taskEmployeeId: undefined
    });
    const { setActiveTasksCount } = useTaskCount();
    const { getActiveTasksCount } = useTask();
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const { 
        getTasks, 
        createTask,
        deleteTask,
        setTaskPending,
        setTaskInProgress,
        setTaskInReview,
        setTaskDone,
        isLoading 
    } = useTask();

    const updateTasksCount = async () => {
        const count = await getActiveTasksCount();
        if (count !== null) {
        setActiveTasksCount(count);
        }
    };

    const { 
        fetchEmployeeFullnames, 
    } = useEmployee();

    useEffect(() => {
        const loadEmployeeFullnames = async () => {
            try {
            const fullNames = await fetchEmployeeFullnames();
            setAssigneeOptions([
                { value: "", label: "Все исполнители" },
                ...fullNames.map(emp => ({
                value: emp.id.toString(),
                label: emp.fullName
                }))
            ]);
            } catch (error) {
            console.error("Failed to load employee fullnames:", error);
            }
    };

    loadEmployeeFullnames();
    }, [fetchEmployeeFullnames]);

    const [tasks, setTasks] = useState<Record<string, Task[]>>({
        pending: [],
        in_progress: [],
        review: [],
        done: []
    });
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    
    const handleEditTask = (task: Task) => {
        setTaskToEdit(task);
    };

    const handleDeleteTask = async (taskId: number) => {
        try {
            await deleteTask(taskId);
            await fetchTasks();
            await updateTasksCount();
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    const handleTaskUpdated = async () => {
        await fetchTasks();
        await updateTasksCount();
        setTaskToEdit(null);
    };
    
    useEffect(() => {
        fetchTasks();
    }, [filters]);

    const fetchTasks = async () => {
        try {
            const params: TaskParams = {
                ...filters,
                priority: filters.priority as 'low' | 'medium' | 'high' | undefined
            };

            const response = await getTasks(params);
            
            const tasksArray = Array.isArray(response) ? response : (response?.items || []);
            
            const groupedTasks = {
                pending: tasksArray.filter(t => t.taskStatus === 'pending'),
                in_progress: tasksArray.filter(t => t.taskStatus === 'in_progress'),
                review: tasksArray.filter(t => t.taskStatus === 'review'),
                done: tasksArray.filter(t => t.taskStatus === 'done').slice(0, 10)
            };
            
            setTasks(groupedTasks);
        } catch (error) {
            console.error("Error fetching tasks:", error);
            setTasks({
                pending: [],
                in_progress: [],
                review: [],
                done: []
            });
        }
    };

    const handleTaskDrop = async (newStatus: 'pending' | 'in_progress' | 'review' | 'done', taskId: number) => {
        if (!draggedTask) return;
        
        try {
            const canChangeStatus = checkStatusChangePermission(draggedTask, newStatus, currentUserId, isAdmin);
            if (!canChangeStatus) {
                console.warn("Нет прав для изменения статуса задачи");
                return;
            }

            setTasks(prev => {
                const newTasks = {...prev};
                Object.keys(newTasks).forEach(status => {
                    newTasks[status] = newTasks[status].filter(t => t.id !== taskId);
                });
                newTasks[newStatus] = [...newTasks[newStatus], {
                    ...draggedTask,
                    taskStatus: newStatus
                }];
                return newTasks;
            });

            let updatedTask: Task | null = null;
                    switch(newStatus) {
                        case 'pending':
                            updatedTask = await setTaskPending(taskId);
                            break;
                        case 'in_progress':
                            updatedTask = await setTaskInProgress(taskId);
                            break;
                        case 'review':
                            updatedTask = await setTaskInReview(taskId);
                            break;
                        case 'done':
                            updatedTask = await setTaskDone(taskId);
                            break;
                        default:
                            console.error('Unknown status:', newStatus);
                            return;
                    }

                    if (updatedTask) {
                        setTasks(prev => {
                            const newTasks = {...prev};
                            newTasks[newStatus] = newTasks[newStatus].filter(t => t.id !== taskId);
                            newTasks[newStatus] = [...newTasks[newStatus], updatedTask!];
                            return newTasks;
                        });
                    }
                    await updateTasksCount();
                } catch (error) {
                    console.error("Failed to update task status:", error);
                    fetchTasks();
                } finally {
                    setDraggedTask(null);
                }
            };


    useEffect(() => {
        updateTasksCount();
    }, []);

    const checkStatusChangePermission = (
        task: Task, 
        newStatus: 'pending' | 'in_progress' | 'review' | 'done',
        currentUserId?: number,
        isAdmin?: boolean
    ) => {
        if (!currentUserId) return false;

        if (isAdmin) return true;

        switch(newStatus) {
            case 'pending':
                return task.employeeId === currentUserId || 
                    task.responsibleId === currentUserId || 
                    task.createdBy === currentUserId;
            case 'in_progress':
                return task.employeeId === currentUserId || 
                    task.responsibleId === currentUserId || 
                    task.createdBy === currentUserId;
            case 'review':
                return task.employeeId === currentUserId || 
                    task.responsibleId === currentUserId || 
                    task.createdBy === currentUserId;
            case 'done':
                return task.responsibleId === currentUserId || 
                    task.createdBy === currentUserId;
            default:
                return false;
        }
    };
    
    const handleDragStart = (task: Task) => {
        setDraggedTask(task);
    };

    const handleTaskCreated = async () => {
        await fetchTasks();
        await updateTasksCount();
        setIsCreateModalOpen(false);
    };

    const handleFilterChange = (newFilters: Partial<TaskParams>) => {
        if (newFilters.priority !== undefined) {
            newFilters.priority = newFilters.priority as 'low' | 'medium' | 'high' | undefined;
        }
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>To do</CustomTitle>
                <DarkCyanButton 
                    style={{}} 
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    Добавить задачу
                </DarkCyanButton>
            </TitleField>
            <FilterField style={{maxWidth: "800px", gap: "16px" }}>
                <SelectPriority
                    value={filters.priority}
                    onChange={(value) => handleFilterChange({ 
                        priority: value as 'low' | 'medium' | 'high' | undefined 
                    })}
                    className="priority-select"
                    showAnyOption={true}
                />
                <CustomSelect
                    value={filters.taskEmployeeId?.toString() || ""}
                    onChange={(e) => handleFilterChange({ 
                        taskEmployeeId: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    options={assigneeOptions}
                    style={{ minWidth: '200px', height: "43px", margin: "0" }}
                />
                <ToggleContainer>
                    <Checkbox
                        checked={filters.onlyMine || false}
                        onChange={(checked) => handleFilterChange({ onlyMine: checked })}
                    />
                    <ToggleLabel>Только свои</ToggleLabel>
                </ToggleContainer>
            </FilterField>
            <TaskListContainersWrapper>
                <TaskListContainer 
                    title="К выполнению" 
                    tasks={tasks.pending} 
                    status="pending"
                    onTaskDrop={handleTaskDrop}
                    onDragStart={handleDragStart}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    draggedTask={draggedTask}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                />
                <TaskListContainer 
                    title="В работе" 
                    tasks={tasks.in_progress} 
                    status="in_progress"
                    onTaskDrop={handleTaskDrop}
                    onDragStart={handleDragStart}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    draggedTask={draggedTask}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                />
                <TaskListContainer 
                    title="На проверке" 
                    tasks={tasks.review} 
                    status="review"
                    onTaskDrop={handleTaskDrop}
                    onDragStart={handleDragStart}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    draggedTask={draggedTask}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                />
                <TaskListContainer 
                    title="Выполнено" 
                    tasks={tasks.done} 
                    status="done"
                    onTaskDrop={handleTaskDrop}
                    onDragStart={handleDragStart}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    draggedTask={draggedTask}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                    onShowAllCompleted={() => setIsCompletedModalOpen(true)}
                />
            </TaskListContainersWrapper>

            {taskToEdit && (
                <EditTaskModal 
                    isOpen={!!taskToEdit}
                    onClose={() => setTaskToEdit(null)}
                    onTaskUpdated={handleTaskUpdated}
                    task={taskToEdit}
                />
            )}
            
            <CreateTaskModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTaskCreated={handleTaskCreated}
            />

            <CompletedTasksModal 
                isOpen={isCompletedModalOpen}
                onClose={() => setIsCompletedModalOpen(false)}
            />
        </PageLayout>
    )
}

const TaskListContainersWrapper = styled.div`
    display: flex;
    gap: 20px;
    overflow-x: auto;
    padding-bottom: 20px;
`;

const ToggleContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
`;

const ToggleLabel = styled.span`
    font-size: 16px;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
`;

export default ToDoListPage;