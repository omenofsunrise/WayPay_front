import styled from "styled-components";
import TitleField from "../ui/Layouts/TitleLayout";
import { useEffect, useState } from "react";
import TaskItem from "./TaskItem";
import type { Task } from "../../api/types/task";
import ShowAllButton from "./ShowAllButton";

export interface TaskListContainerProps {
    title: string;
    tasks: Task[];
    status: 'pending' | 'in_progress' | 'done' | 'review';
    onTaskDrop: (status: 'pending' | 'in_progress' | 'done' | 'review', taskId: number) => void;
    onDragStart: (task: Task) => void;
    draggedTask: Task | null;
    isAdmin: boolean;
    currentUserId?: number;
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: number) => void;
    onShowAllCompleted?: () => void;
} 

const TaskListContainer = ({ 
    title = "Задачи", 
    tasks, 
    status, 
    onTaskDrop,
    onDragStart,
    onEditTask,
    onDeleteTask,
    draggedTask,
    isAdmin,
    currentUserId,
    onShowAllCompleted
}: TaskListContainerProps) => {
    const [isDropForbidden, setIsDropForbidden] = useState(false);
    const [count, setCount] = useState<number>(0);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        
        const canDropToDone = isAdmin || 
            (draggedTask && 
            (draggedTask.responsibleId === currentUserId || 
            draggedTask.createdBy === currentUserId));
        
        const forbidden = status === 'done' && !canDropToDone;
        setIsDropForbidden(forbidden);
        
        if (forbidden) {
            e.dataTransfer.dropEffect = 'none';
            return;
        }
        
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragLeave = () => {
        setIsDropForbidden(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const taskId = parseInt(e.dataTransfer.getData("text/plain"));
        
        if (isNaN(taskId)) return;
        
        const canDropToDone = isAdmin || 
            (draggedTask && 
            (draggedTask.responsibleId === currentUserId || 
            draggedTask.createdBy === currentUserId));
        
        if (status === 'done' && !canDropToDone) {
            return;
        }
        
        onTaskDrop(status, taskId);
    };

    useEffect(() => {
        setCount(tasks.length);
    }, [tasks]);

    return (
        <Container 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            $isDropForbidden={isDropForbidden}
        >
            <TitleField style={{margin: 0}}>
                <Title>{title}</Title>
                <Count>{count}</Count>
            </TitleField>
            <TasksList>
                {tasks.map(task => (
                    <TaskItem 
                        key={task.id} 
                        task={task} 
                        onDragStart={onDragStart}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                    />
                ))}
            </TasksList>
            {status === 'done' && tasks.length >= 5 && onShowAllCompleted && (
                <ShowAllButton onClick={onShowAllCompleted}>
                    Посмотреть все
                </ShowAllButton>
            )}
        </Container>
    )
}

const Title = styled.h3`
    text-align: left;
    margin: 0;
    color: black;
    font-size: 16px;
`;

const Count = styled.span`
    margin-left: auto;
    background: #e0e0e0;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 14px;
`;

const TasksList = styled.div`
    margin-top: 16px;
`;

const Container = styled.div<{ $isDropForbidden?: boolean }>`
    flex: 1;
    min-height: 400px;
    background: rgba(240, 243, 246, 1);
    padding: 20px;
    border: 1px solid rgba(209, 213, 219, 1);
    border-radius: 10px;
    margin: 0;
    position: relative;
    
    ${props => props.$isDropForbidden && `
        &::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 0, 0, 0.05);
            border: 2px dashed rgba(255, 0, 0, 0.3);
            border-radius: 8px;
            pointer-events: none;
        }
    `}
`;

export default TaskListContainer;