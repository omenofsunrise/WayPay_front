import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

interface CommentActionsMenuProps {
  commentId: number;
  onEdit: () => void;
  onDelete: () => void;
}

const CommentActionsMenu: React.FC<CommentActionsMenuProps> = ({ commentId, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <MoreOptionsIcon ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        <DotsIcon />
      </div>
      {isOpen && (
        <ContextMenu>
          <ContextMenuItem onClick={() => {
            onEdit();
            setIsOpen(false);
          }}>
            <EditIcon />
            Редактировать
          </ContextMenuItem>
          <ContextMenuItem onClick={() => {
            onDelete();
            setIsOpen(false);
          }}>
            <TrashIcon />
            Удалить
          </ContextMenuItem>
        </ContextMenu>
      )}
    </MoreOptionsIcon>
  );
};

const MoreOptionsIcon = styled.div`
  cursor: pointer;
  margin-left: auto;
  padding: 4px;
  position: relative;
`;

const ContextMenu = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 160px;
  overflow: hidden;
`;

const ContextMenuItem = styled.div`
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const EditIcon = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  background-color: currentColor;
  mask-image: url("data:image/svg+xml,%3Csvg width='17' height='17' viewBox='0 0 17 17' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0.625 13.0931V16.3744H3.90625L13.5837 6.69687L10.3025 3.41562L0.625 13.0931ZM16.7337 3.54687L13.4525 0.265625L11.2387 2.48812L14.52 5.76937L16.7337 3.54687Z' fill='%2350555C'/%3E%3C/svg%3E");
  mask-repeat: no-repeat;
  mask-position: center;
`;

const TrashIcon = styled.span`
  display: inline-block;
  width: 14px;
  height: 16px;
  background-color: currentColor;
  mask-image: url("data:image/svg+xml,%3Csvg width='14' height='18' viewBox='0 0 14 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.01662 16C1.01662 17.1 1.91399 18 3.01078 18H10.9875C12.0843 18 12.9816 17.1 12.9816 16V4H1.01662V16ZM13.9787 1H10.4889L9.49183 0H4.50641L3.50933 1H0.0195312V3H13.9787V1Z' fill='%2350555C'/%3E%3C/svg%3E");
  mask-repeat: no-repeat;
  mask-position: center;
`;

const DotsIcon = () => (
  <svg width="17" height="4" viewBox="0 0 17 4" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.95486 0.119141C0.920509 0.119141 0.0742188 0.965431 0.0742188 1.99979C0.0742188 3.03414 0.920509 3.88043 1.95486 3.88043C2.98922 3.88043 3.83551 3.03414 3.83551 1.99979C3.83551 0.965431 2.98922 0.119141 1.95486 0.119141ZM15.1194 0.119141C14.085 0.119141 13.2387 0.965431 13.2387 1.99979C13.2387 3.03414 14.085 3.88043 15.1194 3.88043C16.1537 3.88043 17 3.03414 17 1.99979C17 0.965431 16.1537 0.119141 15.1194 0.119141ZM8.53712 0.119141C7.50277 0.119141 6.65648 0.965431 6.65648 1.99979C6.65648 3.03414 7.50277 3.88043 8.53712 3.88043C9.57148 3.88043 10.4178 3.03414 10.4178 1.99979C10.4178 0.965431 9.57148 0.119141 8.53712 0.119141Z" fill="#50555C"/>
  </svg>
);