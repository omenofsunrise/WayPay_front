import styled from 'styled-components';
import React from 'react';

interface NewCreditButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

const DarkCyanButton: React.FC<NewCreditButtonProps> = ({
  children = 'Подтвердить',
  icon,
  disabled = false,
  ...props
}) => {
  return (
    <ButtonContainer disabled={disabled} {...props}>
      {icon && <IconWrapper>{icon}</IconWrapper>}
      <span>{children}</span>
    </ButtonContainer>
  );
};

const ButtonContainer = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: ${props => props.disabled ? 'rgba(102, 177, 184, 1)' : 'rgba(0, 125, 136, 1)'};
  border: none;
  border-radius: 10px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  color: white;
  font-size: 15px;
  font-weight: 400;
  height: auto;
  white-space: nowrap;
  transition: background-color 0.2s ease;
  margin: 0;
  opacity: ${props => props.disabled ? 0.7 : 1};
  
  &:hover {
    background-color: ${props => props.disabled ? 'rgba(102, 177, 184, 1)' : 'rgba(0, 150, 163, 1)'};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(156, 163, 175, 0.5);
  }
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
`;

export default DarkCyanButton;