import styled from "styled-components";

interface ContractsTableProps {
  data: any[]; // Лучше замените any на конкретный тип данных
}

const ContractsTable: React.FC<ContractsTableProps> = ({ data }) => {
  return (
    <StyledTable>
      {/* Заголовки таблицы */}
      <thead>
        <tr>
          <th>ID</th>
          <th>Название</th>
          {/* Добавьте другие заголовки */}
        </tr>
      </thead>
      {/* Данные таблицы */}
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            <td>{item.id}</td>
            <td>{item.name}</td>
            {/* Добавьте другие ячейки */}
          </tr>
        ))}
      </tbody>
    </StyledTable>
  );
};

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  
  th {
    background-color: #f2f2f2;
  }
`;

export default ContractsTable;