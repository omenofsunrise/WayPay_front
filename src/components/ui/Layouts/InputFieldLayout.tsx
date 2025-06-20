import styled from "styled-components";

interface LeftPartProps {
  leftRatio?: number;
}

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