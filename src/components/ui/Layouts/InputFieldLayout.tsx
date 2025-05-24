import styled from "styled-components";

// Пропсы для левой части
interface LeftPartProps {
  leftRatio?: number;
}

// Пропсы для правой части
interface RightPartProps {
  rightRatio?: number;
}

const InputFieldLayout = styled.div`
  display: flex;
  height: 40px;
  align-items: center;
`;

const LeftPart = styled.div<LeftPartProps>`
  flex: ${(props) => props.leftRatio || 1};
`;

const RightPart = styled.div<RightPartProps>`
  flex: ${(props) => props.rightRatio || 1};
`;

export { InputFieldLayout, LeftPart, RightPart };