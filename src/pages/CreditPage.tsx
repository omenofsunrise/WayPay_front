import styled from 'styled-components';
import CatalogLayout from '../components/Layout/CatalogLayout/CatalogLayout';
import ContractsTable from '../components/ui/fields/ContractsTable';
import Pagination from '../components/ui/fields/Pagination';

interface CreditPageProps {
  onLogout: () => void;
}

const CreditPage = ({ onLogout }: CreditPageProps) => {
  // Пример данных - замените на реальные
  const data = {
    total: 100,
    items: [
      { id: 1, name: "Договор 1" },
      { id: 2, name: "Договор 2" },
    ],
  };

  return (
    <CatalogLayout
      title="Договоры"
      headerButtons={
        <>
          <StyledButton>Добавить договор</StyledButton>
          <LogoutButton onClick={onLogout}>Выйти</LogoutButton>
        </>
      }
      filters={<ContractsFilters placeholder="Фильтры..." />}
      table={<ContractsTable data={data.items} />}
      totalItems={data.total}
      pagination={<Pagination total={data.total} />}
    />
  );
};

// Стилизованные компоненты
const StyledButton = styled.button`
  color: yellow;
  background-color: #333;
  padding: 8px 16px;
  margin-right: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const LogoutButton = styled.button`
  background-color: #f44336;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const ContractsFilters = styled.input`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  max-width: 300px;
  margin-bottom: 20px;
`;

export default CreditPage;