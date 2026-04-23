import { useEffect, useState } from "react";
import type { CreditApplicationUsersResponse } from "../api/types/applicationUser";
import useAdminPanel from "../api/hooks/useAdminPanel";
import { formatPhoneHref } from "../utils/phoneUtils";
import PhoneLink from "./ui/links/PhoneLink";
import DarkCyanButton from "./ui/Buttons/DarkCyanButton";
import CustomTable from "./ui/tables/CustomTable";
import BaseModal from "./modal/BASE/modalCRUBase";
import CustomInput from "./ui/fields/CustomInput";
import CustomPhoneInput from "./ui/fields/PhoneInput";

const CreditApplicationCompaniesManager = () => {
  const {
    creditApplicationCompanies,
    isLoading,
    error,
    fetchCreditApplicationCompanies,
    createCreditApplicationCompany,
    updateCreditApplicationCompany,
    deleteCreditApplicationCompany
  } = useAdminPanel();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CreditApplicationUsersResponse | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCreditApplicationCompanies();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !companyPhone.trim()) {
      alert('Заполните все поля');
      return;
    }

    setIsSaving(true);
    try {
      const success = await createCreditApplicationCompany(companyName, companyPhone);
      if (success) {
        setIsCreateModalOpen(false);
        setCompanyName('');
        setCompanyPhone('');
        alert('Заявкополучатель успешно добавлен');
      } else {
        alert('Ошибка при добавлении');
      }
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Произошла ошибка');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    setIsSaving(true);
    try {
      const success = await updateCreditApplicationCompany(
        selectedCompany.id,
        companyName || undefined,
        companyPhone || undefined
      );
      if (success) {
        setIsEditModalOpen(false);
        setSelectedCompany(null);
        setCompanyName('');
        setCompanyPhone('');
        alert('Заявкополучатель успешно обновлен');
      } else {
        alert('Ошибка при обновлении');
      }
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Произошла ошибка');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить "${name}"?`)) {
      return;
    }

    const success = await deleteCreditApplicationCompany(id);
    if (success) {
      alert('Заявкополучатель успешно удален');
    } else {
      alert('Ошибка при удалении');
    }
  };

  const openEditModal = (company: CreditApplicationUsersResponse) => {
    setSelectedCompany(company);
    setCompanyName(company.name);
    setCompanyPhone(company.phone);
    setIsEditModalOpen(true);
  };

  const columns = [
    { name: "Название", align: "left" },
    { name: "Телефон", align: "left" }
  ];

  const tableData = creditApplicationCompanies.map(company => [
    company.name,
    <PhoneLink href={formatPhoneHref(company.phone)}>
      {company.phone}
    </PhoneLink>
  ]);

  const rowActions = [
    {
      label: 'Редактировать',
      action: (rowData: any[]) => {
        const company = creditApplicationCompanies.find(c => c.id === rowData[0]);
        if (company) openEditModal(company);
      },
      color: '#3B82F6'
    },
    {
      label: 'Удалить',
      action: (rowData: any[]) => handleDelete(rowData[0], rowData[1]),
      color: '#EF4444'
    }
  ];

  if (isLoading && creditApplicationCompanies.length === 0) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Ошибка: {error}</div>;
  }

  return (
    <>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <DarkCyanButton 
          style={{ width: "200px" }}
          onClick={() => setIsCreateModalOpen(true)}
        >
          + Добавить заявкополучателя
        </DarkCyanButton>
      </div>

      <CustomTable 
        columns={columns} 
        data={tableData}
        contextMenuActions={rowActions}
      />

      {/* Модальное окно создания */}
      {isCreateModalOpen && (
        <BaseModal
          title="Добавление заявкополучателя"
          onClose={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
          onSave={handleCreate}
          isSubmitting={isSaving}
        >
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'black' }}>
                Название:
              </label>
              <CustomInput
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Введите название"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'black' }}>
                Телефон:
              </label>
              <CustomPhoneInput
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e)}
                placeholder="Введите телефон"
              />
            </div>
          </div>
        </BaseModal>
      )}

      {isEditModalOpen && selectedCompany && (
        <BaseModal
          title={`Редактирование: ${selectedCompany.name}`}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCompany(null);
            setCompanyName('');
            setCompanyPhone('');
          }}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedCompany(null);
            setCompanyName('');
            setCompanyPhone('');
          }}
          onSave={handleUpdate}
          isSubmitting={isSaving}
        >
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'black' }}>
                Название:
              </label>
              <CustomInput
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Введите название"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'black' }}>
                Телефон:
              </label>
              <CustomPhoneInput
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e)}
                placeholder="Введите телефон"
              />
            </div>
          </div>
        </BaseModal>
      )}
    </>
  );
};

export default CreditApplicationCompaniesManager;