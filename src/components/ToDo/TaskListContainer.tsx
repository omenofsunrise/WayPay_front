import styled from "styled-components";
import TitleField from "../ui/Layouts/TitleLayout";
import { useEffect, useState } from "react";
import TaskItem from "./TaskItem";
import type { Task } from "../../api/types/task";

export interface TaskListContainerProps {
    title: string;
    tasks: Task[];
    status: 'pending' | 'in_progress' | 'done' | 'review';
    onTaskDrop: (status: 'pending' | 'in_progress' | 'done' | 'review', taskId: number) => void;
    onDragStart: (task: Task) => void;
} 

const TaskListContainer = ({ 
    title = "Задачи", 
    tasks, 
    status, 
    onTaskDrop,
    onDragStart,
    onEditTask,
    onDeleteTask
}: TaskListContainerProps & {
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: number) => void;
}) => {
    const [count, setCount] = useState<number>(0);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const taskId = parseInt(e.dataTransfer.getData("text/plain"));
        if (!isNaN(taskId)) {
            onTaskDrop(status, taskId);
        }
    };

    useEffect(() => {
        console.log(tasks)
        setCount(tasks.length);
    }, [tasks]);

    return (
        <Container 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
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

const Container = styled.div`
    flex: 1;
    min-height: 400px;
    background: rgba(240, 243, 246, 1);
    padding: 20px;
    border: 1px solid rgba(209, 213, 219, 1);
    border-radius: 10px;
    margin: 0;
`;

export default TaskListContainer;