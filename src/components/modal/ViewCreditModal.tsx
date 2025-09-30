import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import TitleField from '../ui/Layouts/TitleLayout';
import CustomTitle from '../ui/Text/CustomTitle';
import ModalInfoTitle from '../ui/Text/ModalInfoTitle';
import AddButtonImage from '../../assets/ui/buttons/AddButton.svg';  
import CustomTable from '../ui/tables/CustomTable';
import useNotes from '../../api/hooks/useNote';
import { formatDate } from '../../utils/dateFormatter';
import useCredit from '../../api/hooks/useCredit';
import useClient from '../../api/hooks/useClient';
import type { Credit, GuarantorType } from '../../api/types/credit';
import type { Client } from '../../api/types/client';
import { formatMoney } from '../../utils/formatPrice';
import ClientModal from './CrudInherited/ClientModal';
import InvestorModal from './CrudInherited/InvestorModal';
import type { Payment, PaymentByCreditParams } from '../../api/types/payment';
import usePayment from '../../api/hooks/usePayment';
import { NOTEABLE_TYPES } from '../../api/types/note';
import type { Guarantor } from '../../api/types/client';
import GuarantorModal from './CrudInherited/GuarantorModal';

interface ViewCreditModalProps {
  id: number;
  isOpen: boolean;
  onClose: () => void;
}

const ViewCreditModal: React.FC<ViewCreditModalProps> = ({
  id,
  isOpen,
  onClose
}) => {
  const { notes, isLoading: isNotesLoading, error: notesError, getCreditNotes, createNote, deleteNote } = useNotes();
  const { getCredits } = useCredit();
  const { getClientById } = useClient();
  const [creditData, setCreditData] = useState<Credit | null>(null);
  const [guarantorData, setGuarantorData] = useState<Client | Guarantor | null>(null);
  const [guarantorType, setGuarantorType] = useState<GuarantorType | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const { 
      data: paymentsData, 
      getPaymentsByCreditId
  } = usePayment();

  
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isGuarantorModalOpen, setIsGuarantorModalOpen] = useState(false);
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [currentInvestor, setCurrentInvestor] = useState<any>(null);
  
  const loadPayments = useCallback(async () => {
      if (id) {
          const params: PaymentByCreditParams = {
              creditId: id,
              page: 1,
              pageSize: 100
          };
          await getPaymentsByCreditId(params);
      }
  }, [getPaymentsByCreditId, id]);

  useEffect(() => {
      loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    if (isOpen && id) {
      const fetchData = async () => {
        try {
          setCreditData(null);
          setCurrentClient(null);
          setGuarantorData(null);
          setCurrentInvestor(null);
          setGuarantorType(null);
          
          const creditResult = await getCredits({ creditId: id, pageSize: 1 });
          if (creditResult?.items?.length) {
            const credit = creditResult.items[0];
            setCreditData(credit);
            
            if (credit.clientId) {
              const client = await getClientById(credit.clientId);
              setCurrentClient(client);
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
        }
      };

      fetchData();
      getCreditNotes(Number(id));
    }
  }, [isOpen, id, getCreditNotes, getCredits]);

  const notesColumns = [
    { name: 'Дата' },
    { name: 'Заметка', align: 'left' as const },
    { name: '' }
  ];

  const handleDeleteNote = async (noteId: number) => {
    await deleteNote(noteId);
    getCreditNotes(Number(id));
  };

  const formatNotesData = () => {
    return notes.map(note => [
      formatDate(note.createdAt),
      note.content,
      <DeleteIcon 
        key={note.id} 
        onClick={() => handleDeleteNote(note.id)}
      >
        <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.97271 16.8889C2.97271 18.05 4.01965 19 5.29924 19H14.6054C15.885 19 16.9319 18.05 16.9319 16.8889V4.22222H2.97271V16.8889ZM18.0952 1.05556H14.0237L12.8605 0H7.04414L5.88088 1.05556H1.80945V3.16667H18.0952V1.05556Z" fill="#50555C"/>
        </svg>
      </DeleteIcon>
    ]);
  };

  const handleAddNoteClick = () => {
    setIsNoteModalOpen(true);
  };

  const handleCreateNote = async () => {
    if (newNoteContent.trim() && id) {
      await createNote({
        noteableType: NOTEABLE_TYPES.CREDIT,
        noteableId: Number(id),
        content: newNoteContent
      });
      setNewNoteContent('');
      setIsNoteModalOpen(false);
      getCreditNotes(Number(id));
    }
  };

  const handleCancelNote = () => {
    setNewNoteContent('');
    setIsNoteModalOpen(false);
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
  
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [onClose]);
    
  const formatPaymentsData = (payments: Payment[] | undefined) => {
        if (!payments) return [];

        return payments.map(payment => [
            payment.creditId?.toString() || '',
            payment.clientFullName || '',
            formatMoney(payment.paymentAmount?.toString() || '0'),
            payment.paymentDate ? formatDate(payment.paymentDate) : '',
            payment.type === 'cash' ? 'Наличными' : 'Картой',
            payment.employeeFullName || '',
            payment.accepted ? 'Да' : 'Нет'
        ]);
    };
      
  if (!isOpen) return null;

  return (
    <>
      <ModalOverlay isOpen={isOpen} onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalWrapper>
            <TitleField style={{marginTop: 0, paddingTop: 0}}>
              <CustomTitle style={{ marginTop: 0 }}>
                Договор №{id}
              </CustomTitle>
            </TitleField>

             <div>
                <HorizontalContainer style={{ marginBottom: '30px' }}>
                  <VerticalContainer>
                    <ModalInfoTitle style={{marginBottom: "5px"}}>Сведения о договоре</ModalInfoTitle>
                      <Label>{creditData && creditData.name && 'Договор'}</Label>
                      <Value>{creditData && creditData.name && creditData.name}</Value>

                      <Label>Дата</Label>
                      <Value>{creditData && formatDate(creditData.creditDate)}</Value>

                      <Label>Покупатель</Label>
                      <Value>{creditData && creditData.clientFullName}</Value>

                      <Label>Телефон</Label>
                      <Value>{creditData && creditData.clientPhone}</Value>
                      
                      <Label>{creditData && creditData.guarantorFullname && 'Поручитель'}</Label>
                      <Value>{creditData && creditData.guarantorFullname}</Value>

                      <Label>{creditData && creditData.guarantorPhone && 'Телефон поручителя'}</Label>
                      <Value>{creditData && creditData.guarantorPhone}</Value>

                      <Label>{creditData && creditData.creditTypeName && 'Категория'}</Label>
                      <Value>{creditData && creditData.creditTypeName && creditData.creditTypeName}</Value>
                  </VerticalContainer>
                  <VerticalContainer>
                    <HorizontalContainer style={{ alignItems: "center", marginBottom: "15px" }}>
                      <ModalInfoTitle>Заметки</ModalInfoTitle>
                      <AddButton src={AddButtonImage} alt="Add Button" onClick={handleAddNoteClick} />
                    </HorizontalContainer>
                    <TableContainer style={{ width: "562px", maxHeight: "260px" }}>
                      {isNotesLoading ? (
                        <LoadingText>Загрузка заметок...</LoadingText>
                      ) : notesError ? (
                        <ErrorText>{notesError}</ErrorText>
                      ) : (
                        <Table 
                          columns={notesColumns} 
                          data={formatNotesData()}
                        />
                      )}
                    </TableContainer>
                  </VerticalContainer>
                </HorizontalContainer>

                <ModalInfoTitle>Товары</ModalInfoTitle>

                    <CustomTable                         
                      columns={[
                          { name: "Договор №" },
                          { name: "ФИО" },
                          { name: "Платёж" },
                          { name: "Дата платежа" },
                          { name: "Тип платежа" },
                          { name: "Платёж принял" },
                          { name: "Подтверждён" },                
                      ]} 
                      data={formatPaymentsData(paymentsData?.items)}
                    />

                    <ModalInfoTitle>График платежей</ModalInfoTitle>
                    <CustomTable                         
                      columns={[
                          { name: "Договор №" },
                          { name: "ФИО" },
                          { name: "Платёж" },
                          { name: "Дата платежа" },
                          { name: "Тип платежа" },
                          { name: "Платёж принял" },
                          { name: "Подтверждён" },                
                      ]} 
                      data={formatPaymentsData(paymentsData?.items)}
                    />

                    <Value>
                      {creditData && `Первоначальный взнос, руб:${'\u00A0'.repeat(10)}${formatMoney(creditData.firstPayment.toString())}`}
                    </Value>

                    {paymentsData && (
                      <>
                        <ModalInfoTitle>Платежи</ModalInfoTitle>
                        <CustomTable                         
                          columns={[
                            { name: "Договор №" },
                            { name: "ФИО" },
                            { name: "Платёж" },
                            { name: "Дата платежа" },
                            { name: "Тип платежа" },
                            { name: "Платёж принял" },
                            { name: "Подтверждён" },                
                          ]} 
                          data={formatPaymentsData(paymentsData?.items)}
                        />
                      </>
                    )}
              </div>
          </ModalWrapper>
        </ModalContent>
      </ModalOverlay>

      {currentClient && (
        <ClientModal
          mode="view"
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSubmit={async () => false}
          initialData={currentClient}
        />
      )}

      {guarantorData && guarantorType === 'Client' && (
        <ClientModal
          mode="view"
          isOpen={isGuarantorModalOpen}
          onClose={() => setIsGuarantorModalOpen(false)}
          onSubmit={async () => false}
          initialData={guarantorData as Client}
        />
      )}

      {guarantorData && guarantorType === 'Guarantor' && (
        <GuarantorModal
          mode="view"
          isOpen={isGuarantorModalOpen}
          onClose={() => setIsGuarantorModalOpen(false)}
          onSubmit={async () => false}
          initialData={guarantorData as Guarantor}
        />
      )}

      {currentInvestor && (
        <InvestorModal
          mode="view"
          isOpen={isInvestorModalOpen}
          onClose={() => setIsInvestorModalOpen(false)}
          onSubmit={async () => false}
          initialData={currentInvestor}
        />
      )}

      <ModalOverlay isOpen={isNoteModalOpen} onClick={handleCancelNote}>
        <NoteModalContent onClick={(e) => e.stopPropagation()}>
          <NoteModalWrapper>
            <CustomTitle style={{ marginTop: 0 }}>Заметка</CustomTitle>
            <NoteInput 
              style={{background: "white", color: "black"}}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Введите текст заметки..."
            />
            <ButtonContainer>
              <CancelButton onClick={handleCancelNote}>Отменить</CancelButton>
              <CreateButton onClick={handleCreateNote}>Создать</CreateButton>
            </ButtonContainer>
          </NoteModalWrapper>
        </NoteModalContent>
      </ModalOverlay>
    </>
  );
};

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: black;
`;

const ModalWrapper = styled.div`
  margin: 10px;
`;

const VerticalContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const HorizontalContainer = styled.div`
    display: flex;
    flex-direction: row;
`;

const ModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: auto;
  overflow-y: auto;
  max-height: 90vh;
`;

const AddButton = styled.img`
  cursor: pointer;
  margin-left: auto;

  &:hover {
    opacity: 0.8;
  }
`;

const TableContainer = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  max-height: 260px;
  overflow-y: auto;
  width: 100%;
  height: 100%;
`;

const LoadingText = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
`;

const ErrorText = styled.div`
  padding: 20px;
  text-align: center;
  color: #ff0000;
`;

const NoteModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 500px;
`;

const NoteModalWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 20px;
`;

const NoteInput = styled.textarea`
  width: auto;
  height: 150px;
  padding: 12px;
  margin: 15px 0;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  resize: none;
  font-family: inherit;
  font-size: 14px;

  &:focus {
    outline: none;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const CancelButton = styled.button`
  padding: 8px 16px;
  background: rgba(209, 213, 219, 1);
  border-radius: 10px;
  cursor: pointer;
  margin-right: auto;

  &:hover {
    background: #e6e6e6;
  }
`;

const CreateButton = styled.button`
  padding: 8px 16px;
  background: rgba(0, 125, 136, 1);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  
  &:hover {
    background: rgba(0, 125, 116, 1);
  }
`;

const DeleteIcon = styled.div`
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    opacity: 0.7;
  }
`;

const Table = styled(CustomTable)`
  max-height: 260px;
  height: 100%;
`;

const Label = styled.h6`
  color: rgba(80, 85, 92, 1);
  font-weight: 400;
  font-size: 16px;
  margin: 10px 0 2px;
  text-align: left;
`;

const Value = styled.h6`
  color: black;
  font-weight: 500;
  font-size: 16px;
  margin: 0 0;
  text-align: left;
`;

export default ViewCreditModal;