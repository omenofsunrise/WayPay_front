import styled from 'styled-components';
import CustomTitle from '../components/ui/fields/CustomTitle';
import ContractsTable from '../components/ui/fields/CustomTable';
import Pagination from '../components/ui/fields/CustomPagination';
import PageLayout from '../components/ui/fields/PageLayout';

const CreditPage = () => {
  const data = {
    total: 100,
    items: [
      { id: 1, name: "Договор 1" },
      { id: 2, name: "Договор 2" },
    ],
  };

  return (
    <PageLayout>
      <CustomTitle>Договоры</CustomTitle>
      <ContractsTable data={data.items} />
      <Pagination total={data.total} />
    </PageLayout>
  );
};

export default CreditPage;