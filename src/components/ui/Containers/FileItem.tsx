import React from 'react';
import styled from 'styled-components';

interface FileItemProps {
  file: File;
  onRemove?: (e: React.MouseEvent) => void;
  onPreview?: (e: React.MouseEvent) => void;
  removeIcon?: React.ReactNode;
}

const FileItem: React.FC<FileItemProps> = ({ file, onRemove, onPreview, removeIcon }) => {
  const isImage = file.type.startsWith('image/');
  
  return (
    <FileItemContainer>
      <FileInfo onClick={onPreview}>
        <FileIcon>
          {isImage ? (
            <img src={URL.createObjectURL(file)} alt={file.name} />
          ) : (
            <FileTypeIcon>{getFileExtension(file.name)}</FileTypeIcon>
          )}
        </FileIcon>
        <FileName>{file.name}</FileName>
      </FileInfo>
      {onRemove && (
        <RemoveButton onClick={onRemove}>
          {removeIcon || <DefaultRemoveIcon />}
        </RemoveButton>
      )}
    </FileItemContainer>
  );
};

const getFileExtension = (filename: string) => {
  return filename.split('.').pop()?.toUpperCase() || 'FILE';
};

const FileItemContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: #f3f4f6;
  margin-bottom: 8px;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  flex-grow: 1;
  cursor: pointer;
`;

const FileIcon = styled.div`
  width: 40px;
  height: 40px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 4px;
  }
`;

const FileTypeIcon = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: #4b5563;
`;

const FileName = styled.div`
  font-size: 14px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  margin-left: 8px;
  color: #ef4444;
`;

const DefaultRemoveIcon = () => (
  <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0.949286 14.2822C0.949286 15.2298 1.80364 16.005 2.84786 16.005H10.4421C11.4864 16.005 12.3407 15.2298 12.3407 14.2822V3.94556H0.949286V14.2822ZM13.29 1.36139H9.9675L9.01821 0.5H4.27179L3.3225 1.36139H0V3.08417H13.29V1.36139Z" fill="#ef4444"/>
  </svg>
);

export default FileItem;