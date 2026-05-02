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
import type { Payment, PaymentByCreditParams, PaymentTab } from '../../api/types/payment';
import usePayment from '../../api/hooks/usePayment';
import { NOTEABLE_TYPES } from '../../api/types/note';
import useSoldProducts from '../../api/hooks/useSoldProduct';
import type { SoldProduct } from '../../api/types/soldProduct';
import useSchedule from '../../api/hooks/useSchedule';
import type { ScheduleItem, ScheduleParams } from '../../api/types/schedule';
import CreateNoteModal from './CreateNoteModal';
import PhotoViewerModal from './PhotoViewerModal';
import useChat from '../../api/hooks/useChat';
import useCompany from '../../api/hooks/useCompany';
import PaymentConfirmationGenerator from '../../utils/doxcUtils/paymentConfirmationGenerator';
import paymentService from '../../api/services/paymentService';
import NewPaymentModal from './NewPaymentModal';
import { sendWhatsAppMessage } from '../../utils/sendWhatsAppMessage';
import { formatPhoneHref } from '../../utils/phoneUtils';
import PhoneLink from '../ui/links/PhoneLink';
import WhatsAppChat from '../WhatsAppChat';

interface ViewCreditModalProps {
  id: number;
  isOpen: boolean;
  onClose: () => void;
}

// Интерфейс для заметки с загруженным файлом
interface NoteWithFile extends Note {
  fileBase64?: string;
  fileName?: string;
  isLoading?: boolean;
}

const ViewCreditModal: React.FC<ViewCreditModalProps> = ({
  id,
  isOpen,
  onClose
}) => {
  const { 
    notes: initialNotes, 
    isLoading: isNotesLoading, 
    error: notesError, 
    getCreditNotes, 
    createNote, 
    deleteNote, 
    getFileByNote 
  } = useNotes();
  
  const { getCredits } = useCredit();
  const [creditData, setCreditData] = useState<Credit | null>(null);
  const [notes, setNotes] = useState<NoteWithFile[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const { createPrivateChat } = useChat();
  
  // Обновляем состояние заметок при загрузке из API
  useEffect(() => {
    if (initialNotes) {
      // Преобразуем заметки и добавляем флаг загрузки файлов
      const notesWithFiles: NoteWithFile[] = initialNotes.map(note => ({
        ...note,
        isLoading: false
      }));
      setNotes(notesWithFiles);
      
      // Сразу загружаем файлы для всех заметок, которые имеют fileId
      loadFilesForNotes(notesWithFiles);
    }
  }, [initialNotes]);

  // Загрузка файлов для заметок
  const loadFilesForNotes = async (notesToLoad: NoteWithFile[]) => {
    for (const note of notesToLoad) {
        await loadNoteFile(note.id);
    }
  };

  // Загрузка файла для конкретной заметки
  const loadNoteFile = async (noteId: number) => {
    try {
      // Устанавливаем флаг загрузки
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === noteId 
            ? { ...note, isLoading: true } 
            : note
        )
      );

      const fileData = await getFileByNote(noteId);
      
      if (fileData) {
        // Обновляем заметку с загруженным файлом
        setNotes(prevNotes => 
          prevNotes.map(note => {
            if (note.id === noteId) {
              // Определяем тип файла по имени или используем дефолтный
              let fileName = note.fileName || `file_${noteId}`;
              let fileBase64 = fileData;
              
              // Если это изображение, добавляем data URL prefix
              if (isImageFile(fileName)) {
                const extension = fileName.split('.').pop()?.toLowerCase();
                const mimeType = getMimeTypeFromExtension(extension);
                fileBase64 = `data:${mimeType};base64,${fileData}`;
              }
              
              return { 
                ...note, 
                fileBase64, 
                fileName,
                isLoading: false 
              };
            }
            return note;
          })
        );
      }
    } catch (error) {
      console.error(`Error loading file for note ${noteId}:`, error);
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === noteId 
            ? { ...note, isLoading: false } 
            : note
        )
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Полностью блокируем скролл на странице
      document.body.style.overflow = 'hidden';
    } else {
      // Восстанавливаем скролл
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Определение MIME типа по расширению файла
  const getMimeTypeFromExtension = (extension?: string): string => {
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    
    return mimeTypes[extension?.toLowerCase() || ''] || 'application/octet-stream';
  };

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    rowIndex: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
    rowIndex: -1
  });

  const handleRowContextMenu = (rowData: any[], rowIndex: number, event: React.MouseEvent) => {
    event.preventDefault();
    
    if (!scheduleData?.items?.[rowIndex]) return;
    
    const schedule = scheduleData.items[rowIndex];
    const paymentDate = schedule.paymentDate ? new Date(schedule.paymentDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      rowIndex
    });
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        handleCloseContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.visible]);

  const handleCloseContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      rowIndex: -1
    });
  };

  const handleContextMenuAction = (rowIndex: number) => {
    if (!scheduleData?.items?.[rowIndex]) return;
    
    const schedule = scheduleData.items[rowIndex];
    setSelectedScheduleForPayment(schedule);
    setIsPaymentModalOpen(true);
    handleCloseContextMenu();
  };

  const { 
    data: paymentsData, 
    getPaymentsByCreditId,
    createPayment
  } = usePayment();

  const { 
    data: soldProductsData, 
    getSoldProducts
  } = useSoldProducts();
  
  const { 
    scheduleData, 
    getByCreditId: getSchedules,
    markAsNotified
  } = useSchedule();

  const getPaymentTab = useCallback(async (paymentId: number): Promise<PaymentTab | null> => {
    try {
      const result = await paymentService.getPaymentTab(paymentId);
      return result;
    } catch (err) {
      console.error('Ошибка при получении данных для документа:', err);
      return null;
    }
  }, []);

  const handleOpenPaymentFromSchedule = (rowData: any[], rowIndex: number) => {
    if (!scheduleData?.items?.[rowIndex]) return;
    
    const schedule = scheduleData.items[rowIndex];
    setSelectedScheduleForPayment(schedule);
    setIsPaymentModalOpen(true);
  };

  const scheduleTableActions = [
    {
      label: 'Добавить платёж',
      action: handleOpenPaymentFromSchedule,
      color: '#008b8b'
    }
  ];

  const { getAccountDetails } = useCompany();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedScheduleForPayment, setSelectedScheduleForPayment] = useState<ScheduleItem | null>(null);
  const paymentConfirmationGenerator = new PaymentConfirmationGenerator(getPaymentTab);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSavePayment = async (paymentData: {
    paymentDate: string;
    principalAmount: number;
    paymentMethod: 'cash' | 'card';
    bankCardId?: number;
  }) => {
    try {
      if (!creditData) return;
      
      const paymentRequest = {
        creditId: creditData.id,
        paymentAmount: paymentData.principalAmount,
        datePayment: paymentData.paymentDate,
        type: paymentData.paymentMethod,
        bankCardId: paymentData.bankCardId
      };
      
      const result = await createPayment(paymentRequest);
      
      // Перезагружаем данные после успешного платежа
      await loadPayments();
      await loadSchedules();
      
      setIsPaymentModalOpen(false);
      setSelectedScheduleForPayment(null);
      
      return result;
    } catch (error) {
      console.error('Ошибка при сохранении платежа:', error);
      throw error;
    }
  };

  const handlePrintReceipt = async (paymentId: number) => {
    try {
      await paymentConfirmationGenerator.generatePaymentConfirmation(paymentId);
      console.log('Чек успешно сгенерирован');
    } catch (error) {
      console.error('Ошибка при печати чека:', error);
      alert('Платёж создан, но произошла ошибка при печати чека');
    }
  };

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
        }
      };

      fetchData();
      getCreditNotes(Number(id));
    }
  }, [isOpen, id, getCreditNotes, getCredits]);

  // Обновляем массив изображений при изменении заметок
  useEffect(() => {
    const images = notes
      .filter(note => note.fileBase64 && isImageFile(note.fileName))
      .map(note => note.fileBase64!);
    setNoteImages(images);
  }, [notes]);

  const isImageFile = (fileName: string | undefined): boolean => {
    if (!fileName) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext => 
      fileName.toLowerCase().endsWith(ext)
    );
  };

  const downloadFile = (note: NoteWithFile) => {
    if (note.fileBase64 && note.fileName) {
      // Если это data URL, извлекаем чистый base64
      let base64Data = note.fileBase64;
      if (base64Data.startsWith('data:')) {
        const base64Index = base64Data.indexOf('base64,');
        if (base64Index !== -1) {
          base64Data = base64Data.substring(base64Index + 7);
        }
      }
      
      const link = document.createElement('a');
      link.href = `data:application/octet-stream;base64,${base64Data}`;
      link.download = note.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleForceLoadFile = (noteId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    loadNoteFile(noteId);
  };

  const formatPhoneNumber = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('8')) {
      return '7' + digits.slice(1);
    }
    return digits;
  };

  const sendMessage = async (scheduleId: number, phone: string, amount: string, date: string) => {
    try {
      if (sendWhatsAppMessage) {
        await loadSchedules();
      } else {
        console.error('Не удалось отметить уведомление');
      }
    } catch (error) {
      console.error('Ошибка при отправке WhatsApp:', error);
    }
  };

  const notesColumns = [
    { name: 'Сотрудник' },
    { name: 'Дата' },
    { name: 'Заметка', align: 'left' as const },
    { name: 'Напоминание', align: 'left' as const },
    { name: '' }
  ];

  const handleDeleteNote = async (noteId: number) => {
    await deleteNote(noteId);
    getCreditNotes(Number(id));
  };

  const handlePhotoClick = (noteIndex: number) => {
    const note = notes[noteIndex];
    if (!note.fileBase64 || !isImageFile(note.fileName)) return;
    
    let imageIndex = 0;
    let currentCount = 0;
    
    for (let i = 0; i < notes.length; i++) {
      const currentNote = notes[i];
      if (currentNote.fileBase64 && isImageFile(currentNote.fileName)) {
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
    min-width: 40px;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    margin-left: 10px;
    padding: 8px;

    &:hover {
      background: rgba(0, 100, 110, 1);
      transform: scale(1.05);
    }
  `;

  const formatNotesData = () => {
    return notes.map((note, index) => [
      note.employeeName,
      formatDate(note.createdAt),
      <NoteContent key={`note-${note.id}`}>
        {note.content}
        {note.fileId && !note.fileBase64 && note.isLoading && (
          <FileContainer>
            <LoadingFile>
              <LoadingSpinner />
              <span>Загрузка файла...</span>
            </LoadingFile>
          </FileContainer>
        )}
        {note.fileId && !note.fileBase64 && !note.isLoading && (
          <FileContainer>
            <RetryFile onClick={(e) => handleForceLoadFile(note.id, e)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 4V10H7" stroke="#50555C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 20V14H17" stroke="#50555C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.49 9C19.9828 7.56678 19.1209 6.2854 17.9845 5.27542C16.8482 4.26543 15.4745 3.55976 13.9917 3.22426C12.5089 2.88875 10.9652 2.93434 9.50481 3.35677C8.04437 3.77921 6.71475 4.56471 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4353 15.9556 20.2208 14.4952 20.6432C13.0348 21.0657 11.4911 21.1113 10.0083 20.7757C8.52547 20.4402 7.1518 19.7346 6.01547 18.7246C4.87914 17.7146 4.01717 16.4332 3.51 15" stroke="#50555C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Нажмите, чтобы загрузить файл</span>
            </RetryFile>
          </FileContainer>
        )}
        {note.fileBase64 && (
          <FileContainer>
            {isImageFile(note.fileName) ? (
              <NoteImage 
                src={note.fileBase64}
                alt="Прикрепленное изображение"
                onClick={() => handlePhotoClick(index)}
                onError={() => console.error(`Failed to load image for note ${note.id}`)}
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
      formatDate(note.remindDate),
        <DeleteIcon 
          key={`delete-${note.id}`} 
          onClick={() => handleDeleteNote(note.id)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 7H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M10 11V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M14 11V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M5 7L6 19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19L19 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M9 7V4C9 3.44772 9.44772 3 10 3H14C14.5523 3 15 3.44772 15 4V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </DeleteIcon>
    ]);
  };

  const handleAddNoteClick = () => {
    setIsNoteModalOpen(true);
  };

  const handleCreateNote = async (noteData: { content: string; file?: File, remindDate?: Date }) => {
    if (noteData.content.trim() && id) {
      await createNote({
        noteableType: NOTEABLE_TYPES.CREDIT,
        noteableId: Number(id),
        content: noteData.content,
        file: noteData.file,
        remindDate: noteData.remindDate
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
      schedule.id.toString(),
      formatDate(schedule.paymentDate || ''),
      formatMoney(schedule.paymentAmount.toString() || ''),
      schedule.comment?.toString(),
      // Объединенная колонка: статус + иконка уведомления
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '8px'
      }}>
        {schedule.payed ? (
          <>
            <span style={{ color: '#1B5E20', fontWeight: '500' }}>
              Оплачено
            </span>
          </>
        ) : (
          <>
            <span style={{ color: '#666' }}>
              {schedule.notified ? 'Уведомлён' : 'Не уведомлён'}
            </span>
            {!schedule.notified ? (
              <button 
                onClick={() => sendWhatsAppMessage(
                  schedule.id,
                  schedule.clientPhone,
                  formatMoney(schedule.paymentAmount.toString()),
                  formatDate(schedule.paymentDate)
                )}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0'
                }}
              >
                <WhatsAppIcon style={{ color: '#25D366' }} />
              </button>
            ) : (
              <button 
                onClick={() => sendWhatsAppMessage(
                  schedule.id,
                  schedule.clientPhone,
                  formatMoney(schedule.paymentAmount.toString()),
                  formatDate(schedule.paymentDate)
                )}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0'
                }}
              >
                <CheckIcon style={{ color: '#1B5E20', fontSize: '18px' }} />
              </button>
            )}
          </>
        )}
      </div>
    ]);
  };

  const getScheduleRowStyle = (schedule: ScheduleItem, index: number) => {
    const today = new Date();
    const paymentDate = schedule.paymentDate ? new Date(schedule.paymentDate) : null;
    
    if (schedule.paymentAmount === 0 || schedule.payed) {
      return {
        backgroundColor: '#E8F5E8',
        color: '#1B5E20',
        fontWeight: 'normal' as const
      };
    }
    
    if (paymentDate && paymentDate < today && schedule.paymentAmount > 0) {
      return {
        backgroundColor: '#FFEBEE',
        color: '#B71C1C',
        fontWeight: 'normal' as const
      };
    }
    
    return {
      backgroundColor: '#FFFFFF',
      color: '#000000',
      fontWeight: 'normal' as const
    };
  };

  const handleMessageClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const chat = await createPrivateChat(creditData?.clientId || 0, 'client');
      
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
      <ModalOverlay isOpen={isOpen} onClick={handleOverlayClick}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalWrapper>
            <TwoColumnLayout>
            <LeftColumn>
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
                  <Value>
                    {creditData?.clientPhone ? (
                      <PhoneLink href={formatPhoneHref(creditData.clientPhone)}>
                        {creditData.clientPhone}
                      </PhoneLink>
                    ) : (
                      ''
                    )}
                  </Value>

                  {creditData?.address && (
                    <>
                      <Label>Адрес</Label>
                      <Value>{creditData.address}</Value>
                    </>
                  )}

                  {creditData?.clientBirthdate && (
                    <>
                      <Label>Дата рождения</Label>
                      <Value>{new Date(`${creditData.clientBirthdate}`).toLocaleDateString('ru-RU')}</Value>
                    </>
                  )}

                  {creditData?.termMonths && (
                    <>
                      <Label>Срок, месяцев</Label>
                      <Value>{creditData.termMonths}</Value>
                    </>
                  )}
                  
                  {creditData && creditData.guarantorFullname && (
                    <>
                      <Label>{creditData && creditData.guarantorFullname && 'Поручитель'}</Label>
                      <Value>{creditData && creditData.guarantorFullname && creditData.guarantorFullname}</Value>
                    </>
                  )}

                  {creditData && creditData.guarantorPhone && (
                    <>
                      <Label>{creditData && creditData.guarantorPhone && 'Телефон поручителя'}</Label>
                      <Value>
                        <PhoneLink href={formatPhoneHref(creditData.guarantorPhone)}>
                          {creditData.guarantorPhone}
                        </PhoneLink>
                      </Value>
                    </>
                  )}

                  {creditData?.guarantorBirthdate && (
                    <>
                      <Label>Дата рождения</Label>
                      <Value>{new Date(`${creditData.guarantorBirthdate}`).toLocaleDateString('ru-RU')}</Value>
                    </>
                  )}

                  {creditData && creditData.creditTypeName && (
                    <>
                      <Label>{creditData && creditData.creditTypeName && 'Категория'}</Label>
                      <Value>{creditData && creditData.creditTypeName && creditData.creditTypeName}</Value>
                    </>
                  )}
                  
                  {creditData?.debtDays > 0 && (
                    <>
                      <Label>Дней просрочки</Label>
                      <Value>{creditData.debtDays}</Value>
                    </>
                  )}
                  
                  {creditData?.debtComment && (
                    <>
                      <Label>В долг выдал</Label>
                      <Value>{creditData.debtComment}</Value>
                    </>
                  )}

                </VerticalContainer>
                <VerticalContainer style={{ width: "100%", marginLeft: "60px"}}>
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
              {paymentsData?.items && paymentsData.items.length > 0 && (
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

              <ModalInfoTitle style={{marginTop: "15px"}}>График платежей</ModalInfoTitle>
              <CustomTable                         
                columns={[
                  { name: "ID", isHidden: true },
                  { name: "Дата", align: "left" },
                  { name: "Сумма", align: "right" },
                  { name: "Примечание" },
                  { name: "Статус", align: "center" },
                ]} 
                data={formatSchedulesData(scheduleData?.items)}
                rowStyles={scheduleData?.items?.reduce((acc, schedule, index) => {
                  acc[index] = getScheduleRowStyle(schedule, index);
                  return acc;
                }, {} as { [key: number]: any }) || {}}
                contextMenuActions={scheduleTableActions}
                onRowDoubleClick={handleOpenPaymentFromSchedule}
                onRowContextMenu={handleRowContextMenu}
              />
            </div>
            </LeftColumn>

            <RightColumn>
              {creditData && (
                <WhatsAppChat
                  phoneNumber={creditData?.clientPhone}
                  clientName={creditData?.clientFullName}
                />
              )}
            </RightColumn>
            </TwoColumnLayout>
          </ModalWrapper>
        </ModalContent>
      </ModalOverlay>

      <NewPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedScheduleForPayment(null);
        }}
        onSubmit={handleSavePayment}
        creditId={creditData?.id || 0}
        clientName={creditData?.clientFullName || ''}
        investorName={creditData?.investorNickname || ''}
        clientPhone={creditData?.clientPhone || ''}
        currentDebt={creditData?.rest || 0}
        currentMonthDebt={selectedScheduleForPayment?.paymentAmount || creditData?.currentMonthDebt || 0}
        onPrintReceipt={handlePrintReceipt}
        clientId={creditData?.clientId}
      />

      <CreateNoteModal
        isOpen={isNoteModalOpen}
        onClose={handleCancelNote}
        onCreate={handleCreateNote}
        noteContent={newNoteContent}
        onNoteContentChange={setNewNoteContent}
      />

      {contextMenu.visible && (
        <ContextMenu
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1001
          }}
        >
          <ContextMenuItem 
            onClick={() => handleContextMenuAction(contextMenu.rowIndex)}
            style={{ color: '#008b8b' }}
          >
            Добавить платёж
          </ContextMenuItem>
        </ContextMenu>
      )}

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

const TwoColumnLayout = styled.div`
  display: flex;
  gap: 24px;
  height: 100%;
`;

const LeftColumn = styled.div`
  flex: 1.5;
  overflow-y: auto;
  padding-right: 12px;
  
  /* Стилизация скроллбара для левой колонки */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
`;

const RightColumn = styled.div`
  flex: 1;
  min-width: 450px;
  display: flex;
  flex-direction: column;
  
  /* Фиксируем высоту чата */
  & > div {
    height: 100%;
  }
`;

const ContextMenu = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 150px;
`;

const ContextMenuItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

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
  width: 90vw;
  height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;
  
  /* Для плавного скролла на мобильных */
  -webkit-overflow-scrolling: touch;
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
  /* Убираем max-height или делаем его адаптивным */
  height: auto;
  min-height: 200px;
  max-height: 400px; /* или убрать вообще */
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

const LoadingFile = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: #f8f9fa;
  border: 1px solid #e2e8f0;
  color: #666;
  font-size: 14px;
`;

const RetryFile = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: #e8f5e9;
  border: 1px solid #c8e6c9;
  color: #2e7d32;
  font-size: 14px;
  
  &:hover {
    background-color: #c8e6c9;
  }
`;

const LoadingSpinner = styled.div`
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

const FileName = styled.span`
  font-size: 14px;
  color: #007D88;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CheckIcon = () => (
  <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.3227 1.73849C15.5053 1.54252 15.6047 1.28333 15.6 1.01552C15.5952 0.747705 15.4867 0.492182 15.2973 0.30278C15.1079 0.113379 14.8524 0.00488629 14.5846 0.000161053C14.3168 -0.00456418 14.0576 0.0948468 13.8616 0.277449L5.63297 8.50612L2.22848 5.10163C2.03251 4.91903 1.77332 4.81961 1.50551 4.82434C1.23769 4.82907 0.982171 4.93756 0.792769 5.12696C0.603368 5.31636 0.494877 5.57188 0.490151 5.8397C0.485426 6.10751 0.584836 6.3667 0.767438 6.56266L4.90245 10.6977C5.09628 10.8913 5.35902 11 5.63297 11C5.90691 11 6.16966 10.8913 6.36349 10.6977L15.3227 1.73849Z" fill="#50555C"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.8437 3.11431C16.8886 2.14984 15.751 1.38511 14.4974 0.864691C13.2437 0.344271 11.899 0.078567 10.5416 0.083064C4.85413 0.083064 0.218709 4.71848 0.218709 10.406C0.218709 12.2289 0.697876 13.9997 1.59371 15.5622L0.135376 20.9164L5.60413 19.4789C7.11454 20.3018 8.81246 20.7393 10.5416 20.7393C16.2291 20.7393 20.8645 16.1039 20.8645 10.4164C20.8645 7.65598 19.7916 5.06223 17.8437 3.11431ZM10.5416 18.9893C8.99996 18.9893 7.48954 18.5726 6.16663 17.7914L5.85413 17.6039L2.60413 18.4581L3.46871 15.2914L3.26038 14.9685C2.40365 13.6008 1.94884 12.0198 1.94788 10.406C1.94788 5.67681 5.80204 1.82265 10.5312 1.82265C12.8229 1.82265 14.9791 2.71848 16.5937 4.34348C17.3933 5.13917 18.027 6.08571 18.4579 7.1282C18.8888 8.17068 19.1085 9.28836 19.1041 10.4164C19.125 15.1456 15.2708 18.9893 10.5416 18.9893ZM15.25 12.5726C14.9895 12.4476 13.7187 11.8226 13.4895 11.7289C13.25 11.6456 13.0833 11.6039 12.9062 11.8539C12.7291 12.1143 12.2395 12.6976 12.0937 12.8643C11.9479 13.0414 11.7916 13.0622 11.5312 12.9268C11.2708 12.8018 10.4375 12.5206 9.45829 11.6456C8.68746 10.9581 8.17704 10.1143 8.02079 9.8539C7.87496 9.59348 7.99996 9.45806 8.13538 9.32265C8.24996 9.20806 8.39579 9.02056 8.52079 8.87473C8.64579 8.7289 8.69788 8.61431 8.78121 8.44765C8.86454 8.27056 8.82288 8.12473 8.76038 7.99973C8.69788 7.87473 8.17704 6.6039 7.96871 6.08306C7.76038 5.58306 7.54163 5.64556 7.38538 5.63515H6.88538C6.70829 5.63515 6.43746 5.69765 6.19788 5.95806C5.96871 6.21848 5.30204 6.84348 5.30204 8.11431C5.30204 9.38515 6.22913 10.6143 6.35413 10.781C6.47913 10.9581 8.17704 13.5622 10.7604 14.6768C11.375 14.9476 11.8541 15.1039 12.2291 15.2185C12.8437 15.4164 13.4062 15.3851 13.8541 15.3226C14.3541 15.2497 15.3854 14.6976 15.5937 14.0935C15.8125 13.4893 15.8125 12.9789 15.7395 12.8643C15.6666 12.7497 15.5104 12.6976 15.25 12.5726Z" fill="#2CB742"/>
  </svg>
);

export default ViewCreditModal;
