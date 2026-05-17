import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import CustomTitle from '../../components/ui/Text/CustomTitle';
import DarkCyanButton from '../../components/ui/Buttons/DarkCyanButton';
import GrayButton from '../../components/ui/Buttons/GrayButton';
import CustomInput from '../../components/ui/fields/CustomInput';
import useWhatsApp from '../../api/hooks/useWhatsApp';
import type { BotResponse, BotType, BotEventType } from '../../api/types/whatsapp';
import { BotResponseTextType } from '../../api/types/whatsapp';
import BotResponseConstructor from './BotResponseConstructor';
import { validateBotTemplate } from './botTemplateVariables';

const BOT_TYPE_LABEL: Record<BotType, string> = {
  Keywords: 'По ключевым словам',
  Events: 'По событию',
};

const EVENT_LABEL: Record<BotEventType, string> = {
  CreatedCredit: 'Создание рассрочки',
  CreatedPayment: 'Создание платежа',
  ClientBirthdate: 'День рождения клиента',
};

const EVENT_OPTIONS: BotEventType[] = ['CreatedCredit', 'CreatedPayment', 'ClientBirthdate'];

const BotManagementPage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();

  const {
    loadBotsByChannel,
    createBot,
    updateBot,
    deleteBot,
    addBotKeyword,
    deleteBotKeyword,
    setBotResponse,
    setBotEvent,
    bots,
    isLoading,
  } = useWhatsApp();

  const [localBots, setLocalBots] = useState<BotResponse[]>([]);

  const [ruleModal, setRuleModal] = useState<{
    isOpen: boolean;
    editingRule: BotResponse | null;
    name: string;
    isActive: boolean;
    botType: BotType;
    saving: boolean;
  }>({
    isOpen: false,
    editingRule: null,
    name: '',
    isActive: true,
    botType: 'Keywords',
    saving: false,
  });

  const [responseModal, setResponseModal] = useState<{
    isOpen: boolean;
    rule: BotResponse | null;
    response: string;
    kind: 'main' | 'noClient';
    saving: boolean;
  }>({
    isOpen: false,
    rule: null,
    response: '',
    kind: 'main',
    saving: false,
  });

  const [keywordModal, setKeywordModal] = useState<{
    isOpen: boolean;
    rule: BotResponse | null;
    keyword: string;
    matchType: 'Exact' | 'Contains' | 'StartsWith';
    adding: boolean;
  }>({
    isOpen: false,
    rule: null,
    keyword: '',
    matchType: 'Contains',
    adding: false,
  });

  const [eventModal, setEventModal] = useState<{
    isOpen: boolean;
    rule: BotResponse | null;
    eventType: BotEventType;
    saving: boolean;
  }>({
    isOpen: false,
    rule: null,
    eventType: 'CreatedCredit',
    saving: false,
  });

  useEffect(() => {
    if (channelId) {
      loadRules();
    }
  }, [channelId]);

  useEffect(() => {
    setLocalBots(bots);
  }, [bots]);

  const loadRules = async () => {
    if (channelId) {
      await loadBotsByChannel(channelId);
    }
  };

  // === Управление правилами ===
  const handleCreateRule = () => {
    setRuleModal({
      isOpen: true,
      editingRule: null,
      name: '',
      isActive: true,
      botType: 'Keywords',
      saving: false,
    });
  };

  const handleEditRule = (rule: BotResponse) => {
    setRuleModal({
      isOpen: true,
      editingRule: rule,
      name: rule.name,
      isActive: rule.isActive,
      botType: rule.botType,
      saving: false,
    });
  };

  const handleSaveRule = async () => {
    if (!ruleModal.name.trim()) {
      alert('Введите название правила');
      return;
    }

    setRuleModal(prev => ({ ...prev, saving: true }));

    try {
      if (ruleModal.editingRule) {
        await updateBot(ruleModal.name, ruleModal.editingRule.id, ruleModal.isActive);
        alert('Название правила обновлено');
      } else {
        if (!channelId) return;
        const newBot = await createBot(channelId, ruleModal.name, ruleModal.botType);
        if (newBot && ruleModal.isActive !== undefined) {
          await updateBot(newBot.name, newBot.id, ruleModal.isActive);
        }
        alert('Правило создано');
      }
      await loadRules();
      setRuleModal(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Error saving rule:', error);
      alert('Ошибка при сохранении');
    } finally {
      setRuleModal(prev => ({ ...prev, saving: false }));
    }
  };

  const handleToggleRule = async (rule: BotResponse) => {
    try {
      await updateBot(rule.name, rule.id, !rule.isActive);
      await loadRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      alert('Ошибка при изменении статуса');
    }
  };

  const handleDeleteRule = async (rule: BotResponse) => {
    if (!confirm(`Удалить правило "${rule.name}"?`)) return;

    try {
      await deleteBot(rule.id);
      await loadRules();
      alert('Правило удалено');
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Ошибка при удалении');
    }
  };

  // === Управление ответами ===
  const handleEditResponse = (rule: BotResponse) => {
    setResponseModal({
      isOpen: true,
      rule,
      response: rule.botResponse || '',
      kind: 'main',
      saving: false,
    });
  };

  const handleEditNoClientResponse = (rule: BotResponse) => {
    setResponseModal({
      isOpen: true,
      rule,
      response: rule.botNoClientResponse || '',
      kind: 'noClient',
      saving: false,
    });
  };

  const handleSaveResponse = async () => {
    if (!responseModal.response.trim()) {
      alert('Введите ответ бота');
      return;
    }

    if (!responseModal.rule) return;

    const issues = validateBotTemplate(responseModal.response);
    if (issues.length > 0) {
      const confirmSave = confirm(
        `Найдены проблемы в шаблоне:\n\n${issues.map(i => '• ' + i.message).join('\n')}\n\nСохранить всё равно?`
      );
      if (!confirmSave) return;
    }

    setResponseModal(prev => ({ ...prev, saving: true }));

    try {
      const type = responseModal.kind === 'noClient' ? BotResponseTextType.WhatsAppBotNoClientResponse : undefined;
      await setBotResponse(responseModal.rule.id, responseModal.response, type);
      await loadRules();
      alert('Ответ обновлен');
      setResponseModal(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Error saving response:', error);
      alert('Ошибка при сохранении ответа');
    } finally {
      setResponseModal(prev => ({ ...prev, saving: false }));
    }
  };

  // === Управление ключевыми словами ===
  const handleOpenKeywords = (rule: BotResponse) => {
    setKeywordModal({
      isOpen: true,
      rule,
      keyword: '',
      matchType: 'Contains',
      adding: false,
    });
  };

  const handleAddKeyword = async () => {
    if (!keywordModal.keyword.trim()) {
      alert('Введите ключевое слово');
      return;
    }
    if (!keywordModal.rule) return;

    setKeywordModal(prev => ({ ...prev, adding: true }));

    try {
      await addBotKeyword(keywordModal.rule.id, keywordModal.matchType, keywordModal.keyword.trim());
      await loadRules();
      setKeywordModal(prev => ({ ...prev, keyword: '' }));
      alert('Ключевое слово добавлено');
    } catch (error) {
      console.error('Error adding keyword:', error);
      alert('Ошибка при добавлении');
    } finally {
      setKeywordModal(prev => ({ ...prev, adding: false }));
    }
  };

  const handleDeleteKeyword = async (keywordId: number, ruleId: number) => {
    if (!confirm('Удалить ключевое слово?')) return;

    try {
      await deleteBotKeyword(keywordId, ruleId);
      await loadRules();
    } catch (error) {
      console.error('Error deleting keyword:', error);
      alert('Ошибка при удалении');
    }
  };

  // === Управление событием ===
  const handleOpenEvent = (rule: BotResponse) => {
    setEventModal({
      isOpen: true,
      rule,
      eventType: rule.event ?? 'CreatedCredit',
      saving: false,
    });
  };

  const handleSaveEvent = async () => {
    if (!eventModal.rule) return;
    setEventModal(prev => ({ ...prev, saving: true }));
    try {
      await setBotEvent(eventModal.rule.id, eventModal.eventType);
      await loadRules();
      alert('Событие установлено');
      setEventModal(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Ошибка при установке события');
    } finally {
      setEventModal(prev => ({ ...prev, saving: false }));
    }
  };

  const getMatchTypeLabel = (type: string) => {
    const types = {
      Exact: 'Точно совпадает',
      Contains: 'Содержит',
      StartsWith: 'Начинается с',
    };
    return types[type as keyof typeof types] || type;
  };

  const getMatchTypeColor = (type: string) => {
    const colors = {
      Exact: '#1890ff',
      Contains: '#52c41a',
      StartsWith: '#faad14',
    };
    return colors[type as keyof typeof colors] || '#666';
  };

  if (isLoading && localBots.length === 0) {
    return (
      <Container>
        <LoadingText>Загрузка...</LoadingText>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate(-1)}>← Назад</BackButton>
        <Title>Правила бота</Title>
        <DarkCyanButton onClick={handleCreateRule}>➕ Новое правило</DarkCyanButton>
      </Header>

      {localBots.length === 0 ? (
        <EmptyState>
          <EmptyTitle>Нет правил</EmptyTitle>
          <EmptyText>Создайте первое правило для автоматических ответов</EmptyText>
        </EmptyState>
      ) : (
        <RulesGrid>
          {localBots.map(rule => {
            const isEventsBot = rule.botType === 'Events';
            return (
            <RuleCard key={rule.id} $isActive={rule.isActive}>
              <CardHeader>
                <CardTitleRow>
                  <RuleName>{rule.name || 'Без названия'}</RuleName>
                  <TypeBadge $kind={rule.botType}>
                    {rule.botType === 'Events' ? '⚡' : '🔑'} {BOT_TYPE_LABEL[rule.botType]}
                  </TypeBadge>
                  <StatusBadge $isActive={rule.isActive}>
                    {rule.isActive ? '✅ Активно' : '⭕ Отключено'}
                  </StatusBadge>
                </CardTitleRow>
                <CardActions>
                  <ActionButton onClick={() => handleToggleRule(rule)} title={rule.isActive ? 'Отключить' : 'Активировать'}>
                    {rule.isActive ? '🔇' : '▶️'}
                  </ActionButton>
                  <ActionButton onClick={() => handleEditRule(rule)} title="Редактировать название">
                    ✏️
                  </ActionButton>
                  {!isEventsBot && (
                    <ActionButton onClick={() => handleOpenKeywords(rule)} title="Ключевые слова">
                      🔑
                    </ActionButton>
                  )}
                  {isEventsBot && (
                    <ActionButton onClick={() => handleOpenEvent(rule)} title="Событие">
                      ⚡
                    </ActionButton>
                  )}
                  <ActionButtonDelete onClick={() => handleDeleteRule(rule)} title="Удалить">
                    🗑️
                  </ActionButtonDelete>
                </CardActions>
              </CardHeader>

              <ResponseBlock onClick={() => handleEditResponse(rule)}>
                <ResponseLabel>
                  💬 Ответ бота:
                  <EditHint>✏️ нажмите для редактирования</EditHint>
                </ResponseLabel>
                <ResponseText>{rule.botResponse || '— Нажмите чтобы добавить ответ —'}</ResponseText>
              </ResponseBlock>

              {!isEventsBot && (
                <ResponseBlock onClick={() => handleEditNoClientResponse(rule)}>
                  <ResponseLabel>
                    🙈 Ответ если клиента нет в базе:
                    <EditHint>✏️ нажмите для редактирования</EditHint>
                  </ResponseLabel>
                  <ResponseText>{rule.botNoClientResponse || '— Нажмите чтобы добавить ответ —'}</ResponseText>
                </ResponseBlock>
              )}

              {isEventsBot ? (
                <EventBlock onClick={() => handleOpenEvent(rule)}>
                  <ResponseLabel>
                    ⚡ Событие для рассылки:
                    <EditHint>✏️ нажмите для редактирования</EditHint>
                  </ResponseLabel>
                  <ResponseText>
                    {rule.event ? EVENT_LABEL[rule.event] : '— Нажмите чтобы выбрать событие —'}
                  </ResponseText>
                </EventBlock>
              ) : rule.keywords && rule.keywords.length > 0 ? (
                <KeywordsBlock>
                  <KeywordsLabel>Ключевые слова:</KeywordsLabel>
                  <KeywordsList>
                    {rule.keywords.map(kw => (
                      <KeywordChip key={kw.id} $color={getMatchTypeColor(kw.matchType)} title={getMatchTypeLabel(kw.matchType)}>
                        <KeywordValue>“{kw.keyword}”</KeywordValue>
                        <RemoveChip onClick={() => handleDeleteKeyword(kw.id, rule.id)}>✖</RemoveChip>
                      </KeywordChip>
                    ))}
                    <AddKeywordIcon onClick={() => handleOpenKeywords(rule)} title="Добавить ключевое слово">
                        ➕
                    </AddKeywordIcon>
                  </KeywordsList>
                </KeywordsBlock>
              ) : (
                <EmptyKeywords onClick={() => handleOpenKeywords(rule)}>
                  🔑 Нет ключевых слов — нажмите чтобы добавить
                </EmptyKeywords>
              )}
            </RuleCard>
            );
          })}
        </RulesGrid>
      )}

      {ruleModal.isOpen && (
        <ModalOverlay onClick={() => !ruleModal.saving && setRuleModal(prev => ({ ...prev, isOpen: false }))}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {ruleModal.editingRule ? 'Редактировать название правила' : '➕ Новое правило'}
              </ModalTitle>
              <CloseBtn onClick={() => !ruleModal.saving && setRuleModal(prev => ({ ...prev, isOpen: false }))}>✖</CloseBtn>
            </ModalHeader>

            <FormField>
              <Label>Название правила</Label>
              <CustomInput
                value={ruleModal.name}
                onChange={e => setRuleModal(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Например: Приветствие"
                disabled={ruleModal.saving}
              />
            </FormField>

            {!ruleModal.editingRule && (
              <FormField>
                <Label>Тип правила</Label>
                <TypeOptions>
                  <TypeOption
                    type="button"
                    $selected={ruleModal.botType === 'Keywords'}
                    onClick={() => setRuleModal(prev => ({ ...prev, botType: 'Keywords' }))}
                    disabled={ruleModal.saving}
                  >
                    <TypeOptionTitle>🔑 По ключевым словам</TypeOptionTitle>
                    <TypeOptionHint>Бот отвечает на сообщения, содержащие заданные слова</TypeOptionHint>
                  </TypeOption>
                  <TypeOption
                    type="button"
                    $selected={ruleModal.botType === 'Events'}
                    onClick={() => setRuleModal(prev => ({ ...prev, botType: 'Events' }))}
                    disabled={ruleModal.saving}
                  >
                    <TypeOptionTitle>⚡ По событию</TypeOptionTitle>
                    <TypeOptionHint>Бот делает рассылку при наступлении события</TypeOptionHint>
                  </TypeOption>
                </TypeOptions>
              </FormField>
            )}

            <ModalActions>
              <GrayButton onClick={() => setRuleModal(prev => ({ ...prev, isOpen: false }))} disabled={ruleModal.saving}>
                Отмена
              </GrayButton>
              <DarkCyanButton onClick={handleSaveRule} disabled={ruleModal.saving}>
                {ruleModal.saving ? '💾 Сохранение...' : 'Сохранить'}
              </DarkCyanButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {responseModal.isOpen && responseModal.rule && (
        <ModalOverlay onClick={() => !responseModal.saving && setResponseModal(prev => ({ ...prev, isOpen: false }))}>
          <WideModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {responseModal.kind === 'noClient'
                  ? `Ответ если клиента нет — ${responseModal.rule.name}`
                  : `Конструктор ответа — ${responseModal.rule.name}`}
              </ModalTitle>
              <CloseBtn onClick={() => !responseModal.saving && setResponseModal(prev => ({ ...prev, isOpen: false }))}>✖</CloseBtn>
            </ModalHeader>

            {responseModal.kind === 'noClient' && (
              <NoClientHint>
                ℹ️ В этом ответе доступны только переменные группы «Глобальные — Компания»
              </NoClientHint>
            )}

            <BotResponseConstructor
              value={responseModal.response}
              onChange={next => setResponseModal(prev => ({ ...prev, response: next }))}
              disabled={responseModal.saving}
              mode={responseModal.kind === 'noClient' ? 'companyOnly' : 'default'}
              event={responseModal.rule.botType === 'Events' ? (responseModal.rule.event ?? null) : null}
            />

            <ModalActions>
              <GrayButton onClick={() => setResponseModal(prev => ({ ...prev, isOpen: false }))} disabled={responseModal.saving}>
                Отмена
              </GrayButton>
              <DarkCyanButton onClick={handleSaveResponse} disabled={responseModal.saving}>
                {responseModal.saving ? '💾 Сохранение...' : 'Сохранить ответ'}
              </DarkCyanButton>
            </ModalActions>
          </WideModalContent>
        </ModalOverlay>
      )}

      {keywordModal.isOpen && keywordModal.rule && (
        <ModalOverlay onClick={() => !keywordModal.adding && setKeywordModal(prev => ({ ...prev, isOpen: false }))}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Ключевые слова — {keywordModal.rule.name}</ModalTitle>
              <CloseBtn onClick={() => !keywordModal.adding && setKeywordModal(prev => ({ ...prev, isOpen: false }))}>✖</CloseBtn>
            </ModalHeader>

            <FormField>
              <Label>Тип совпадения</Label>
              <Select
                value={keywordModal.matchType}
                onChange={e => setKeywordModal(prev => ({ ...prev, matchType: e.target.value as 'Exact' | 'Contains' | 'StartsWith' }))}
                disabled={keywordModal.adding}
              >
                <option value="Contains">Содержит — слово есть где-то в сообщении</option>
                <option value="StartsWith">Начинается с — сообщение начинается со слова</option>
                <option value="Exact">Точно совпадает — сообщение полностью равно слову</option>
              </Select>
            </FormField>

            <FormField>
              <Label>Ключевое слово</Label>
              <AddKeywordRow>
                <CustomInput
                  value={keywordModal.keyword}
                  onChange={e => setKeywordModal(prev => ({ ...prev, keyword: e.target.value }))}
                  placeholder="Введите ключевое слово..."
                  disabled={keywordModal.adding}
                  onKeyPress={e => e.key === 'Enter' && handleAddKeyword()}
                />
                <DarkCyanButton onClick={handleAddKeyword} disabled={keywordModal.adding || !keywordModal.keyword.trim()}>
                  {keywordModal.adding ? '⏳' : '➕ Добавить'}
                </DarkCyanButton>
              </AddKeywordRow>
            </FormField>

            {keywordModal.rule.keywords && keywordModal.rule.keywords.length > 0 && (
              <KeywordsSection>
                <Label>Список ключевых слов:</Label>
                <KeywordsListVertical>
                  {keywordModal.rule.keywords.map(kw => (
                    <KeywordRow key={kw.id}>
                      <KeywordText>“{kw.keyword}”</KeywordText>
                      <DeleteKeyword onClick={() => handleDeleteKeyword(kw.id, keywordModal.rule!.id)}>
                        🗑️ Удалить
                      </DeleteKeyword>
                    </KeywordRow>
                  ))}
                </KeywordsListVertical>
              </KeywordsSection>
            )}

            <ModalActions>
              <GrayButton onClick={() => setKeywordModal(prev => ({ ...prev, isOpen: false }))} disabled={keywordModal.adding}>
                Закрыть
              </GrayButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {eventModal.isOpen && eventModal.rule && (
        <ModalOverlay onClick={() => !eventModal.saving && setEventModal(prev => ({ ...prev, isOpen: false }))}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Событие для рассылки — {eventModal.rule.name}</ModalTitle>
              <CloseBtn onClick={() => !eventModal.saving && setEventModal(prev => ({ ...prev, isOpen: false }))}>✖</CloseBtn>
            </ModalHeader>

            <FormField>
              <Label>Событие</Label>
              <Select
                value={eventModal.eventType}
                onChange={e => setEventModal(prev => ({ ...prev, eventType: e.target.value as BotEventType }))}
                disabled={eventModal.saving}
              >
                {EVENT_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{EVENT_LABEL[opt]}</option>
                ))}
              </Select>
            </FormField>

            <ModalActions>
              <GrayButton onClick={() => setEventModal(prev => ({ ...prev, isOpen: false }))} disabled={eventModal.saving}>
                Отмена
              </GrayButton>
              <DarkCyanButton onClick={handleSaveEvent} disabled={eventModal.saving}>
                {eventModal.saving ? '💾 Сохранение...' : 'Сохранить'}
              </DarkCyanButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #007d88;
  padding: 8px 12px;
  border-radius: 6px;

  &:hover {
    background: #e8e8e8;
  }
`;

const Title = styled(CustomTitle)`
  margin: 0;
  flex: 1;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 60px;
  color: #999;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
`;

const EmptyTitle = styled.h3`
  font-size: 20px;
  color: #333;
  margin-bottom: 8px;
`;

const EmptyText = styled.p`
  color: #999;
  font-size: 14px;
`;

const RulesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const RuleCard = styled.div<{ $isActive: boolean }>`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  opacity: ${props => props.$isActive ? 1 : 0.6};
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
`;

const CardTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const RuleName = styled.h4`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #333;
`;

const StatusBadge = styled.span<{ $isActive: boolean }>`
  background: ${props => props.$isActive ? '#52c41a' : '#8c8c8c'};
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
`;

const TypeBadge = styled.span<{ $kind: BotType }>`
  background: ${props => props.$kind === 'Events' ? '#7c3aed' : '#007d88'};
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
`;

const CardActions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  align-items: center;
`;

const ActionButton = styled.button`
  background: none;
  border: 1px solid #d9d9d9;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;

  &:hover {
    border-color: #007d88;
    transform: scale(1.05);
  }
`;

const ActionButtonDelete = styled(ActionButton)`
  &:hover {
    border-color: #ff4d4f;
    background: #fff1f0;
  }
`;

const ResponseBlock = styled.div`
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:hover {
    background: #f0f0f0;
    border-color: #007d88;
    transform: translateX(4px);
  }
`;

const EventBlock = styled(ResponseBlock)`
  &:hover {
    border-color: #7c3aed;
  }
`;

const ResponseLabel = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EditHint = styled.span`
  font-size: 11px;
  color: #007d88;
  font-weight: normal;
`;

const ResponseText = styled.div`
  font-size: 14px;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
`;

const KeywordsBlock = styled.div`
  margin-top: 12px;
`;

const KeywordsLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 10px;
  text-align: left;
`;

const KeywordsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const AddKeywordIcon = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px 8px;
  border-radius: 6px;
  color: #007d88;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: #f0f9ff;
    transform: scale(1.05);
  }
`;

const KeywordChip = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  border-radius: 24px;
  overflow: hidden;
  font-size: 13px;
  padding-left: 15px;
  border-left: 4px solid ${p => p.$color};
`;

const KeywordValue = styled.span`
  padding: 6px 0;
  color: #333;
  font-weight: 500;
`;

const RemoveChip = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #999;
  padding: 0 12px;
  height: 100%;

  &:hover {
    color: #ff4d4f;
    background: rgba(255, 77, 79, 0.1);
  }
`;

const EmptyKeywords = styled.div`
  text-align: center;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  border: 1px dashed #d9d9d9;
  transition: all 0.2s;

  &:hover {
    border-color: #007d88;
    color: #007d88;
    background: #f0f9ff;
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
  width: 550px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 28px;
`;

const WideModalContent = styled(ModalContent)`
  width: 1100px;
  max-width: 95vw;
  max-height: 92vh;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #333;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 4px 8px;

  &:hover {
    color: #333;
  }
`;

const FormField = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
  text-align: left;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #007d88;
  }
`;

const AddKeywordRow = styled.div`
  display: flex;
  gap: 12px;

  > div {
    flex: 1;
  }
`;

const KeywordsSection = styled.div`
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
`;

const KeywordsListVertical = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  max-height: 300px;
  overflow-y: auto;
`;

const KeywordRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f9f9f9;
  padding: 10px 14px;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #f0f0f0;
  }
`;

const KeywordText = styled.span`
  font-size: 14px;
  color: #333;
  flex: 1;
  font-family: monospace;
`;

const DeleteKeyword = styled.button`
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #fff1f0;
    text-decoration: none;
  }
`;

const TypeOptions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const TypeOption = styled.button<{ $selected: boolean; disabled?: boolean }>`
  background: ${p => p.$selected ? '#f0f9ff' : 'white'};
  border: 2px solid ${p => p.$selected ? '#007d88' : '#e5e7eb'};
  border-radius: 10px;
  padding: 14px 16px;
  text-align: left;
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${p => p.disabled ? 0.5 : 1};
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    border-color: #007d88;
    transform: translateY(-1px);
  }
`;

const TypeOptionTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const TypeOptionHint = styled.span`
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
`;

const NoClientHint = styled.div`
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-left: 3px solid #f59e0b;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #92400e;
  line-height: 1.5;
`;

export default BotManagementPage;
