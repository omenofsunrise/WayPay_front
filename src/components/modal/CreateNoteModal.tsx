import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import AddPhotoButtonSvg from '../../assets/ui/buttons/AddPhotoButton.svg';  
import AddFileButtonSvg from '../../assets/ui/buttons/AddFileButton.svg';
import FileItem from '../Blog/FileItem';
import type { Attachment } from '../../api/types/chat';
import { SOCIAL_BASE_URL } from '../../api/socialApiClient';
import CustomCalendar from '../ui/fields/CustomCalendar';
import BaseModal from './BASE/modalCRUBase';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (noteData: { 
    content: string; 
    file?: File; 
    attachmentInfo?: Attachment; 
    remindDate?: string;
  }) => void;
  noteContent: string;
  onNoteContentChange: (content: string) => void;
  initialFile?: File | null;
  attachmentInfo?: Attachment | null;
}

const CreateNoteModal: React.FC<CreateNoteModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  noteContent,
  onNoteContentChange,
  initialFile = null,
  attachmentInfo = null
}) => {
  const [attachedFile, setAttachedFile] = useState<File | null>(initialFile);
  const [attachmentData, setAttachmentData] = useState<Attachment | null>(attachmentInfo);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [remindDate, setRemindDate] = useState<string>('')

  useEffect(() => {
    if (initialFile) {
      setAttachedFile(initialFile);
      setAttachmentData(null);
    }
  }, [initialFile]);

  useEffect(() => {
    if (attachmentInfo) {
      setAttachmentData(attachmentInfo);
      setAttachedFile(null);
    }
  }, [attachmentInfo]);

  const handleCreate = (event?: React.FormEvent) => {
    event?.preventDefault();
    onCreate({
      content: noteContent,
      file: attachedFile || undefined,
      attachmentInfo: attachmentData || undefined,
      remindDate: remindDate || undefined
    });
    handleCancel();
  };

  const handleCancel = () => {
    setAttachedFile(null);
    setAttachmentData(null);
    setRemindDate('');
    onNoteContentChange('');
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 10MB');
        return;
      }
      
      setAttachedFile(file);
      setAttachmentData(null);
      
      event.target.value = '';
    }
  };

  const handleAddPhotoClick = () => {
    photoInputRef.current?.click();
  };

  const handleAddFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setAttachmentData(null);
  };

  const getFileType = (file: File): 'image' | 'file' => {
    return file.type.startsWith('image/') ? 'image' : 'file';
  };

  const getAttachmentType = (attachment: Attachment): 'image' | 'file' => {
    return attachment.contentType.startsWith('image/') ? 'image' : 'file';
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      title="Заметка"
      subtitle="Добавьте текст, напоминание или вложение"
      appearance="compact-form"
      width="568px"
      maxHeight="calc(100vh - 32px)"
      onClose={handleCancel}
      onCancel={handleCancel}
      onSave={handleCreate}
      saveButtonText="Создать"
      isSaveDisabled={!noteContent.trim()}
    >
      <NoteModalContent>
        <NoteModalWrapper>
          <FieldLabel>Напомнить</FieldLabel>
          <CustomCalendar 
            prefix=""
            value={remindDate}
            onChange={(date) => setRemindDate(date)}
          />

          <FieldLabel>Текст заметки</FieldLabel>
          <NoteInput 
            value={noteContent}
            onChange={(e) => onNoteContentChange(e.target.value)}
            placeholder="Введите текст заметки..."
          />
          
          <AttachmentButtonsContainer>
            <AttachmentButton type="button" onClick={handleAddPhotoClick}>
              <ButtonIcon src={AddPhotoButtonSvg} alt="Add Photo" />
              Добавить фото
            </AttachmentButton>
            
            <AttachmentButton type="button" onClick={handleAddFileClick}>
              <ButtonIcon src={AddFileButtonSvg} alt="Add File" />
              Добавить файл
            </AttachmentButton>
          </AttachmentButtonsContainer>

          <HiddenInput
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
          />
          <HiddenInput
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
          />

          {(attachedFile || attachmentData) && (
            <AttachmentPreviewContainer>
              {attachedFile ? (
                getFileType(attachedFile) === 'image' ? (
                  <ImagePreviewWrapper>
                    <ImagePreviewImg 
                      src={URL.createObjectURL(attachedFile)} 
                      alt="Preview" 
                      onLoad={() => URL.revokeObjectURL(URL.createObjectURL(attachedFile))}
                    />
                    <RemoveImageButton type="button" onClick={handleRemoveFile}>
                      ×
                    </RemoveImageButton>
                  </ImagePreviewWrapper>
                ) : (
                  <FileItemWrapper>
                    <FileItem 
                      file={attachedFile}
                      onRemove={handleRemoveFile}
                      showRemoveButton={true}
                    />
                  </FileItemWrapper>
                )
              ) : attachmentData ? (
                getAttachmentType(attachmentData) === 'image' ? (
                  <ImagePreviewWrapper>
                    <ImagePreviewImg 
                      src={SOCIAL_BASE_URL + '/' + attachmentData.fileUrl} 
                      alt={SOCIAL_BASE_URL + attachmentData.fileUrl}
                    />
                    <RemoveImageButton type="button" onClick={handleRemoveFile}>
                      ×
                    </RemoveImageButton>
                  </ImagePreviewWrapper>
                ) : (
                  <FileItemWrapper>
                    <FileItem 
                      file={{
                        name: attachmentData.fileName,
                        size: attachmentData.fileSize || 0,
                        type: attachmentData.contentType
                      } as File}
                      onRemove={handleRemoveFile}
                      showRemoveButton={true}
                    />
                  </FileItemWrapper>
                )
              ) : null}
            </AttachmentPreviewContainer>
          )}
        </NoteModalWrapper>
      </NoteModalContent>
    </BaseModal>
  );
};

const NoteModalContent = styled.div`
  padding: 6px 34px 24px;
  color: black;
`;

const NoteModalWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FieldLabel = styled.label`
  margin-top: 8px;
  color: #192438;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
`;

const NoteInput = styled.textarea`
  width: auto;
  height: 150px;
  padding: 12px;
  margin: 0 0 7px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  background: white;
  color: black;

  &:focus {
    outline: none;
    border-color: #007d88;
  }

  &::placeholder {
    color: #a0a0a0;
  }
`;

const AttachmentButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const AttachmentButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  color: #50555C;
  transition: all 0.2s;

  &:hover {
    background: #f8f9fa;
    border-color: #007d88;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ButtonIcon = styled.img`
  width: 16px;
  height: 16px;
`;

const HiddenInput = styled.input`
  display: none;
`;

const AttachmentPreviewContainer = styled.div`
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-start;
`;

const ImagePreviewWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const ImagePreviewImg = styled.img`
  height: 80px;
  width: auto;
  object-fit: cover;
  border-radius: 4px;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
  padding: 0;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
  }
`;

const FileItemWrapper = styled.div`
  width: 100%;
`;

export default CreateNoteModal;
