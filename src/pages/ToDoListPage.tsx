import React from "react"
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton"
import CustomSelect from "../components/ui/fields/CustomSelect"
import FilterField from "../components/ui/Layouts/FilterField"
import PageLayout from "../components/ui/Layouts/PageLayout"
import TitleField from "../components/ui/Layouts/TitleLayout"
import CustomTitle from "../components/ui/Text/CustomTitle"
import TaskListContainer from "../components/ToDo/TaskListContainer"
import styled from "styled-components"

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
                <TaskListContainer title="К выполнению"/>
                <TaskListContainer title="В работе"/>
                <TaskListContainer title="На проверке"/>
                <TaskListContainer title="Выполнено"/>
            </TaskListContainersWrapper>
        </PageLayout>
    )
}

const TaskListContainersWrapper = styled.div`
    display: flex;
    gap: 20px;
`;

export default ToDoListPage;