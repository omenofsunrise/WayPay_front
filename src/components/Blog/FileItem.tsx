import React from 'react';
import styled from 'styled-components';
import { FiTrash2, FiEye } from 'react-icons/fi';

interface FileItemProps {
  file: File;
  onRemove: (e: React.MouseEvent) => void;
  onPreview: (e: React.MouseEvent) => void;
}

const FileItem: React.FC<FileItemProps> = ({ file, onRemove, onPreview }) => {
  const isImage = file.type.startsWith('image/');
  const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
  const [imageUrl, setImageUrl] = React.useState('');

  React.useEffect(() => {
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [file, isImage]);

  return (
    <FileItemContainer onClick={(e) => e.stopPropagation()}>
      <FileInfo>
        {isImage && imageUrl ? (
          <ImagePreview src={imageUrl} alt={file.name} />
        ) : (
          <FileIcon>📄</FileIcon>
        )}
        <FileNameWrapper>
          <FileName>{file.name}</FileName>
          <FileSize>{fileSize}</FileSize>
        </FileNameWrapper>
      </FileInfo>
      <FileActions>
        {isImage && (
          <FileActionButton onClick={onPreview} title="Просмотреть">
            <FiEye size={16} />
          </FileActionButton>
        )}
        <FileActionButton onClick={onRemove} title="Удалить">
          <FiTrash2 size={16} />
        </FileActionButton>
      </FileActions>
    </FileItemContainer>
  );
};

const FileItemContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: #F9FAFB;
  border-radius: 8px;
  width: 100%;
  gap: 12px;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  overflow: hidden;
  min-width: 0;
`;

const ImagePreview = styled.img`
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
`;

const FileIcon = styled.div`
  font-size: 24px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #E5E7EB;
  border-radius: 4px;
  flex-shrink: 0;
`;

const FileNameWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const FileName = styled.span`
  font-size: 14px;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSize = styled.span`
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
`;

const FileActions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const FileActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6B7280;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    color: #111827;
    background: #E5E7EB;
  }
`;

export default FileItem;