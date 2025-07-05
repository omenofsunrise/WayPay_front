import React from 'react';
import styled from 'styled-components';
import FileItem from './FileItem';
import { FiTrash2 } from 'react-icons/fi';

interface FileRecepientProps {
  files: File[];
  onFileRemove: (index: number) => void;
  onFilesUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilePreview: (file: File) => void;
}

const FileRecepient: React.FC<FileRecepientProps> = ({ 
  files, 
  onFileRemove, 
  onFilesUpload,
  onFilePreview
}) => {
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const event = {
        target: {
          files: e.dataTransfer.files
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onFilesUpload(event);
    }
  };

  const handleFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      window.open(imageUrl, '_blank');
    } else {
      const fileUrl = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = fileUrl;
      a.target = '_blank';
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(fileUrl), 100);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e: Event) => {
      onFilesUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
    };
    input.click();
  };

  const imageFiles = files.filter(file => file.type.startsWith('image/'));
  const otherFiles = files.filter(file => !file.type.startsWith('image/'));

  return (
    <FileRecepientContainer 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      hasFiles={files.length > 0}
    >
      {files.length === 0 ? (
        <>
          <FileIcon>
            <svg width="80" height="81" viewBox="0 0 80 81" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.5066 70.7049C17.3561 70.6725 16.2238 70.4093 15.177 69.9308C14.1302 69.4524 13.1902 68.7684 12.4129 67.9196C11.6356 67.0707 11.0368 66.0744 10.652 64.9896C10.2673 63.9048 10.1045 62.7538 10.1733 61.6049C10.1333 54.4282 10.1733 47.2515 10.1733 40.0749C10.1733 39.6328 10.3489 39.2089 10.6615 38.8964C10.974 38.5838 11.3979 38.4082 11.84 38.4082C12.282 38.4082 12.7059 38.5838 13.0185 38.8964C13.331 39.2089 13.5066 39.6328 13.5066 40.0749C13.5066 47.4082 13.4 54.7415 13.5066 62.0749C13.56 65.7649 16.3333 67.3715 19.6333 67.3715H61.1766C62.2254 67.3954 63.2565 67.0995 64.133 66.5231C65.0094 65.9467 65.6897 65.1172 66.0833 64.1449C66.4046 62.9953 66.5175 61.7975 66.4166 60.6082V40.0749C66.4166 39.6328 66.5922 39.2089 66.9048 38.8964C67.2174 38.5838 67.6413 38.4082 68.0833 38.4082C68.5253 38.4082 68.9492 38.5838 69.2618 38.8964C69.5744 39.2089 69.75 39.6328 69.75 40.0749C69.75 47.4882 70.0333 54.9582 69.75 62.3649C69.7213 63.4991 69.4673 64.6163 69.0028 65.6515C68.5383 66.6867 67.8726 67.6191 67.0444 68.3946C66.2162 69.1701 65.242 69.7731 64.1786 70.1686C63.1151 70.5641 61.9836 70.7441 60.85 70.6982L18.5066 70.7049Z" fill="#50555C"/>
              <path d="M41.1234 11.3994C40.8493 11.1192 40.4783 10.9546 40.0867 10.9394C40.04 10.9439 39.9923 10.9372 39.9434 10.9194C39.87 10.8928 39.8534 10.9194 39.8067 10.9394C39.4139 10.9538 39.0416 11.1185 38.7667 11.3994L26.5367 23.6294C26.2331 23.9438 26.0651 24.3648 26.0689 24.8018C26.0727 25.2388 26.248 25.6568 26.557 25.9658C26.866 26.2748 27.284 26.4501 27.721 26.4539C28.158 26.4577 28.579 26.2897 28.8934 25.9861L38.28 16.6028V52.4094C38.28 52.8514 38.4556 53.2754 38.7682 53.5879C39.0807 53.9005 39.5047 54.0761 39.9467 54.0761C40.3887 54.0761 40.8127 53.9005 41.1252 53.5879C41.4378 53.2754 41.6134 52.8514 41.6134 52.4094V16.6028L51 25.9861C51.3144 26.2897 51.7354 26.4577 52.1724 26.4539C52.6094 26.4501 53.0274 26.2748 53.3364 25.9658C53.6454 25.6568 53.8207 25.2388 53.8245 24.8018C53.8283 24.3648 53.6603 23.9438 53.3567 23.6294L41.1234 11.3994Z" fill="#50555C"/>
            </svg>
          </FileIcon>
          <FileLabel>Добавьте фото или файл</FileLabel>
          <FileHint>Перетащите файлы сюда или нажмите для выбора</FileHint>
        </>
      ) : (
        <>
          {imageFiles.length > 0 && (
            <ImagesGrid>
              {imageFiles.map((file, index) => {
                const originalIndex = files.indexOf(file);
                return (
                  <ImageItem key={originalIndex}>
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={file.name} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilePreview(file);
                      }}
                    />
                    <RemoveImageButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileRemove(originalIndex);
                      }}
                    >
                      <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0.949286 14.2822C0.949286 15.2298 1.80364 16.005 2.84786 16.005H10.4421C11.4864 16.005 12.3407 15.2298 12.3407 14.2822V3.94556H0.949286V14.2822ZM13.29 1.36139H9.9675L9.01821 0.5H4.27179L3.3225 1.36139H0V3.08417H13.29V1.36139Z" fill="#50555C"/>
                      </svg>
                    </RemoveImageButton>
                  </ImageItem>
                );
              })}
            </ImagesGrid>
          )}
          
          {otherFiles.length > 0 && (
            <FilesList onClick={(e) => e.stopPropagation()}>
              {otherFiles.map((file, index) => {
                const originalIndex = files.indexOf(file);
                return (
                  <FileItem 
                      key={originalIndex}
                      file={file}
                      onRemove={(e) => {
                          e.stopPropagation();
                          onFileRemove(originalIndex);
                      }}
                      onPreview={(e) => {
                          e.stopPropagation();
                          handleFilePreview(file);
                      }}
                  />
                );
              })}
            </FilesList>
          )}
        </>
      )}
    </FileRecepientContainer>
  );
};

const FileRecepientContainer = styled.div<{ hasFiles?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: ${props => props.hasFiles ? 'flex-start' : 'center'};
  gap: 16px;
  padding: ${props => props.hasFiles ? '20px' : '40px'}; 
  margin: 0 30px; 
  border-radius: 10px;
  border: 1px dashed rgba(209, 213, 219, 1);
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  width: calc(100% - 60px);
  box-sizing: border-box;
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;

  &:hover {
    background-color: rgba(249, 250, 251, 0.5);
  }
`;

const FileIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FileLabel = styled.span`
  font-size: 16px;
  color: #50555C;
  text-align: center;
`;

const FileHint = styled.span`
  font-size: 14px;
  color: #9CA3AF;
  text-align: center;
`;

const FilesList = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 12px;
`;

const ImagesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  width: 100%;
`;

const ImageItem = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
    transition: transform 0.2s;
    
    &:hover {
      transform: scale(1.02);
    }
  }
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  z-index: 10;
  transition: all 0.2s;
  padding: 4px;
  
  &:hover {
    transform: scale(1.1);
  }

  svg {
    width: 14px;
    height: 16px;
  }
`;

export default FileRecepient;