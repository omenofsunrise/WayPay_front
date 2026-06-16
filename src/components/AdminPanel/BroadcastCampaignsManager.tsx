import React, { useState, useEffect } from 'react';
import { Pagination } from 'react-bootstrap';
import styled from 'styled-components';
import useAdminPanel from '../../api/hooks/useAdminPanel';
import type { BroadcastCampaign } from '../../api/services/adminPanelService';
import BaseModal from '../modal/BASE/modalCRUBase';
import DarkCyanButton from '../ui/Buttons/DarkCyanButton';
import CustomInput from '../ui/fields/CustomInput';
import PaginationLayout from '../ui/Layouts/PaginationLayout';
import CountInfoTitle from '../ui/Text/CountInfoTitle';
import useWhatsApp from '../../api/hooks/useWhatsApp';

const Container = styled.div`
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Важно: предотвращает выход содержимого за пределы */
  position: relative;
`;


const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
  flex-shrink: 0;
`;

// Вкладки
const TabsContainer = styled.div`
  display: flex;
  border-bottom: 2px solid #E5E7EB;
  margin-bottom: 24px;
  gap: 0;
  flex-shrink: 0;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid ${props => props.active ? '#007D88' : 'transparent'};
  color: ${props => props.active ? '#007D88' : '#6B7280'};
  font-weight: ${props => props.active ? '600' : '400'};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: #007D88;
    background: #F0F9FA;
  }
`;

const TabContent = styled.div`
  flex: 1;
  overflow: hidden; /* Изменено с overflow-y: auto на hidden */
  display: flex;
  flex-direction: column;
  min-height: 0; /* ВАЖНО для flex-скролла */
`;

const CampaignsContentWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Добавлено */
`;

const CampaignGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  flex: 1;
  overflow-y: auto;
  align-content: start;
  padding-right: 4px;
  max-height: calc(100vh - 350px); 
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #F1F1F1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #007D88;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #005f66;
  }
`;

const CampaignCard = styled.div<{ status: string }>`
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  border-left: 4px solid ${props => {
    switch (props.status) {
      case 'Pending': return '#F59E0B';
      case 'InProgress': return '#3B82F6';
      case 'Completed': return '#10B981';
      case 'Failed': return '#EF4444';
      case 'Cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  }};
`;

const CampaignHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const CampaignTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    switch (props.status) {
      case 'Pending': return '#FEF3C7';
      case 'InProgress': return '#DBEAFE';
      case 'Completed': return '#D1FAE5';
      case 'Failed': return '#FEE2E2';
      case 'Cancelled': return '#F3F4F6';
      default: return '#F3F4F6';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'Pending': return '#92400E';
      case 'InProgress': return '#1E40AF';
      case 'Completed': return '#065F46';
      case 'Failed': return '#991B1B';
      case 'Cancelled': return '#374151';
      default: return '#374151';
    }
  }};
`;

const CampaignInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 12px 0;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const InfoLabel = styled.span`
  font-size: 11px;
  color: #6B7280;
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 14px;
  color: #111827;
  font-weight: 600;
`;

const CampaignContent = styled.p`
  margin: 8px 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const CampaignActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #F3F4F6;
`;

const CancelButton = styled.button`
  padding: 6px 12px;
  background: #EF4444;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #DC2626;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #6B7280;
`;

const CreateCampaignButton = styled(DarkCyanButton)`
  width: 200px;
`;

const ModalContent = styled.div`
  padding: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #111827;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 10px;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  color: #111827;
  background: white;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #007D88;
  }
`;

const FileInput = styled.input`
  display: block;
  margin-top: 8px;
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 6px;
  background: #E5E7EB;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;

  div {
    height: 100%;
    width: ${props => Math.min(props.progress, 100)}%;
    background: #007D88;
    transition: width 0.3s ease;
  }
`;

// Секция управления каналами
const ChannelsManagementSection = styled.div`
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const ChannelsManagementTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #111827;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  flex-shrink: 0;
`;

const ChannelsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  flex: 1;
  align-content: start;
  overflow-y: auto;
  padding-right: 4px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #F1F1F1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #007D88;
    border-radius: 3px;
  }
`;

const ChannelCard = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid ${props => props.isActive ? '#007D88' : '#E5E7EB'};
  border-radius: 8px;
  background: ${props => props.isActive ? '#F0F9FA' : 'white'};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const ChannelInfo = styled.div`
  flex: 1;
`;

const ChannelName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
`;

const ChannelDetails = styled.div`
  font-size: 13px;
  color: #6B7280;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const ChannelStatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: ${props => {
    switch (props.status) {
      case 'Connected': return '#D1FAE5';
      case 'Disconnected': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'Connected': return '#065F46';
      case 'Disconnected': return '#991B1B';
      default: return '#374151';
    }
  }};
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ToggleSwitch = styled.div<{ isActive: boolean; disabled?: boolean }>`
  width: 48px;
  height: 26px;
  background: ${props => props.isActive ? '#007D88' : '#D1D5DB'};
  border-radius: 13px;
  position: relative;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  opacity: ${props => props.disabled ? 0.5 : 1};

  &::after {
    content: '';
    position: absolute;
    width: 22px;
    height: 22px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: ${props => props.isActive ? '24px' : '2px'};
    transition: all 0.3s ease;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }

  &:hover {
    opacity: ${props => props.disabled ? 0.5 : 0.85};
  }
`;

const ToggleLabel = styled.span<{ isActive: boolean }>`
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.isActive ? '#007D88' : '#6B7280'};
  min-width: 45px;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007D88;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const NoChannelsMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #6B7280;
  font-size: 14px;
`;

const PaginationWrapper = styled.div`
  flex-shrink: 0;
  padding-top: 16px;
  border-top: 1px solid #E5E7EB;
  margin-top: auto;
  background: white; /* Добавлено для фиксации пагинации */
`;

const BroadcastCampaignsManager: React.FC = () => {
  const {
    broadcastCampaigns,
    broadcastPagination,
    isLoading,
    error,
    createBroadcastCampaign,
    fetchBroadcastCampaigns,
    cancelBroadcastCampaign,
    toggleWhatsAppChannel,
  } = useAdminPanel();

  const { getChannels } = useWhatsApp();

  const [activeTab, setActiveTab] = useState<'campaigns' | 'channels'>('campaigns');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [togglingChannelId, setTogglingChannelId] = useState<string | null>(null);

  useEffect(() => {
    fetchBroadcastCampaigns(1, 10);
    loadChannels();
  }, []);

  const loadChannels = async () => {
    setIsLoadingChannels(true);
    try {
      const result = await getChannels();
      if (result && result.length > 0) {
        setChannels(result);
      } else {
        setChannels([]);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      setChannels([]);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('Заполните название и содержание кампании');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await createBroadcastCampaign({ title, content, file: file || null });
      if (success) {
        setTitle('');
        setContent('');
        setFile(null);
        setIsCreateModalOpen(false);
        await fetchBroadcastCampaigns(1, 10);
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
      alert('Ошибка при создании кампании');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCampaign = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите отменить эту рассылку?')) {
      return;
    }
    try {
      await cancelBroadcastCampaign(id);
      await fetchBroadcastCampaigns(broadcastPagination.page, broadcastPagination.pageSize);
    } catch (err) {
      console.error('Error cancelling campaign:', err);
      alert('Ошибка при отмене кампании');
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchBroadcastCampaigns(newPage, broadcastPagination.pageSize);
  };

  const handleToggleChannel = async (channelId: string, currentStatus: boolean) => {
    if (togglingChannelId === channelId) return;
    
    const channel = channels.find(ch => ch.id === channelId);
    if (!channel) return;

    const actionText = currentStatus ? 'отключить' : 'включить';
    if (!window.confirm(`Вы уверены, что хотите ${actionText} канал "${channel.name}"?`)) {
      return;
    }

    setTogglingChannelId(channelId);
    try {
      await toggleWhatsAppChannel(channelId);
      setChannels(prev => prev.map(ch => 
        ch.id === channelId ? { ...ch, enabled: !currentStatus } : ch
      ));
      alert(`Канал успешно ${currentStatus ? 'отключен' : 'включен'}`);
    } catch (error) {
      console.error('Error toggling channel:', error);
      alert('Произошла ошибка при изменении статуса канала');
    } finally {
      setTogglingChannelId(null);
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'Pending': return 'Ожидает';
      case 'InProgress': return 'В процессе';
      case 'Completed': return 'Завершена';
      case 'Failed': return 'Ошибка';
      case 'Cancelled': return 'Отменена';
      default: return status;
    }
  };

  const getProgress = (campaign: BroadcastCampaign): number => {
    if (campaign.totalRecipients === 0) return 0;
    return (campaign.sentCount / campaign.totalRecipients) * 100;
  };

  const renderCampaignsTab = () => (
    <CampaignsContentWrapper>
      <Header>
        <h2>Рекламные кампании</h2>
        <CreateCampaignButton onClick={() => setIsCreateModalOpen(true)}>
          + Создать кампанию
        </CreateCampaignButton>
      </Header>

      {error && (
        <div style={{ color: '#EF4444', marginBottom: '20px', padding: '12px', background: '#FEE2E2', borderRadius: '4px' }}>
          Ошибка: {error}
        </div>
      )}

      {(broadcastCampaigns === undefined || broadcastCampaigns.length === 0) && !isLoading ? (
        <EmptyState>
          <p>Нет созданных рекламных кампаний</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            Нажмите кнопку "Создать кампанию", чтобы начать
          </p>
        </EmptyState>
      ) : (
        <>
          <CampaignGrid>
            {broadcastCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} status={campaign.status}>
                <CampaignHeader>
                  <CampaignTitle>{campaign.title}</CampaignTitle>
                  <StatusBadge status={campaign.status}>
                    {getStatusText(campaign.status)}
                  </StatusBadge>
                </CampaignHeader>

                <CampaignContent>{campaign.message.content}</CampaignContent>

                <CampaignInfo>
                  <InfoItem>
                    <InfoLabel>Создана</InfoLabel>
                    <InfoValue>
                      {new Date(campaign.createdAt).toLocaleString('ru-RU')}
                    </InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Завершена</InfoLabel>
                    <InfoValue>
                      {campaign.completedAt 
                        ? new Date(campaign.completedAt).toLocaleString('ru-RU')
                        : '—'}
                    </InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Получатели</InfoLabel>
                    <InfoValue>{campaign.totalRecipients}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Отправлено</InfoLabel>
                    <InfoValue>{campaign.sentCount}</InfoValue>
                  </InfoItem>
                  {campaign.failedCount > 0 && (
                    <InfoItem>
                      <InfoLabel>Ошибок</InfoLabel>
                      <InfoValue style={{ color: '#EF4444' }}>
                        {campaign.failedCount}
                      </InfoValue>
                    </InfoItem>
                  )}
                </CampaignInfo>

                {campaign.status === 'InProgress' && (
                  <ProgressBar progress={getProgress(campaign)}>
                    <div />
                  </ProgressBar>
                )}

                <CampaignActions>
                  {campaign.status === 'Pending' && (
                    <CancelButton onClick={() => handleCancelCampaign(campaign.id)}>
                      Отменить рассылку
                    </CancelButton>
                  )}
                </CampaignActions>
              </CampaignCard>
            ))}
          </CampaignGrid>

          <PaginationWrapper>
            <PaginationLayout>
              <CountInfoTitle total={broadcastPagination.totalCount} />
              <Pagination
                total={broadcastPagination.totalCount}
                current={broadcastPagination.page}
                onChange={handlePageChange}
                itemsPerPage={broadcastPagination.pageSize}
              />
            </PaginationLayout>
          </PaginationWrapper>
        </>
      )}
    </CampaignsContentWrapper>
  );

  const renderChannelsTab = () => (
    <ChannelsManagementSection>
      <ChannelsManagementTitle>
        <span>Управление каналами</span>
        <DarkCyanButton 
          onClick={loadChannels} 
          disabled={isLoadingChannels}
          style={{ width: 'auto', padding: '6px 16px', fontSize: '13px' }}
        >
          {isLoadingChannels ? 'Обновление...' : 'Обновить'}
        </DarkCyanButton>
      </ChannelsManagementTitle>

      {isLoadingChannels && channels.length === 0 ? (
        <NoChannelsMessage>Загрузка каналов...</NoChannelsMessage>
      ) : channels.length === 0 ? (
        <NoChannelsMessage>
          Нет доступных WhatsApp каналов.
          <br />
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
            Перейдите в настройки WhatsApp для подключения каналов
          </span>
        </NoChannelsMessage>
      ) : (
        <ChannelsList>
          {channels.map((channel) => {
            const isActive = channel.enabled !== false;
            const isToggling = togglingChannelId === channel.id;
            
            return (
              <ChannelCard key={channel.id} isActive={isActive}>
                <ChannelInfo>
                  <ChannelName>{channel.name}</ChannelName>
                  <ChannelDetails>
                    {channel.phone && <span>📱 {channel.phone}</span>}
                    <ChannelStatusBadge status={channel.status}>
                      {channel.status === 'Connected' ? 'Подключен' : 'Не подключен'}
                    </ChannelStatusBadge>
                  </ChannelDetails>
                </ChannelInfo>
                
                <ToggleContainer>
                  <ToggleLabel isActive={isActive}>
                    {isActive ? 'Вкл' : 'Выкл'}
                  </ToggleLabel>
                  {isToggling ? (
                    <LoadingSpinner />
                  ) : (
                    <ToggleSwitch 
                      isActive={isActive} 
                      onClick={() => handleToggleChannel(channel.id, isActive)}
                      title={isActive ? 'Отключить канал' : 'Включить канал'}
                    />
                  )}
                </ToggleContainer>
              </ChannelCard>
            );
          })}
        </ChannelsList>
      )}
    </ChannelsManagementSection>
  );

  if (isLoading && (!broadcastCampaigns || broadcastCampaigns.length === 0) && isLoadingChannels) {
    return <Container>Загрузка...</Container>;
  }

  return (
    <Container>
      <TabsContainer>
        <Tab 
          active={activeTab === 'campaigns'} 
          onClick={() => setActiveTab('campaigns')}
        >
          📢 Рекламные кампании
        </Tab>
        <Tab 
          active={activeTab === 'channels'} 
          onClick={() => setActiveTab('channels')}
        >
          📱 WhatsApp каналы
        </Tab>
      </TabsContainer>

      <TabContent>
        {activeTab === 'campaigns' ? renderCampaignsTab() : renderChannelsTab()}
      </TabContent>

      <BaseModal
        title="Создание рекламной кампании"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCancel={() => setIsCreateModalOpen(false)}
        onSave={handleCreateCampaign}
        isSubmitting={isSubmitting}
        width="600px"
      >
        <ModalContent>
          <FormGroup>
            <FormLabel>Название кампании *</FormLabel>
            <CustomInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название кампании"
              required
            />
          </FormGroup>

          <FormGroup>
            <FormLabel>Содержание *</FormLabel>
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Введите текст сообщения для рассылки"
              required
            />
          </FormGroup>

          <FormGroup>
            <FormLabel>Файл (опционально)</FormLabel>
            <FileInput
              type="file"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  setFile(selectedFile);
                }
              }}
            />
            {file && (
              <div style={{ marginTop: '8px', fontSize: '14px', color: '#6B7280' }}>
                Выбран файл: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </FormGroup>
        </ModalContent>
      </BaseModal>
    </Container>
  );
};

export default BroadcastCampaignsManager;