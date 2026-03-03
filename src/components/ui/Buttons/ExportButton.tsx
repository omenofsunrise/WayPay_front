import styled from 'styled-components';
import React from 'react';

const DefaultExportIcon = () => (
  <svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.5 1.5V11M8.5 11L11.5 8M8.5 11L5.5 8"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.5 13.5V14.75C1.5 15.7165 2.2835 16.5 3.25 16.5H13.75C14.7165 16.5 15.5 15.7165 15.5 14.75V13.5"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface ExportButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  onExport?: () => Promise<void>;
  isExporting?: boolean;
  exportProgress?: number;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  children = 'Экспорт',
  icon = <DefaultExportIcon />,
  onExport,
  isExporting = false,
  exportProgress = 0,
  ...props
}) => {
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onExport) {
      try {
        await onExport();
      } catch (error) {
        console.error('Export error:', error);
      }
    }
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <ButtonContainer 
      {...props} 
      onClick={handleClick}
      disabled={isExporting || props.disabled}
    >
      {isExporting ? (
        <ProgressContainer>
          <span>Экспорт... {exportProgress}%</span>
          <ProgressBar progress={exportProgress} />
        </ProgressContainer>
      ) : (
        <>
          {icon}
          <span>{children}</span>
        </>
      )}
    </ButtonContainer>
  );
};

const ButtonContainer = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: transparent;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  color: inherit;
  font-size: 18px;
  height: 40px;
  margin: auto 0 10px 0;
  transition: background-color 0.2s ease;
  position: relative;
  overflow: hidden;
  color: rgba(80, 85, 92, 1);

  &:hover {
    background-color: rgba(209, 213, 219, 1);
    color: black;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(156, 163, 175, 0.5);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
`;

const ProgressBar = styled.div<{ progress: number }>`
  height: 2px;
  width: 100%;
  background-color: #e0e0e0;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${({ progress }) => progress}%;
    background-color: #000;
    transition: width 0.3s ease;
  }
`;

export default ExportButton;
