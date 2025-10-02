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
import type { Credit } from '../../api/types/credit';
import { formatMoney } from '../../utils/formatPrice';
import type { Payment, PaymentByCreditParams } from '../../api/types/payment';
import usePayment from '../../api/hooks/usePayment';
import { NOTEABLE_TYPES } from '../../api/types/note';
import useSoldProducts from '../../api/hooks/useSoldProduct';
import type { SoldProduct } from '../../api/types/soldProduct';
import useSchedule from '../../api/hooks/useSchedule';
import type { ScheduleItem, ScheduleParams } from '../../api/types/schedule';
import CreateNoteModal from './CreateNoteModal';
import PhotoViewerModal from './PhotoViewerModal';
import { FaComment } from 'react-icons/fa';
import useChat from '../../api/hooks/useChat';

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
  const [creditData, setCreditData] = useState<Credit | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const { createPrivateChat } = useChat();
  
  const { 
      data: paymentsData, 
      getPaymentsByCreditId
  } = usePayment();

  const { 
      data: soldProductsData, 
      getSoldProducts
  } = useSoldProducts();
  
  const { 
      scheduleData, 
      getByCreditId: getSchedules
  } = useSchedule();

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

  const loadSoldProducts = useCallback(async () => {
      if (id) {
          await getSoldProducts(id);
      }
  }, [getSoldProducts, id]);

  const loadSchedules = useCallback(async () => {
      if (id) {
          const params: ScheduleParams = {
              includePayed: true,
              page: 1,
              pageSize: 100
          };
          await getSchedules(id, params);
      }
  }, [getSchedules, id]);

  useEffect(() => {
      loadSoldProducts();
  }, [loadSoldProducts]);

  useEffect(() => {
      loadPayments();
  }, [loadPayments]);

  useEffect(() => {
      loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    if (isOpen && id) {
      const fetchData = async () => {
        try {
          setCreditData(null);
          
          const creditResult = await getCredits({ creditId: id.toString(), pageSize: 1 });
          if (creditResult?.items?.length) {
            const credit = creditResult.items[0];
            setCreditData(credit);            
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

  useEffect(() => {
    if (notes && notes.length > 0) {
      const images = notes
        .filter(note => note.fileBase64 && isImageFile(note.fileName))
        .map(note => `data:image/jpeg;base64,${note.fileBase64}`);
      setNoteImages(images);
    }
  }, [notes]);

  const isImageFile = (fileName: string | undefined): boolean => {
    if (!fileName) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext => 
      fileName.toLowerCase().endsWith(ext)
    );
  };

  const downloadFile = (note: any) => {
    if (note.fileBase64 && note.fileName) {
      const link = document.createElement('a');
      link.href = `data:application/octet-stream;base64,${note.fileBase64}`;
      link.download = note.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const notesColumns = [
    { name: 'Дата' },
    { name: 'Заметка', align: 'left' as const },
    { name: '' }
  ];

  const handleDeleteNote = async (noteId: number) => {
    await deleteNote(noteId);
    getCreditNotes(Number(id));
  };

  const handlePhotoClick = (noteIndex: number) => {
    let imageIndex = 0;
    let currentCount = 0;
    
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].fileBase64 && isImageFile(notes[i].fileName)) {
        if (i === noteIndex) {
          imageIndex = currentCount;
          break;
        }
        currentCount++;
      }
    }
    
    setCurrentPhotoIndex(imageIndex);
    setIsPhotoViewerOpen(true);
  };

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

    &:hover {
      background: rgba(0, 100, 110, 1);
      transform: scale(1.05);
    }
  `;

  const formatNotesData = () => {
    return notes.map((note, index) => [
      formatDate(note.createdAt),
      <NoteContent key={`note-${note.id}`}>
        {note.content}
        {note.fileBase64 && (
          <FileContainer>
            {isImageFile(note.fileName) ? (
              <NoteImage 
                src={`data:image/jpeg;base64,${note.fileBase64}`}
                alt="Прикрепленное изображение"
                onClick={() => handlePhotoClick(index)}
              />
            ) : (
              <FileIcon onClick={() => downloadFile(note)}>
                <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="33" height="33" rx="10" fill="#C0DBE0"/>
                  <path d="M14.1333 7.125H11.8125C11.1909 7.125 10.5948 7.37193 10.1552 7.81147C9.71568 8.25101 9.46875 8.84715 9.46875 9.46875V23.5312C9.46875 24.1529 9.71568 24.749 10.1552 25.1885C10.5948 25.6281 11.1909 25.875 11.8125 25.875H21.1875C21.8091 25.875 22.4052 25.6281 22.8448 25.1885C23.2843 24.749 23.5312 24.1529 23.5312 23.5312V16.5M14.1333 7.125C15.4281 7.125 16.5 8.17396 16.5 9.46875V11.8125C16.5 12.4341 16.7469 13.0302 17.1865 13.4698C17.626 13.9093 18.2221 14.1562 18.8437 14.1562H21.1875C21.8091 14.1562 22.4052 14.4032 22.8448 14.8427C23.2843 15.2823 23.5312 15.8784 23.5312 16.5M14.1333 7.125C17.9771 7.125 23.5312 12.7083 23.5312 16.5" stroke="#007D88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {note.fileName && <FileName>{note.fileName}</FileName>}
              </FileIcon>
            )}
          </FileContainer>
        )}
      </NoteContent>,
      <DeleteIcon 
        key={`delete-${note.id}`} 
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

  const handleCreateNote = async (noteData: { content: string; file?: File }) => {
    if (noteData.content.trim() && id) {
      await createNote({
        noteableType: NOTEABLE_TYPES.CREDIT,
        noteableId: Number(id),
        content: noteData.content,
        file: noteData.file
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

  const handleClosePhotoViewer = () => {
    setIsPhotoViewerOpen(false);
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
          payment.paymentDate ? formatDate(payment.paymentDate) : '',
          formatMoney(payment.paymentAmount?.toString() || '0'),
          payment.type === 'cash' ? 'Наличными' : `Картой ${payment.bankCardDetails ?? ""}`,
          payment.employeeFullName || '',
          payment.accepted ? 'Да' : 'Нет'
      ]);
  };
      
  const formatSchedulesData = (schedules: ScheduleItem[] | undefined) => {
      if (!schedules) return [];

      return schedules.map(schedule => [
          formatDate(schedule.paymentDate || ''),
          formatMoney(schedule.paymentAmount.toString() || ''),
          schedule.comment?.toString(),
      ]);
  };

  // Функция для получения стилей строки расписания
  const getScheduleRowStyle = (schedule: ScheduleItem, index: number) => {
    const today = new Date();
    const paymentDate = schedule.paymentDate ? new Date(schedule.paymentDate) : null;
    
    // Если сумма 0 - оплачено (зеленый)
    if (schedule.paymentAmount === 0) {
      return {
        backgroundColor: '#E8F5E8', // светло-зеленый
        color: '#1B5E20',
        fontWeight: 'normal' as const
      };
    }
    
    // Если дата платежа прошла и сумма не 0 - просрочено (красный)
    if (paymentDate && paymentDate < today && schedule.paymentAmount > 0) {
      return {
        backgroundColor: '#FFEBEE', // светло-красный
        color: '#B71C1C',
        fontWeight: 'normal' as const
      };
    }
    
    // Обычная строка
    return {
      backgroundColor: '#FFFFFF',
      color: '#000000',
      fontWeight: 'normal' as const
    };
  };

  const handleMessageClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const chat = await createPrivateChat(creditData.clientId, 'client');
      
      if (chat?.id) {
        window.open(`/chat/${chat.id}`, '_blank');
      }
    } catch (error) {
      console.error('Ошибка при создании чата:', error);
    }
  };

  const formatSoldProductsData = (soldProducts: SoldProduct[] | undefined) => {
    if (!soldProducts) return [];

    return soldProducts.map(soldProduct => {
      let surchargeValue = 0;
      let surchargeDisplay = '';
      
      if (soldProduct.surcharge) {
        surchargeValue = (soldProduct.price * soldProduct.surcharge) / 100;
        surchargeDisplay = `${soldProduct.surcharge}%`;
      } else if (soldProduct.surchargeAmount) {
        surchargeValue = soldProduct.surchargeAmount;
        surchargeDisplay = formatMoney(soldProduct.surchargeAmount.toString());
      }
      
      const finalPrice = soldProduct.price + surchargeValue;
      
      return [
        soldProduct.name || '',
        formatMoney(soldProduct.price.toString() || ''),
        surchargeDisplay,
        formatMoney(finalPrice.toString()),
      ];
    });
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
              {/* <MessageButton onClick={handleMessageClick}>
                <FaComment size={260} />
              </MessageButton> */}
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
                      
                      {creditData && creditData.guarantorFullname && (
                        <>
                          <Label>{creditData && creditData.guarantorFullname && 'Поручитель'}</Label>
                          <Value>{creditData && creditData.guarantorFullname}</Value>
                        </>
                      )}

                      {creditData && creditData.guarantorPhone && (
                        <>
                          <Label>{creditData && creditData.guarantorPhone && 'Телефон поручителя'}</Label>
                          <Value>{creditData && creditData.guarantorPhone}</Value>
                        </>
                      )}

                      {creditData && creditData.creditTypeName && (
                        <>
                          <Label>{creditData && creditData.creditTypeName && 'Категория'}</Label>
                          <Value>{creditData && creditData.creditTypeName && creditData.creditTypeName}</Value>
                        </>
                      )}
                      
                      {creditData && creditData.debtDays && creditData.debtDays > 0 && (
                        <>
                          <Label>{creditData && creditData.debtDays && creditData.debtDays > 0 && 'Дней просрочки'}</Label>
                          <Value>{creditData && creditData.debtDays && creditData.debtDays}</Value>
                        </>
                      )}
                      
                  </VerticalContainer>
                  <VerticalContainer style={{ width: "100%", minWidth: "700px", marginLeft: "60px"}}>
                    <HorizontalContainer style={{ alignItems: "center", marginBottom: "15px" }}>
                      <ModalInfoTitle>Заметки</ModalInfoTitle>
                      <AddButton src={AddButtonImage} alt="Add Button" onClick={handleAddNoteClick} />
                    </HorizontalContainer>
                    <TableContainer style={{ width: "100%" }}>
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
                      { name: "Название" },
                      { name: "Стоимость", align: "right" },
                      { name: "Надбавка", align: "right" },
                      { name: "Цена", align: "right" },
                  ]} 
                  data={formatSoldProductsData(soldProductsData)}
                />

                <Value style={{margin: "10px 0 15px"}}>
                  {creditData && creditData.firstPayment != 0 &&`Первоначальный взнос, руб:${'\u00A0'.repeat(10)}${formatMoney(creditData.firstPayment.toString())}`}
                </Value>
                {paymentsData?.items.length > 0 && (
                  <>
                    <ModalInfoTitle>Платежи</ModalInfoTitle>
                    <CustomTable                         
                      columns={[
                        { name: "Дата", align: "left" },
                        { name: "Сумма", align: "right" },
                        { name: "Тип платежа" },
                        { name: "Платёж принял" },
                        { name: "Подтверждён" },                
                      ]} 
                      data={formatPaymentsData(paymentsData?.items)}
                    />
                  </>
                )}

                <ModalInfoTitle>График платежей</ModalInfoTitle>
                <CustomTable                         
                  columns={[
                      { name: "Дата", align: "left" },
                      { name: "Сумма", align: "right" },
                      { name: "Примечание" },
                  ]} 
                  data={formatSchedulesData(scheduleData?.items)}
                  rowStyles={scheduleData?.items?.reduce((acc, schedule, index) => {
                    acc[index] = getScheduleRowStyle(schedule, index);
                    return acc;
                  }, {} as { [key: number]: any }) || {}}
                />
              </div>
          </ModalWrapper>
        </ModalContent>
      </ModalOverlay>

      <CreateNoteModal
        isOpen={isNoteModalOpen}
        onClose={handleCancelNote}
        onCreate={handleCreateNote}
        noteContent={newNoteContent}
        onNoteContentChange={setNewNoteContent}
      />

      {isPhotoViewerOpen && noteImages.length > 0 && (
        <PhotoViewerModal
          images={noteImages}
          initialIndex={currentPhotoIndex}
          onClose={handleClosePhotoViewer}
        />
      )}
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
  overflow-y: auto;
  width: 100%;
  height: 100%;
  max-height: 500px;  
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

const NoteContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
`;

const FileContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NoteImage = styled.img`
  max-width: 100px;
  max-height: 100px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  
  &:hover {
    opacity: 0.8;
  }
`;

const FileIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f8f9fa;
  border: 1px solid #e2e8f0;
  
  &:hover {
    background-color: #e9ecef;
  }
`;

const FileName = styled.span`
  font-size: 14px;
  color: #007D88;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export default ViewCreditModal;