import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import {
  NoteAddOutlined,
  DeleteOutlined,
  ContentCopy
} from '@mui/icons-material';

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
  canReply = true
}) => {
  const handleMakeNote = () => {
    onMakeNote();
    onClose();
  };

  const handleCopy = () => {
    onCopy();
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <Menu
      open={contextMenu !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
      PaperProps={{
        elevation: 3,
        sx: {
          borderRadius: 2,
          minWidth: 200,
          '& .MuiMenuItem-root': {
            py: 1.5,
            px: 2
          }
        }
      }}
    >
      <MenuItem onClick={handleMakeNote}>
        <ListItemIcon>
          <NoteAddOutlined fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          <Typography variant="body2">Сделать заметку</Typography>
        </ListItemText>
      </MenuItem>

      {messageType === 'text' && (
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2">Копировать</Typography>
          </ListItemText>
        </MenuItem>
      )}

      {canDelete && (
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2">Удалить</Typography>
          </ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
};

export default MessageContextMenu;