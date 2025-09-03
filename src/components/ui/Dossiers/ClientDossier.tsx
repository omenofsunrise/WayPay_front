import React, { useState } from 'react';
import styled from 'styled-components';
import { FaArrowLeft, FaPassport, FaComment, FaUpload, FaEye, FaHistory } from 'react-icons/fa';

const DossierContainer = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 24px;
  margin-bottom: 16px;
  position: relative;
`;

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
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
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const InfoValue = styled.span`
  font-size: 14px;
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
  width: 100%;
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
`;

const CommentForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

const CommentTextarea = styled.textarea`
  border: 1px solid #d1d5db;
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
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const CommentAuthor = styled.span`
  font-weight: 600;
  color: #374151;
`;

const CommentDate = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const CommentContent = styled.p`
  margin: 0;
  color: #4b5563;
  line-height: 1.5;
`;

const InstallmentHistorySection = styled(Section)`
  grid-column: 1 / -1;
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

interface Comment {
  id: number;
  author: string;
  date: Date;
  content: string;
}

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
    passportPhoto?: string;
  };
  comments: Comment[];
  installments: Installment[];
  onBack: () => void;
  onAddComment: (comment: string) => void;
  onUploadPassport: (file: File) => void;
}

const ClientDossier: React.FC<ClientDossierProps> = ({
  client,
  comments,
  installments,
  onBack,
  onAddComment,
  onUploadPassport
}) => {
  const [newComment, setNewComment] = useState('');
  const [showPassportModal, setShowPassportModal] = useState(false);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  const handlePassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadPassport(file);
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Не указана';
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'overdue': return '#ef4444';
      default: return '#6b7280';
    }
  };

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
        {/* Основная информация */}
        <Section>
          <SectionTitle>Контактная информация</SectionTitle>
          <InfoGrid>
            <InfoItem>
              <InfoLabel>Телефон</InfoLabel>
              <InfoValue>{client.phone}</InfoValue>
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
          </InfoGrid>
        </Section>

        {/* Паспортные данные */}
        <Section>
          <SectionTitle>
            <FaPassport />
            Паспортные данные
          </SectionTitle>
          <InfoGrid>
            <InfoItem>
              <InfoLabel>Серия и номер</InfoLabel>
              <InfoValue>{client.doc || 'Не указаны'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Год выдачи</InfoLabel>
              <InfoValue>{client.docIssueYear || 'Не указан'}</InfoValue>
            </InfoItem>
          </InfoGrid>

          <PassportPhotoSection>
            <InfoLabel>Фотография паспорта</InfoLabel>
            {client.passportPhoto ? (
              <PassportPhoto onClick={() => setShowPassportModal(true)}>
                <PassportImage src={client.passportPhoto} alt="Паспорт" />
                <PhotoOverlay>
                  <ViewText>
                    <FaEye />
                    Посмотреть
                  </ViewText>
                </PhotoOverlay>
              </PassportPhoto>
            ) : (
              <PassportPhotoPlaceholder>
                <div>Фотография паспорта не загружена</div>
                <UploadButton as="label">
                  <FaUpload />
                  Загрузить фото
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePassportUpload}
                    style={{ display: 'none' }}
                  />
                </UploadButton>
              </PassportPhotoPlaceholder>
            )}
          </PassportPhotoSection>
        </Section>

        {/* Комментарии */}
        <CommentsSection>
          <SectionTitle>
            <FaComment />
            Комментарии
          </SectionTitle>
          <CommentForm onSubmit={handleCommentSubmit}>
            <CommentTextarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Добавьте комментарий о клиенте..."
            />
            <SubmitButton type="submit" disabled={!newComment.trim()}>
              Добавить комментарий
            </SubmitButton>
          </CommentForm>
          <CommentList>
            {comments.map((comment) => (
              <CommentItem key={comment.id}>
                <CommentHeader>
                  <CommentAuthor>{comment.author}</CommentAuthor>
                  <CommentDate>
                    {new Date(comment.date).toLocaleDateString('ru-RU')}
                  </CommentDate>
                </CommentHeader>
                <CommentContent>{comment.content}</CommentContent>
              </CommentItem>
            ))}
          </CommentList>
        </CommentsSection>

        {/* История рассрочек */}
        <InstallmentHistorySection>
          <SectionTitle>
            <FaHistory />
            История рассрочек
          </SectionTitle>
          <HistoryTable>
            <thead>
              <tr>
                <TableHeader>Договор</TableHeader>
                <TableHeader>Сумма</TableHeader>
                <TableHeader>Дата</TableHeader>
                <TableHeader>Статус</TableHeader>
                <TableHeader>Остаток</TableHeader>
              </tr>
            </thead>
            <tbody>
              {installments.map((installment) => (
                <TableRow key={installment.id}>
                  <TableCell>{installment.contractNumber}</TableCell>
                  <TableCell>{formatCurrency(installment.amount)}</TableCell>
                  <TableCell>{formatDate(installment.date)}</TableCell>
                  <TableCell style={{ color: getStatusColor(installment.status) }}>
                    {installment.status === 'paid' && 'Оплачен'}
                    {installment.status === 'pending' && 'Ожидает оплаты'}
                    {installment.status === 'overdue' && 'Просрочен'}
                  </TableCell>
                  <TableCell>{formatCurrency(installment.remainingAmount)}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </HistoryTable>
        </InstallmentHistorySection>
      </DossierGrid>

      {/* Модальное окно для просмотра паспорта */}
      {showPassportModal && client.passportPhoto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowPassportModal(false)}>
          <img
            src={client.passportPhoto}
            alt="Паспорт"
            style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </DossierContainer>
  );
};

export default ClientDossier;