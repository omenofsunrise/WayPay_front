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

const ToDoListPage = () => {
    const priorityOptions = [
        { value: "", label: "Любой приоритет задач" },
        { value: "high", label: "Высокий приоритет" },
        { value: "medium", label: "Средний приоритет" },
        { value: "low", label: "Низкий приоритет" }
    ];

    const assigneeOptions = [
        { value: "", label: "Все исполнители" },
        { value: "user1", label: "Иван Иванов" },
        { value: "user2", label: "Петр Петров" },
        { value: "user3", label: "Сергей Сергеев" }
    ];

    const [priority, setPriority] = React.useState("");
    const [assignee, setAssignee] = React.useState("");
    const { getTasks, isLoading, data } = useTask();
    const [tasks, setTasks] = useState<Record<string, Task[]>>({
        pending: [],
        in_progress: [],
        completed: [],
        verified: []
    });
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    useEffect(() => {
        fetchTasks();
    }, [priority, assignee]);

const fetchTasks = async () => {
    try {
        const params: TaskParams = {
            priority: priority as 'low' | 'medium' | 'high' | undefined,
            employeeId: assignee ? parseInt(assignee.replace("user", "")) : undefined,
        };

        const tasks = await getTasks(params);
        console.log("Fetched tasks:", tasks); // Debug log

        if (Array.isArray(tasks)) {
            const groupedTasks = {
                pending: tasks.filter(t => t.taskStatus === 'pending'),
                in_progress: tasks.filter(t => t.taskStatus === 'in_progress'),
                completed: tasks.filter(t => t.taskStatus === 'completed'),
                verified: tasks.filter(t => t.taskStatus === 'verified')
            };
            setTasks(groupedTasks);
        } else {
            console.error("API response is not an array");
            setTasks({
                pending: [],
                in_progress: [],
                completed: [],
                verified: []
            });
        }
    } catch (error) {
        console.error("Error fetching tasks:", error);
        setTasks({
            pending: [],
            in_progress: [],
            completed: [],
            verified: []
        });
    }
};

    const handleTaskDrop = async (newStatus: 'pending' | 'in_progress' | 'completed' | 'verified', taskId: number) => {
        if (!draggedTask) return;
        
        try {
            // Here should be your API call to update the task status
            // await updateTaskStatus(taskId, newStatus);
            
            // Update local state
            setTasks(prev => {
                const newTasks = {...prev};
                // Remove task from old status
                Object.keys(newTasks).forEach(status => {
                    newTasks[status] = newTasks[status].filter(t => t.id !== taskId);
                });
                // Add task with new status
                newTasks[newStatus] = [...newTasks[newStatus], {...draggedTask, taskStatus: newStatus}];
                return newTasks;
            });
        } catch (error) {
            console.error("Failed to update task status:", error);
        }
    };

    const handleDragStart = (task: Task) => {
        setDraggedTask(task);
    };

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>To do</CustomTitle>
                <DarkCyanButton style={{}}>Добавить задачу</DarkCyanButton>
            </TitleField>
            <FilterField style={{maxWidth: "800px", gap: "16px" }}>
                <CustomSelect
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    options={priorityOptions}
                    customPlaceholder="Любой приоритет задач"
                    style={{ minWidth: '200px', marginRight: '16px' }}
                />
                <CustomSelect
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    options={assigneeOptions}
                    customPlaceholder="Все исполнители"
                    style={{ minWidth: '200px' }}
                />
            </FilterField>
            <TaskListContainersWrapper>
                <TaskListContainer 
                    title="К выполнению" 
                    tasks={tasks.pending} 
                    status="pending"
                    onTaskDrop={handleTaskDrop}
                    onDragStart={handleDragStart}
                />
                <TaskListContainer 
                    title="В работе" 
                    tasks={tasks.in_progress} 
                    status="in_progress"
                    onTaskDrop={handleTaskDrop}
                    onDragStart={handleDragStart}
                />
                <TaskListContainer 
                    title="На проверке" 
                    tasks={tasks.completed} 
                    status="completed"
                    onTaskDrop={handleTaskDrop}
                    onDragStart={handleDragStart}
                />
                <TaskListContainer 
                    title="Выполнено" 
                    tasks={tasks.verified} 
                    status="verified"
                    onTaskDrop={handleTaskDrop}
                    onDragStart={handleDragStart}
                />
            </TaskListContainersWrapper>
        </PageLayout>
    )
}

const TaskListContainersWrapper = styled.div`
    display: flex;
    gap: 20px;
    overflow-x: auto;
    padding-bottom: 20px;
`;

export default ToDoListPage;