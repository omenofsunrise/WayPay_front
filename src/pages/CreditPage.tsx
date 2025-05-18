import styled from 'styled-components';
import ContractsTable from '../components/ui/fields/CustomTable';
import Pagination from '../components/ui/fields/CustomPagination';

const CreditPage = () => {
  const data = {
    total: 100,
    items: [
      { id: 1, name: "Договор 1" },
      { id: 2, name: "Договор 2" },
    ],
  };

  return (
    <div>
      <ContractsTable data={data.items} />
      <Pagination total={data.total} />
    </div>
  );
};

export default CreditPage;