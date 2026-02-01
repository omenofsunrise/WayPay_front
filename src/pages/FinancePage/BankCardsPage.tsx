import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import CustomInput from "../../components/ui/fields/CustomInput";
import Pagination from "../../components/ui/fields/CustomPagination";
import CustomTable from "../../components/ui/tables/CustomTable";
import FilterField from "../../components/ui/Layouts/FilterField";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import PaginationLayout from "../../components/ui/Layouts/PaginationLayout";
import TitleField from "../../components/ui/Layouts/TitleLayout";
import CountInfoTitle from "../../components/ui/Text/CountInfoTitle";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import AddButton from '../../components/ui/Buttons/AddButton';
import useExport from '../../api/hooks/useExport';
import bankCardService from '../../api/services/bankCardService';
import type { BankCard, BankCardRequest, BankCardFilters } from '../../api/types/bankCard';
import { formatMoney } from '../../utils/formatPrice';
import { useAuth } from '../../сontext/AuthContext';
import type { ModalMode } from '../../components/modal/BASE/modalCRUBase';
import useBankCards from '../../api/hooks/useBankCard';
import BaseModal from '../../components/modal/BASE/modalCRUBase';

const BankCardsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedCard, setSelectedCard] = useState<BankCard | null>(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  const pageSize = 10;
  const { authInfo } = useAuth();
  
  const { 
    isLoading, 
    error, 
    bankCards, 
    pagedResult, 
    getAll, 
    create, 
    update, 
    deleteBankCard,
    addWithdraw 
  } = useBankCards();

  const { exportData, isExporting, exportProgress } = useExport<BankCard>();

  const loadBankCards = useCallback(async () => {
    const filters: BankCardFilters = {
      page: currentPage,
      pageSize
    };

    await getAll(filters);
  }, [currentPage, sortConfig, getAll]);

  useEffect(() => {
    loadBankCards();
  }, [loadBankCards]);

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

  const formatBankCardsData = (cards: BankCard[] | undefined) => {
    if (!cards) return [];

    return cards.map(card => [
      card.id.toString(),
      card.details || '',
      formatMoney(card.paymentsAmount.toString()),
      formatMoney(card.balance.toString()),
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
      details: formData.get('details') as string
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

  const tableActions = [
    {
      label: 'Редактировать',
      action: handleEditCard,
      color: '#007D88',
      shouldShow: (rowData: any[]) => {
        return authInfo?.employee.permissions.includes('MANAGE_ACCOUNTING');
      }
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
      label: 'Удалить',
      action: handleDeleteCard,
      color: '#EF4444',
    }
  ];

  const totalBalance = bankCards?.reduce((sum, card) => sum + card.balance, 0) || 0;
  const totalPayments = bankCards?.reduce((sum, card) => sum + card.paymentsAmount, 0) || 0;

  return (
    <PageLayout>
      <TitleField style={{ gap: "35px" }}>
        <CustomTitle>Банковские карты</CustomTitle>
        <AddButton onClick={handleCreateCard}></AddButton>
      </TitleField>
      
      {isLoading && <div>Загрузка...</div>}
      {error && <div>Ошибка: {error}</div>}
      
      {!isLoading && !error && (
        <>
          <CustomTable 
            columns={[
              { name: "ID", isSortable: true, align: "center" },
              { name: "Реквизиты", isSortable: true, align: "left" },
              { name: "Всего выплат", isSortable: true, align: "right" },
              { name: "Баланс", isSortable: true, align: "right" },
            ]} 
            data={tableData}
            sortConfig={sortConfig}
            contextMenuActions={tableActions}
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
      )}

      {/* Модалка для создания/редактирования карты */}
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
              name="details"
              defaultValue={selectedCard?.details || ''}
              required
            />
          </FormField>
        </BaseModal>
      )}

      {/* Модалка для снятия средств */}
      {isWithdrawModalOpen && selectedCard && (
        <BaseModal
          title="Снять средства"
          onClose={() => setIsWithdrawModalOpen(false)}
          onCancel={() => setIsWithdrawModalOpen(false)}
          onSave={handleWithdrawSave}
        >
          <FormField>
            <Label>Карта:</Label>
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

const SummaryInfo = styled.div`
  display: flex;
  gap: 30px;
  margin-left: auto;
`;

const TableTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #000;
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