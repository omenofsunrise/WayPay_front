import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FaEye, FaCheck, FaTimes, FaUserCircle, FaSearch, FaChevronRight, FaPercent, FaMoneyBillWave, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { Pagination } from 'react-bootstrap';
import useCreditApplication from '../api/hooks/useCreditApplication';
import type { CreditApplicationResponse } from '../api/types/creditApplication';
import ClientDossier from '../components/ui/Dossiers/ClientDossier';
import CustomTable from '../components/ui/tables/CustomTable';
import { formatMoney } from '../utils/formatPrice';
import CustomTitle from '../components/ui/Text/CustomTitle';
import useClient from '../api/hooks/useClient';
import { generateAvatar } from '../utils/avatarUtils';

const PageContainer = styled.div`
  padding: 24px;
  background: #f8f9fa;
  min-height: 100vh;
  position: relative;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const SearchContainer = styled.div`
  position: relative;
  width: 300px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #007D88;
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
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

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;

  ${props => {
    switch (props.status) {
      case 'approved':
        return `
          background: #d1fae5;
          color: #065f46;
        `;
      case 'rejected':
        return `
          background: #fee2e2;
          color: #991b1b;
        `;
      default:
        return `
          background: #fef3c7;
          color: #92400e;
        `;
    }
  }}
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

const CreditApplicationPage: React.FC = () => {
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
  const [selectedApplication, setSelectedApplication] = useState<CreditApplicationResponse | null>(null);

  const itemsPerPage = 10;

  const {
    isLoading,
    error,
    data,
    getCreditApplications,
    approveCreditApplication
  } = useCreditApplication();

  const {
    getClientById,
    isLoading: isClientLoading
  } = useClient();

  useEffect(() => {
    loadApplications();
  }, [currentPage]);

  const loadApplications = useCallback(async () => {
    await getCreditApplications({
      page: currentPage,
      pageSize: itemsPerPage,
    });
  }, [currentPage, getCreditApplications]);

  const handleApprove = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите одобрить эту заявку?')) {
      await approveCreditApplication(id);
      await loadApplications();
    }
  };

  // Обновляем функцию для загрузки полных данных клиента
  const handleViewClient = async (application: CreditApplicationResponse) => {
    try {
      // Загружаем полные данные клиента по ID
      const clientData = await getClientById(application.clientId);
      
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
        // Если не удалось загрузить данные, используем данные из заявки
        const fallbackClientData = {
          id: application.clientId,
          fullName: application.fullname,
          phone: application.phone || '',
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
      // В случае ошибки также используем данные из заявки
      const fallbackClientData = {
        id: application.clientId,
        fullName: application.fullname,
        phone: application.phone || '',
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

  const handleRowClick = (application: CreditApplicationResponse) => {
    setSelectedApplication(application);
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

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 45%)`;
  };

  const calculateFinancialDetails = (application: CreditApplicationResponse) => {
    const productPrice = application.productPrice || 0;
    const firstPayment = application.firstPayment || 0;
    const loanAmount = productPrice - firstPayment;
    const markup = application.markupAmount || 0;
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

  const formatTableData = () => {
    if (!data?.items) return [];

    return data.items.map(application => {
      const initials = getInitials(application.fullname);
      const avatarUrl = application.avatarPath ?? generateAvatar(initials, 32);

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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ActionButton
            variant="success"
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

  return (
    <PageContainer>
      <Header>
        <Title>Заявки</Title>
      </Header>

      {error && (
        <ErrorMessage>
          Ошибка загрузки заявок: {error}
        </ErrorMessage>
      )}

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
              data={formatTableData()}
              onRowClick={(rowData) => {
                const applicationId = parseInt(rowData[0] as string);
                const application = data.items.find(app => app.id === applicationId);
                if (application) {
                  handleRowClick(application);
                }
              }}
            />
          )}
          
          {data && data.totalCount > itemsPerPage && (
            <div style={{ padding: '16px' }}>
              <Pagination />
            </div>
          )}
        </TableContainer>

        <DetailPanel isOpen={!!selectedApplication}>
          {selectedApplication && (
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
                  variant="success"
                  onClick={() => handleApprove(selectedApplication.id)}
                  disabled={isLoading}
                  style={{ flex: 1 }}
                >
                  <FaCheck />
                  Одобрить заявку
                </ActionButton>
              </div>
            </>
          )}
        </DetailPanel>
      </MainContent>
    </PageContainer>
  );
};

export default CreditApplicationPage;