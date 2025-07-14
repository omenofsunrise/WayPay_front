import React from 'react';
import styled from 'styled-components';
import { IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ClearIcon from '@mui/icons-material/Clear';

interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onAttach: () => void;
  onCancelEdit?: () => void;
  isEditing?: boolean;
  hasAttachments?: boolean;
  placeholder?: string;
  onKeyPress?: (e: React.KeyboardEvent) => void;
}

const MessageInputContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: auto;
  padding: 8px;
`;

const InputWrapper = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 20px;
  padding: 8px 12px;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.15);
  background-color: rgba(249, 250, 250, 1);
`;

const TextArea = styled.textarea`
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  max-height: 120px;
  overflow-y: auto;
  padding-right: 40px;
  background-color: rgba(249, 250, 250, 1);

  &::placeholder {
    color: #9ca3af;
  }
`;

const SendButton = styled(IconButton)<{ $active: boolean }>`
  margin-left: 8px;
  background-color: ${props => props.$active ? 'rgba(0, 125, 136, 1)' : '#e5e7eb'};
  color: ${props => props.$active ? 'rgba(0, 125, 136, 1)' : 'rgba(0, 125, 136, 1)'};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.$active ? 'rgba(0, 105, 116, 1)' : '#d1d5db'};
  }
`;

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  onAttach,
  onCancelEdit,
  isEditing = false,
  hasAttachments = false,
  placeholder = "Напишите сообщение...",
  onKeyPress
}) => {
  const canSend = value.trim().length > 0 || hasAttachments;

  return (
    <MessageInputContainer>
      <IconButton onClick={onAttach}>
        <AttachFileIcon />
      </IconButton>
      
      <InputWrapper>
        <TextArea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={1}
          onKeyPress={onKeyPress}
        />
        
        {isEditing && (
          <IconButton 
            onClick={onCancelEdit}
            size="small"
            style={{ position: 'absolute', right: 40 }}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        )}
      </InputWrapper>
      
      <SendButton 
        onClick={onSend}
        disabled={!canSend}
        $active={canSend}
      >
        <SendIcon />
      </SendButton>
    </MessageInputContainer>
  );
};

export default MessageInput;