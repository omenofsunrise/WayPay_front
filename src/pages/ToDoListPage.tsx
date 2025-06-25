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

const ToDoListPage = () => {
    const { authInfo, hasRole } = useAuth();
    const currentUserId = authInfo?.employee.id;
    const isAdmin = hasRole('админ') || hasRole('директор') || hasRole('суперадмин');
    const priorityOptions = [
        { value: "", label: "Любой приоритет задач" },
        { value: "high", label: "Высокий приоритет" },
        { value: "medium", label: "Средний приоритет" },
        { value: "low", label: "Низкий приоритет" }
    ];
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const assigneeOptions = [
        { value: "", label: "Все исполнители" },
        { value: "1", label: "Иван Иванов" },
        { value: "2", label: "Петр Петров" },
        { value: "3", label: "Сергей Сергеев" }
    ];

    const [priority, setPriority] = React.useState("");
    const [assignee, setAssignee] = React.useState("");
    const [onlyMine, setOnlyMine] = useState(false);
    const [selectedPriority, setSelectedPriority] = useState<string | undefined>();
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
            fetchTasks();
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    const handleTaskUpdated = async () => {
        await fetchTasks();
        setTaskToEdit(null);
    };
    
    useEffect(() => {
        fetchTasks();
    }, [priority, assignee, onlyMine, selectedPriority]);

    const fetchTasks = async () => {
        try {
            const params: TaskParams = {
                priority: priority as 'low' | 'medium' | 'high' | undefined,
                employeeId: assignee ? parseInt(assignee) : undefined,
            };

            const response = await getTasks(params);
            
            const tasksArray = Array.isArray(response) ? response : (response?.items || []);
            
            const groupedTasks = {
                pending: tasksArray.filter(t => t.taskStatus === 'pending'),
                in_progress: tasksArray.filter(t => t.taskStatus === 'in_progress'),
                review: tasksArray.filter(t => t.taskStatus === 'review'),
                done: tasksArray.filter(t => t.taskStatus === 'done')
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
                } catch (error) {
                    console.error("Failed to update task status:", error);
                    fetchTasks();
                } finally {
                    setDraggedTask(null);
                }
            };

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
        setIsCreateModalOpen(false);
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
                    value={selectedPriority}
                    onChange={setSelectedPriority}
                    className="priority-select"
                />
                <CustomSelect
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    options={assigneeOptions}
                    style={{ minWidth: '200px', height: "43px", margin: "0" }}
                />
                <ToggleContainer>
                    <Checkbox
                        checked={onlyMine}
                        onChange={setOnlyMine}
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