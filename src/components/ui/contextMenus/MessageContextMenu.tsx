import React from 'react';
import FloatingContextMenu, {
  DANGER_COLOR,
  PRIMARY_COLOR,
  SECONDARY_COLOR,
} from '../../modal/FloatingContextMenu';
import type { ContextMenuItem } from '../../modal/ContextMenu';

interface MessageContextMenuProps {
  contextMenu: { mouseX: number; mouseY: number } | null;
  onClose: () => void;
  onMakeNote: () => void;
  onCopy: () => void;
  onDelete: () => void;
  messageType?: 'text' | 'file' | 'image';
  canDelete?: boolean;
  canReply?: boolean;
}

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  contextMenu,
  onClose,
  onMakeNote,
  onCopy,
  onDelete,
  messageType = 'text',
  canDelete = true,
}) => {
  if (!contextMenu) return null;

  const items: ContextMenuItem[] = [
    { label: 'Сделать заметку', color: PRIMARY_COLOR, action: onMakeNote },
  ];
  if (messageType === 'text') {
    items.push({ label: 'Копировать', color: SECONDARY_COLOR, action: onCopy });
  }
  if (canDelete) {
    items.push({
      label: 'Удалить',
      color: DANGER_COLOR,
      dividerBefore: true,
      action: onDelete,
    });
  }

  return (
    <FloatingContextMenu
      x={contextMenu.mouseX}
      y={contextMenu.mouseY}
      items={items}
      onClose={onClose}
    />
  );
};

export default MessageContextMenu;
