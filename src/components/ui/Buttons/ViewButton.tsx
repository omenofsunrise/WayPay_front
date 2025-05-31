import React from 'react';
import styled from 'styled-components';
import viewIcon from '../../../assets/ui/credits/newCredit/view.svg';

interface ViewButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

const ViewButton: React.FC<ViewButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <StyledViewButton 
      onClick={onClick} 
      disabled={disabled}
    >
      <img 
        src={viewIcon} 
        alt="View" 
      />
    </StyledViewButton>
  );
};

const StyledViewButton = styled.button`
  padding: 0;
  margin-left: 10px;
  cursor: pointer;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.disabled ? 0.5 : 1};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  outline: none;
  
  &:hover:not(:disabled) {
    opacity: 0.8;
  }
  
  &:focus {
    outline: none;
  }

  img {
    transition: filter 0.2s ease;
    filter: brightness(0) invert(0.3);
    
    &:hover {
      filter: brightness(0) invert(0);
    }
  }
`;

export default ViewButton;