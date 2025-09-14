import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { FaWhatsapp, FaPhone, FaBirthdayCake, FaIdCard, FaComment, FaEllipsisV } from 'react-icons/fa';
import useChat from '../../../api/hooks/useChat';

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

const ContractCard = styled.div`
  background: rgba(254, 226, 226, 0.3);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
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

export interface Client {
  id: number;
  fullName: string;
  phone: string;
  secondPhone?: string;
  doc: string;
  birthdate: Date | null;
  docIssueDate: Date | null;
  docIssueYear: number;
  registrationAddress: string | null;
  creditIds?: string[];
  creditRestTerms?: string[];
  hasPassportPhoto?: boolean;
}

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onRightClick: (e: React.MouseEvent, client: Client) => void;
  onOpenDossier: (client: Client) => void;
  showMenu?: boolean; 
}

const ClientCard : React.FC<ClientCardProps> = ({ 
  client, 
  onEdit, 
  onDelete, 
  onRightClick,
  onOpenDossier,
  showMenu = true
}) => {
  const { createPrivateChat } = useChat();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
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

  const formatPhone = (phone: string) => {
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
      
      window.open(`/chat/${chat.id}`, '_blank');
    } catch (error) {
      console.error('Ошибка при создании чата:', error);
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Не указана';
    return new Date(date).toLocaleDateString('ru-RU');
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


  const hasContracts = client.creditIds && client.creditIds.length > 0;

  return (
    <Card 
      key={client.id} 
      onClick={() => onOpenDossier(client)}
      onContextMenu={(e) => onRightClick(e, client)}
    >
      <CardContent>
        <CardTitle>
          {client.fullName}
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

        <ContextMenu $isVisible={isMenuOpen} ref={menuRef}>
          <MenuItem onClick={handleEditClick}>Редактировать</MenuItem>
          <MenuItem onClick={handleDeleteClick}>Удалить</MenuItem>
        </ContextMenu>

        <MessageButton onClick={handleMessageClick}>
          <FaComment size={30} />
        </MessageButton>
        
        <InfoGrid>
          <InfoItem>
            <InfoLabel>
              <IconWrapper><FaIdCard size={12} /></IconWrapper>
              ID клиента
            </InfoLabel>
            <InfoValue>{client.id}</InfoValue>
          </InfoItem>
          
          <InfoItem>
            <InfoLabel>
              <IconWrapper><FaPhone size={12} /></IconWrapper>
              Телефон
            </InfoLabel>
            <InfoValue>
              <PhoneLink href={`tel:${client.phone}`} onClick={(e) => e.stopPropagation()}>
                {formatPhone(client.phone)}
              </PhoneLink>
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
              {client.creditIds?.map((contractId, index) => {
                const restTerm = client.creditRestTerms?.[index] || '0';
                const months = parseInt(restTerm) || 0;
                const isUrgent = months > 0 && months < 3;
                
                return (
                  <ContractCard key={index}>
                    <ContractNumber>{contractId}</ContractNumber>
                    <ContractTerm>
                      Остаток: {months} мес.
                    </ContractTerm>
                  </ContractCard>
                );
              })}
            </ContractsGrid>
          </ContractsSection>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientCard;