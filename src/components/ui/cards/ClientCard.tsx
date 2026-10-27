import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import {
  AlertTriangle, CalendarDays, ChevronRight, FileText, House, IdCard,
  Link2, MapPin, MessageCircle, MoreVertical, Phone,
} from 'lucide-react';
import { formatPhoneHref } from '../../../utils/phoneUtils';
import CreditBriefModal from '../../modal/CrudInherited/CreditBrief';
import FloatingContextMenu, {
  DANGER_COLOR, PRIMARY_COLOR, SUCCESS_COLOR,
} from '../../modal/FloatingContextMenu';

const Card = styled.article<{ $isBlacklisted?: boolean }>`
  position: relative;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  margin: 0 0 14px;
  padding: 18px 22px 20px;
  color: #111827;
  background: #fff;
  border: 1px solid #e5eaf0;
  border-radius: 12px;
  box-shadow: 0 5px 18px rgba(25, 46, 74, 0.06);
  cursor: pointer;
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: ${({ $isBlacklisted }) => ($isBlacklisted ? '#ff5b61' : 'transparent')};
  }

  &:hover {
    border-color: #d7e0e9;
    box-shadow: 0 9px 25px rgba(25, 46, 74, 0.1);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid rgba(0, 125, 136, 0.5);
    outline-offset: 2px;
  }

  @media (max-width: 720px) { padding: 16px; }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  min-width: 0;
  padding-right: 42px;
`;

const Avatar = styled.div`
  display: grid;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  place-items: center;
  margin-right: 16px;
  color: #087c86;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: #e5f5f7;
  border-radius: 50%;

  @media (max-width: 520px) {
    flex-basis: 40px;
    width: 40px;
    height: 40px;
    margin-right: 12px;
    font-size: 15px;
  }
`;

const NameRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  min-width: 0;
  gap: 8px 12px;
`;

const NameButton = styled.button`
  min-width: 0;
  padding: 0;
  overflow: hidden;
  color: #0d1525;
  font: inherit;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: transparent;
  border: 0;
  border-radius: 5px;
  cursor: copy;

  &:hover { color: #007d88; }
  &:focus-visible { outline: 2px solid rgba(0, 125, 136, 0.45); outline-offset: 3px; }
  @media (max-width: 720px) { max-width: 100%; font-size: 17px; }
`;

const BlacklistBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  color: #e5484d;
  font-size: 12px;
  font-weight: 650;
  line-height: 1;
  white-space: nowrap;
  background: #ffeaeb;
  border-radius: 7px;
`;

const CopiedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 5px 9px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background: #e7f7f4;
  border-radius: 999px;
`;

const MenuButton = styled.button`
  position: absolute;
  top: 18px;
  right: 16px;
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0;
  place-items: center;
  color: #526071;
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;

  &:hover, &:focus-visible { color: #182235; background: #f1f5f7; outline: none; }
  @media (max-width: 520px) { top: 15px; right: 12px; }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  width: calc(100% - 64px);
  margin-top: 16px;

  @media (max-width: 1050px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
    row-gap: 16px;
  }
  @media (max-width: 760px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 480px) { grid-template-columns: 1fr; row-gap: 16px; }
`;

const InfoItem = styled.div`
  display: grid;
  grid-template-columns: 21px minmax(0, 1fr);
  grid-template-rows: auto auto;
  min-width: 0;
  padding: 0 15px;
  text-align: left;
  border-left: 1px solid #e3e9ef;

  &:first-child { padding-left: 0; border-left: 0; }
  @media (max-width: 1050px) { &:nth-child(4) { padding-left: 0; border-left: 0; } }
  @media (max-width: 760px) {
    &:nth-child(odd) { padding-left: 0; border-left: 0; }
    &:nth-child(4) { padding-left: 15px; border-left: 1px solid #e3e9ef; }
  }
  @media (max-width: 480px) {
    padding: 0;
    border-left: 0;
    &:nth-child(4) { padding-left: 0; border-left: 0; }
  }
`;

const InfoIcon = styled.span`
  grid-row: 1 / 3;
  align-self: start;
  margin-top: 1px;
  color: #67758a;
`;

const InfoLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  color: #7c889b;
  font-size: 12px;
  line-height: 1.35;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const InfoValue = styled.span`
  min-width: 0;
  margin-top: 4px;
  overflow: hidden;
  color: #222c3c;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.35;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ContactLink = styled.a`
  color: inherit;
  text-decoration: none;
  &:hover { color: #007d88; text-decoration: underline; }
`;

const Section = styled.section`
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e4eaf0;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 11px;
`;

const SectionTitle = styled.h4`
  margin: 0;
  color: #1c2738;
  font-size: 14px;
  font-weight: 650;
`;

const CountBadge = styled.span`
  display: inline-grid;
  min-width: 24px;
  height: 22px;
  padding: 0 7px;
  box-sizing: border-box;
  place-items: center;
  color: #344154;
  font-size: 12px;
  font-weight: 650;
  background: #edf3f8;
  border-radius: 999px;
`;

const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 420px));
  gap: 10px 12px;
  @media (max-width: 650px) { grid-template-columns: 1fr; }
`;

const DetailTile = styled.button`
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  min-width: 0;
  min-height: 56px;
  padding: 8px 12px;
  align-items: center;
  color: #172133;
  text-align: left;
  background: #fff;
  border: 1px solid #dce5ed;
  border-radius: 9px;
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease, box-shadow 150ms ease;

  &:hover, &:focus-visible {
    background: #f9fcfc;
    border-color: #77b8bd;
    box-shadow: 0 4px 12px rgba(31, 64, 80, 0.08);
    outline: none;
  }
  @media (max-width: 420px) { grid-template-columns: 28px minmax(0, 1fr) auto; }
`;

const TileIcon = styled.span`display: inline-flex; color: #07848c;`;
const TileMain = styled.span`
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const TileAside = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-left: 10px;
`;
const TermBadge = styled.span`
  padding: 6px 9px;
  color: #a86615;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  background: #fff2d5;
  border-radius: 999px;
  @media (max-width: 460px) { display: none; }
`;
const EmptyContent = styled.div`color: #6b7280;`;

export interface GuarantorRef { id: number; fullname: string; creditId: number; }

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
  actualAddress?: string | null;
  creditIds?: string[] | null;
  creditRestTerms?: string[] | null;
  hasPassportPhoto?: boolean | null;
  blacklist?: boolean;
  guarantors?: GuarantorRef[] | null;
}

interface ClientCardProps extends Pick<
  React.HTMLAttributes<HTMLElement>,
  'onMouseDown' | 'onMouseUp' | 'onMouseLeave' | 'onTouchStart' | 'onTouchEnd' | 'onTouchCancel'
> {
  client: Client | null;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onRightClick: (e: React.MouseEvent, client: Client) => void;
  onOpenDossier: (client: Client) => void;
  onBlacklistChange: (client: Client, blacklist: boolean) => void;
  canRemoveFromBlacklist?: boolean;
  isBlacklistUpdating?: boolean;
  showMenu?: boolean;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length === 0 ? '—' : parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
};

const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return 'Не указан';
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 11
    ? cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4-$5')
    : phone;
};

const formatDate = (date: Date | null): string => {
  if (!date) return 'Не указана';
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? 'Не указана' : value.toLocaleDateString('ru-RU');
};

const ClientCard: React.FC<ClientCardProps> = ({
  client, onEdit, onDelete, onRightClick, onOpenDossier, onBlacklistChange,
  canRemoveFromBlacklist = false, isBlacklistUpdating = false, showMenu = true,
  onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd, onTouchCancel,
}) => {
  const [menuAt, setMenuAt] = useState<{ x: number; y: number } | null>(null);
  const [selectedContractModal, setSelectedContractModal] = useState<number | null>(null);
  const [isNameCopied, setIsNameCopied] = useState(false);
  const copyResetTimer = useRef<number | null>(null);

  React.useEffect(() => () => {
    if (copyResetTimer.current) window.clearTimeout(copyResetTimer.current);
  }, []);

  if (!client) return <Card><EmptyContent>Данные клиента недоступны</EmptyContent></Card>;

  const isBlacklisted = client.blacklist === true;
  const creditIds = client.creditIds ?? [];
  const creditRestTerms = client.creditRestTerms ?? [];
  const guarantors = client.guarantors ?? [];

  const copyName = async (event: React.SyntheticEvent) => {
    event.stopPropagation();
    if (!client.fullName) return;
    try {
      await navigator.clipboard.writeText(client.fullName);
      setIsNameCopied(true);
      if (copyResetTimer.current) window.clearTimeout(copyResetTimer.current);
      copyResetTimer.current = window.setTimeout(() => setIsNameCopied(false), 1500);
    } catch (error) { console.error('Не удалось скопировать ФИО:', error); }
  };

  const openContract = (event: React.MouseEvent, creditId: string | number) => {
    event.stopPropagation();
    const id = Number(creditId);
    if (Number.isInteger(id) && id > 0) setSelectedContractModal(id);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (menuAt) return setMenuAt(null);
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuAt({ x: rect.right, y: rect.bottom });
  };

  return (
    <>
      <Card
        $isBlacklisted={isBlacklisted}
        onClick={() => onOpenDossier(client)}
        onContextMenu={(event) => onRightClick(event, client)}
        onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={onTouchCancel}
        onKeyDown={(event) => {
          if (event.currentTarget === event.target && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onOpenDossier(client);
          }
        }}
        tabIndex={0}
      >
        <Header>
          <Avatar aria-hidden="true">{getInitials(client.fullName)}</Avatar>
          <NameRow>
            <NameButton onClick={copyName} title="Скопировать ФИО" type="button">
              {client.fullName || 'Не указано'}
            </NameButton>
            {isBlacklisted && <BlacklistBadge><AlertTriangle size={13} strokeWidth={2.4} />Чёрный список</BlacklistBadge>}
            {isNameCopied && <CopiedBadge>Скопировано</CopiedBadge>}
          </NameRow>
        </Header>

        {showMenu && <>
          <MenuButton aria-label="Действия с клиентом" onMouseDown={(event) => event.stopPropagation()} onClick={handleMenuClick} type="button">
            <MoreVertical size={20} />
          </MenuButton>
          {menuAt && <FloatingContextMenu
            x={menuAt.x} y={menuAt.y} onClose={() => setMenuAt(null)}
            items={[
              { label: 'Редактировать', color: PRIMARY_COLOR, action: () => onEdit(client) },
              ...(!isBlacklisted || canRemoveFromBlacklist ? [{
                label: isBlacklisted ? 'Убрать из чёрного списка' : 'Добавить в чёрный список',
                color: isBlacklisted ? SUCCESS_COLOR : DANGER_COLOR,
                disabled: isBlacklistUpdating,
                action: () => onBlacklistChange(client, !isBlacklisted),
              }] : []),
              { label: 'Удалить', color: DANGER_COLOR, dividerBefore: true, action: () => onDelete(client) },
            ]}
          />}
        </>}

        <InfoGrid>
          <InfoItem><InfoIcon><IdCard size={16} /></InfoIcon><InfoLabel>ID клиента</InfoLabel><InfoValue>{client.id}</InfoValue></InfoItem>
          <InfoItem>
            <InfoIcon><Phone size={15} /></InfoIcon><InfoLabel>Телефон</InfoLabel>
            <InfoValue>{client.phone ? <ContactLink href={formatPhoneHref(client.phone)} onClick={(event) => event.stopPropagation()}>{formatPhone(client.phone)}</ContactLink> : 'Не указан'}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoIcon><MessageCircle size={16} /></InfoIcon><InfoLabel>WhatsApp</InfoLabel>
            <InfoValue>{client.secondPhone ? <ContactLink href={`https://wa.me/${client.secondPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>{formatPhone(client.secondPhone)}</ContactLink> : 'Не указан'}</InfoValue>
          </InfoItem>
          <InfoItem><InfoIcon><CalendarDays size={16} /></InfoIcon><InfoLabel>Дата рождения</InfoLabel><InfoValue>{formatDate(client.birthdate)}</InfoValue></InfoItem>
          <InfoItem><InfoIcon><MapPin size={16} /></InfoIcon><InfoLabel>Адрес регистрации</InfoLabel><InfoValue title={client.registrationAddress || undefined}>{client.registrationAddress || 'Не указан'}</InfoValue></InfoItem>
          <InfoItem><InfoIcon><House size={16} /></InfoIcon><InfoLabel>Фактический адрес</InfoLabel><InfoValue title={client.actualAddress || undefined}>{client.actualAddress || 'Не указан'}</InfoValue></InfoItem>
        </InfoGrid>

        {creditIds.length > 0 && <Section>
          <SectionHeader><SectionTitle>Договоры</SectionTitle><CountBadge>{creditIds.length}</CountBadge></SectionHeader>
          <TileGrid>{creditIds.map((contractId, index) => {
            const months = Number.parseInt(creditRestTerms[index] ?? '0', 10) || 0;
            return <DetailTile key={`${contractId}-${index}`} onClick={(event) => openContract(event, contractId)} type="button">
              <TileIcon><FileText size={20} /></TileIcon>
              <TileMain>№ {contractId || 'Без номера'}</TileMain>
              <TileAside><TermBadge>Осталось {months} мес.</TermBadge><ChevronRight size={18} /></TileAside>
            </DetailTile>;
          })}</TileGrid>
        </Section>}

        {guarantors.length > 0 && <Section>
          <SectionHeader><SectionTitle>Поручительства</SectionTitle><CountBadge>{guarantors.length}</CountBadge></SectionHeader>
          <TileGrid>{guarantors.map((guarantor) => <DetailTile
            key={`${guarantor.creditId}-${guarantor.id}`}
            onClick={(event) => openContract(event, guarantor.creditId)}
            title={guarantor.fullname || undefined}
            type="button"
          >
            <TileIcon><Link2 size={19} /></TileIcon>
            <TileMain>Договор № {guarantor.creditId || 'Без номера'}</TileMain>
            <ChevronRight size={18} />
          </DetailTile>)}</TileGrid>
        </Section>}
      </Card>

      {selectedContractModal && <CreditBriefModal creditId={selectedContractModal} onClose={() => setSelectedContractModal(null)} />}
    </>
  );
};

export default ClientCard;
