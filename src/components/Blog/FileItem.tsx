import React from 'react';
import styled from 'styled-components';

interface FileItemProps {
  file: File;
  onRemove: (e: React.MouseEvent) => void;
  onPreview: (e: React.MouseEvent) => void;
}

const FileItem: React.FC<FileItemProps> = ({ file, onRemove, onPreview }) => {
  const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

  const handleFileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(e);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(e);
  };

  return (
    <FileItemContainer onClick={handleFileClick}>
      <FileInfo>
        <FileIcon>
          <DefaultIcon>
            <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="33" height="33" rx="10" fill="#C0DBE0"/>
              <path d="M14.1333 7.125H11.8125C11.1909 7.125 10.5948 7.37193 10.1552 7.81147C9.71568 8.25101 9.46875 8.84715 9.46875 9.46875V23.5312C9.46875 24.1529 9.71568 24.749 10.1552 25.1885C10.5948 25.6281 11.1909 25.875 11.8125 25.875H21.1875C21.8091 25.875 22.4052 25.6281 22.8448 25.1885C23.2843 24.749 23.5312 24.1529 23.5312 23.5312V16.5M14.1333 7.125C15.4281 7.125 16.5 8.17396 16.5 9.46875V11.8125C16.5 12.4341 16.7469 13.0302 17.1865 13.4698C17.626 13.9093 18.2221 14.1562 18.8437 14.1562H21.1875C21.8091 14.1562 22.4052 14.4032 22.8448 14.8427C23.2843 15.2823 23.5312 15.8784 23.5312 16.5M14.1333 7.125C17.9771 7.125 23.5312 12.7083 23.5312 16.5" stroke="#007D88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </DefaultIcon>
          <HoverIcon>
            <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="33" height="33" rx="10" fill="#C0DBE0" fillOpacity="0.6"/>
              <path d="M14.1333 7.125H11.8125C11.1909 7.125 10.5948 7.37193 10.1552 7.81147C9.71568 8.25101 9.46875 8.84715 9.46875 9.46875V23.5312C9.46875 24.1529 9.71568 24.749 10.1552 25.1885C10.5948 25.6281 11.1909 25.875 11.8125 25.875H21.1875C21.8091 25.875 22.4052 25.6281 22.8448 25.1885C23.2843 24.749 23.5312 24.1529 23.5312 23.5312V16.5M14.1333 7.125C15.4281 7.125 16.5 8.17396 16.5 9.46875V11.8125C16.5 12.4341 16.7469 13.0302 17.1865 13.4698C17.626 13.9093 18.2221 14.1562 18.8437 14.1562H21.1875C21.8091 14.1562 22.4052 14.4032 22.8448 14.8427C23.2843 15.2823 23.5312 15.8784 23.5312 16.5M14.1333 7.125C17.9771 7.125 23.5312 12.7083 23.5312 16.5" stroke="#007D88" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </HoverIcon>
        </FileIcon>
        <FileNameWrapper>
          <FileName>{file.name}</FileName>
          <FileSize>{fileSize}</FileSize>
        </FileNameWrapper>
      </FileInfo>
      <FileActions>
        <FileActionButton onClick={handleRemoveClick} title="Удалить">
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.949286 14.2822C0.949286 15.2298 1.80364 16.005 2.84786 16.005H10.4421C11.4864 16.005 12.3407 15.2298 12.3407 14.2822V3.94556H0.949286V14.2822ZM13.29 1.36139H9.9675L9.01821 0.5H4.27179L3.3225 1.36139H0V3.08417H13.29V1.36139Z" fill="#50555C"/>
          </svg>
        </FileActionButton>
      </FileActions>
    </FileItemContainer>
  );
};

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  overflow: hidden;
  min-width: 0;
`;

const FileIcon = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  flex-shrink: 0;
  position: relative;
  
  svg {
    width: 100%;
    height: 100%;
  }
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
  transition: text-decoration 0.2s ease;
`;

const FileSize = styled.span`
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
  text-align: left;
`;

const FileActions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const FileItemContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: #F9FAFB;
  border-radius: 8px;
  width: 100%;
  gap: 12px;

  &:hover {
    ${FileName} {
      text-decoration: underline;
    }
  }
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
  
  svg {
    width: 14px;
    height: 16px;
  }
`;

const DefaultIcon = styled.div`
  position: absolute;
  transition: opacity 0.2s ease;
  
  ${FileItemContainer}:hover & {
    opacity: 0;
  }
`;

const HoverIcon = styled.div`
  position: absolute;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  ${FileItemContainer}:hover & {
    opacity: 1;
  }
`;

export default FileItem;