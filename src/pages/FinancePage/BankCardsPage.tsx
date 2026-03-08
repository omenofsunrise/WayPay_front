import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import CustomInput from "../../components/ui/fields/CustomInput";
import Pagination from "../../components/ui/fields/CustomPagination";
import CustomTable from "../../components/ui/tables/CustomTable";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import PaginationLayout from "../../components/ui/Layouts/PaginationLayout";
import TitleField from "../../components/ui/Layouts/TitleLayout";
import CountInfoTitle from "../../components/ui/Text/CountInfoTitle";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import AddButton from '../../components/ui/Buttons/AddButton';
import useExport from '../../api/hooks/useExport';
import bankCardService from '../../api/services/bankCardService';
import type { BankCard, BankCardRequest, BankCardFilters, Withdraw } from '../../api/types/bankCard';
import { formatMoney } from '../../utils/formatPrice';
import { useAuth } from '../../сontext/AuthContext';
import type { ModalMode } from '../../components/modal/BASE/modalCRUBase';
import useBankCards from '../../api/hooks/useBankCard';
import BaseModal from '../../components/modal/BASE/modalCRUBase';
import { formatDate } from '../../utils/dateFormatter';
import Tabs from '../../components/ui/fields/Tabs';
import { number } from 'framer-motion';
import Checkbox from '../../components/ui/CheckBoxes/Checkbox';

const BankCardsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedCard, setSelectedCard] = useState<BankCard | null>(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'cards' | 'history'>('cards');
  const [withdraws, setWithdraws] = useState<Withdraw[]>([]);
  const [withdrawsTotalCount, setWithdrawsTotalCount] = useState(0);
  const [withdrawsCurrentPage, setWithdrawsCurrentPage] = useState(1);
  const [isWithdrawsLoading, setIsWithdrawsLoading] = useState(false);
  const [historyFilterCardId, setHistoryFilterCardId] = useState<number | null>(null);
  const [historyFilterCardName, setHistoryFilterCardName] = useState<string>('');
  const [isSettingCurrent, setIsSettingCurrent] = useState(false);
  
  const pageSize = 10;
  
  const { 
    isLoading, 
    error, 
    bankCards, 
    pagedResult, 
    getAll, 
    create, 
    update, 
    deleteBankCard,
    addWithdraw,
    getWithdraws,
    deleteWithdraw,
    setCurrentCard
  } = useBankCards();

  const { exportData, isExporting, exportProgress } = useExport<BankCard>();

  const loadBankCards = useCallback(async () => {
    const filters: BankCardFilters = {
      page: currentPage,
      pageSize
    };

    await getAll(filters);
  }, [currentPage, getAll]);

  const loadWithdraws = useCallback(async () => {
    setIsWithdrawsLoading(true);
    try {
      const filters: BankCardFilters = {
        page: withdrawsCurrentPage,
        pageSize,
        bankCardId: historyFilterCardId || undefined
      };
      
      const result = await getWithdraws(filters);
      if (result) {
        setWithdraws(result.items);
        setWithdrawsTotalCount(result.totalCount);
      }
    } catch (err) {
      console.error('Ошибка при загрузке истории выводов:', err);
    } finally {
      setIsWithdrawsLoading(false);
    }
  }, [withdrawsCurrentPage, historyFilterCardId, getWithdraws]);

  const clearHistoryFilter = () => {
    setHistoryFilterCardId(null);
    setHistoryFilterCardName('');
    setWithdrawsCurrentPage(1);
  };

  useEffect(() => {
    if (activeTab === 'cards') {
      loadBankCards();
    } else if (activeTab === 'history') {
      loadWithdraws();
    }
  }, [loadBankCards, loadWithdraws, activeTab]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadWithdraws();
    }
  }, [withdrawsCurrentPage, historyFilterCardId]);

  const handleExport = async () => {
    try {
      await exportData({
        fetchData: async (page, pageSize) => {
          const filters: BankCardFilters = {
            page,
            pageSize,
          };
          
          const result = await bankCardService.getAll(filters);
          return {
            items: result.items,
            totalCount: result.totalCount
          };
        },
        fileName: 'bank_cards_export',
        transformData: (card) => ({
          'ID': card.id.toString(),
          'Реквизиты': card.details,
          'Баланс': formatMoney(card.balance.toString()),
          'Сумма выплат': formatMoney(card.paymentsAmount.toString())
        })
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleSetCurrentCard = async (cardId: number) => {
    setIsSettingCurrent(true);
    try {
      await setCurrentCard(cardId);
      // Обновляем данные после изменения текущей карты
      await loadBankCards();
    } catch (err) {
      console.error('Ошибка при установке текущей карты:', err);
    } finally {
      setIsSettingCurrent(false);
    }
  };

  const formatBankCardsData = (cards: BankCard[] | undefined) => {
    if (!cards) return [];

    return cards.map(card => [
      card.id.toString(),
      card.details || '',
      formatMoney(card.paymentsAmount.toString()),
      formatMoney(card.balance.toString()),
      formatMoney(card.limit === null ? '0' : card.limit.toString()),
      card.usageCount === null ? '0' : card.usageCount.toString(),
      <CheckboxCell key={`checkbox-${card.id}`}>
        <Checkbox
          checked={card.isCurrent || false}
          onChange={() => handleSetCurrentCard(card.id)}
          disabled={isSettingCurrent}
        />
        {card.isCurrent && <CurrentBadge>Текущая</CurrentBadge>}
      </CheckboxCell>,
    ]);
  };

  const formatWithdrawsData = (withdraws: Withdraw[] | undefined) => {
    if (!withdraws) return [];

    return withdraws.map(withdraw => [
      withdraw.id.toString(),
      withdraw.bankCard.details,
      formatMoney(withdraw.amount.toString()),
      formatDate(withdraw.createdAt),
    ]);
  };

  const handleCreateCard = () => {
    setModalMode('create');
    setSelectedCard(null);
    setIsModalOpen(true);
  };

  const handleEditCard = (rowData: any[]) => {
    const rowIndex = tableData.indexOf(rowData);
    const card = bankCards?.[rowIndex];
    
    if (!card) return;
    
    setModalMode('edit');
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleDeleteCard = async (rowData: any[]) => {
    const rowIndex = tableData.indexOf(rowData);
    const card = bankCards?.[rowIndex];
    
    if (!card) return;
    
    if (window.confirm('Вы уверены, что хотите удалить эту карту?')) {
      try {
        await deleteBankCard(card.id);
        loadBankCards();
      } catch (err) {
        console.error('Ошибка при удалении карты:', err);
      }
    }
  };

  const handleViewHistory = (rowData: any[]) => {
    const rowIndex = tableData.indexOf(rowData);
    const card = bankCards?.[rowIndex];
    
    if (!card) return;
    
    setHistoryFilterCardId(card.id);
    setHistoryFilterCardName(card.details);
    setWithdrawsCurrentPage(1);
    setActiveTab('history');
  };

  const handleDeleteWithdraw = async (rowData: any[]) => {
    const rowIndex = withdrawsTableData.indexOf(rowData);
    const withdraw = withdraws?.[rowIndex];
    
    if (!withdraw) return;
    
    if (window.confirm('Вы уверены, что хотите удалить эту запись вывода?')) {
      try {
        await deleteWithdraw(withdraw.id);
        loadWithdraws();
      } catch (err) {
        console.error('Ошибка при удалении записи вывода:', err);
      }
    }
  };

  const handleWithdraw = (rowData: any[]) => {
    const rowIndex = tableData.indexOf(rowData);
    const card = bankCards?.[rowIndex];
    
    if (!card) return;
    
    setSelectedCard(card);
    setWithdrawAmount('');
    setIsWithdrawModalOpen(true);
  };

  const handleModalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const cardData: BankCardRequest = {
      details: formData.get('details') as string,
      limit: number.parse(formData.get('limit') as string)
    };

    try {
      if (modalMode === 'create') {
        await create(cardData);
      } else if (modalMode === 'edit' && selectedCard) {
        await update(selectedCard.id, cardData);
      }
      
      setIsModalOpen(false);
      loadBankCards();
    } catch (err) {
      console.error('Ошибка при сохранении карты:', err);
    }
  };

  const handleWithdrawSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCard) return;
    
    const amount = parseFloat(withdrawAmount);
    
    if (isNaN(amount) || amount <= 0) {
      alert('Введите корректную сумму');
      return;
    }
    
    if (amount > selectedCard.balance) {
      alert(`Нельзя снять больше баланса. Максимально доступно: ${formatMoney(selectedCard.balance.toString())}`);
      return;
    }
    
    try {
      await addWithdraw(selectedCard.id, amount);
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      loadBankCards();
    } catch (err) {
      console.error('Ошибка при снятии средств:', err);
    }
  };

  const tableData = formatBankCardsData(bankCards);
  const withdrawsTableData = formatWithdrawsData(withdraws);

  const cardsTableActions = [
    {
      label: 'Редактировать',
      action: handleEditCard,
      color: '#007D88',
    },
    {
      label: 'Снять средства',
      action: handleWithdraw,
      color: '#007D88',
      shouldShow: (rowData: any[]) => {
        const rowIndex = tableData.indexOf(rowData);
        const card = bankCards?.[rowIndex];
        return card && card.balance > 0;
      }
    },
    {
      label: 'История выводов',
      action: handleViewHistory,
      color: '#666',
    },
    {
      label: 'Удалить',
      action: handleDeleteCard,
      color: '#EF4444',
    }
  ];

  const withdrawsTableActions = [
    {
      label: 'Удалить запись',
      action: handleDeleteWithdraw,
      color: '#EF4444',
    }
  ];

  const tabs = [
    {
      id: 'cards',
      label: 'Банковские карты',
      content: (
        <>
          <CustomTable 
            columns={[
              { name: "ID", isSortable: true, align: "center" },
              { name: "Реквизиты", isSortable: true, align: "left" },
              { name: "Всего выплат", isSortable: true, align: "right" },
              { name: "Баланс", isSortable: true, align: "right" },
              { name: "Лимит", align: "right" },
              { name: "Отправлено раз", align: "right" },
              { name: "Текущая", align: "center" },
            ]} 
            data={tableData}
            contextMenuActions={cardsTableActions}
          />
          
          <PaginationLayout>
            <CountInfoTitle 
              total={pagedResult?.totalCount || 0} 
            />
            
            <Pagination
              total={pagedResult?.totalCount || 0}
              current={currentPage}
              onChange={setCurrentPage}
              itemsPerPage={pageSize}
            />
          </PaginationLayout>
        </>
      )
    },
    {
      id: 'history',
      label: 'История выводов',
      content:
        <>
          {/* Блок фильтрации */}
          {historyFilterCardId && (
            <HistoryFilterBlock>
              <FilterInfo>
                <FilterCardInfo>{historyFilterCardName}</FilterCardInfo>
              </FilterInfo>
              <ClearFilterButton onClick={clearHistoryFilter}>
                Сбросить фильтр
              </ClearFilterButton>
            </HistoryFilterBlock>
          )}
          
          {isWithdrawsLoading && <LoadingMessage>Загрузка истории...</LoadingMessage>}
          
          {!isWithdrawsLoading && withdraws.length > 0 && (
            <>
              <CustomTable 
                columns={[
                  { name: "ID", isSortable: true, align: "center" },
                  { name: "Карта", isSortable: true, align: "left" },
                  { name: "Сумма", isSortable: true, align: "right" },
                  { name: "Дата и время", isSortable: true, align: "center" },
                ]} 
                data={withdrawsTableData}
                contextMenuActions={withdrawsTableActions}
              />
              
              <PaginationLayout>
                <CountInfoTitle 
                  total={withdrawsTotalCount} 
                />
                
                <Pagination
                  total={withdrawsTotalCount}
                  current={withdrawsCurrentPage}
                  onChange={setWithdrawsCurrentPage}
                  itemsPerPage={pageSize}
                />
              </PaginationLayout>
            </>
          )}
          
          {!isWithdrawsLoading && withdraws.length === 0 && (
            <NoDataMessage>
              {historyFilterCardId 
                ? 'Нет записей о выводах для выбранной карты' 
                : 'Нет записей о выводах карт'}
            </NoDataMessage>
          )}
        </>
    }
  ];

  return (
    <PageLayout>
      <TitleField style={{ gap: "35px" }}>
        <CustomTitle>Банковские карты</CustomTitle>
        <AddButton onClick={handleCreateCard}></AddButton>
      </TitleField>
      
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => {
          setActiveTab(tabId as 'cards' | 'history');
          if (tabId === 'history') {
            loadWithdraws();
          }
        }}
      />
      
      {activeTab === 'cards' && isLoading && <LoadingMessage>Загрузка...</LoadingMessage>}
      {activeTab === 'cards' && error && <ErrorMessage>Ошибка: {error}</ErrorMessage>}

      {isModalOpen && (
        <BaseModal
          title={modalMode === 'create' ? 'Добавить карту' : 'Редактировать карту'}
          onClose={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
          onSave={handleModalSave}
          mode={modalMode}
        >
          <FormField>
            <CustomInput
              inputType="text"
              placeholder='Реквизиты'
              name="details"
              defaultValue={selectedCard?.details || ''}
              required
            />
          </FormField>
          <FormField>
            <CustomInput
              type="text"
              inputMode="numeric"
              pattern="\d*"
              name="limit"
              placeholder='Лимит'
              defaultValue={selectedCard?.limit || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                e.target.value = value;
              }}
            />
          </FormField>
        </BaseModal>
      )}

      {isWithdrawModalOpen && selectedCard && (
        <BaseModal
          title="Снять средства"
          onClose={() => setIsWithdrawModalOpen(false)}
          onCancel={() => setIsWithdrawModalOpen(false)}
          onSave={handleWithdrawSave}
        >
          <FormField>
            <Label>Карта:</Label>
            <CardInfo>{selectedCard.details}</CardInfo>
          </FormField>
          <FormField>
            <Label>Текущий баланс:</Label>
            <BalanceInfo>
              {formatMoney(selectedCard.balance.toString())}
            </BalanceInfo>
          </FormField>
          <FormField>
            <Label>Сумма для снятия:</Label>
            <CustomInput
              inputType="number"
              placeholder="Введите сумму"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              min="0"
              max={selectedCard.balance}
              step="0.01"
              required
            />
            <Hint>Максимально доступно: {formatMoney(selectedCard.balance.toString())}</Hint>
          </FormField>
        </BaseModal>
      )}
    </PageLayout>
  );
};

export default BankCardsPage;

// Стили для новых компонентов
const CheckboxCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const CurrentBadge = styled.span`
  background-color: #007D88;
  color: white;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
`;

const FormField = styled.div`
  margin: 20px 0 20px;
`;

const Label = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
`;

const CardInfo = styled.div`
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 5px;
  border: 1px solid #ddd;
  font-weight: 500;
  color: #333;
`;

const BalanceInfo = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #007D88;
  padding: 10px;
  background-color: #f0f9fa;
  border-radius: 5px;
  border: 1px solid #b3e0e3;
`;

const Hint = styled.div`
  font-size: 14px;
  color: #666;
  margin-top: 5px;
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  margin: 20px 0;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #007D88;
  font-size: 16px;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #EF4444;
  font-size: 16px;
  background-color: #fef2f2;
  border-radius: 8px;
  margin: 20px 0;
`;

const HistoryFilterBlock = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const FilterInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FilterCardInfo = styled.span`
  font-weight: 600;
  color: #007D88;
  background-color: white;
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #b3e0e3;
`;

const ClearFilterButton = styled.button`
  padding: 8px 16px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e5e7eb;
    border-color: #9ca3af;
  }
`;