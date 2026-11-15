import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FaCheck, FaTimes, FaMoneyBillWave, FaComment, FaFileContract, FaUserFriends, FaBuilding, FaMapMarkerAlt, FaBox, FaFlipboard, FaInfoCircle, FaSync } from 'react-icons/fa';
import useCreditApplication from '../api/hooks/useCreditApplication';
import type { CreditApplicationResponse, GetCreditApplicationsQuery, SelfCreditApplicationResponse, RejectApplicationRequest, RejectReason } from '../api/types/creditApplication';
import ClientDossier from '../components/ui/Dossiers/ClientDossier';
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
import PageLayout from '../components/ui/Layouts/PageLayout';

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

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const CardContainer = styled.div<{ isProcessed?: boolean }>`
  background: transparent;
  perspective: 1500px;
  height: 700px;
  cursor: pointer;
  opacity: ${props => props.isProcessed ? 0.7 : 1};
  position: relative;
`;

const CardInner = styled.div<{ isFlipped: boolean }>`
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  transform: ${props => props.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'};
`;

const CardFront = styled.div<{ isProcessed?: boolean }>`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  background: ${props => props.isProcessed ? '#f3f4f6' : 'white'};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
`;

const CardBack = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  background: linear-gradient(135deg, #007D88 0%, #006670 100%);
  border-radius: 12px;
  transform: rotateY(180deg);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  color: white;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
`;

const PartnerBadge = styled.div`
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
`;

const CardHeader = styled.div<{ isPartner?: boolean; isProcessed?: boolean }>`
  background: ${props => props.isProcessed 
    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
    : 'linear-gradient(135deg, #007D88 0%, #006670 100%)'
  };
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

const CardId = styled.div`
  font-size: 14px;
  font-weight: 500;
  opacity: 0.9;
`;

const CardDate = styled.div`
  font-size: 12px;
  opacity: 0.8;
`;

const CardBody = styled.div`
  padding: 16px;
  flex: 1;
  overflow-y: auto;
`;

const ClientInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f3f4f6;
  }
`;

const ClientAvatar = styled.div<{ src?: string; color?: string }>`
  width: 48px;
  height: 48px;
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
  font-size: 16px;
  flex-shrink: 0;
`;

const ClientDetails = styled.div`
  flex: 1;
`;

const ClientName = styled.div`
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
`;

const ClientPhone = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-size: 13px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const InfoValue = styled.span<{ highlight?: boolean }>`
  font-size: 14px;
  color: ${props => props.highlight ? '#007D88' : '#111827'};
  font-weight: ${props => props.highlight ? '600' : '400'};
`;

const FinancialCard = styled.div`
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  padding: 12px;
  border-radius: 8px;
  margin: 12px 0;
`;

const FinancialItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CardActions = styled.div<{ isProcessed?: boolean }>`
  padding: 16px;
  background: #f9fafb;
  display: flex;
  gap: 12px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
  pointer-events: ${props => props.isProcessed ? 'none' : 'auto'};
  opacity: ${props => props.isProcessed ? 0.5 : 1};
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'success' | 'danger' | 'info' | 'warning' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;

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
      case 'info':
        return `
          background: #007D88;
          color: white;
          &:hover {
            background: #006670;
          }
        `;
      case 'warning':
        return `
          background: #f59e0b;
          color: white;
          &:hover {
            background: #d97706;
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

const FlipButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const BackHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BackTitle = styled.h3`
  font-size: 18px;
  margin: 0;
  font-weight: 600;
`;

const BackContent = styled.div`
  padding: 20px;
  flex: 1;
`;

const FinancialDetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
`;

const FinancialDetailLabel = styled.span`
  font-size: 14px;
  opacity: 0.9;
`;

const FinancialDetailValue = styled.span`
  font-size: 16px;
  font-weight: 600;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
  font-size: 16px;
`;

const RefreshButton = styled.button`
  background: white;
  color: #007D88;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Toast = styled.div<{ type: 'success' | 'error' | 'warning' }>`
  padding: 14px 20px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  min-width: 300px;
  max-width: 400px;

  ${props => {
    switch (props.type) {
      case 'success':
        return `background: #10b981;`;
      case 'error':
        return `background: #ef4444;`;
      case 'warning':
        return `background: #f59e0b;`;
      default:
        return `background: #007D88;`;
    }
  }}

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #111827;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: flex-end;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  margin-top: 12px;

  &:focus {
    outline: none;
    border-color: #007D88;
    ring: 2px solid #007D88;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const FiltersWrapper = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
  justify-content: flex-end;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  margin-top: 12px;

  &:focus {
    outline: none;
    border-color: #007D88;
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const SimpleCompactBanner = styled.div<{ isComplete: boolean }>`
  background: ${props => props.isComplete ? '#10b981' : '#007D88'};
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 500;
`;

type ProcessStatus = 'pending' | 'approved' | 'rejected' | 'error';

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning';
  message: string;
}

const CreditApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedGuarantor, setSelectedGuarantor] = useState<any>(null);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isProgressExpanded, setIsProgressExpanded] = useState(false);
  const [processedApplications, setProcessedApplications] = useState<Map<number, ProcessStatus>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<RejectReason>(0);
  const [rejectComment, setRejectComment] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

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
    approveCreditApplication,
    cancelCreditApplication,
    rejectCreditApplication
  } = useCreditApplication();

  const {
    getClientById,
  } = useClient();

  const addToast = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    loadApplications();
  }, [currentPage, minPrice, maxPrice, minTerm, maxTerm, selectedRegion, selectedDistrict, activeTab]);

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
      percent: application.percent / 100,
      guarantorId: 'guarantorId' in application ? application.guarantorId : undefined
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
      addToast('error', 'Не удалось создать чат');
    }
  };

  const handleFlipCard = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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
    if (processedApplications.has(id)) {
      addToast('warning', `⚠️ Заявка #${id} уже обработана`);
      return;
    }

    if (window.confirm('Стоимость одобрения заявки 3 дня лицензии! Вы уверены, что хотите одобрить эту заявку?')) {
      try {
        await approveCreditApplication(id);
        setProcessedApplications(prev => new Map(prev).set(id, 'approved'));
        addToast('success', `✅ Заявка #${id} успешно одобрена!`);
      } catch (error: any) {
        console.error('Ошибка при одобрении заявки:', error);
        
        if (error?.response?.status === 400 || error?.message?.includes('уже обработана') || error?.message?.includes('already processed')) {
          setProcessedApplications(prev => new Map(prev).set(id, 'error'));
          addToast('warning', `⚠️ Заявка #${id} уже была обработана`);
        } else {
          setProcessedApplications(prev => new Map(prev).set(id, 'error'));
          addToast('error', `❌ Не удалось одобрить заявку #${id}`);
        }
      }
    }
  };

  const handleRejectClick = (id: number) => {
    if (processedApplications.has(id)) {
      addToast('warning', `⚠️ Заявка #${id} уже обработана`);
      return;
    }
    setSelectedApplicationId(id);
    setRejectReason(0);
    setRejectComment('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedApplicationId) return;

    if (processedApplications.has(selectedApplicationId)) {
      addToast('warning', `⚠️ Заявка #${selectedApplicationId} уже обработана`);
      setRejectModalOpen(false);
      return;
    }

    setIsRejecting(true);
    try {
      const request: RejectApplicationRequest = {
        reason: rejectReason,
        comment: rejectComment
      };
      await rejectCreditApplication(selectedApplicationId, request);
      
      setProcessedApplications(prev => new Map(prev).set(selectedApplicationId, 'rejected'));
      
      const reasonText = rejectReason === 0 ? 'Не заинтересован' : 
                        rejectReason === 1 ? 'Черный клиент' : 
                        rejectReason === 2 ? 'Черный поручитель' : 'Клиент имеет задолженность';
      addToast('success', `📝 Заявка #${selectedApplicationId} отклонена. Причина: ${reasonText}`);
      
      setRejectModalOpen(false);
      setSelectedApplicationId(null);
      setRejectReason(0);
      setRejectComment('');
    } catch (error: any) {
      console.error('Ошибка при отклонении заявки:', error);
      
      if (error?.response?.status === 400 || error?.message?.includes('уже обработана') || error?.message?.includes('already processed')) {
        setProcessedApplications(prev => new Map(prev).set(selectedApplicationId, 'error'));
        addToast('warning', `⚠️ Заявка #${selectedApplicationId} уже была обработана`);
      } else {
        setProcessedApplications(prev => new Map(prev).set(selectedApplicationId, 'error'));
        addToast('error', `❌ Не удалось отклонить заявку #${selectedApplicationId}`);
      }
    } finally {
      setIsRejecting(false);
    }
  };

  const handleRefreshApplications = async () => {
    setIsRefreshing(true);
    await loadApplications();
    setProcessedApplications(new Map());
    setFlippedCards(new Set());
    setIsRefreshing(false);
  };

  const handleClearFilter = (filterType: string) => {
    switch (filterType) {
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
    setFlippedCards(new Set());
    setProcessedApplications(new Map());
  };

  const handleViewClient = async (clientId: number, clientName?: string, clientPhone?: string) => {
    try {
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
          fullName: clientName || 'Неизвестно',
          phone: clientPhone || '',
          doc: '',
          birthdate: null,
          docIssueDate: null,
          docIssueYear: 0,
          registrationAddress: null,
          hasPassportPhoto: false
        };
        setSelectedClient(fallbackClientData);
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных клиента:', error);
      const fallbackClientData = {
        id: clientId,
        fullName: clientName || 'Неизвестно',
        phone: clientPhone || '',
        doc: '',
        birthdate: null,
        docIssueDate: null,
        docIssueYear: 0,
        registrationAddress: null,
        hasPassportPhoto: false
      };
      setSelectedClient(fallbackClientData);
    }
  };

  const handleViewGuarantor = async (guarantorId: number, guarantorName?: string) => {
    if (!guarantorId) return;
    
    try {
      const guarantorData = await getClientById(guarantorId);
      
      if (guarantorData) {
        setSelectedGuarantor({
          id: guarantorData.id,
          fullName: guarantorData.fullName,
          phone: guarantorData.phone,
          secondPhone: guarantorData.secondPhone,
          doc: guarantorData.doc,
          birthdate: guarantorData.birthdate ? new Date(guarantorData.birthdate) : null,
          docIssueDate: guarantorData.docIssueDate ? new Date(guarantorData.docIssueDate) : null,
          docIssueYear: guarantorData.docIssueYear,
          registrationAddress: guarantorData.registrationAddress,
          hasPassportPhoto: guarantorData.hasPassportPhoto
        });
      } else {
        const fallbackGuarantorData = {
          id: guarantorId,
          fullName: guarantorName || 'Неизвестно',
          phone: '',
          doc: '',
          birthdate: null,
          docIssueDate: null,
          docIssueYear: 0,
          registrationAddress: null,
          hasPassportPhoto: false
        };
        setSelectedGuarantor(fallbackGuarantorData);
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных поручителя:', error);
      const fallbackGuarantorData = {
        id: guarantorId,
        fullName: guarantorName || 'Неизвестно',
        phone: '',
        doc: '',
        birthdate: null,
        docIssueDate: null,
        docIssueYear: 0,
        registrationAddress: null,
        hasPassportPhoto: false
      };
      setSelectedGuarantor(fallbackGuarantorData);
    }
  };

  const handleBackFromDossier = () => {
    setSelectedClient(null);
    setSelectedGuarantor(null);
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
    const markup = 'markupAmount' in application ? application.markupAmount || 0 : 'markup' in application ? application.markup || 0 : 0;
    const totalAmount = loanAmount + markup;
    const monthlyPayment = ('monthlyPayment' in application ? application.monthlyPayment : application.monthPayment) || 0;
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

  const getProcessStats = () => {
    const total = data?.length || 0;
    const processed = processedApplications.size;
    const approved = Array.from(processedApplications.values()).filter(v => v === 'approved').length;
    const rejected = Array.from(processedApplications.values()).filter(v => v === 'rejected').length;
    const errors = Array.from(processedApplications.values()).filter(v => v === 'error').length;
    return { total, processed, approved, rejected, errors };
  };

  const stats = getProcessStats();
  const isAllProcessed = stats.total > 0 && stats.processed === stats.total;

  const renderMyApplicationsCards = () => {
    if (!myApplicationsData?.items || myApplicationsData.items.length === 0) {
      return <EmptyState>Нет ваших заявок</EmptyState>;
    }

    return (
      <CardsGrid>
        {myApplicationsData.items.map(application => {
          const employeeInitials = getInitials(application.employeeName || '');
          const employeeAvatarUrl = application.employeeAvatar ? FILE_BASE_URL + application.employeeAvatar : generateAvatar(employeeInitials, 48);
          const clientInitials = getInitials(application.clientName || '');
          const clientAvatarUrl = generateAvatar(clientInitials, 48);
          const isFlipped = flippedCards.has(application.id);
          const isProcessed = processedApplications.has(application.id);
          const processStatus = processedApplications.get(application.id);

          const handleDeleteApplication = async (e: React.MouseEvent, app: SelfCreditApplicationResponse) => {
            e.stopPropagation();
            const isConfirmed = window.confirm("Вы уверены, что хотите удалить заявку?");
            
            if (!isConfirmed) return;

            try {
              await cancelCreditApplication(app.id);
              setProcessedApplications(prev => new Map(prev).set(app.id, 'approved'));
              addToast('success', `🗑️ Заявка #${app.id} успешно удалена`);
              if (flippedCards.has(app.id)) {
                setFlippedCards(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(app.id);
                  return newSet;
                });
              }
            } catch (error) {
              console.error('Ошибка при удалении заявки:', error);
              setProcessedApplications(prev => new Map(prev).set(app.id, 'error'));
              addToast('error', `❌ Не удалось удалить заявку #${app.id}`);
            }
          };

          return (
            <CardContainer key={application.id} isProcessed={isProcessed}>
              <CardInner isFlipped={isFlipped}>
                <CardFront isProcessed={isProcessed}>
                  <CardHeader isPartner={application.isPartner} isProcessed={isProcessed}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <CardId>Заявка #{application.id}</CardId>
                      {application.isPartner && (
                        <PartnerBadge>
                          {application.partnerName}
                          {application.partnerPhone && (
                            <> {application.partnerPhone}</>
                          )}
                        </PartnerBadge>
                      )}
                      {isProcessed && processStatus === 'approved' && (
                        <PartnerBadge style={{ background: '#10b981' }}>
                          <FaCheck size={10} />
                          Удалена
                        </PartnerBadge>
                      )}
                      {isProcessed && processStatus === 'error' && (
                        <PartnerBadge style={{ background: '#f59e0b' }}>
                          <FaTimes size={10} />
                          Ошибка
                        </PartnerBadge>
                      )}
                    </div>
                    <FlipButton onClick={(e) => handleFlipCard(e, application.id)}>
                      <FaFlipboard />
                      Детали
                    </FlipButton>
                  </CardHeader>
                  
                  <CardBody>
                    <ClientInfo onClick={(e) => {
                      e.stopPropagation();
                      handleViewClient(application.clientId, application.clientName);
                    }}>
                      <ClientAvatar src={clientAvatarUrl} />
                      <ClientDetails>
                        <ClientName>{application.clientName || 'Неизвестно'}</ClientName>
                        <ClientPhone>Клиент</ClientPhone>
                      </ClientDetails>
                    </ClientInfo>

                    {application.guarantorId && application.guarantorName && (
                      <ClientInfo onClick={(e) => {
                        e.stopPropagation();
                        handleViewGuarantor(application.guarantorId!, application.guarantorName);
                      }}>
                        <InfoLabel style={{ color: '#6b7280' }}>
                          <FaUserFriends />
                          Поручитель
                        </InfoLabel>
                        <ClientName style={{ marginTop: 4, fontSize: 14 }}>{application.guarantorName}</ClientName>
                      </ClientInfo>
                    )}

                    <InfoRow>
                      <InfoLabel>Принял</InfoLabel>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClientAvatar src={employeeAvatarUrl} style={{ width: 24, height: 24 }} />
                        <InfoValue>{application.employeeName || 'Не указан'}</InfoValue>
                      </div>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel><FaBox /> Товар</InfoLabel>
                      <InfoValue>{application.productName || '-'}</InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel><FaMoneyBillWave /> Стоимость</InfoLabel>
                      <InfoValue>{formatMoney(application.productPrice?.toString() ?? "0")}</InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel>Первый взнос</InfoLabel>
                      <InfoValue>{formatMoney(application.firstPayment?.toString() ?? "0")}</InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel>Срок</InfoLabel>
                      <InfoValue>{application.termMonths || 0} мес.</InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel><FaMapMarkerAlt /> Регион</InfoLabel>
                      <InfoValue>{application.region || '-'}</InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel>Район</InfoLabel>
                      <InfoValue>{application.district || '-'}</InfoValue>
                    </InfoRow>

                    <FinancialCard>
                      <FinancialItem>
                        <span>Надбавка:</span>
                        <span>{formatMoney(application.markup.toString())}</span>
                      </FinancialItem>
                      <FinancialItem>
                        <span>Ежемесячный платеж:</span>
                        <span style={{ fontWeight: 600, color: '#007D88' }}>
                          {formatMoney(application.monthPayment.toString())}
                        </span>
                      </FinancialItem>
                    </FinancialCard>
                  </CardBody>

                  <CardActions isProcessed={isProcessed}>
                    <ActionButton
                      variant="info"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMessageClick(e, application.clientId);
                      }}
                    >
                      <FaComment />
                      Написать
                    </ActionButton>
                    
                    <ActionButton
                      variant="success"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProcessApplication(application);
                      }}
                    >
                      <FaFileContract />
                      Оформить
                    </ActionButton>
                    
                    <ActionButton
                      variant="danger"
                      onClick={(e) => handleDeleteApplication(e, application)}
                      disabled={isProcessed}
                    >
                      <FaTimes />
                      Удалить
                    </ActionButton>
                  </CardActions>
                </CardFront>

                <CardBack>
                  <BackHeader>
                    <BackTitle>Финансовые детали</BackTitle>
                    <FlipButton onClick={(e) => handleFlipCard(e, application.id)}>
                      <FaInfoCircle />
                      Назад
                    </FlipButton>
                  </BackHeader>
                  <BackContent>
                    <FinancialDetailItem>
                      <FinancialDetailLabel>Стоимость товара</FinancialDetailLabel>
                      <FinancialDetailValue>{formatMoney(application.productPrice?.toString() ?? "0")}</FinancialDetailValue>
                    </FinancialDetailItem>
                    <FinancialDetailItem>
                      <FinancialDetailLabel>Первоначальный взнос</FinancialDetailLabel>
                      <FinancialDetailValue>{formatMoney(application.firstPayment?.toString() ?? "0")}</FinancialDetailValue>
                    </FinancialDetailItem>
                    <FinancialDetailItem>
                      <FinancialDetailLabel>Надбавка</FinancialDetailLabel>
                      <FinancialDetailValue>{formatMoney(application.markup.toString())}</FinancialDetailValue>
                    </FinancialDetailItem>
                    <FinancialDetailItem>
                      <FinancialDetailLabel>Срок месяцев</FinancialDetailLabel>
                      <FinancialDetailValue>{application.termMonths} месяцев</FinancialDetailValue>
                    </FinancialDetailItem>
                    <FinancialDetailItem>
                      <FinancialDetailLabel>Ежемесячный платеж</FinancialDetailLabel>
                      <FinancialDetailValue style={{ fontSize: 18, color: '#FFD966' }}>
                        {formatMoney(application.monthPayment.toString())}
                      </FinancialDetailValue>
                    </FinancialDetailItem>
                    {application.percent && (
                      <FinancialDetailItem>
                        <FinancialDetailLabel>Процент</FinancialDetailLabel>
                        <FinancialDetailValue>{application.percent}%</FinancialDetailValue>
                      </FinancialDetailItem>
                    )}
                  </BackContent>
                </CardBack>
              </CardInner>
            </CardContainer>
          );
        })}
      </CardsGrid>
    );
  };

  const renderAllApplicationsCards = () => {
    if (!data || data.length === 0) {
      return <EmptyState>Нет доступных заявок</EmptyState>;
    }

    return (
      <CardsGrid>
        {data.map(application => {
          const initials = getInitials(application.fullname);
          const avatarUrl = application.avatarPath ? FILE_BASE_URL + application.avatarPath : generateAvatar(initials, 48);
          const financials = calculateFinancialDetails(application);
          const isFlipped = flippedCards.has(application.id);
          const isProcessed = processedApplications.has(application.id);
          const processStatus = processedApplications.get(application.id);

          return (
            <CardContainer key={application.id} isProcessed={isProcessed}>
              <CardInner isFlipped={isFlipped}>
                <CardFront isProcessed={isProcessed}>
                  <CardHeader isPartner={application.isPartner} isProcessed={isProcessed}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <CardId>Заявка #{application.id}</CardId>
                      {application.isPartner && (
                        <PartnerBadge>
                          <FaBuilding size={10} />
                          От партнёра
                        </PartnerBadge>
                      )}
                      {isProcessed && processStatus === 'approved' && (
                        <PartnerBadge style={{ background: '#10b981' }}>
                          <FaCheck size={10} />
                          Одобрена
                        </PartnerBadge>
                      )}
                      {isProcessed && processStatus === 'rejected' && (
                        <PartnerBadge style={{ background: '#ef4444' }}>
                          <FaTimes size={10} />
                          Отклонена
                        </PartnerBadge>
                      )}
                      {isProcessed && processStatus === 'error' && (
                        <PartnerBadge style={{ background: '#f59e0b' }}>
                          <FaTimes size={10} />
                          Ошибка
                        </PartnerBadge>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <CardDate>{formatDate(application.createdDate)}</CardDate>
                      <FlipButton onClick={(e) => handleFlipCard(e, application.id)}>
                        <FaFlipboard />
                        Детали
                      </FlipButton>
                    </div>
                  </CardHeader>
                  
                  <CardBody>
                    <ClientInfo onClick={(e) => {
                      e.stopPropagation();
                      handleViewClient(application.clientId, application.fullname);
                    }}>
                      <ClientAvatar src={avatarUrl} />
                      <ClientDetails>
                        <ClientName>{application.fullname}</ClientName>
                      </ClientDetails>
                    </ClientInfo>

                    {application.guarantorId && application.guarantorName && (
                      <ClientInfo onClick={(e) => {
                        e.stopPropagation();
                        handleViewGuarantor(application.guarantorId!, application.guarantorName);
                      }}>
                        <InfoLabel style={{ color: '#6b7280' }}>
                          <FaUserFriends />
                          Поручитель
                        </InfoLabel>
                        <ClientName style={{ marginTop: 4, fontSize: 14 }}>{application.guarantorName}</ClientName>
                      </ClientInfo>
                    )}

                    <InfoRow>
                      <InfoLabel><FaBox /> Товар</InfoLabel>
                      <InfoValue>{application.productName}</InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel><FaMoneyBillWave /> Стоимость</InfoLabel>
                      <InfoValue>{formatMoney(application.productPrice?.toString() ?? "0")}</InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel>Первый взнос</InfoLabel>
                      <InfoValue>{formatMoney(application.firstPayment?.toString() ?? "0")}</InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel>Срок</InfoLabel>
                      <InfoValue>{application.termMonths} мес.</InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel><FaMapMarkerAlt /> Регион</InfoLabel>
                      <InfoValue>{application.region}</InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel>Район</InfoLabel>
                      <InfoValue>{application.district}</InfoValue>
                    </InfoRow>

                    <FinancialCard>
                      <FinancialItem>
                        <span>Надбавка:</span>
                        <span>{formatMoney(application.markupAmount.toString())}</span>
                      </FinancialItem>
                      <FinancialItem>
                        <span>Ежемесячный платеж:</span>
                        <span style={{ fontWeight: 600, color: '#007D88' }}>
                          {formatMoney(application.monthlyPayment.toString())}
                        </span>
                      </FinancialItem>
                    </FinancialCard>
                  </CardBody>

                  <CardActions isProcessed={isProcessed}>
                    <ActionButton
                      variant="success"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(application.id);
                      }}
                      disabled={isLoading || isProcessed}
                    >
                      <FaCheck />
                      Одобрить
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectClick(application.id);
                      }}
                      disabled={isLoading || isProcessed}
                    >
                      <FaTimes />
                      Отклонить
                    </ActionButton>
                  </CardActions>
                </CardFront>

                <CardBack>
                  <BackHeader>
                    <BackTitle>Финансовые детали</BackTitle>
                    <FlipButton onClick={(e) => handleFlipCard(e, application.id)}>
                      <FaInfoCircle />
                      Назад
                    </FlipButton>
                  </BackHeader>
                  <BackContent>
                    <FinancialDetailItem>
                      <FinancialDetailLabel>Стоимость товара</FinancialDetailLabel>
                      <FinancialDetailValue>{formatMoney(application.productPrice?.toString() ?? "0")}</FinancialDetailValue>
                    </FinancialDetailItem>
                    <FinancialDetailItem>
                      <FinancialDetailLabel>Первоначальный взнос</FinancialDetailLabel>
                      <FinancialDetailValue>{formatMoney(application.firstPayment?.toString() ?? "0")}</FinancialDetailValue>
                    </FinancialDetailItem>
                    <FinancialDetailItem>
                      <FinancialDetailLabel>Надбавка</FinancialDetailLabel>
                      <FinancialDetailValue>{formatMoney(application.markupAmount.toString())}</FinancialDetailValue>
                    </FinancialDetailItem>
                    <FinancialDetailItem>
                      <FinancialDetailLabel>Общая сумма к возврату</FinancialDetailLabel>
                      <FinancialDetailValue>{formatMoney(financials.totalAmount.toString())}</FinancialDetailValue>
                    </FinancialDetailItem>
                    <FinancialDetailItem>
                      <FinancialDetailLabel>Срок месяцев</FinancialDetailLabel>
                      <FinancialDetailValue>{application.termMonths} месяцев</FinancialDetailValue>
                    </FinancialDetailItem>
                    <FinancialDetailItem>
                      <FinancialDetailLabel>Ежемесячный платеж</FinancialDetailLabel>
                      <FinancialDetailValue style={{ fontSize: 18, color: '#FFD966' }}>
                        {formatMoney(application.monthlyPayment.toString())}
                      </FinancialDetailValue>
                    </FinancialDetailItem>
                  </BackContent>
                </CardBack>
              </CardInner>
            </CardContainer>
          );
        })}
      </CardsGrid>
    );
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

  if (selectedGuarantor) {
    return (
      <ClientDossier
        client={selectedGuarantor}
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
    },
    {
      id: 'my',
      label: 'Свои заявки',
    }
  ];

  return (
    <PageLayout>
      <ToastContainer>
        {toasts.map(toast => (
          <Toast key={toast.id} type={toast.type}>
            {toast.type === 'success' && '✅ '}
            {toast.type === 'error' && '❌ '}
            {toast.type === 'warning' && '⚠️ '}
            {toast.message}
          </Toast>
        ))}
      </ToastContainer>

      <HeaderContainer>
        <TitleField>
          <CustomTitle>Заявки</CustomTitle>
        </TitleField>

        {activeTab === 'all' && stats.total > 0 && (
          <SimpleCompactBanner isComplete={isAllProcessed}>
            <span>{stats.processed}/{stats.total}</span>
            {stats.approved > 0 && <span>✅ {stats.approved}</span>}
            {stats.rejected > 0 && <span>❌ {stats.rejected}</span>}
            {isAllProcessed && (
              <RefreshButton 
                onClick={handleRefreshApplications} 
                disabled={isRefreshing}
                style={{ 
                  background: 'white', 
                  color: '#007D88', 
                  padding: '2px 8px',
                  fontSize: '11px',
                  margin: 0
                }}
              >
                <FaSync size={10} />
                Обновить
              </RefreshButton>
            )}
          </SimpleCompactBanner>
        )}
      </HeaderContainer>
      <TabsContainer>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
        />
        
        {activeTab === 'all' && (
          <FiltersWrapper>
            <InputWrapper style={{ minWidth: '120px' }}>
              <CustomInput
                inputType="number"
                placeholder="Мин. стоимость"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setCurrentPage(1);
                  setProcessedApplications(new Map());
                }}
              />
              {minPrice && (
                <ClearFilterButton onClick={() => handleClearFilter('minPrice')}>
                  ×
                </ClearFilterButton>
              )}
            </InputWrapper>

            <InputWrapper style={{ minWidth: '120px' }}>
              <CustomInput
                inputType="number"
                placeholder="Макс. стоимость"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setCurrentPage(1);
                  setProcessedApplications(new Map());
                }}
              />
              {maxPrice && (
                <ClearFilterButton onClick={() => handleClearFilter('maxPrice')}>
                  ×
                </ClearFilterButton>
              )}
            </InputWrapper>

            <InputWrapper style={{ minWidth: '120px' }}>
              <CustomInput
                inputType="number"
                placeholder="Мин. срок"
                value={minTerm}
                onChange={(e) => {
                  setMinTerm(e.target.value);
                  setCurrentPage(1);
                  setProcessedApplications(new Map());
                }}
              />
              {minTerm && (
                <ClearFilterButton onClick={() => handleClearFilter('minTerm')}>
                  ×
                </ClearFilterButton>
              )}
            </InputWrapper>

            <InputWrapper style={{ minWidth: '120px' }}>
              <CustomInput
                inputType="number"
                placeholder="Макс. срок"
                value={maxTerm}
                onChange={(e) => {
                  setMaxTerm(e.target.value);
                  setCurrentPage(1);
                  setProcessedApplications(new Map());
                }}
              />
              {maxTerm && (
                <ClearFilterButton onClick={() => handleClearFilter('maxTerm')}>
                  ×
                </ClearFilterButton>
              )}
            </InputWrapper>

            <InputWrapper style={{ minWidth: '150px' }}>
              <CustomSelect
                placeholder="Регион"
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setCurrentPage(1);
                  setProcessedApplications(new Map());
                }}
                options={regionData ? regionData.map(region => ({
                  value: region.id.toString(),
                  label: region.name
                })) : []}
                disabled={isRegionLoading}
              />
              {selectedRegion && (
                <ClearFilterButton onClick={() => handleClearFilter('region')}>
                  ×
                </ClearFilterButton>
              )}
            </InputWrapper>

            <InputWrapper style={{ minWidth: '150px' }}>
              <TooltipWrapper
                onMouseEnter={() => !selectedRegion && setShowDistrictTooltip(true)}
                onMouseLeave={() => setShowDistrictTooltip(false)}
              >
                <CustomSelect
                  placeholder="Район"
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setCurrentPage(1);
                    setProcessedApplications(new Map());
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
              {selectedDistrict && (
                <ClearFilterButton onClick={() => handleClearFilter('district')}>
                  ×
                </ClearFilterButton>
              )}
            </InputWrapper>
          </FiltersWrapper>
        )}
      </TabsContainer>

{activeTab === 'all' ? (
  <>
    {(isLoading || isLoadingMyApplications) && (
      <LoadingOverlay>
        <div>Загрузка заявок...</div>
      </LoadingOverlay>
    )}

    {error && !isLoading && (
      <ErrorMessage>
        Ошибка загрузки заявок: {error}
      </ErrorMessage>
    )}

    {!isLoading && renderAllApplicationsCards()}
  </>
) : (
  <>
    {(isLoading || isLoadingMyApplications) && (
      <LoadingOverlay>
        <div>Загрузка заявок...</div>
      </LoadingOverlay>
    )}

    {!isLoadingMyApplications && renderMyApplicationsCards()}
  </>
)}

      {rejectModalOpen && (
        <ModalOverlay onClick={() => setRejectModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Отклонение заявки</ModalTitle>
            
            <Select
              value={rejectReason}
              onChange={(e) => setRejectReason(Number(e.target.value) as RejectReason)}
            >
              <option value={0}>Не заинтересован</option>
              <option value={1}>Черный клиент</option>
              <option value={2}>Черный поручитель</option>
              <option value={3}>Клиент имеет задолженность</option>
            </Select>
            
            <TextArea
              placeholder="Комментарий (необязательно)"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
            />
            
            <ModalButtons>
              <ActionButton
                variant="danger"
                onClick={() => setRejectModalOpen(false)}
                disabled={isRejecting}
              >
                Отмена
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={handleConfirmReject}
                disabled={isRejecting}
              >
                {isRejecting ? 'Отклонение...' : 'Отклонить'}
              </ActionButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageLayout>
  );
};

export default CreditApplicationPage;