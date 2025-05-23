import styled from "styled-components";

interface CountInfoTitleProps {
    total: number;
    current?: number;
}

const CountInfoTitle = ({ total }: CountInfoTitleProps) => {
    return (
        <div>
            <p>Всего: {total}</p>
        </div>
    );
};

export default CountInfoTitle;