import styled from "styled-components";
import type { Task } from "../../api/types/task";
import { getInitials, generateAvatar, stringToColor } from "../../utils/avatarUtils";
import { BASE_URL } from "../../api/client";

interface TaskItemProps {
  task: Task;
  onDragStart: (task: Task) => void;
}

const TaskItem = ({ task, onDragStart }: TaskItemProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", task.id.toString());
    onDragStart(task);
  };

  const getPriorityColor = () => {
    switch(task.priority) {
      case "high": return "#FF5A5A";
      case "medium": return "#FFC618";
      case "low": return "#25CBA1";
      default: return "#666666";
    }
  };

  const initials = getInitials(task.employeeFullName);
  const avatarUrl = task.employeePhotoPath 
    ? `${BASE_URL}${task.employeePhotoPath}`
    : generateAvatar(initials);

  return (
    <Container 
        draggable 
        onDragStart={handleDragStart}
    >
        <TitleWrapper>
            <PriorityIcon color={getPriorityColor()}>
            <svg width="10" height="13" viewBox="0 0 10 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.333313 12.5V1.83333C0.333313 1.46667 0.46398 1.15289 0.725313 0.892C0.986646 0.631111 1.30042 0.500444 1.66665 0.5H8.33331C8.69998 0.5 9.01398 0.630667 9.27531 0.892C9.53665 1.15333 9.66709 1.46711 9.66665 1.83333V12.5L4.99998 10.5L0.333313 12.5Z" fill="currentColor"/>
            </svg>
            </PriorityIcon>
            <Title>{task.title}</Title>
        </TitleWrapper>
        <Deadline>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.6665 3.66732V5.00065H12.3332V3.66732C12.3332 3.3137 12.1927 2.97456 11.9426 2.72451C11.6926 2.47446 11.3535 2.33398 10.9998 2.33398H2.99984C2.64622 2.33398 2.30708 2.47446 2.05703 2.72451C1.80698 2.97456 1.6665 3.3137 1.6665 3.66732Z" fill="#50555C"/>
                <path d="M9.6665 2.33333H10.9998C11.3535 2.33333 11.6926 2.47381 11.9426 2.72386C12.1927 2.97391 12.3332 3.31304 12.3332 3.66667V5H1.6665V3.66667C1.6665 3.31304 1.80698 2.97391 2.05703 2.72386C2.30708 2.47381 2.64622 2.33333 2.99984 2.33333H4.33317M9.6665 2.33333V1M9.6665 2.33333H4.33317M4.33317 2.33333V1M1.6665 5.33333V11.6667C1.6665 12.0203 1.80698 12.3594 2.05703 12.6095C2.30708 12.8595 2.64622 13 2.99984 13H10.9998C11.3535 13 11.6926 12.8595 11.9426 12.6095C12.1927 12.3594 12.3332 12.0203 12.3332 11.6667V5.33333" stroke="#50555C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {new Date(task.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
        </Deadline>
        <BottomRow>
          <ExecutorInfo>
            <Avatar>
              {task.employeePhotoPath ? (
                <img src={`${BASE_URL}${task.employeePhotoPath}`} alt={initials} />
              ) : (
                <img src={generateAvatar(initials)} alt={initials} />
              )}
            </Avatar>
            <ExecutorName>{task.employeeFullName}</ExecutorName>
          </ExecutorInfo>
        </BottomRow>
    </Container>
  );
};

const Container = styled.div`
    background: white;
    padding: 12px;
    margin-bottom: 8px;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    cursor: grab;
    border-radius: 10px;
    box-shadow: 1px 1px 7px 1px rgba(0, 0, 0, 0.25);

    &:active {
        cursor: grabbing;
    }
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 8px;
`;

const PriorityIcon = styled.div<{ color: string }>`
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color};
  margin-top: 4px;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const Title = styled.h4`
  margin: 0;
  color: #333;
  word-break: break-word;
  flex: 1;
  text-align: left;
  margin-top: 0px;
`;

const BottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  margin-top: 10px;
`;

const ExecutorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Avatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  min-width: 24px;
  min-height: 24px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ExecutorName = styled.span`
  color: #50555C;
  text-align: left;
`;

const Deadline = styled.div`
  color: rgba(80, 85, 92, 1);
  font-weight: 400;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export default TaskItem;