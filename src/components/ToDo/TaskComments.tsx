import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../сontext/AuthContext';
import { BASE_URL, FILE_BASE_URL } from '../../api/client';
import { getInitials, generateAvatar } from '../../utils/avatarUtils';
import useTaskNote from '../../api/hooks/useTaskNote';
import DarkCyanButton from '../ui/Buttons/DarkCyanButton';
import GrayButton from '../ui/Buttons/GrayButton';

interface TaskCommentsProps {
  taskId: number;
  onClose: () => void;
}

const TaskComments = ({ taskId, onClose }: TaskCommentsProps) => {
  const { authInfo } = useAuth();
  const { notes, getNotesByTaskId, createNote, updateNote, deleteNote, isLoading } = useTaskNote();
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<{ id: number | null, text: string }>({ id: null, text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getNotesByTaskId(taskId);
  }, [taskId, getNotesByTaskId]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notes]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !authInfo?.employee.id) return;

    setIsSubmitting(true);
    try {
      await createNote({
        text: newComment,
        taskId,
        createdBy: authInfo.employee.id
      });
      setNewComment('');
      await getNotesByTaskId(taskId);
    } catch (error) {
      console.error('Ошибка при отправке комментария:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async () => {
    if (!editingComment.text.trim() || !editingComment.id) return;

    setIsSubmitting(true);
    try {
      await updateNote(editingComment.id, { text: editingComment.text });
      setEditingComment({ id: null, text: '' });
      await getNotesByTaskId(taskId);
    } catch (error) {
      console.error('Ошибка при редактировании комментария:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      try {
        await deleteNote(id);
        await getNotesByTaskId(taskId);
      } catch (error) {
        console.error('Ошибка при удалении комментария:', error);
      }
    }
  };

  const startEditing = (note: { id: number, text: string }) => {
    setEditingComment({ id: note.id, text: note.text });
  };

  const cancelEditing = () => {
    setEditingComment({ id: null, text: '' });
  };

  const isCurrentUserComment = (creatorId: number) => {
    return authInfo?.employee.id === creatorId;
  };

  return (
    <CommentsContainer>
      <CommentsList>
        {isLoading ? (
          <LoadingMessage>Загрузка комментариев...</LoadingMessage>
        ) : notes.length === 0 ? (
          <EmptyMessage>Нет комментариев</EmptyMessage>
        ) : (
          notes.map(note => (
            <CommentItem key={note.id}>
              <CommentHeader>
                <Avatar>
                  {note.creator.photoPath ? (
                    <img src={`${FILE_BASE_URL}${note.creator.photoPath}`} alt={getInitials(note.creator.fullName)} />
                  ) : (
                    <img src={generateAvatar(getInitials(note.creator.fullName))} alt={getInitials(note.creator.fullName)} />
                  )}
                </Avatar>
                <CommentAuthor>{note.creator.fullName}</CommentAuthor>
                <CommentDate>
                  {new Date(note.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </CommentDate>
                
                {isCurrentUserComment(note.creator.id) && (
                  <CommentActions>
                    <ActionButton type="button" onClick={() => startEditing(note)}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.5 1.5C11.7652 1.23478 12.1174 1.07843 12.5 1.07843C12.8826 1.07843 13.2348 1.23478 13.5 1.5C13.7652 1.76521 13.9216 2.11739 13.9216 2.5C13.9216 2.8826 13.7652 3.23478 13.5 3.5L4.5 12.5L1 13L1.5 9.5L11.5 1.5Z" stroke="#50555C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </ActionButton>
                    <ActionButton type="button" onClick={() => handleDelete(note.id)}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 3.5H13M4.5 3.5V2C4.5 1.73478 4.60536 1.48043 4.79289 1.29289C4.98043 1.10536 5.23478 1 5.5 1H8.5C8.76522 1 9.01957 1.10536 9.20711 1.29289C9.39464 1.48043 9.5 1.73478 9.5 2V3.5M11.5 3.5V12C11.5 12.2652 11.3946 12.5196 11.2071 12.7071C11.0196 12.8946 10.7652 13 10.5 13H3.5C3.23478 13 2.98043 12.8946 2.79289 12.7071C2.60536 12.5196 2.5 12.2652 2.5 12V3.5H11.5Z" stroke="#50555C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </ActionButton>
                  </CommentActions>
                )}
              </CommentHeader>
              
              {editingComment.id === note.id ? (
                <EditContainer>
                  <EditTextarea
                    value={editingComment.text}
                    onChange={(e) => setEditingComment({...editingComment, text: e.target.value})}
                    rows={3}
                  />
                  <EditButtons>
                    <GrayButton onClick={cancelEditing} disabled={isSubmitting}>
                      Отмена
                    </GrayButton>
                    <DarkCyanButton onClick={handleUpdateComment} disabled={isSubmitting}>
                      Сохранить
                    </DarkCyanButton>
                  </EditButtons>
                </EditContainer>
              ) : (
                <CommentText>{note.text}</CommentText>
              )}
            </CommentItem>
          ))
        )}
        <div ref={commentsEndRef} />
      </CommentsList>

      <CommentContainer>
        <CommentTextarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Напишите комментарий..."
          rows={3}
          disabled={isSubmitting}
        />
        <SubmitButton 
          onClick={handleAddComment}
          disabled={!newComment.trim() || isSubmitting}
        >
          {isSubmitting ? 'Отправка...' : 'Отправить'}
        </SubmitButton>
      </CommentContainer>
    </CommentsContainer>
  );
};

const CommentsContainer = styled.div`
  position: relative;
  width: auto;

  max-height: 500px;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: transparent;
  color: black;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 5px;

  &:hover {
    color: #000;
  }
`;

const CommentsList = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
  padding-right: 10px;
  max-height: 300px;
  background: transparent;
  color: black;`;

const CommentItem = styled.div`
  margin-bottom: 15px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  background-color: white;
  color: black;
  background-color: rgba(240, 243, 246, 1);
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 10px;
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  position: relative;
  background-color: rgba(240, 243, 246, 1);
  color: black;
`;


const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
  background: transparent;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CommentAuthor = styled.span`
  font-weight: 600;
  margin-right: 10px;
  background: transparent;
  color: black;`;

const CommentDate = styled.span`
  color: #666;
  font-size: 12px;
  background: transparent;
  color: black;`;

const CommentActions = styled.div`
  margin-left: auto;
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 0.7;
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const CommentText = styled.p`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  background: transparent;
  color: black;`;

const CommentContainer = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  background: transparent;
  color: black;`;

const CommentTextarea = styled.textarea`
  width: 100%; /* Учитываем padding */
  margin: 10px 0; /* Убираем горизонтальные отступы */
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  margin-bottom: 8px;
  font-family: inherit;
  min-height: 80px;
  background: transparent;
  color: black;
  box-sizing: border-box; /* Учитываем padding в ширине */
  max-width: 100%;
`;

const SubmitButton = styled.button`
  padding: 8px 16px;
  background-color: #008b8b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-end;
  
  &:hover {
    background-color: #006b6b;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const EditContainer = styled.div`
  margin-top: 10px;
  background: transparent;
  color: black;
`;

const EditTextarea = styled.textarea`
  width: calc(100% - 20px); /* Учитываем padding */
  margin: 10px 0; /* Убираем горизонтальные отступы */
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  margin-bottom: 8px;
  font-family: inherit;
  min-height: 80px;
  background-color: white;
  color: black;
  box-sizing: border-box; /* Учитываем padding в ширине */
  max-width: 100%;
`;

const EditButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #666;
  padding: 20px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #666;
  padding: 20px;
`;

export default TaskComments;