import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { FaIdCard, FaEllipsisV, FaMapMarkerAlt, FaBirthdayCake, FaExclamationTriangle, FaEye } from 'react-icons/fa';
import type { Blacklist } from '../../../api/types/blacklist';

const Card = styled.div<{ $isBlacklisted?: boolean; $hasActiveDebt?: boolean; $isDemo?: boolean }>`
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(209, 213, 219, 1);
  padding: 20px;
  margin: 0;
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;

  ${props => props.$isBlacklisted && `
    border-color: #EF4444;
    background: linear-gradient(135deg, #ffffff 0%, #fff5f5 100%);
  `}

  ${props => props.$hasActiveDebt && !props.$isBlacklisted && `
    border-color: #F59E0B;
    background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
  `}

  ${props => props.$isDemo && `
    border: 2px dashed #9CA3AF;
    background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%);
    opacity: 0.9;
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 14px;
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
  padding-right: 50px;

  @media (max-width: 768px) {
    font-size: 16px;
    padding-right: 0;
    gap: 8px;
    flex-wrap: wrap;
  }
`;

const CardTitleText = styled.span<{ $hasBlackBadge?: boolean, $hasDebtBadge?: boolean, $hasDemoBadge?: boolean }>`
  display: inline-block;
  ${props => props.$hasBlackBadge && `
    margin-left: 170px;
  `}
  ${props => props.$hasDebtBadge && `
    margin-left: 130px;
  `}
  ${props => props.$hasDemoBadge && `
    margin-left: 120px;
  `}
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

const InfoItem = styled.div<{ $isHidden?: boolean }>`
  display: flex;
  flex-direction: column;
  min-height: 50px;
  
  ${props => props.$isHidden && `
    filter: blur(4px);
    user-select: none;
    pointer-events: none;
    opacity: 0.6;
  `}
`;

const InfoLabel = styled.span`
  font-size: 12px;
  color: rgba(107, 114, 128, 1);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const InfoValue = styled.span<{ $highlight?: boolean; $warning?: boolean; $debt?: boolean }>`
  font-size: 14px;
  font-weight: ${props => props.$highlight ? '600' : '400'};
  color: ${props => {
    if (props.$warning) return '#EF4444';
    if (props.$debt) return '#B45309';
    if (props.$highlight) return '#007D88';
    return '#111827';
  }};
  min-height: 20px;
  display: flex;
  align-items: center;
`;

const IconWrapper = styled.span`
  color: rgba(107, 114, 128, 0.8);
  display: flex;
  align-items: center;
`;

const LeftBadge = styled.div<{ $type: 'blacklist' | 'debt' | 'demo' }>`
  position: absolute;
  top: 15px;
  left: 15px;
  background: ${({ $type }) => 
    $type === 'blacklist' ? '#000000' : 
    $type === 'debt' ? '#F59E0B' : 
    '#6B7280'};
  color: ${({ $type }) => $type === 'blacklist' ? '#EF4444' : 'white'};
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: ${({ $type }) => 
    $type === 'blacklist' ? '0 2px 12px rgba(239, 68, 68, 0.5)' : 
    $type === 'debt' ? '0 2px 12px rgba(245, 158, 11, 0.5)' : 
    '0 2px 12px rgba(107, 114, 128, 0.5)'};
  z-index: 10;
`;

const HiddenDataOverlay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6B7280;
  font-size: 14px;
  font-style: italic;
  padding: 8px 0;
  
  svg {
    opacity: 0.5;
  }
`;

const DemoWatermark = styled.div`
  position: absolute;
  bottom: 10px;
  right: 15px;
  font-size: 11px;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.5;
  pointer-events: none;
`;

export interface BlackCatalogItem {
  id: number;
  fullname: string;
  doc: string;
  address: string;
  birthdate: string;
  is_swindler?: boolean;
  debt_ending_at?: string;
}

interface BlackCatalogCardProps {
  item: Blacklist;
  isDemo?: boolean;
  onDemoClick?: () => void; // Добавляем callback для демо-клика
}

const BlackCatalogCard: React.FC<BlackCatalogCardProps> = ({ 
  item,
  onDemoClick // Получаем callback из пропсов
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCurrentlyDebt = (() => {
    if (!item.debtEndingAt) return false;
    const endDate = new Date(item.debtEndingAt);
    if (Number.isNaN(endDate.getTime())) return false;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDateStart = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    return endDateStart >= todayStart;
  })();

  const handleCardClick = () => {
    if (onDemoClick) {
      onDemoClick(); // Вызываем callback вместо локального state
    }
  };

  const isBlackList = (() => {
    if (!item.debtEndingAt) return true;
    return false;
  })();
  
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

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const getTitleMargin = () => {
    return { $hasDemoBadge: true };
  };

  return (
    <Card 
      $isBlacklisted={isBlackList}
      $hasActiveDebt={isCurrentlyDebt}
      $isDemo={true}
      onClick={handleCardClick}
    >
      {true ? (
        <LeftBadge $type="demo">
          <FaEye size={14} />
          ДЕМО
        </LeftBadge>
      ) : (
        <>
          {isBlackList && (
            <LeftBadge $type="blacklist">
              <FaExclamationTriangle size={14} />
              Чёрный список
            </LeftBadge>
          )}
          
          {isCurrentlyDebt && (
            <LeftBadge $type="debt">
              <FaExclamationTriangle size={14} />
              Оформлен
            </LeftBadge>
          )}
        </>
      )}
      
      <CardContent>
        <CardTitle>
          <CardTitleText {...getTitleMargin()}>
            {item.fullName || 'Не указано'}
          </CardTitleText>
        </CardTitle>
        
        <InfoGrid>
          <InfoItem $isHidden={true}>
            <InfoLabel>
              <IconWrapper><FaIdCard size={12} /></IconWrapper>
              ID
            </InfoLabel>
            <InfoValue $warning={isBlackList} $debt={isCurrentlyDebt}>
              {item.id}
            </InfoValue>
          </InfoItem>
          
          <InfoItem>
            <InfoLabel>
              <IconWrapper><FaBirthdayCake size={12} /></IconWrapper>
              Дата рождения
            </InfoLabel>
            <InfoValue $warning={isBlackList} $debt={isCurrentlyDebt}>
              {item?.birthdate?.toString().split('T')[0]}
            </InfoValue>
          </InfoItem>
          
          <InfoItem $isHidden={true}>
            <InfoLabel>
              <IconWrapper><FaIdCard size={12} /></IconWrapper>
              Документ
            </InfoLabel>
            <InfoValue $warning={isBlackList} $debt={isCurrentlyDebt}>
              {item.document || 'Не указан'}
            </InfoValue>
          </InfoItem>
          
          <InfoItem $isHidden={true}>
            <InfoLabel>
              <IconWrapper><FaMapMarkerAlt size={12} /></IconWrapper>
              Адрес
            </InfoLabel>
            <InfoValue $warning={isBlackList} $debt={isCurrentlyDebt}>
              {item.address || 'Не указан'}
            </InfoValue>
          </InfoItem>
        </InfoGrid>
        
        {true && (
          <HiddenDataOverlay>
            <FaEye size={14} />
            <span>Подробные комментарии и информация скрыты в демо-режиме</span>
          </HiddenDataOverlay>
        )}
      </CardContent>

      {true && <DemoWatermark>Только для просмотра</DemoWatermark>}
    </Card>
  );
};

export default BlackCatalogCard;