import styled from 'styled-components';

interface InputContainerProps {
  $maxWidth?: string;
}

export const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

export const InputLabel = styled.span`
  text-align: right;
  font-size: 14px;
  color: black;
`;

export const InputContainer = styled.div<InputContainerProps>`
  margin-left: auto;
  flex: 1;
  max-width: ${props => props.$maxWidth || '405px'};
`;