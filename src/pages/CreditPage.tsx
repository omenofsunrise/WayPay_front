import { useState } from 'react';
import CustomTitle from '../components/ui/Text/CustomTitle';
import TitleField from '../components/ui/Layouts/TitleLayout';
import ExportButton from '../components/ui/Buttons/ExportButton';
import CustomInput from '../components/ui/fields/CustomInput';
import DateInput from '../components/ui/fields/DateInput';
import CustomTable from '../components/ui/fields/CustomTable';
import Pagination from '../components/ui/fields/CustomPagination';
import PageLayout from '../components/ui/Layouts/PageLayout';
import PrintIcon from '../assets/ui/print.svg?react';
import styled from 'styled-components';
import DarkCyanButton from '../components/ui/Buttons/DarkCyanButton';
import CreditTypes from '../components/ui/fields/CreditTypes';
import PaginationLayout from '../components/ui/Layouts/PaginationLayout';
import CountInfoTitle from '../components/ui/Text/CountInfoTitle';

interface Contract {
  id: number;
  name: string;
  number: string;
  date: string;
  amount: number;
  status: 'active' | 'closed' | 'pending';
}

const CreditPage = () => {
  const [contractNumber, setContractNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [investorName, setInvestorName] = useState('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const itemsPerPage = 10;

  const mockData: Contract[] = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Договор ${i + 1}`,
    number: `Д-${String(i + 1).padStart(4, '0')}`,
    date: new Date(2023, i % 12, (i % 28) + 1).toLocaleDateString(),
    amount: 10000 + (i * 500),
    status: ['active', 'closed', 'pending'][i % 3] as 'active' | 'closed' | 'pending',
  }));

  const handleFromDateChange = (newDate: string) => {
    setFromDate(newDate);
    console.log('Выбранная дата:', newDate);
  };

  const filteredData = mockData.filter(contract => {
    const matchesNumber = contractNumber 
      ? contract.number.includes(contractNumber)
      : true;
    
    const matchesSearch = searchQuery 
      ? contract.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        contract.number.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    return matchesNumber && matchesSearch;
  });

  const totalItems = filteredData.length;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrint = () => {
    console.log('Печать данных', paginatedData);
  };

  const handleExport = () => {
    console.log('Экспорт данных', paginatedData);
  };

  return (
    <PageLayout>
      <TitleField>
        <CustomTitle>Договоры</CustomTitle>
          <ExportButton icon={<PrintIcon />} onClick={handlePrint}>
            Печать
          </ExportButton>
          <ExportButton onClick={handleExport}>Экспорт</ExportButton>
      </TitleField>

      <FilterField>
        <InputWrapper>
          <CustomInput
            inputType="number"
            placeholder="№ Договора"
            value={contractNumber}
            onChange={(e) => {
              setContractNumber(e.target.value);
              setCurrentPage(1);
            }}
          />
        </InputWrapper>
        
        <InputWrapper>
          <DateInput 
            prefix="от:"
            value={fromDate}
            onChange={(date) => setFromDate(date)}
          />
        </InputWrapper>
        
        <InputWrapper>
          <DateInput 
            prefix="до:"
            value={toDate}
            onChange={(date) => setToDate(date)}
          />
        </InputWrapper>
        
        <InputWrapper style={{ minWidth: "500px" }}>
          <CustomInput
            inputType="text"
            placeholder="Инвестор"
            value={investorName}
            onChange={(e) => {
              setInvestorName(e.target.value);
              setCurrentPage(1);
            }}
          />
        </InputWrapper>
      </FilterField>

      <SecondRaw style={{ color: "white" }}>
        <CustomInput 
          style={{ marginRight: "auto", display: "flex"}}
          inputType="fullname"
          placeholder="ФИО"
          value={investorName}
          onChange={(e) => {
            setInvestorName(e.target.value);
            setCurrentPage(1);
          }}
        />
        <DarkCyanButton style={{ marginLeft: "auto", width: "15vw"}}> 
          + Новый договор
        </DarkCyanButton>
      </SecondRaw>

      <CreditTypes />

      <CustomTable 
        columns={[
          { name: "" },
          { name: "№", isSortable: true },
          { name: "Дата договора", isSortable: true },
          { name: "ФИО покупателя", isSortable: true },
          { name: "Телефон", isSortable: true },
          { name: "Начислено", isSortable: true },
          { name: "Уплачено", isSortable: true },
          { name: "Остаток", isSortable: true },
          { name: "Долг", isSortable: true },
        ]} 
        data={[
          ['★', '1', '12.05.2023', 'Демьянов Владимир Архангел', '8 (961) 508-33-33', '10 000 ₽', '10 000 ₽', '10 000 ₽', '10 000 ₽'],
          ['★', '2', '15.05.2023', 'Демьянов Владимир Архангел', '8 (961) 508-33-33', '10 000 ₽', '10 000 ₽', '10 000 ₽', '10 000 ₽'],
          ['★', '1', '12.05.2023', 'Демьянов Владимир Архангел', '8 (961) 508-33-33', '10 000 ₽', '10 000 ₽', '10 000 ₽', '10 000 ₽'],
          ['★', '2', '15.05.2023', 'Демьянов Владимир Архангел', '8 (961) 508-33-33', '10 000 ₽', '10 000 ₽', '10 000 ₽', '10 000 ₽'],
          ['★', '1', '12.05.2023', 'Демьянов Владимир Архангел', '8 (961) 508-33-33', '10 000 ₽', '10 000 ₽', '10 000 ₽', '10 000 ₽'],
          ['★', '2', '15.05.2023', 'Демьянов Владимир Архангел', '8 (961) 508-33-33', '10 000 ₽', '10 000 ₽', '10 000 ₽', '10 000 ₽'],
          ['★', '1', '12.05.2023', 'Демьянов Владимир Архангел', '8 (961) 508-33-33', '10 000 ₽', '10 000 ₽', '10 000 ₽', '10 000 ₽'],
          ['★', '2', '15.05.2023', 'Демьянов Владимир Архангел', '8 (961) 508-33-33', '10 000 ₽', '10 000 ₽', '10 000 ₽', '10 000 ₽'],
        ]}
      />

      <PaginationLayout>
        <Pagination 
          total={totalItems} 
        />
      </PaginationLayout>
    </PageLayout>
  );
};

const FilterField = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
`;

const InputWrapper = styled.div`
  flex: 1;  
  min-width: 0;
`;

const SecondRaw = styled.div`
  display: flex;
  width: 100%;
  margin: 15px 0;
  background-color: transparent;
`;

export default CreditPage;