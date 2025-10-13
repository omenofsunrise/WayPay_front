import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import CustomTitle from '../ui/Text/CustomTitle';
import GrayButton from '../ui/Buttons/GrayButton';
import DarkCyanButton from '../ui/Buttons/DarkCyanButton';
import AddPhotoButtonSvg from '../../assets/ui/buttons/AddPhotoButton.svg';  
import AddFileButtonSvg from '../../assets/ui/buttons/AddFileButton.svg';
import FileItem from '../Blog/FileItem';
import type { Attachment } from '../../api/types/chat';
import { SOCIAL_BASE_URL } from '../../api/socialApiClient';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (noteData: { content: string; file?: File; attachmentInfo?: Attachment }) => void;
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

  const handleCreate = () => {
    onCreate({
      content: noteContent,
      file: attachedFile || undefined,
      attachmentInfo: attachmentData || undefined
    });
    handleCancel();
  };

  const handleCancel = () => {
    setAttachedFile(null);
    setAttachmentData(null);
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
    <ModalOverlay isOpen={isOpen} onClick={handleCancel}>
      <NoteModalContent onClick={(e) => e.stopPropagation()}>
        <NoteModalWrapper>
          <CustomTitle style={{ marginTop: 0 }}>Заметка</CustomTitle>
          
          <NoteInput 
            value={noteContent}
            onChange={(e) => onNoteContentChange(e.target.value)}
            placeholder="Введите текст заметки..."
          />
          
          <AttachmentButtonsContainer>
            <AttachmentButton onClick={handleAddPhotoClick}>
              <ButtonIcon src={AddPhotoButtonSvg} alt="Add Photo" />
              Добавить фото
            </AttachmentButton>
            
            <AttachmentButton onClick={handleAddFileClick}>
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
                    <RemoveImageButton onClick={handleRemoveFile}>
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
                    <RemoveImageButton onClick={handleRemoveFile}>
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

          <ButtonContainer>
            <GrayButton style={{width: "100px"}} onClick={handleCancel}>
              Отменить
            </GrayButton>
            <DarkCyanButton 
              style={{width: "100px"}} 
              onClick={handleCreate}
              disabled={!noteContent.trim()}
            >
              Создать
            </DarkCyanButton>
          </ButtonContainer>
        </NoteModalWrapper>
      </NoteModalContent>
    </ModalOverlay>
  );
};

// Стили остаются без изменений...
const ModalOverlay = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1001;
  color: black;
`;

const NoteModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const NoteModalWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 20px;
`;

const NoteInput = styled.textarea`
  width: auto;
  height: 150px;
  padding: 12px;
  margin: 15px 0;
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
  background: #ff4444;
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
    background: #cc0000;
    transform: scale(1.1);
  }
`;

const FileItemWrapper = styled.div`
  width: 100%;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

export default CreateNoteModal;