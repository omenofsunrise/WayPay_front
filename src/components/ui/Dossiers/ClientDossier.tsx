import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FaArrowLeft, FaPassport, FaComment, FaUpload, FaEye, FaHistory, FaPaperclip, FaTrash, FaDownload, FaTimes, FaMinus, FaPlus, FaEyeSlash } from 'react-icons/fa';
import useNotes from '../../../api/hooks/useNote';
import type { NoteableType } from '../../../api/types/note';
import { generateAvatar, getInitials, stringToColor } from '../../../utils/avatarUtils';
import { FILE_BASE_URL } from '../../../api/client';
import { useAuth } from '../../../сontext/AuthContext';
import useClient from '../../../api/hooks/useClient';
import useCredit from '../../../api/hooks/useCredit';
import { formatMoney } from '../../../utils/formatPrice';
import Pagination from '../fields/CustomPagination';
import CustomTable from '../tables/CustomTable';
import ViewCreditModal from '../../modal/ViewCreditModal';
import { PassportPhotoType } from '../../../api/types/client';
import { formatPhoneHref } from '../../../utils/phoneUtils';
import PhoneLink from '../links/PhoneLink';

const TabsContainer = styled.div`
  width: 100%;
  border-bottom: 1px solid rgba(209, 213, 219, 1);
  margin-bottom: 20px;
`;

const PassportPhotoTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0;
`;

const PhotoActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const PassportSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TabsList = styled.ul`
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 24px;
  align-items: center;
`;

const TabItem = styled.li<{ $isActive: boolean }>`
  position: relative;
  padding: 12px 0;
  cursor: pointer;
  font-size: 14px;
  font-weight: ${props => props.$isActive ? '600' : '400'};
  color: ${props => props.$isActive ? 'rgba(0, 125, 136, 1)' : 'rgba(107, 114, 128, 1)'};
  transition: all 0.2s ease;

  &:hover {
    color: rgba(0, 125, 136, 0.8);
  }
`;

const ActiveTabIndicator = styled.div`
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: rgba(0, 125, 136, 1);
  border-radius: 2px 2px 0 0;
`;

const TabContentContainer = styled.div`
  margin-top: 20px;
`;

const DossierContainer = styled.div`
  background: none;
  padding: 12px;
  position: relative;
`;

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 0px;
  background: #007D88;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background: #006670;
  }
`;

const DossierHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  margin-top: 60px;
  padding-right: 120px;
`;

const ClientName = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const ClientId = styled.span`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`;

const DossierGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const InfoLabel = styled.span`
  font-size: 15px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const InfoValue = styled.span`
  font-size: 18px;
  color: #111827;
  font-weight: 500;
`;

const PassportPhotoSection = styled.div`
  margin-top: 16px;
`;

const PassportPhotoPlaceholder = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: #007D88;
  }
`;

const UploadButton = styled.button`
  background: #007D88;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 14px;

  &:hover {
    background: #006670;
  }
`;

const PassportPhoto = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
`;

const PassportImage = styled.img`
  width: auto;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
`;

const PhotoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const ViewText = styled.span`
  color: white;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const CommentsSection = styled(Section)`
  grid-column: 1 / -1;
  position: relative;
`;

const ExpandButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: #007D88;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1px;
  transition: background-color 0.2s;

  &:hover {
    background: #006670;
  }
`;

const CommentForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

const CommentTextarea = styled.textarea`
  border: 1px solid #d1d5db;
  background: white;
  color: black;
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: #007D88;
  }
`;

const FileUploadSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FileInputLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  transition: border-color 0.2s;

  &:hover {
    border-color: #007D88;
    color: #007D88;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const SelectedFilesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SelectedFileItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 4px;
  font-size: 12px;
`;

const FileName = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RemoveFileButton = styled.button`
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 2px;
  font-size: 12px;

  &:hover {
    color: #dc2626;
  }
`;

const SubmitButton = styled.button`
  background: #007D88;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  align-self: flex-end;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: #006670;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CommentItem = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: white;
  position: relative;
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const CommentDate = styled.span`
  font-size: 12px;
  color: #6b7280;
  display: block;
  margin-top: 4px;
`;

const CommentContent = styled.p`
  margin: 0 0 12px 0;
  color: #4b5563;
  line-height: 1.5;
  font-size: 14px;
  white-space: pre-wrap;
  text-align: left;
`;

const CommentFiles = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const CommentFileItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #f9fafb;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
  }
`;

const FileDownloadButton = styled.button`
  background: none;
  border: none;
  color: #007D88;
  cursor: pointer;
  padding: 2px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    color: #006670;
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: rgba(80, 85, 92, 1);
  cursor: pointer;
  padding: 4px;
  font-size: 12px;
  position: absolute;
  top: 12px;
  right: 12px;

  &:hover {
    color: #dc2626;
    background: #fef2f2;
    border-radius: 4px;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
`;

const ModalImage = styled.img`
  max-width: 100%;
  max-height: 80vh;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
`;

const CloseButton = styled.button`
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #e5e7eb;
  }
`;

const ImageCaption = styled.div`
  color: white;
  text-align: center;
  margin-top: 12px;
  font-size: 14px;
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  background: #f3f4f6;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #4b5563;
`;

const TableRow = styled.tr`
  &:hover {
    background: #f9fafb;
  }
`;

const Avatar = styled.div<{ src?: string; color?: string }>`
  width: 40px;
  height: 40px;
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

const CommentAuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AuthorDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const AuthorName = styled.span`
  font-weight: 600;
  color: #374151;
  font-size: 14px;
`;

const BlurredPassportImage = styled(PassportImage)`
  filter: blur(8px);
`;

const ViewPassportButton = styled(UploadButton)`
  background: #6b7280;
  
  &:hover {
    background: #4b5563;
  }
`;

const HidePassportButton = styled(UploadButton)`
  background: #6b7280;
  
  &:hover {
    background: #4b5563;
  }
`;

const PassportModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
`;

const PassportModalContent = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PassportModalImage = styled.img`
  max-width: 100%;
  height: 80vh;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  object-fit: contain;
`;

const PassportCloseButton = styled.button`
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  z-index: 10001;
  
  &:hover {
    color: #e5e7eb;
  }
`;

const PassportCaption = styled.div`
  color: white;
  text-align: center;
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
`;

const PassportControls = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

interface Installment {
  id: number;
  contractNumber: string;
  amount: number;
  date: Date;
  status: 'paid' | 'pending' | 'overdue';
  remainingAmount: number;
}

interface ClientDossierProps {
  client: {
    id: number;
    fullName: string;
    phone: string;
    secondPhone?: string;
    doc: string;
    birthdate: Date | null;
    docIssueDate: Date | null;
    docIssueYear: number;
    registrationAddress: string | null;
    hasPassportPhoto?: boolean;
    hasSecondPassportPhoto?: boolean;    
  };
  installments: Installment[];
  onBack: () => void;
  onUploadPassport: (file: File, photoType: PassportPhotoType) => void;
  onDeletePassport: () => void;
  canDeleteComments?: boolean;
}

interface PassportPhotoState {
  mainPage: {
    hasPhoto: boolean;
    isVisible: boolean;
    photoData: string | null;
  };
  registrationPage: {
    hasPhoto: boolean;
    isVisible: boolean;
    photoData: string | null;
  };
}

type TabType = 'comments' | 'history';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_FILES_PER_COMMENT = 1;

const ClientDossier: React.FC<ClientDossierProps> = ({
  client,
  installments,
  onBack,
  onUploadPassport,
  onDeletePassport,
}) => {
  const [newComment, setNewComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [modalImage, setModalImage] = useState<{src: string, name: string} | null>(null);
  const [isCommentFormVisible, setIsCommentFormVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('comments');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { hasRole, authInfo } = useAuth();
  const [isPassportVisible, setIsPassportVisible] = useState(false);
  const [hasPassport, setHasPassport] = useState(client.hasPassportPhoto || false);
  const [passportPhotoData, setPassportPhotoData] = useState<string | null>(null);
  const [creditHistoryPage, setCreditHistoryPage] = useState(1);
  const [viewingCreditId, setViewingCreditId] = useState<number | null>(null);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const itemsPerPage = 10;
  const [passportPhotos, setPassportPhotos] = useState<PassportPhotoState>({
    mainPage: {
      hasPhoto: client.hasPassportPhoto,
      isVisible: false,
      photoData: null
    },
    registrationPage: {
      hasPhoto: client.hasSecondPassportPhoto,
      isVisible: false,
      photoData: null
    }
  });

  const {
    isLoading: isCreditHistoryLoading,
    error: creditHistoryError,
    data: creditHistoryData,
    getCredits
  } = useCredit();
  
  const loadCreditHistory = useCallback(async () => {
    if (activeTab === 'history') {
      await getCredits({
        page: creditHistoryPage,
        pageSize: itemsPerPage,
        clientFullname: client.fullName,
        includeAllStates: true
      });
    }
  }, [activeTab, creditHistoryPage, client.fullName, getCredits]);

  useEffect(() => {
    loadCreditHistory();
  }, [loadCreditHistory]);

  const formatCreditData = (credits: any[] | undefined) => {
    if (!credits) return [];
    
    return credits.map(credit => {
      let status = 'pending';
      if (credit.rest <= 0) {
        status = 'paid';
      } else if (credit.debt > 0) {
        status = 'overdue';
      }
            
      return [
        credit.id.toString(),
        formatDate(credit.creditDate),
        credit.termMonths ? `${credit.termMonths} мес.` : 'Не указан',
        `${formatMoney(credit.accured?.toString() || '')}`,
        `${formatMoney(credit.payed.toString())}`,
        `${formatMoney(credit.rest.toString())}`,
        `${formatMoney(credit.debt.toString())}`,
        status,
      ];
    });
  };

  const handleCreditPageChange = (page: number) => {
    setCreditHistoryPage(page);
  };

  const {
    getPassportPhoto,
    uploadPassportPhoto,
    deletePassportPhoto,
    isLoading: isClientLoading
  } = useClient();
  
  const {
    notes: comments,
    isLoading: isCommentsLoading,
    error: commentsError,
    getClientNotes,
    createNote,
    deleteNote,
    downloadFile
  } = useNotes();
  
  useEffect(() => {
    getClientNotes(client.id);
  }, [client.id, getClientNotes]);

  useEffect(() => {
    setHasPassport(client.hasPassportPhoto || false);
  }, [client.hasPassportPhoto]);

  const handleViewPassport = async (photoType: PassportPhotoType) => {
    try {
      const photoData = await getPassportPhoto(client.id, photoType);
      if (photoData && photoData.base64Data) {
        setPassportPhotos(prev => ({
          ...prev,
          [photoType === PassportPhotoType.MainPage ? 'mainPage' : 'registrationPage']: {
            ...prev[photoType === PassportPhotoType.MainPage ? 'mainPage' : 'registrationPage'],
            isVisible: true,
            photoData: photoData.base64Data
          }
        }));
      }
    } catch (error) {
      console.error('Ошибка при загрузке фото паспорта:', error);
      alert('Не удалось загрузить фото паспорта');
    }
  };

  const handleDeletePassport = async (photoType: PassportPhotoType) => {
    const photoTypeName = photoType === PassportPhotoType.MainPage ? 'основной страницы' : 'страницы с регистрацией';
    
    if (window.confirm(`Вы уверены, что хотите удалить фотографию ${photoTypeName} паспорта?`)) {
      try {
        await deletePassportPhoto(client.id, photoType);
        setPassportPhotos(prev => ({
          ...prev,
          [photoType === PassportPhotoType.MainPage ? 'mainPage' : 'registrationPage']: {
            hasPhoto: false,
            isVisible: false,
            photoData: null
          }
        }));
        onDeletePassport(photoType);
      } catch (error) {
        console.error('Ошибка при удалении фото паспорта:', error);
      }
    }
  };

  const handleHidePassport = (photoType: PassportPhotoType) => {
    setPassportPhotos(prev => ({
      ...prev,
      [photoType === PassportPhotoType.MainPage ? 'mainPage' : 'registrationPage']: {
        ...prev[photoType === PassportPhotoType.MainPage ? 'mainPage' : 'registrationPage'],
        isVisible: false,
        photoData: null
      }
    }));
  };

  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>, photoType: PassportPhotoType) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await uploadPassportPhoto(client.id, file, photoType);
        setPassportPhotos(prev => ({
          ...prev,
          [photoType === PassportPhotoType.MainPage ? 'mainPage' : 'registrationPage']: {
            ...prev[photoType === PassportPhotoType.MainPage ? 'mainPage' : 'registrationPage'],
            hasPhoto: true,
            isVisible: false,
            photoData: null
          }
        }));
        onUploadPassport(file, photoType);
      } catch (error) {
        console.error('Ошибка при загрузке фото:', error);
        alert('Не удалось загрузить фото паспорта');
      }
    }
  };

  const avatarCache = useRef<Map<string, string>>(new Map());

  const getAvatar = (name: string, avatarUrl?: string) => {
    if (avatarUrl) return FILE_BASE_URL + avatarUrl;
    
    if (avatarCache.current.has(name)) {
      return avatarCache.current.get(name);
    }
    
    const initials = getInitials(name);
    const generatedAvatar = generateAvatar(initials);
    avatarCache.current.set(name, generatedAvatar);
    
    return generatedAvatar;
  };
  
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() || selectedFiles.length > 0) {
      try {
        await createNote({
          noteableType: 'client' as NoteableType,
          noteableId: client.id,
          content: newComment.trim(),
          file: selectedFiles.length > 0 ? selectedFiles[0] : undefined
        });
        
        setNewComment('');
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        getClientNotes(client.id);
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (selectedFiles.length + files.length > MAX_FILES_PER_COMMENT) {
      alert(`Можно прикрепить не более ${MAX_FILES_PER_COMMENT} файла`);
      return;
    }
    
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      alert(`Файл "${oversizedFiles[0].name}" превышает максимальный размер ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Не указана';
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const formatDateTime = (date: Date): string => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteComment = async (commentId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      try {
        await deleteNote(commentId);
        getClientNotes(client.id);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const getFileUrlFromBase64 = (base64String: string, fileName: string): string => {
    try {
      let mimeType = 'application/octet-stream';
      
      const mimeMatch = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
      if (mimeMatch && mimeMatch[1]) {
        mimeType = mimeMatch[1];
      } else {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const mimeTypes: { [key: string]: string } = {
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'gif': 'image/gif',
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'txt': 'text/plain',
        };
        if (extension && mimeTypes[extension]) {
          mimeType = mimeTypes[extension];
        }
      }
      
      return `data:${mimeType};base64,${base64String}`;
    } catch (error) {
      console.error('Error creating URL from base64:', error);
      return '';
    }
  };

    const renderPassportPhotoSection = (photoType: PassportPhotoType) => {
    const isMainPage = photoType === PassportPhotoType.MainPage;
    const photoState = passportPhotos[isMainPage ? 'mainPage' : 'registrationPage'];
    const title = isMainPage ? 'Основная страница' : 'Страница с регистрацией';

    return (
      <PassportPhotoSection key={photoType}>
        <PassportPhotoTitle>{title}</PassportPhotoTitle>
        
        {photoState.hasPhoto ? (
          <>
            {photoState.isVisible && photoState.photoData ? (
              <PassportPhoto>
                <PassportImage 
                  src={`data:image/jpeg;base64,${photoState.photoData}`} 
                  alt={title}
                  onClick={() => openPassportModal(photoType)}
                />
                <PhotoActions>
                  <UploadButton 
                    onClick={() => handleDeletePassport(photoType)}
                    style={{ background: 'rgba(209, 213, 219, 1)', color: 'black' }}
                  >
                    <FaTrash />
                    Удалить
                  </UploadButton>
                  <HidePassportButton 
                    onClick={() => handleHidePassport(photoType)}
                    style={{ background: 'rgba(209, 213, 219, 1)', color: 'black' }}
                  >
                    <FaEyeSlash />
                    Скрыть
                  </HidePassportButton>
                  <UploadButton as="label">
                    <FaUpload />
                    Заменить
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handlePassportUpload(e, photoType)}
                      style={{ display: 'none' }}
                    />
                  </UploadButton>
                </PhotoActions>
              </PassportPhoto>
            ) : (
              <PassportPhoto>
                <BlurredPassportImage 
                  src="/passport-placeholder.jpg" 
                  alt={`Заблокированный ${title.toLowerCase()}`}
                />
                <PhotoActions>
                  <UploadButton 
                    onClick={() => handleDeletePassport(photoType)}
                    style={{ background: 'rgba(209, 213, 219, 1)', color: 'black' }}
                  >
                    <FaTrash />
                    Удалить
                  </UploadButton>
                  <ViewPassportButton 
                    onClick={() => handleViewPassport(photoType)}
                    style={{ background: 'rgba(209, 213, 219, 1)', color: 'black' }}
                  >
                    <FaEye />
                    Посмотреть
                  </ViewPassportButton>
                  <UploadButton as="label">
                    <FaUpload />
                    Заменить
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handlePassportUpload(e, photoType)}
                      style={{ display: 'none' }}
                    />
                  </UploadButton>
                </PhotoActions>
              </PassportPhoto>
            )}
          </>
        ) : (
          <PassportPhotoPlaceholder>
            <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
              {title} не загружена
            </p>
            <UploadButton as="label">
              <FaUpload />
              Загрузить фото
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handlePassportUpload(e, photoType)}
                style={{ display: 'none' }}
              />
            </UploadButton>
          </PassportPhotoPlaceholder>
        )}
      </PassportPhotoSection>
    );
  };

  const renderFile = (comment: any) => {
    if (!comment.fileName || !comment.fileBase64) return null;

    const fileUrl = getFileUrlFromBase64(comment.fileBase64, comment.fileName);
    const isImage = comment.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);

    if (isImage) {
      return (
        <div style={{ marginTop: '12px' }}>
          <img 
            onClick={() => setModalImage({src: fileUrl, name: comment.fileName})}
            src={fileUrl} 
            alt={comment.fileName}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '200px', 
              borderRadius: '4px',
              border: '1px solid #e5e7eb'
            }}
          />
        </div>
      );
    } else {
      return (
        <CommentFiles>
          <CommentFileItem>
            <FaPaperclip size={12} color='black'/>
            <span style={{ flex: 1, fontSize: '12px', color: "black" }}>
              {comment.fileName}
            </span>
            <FileDownloadButton
              onClick={() => {
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = comment.fileName!;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              title="Скачать файл"
            >
              <FaDownload size={12} />
              Скачать
            </FileDownloadButton>
          </CommentFileItem>
        </CommentFiles>
      );
    }
  };

  const commentsContent = (
    <>
      {isCommentFormVisible && (hasRole('админ') || hasRole('директор') || hasRole('суперадмин')) && (
        <CommentForm onSubmit={handleCommentSubmit}>
          <CommentTextarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Добавьте комментарий о клиенте..."
          />
          
          <FileUploadSection>
            <FileInputLabel>
              <FaPaperclip />
              Прикрепить файл (макс. {formatFileSize(MAX_FILE_SIZE)})
              <FileInput
                ref={fileInputRef}
                type="file"
                multiple={false}
                onChange={handleFileSelect}
                accept="*/*"
              />
            </FileInputLabel>
            
            {selectedFiles.length > 0 && (
              <SelectedFilesList>
                {selectedFiles.map((file, index) => (
                  <SelectedFileItem key={index}>
                    <FileName>
                      <FaPaperclip size={10} />
                      {file.name} ({formatFileSize(file.size)})
                    </FileName>
                    <RemoveFileButton
                      onClick={() => handleRemoveFile(index)}
                      title="Удалить файл"
                    >
                      <FaTrash size={10} />
                    </RemoveFileButton>
                  </SelectedFileItem>
                ))}
              </SelectedFilesList>
            )}
          </FileUploadSection>
          <SubmitButton
            type="submit"
            disabled={isCommentsLoading || (!newComment.trim()) || selectedFiles.some(file => file.size > MAX_FILE_SIZE)}
            title={selectedFiles.some(file => file.size > MAX_FILE_SIZE) ? `Размер файла превышает ${formatFileSize(MAX_FILE_SIZE)}` : ''}
          >
            {isCommentsLoading ? 'Добавление...' : 'Добавить комментарий'}
            {selectedFiles.some(file => file.size > MAX_FILE_SIZE) && ' (Файл слишком большой)'}
          </SubmitButton>
        </CommentForm>
      )}

      {isCommentsLoading ? (
        <div>Загрузка комментариев...</div>
      ) : (
        <CommentList>
          {comments.map((comment) => {
            const avatarSrc = getAvatar(comment.employeeName, comment.employeeAvatar);
            const initials = getInitials(comment.employeeName);
            const bgColor = stringToColor(comment.employeeName);
            
            return (
              <CommentItem key={comment.id}>
                <CommentHeader>
                  <CommentAuthorInfo>
                    <Avatar 
                      src={avatarSrc} 
                      color={bgColor}
                      title={comment.employeeName}
                    >
                      {!avatarSrc && initials}
                    </Avatar>
                    <AuthorDetails>
                      <AuthorName>{comment.employeeName}</AuthorName>
                      <CommentDate>{formatDateTime(new Date(comment.createdAt))}</CommentDate>
                    </AuthorDetails>
                  </CommentAuthorInfo>
                  {(comment.employeeId === authInfo?.employee.id || hasRole('суперадмин')) && (
                    <DeleteButton
                      onClick={() => handleDeleteComment(comment.id)}
                      title="Удалить комментарий"
                    >
                      <FaTrash size={12} />
                    </DeleteButton>
                  )}
                </CommentHeader>
                
                {comment.content && (
                  <CommentContent>{comment.content}</CommentContent>
                )}
                
                {comment.fileName && comment.fileBase64 && (
                  <CommentFiles>
                    {renderFile(comment)}
                  </CommentFiles>
                )}
              </CommentItem>
            );
          })}
        </CommentList>
      )}
    </>
  );

  const historyContent = (
    <>
      {isCreditHistoryLoading ? (
        <div>Загрузка истории кредитов...</div>
      ) : creditHistoryError ? (
        <div>Ошибка загрузки истории: {creditHistoryError}</div>
      ) : (
        <>
          <CustomTable 
            columns={[
              { name: "№ Договора", isSortable: true },
              { name: "Дата договора", isSortable: true, align: "right" },
              { name: "Срок", isSortable: true, align: "right" },
              { name: "Начислено", isSortable: true, align: "right" },
              { name: "Уплачено", isSortable: true, align: "right" },
              { name: "Остаток", isSortable: true, align: "right" },
              { name: "Долг", isSortable: true, align: "right" },
              { name: "status", isHidden: true },
              { name: "color", isHidden: true } 
            ]} 
            data={formatCreditData(creditHistoryData?.items)}
          />
          
          {creditHistoryData && creditHistoryData.totalCount > itemsPerPage && (
            <Pagination
              total={creditHistoryData.totalCount}
              current={creditHistoryPage}
              onChange={handleCreditPageChange}
              itemsPerPage={itemsPerPage}
            />
          )}
        </>
      )}
    </>
  );

  const tabs = [
    {
      id: 'comments',
      label: 'Комментарии',
      content: commentsContent
    },
    {
      id: 'history',
      label: 'История',
      content: historyContent
    }
  ];

  return (
    <DossierContainer>
      <BackButton onClick={onBack}>
        <FaArrowLeft />
        Назад к поиску
      </BackButton>

      <DossierHeader>
        <div>
          <ClientName>{client.fullName}</ClientName>
          <ClientId>ID: {client.id}</ClientId>
        </div>
      </DossierHeader>

      <DossierGrid>
        <Section>
          <InfoGrid>
            <InfoItem>
              <InfoLabel>Телефон</InfoLabel>
              <InfoValue>
                {client.phone ? (
                  <PhoneLink href={formatPhoneHref(client.phone)}>
                    {client.phone}
                  </PhoneLink>
                ) : (
                  ''
                )}
              </InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>WhatsApp</InfoLabel>
              <InfoValue>{client.secondPhone || 'Не указан'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Дата рождения</InfoLabel>
              <InfoValue>{formatDate(client.birthdate)}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Адрес регистрации</InfoLabel>
              <InfoValue>{client.registrationAddress || 'Не указан'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Серия и номер</InfoLabel>
              <InfoValue>{client.doc || 'Не указаны'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Год выдачи</InfoLabel>
              <InfoValue>{client.docIssueYear || 'Не указан'}</InfoValue>
            </InfoItem>
          </InfoGrid>
        </Section>

        <Section>
          <SectionTitle>Паспорт</SectionTitle>
          <PassportSection>
            {renderPassportPhotoSection(PassportPhotoType.MainPage)}
            {renderPassportPhotoSection(PassportPhotoType.RegistrationPage)}
          </PassportSection>
        </Section>

        <CommentsSection>
          <SectionTitle>
            {activeTab === 'comments' ? <FaComment /> : <FaHistory />}
            {activeTab === 'comments' ? 'Комментарии' : 'История'}
            {isCommentsLoading && activeTab === 'comments' && <span> (Загрузка...)</span>}
          </SectionTitle>
          
          {(hasRole('админ') || hasRole('директор') || hasRole('суперадмин')) && (
            <ExpandButton 
              onClick={() => setIsCommentFormVisible(!isCommentFormVisible)}
              title={isCommentFormVisible ? 'Свернуть форму' : 'Добавить комментарий'}
              style={{ display: activeTab === 'comments' ? 'flex' : 'none' }}
            >
              {isCommentFormVisible ? <FaMinus size={10}/> : <FaPlus size={10}/>}
            </ExpandButton>
          )}

          {commentsError && activeTab === 'comments' && (
            <div style={{ color: 'red', marginBottom: '16px' }}>
              Ошибка загрузки комментариев: {commentsError}
            </div>
          )}
          
          <TabsContainer>
            <TabsList>
              {tabs.map((tab) => (
                <TabItem 
                  key={tab.id}
                  $isActive={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                >
                  {tab.label}
                  {activeTab === tab.id && <ActiveTabIndicator />}
                </TabItem>
              ))}
            </TabsList>
          </TabsContainer>
          
          <TabContentContainer>
            {activeTab === 'comments' ? commentsContent : historyContent}
          </TabContentContainer>
        </CommentsSection>
      </DossierGrid>

      {showPassportModal && modalImage && (
        <PassportModalOverlay onClick={() => setShowPassportModal(false)}>
          <PassportModalContent onClick={(e) => e.stopPropagation()}>
            <PassportCloseButton onClick={() => setShowPassportModal(false)}>
              <FaTimes />
            </PassportCloseButton>
            
            <PassportModalImage
              src={modalImage.src}
              alt={modalImage.name}
            />
            
            <PassportCaption>{modalImage.name}</PassportCaption>
                       
          </PassportModalContent>
        </PassportModalOverlay>
      )}

      {modalImage && !showPassportModal && (
        <ModalOverlay onClick={() => setModalImage(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => setModalImage(null)}>
              <FaTimes />
            </CloseButton>
            <ModalImage
              src={modalImage.src}
              alt={modalImage.name}
            />
            <ImageCaption>{modalImage.name}</ImageCaption>
          </ModalContent>
        </ModalOverlay>
      )}

      <ViewCreditModal
        id={viewingCreditId || 0}
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
      />
    </DossierContainer>
  );
};

export default ClientDossier;
