import styled from 'styled-components';
import React from 'react';

interface GrayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  width?: number | string;
}

const GrayButton: React.FC<GrayButtonProps> = ({
  children = 'Подтвердить',
  icon,
  width,
  ...props
}) => {
  return (
    <ButtonContainer {...props} $width={width}>
      {icon && <IconWrapper>{icon}</IconWrapper>}
      <span>{children}</span>
    </ButtonContainer>
  );
};

const ButtonContainer = styled.button<{ $width?: number | string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: rgba(209, 213, 219, 1);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  color: black;
  font-size: 15px;
  font-weight: 400;
  height: auto;
  white-space: nowrap;
  transition: background-color 0.2s ease;
  margin: 0;
  margin-right: auto;
  
  width: ${({ $width }) => 
    $width ? 
      (typeof $width === 'number' ? `${$width}px` : $width) : 
      'auto'};
  
  &:hover {
    background-color: rgba(209, 233, 239, 1);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(209, 233, 239, 1);
  }
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
`;

export default GrayButton;