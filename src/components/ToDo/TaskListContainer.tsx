import styled from "styled-components";
import TitleField from "../ui/Layouts/TitleLayout";
import { useEffect, useState } from "react";

export interface TaskListContainerProps {
    title: string;
} 

const TaskListContainer = ({ title = "Задачи" }: TaskListContainerProps) => {
    const [count, setCount] = useState<number>(0);

    const calculateCount = () => {
        return 4;
    }

    useEffect(() => {
        setCount(calculateCount());
    });

    return (
        <Container>
            <TitleField style={{margin: 0}}>
                <Title>{title}</Title>
                <Title>{count}</Title>
            </TitleField>

        </Container>
    )
}

const Title = styled.h3`
    text-align: left;
    margin: 0;
    color: black;
    font-size: 16px;
`;

const Container = styled.div`
    width: auto;
    background: rgba(240, 243, 246, 1);
    padding: 20px;
    border: 1px solid rgba(209, 213, 219, 1);
    border-radius: 10px;
`;

export default TaskListContainer;