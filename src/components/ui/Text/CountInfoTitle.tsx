import styled from "styled-components";

interface CountInfoTitleProps {
    total: number;
    current?: number;
}

const CountInfoTitle = ({ total }: CountInfoTitleProps) => {
    return (
        <div>
            <Paragraph>Всего: {total}</Paragraph>
        </div>
    );
};

const Paragraph = styled.p`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px; 
  margin-top: 30px;
`;

export default CountInfoTitle;