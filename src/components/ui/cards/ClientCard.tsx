import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { FaWhatsapp, FaPhone, FaBirthdayCake, FaIdCard, FaComment, FaEllipsisV, FaExclamationTriangle } from 'react-icons/fa';
import useChat from '../../../api/hooks/useChat';
import { formatPhoneHref } from '../../../utils/phoneUtils';
import CreditBriefModal from '../../modal/CrudInherited/CreditBrief';

const Card = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(209, 213, 219, 1);
  padding: 20px;
  margin: 0;
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const CardContent = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  width: 100%;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 50px; /* Для кнопки сообщения */
`;

const CardTitleText = styled.span<{ $hasBlacklistBadge?: boolean }>`
  display: inline-block;
  cursor: copy;
  border-radius: 4px;
  padding: 2px 4px;
  margin: -2px -4px;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: rgba(0, 125, 136, 0.08);
  }

  &:focus-visible {
    outline: 2px solid rgba(0, 125, 136, 0.5);
    outline-offset: 2px;
  }

  ${props => props.$hasBlacklistBadge && `
    margin-left: 170px; /* Отступ для бейджа */
  `}
`;

const TitleNameGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const CopiedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #0f766e;
  background-color: rgba(0, 125, 136, 0.12);
  border-radius: 999px;
  white-space: nowrap;
  animation: copiedBadgeIn 180ms ease-out;

  @keyframes copiedBadgeIn {
    from { opacity: 0; transform: translateY(-2px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  width: 100%;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 50px;
`;

const InfoLabel = styled.span`
  font-size: 12px;
  color: rgba(107, 114, 128, 1);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const InfoValue = styled.span<{ $highlight?: boolean; $warning?: boolean }>`
  font-size: 14px;
  font-weight: ${props => props.$highlight ? '600' : '400'};
  color: ${props => {
    if (props.$warning) return '#EF4444';
    if (props.$highlight) return '#007D88';
    return '#111827';
  }};
  min-height: 20px;
  display: flex;
  align-items: center;
`;

const ContractsSection = styled.div`
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(229, 231, 235, 1);
`;

const ContractsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 8px;
`;

const ContractCard = styled.div<{ $isClickable?: boolean }>`
  background: rgba(254, 226, 226, 0.3);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  cursor: ${props => props.$isClickable ? 'pointer' : 'default'};
  
  &:hover {
    ${props => props.$isClickable && `
      background: rgba(0, 125, 136, 0.1);
      border-color: #007D88;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    `}
  }
`;

const ContractNumber = styled.span`
  font-weight: 600;
  font-size: 14px;
  color: #111827;
  margin-bottom: 4px;
`;

const ContractTerm = styled.span`
  font-size: 13px;
  color: #EF4444;
  font-weight: 600;
`;

const GuarantorCard = styled.div<{ $isClickable?: boolean }>`
  background: rgba(245, 166, 35, 0.1);
  border: 1px solid rgba(245, 166, 35, 0.35);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  cursor: ${props => props.$isClickable ? 'pointer' : 'default'};

  &:hover {
    ${props => props.$isClickable && `
      background: rgba(245, 166, 35, 0.2);
      border-color: #F5A623;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    `}
  }
`;

const GuarantorName = styled.span`
  font-size: 13px;
  color: #B26A00;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ContractViewBadge = styled.span`
  font-size: 11px;
  color: #007D88;
  background: rgba(0, 125, 136, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: normal;
`;

const IconWrapper = styled.span`
  color: rgba(107, 114, 128, 0.8);
  display: flex;
  align-items: center;
`;

const WhatsAppLink = styled.a`
  color: rgba(75, 85, 99, 1);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;

  &:hover {
    color: #25D366;
  }
`;

const PhoneLink = styled.a`
  color: rgba(75, 85, 99, 1);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    color: #007D88;
  }
`;

const MessageButton = styled.button`
  background: rgba(0, 125, 136, 1);
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  position: absolute;
  top: 20px;
  right: 20px;

  &:hover {
    background: rgba(0, 100, 110, 1);
    transform: scale(1.05);
  }
`;

const ContractsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const MenuButton = styled.button`
  background: transparent;
  color: rgba(107, 114, 128, 0.8);
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  position: absolute;
  top: 15px;
  right: 90px;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const ContextMenu = styled.div<{ $isVisible: boolean }>`
  position: absolute;
  top: 70px;
  right: 90px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  z-index: 100;
  display: ${props => props.$isVisible ? 'block' : 'none'};
  min-width: 150px;
`;

const MenuItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const BlacklistBadge = styled.div`
  position: absolute;
  top: 15px;
  left: 15px;
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  color: #EF4444;
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 12px rgba(239, 68, 68, 0.5);
  z-index: 10;
`;

export interface GuarantorRef {
  id: number;
  fullname: string;
  creditId: number;
}

export interface Client {
  id: number;
  fullName: string;
  phone: string;
  secondPhone?: string | null;
  doc: string;
  birthdate: Date | null;
  docIssueDate: Date | null;
  docIssueYear: number | null;
  registrationAddress: string | null;
  creditIds?: string[] | null;
  creditRestTerms?: string[] | null;
  hasPassportPhoto?: boolean | null;
  blacklist?: boolean;
  guarantors?: GuarantorRef[] | null;
}

interface ClientCardProps {
  client: Client | null;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onRightClick: (e: React.MouseEvent, client: Client) => void;
  onOpenDossier: (client: Client) => void;
  showMenu?: boolean;
}

const ClientCard: React.FC<ClientCardProps> = ({ 
  client, 
  onEdit, 
  onDelete, 
  onRightClick,
  onOpenDossier,
  showMenu = true,
}) => {
  const { createPrivateChat } = useChat();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedContractModal, setSelectedContractModal] = useState<number | null>(null);
  const [isNameCopied, setIsNameCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const copyResetTimer = useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyResetTimer.current) window.clearTimeout(copyResetTimer.current);
    };
  }, []);

  const handleCopyName = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!client?.fullName) return;
    try {
      await navigator.clipboard.writeText(client.fullName);
      setIsNameCopied(true);
      if (copyResetTimer.current) window.clearTimeout(copyResetTimer.current);
      copyResetTimer.current = window.setTimeout(() => setIsNameCopied(false), 1500);
    } catch (err) {
      console.error('Не удалось скопировать ФИО:', err);
    }
  };
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!client) {
    return (
      <Card>
        <CardContent>
          <CardTitle>Клиент не найден</CardTitle>
          <InfoValue>Данные клиента недоступны</InfoValue>
        </CardContent>
      </Card>
    );
  }

  const formatPhone = (phone: string | null | undefined): string => {
    if (!phone) return 'Не указан';
    
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4-$5');
    }
    return phone;
  };

  const handleMessageClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const chat = await createPrivateChat(client.id, 'client');
      
      if (chat?.id) {
        window.open(`/chat/${chat.id}`, '_blank');
      }
    } catch (error) {
      console.error('Ошибка при создании чата:', error);
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Не указана';
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Неверная дата';
      }
      return dateObj.toLocaleDateString('ru-RU');
    } catch {
      return 'Ошибка даты';
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onEdit(client);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDelete(client);
  };

  const handleCardClick = () => {
    onOpenDossier(client);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    onRightClick(e, client);
  };

  // Обработчик клика по бейджу договора
  const handleContractClick = (e: React.MouseEvent, creditId: string) => {
    e.stopPropagation(); // Предотвращаем открытие досье клиента
    const id = parseInt(creditId);
    if (!isNaN(id)) {
      setSelectedContractModal(id);
    }
  };

  const handleCloseModal = () => {
    setSelectedContractModal(null);
  };

  const hasContracts = client.creditIds && client.creditIds.length > 0;
  const safeCreditIds = client.creditIds || [];
  const safeCreditRestTerms = client.creditRestTerms || [];
  const isBlacklisted = client.blacklist === true;
  const guarantors = client.guarantors || [];
  const hasGuarantors = guarantors.length > 0;

  const handleGuarantorClick = (e: React.MouseEvent, creditId: number) => {
    e.stopPropagation();
    if (!isNaN(creditId) && creditId > 0) {
      setSelectedContractModal(creditId);
    }
  };

  return (
    <>
      <Card 
        key={client.id} 
        onClick={handleCardClick}
        onContextMenu={handleRightClick}
        style={isBlacklisted ? { 
          borderColor: '#EF4444',
          background: 'linear-gradient(135deg, #ffffff 0%, #fff5f5 100%)'
        } : {}}
      >
        {isBlacklisted && (
          <BlacklistBadge>
            <FaExclamationTriangle size={14} />
            Чёрный список
          </BlacklistBadge>
        )}
        
        <CardContent>
          <CardTitle>
            <TitleNameGroup>
              <CardTitleText
                $hasBlacklistBadge={isBlacklisted}
                onClick={handleCopyName}
                title="Скопировать ФИО"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCopyName(e as unknown as React.MouseEvent);
                  }
                }}
              >
                {client.fullName || 'Не указано'}
              </CardTitleText>
              {isNameCopied && <CopiedBadge>Скопировано</CopiedBadge>}
            </TitleNameGroup>
          </CardTitle>
          
          {showMenu && (
            <>
              <MenuButton onClick={handleMenuClick}>
                <FaEllipsisV size={16} />
              </MenuButton>

              <ContextMenu $isVisible={isMenuOpen} ref={menuRef}>
                <MenuItem onClick={handleEditClick}>Редактировать</MenuItem>
                <MenuItem onClick={handleDeleteClick}>Удалить</MenuItem>
              </ContextMenu>
            </>
          )}

          {/* <MessageButton onClick={handleMessageClick}>
            <FaComment size={30} />
          </MessageButton> */}
          
          <InfoGrid>
            <InfoItem>
              <InfoLabel>
                <IconWrapper><FaIdCard size={12} /></IconWrapper>
                ID клиента
              </InfoLabel>
              <InfoValue>
                {client.id || 'Не указан'}
              </InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>
                <IconWrapper><FaPhone size={12} /></IconWrapper>
                Телефон
              </InfoLabel>
              <InfoValue>
                {client.phone ? (
                  <PhoneLink 
                    href={formatPhoneHref(client.phone)} 
                    onClick={(e) => e.stopPropagation()}
                    style={isBlacklisted ? { color: '#EF4444', fontWeight: 'bold' } : {}}
                  >
                    {formatPhone(client.phone)}
                  </PhoneLink>
                ) : (
                  'Не указан'
                )}
              </InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>
                <IconWrapper><FaWhatsapp size={13} /></IconWrapper>
                WhatsApp
              </InfoLabel>
              <InfoValue>
                {client.secondPhone ? (
                  <WhatsAppLink 
                    href={`https://wa.me/${client.secondPhone.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={isBlacklisted ? { color: '#EF4444', fontWeight: 'bold' } : {}}
                  >
                    {formatPhone(client.secondPhone)}
                  </WhatsAppLink>
                ) : (
                  'Не указан'
                )}
              </InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>
                <IconWrapper><FaBirthdayCake size={12} /></IconWrapper>
                Дата рождения
              </InfoLabel>
              <InfoValue>{formatDate(client.birthdate)}</InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Адрес регистрации</InfoLabel>
              <InfoValue>{client.registrationAddress || 'Не указан'}</InfoValue>
            </InfoItem>
          </InfoGrid>
          
          {hasContracts && (
            <ContractsSection>
              <ContractsHeader>
                <InfoLabel>Договоры</InfoLabel>
              </ContractsHeader>

              <ContractsGrid>
                {safeCreditIds.map((contractId, index) => {
                  const restTerm = safeCreditRestTerms[index] || '0';
                  const months = parseInt(restTerm) || 0;
                  const isUrgent = months > 0 && months < 3;

                  return (
                    <ContractCard
                      key={index}
                      $isClickable={true}
                      onClick={(e) => handleContractClick(e, contractId)}
                      style={isBlacklisted ? {
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderColor: '#EF4444'
                      } : {}}
                    >
                      <ContractNumber>
                        {contractId || 'Без номера'}
                      </ContractNumber>
                      <ContractTerm>
                        Остаток: {months} мес.
                      </ContractTerm>
                    </ContractCard>
                  );
                })}
              </ContractsGrid>
            </ContractsSection>
          )}

          {hasGuarantors && (
            <ContractsSection>
              <ContractsHeader>
                <InfoLabel>Поручители по договорам</InfoLabel>
              </ContractsHeader>

              <ContractsGrid>
                {guarantors.map((g) => (
                  <GuarantorCard
                    key={`${g.creditId}-${g.id}`}
                    $isClickable={true}
                    onClick={(e) => handleGuarantorClick(e, g.creditId)}
                  >
                    <ContractNumber>
                      №{g.creditId || 'Без номера'}
                    </ContractNumber>
                    {g.fullname && (
                      <GuarantorName title={`ФИО поручителя: ${g.fullname}`}>
                        {g.fullname}
                      </GuarantorName>
                    )}
                  </GuarantorCard>
                ))}
              </ContractsGrid>
            </ContractsSection>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно с расписанием платежей */}
      {selectedContractModal && (
        <CreditBriefModal
          creditId={selectedContractModal}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default ClientCard;