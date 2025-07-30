import React from 'react';
import { FileText, Image, Trash2 } from 'react-feather';
import styled from 'styled-components';

interface FileItemProps {
  file: File;
  onRemove?: () => void;
  onPreview?: () => void;
  showDeleteButton?: boolean;
  className?: string;
}

const FileItem: React.FC<FileItemProps> = ({ 
  file, 
  onRemove, 
  onPreview,
  showDeleteButton = true,
  className
}) => {
  const getFileIcon = () => {
    if (file.type.startsWith('image/')) {
      return <Image size={20} className="file-icon" />;
    }
    return <FileText size={20} className="file-icon" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Container className={className} onClick={onPreview}>
      <FileInfo>
        {getFileIcon()}
        <FileName>{file.name}</FileName>
        <FileSize>{formatFileSize(file.size)}</FileSize>
      </FileInfo>
      {showDeleteButton && onRemove && (
        <DeleteButton
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 size={18} />
        </DeleteButton>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin: 4px 0;
  background-color: '#f8f9fa';
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: '#e9ecef';
  }
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`;

const FileName = styled.span`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: '#212529';
`;

const FileSize = styled.span`
  color: '#6c757d';
  font-size: 0.85em;
  margin-left: 8px;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: '#dc3545';
  cursor: pointer;
  padding: 4px;
  margin-left: 8px;
  display: flex;
  align-items: center;

  &:hover {
    color: '#bb2d3b';
  }

  svg {
    display: block;
  }
`;

export default FileItem;