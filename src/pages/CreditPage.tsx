import CustomTitle from '../components/ui/fields/CustomTitle';
import TitleField from '../components/ui/Layouts/TitleLayout';
import ExportButton from '../components/ui/Buttons/ExportButton';
import ContractsTable from '../components/ui/fields/CustomTable';
import Pagination from '../components/ui/fields/CustomPagination';
import PageLayout from '../components/ui/Layouts/PageLayout';
import FilterField from '../components/ui/Layouts/FilterField';
import PrintIcon from '../assets/ui/print.svg?react';

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
      <TitleField>
        <CustomTitle>Договоры</CustomTitle>
        <ExportButton icon={<PrintIcon />}>Печать</ExportButton>
        <ExportButton />
      </TitleField>
      <FilterField>

      </FilterField>
      <ContractsTable data={data.items} />
      <Pagination total={data.total} />
    </PageLayout>
  );
};

export default CreditPage;