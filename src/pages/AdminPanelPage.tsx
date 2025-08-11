import { useAuth } from '../сontext/AuthContext';
import PageLayout from '../components/ui/Layouts/PageLayout';
import CustomTitle from '../components/ui/Text/CustomTitle';
import TitleField from '../components/ui/Layouts/TitleLayout';
import CustomTable, { type RowStyle } from '../components/ui/tables/CustomTable';
import { useState, useCallback, useEffect } from 'react';
import useCompany from '../api/hooks/useCompany';
import CompanyModal, { type CompanyModalData } from '../components/modal/CrudInherited/CompanyModal';
import DarkCyanButton from '../components/ui/Buttons/DarkCyanButton';
import BaseModal from '../components/modal/BASE/modalCRUBase';
import CustomInput from '../components/ui/fields/CustomInput';
import DateModalInput from '../components/ui/fields/DateModalInput';
import { formatDate } from '../utils/dateFormatter';
import CustomCalendar from '../components/ui/fields/CustomCalendar';
import { Container } from 'react-bootstrap';
import { useEmployee } from '../api/hooks/useEmployee';
import CustomPhoneInput from '../components/ui/fields/PhoneInput';

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
  const [isDirectorModalOpen, setIsDirectorModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [phoneValue, setPhoneValue] = useState('');
  const [dateValue, setDateValue] = useState<string>(formatDate(new Date()));
  const [directorValue, setDirectorValue] = useState('');
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

  const {
    updateDirectorFullname
  } = useEmployee();

  const loadCompanies = useCallback(async () => {
    await getAllCompanies();
  }, [getAllCompanies]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies, getCompany]);

  const handleCreateCompany = () => {
    setModalMode('create');
    setSelectedCompany({
      phone: '',
      licenceDate: new Date(),
      chief: '',
      company: ''
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
    setDateValue(formatDate(currentDate));
    setIsDateModalOpen(true);
  };

  const handleOpenDirectorEdit = (companyId: number, currentDirector: string) => {
    setEditingCompanyId(companyId);
    setDirectorValue(currentDirector);
    setIsDirectorModalOpen(true);
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
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        alert('Неверный формат даты');
        return;
      }
      
      const success = await changeLicenceDate(editingCompanyId, date);
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

  const handleSaveDirector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompanyId) return;

    setIsSaving(true);
    try {
      await updateDirectorFullname(editingCompanyId, directorValue);
      await loadCompanies();
      setIsDirectorModalOpen(false);
    } catch (err) {
      console.error('Ошибка при изменении имени директора:', err);
      alert('Произошла ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  const isLicenseExpiringSoon = (licenceDate: Date | null | undefined): boolean => {
    if (!licenceDate) return false;
    
    const today = new Date();
    const licenseEnd = new Date(licenceDate);
    const timeDiff = licenseEnd.getTime() - today.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    return daysDiff <= 30;
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
          LicenceDate: data.licenceDate,
          AdminName: data.chief,
          CompanyName: data.company
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
          onClick={() => handleOpenDirectorEdit(company.id, company.chief)}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}
        >
          {company.chief}
        </span>,
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
            company.chief,
            company.phone,
            company.licenceDate 
              ? formatDate(company.licenceDate)
              : 'Нет данных'
          ]
        ]
      : [];

  const rowStyles = tableData.reduce((styles, rowData, index) => {
    const company = paginatedCompanies[index];
    
    if (company && isLicenseExpiringSoon(company.licenceDate)) {
      styles[index] = {
        backgroundColor: '#FFEBEE',
        color: 'black',
        fontWeight: 'normal'
      };
    }
    
    return styles;
  }, {} as Record<number, RowStyle>);

  const tableActions = hasRole('суперадмин') 
    ? [
        {
          label: 'Изм. директора',
          action: (rowData: any[]) => handleOpenDirectorEdit(Number(rowData[0]), rowData[2]),
          color: '#3B82F6'
        },
        {
          label: 'Изм. телефон',
          action: (rowData: any[]) => handleOpenPhoneEdit(Number(rowData[0]), rowData[3]),
          color: '#3B82F6'
        },
        {
          label: 'Изм. дату',
          action: (rowData: any[]) => handleOpenDateEdit(Number(rowData[0]), rowData[4] ? new Date(rowData[4]) : new Date()),
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
              { name: "Директор", align: "left" },
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
              { name: "Директор", align: "left" },
              { name: "Телефон", align: "left" },
              { name: "Лицензия заканчивается", align: "right" }
            ]} 
            data={tableData}
            rowStyles={rowStyles}
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
            initialData={selectedCompany || { phone: '', licenceDate: new Date(), chief: '', company: '' }}
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
            <CustomPhoneInput
                value={phoneValue}
                onChange={(e) => setPhoneValue(e)}
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
          <Container style={{margin: "30px 25px"}}>
            <CustomCalendar
              value={dateValue}
              onChange={(dateString) => {
                setDateValue(dateString);
              }}
            />
          </Container>
        </BaseModal>
      )}

      {isDirectorModalOpen && (
        <BaseModal
          title="Изменение имени директора"
          onClose={() => setIsDirectorModalOpen(false)}
          onCancel={() => setIsDirectorModalOpen(false)}
          onSave={handleSaveDirector}
          isSubmitting={isSaving}
        >
          <CustomInput
            value={directorValue}
            onChange={(e) => setDirectorValue(e.target.value)}
          />
        </BaseModal>
      )}
    </PageLayout>
  );
};

export default AdminPanelPage;