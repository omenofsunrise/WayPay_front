import React from 'react';
import { Container } from 'react-bootstrap';
import FileItem from './FileItem';

type FileContainerProps = {
  files: File[];
  onFileRemove?: (index: number) => void;
  onFilePreview?: (file: File) => void;
  removeIcon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const FileContainer: React.FC<FileContainerProps> = ({
  files,
  onFileRemove,
  onFilePreview,
  removeIcon,
  className,
  style,
}) => {
  if (files.length === 0) return null;

  return (
    <Container className={className} style={style}>
      {files.map((file, index) => (
        <FileItem
          key={`${file.name}-${index}`}
          file={file}
          onRemove={onFileRemove ? (e) => {
            e.stopPropagation();
            onFileRemove(index);
          } : undefined}
          onPreview={onFilePreview ? (e) => {
            e.stopPropagation();
            onFilePreview(file);
          } : undefined}
          removeIcon={removeIcon}
        />
      ))}
    </Container>
  );
};

export default FileContainer;