import React from 'react';
import styled from 'styled-components';

interface EditButtonProps {
  onClick: (e: React.MouseEvent) => void;
  tooltip?: string;
  size?: number;
}

const EditButton: React.FC<EditButtonProps> = ({ onClick, tooltip, size = 32 }) => {
  return (
    <EditButtonContainer 
      onClick={onClick}
      size={size}
      title={tooltip}
    >
      <svg 
        width={size * 0.5} 
        height={size * 0.5} 
        viewBox="0 0 17 17" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M0.625 13.0931V16.3744H3.90625L13.5837 6.69687L10.3025 3.41562L0.625 13.0931ZM16.7337 3.54687L13.4525 0.265625L11.2387 2.48812L14.52 5.76937L16.7337 3.54687Z" 
          fill="#50555C"
        />
      </svg>
    </EditButtonContainer>
  );
};

const EditButtonContainer = styled.button<{ size: number }>`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%;
  background-color: white;
  border: 1px solid rgba(209, 213, 219, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    background-color: rgba(249, 250, 250, 1);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: scale(1.1);
  }
`;

export default EditButton;