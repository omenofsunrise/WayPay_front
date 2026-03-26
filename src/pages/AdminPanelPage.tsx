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
import { formatDate } from '../utils/dateFormatter';
import { formatPhoneHref } from '../utils/phoneUtils';
import PhoneLink from '../components/ui/links/PhoneLink';
import CustomCalendar from '../components/ui/fields/CustomCalendar';
import { Container } from 'react-bootstrap';
import CustomPhoneInput from '../components/ui/fields/PhoneInput';
import Pagination from '../components/ui/fields/CustomPagination';
import PaginationLayout from '../components/ui/Layouts/PaginationLayout';
import CountInfoTitle from '../components/ui/Text/CountInfoTitle';
import useAdminPanel from '../api/hooks/useAdminPanel';
import { NotificationType, type SendNotificationRequest } from '../api/types/notification';
import styled from 'styled-components';
import { useEmployee } from '../api/hooks/useEmployee';

interface Tab {
  id: string;
  label: string;
  content?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  addButton?: React.ReactNode;
}

const LocalTabs = ({ tabs, activeTab, onChange, addButton }: TabsProps) => {
  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <>
      <TabsContainer>
        <TabsList>
          {tabs.map((tab) => (
            <TabItem 
              key={tab.id}
              $isActive={activeTab === tab.id}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
              {activeTab === tab.id && <ActiveTabIndicator />}
            </TabItem>
          ))}
          {addButton && <AddButtonContainer>{addButton}</AddButtonContainer>}
        </TabsList>
      </TabsContainer>
      
      {activeTabContent && (
        <TabContentContainer>
          {activeTabContent}
        </TabContentContainer>
      )}
    </>
  );
};

const TabsContainer = styled.div`
  width: 100%;
  border-bottom: 1px solid rgba(209, 213, 219, 1);
  margin-bottom: 20px;
`;

const TabsList = styled.ul`
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 24px;
  align-items: center;
`;

const TabItem = styled.li<{ $isActive: boolean }>`
  position: relative;
  padding: 12px 0;
  cursor: pointer;
  font-size: 14px;
  font-weight: ${props => props.$isActive ? '600' : '400'};
  color: ${props => props.$isActive ? 'rgba(0, 125, 136, 1)' : 'rgba(107, 114, 128, 1)'};
  transition: all 0.2s ease;

  &:hover {
    color: rgba(0, 125, 136, 0.8);
  }
`;

const ActiveTabIndicator = styled.div`
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: rgba(0, 125, 136, 1);
  border-radius: 2px 2px 0 0;
`;

const AddButtonContainer = styled.li`
  margin-left: auto; 
  padding: 4px 0; 
`;

const TabContentContainer = styled.div`
  margin-top: 20px;
`;

// Модальное окно для выплаты партнеру
interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  partnerName: string;
  isSubmitting: boolean;
}

const PayoutModal = ({ isOpen, onClose, onConfirm, partnerName, isSubmitting }: PayoutModalProps) => {
  const [amount, setAmount] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Сумма должна быть больше 0');
      return;
    }
    onConfirm(amount);
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title={`Выплата партнеру: ${partnerName}`}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div style={{ padding: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'black' }}>
          Сумма выплаты (₽):
        </label>
        <CustomInput
          type="number"
          value={amount.toString()}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Введите сумму"
          min={0}
          step={100}
        />
      </div>
    </BaseModal>
  );
};

const AdminPanelPage = () => {
  const { hasRole } = useAuth();
  const [nameFilter, setNameFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Состояния для табов
  const [activeTab, setActiveTab] = useState<'companies' | 'partners' | 'notifications'>('companies');
  
  // Состояния для компаний
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedCompany, setSelectedCompany] = useState<CompanyModalData | null>(null);
  
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isDirectorModalOpen, setIsDirectorModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [selectedPartnerName, setSelectedPartnerName] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [dateValue, setDateValue] = useState<string>(formatDate(new Date()));
  const [directorValue, setDirectorValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Состояния для рассылки
  const [notificationType, setNotificationType] = useState<NotificationType>(NotificationType.AllUsers);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [targetId, setTargetId] = useState<string>('');
  const [isSendingNotification, setIsSendingNotification] = useState(false);

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
    changePhone,
    payoutPartner
  } = useCompany();

  const {
    updateDirectorFullname,
    setSelfCompany
  } = useEmployee();

  const {
    sendNotification,
    isLoading: isNotificationLoading,
    error: notificationError
  } = useAdminPanel();

  const loadCompanies = useCallback(async (isPartner: boolean = false) => {
    await getAllCompanies(isPartner);
  }, [getAllCompanies]);

  useEffect(() => {
    if (activeTab === 'companies') {
      loadCompanies(false);
    } else if (activeTab === 'partners') {
      loadCompanies(true);
    }
  }, [loadCompanies, activeTab]);

  // Обработчики для компаний
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

  const handleCreatePartner = () => {
    setModalMode('create');
    setSelectedCompany({
      phone: '',
      licenceDate: new Date('2099-12-31'), // Max date for partners
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

  const handleOpenPayoutModal = (companyId: number, partnerName: string) => {
    setEditingCompanyId(companyId);
    setSelectedPartnerName(partnerName);
    setIsPayoutModalOpen(true);
  };

  const handleEnterCopany = (companyId: number) => {
    setSelfCompany(companyId);
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompanyId) return;

    setIsSaving(true);
    try {
      const success = await changePhone(editingCompanyId, phoneValue);
      if (success) {
        await loadCompanies(activeTab === 'partners');
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
        await loadCompanies(activeTab === 'partners');
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
      await loadCompanies(activeTab === 'partners');
      setIsDirectorModalOpen(false);
    } catch (err) {
      console.error('Ошибка при изменении имени директора:', err);
      alert('Произошла ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePayout = async (amount: number) => {
    if (!editingCompanyId) return;

    setIsSaving(true);
    try {
      await payoutPartner(editingCompanyId, amount);
      alert(`Выплата ${amount} ₽ успешно выполнена!`);
      await loadCompanies(true); // Reload partners list
      setIsPayoutModalOpen(false);
    } catch (err) {
      console.error('Ошибка при выплате:', err);
      alert('Произошла ошибка при выплате');
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

  const isLicenseExpired = (licenceDate: Date | null | undefined): boolean => {
    if (!licenceDate) return false;
    
    const today = new Date();
    const licenseEnd = new Date(licenceDate);
    const timeDiff = licenseEnd.getTime() - today.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    return daysDiff <= 0;
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
        loadCompanies(activeTab === 'partners');
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
          CompanyName: data.company,
          IsPartner: activeTab === 'partners'
        });
      }
      loadCompanies(activeTab === 'partners');
      setIsCompanyModalOpen(false);
    } catch (err) {
      console.error('Ошибка при сохранении компании:', err);
    }
  };

  // Обработчики для рассылки
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      alert('Заполните заголовок и сообщение');
      return;
    }

    setIsSendingNotification(true);
    try {
      const notificationData: SendNotificationRequest = {
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        employeeId: notificationType === NotificationType.Single && targetId ? parseInt(targetId) : null,
        clientId: null,
        deviceToken: null,
        avatarPath: null
      };

      await sendNotification(notificationData);
      alert('Рассылка отправлена успешно!');
      
      // Очистка формы после успешной отправки
      setNotificationTitle('');
      setNotificationMessage('');
      setTargetId('');
    } catch (err) {
      console.error('Ошибка при отправке рассылки:', err);
      alert('Произошла ошибка при отправке рассылки');
    } finally {
      setIsSendingNotification(false);
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

  const getTableColumns = () => {
    if (activeTab === 'partners') {
      return [
        { name: "ID", align: "right" },
        { name: "Название партнера", align: "left" },
        { name: "Директор", align: "left" },
        { name: "Телефон", align: "left" },
        { name: "Баланс (₽)", align: "right" },
        { name: "Последний заход в сеть", align: "right" },
      ];
    }
    return [
      { name: "ID", align: "right" },
      { name: "Название компании", align: "left" },
      { name: "Директор", align: "left" },
      { name: "Телефон", align: "left" },
      { name: "Лицензия заканчивается", align: "right" },
      { name: "Договоров за последние 10 дней", align: "right" },
      { name: "Договоров всего", align: "right" },
      { name: "Последний заход в сеть", align: "right" },
    ];
  };

  const tableData = hasRole('суперадмин') 
    ? paginatedCompanies.map(company => {
        if (activeTab === 'partners') {
          return [
            company.id.toString(),
            company.name,
            <span 
              onClick={() => handleOpenDirectorEdit(company.id, company.chief)}
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
            >
              {company.chief}
            </span>,
            <PhoneLink 
              href={formatPhoneHref(company.phone)}
              onClick={() => handleOpenPhoneEdit(company.id, company.phone)}
            >
              {company.phone}
            </PhoneLink>,
            (company.balance?.toLocaleString() || '0') + '₽',
            new Date(company.lastActive).toLocaleString('ru-RU', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          ];
        }
        return [
          company.id.toString(),
          company.name,
          <span 
            onClick={() => handleOpenDirectorEdit(company.id, company.chief)}
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            {company.chief}
          </span>,
          <PhoneLink 
            href={formatPhoneHref(company.phone)}
            onClick={() => handleOpenPhoneEdit(company.id, company.phone)}
          >
            {company.phone}
          </PhoneLink>,
          <span 
            onClick={() => handleOpenDateEdit(company.id, company.licenceDate || new Date())}
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            {company.licenceDate ? formatDate(company.licenceDate) : 'Нет данных'}
          </span>,
          company.createdCreditsCount,
          company.totalCredits,
          new Date(company.lastActive).toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        ];
      })
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
    
    if (activeTab !== 'partners' && company && isLicenseExpiringSoon(company.licenceDate)) {
      styles[index] = {
        backgroundColor: '#FFEBEE',
        color: 'black',
        fontWeight: 'normal'
      };
    }

    if (activeTab !== 'partners' && company && isLicenseExpired(company.licenceDate)) {
      styles[index] = {
        backgroundColor: 'rgba(145, 104, 104, 1)',
        fontWeight: 'normal',
      };
    }
    
    return styles;
  }, {} as Record<number, RowStyle>);

  const tableActions = hasRole('суперадмин') 
    ? activeTab === 'partners'
      ? [
          {
            label: 'Зайти в компанию',
            action: (rowData: any[]) => handleEnterCopany(Number(rowData[0])),
            color: '#EF4444'
          },
          {
            label: 'Выплатить',
            action: (rowData: any[]) => handleOpenPayoutModal(Number(rowData[0]), rowData[1]),
            color: '#10B981'
          },
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
            label: 'Удалить',
            action: handleDeleteCompany,
            color: '#EF4444'
          }
        ]
      : [
          {
            label: 'Зайти в компанию',
            action: (rowData: any[]) => handleEnterCopany(Number(rowData[0])),
            color: '#EF4444'
          },
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

  const companiesContent = (
    <>
      {!isLoading && !error && (
        <>
          <CustomTable 
            columns={getTableColumns()} 
            data={tableData}
            rowStyles={rowStyles}
            contextMenuActions={tableActions}
          />
          
          <PaginationLayout>
            <CountInfoTitle 
              total={filteredCompanies.length} 
            />
            
            <Pagination
              total={filteredCompanies.length}
              current={currentPage}
              onChange={setCurrentPage}
              itemsPerPage={pageSize}
            />
          </PaginationLayout>
        </>
      )}
    </>
  );

  // Контент для таба рассылки
  const notificationsContent = (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <form onSubmit={handleSendNotification}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'black', textAlign: 'left' }}>
            Тип рассылки:
          </label>
          <select 
            value={notificationType}
            onChange={(e) => setNotificationType(parseInt(e.target.value) as NotificationType)}
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ccc', 
              backgroundColor: 'white',
              color: 'black',
              borderRadius: '4px' 
            }}
          >
            <option value={NotificationType.AllUsers}>Всем пользователям</option>
            <option value={NotificationType.Clients}>Клиентам</option>
            <option value={NotificationType.Employees}>Сотрудникам</option>
          </select>
        </div>

        <div style={{ margin: '0px', padding: '0' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'black', textAlign: 'left' }}>
            Заголовок уведомления:
          </label>
          <CustomInput
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            placeholder="Введите заголовок"
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'black', textAlign: 'left' }}>
            Сообщение:
          </label>
          <textarea
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            placeholder="Введите текст сообщения"
            style={{ 
              width: '100%', 
              minHeight: '120px', 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              resize: 'vertical',
              color: 'black',
              backgroundColor: 'white'
            }}
            required
          />
        </div>

        <DarkCyanButton 
          type="submit"
          disabled={isSendingNotification}
          style={{ width: '200px' }}
        >
          {isSendingNotification ? 'Отправка...' : 'Отправить рассылку'}
        </DarkCyanButton>

        {notificationError && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            Ошибка: {notificationError}
          </div>
        )}
      </form>
    </div>
  );

  // Табы для страницы
  const tabs = [
    {
      id: 'companies',
      label: 'Компании',
      content: companiesContent
    },
    {
      id: 'partners',
      label: 'Партнёры',
      content: companiesContent
    },
    {
      id: 'notifications',
      label: 'Рассылка',
      content: notificationsContent
    }
  ];

  // Кнопка добавления (разная для компаний и партнеров)
  const addButton = activeTab === 'companies' && hasRole('суперадмин') ? (
    <DarkCyanButton 
      style={{ width: "15vw", maxHeight: "50px" }}
      onClick={handleCreateCompany}
    >
      + Новая компания
    </DarkCyanButton>
  ) : activeTab === 'partners' && hasRole('суперадмин') ? (
    <DarkCyanButton 
      style={{ width: "15vw", maxHeight: "50px" }}
      onClick={handleCreatePartner}
    >
      + Новый партнер
    </DarkCyanButton>
  ) : null;

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
              { name: "Лицензия заканчивается", align: "center" },
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
      </TitleField>
      
      <LocalTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => {
          setActiveTab(tabId as 'companies' | 'partners' | 'notifications');
          setCurrentPage(1); // Reset pagination when switching tabs
          setNameFilter(''); // Reset filter when switching tabs
        }}
        addButton={addButton}
      />
                
      {isLoading && (activeTab === 'companies' || activeTab === 'partners') && <div>Загрузка...</div>}
      {error && (activeTab === 'companies' || activeTab === 'partners') && <div>Ошибка: {error}</div>}

      {/* Модальные окна для компаний */}
      {isCompanyModalOpen && (
        <CompanyModal
            mode={modalMode}
            isOpen={isCompanyModalOpen}
            onClose={() => setIsCompanyModalOpen(false)}
            onSubmit={handleSubmitCompany}
            initialData={selectedCompany || { phone: '', licenceDate: activeTab === 'partners' ? new Date('2099-12-31') : new Date(), chief: '', company: '' }}
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

      <PayoutModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        onConfirm={handlePayout}
        partnerName={selectedPartnerName}
        isSubmitting={isSaving}
      />
    </PageLayout>
  );
};

export default AdminPanelPage;