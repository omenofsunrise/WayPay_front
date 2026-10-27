import type { Task } from "../../api/types/task";
import FloatingContextMenu, { DANGER_COLOR } from "../modal/FloatingContextMenu";

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
    <FloatingContextMenu
      x={position.x}
      y={position.y}
      onClose={onClose}
      items={[
        { label: "Изменить", action: onEdit },
        {
          label: "Удалить",
          color: DANGER_COLOR,
          dividerBefore: true,
          action: onDelete,
        },
      ]}
    />
  );
};

export default TaskContextMenu;
