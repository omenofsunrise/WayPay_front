import styled from "styled-components";
import type { Task } from "../../api/types/task";

interface TaskContextMenuProps {
  task: Task;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
  currentUserId?: number;
}

const TaskContextMenu = ({ 
  task, 
  position, 
  onClose, 
  onEdit, 
  onDelete,
  isAdmin,
  currentUserId
}: TaskContextMenuProps) => {
  const canEditOrDelete = isAdmin || task.createdBy === currentUserId;

  if (!canEditOrDelete) {
    return null;
  }

  return (
    <ContextMenuContainer 
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <ContextMenuItem onClick={onEdit}>
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.625 13.0931V16.3744H3.90625L13.5837 6.69687L10.3025 3.41562L0.625 13.0931ZM16.7337 3.54687L13.4525 0.265625L11.2387 2.48812L14.52 5.76937L16.7337 3.54687Z" fill="#50555C"/>
        </svg>
        <span>Изменить</span>
      </ContextMenuItem>
      <ContextMenuItem onClick={onDelete}>
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.01747 16C1.01747 17.1 1.91485 18 3.01164 18H10.9883C12.0851 18 12.9825 17.1 12.9825 16V4H1.01747V16ZM13.9796 1H10.4898L9.49269 0H4.50727L3.51018 1H0.0203857V3H13.9796V1Z" fill="#50555C"/>
        </svg>
        <span>Удалить</span>
      </ContextMenuItem>
    </ContextMenuContainer>
  );
};

const ContextMenuContainer = styled.div`
  position: fixed;
  background: white;
  border-radius: 5px;
  box-shadow: 1px 1px 5px 1px rgba(0, 0, 0, 0.25);
  z-index: 1000;
  padding: 8px 0;
  min-width: 150px;
`;

const ContextMenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 8px;
  cursor: pointer;
  
  &:hover {
    background: #f5f5f5;
  }

  svg {
    width: 16px;
    height: 16px;
  }

  span {
    color: #333;
    font-size: 14px;
  }
`;

export default TaskContextMenu;