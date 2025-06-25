import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import type { Task } from "../../api/types/task";
import { getInitials, generateAvatar, stringToColor } from "../../utils/avatarUtils";
import { BASE_URL } from "../../api/client";
import TaskContextMenu from "./TaskContextMenu";
import { useAuth } from "../../сontext/AuthContext";

interface TaskItemProps {
  task: Task;
  onDragStart: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  disableContextMenu?: boolean;
}

const TaskItem = ({ task, onDragStart, onEdit, onDelete, disableContextMenu = false }: TaskItemProps) => {
  const { authInfo, hasRole } = useAuth();
  const currentUserId = authInfo?.employee.id;
  const isAdmin = hasRole('админ') || hasRole('директор') || hasRole('суперадмин');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const taskRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [itemRect, setItemRect] = useState<DOMRect | null>(null);

  const canDrag = isAdmin || task.employeeId === currentUserId || task.responsibleId === currentUserId || task.createdBy === currentUserId;;
  const canDropToDone = isAdmin || task.responsibleId === currentUserId || task.createdBy === currentUserId;

  const handleDragStart = (e: React.DragEvent) => {
    if (disableContextMenu) return;
      if (!canDrag) {
          e.preventDefault();
          return;
      }

      e.dataTransfer.setData("can-drop-to-done", canDropToDone.toString());

      const rect = e.currentTarget.getBoundingClientRect();
      setItemRect(rect);
      setShowPlaceholder(true);
      
      setPreviewPosition({
          x: e.clientX,
          y: e.clientY
      });
      
      e.dataTransfer.setData("text/plain", task.id.toString());
      onDragStart(task);
      setIsDragging(true);
      
      const element = e.currentTarget as HTMLElement;
      element.classList.add('is-dragging');
      
      const dragImg = new Image();
      dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      e.dataTransfer.setDragImage(dragImg, 0, 0);
  };

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientX !== 0 && e.clientY !== 0) {
      setPreviewPosition({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    element.classList.remove('is-dragging');
    setIsDragging(false);
    setShowPlaceholder(false);
    setItemRect(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disableContextMenu) return;
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleEdit = () => {
    onEdit(task);
    handleCloseContextMenu();
  };

  const handleDelete = () => {
    onDelete(task.id);
    handleCloseContextMenu();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (taskRef.current && !taskRef.current.contains(e.target as Node)) {
        handleCloseContextMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      <div ref={taskRef}>
        {showPlaceholder && itemRect && (
        <Placeholder 
          style={{
            width: `${itemRect.width}px`,
            height: `${itemRect.height}px`,
          }}
        />
      )}

          <Container 
              draggable 
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              onContextMenu={handleContextMenu}
              style={{
                cursor: canDrag ? 'grab' : 'not-allowed',
                opacity: canDrag ? 1 : 0.7
              }}
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
                      <path d="M1.6665 3.66732V5.00065H12.3332V3.66732C12.3332 3.3137 12.1927 2.97456 11.9426 2.72451C11.6926 2.47446 11.3535 2.33398 10.9998 2.33398H2.99984C2.64622 2.33398 2.30708 2.47446 2.05703 2.72451C1.80698 2.97391 1.6665 3.31304 1.6665 3.66667V5H12.3332V3.66667C12.3332 3.31304 12.1927 2.97391 11.9426 2.72386C11.6926 2.47381 11.3535 2.33333 10.9998 2.33333H2.99984C2.64622 2.33333 2.30708 2.47381 2.05703 2.72386C1.80698 2.97391 1.6665 3.31304 1.6665 3.66667V5.33333V11.6667C1.6665 12.0203 1.80698 12.3594 2.05703 12.6095C2.30708 12.8595 2.64622 13 2.99984 13H10.9998C11.3535 13 11.6926 12.8595 11.9426 12.6095C12.1927 12.3594 12.3332 12.0203 12.3332 11.6667V5.33333" stroke="#50555C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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

          {isDragging && (
              <DragPreview 
                  ref={dragPreviewRef}
                  style={{
                      left: `${previewPosition.x}px`,
                      top: `${previewPosition.y}px`,
                  }}
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
                          <path d="M1.6665 3.66732V5.00065H12.3332V3.66732C12.3332 3.3137 12.1927 2.97456 11.9426 2.72451C11.6926 2.47446 11.3535 2.33398 10.9998 2.33398H2.99984C2.64622 2.33398 2.30708 2.47446 2.05703 2.72451C1.80698 2.97391 1.6665 3.31304 1.6665 3.66667V5H12.3332V3.66667C12.3332 3.31304 12.1927 2.97391 11.9426 2.72386C11.6926 2.47381 11.3535 2.33333 10.9998 2.33333H2.99984C2.64622 2.33333 2.30708 2.47381 2.05703 2.72386C1.80698 2.97391 1.6665 3.31304 1.6665 3.66667V5.33333V11.6667C1.6665 12.0203 1.80698 12.3594 2.05703 12.6095C2.30708 12.8595 2.64622 13 2.99984 13H10.9998C11.3535 13 11.6926 12.8595 11.9426 12.6095C12.1927 12.3594 12.3332 12.0203 12.3332 11.6667V5.33333" stroke="#50555C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
              </DragPreview>
          )}

          {contextMenu && (
            <TaskContextMenu
              task={task}
              position={contextMenu}
              onClose={handleCloseContextMenu}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
            />
          )}
      </div>
  );
};

const Placeholder = styled.div`
  position: absolute;
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 10px;
  background: transparent;
  pointer-events: none;
  margin-bottom: 8px;
`;

const Container = styled.div`
    background: white;
    padding: 12px;
    margin-bottom: 8px;
    border-radius: 10px;
    box-shadow: 1px 1px 7px 1px rgba(0, 0, 0, 0.25);
    cursor: grab;
    position: relative;
    transition: all 0.2s ease;
    min-height: 80px;
    border: 1px solid transparent;

    &:active {
        cursor: grabbing;
    }

    &:hover {
      box-shadow: 1px 1px 10px 5px rgba(80, 85, 92, 0.5);
    }

    &.is-dragging {
        opacity: 0;
        border: 1px solid transparent;
        box-shadow: none;
        background: transparent;
        padding: 12px;
        min-height: 80px;
    }
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 8px;
`;

const DragPreview = styled.div`
    position: fixed;
    pointer-events: none;
    z-index: 1000;
    opacity: 1;
    transform: translate(-50%, -50%);
    background: white;
    padding: 12px;
    border-radius: 10px;
    box-shadow: 1px 1px 7px 1px rgba(0, 0, 0, 0.25);
    width: calc(100% - 24px);
    max-width: 300px;
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