import styled from "styled-components";

interface PaginationProps {
  total: number;
  current?: number;
  onChange?: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ total }) => {
  return (
    <StyledPagination>
      {/* Реализация пагинации */}
      <span>Всего страниц: {Math.ceil(total / 10)}</span>
    </StyledPagination>
  );
};

const StyledPagination = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

export default Pagination;