import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FaCheck, FaTimes, FaUserCircle, FaSearch, FaMoneyBillWave, FaCalendarAlt, FaComment, FaFileContract } from 'react-icons/fa';
import { Pagination } from 'react-bootstrap';
import useCreditApplication from '../api/hooks/useCreditApplication';
import type { CreditApplicationResponse, GetCreditApplicationsQuery, SelfCreditApplicationResponse } from '../api/types/creditApplication';
import ClientDossier from '../components/ui/Dossiers/ClientDossier';
import CustomTable from '../components/ui/tables/CustomTable';
import { formatMoney } from '../utils/formatPrice';
import CustomTitle from '../components/ui/Text/CustomTitle';
import useClient from '../api/hooks/useClient';
import { generateAvatar, getInitials } from '../utils/avatarUtils';
import { FILE_BASE_URL } from '../api/client';
import CustomInput from '../components/ui/fields/CustomInput';
import TitleField from '../components/ui/Layouts/TitleLayout';
import useRegion from '../api/hooks/useRegion';
import CustomSelect from '../components/ui/fields/CustomSelect';
import type { PaginatedResponse } from '../api/types/common';
import Tabs from '../components/ui/fields/Tabs';
import useChat from '../api/hooks/useChat';
import { useNavigate } from 'react-router-dom';

const PageContainer = styled.div`
  padding: 24px;
  background: #f8f9fa;
  min-height: 100vh;
  position: relative;
`;

const FilterField = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const InputWrapper = styled.div`
  flex: 1;
  min-width: 200px;
  position: relative;
`;

const ClearFilterButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  z-index: 10;

  &:hover {
    color: #666;
  }
`;

const TooltipWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: #333;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 8px;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 16px;
    border-width: 4px;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
  }
`;

const MainContent = styled.div<{ isDetailOpen?: boolean }>`
  display: grid;
  grid-template-columns: ${props => props.isDetailOpen ? '1fr 400px' : '1fr'};
  gap: 24px;
  transition: grid-template-columns 0.3s ease;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
`;

const DetailPanel = styled.div<{ isOpen: boolean }>`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  display: flex;
  flex-direction: column;
  max-height: ${props => props.isOpen ? 'auto' : '0'};
  opacity: ${props => props.isOpen ? '1' : '0'};
  transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(20px)'};
  transition: all 0.3s ease;
  overflow: hidden;
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
  padding-bottom: 1px;
  border-bottom: 1px solid #e5e7eb;
`;

const DetailTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const DetailSection = styled.div`
  margin: 0 0 24px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
`;

const InfoValue = styled.span<{ highlight?: boolean }>`
  font-size: 14px;
  color: ${props => props.highlight ? '#007D88' : '#111827'};
  font-weight: ${props => props.highlight ? '600' : '400'};
`;

const FinancialCard = styled.div`
  background: linear-gradient(135deg, #007D88 0%, #006670 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const FinancialItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    font-weight: 600;
  }
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'success' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin: 0 auto;

  ${props => {
    switch (props.variant) {
      case 'success':
        return `
          background: #10b981;
          color: white;
          &:hover {
            background: #059669;
          }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover {
            background: #dc2626;
          }
        `;
      default:
        return `
          background: #007D88;
          color: white;
          &:hover {
            background: #006670;
          }
        `;
    }
  }}

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ClientInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(209, 213, 219, 1);
  }
`;

const EmployeeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
`;

const ClientAvatar = styled.div<{ src?: string; color?: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.src ? 'transparent' : (props.color || '#007D88')};
  background-image: ${props => props.src ? `url(${props.src})` : 'none'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 500;
  font-size: 12px;
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
`;

const ClientName = styled.span`
  font-weight: 500;
  color: #374151;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
`;

const StatusBadge = styled.span<{ status: number }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 1: // Pending
        return `
          background: #fef3c7;
          color: #d97706;
        `;
      case 2: // Accepted
        return `
          background: #d1fae5;
          color: #059669;
        `;
      case 3: // Decline
        return `
          background: #fee2e2;
          color: #dc2626;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #6b7280;
        `;
    }
  }}
`;

const CreditApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState<{
    id: number;
    fullName: string;
    phone: string;
    secondPhone?: string;
    doc: string;
    birthdate: Date | null;
    docIssueDate: Date | null;
    docIssueYear: number;
    registrationAddress: string | null;
    hasPassportPhoto?: boolean;
  } | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<CreditApplicationResponse | SelfCreditApplicationResponse | null>(null);

  const [clientName, setClientName] = useState('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minTerm, setMinTerm] = useState<string>('');
  const [maxTerm, setMaxTerm] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [myApplicationsData, setMyApplicationsData] = useState<PaginatedResponse<SelfCreditApplicationResponse> | null>(null);
  const [isLoadingMyApplications, setIsLoadingMyApplications] = useState(false);
  const [showDistrictTooltip, setShowDistrictTooltip] = useState(false);
  const { createPrivateChat } = useChat();
  const itemsPerPage = 10;

  const {
    isLoading,
    error,
    data,
    getCreditApplications,
    getMyCompanyCreditApplications,
    approveCreditApplication
  } = useCreditApplication();

  const {
    getClientById,
    isLoading: isClientLoading
  } = useClient();


  useEffect(() => {
    loadApplications();
  }, [currentPage, clientName, minPrice, maxPrice, minTerm, maxTerm, selectedRegion, selectedDistrict, activeTab]);

  const {
    isLoading: isRegionLoading,
    regionData,
    districtData,
    getRegions,
    getDisctricts
  } = useRegion();

  const handleProcessApplication = (application: CreditApplicationResponse | SelfCreditApplicationResponse) => {
    const applicationData = {
      id: application.id,
      clientId: application.clientId,
      clientName: 'fullname' in application ? application.fullname : application.clientName,
      clientPhone: 'clientPhone' in application ? application.clientPhone : '',
      productName: application.productName,
      productPrice: application.productPrice,
      firstPayment: application.firstPayment,
      termMonths: application.termMonths,
      region: application.region,
      district: application.district,
      percent: application.percent
    };

    navigate('/new-credit', { state: { creditApplication: applicationData } });
  };

  useEffect(() => {
    getRegions();
  }, [getRegions]);

  useEffect(() => {
    if (selectedRegion) {
      getDisctricts(Number(selectedRegion));
    } else {
      setSelectedDistrict('');
    }
  }, [selectedRegion, getDisctricts]);

  const handleMessageClick = async (e: React.MouseEvent, clientId: number) => {
    e.stopPropagation();
    
    try {
      const chat = await createPrivateChat(clientId, 'client');
      
      if (chat?.id) {
        window.open(`/chat/${chat.id}`, '_blank');
      }
    } catch (error) {
      console.error('Ошибка при создании чата:', error);
    }
  };

  const loadApplications = useCallback(async () => {
    if (activeTab === 'all') {
      const params: GetCreditApplicationsQuery = {
        page: currentPage,
        pageSize: itemsPerPage,
      };

      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);
      if (minTerm) params.minTerm = Number(minTerm);
      if (maxTerm) params.maxTerm = Number(maxTerm);
      if (selectedRegion) params.regionId = Number(selectedRegion);
      if (selectedDistrict) params.districtId = Number(selectedDistrict);

      await getCreditApplications(params);
    } else {
      setIsLoadingMyApplications(true);
      try {
        const params = {
          page: currentPage,
          pageSize: itemsPerPage,
        };
        const result = await getMyCompanyCreditApplications(params);
        setMyApplicationsData(result);
      } catch (error) {
        console.error('Error loading my applications:', error);
      } finally {
        setIsLoadingMyApplications(false);
      }
    }
  }, [currentPage, clientName, minPrice, maxPrice, minTerm, maxTerm, fromDate, toDate, selectedRegion, selectedDistrict, activeTab, getCreditApplications, getMyCompanyCreditApplications]);

  const handleApprove = async (id: number) => {
    if (window.confirm('Стоимость одобрения заявки 3 дня лицензии! Вы уверены, что хотите одобрить эту заявку?')) {
      await approveCreditApplication(id);
      await loadApplications();
    }
  };

  const handleClearFilter = (filterType: string) => {
    switch (filterType) {
      case 'clientName':
        setClientName('');
        break;
      case 'minPrice':
        setMinPrice('');
        break;
      case 'maxPrice':
        setMaxPrice('');
        break;
      case 'minTerm':
        setMinTerm('');
        break;
      case 'maxTerm':
        setMaxTerm('');
        break;
      case 'fromDate':
        setFromDate('');
        break;
      case 'toDate':
        setToDate('');
        break;
      case 'region':
        setSelectedRegion('');
        setSelectedDistrict('');
        break;
      case 'district':
        setSelectedDistrict('');
        break;
    }
    setCurrentPage(1);
  };

  const handleTabChange = (tabId: 'all' | 'my') => {
    setActiveTab(tabId);
    setCurrentPage(1);
    setSelectedApplication(null);
  };

  const handleViewClient = async (application: CreditApplicationResponse | SelfCreditApplicationResponse) => {
    try {
      const clientId = 'clientId' in application ? application.clientId : application.clientId;
      const clientData = await getClientById(clientId);
      
      if (clientData) {
        setSelectedClient({
          id: clientData.id,
          fullName: clientData.fullName,
          phone: clientData.phone,
          secondPhone: clientData.secondPhone,
          doc: clientData.doc,
          birthdate: clientData.birthdate ? new Date(clientData.birthdate) : null,
          docIssueDate: clientData.docIssueDate ? new Date(clientData.docIssueDate) : null,
          docIssueYear: clientData.docIssueYear,
          registrationAddress: clientData.registrationAddress,
          hasPassportPhoto: clientData.hasPassportPhoto
        });
      } else {
        const fallbackClientData = {
          id: clientId,
          fullName: 'fullname' in application ? application.fullname : application.clientName,
          phone: 'clientPhone' in application ? application.clientPhone : '',
          doc: '',
          birthdate: null,
          docIssueDate: null,
          docIssueYear: 0,
          registrationAddress: application.region + ', ' + application.district,
          hasPassportPhoto: false
        };
        setSelectedClient(fallbackClientData);
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных клиента:', error);
      const fallbackClientData = {
        id: 'clientId' in application ? application.clientId : application.clientId,
        fullName: 'fullname' in application ? application.fullname : application.clientName,
        phone: 'clientPhone' in application ? application.clientPhone : '',
        doc: '',
        birthdate: null,
        docIssueDate: null,
        docIssueYear: 0,
        registrationAddress: application.region + ', ' + application.district,
        hasPassportPhoto: false
      };
      setSelectedClient(fallbackClientData);
    }
  };

  const handleRowClick = (application: CreditApplicationResponse | SelfCreditApplicationResponse) => {
    if (selectedApplication && selectedApplication.id === application.id) {
      setSelectedApplication(null);
    } else {
      setSelectedApplication(application);
    }
  };

  const handleCloseDetails = () => {
    setSelectedApplication(null);
  };

  const handleBackFromDossier = () => {
    setSelectedClient(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateFinancialDetails = (application: CreditApplicationResponse | SelfCreditApplicationResponse) => {
    const productPrice = application.productPrice || 0;
    const firstPayment = application.firstPayment || 0;
    const loanAmount = productPrice - firstPayment;
    const markup = 'markupAmount' in application ? application.markupAmount || 0 : 0;
    const totalAmount = loanAmount + markup;
    const monthlyPayment = application.monthlyPayment || 0;
    const termMonths = application.termMonths || 0;
    const totalPayment = monthlyPayment * termMonths;

    return {
      loanAmount,
      markup,
      totalAmount,
      monthlyPayment,
      totalPayment,
      overpayment: totalPayment - loanAmount
    };
  };

  const getStatusText = (status: number | string) => {
    const statusValue = typeof status === 'string' ? status : status.toString();
    
    switch (statusValue) {
      case '1':
      case 'Pending':
        return 'Ожидание';
      case '2':
      case 'Accepted':
        return 'Одобрено';
      case '3':
      case 'Declined':
        return 'Отклонено';
      default:
        return 'Неизвестно';
    }
  };

  const formatAllApplicationsTableData = () => {
    if (!data?.items) return [];

    return data.items.map(application => {
      const initials = getInitials(application.fullname);
      const avatarUrl = application.avatarPath ? FILE_BASE_URL + application.avatarPath : generateAvatar(initials, 32);

      return [
        application.id.toString(),
        formatDate(application.createdDate),
        application.productName,
        formatMoney(application.productPrice?.toString() ?? "0"),
        formatMoney(application.firstPayment?.toString() ?? "0"),
        `${application.termMonths} мес.`,
        application.region,
        application.district,
        <ClientInfo onClick={() => handleViewClient(application)}>
          <ClientAvatar src={avatarUrl} />
          <ClientName>{application.fullname}</ClientName>
        </ClientInfo>,
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ActionButton
            variant="primary"
            onClick={() => handleApprove(application.id)}
            disabled={isLoading}
            title="Одобрить заявку"
          >
            <FaCheck />
            Принять
          </ActionButton>
        </div>
      ];
    });
  };

const formatMyApplicationsTableData = () => {
  if (!myApplicationsData?.items || myApplicationsData.items.length === 0) {
    return [];
  }

  return myApplicationsData.items.map(application => {
    const employeeInitials = getInitials(application.employeeName || '');
    const employeeAvatarUrl = application.employeeAvatar ? FILE_BASE_URL + application.employeeAvatar : generateAvatar(employeeInitials, 32);

    const clientInitials = getInitials(application.clientName || '');
    const clientAvatarUrl = generateAvatar(clientInitials, 32);

    return [
      application.id.toString(),
      application.productName || '-',
      formatMoney(application.productPrice?.toString() ?? "0"),
      formatMoney(application.firstPayment?.toString() ?? "0"),
      `${application.termMonths || 0} мес.`,
      application.region || '-',
      application.district || '-',
      <EmployeeInfo>
        <ClientAvatar src={employeeAvatarUrl} />
        <ClientName>{application.employeeName || 'Не указан'}</ClientName>
      </EmployeeInfo>,
      <ClientInfo onClick={() => handleViewClient(application)}>
        <ClientAvatar src={clientAvatarUrl} />
        <ClientName>{application.clientName || 'Неизвестно'}</ClientName>
      </ClientInfo>,
      <ActionButton
          variant="primary"
          onClick={(e) => handleMessageClick(e, application.clientId)}
          title="Написать клиенту"
        >
          <FaComment />
          Написать
      </ActionButton>,
      <ActionButton
            variant="success"
            onClick={() => handleProcessApplication(application)}
            title="Оформить договор"
      >
            <FaFileContract />
            Оформить
      </ActionButton>,
      <ActionButton
            variant="danger"
            onClick={() => handleDeleteApplication(application)}
            title="Удалить"
      >
          <FaFileContract />
            Удалить
      </ActionButton>
    ];
  });
};

    const MyApplicationsPagination = () => {
    if (!myApplicationsData || myApplicationsData.totalCount <= itemsPerPage) {
      return null;
    }

    const totalPages = Math.ceil(myApplicationsData.totalCount / itemsPerPage);
    
  return (
    <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
      <Pagination>
        <Pagination.Prev 
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        />
        {[...Array(totalPages)].map((_, index) => (
          <Pagination.Item
            key={index + 1}
            active={index + 1 === currentPage}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next 
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        />
      </Pagination>
    </div>
    );
  };

  const renderAllApplicationsContent = () => (
    <>
      <FilterField>
        <InputWrapper>
          <CustomInput
            inputType="number"
            placeholder="Мин. стоимость"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              setCurrentPage(1);
            }}
          />
          {minPrice && (
            <ClearFilterButton onClick={() => handleClearFilter('minPrice')}>
              ×
            </ClearFilterButton>
          )}
        </InputWrapper>

        <InputWrapper>
          <CustomInput
            inputType="number"
            placeholder="Макс. стоимость"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              setCurrentPage(1);
            }}
          />
          {maxPrice && (
            <ClearFilterButton onClick={() => handleClearFilter('maxPrice')}>
              ×
            </ClearFilterButton>
          )}
        </InputWrapper>

        <InputWrapper>
          <CustomInput
            inputType="number"
            placeholder="Мин. срок (мес)"
            value={minTerm}
            onChange={(e) => {
              setMinTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          {minTerm && (
            <ClearFilterButton onClick={() => handleClearFilter('minTerm')}>
              ×
            </ClearFilterButton>
          )}
        </InputWrapper>

        <InputWrapper>
          <CustomInput
            inputType="number"
            placeholder="Макс. срок (мес)"
            value={maxTerm}
            onChange={(e) => {
              setMaxTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          {maxTerm && (
            <ClearFilterButton onClick={() => handleClearFilter('maxTerm')}>
              ×
            </ClearFilterButton>
          )}
        </InputWrapper>

        <InputWrapper>
          <CustomSelect
            placeholder="Выберите регион"
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setCurrentPage(1);
            }}
            options={regionData ? regionData.map(region => ({
              value: region.id.toString(),
              label: region.name
            })) : []}
            disabled={isRegionLoading}
          />
        </InputWrapper>

        <InputWrapper>
          <TooltipWrapper
            onMouseEnter={() => !selectedRegion && setShowDistrictTooltip(true)}
            onMouseLeave={() => setShowDistrictTooltip(false)}
          >
            <CustomSelect
              placeholder="Выберите район"
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setCurrentPage(1);
              }}
              options={districtData ? districtData.map(district => ({
                value: district.id.toString(),
                label: district.name
              })) : []}
              disabled={!selectedRegion || isRegionLoading}
            />
            {showDistrictTooltip && !selectedRegion && (
              <Tooltip>
                Сначала выберите регион
              </Tooltip>
            )}
          </TooltipWrapper>
        </InputWrapper>
      </FilterField>

      <MainContent isDetailOpen={!!selectedApplication}>
        <TableContainer>
          {isLoading && (
            <LoadingOverlay>
              <div>Загрузка заявок...</div>
            </LoadingOverlay>
          )}

          {data && data.totalCount > 0 && (
            <CustomTable
              columns={[
                { name: "ID", isSortable: false, isHidden: true },
                { name: "Дата создания", isSortable: true, isHidden: true },
                { name: "Товар", isSortable: false },
                { name: "Стоимость", isSortable: false, align: "right" },
                { name: "Первый взнос", isSortable: false, align: "right" },
                { name: "Срок", isSortable: false, align: "right" },
                { name: "Регион", isSortable: false },
                { name: "Район", isSortable: false },
                { name: "Клиент", isSortable: false },
                { name: "", isSortable: false }
              ]}
              data={formatAllApplicationsTableData()}
              onRowClick={(rowData, rowIndex) => {
                const applicationId = parseInt(rowData[0] as string);
                const application = data.items.find(app => app.id === applicationId);
                if (application) {
                  handleRowClick(application);
                }
              }}
              selectedRow={selectedApplication ? data.items.findIndex(app => app.id === selectedApplication.id) : -1}
            />
          )}
          
          {data && data.totalCount > itemsPerPage && (
            <div style={{ padding: '16px' }}>
              <Pagination />
            </div>
          )}
        </TableContainer>

        {selectedApplication && 'fullname' in selectedApplication && (
          <DetailPanel isOpen={!!selectedApplication}>
            <>
              <DetailHeader>
                <DetailTitle>Детали заявки</DetailTitle>
                <CloseButton onClick={handleCloseDetails} title="Закрыть">
                  <FaTimes />
                </CloseButton>
              </DetailHeader>

              <DetailSection>
                <SectionTitle>
                  <FaUserCircle />
                  Информация о клиенте
                </SectionTitle>
                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>ФИО</InfoLabel>
                    <InfoValue>{selectedApplication.fullname}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Регион</InfoLabel>
                    <InfoValue>{selectedApplication.region}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Район</InfoLabel>
                    <InfoValue>{selectedApplication.district}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Дата заявки</InfoLabel>
                    <InfoValue>{formatDate(selectedApplication.createdDate)}</InfoValue>
                  </InfoItem>
                </InfoGrid>
              </DetailSection>

              <DetailSection>
                <SectionTitle>
                  <FaMoneyBillWave />
                  Финансовые детали
                </SectionTitle>
                <FinancialCard>
                  {(() => {
                    const financials = calculateFinancialDetails(selectedApplication);
                    return (
                      <>
                        <FinancialItem>
                          <span>Стоимость товара:</span>
                          <span>{formatMoney(selectedApplication.productPrice?.toString() ?? "0")}</span>
                        </FinancialItem>
                        <FinancialItem>
                          <span>Первоначальный взнос:</span>
                          <span>{formatMoney(selectedApplication.firstPayment?.toString() ?? "0")}</span>
                        </FinancialItem>
                        <FinancialItem>
                          <span>Сумма кредита:</span>
                          <span>{formatMoney(financials.loanAmount.toString())}</span>
                        </FinancialItem>
                        <FinancialItem>
                          <span>Надбавка:</span>
                          <span>{formatMoney(financials.markup.toString())}</span>
                        </FinancialItem>
                        <FinancialItem>
                          <span>Общая сумма:</span>
                          <span>{formatMoney(financials.totalAmount.toString())}</span>
                        </FinancialItem>
                        <FinancialItem>
                          <span>Доход:</span>
                          <span>{formatMoney(financials.overpayment.toString())}</span>
                        </FinancialItem>
                      </>
                    );
                  })()}
                </FinancialCard>
              </DetailSection>

              <DetailSection>
                <SectionTitle>
                  <FaCalendarAlt />
                  Условия кредита
                </SectionTitle>
                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>Товар</InfoLabel>
                    <InfoValue>{selectedApplication.productName}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Срок</InfoLabel>
                    <InfoValue>{selectedApplication.termMonths} месяцев</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Ежемесячный платеж</InfoLabel>
                    <InfoValue highlight>
                      {formatMoney(selectedApplication.monthlyPayment?.toString() ?? "0")}
                    </InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Общая выплата</InfoLabel>
                    <InfoValue highlight>
                      {formatMoney((selectedApplication.monthlyPayment * selectedApplication.termMonths).toString())}
                    </InfoValue>
                  </InfoItem>
                </InfoGrid>
              </DetailSection>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                <ActionButton
                  variant="primary"
                  onClick={() => handleViewClient(selectedApplication)}
                  disabled={isClientLoading}
                  style={{ flex: 1 }}
                >
                  <FaUserCircle />
                  {isClientLoading ? 'Загрузка...' : 'Карточка клиента'}
                </ActionButton>                
                <ActionButton
                  variant="primary"
                  onClick={() => handleApprove(selectedApplication.id)}
                  disabled={isLoading}
                  style={{ flex: 1 }}
                >
                  <FaCheck />
                  Одобрить заявку
                </ActionButton>
              </div>
            </>
          </DetailPanel>
        )}
      </MainContent>
    </>
  );

  const renderMyApplicationsContent = () => (
    <MainContent>
      <TableContainer>
        {(isLoading || isLoadingMyApplications) && (
          <LoadingOverlay>
            <div>Загрузка заявок...</div>
          </LoadingOverlay>
        )}

        {myApplicationsData && myApplicationsData.items && myApplicationsData.items.length > 0 ? (
          <>
            <CustomTable
              columns={[
                { name: "ID", isSortable: false, isHidden: true },
                { name: "Товар", isSortable: false },
                { name: "Стоимость", isSortable: false, align: "right" },
                { name: "Первый взнос", isSortable: false, align: "right" },
                { name: "Срок", isSortable: false, align: "right" },
                { name: "Регион", isSortable: false },
                { name: "Район", isSortable: false },
                { name: "Принял", isSortable: false },
                { name: "Клиент", isSortable: false },
              ]}
              data={formatMyApplicationsTableData()}
              onRowClick={(rowData, rowIndex) => {
                const applicationId = parseInt(rowData[0] as string);
                const application = myApplicationsData.items.find(app => app.id === applicationId);
                if (application) {
                  handleRowClick(application);
                }
              }}
              selectedRow={selectedApplication ? myApplicationsData.items.findIndex(app => app.id === selectedApplication.id) : -1}
            />
            <MyApplicationsPagination />
          </>
        ) : (
          !isLoadingMyApplications && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              Нет данных о заявках
            </div>
          )
        )}
      </TableContainer>
    </MainContent>
  );

  if (selectedClient) {
    return (
      <ClientDossier
        client={selectedClient}
        installments={[]}
        onBack={handleBackFromDossier}
        onUploadPassport={() => {}}
        onDeletePassport={() => {}}
      />
    );
  }

  const tabs = [
    {
      id: 'all',
      label: 'Все заявки',
      content: renderAllApplicationsContent()
    },
    {
      id: 'my',
      label: 'Свои заявки',
      content: renderMyApplicationsContent()
    }
  ];

  return (
    <PageContainer>
      <TitleField>
        <CustomTitle>Заявки</CustomTitle>
      </TitleField>

      {error && (
        <ErrorMessage>
          Ошибка загрузки заявок: {error}
        </ErrorMessage>
      )}

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
      />
    </PageContainer>
  );
};

export default CreditApplicationPage;