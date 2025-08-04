import { useAuth } from '../сontext/AuthContext';
import PageLayout from '../components/ui/Layouts/PageLayout';
import CustomTitle from '../components/ui/Text/CustomTitle';
import TitleField from '../components/ui/Layouts/TitleLayout';
import CustomTable from '../components/ui/tables/CustomTable';
import { useState, useCallback, useEffect } from 'react';
import useCompany from '../api/hooks/useCompany';
import CompanyModal, { type CompanyModalData } from '../components/modal/CrudInherited/CompanyModal';
import DarkCyanButton from '../components/ui/Buttons/DarkCyanButton';
import BaseModal from '../components/modal/BASE/modalCRUBase';
import CustomInput from '../components/ui/fields/CustomInput';
import DateModalInput from '../components/ui/fields/DateModalInput';
import { formatDate } from '../utils/dateFormatter';

const AdminPanelPage = () => {
  const { hasRole } = useAuth();
  const [nameFilter, setNameFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedCompany, setSelectedCompany] = useState<CompanyModalData | null>(null);
  
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [phoneValue, setPhoneValue] = useState('');
  const [dateValue, setDateValue] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);
  
  const { 
    isLoading, 
    error, 
    company,
    companies, 
    getCompany,
    getAllCompanies,
    createCompany,
    deleteCompany,
    changeLicenceDate,
    changePhone
  } = useCompany();

  const loadCompanies = useCallback(async () => {
    await getAllCompanies();
  }, [getAllCompanies]);

  useEffect(() => {
    if (hasRole('суперадмин')) {
      loadCompanies();
    } else {
      getCompany();
    }
  }, [loadCompanies, getCompany]);

  const handleCreateCompany = () => {
    setModalMode('create');
    setSelectedCompany({
      phone: '',
      licenceDate: new Date()
    });
    setIsCompanyModalOpen(true);
  };

  const handleOpenPhoneEdit = (companyId: number, currentPhone: string) => {
    setEditingCompanyId(companyId);
    setPhoneValue(currentPhone);
    setIsPhoneModalOpen(true);
  };

  const handleOpenDateEdit = (companyId: number, currentDate: Date) => {
    setEditingCompanyId(companyId);
    setDateValue(currentDate);
    setIsDateModalOpen(true);
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompanyId) return;

    setIsSaving(true);
    try {
      const success = await changePhone(editingCompanyId, phoneValue);
      if (success) {
        await loadCompanies();
        setIsPhoneModalOpen(false);
      } else {
        alert('Не удалось сохранить изменения');
      }
    } catch (err) {
      console.error('Ошибка при изменении телефона:', err);
      alert('Произошла ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompanyId) return;

    setIsSaving(true);
    try {
      const success = await changeLicenceDate(editingCompanyId, dateValue);
      if (success) {
        await loadCompanies();
        setIsDateModalOpen(false);
      } else {
        alert('Не удалось сохранить изменения');
      }
    } catch (err) {
      console.error('Ошибка при изменении даты:', err);
      alert('Произошла ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCompany = async (rowData: any[]) => {
    const [id, name] = rowData;
    
    if (!window.confirm('Вы уверены, что хотите удалить эту компанию?')) {
      return;
    }
    
    const userInput = prompt(`Для подтверждения удаления компании "${name}", введите её название:`);
    
    if (userInput === name) {
      try {
        await deleteCompany(Number(id));
        loadCompanies();
      } catch (err) {
        console.error('Ошибка при удалении компании:', err);
        alert('Не удалось удалить компанию');
      }
    } else if (userInput !== null) {
      alert('Название компании не совпадает. Удаление отменено.');
    }
  };

  const handleSubmitCompany = async (data: CompanyModalData) => {
    try {
      if (modalMode === 'create') {
        await createCompany({
          AdminPhone: data.phone,
          LicenceDate: data.licenceDate
        });
      }
      loadCompanies();
      setIsCompanyModalOpen(false);
    } catch (err) {
      console.error('Ошибка при сохранении компании:', err);
    }
  };

  const filteredCompanies = companies?.filter(company => 
    company.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
    company.phone.includes(nameFilter)
  ) || [];

  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const tableData = hasRole('суперадмин') 
    ? paginatedCompanies.map(company => [
        company.id.toString(),
        company.name,
        <span 
          onClick={() => handleOpenPhoneEdit(company.id, company.phone)}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}
        >
          {company.phone}
        </span>,
        <span 
          onClick={() => handleOpenDateEdit(company.id, company.licenceDate || new Date())}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}
        >
          {company.licenceDate ? formatDate(company.licenceDate) : 'Нет данных'}
        </span>
      ])
    : company
      ? [
          [
            company.id.toString(),
            company.name,
            company.phone,
            company.licenceDate 
              ? formatDate(company.licenceDate)
              : 'Нет данных'
          ]
        ]
      : [];

  const tableActions = hasRole('суперадмин') 
    ? [
        {
          label: 'Изм. телефон',
          action: (rowData: any[]) => handleOpenPhoneEdit(Number(rowData[0]), rowData[2]),
          color: '#3B82F6'
        },
        {
          label: 'Изм. дату',
          action: (rowData: any[]) => handleOpenDateEdit(Number(rowData[0]), rowData[3] ? new Date(rowData[3]) : new Date()),
          color: '#3B82F6'
        },
        {
          label: 'Удалить',
          action: handleDeleteCompany,
          color: '#EF4444'
        }
      ]
    : [];

  if (!hasRole('суперадмин')) {
    return (
      <PageLayout>
        <TitleField>
          <CustomTitle>Моя компания</CustomTitle>
        </TitleField>
        {isLoading && <div>Загрузка...</div>}
        {error && <div>Ошибка: {error}</div>}
        {!isLoading && !error && company && (
          <CustomTable 
            columns={[
              { name: "ID" },
              { name: "Название компании", align: "left" },
              { name: "Телефон", align: "left" },
              { name: "Лицензия заканчивается", align: "center" }
            ]} 
            data={tableData}
          />
        )}
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <TitleField>
        <CustomTitle>Управление лицензиями</CustomTitle>
        <DarkCyanButton 
          style={{ width: "15vw", maxHeight: "50px" }}
          onClick={handleCreateCompany}
        >
          + Новая компания
        </DarkCyanButton>
      </TitleField>
            
      {isLoading && <div>Загрузка...</div>}
      {error && <div>Ошибка: {error}</div>}
      
      {!isLoading && !error && (
        <>
          <CustomTable 
            columns={[
              { name: "ID", align: "right" },
              { name: "Название компании", align: "left" },
              { name: "Телефон", align: "left" },
              { name: "Лицензия заканчивается", align: "right" }
            ]} 
            data={tableData}
            contextMenuActions={tableActions}
          />
        </>
      )}

      {isCompanyModalOpen && (
        <CompanyModal
            mode={modalMode}
            isOpen={isCompanyModalOpen}
            onClose={() => setIsCompanyModalOpen(false)}
            onSubmit={handleSubmitCompany}
            initialData={selectedCompany || { phone: '', licenceDate: new Date() }}
        />
        )}

        {isPhoneModalOpen && (
        <BaseModal
            title="Изменение телефона"
            onClose={() => setIsPhoneModalOpen(false)}
            onCancel={() => setIsPhoneModalOpen(false)}
            onSave={handleSavePhone}
            isSubmitting={isSaving}
        >
            <CustomInput
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value)}
            />
        </BaseModal>
        )}

        {isDateModalOpen && (
        <BaseModal
            title="Изменение даты лицензии"
            onClose={() => setIsDateModalOpen(false)}
            onCancel={() => setIsDateModalOpen(false)}
            onSave={handleSaveDate}
            isSubmitting={isSaving}
        >
            <DateModalInput
            value={dateValue.toString().split('T')[0]}
            onChange={(e) => {
                const date = new Date(e.target.value);
                if (!isNaN(date.getTime())) {
                setDateValue(date);
                }
            }}
            />
        </BaseModal>
        )}
    </PageLayout>
  );
};

export default AdminPanelPage;