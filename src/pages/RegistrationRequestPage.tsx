import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import CustomTitle from '../components/ui/Text/CustomTitle';
import TitleField from '../components/ui/Layouts/TitleLayout';
import PageLayout from '../components/ui/Layouts/PageLayout';
import CustomInput from '../components/ui/fields/CustomInput';
import Pagination from '../components/ui/fields/CustomPagination';
import PaginationLayout from '../components/ui/Layouts/PaginationLayout';
import CountInfoTitle from '../components/ui/Text/CountInfoTitle';
import type { RegistrationResponse, RegistrationFilesResponse } from '../api/types/registrationRequest';
import useRegistrationRequest from '../api/hooks/useRegistrationRequest';
import PhotoViewerModal from '../components/modal/PhotoViewerModal';
import GrayButton from '../components/ui/Buttons/GrayButton';
import DarkCyanButton from '../components/ui/Buttons/DarkCyanButton';

const RegistrationRequestPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationResponse | null>(null);
  const [selectedRequestFiles, setSelectedRequestFiles] = useState<RegistrationFilesResponse | null>(null);
  const [passportData, setPassportData] = useState({
    series: '',
    number: '',
    issuedBy: '',
    issueDate: '',
    birthDate: '',
    birthPlace: '',
  });
  const [rejectionComment, setRejectionComment] = useState('');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageRotations, setImageRotations] = useState<{[key: number]: number}>({});
  const itemsPerPage = 8;

  const { 
    isLoading, 
    error, 
    data: requestsData, 
    getRegistrationResponse,
    getFilesForRegistrationRequest,
    approveRegistrationRequest,
    rejectRegistrationRequest
  } = useRegistrationRequest();

  const loadRequests = useCallback(async () => {
    const params = {
      page: currentPage,
      pageSize: itemsPerPage,
      status: 'pending'
    };
    await getRegistrationResponse(params);
  }, [currentPage, getRegistrationResponse]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSelectRequest = async (request: RegistrationResponse) => {
    setSelectedRequest(request);
    setSelectedRequestFiles(null);
    setImageRotations({});
    
    try {
      const files = await getFilesForRegistrationRequest(request.id);
      setSelectedRequestFiles(files);
    } catch (err) {
      console.error('Ошибка при загрузке файлов заявки:', err);
    }
    
    setPassportData({
      series: '',
      number: '',
      issuedBy: '',
      issueDate: '',
      birthDate: '',
      birthPlace: '',
    });
    setRejectionComment('');
  };

  const handleOpenPhotoModal = (index: number) => {
    setCurrentPhotoIndex(index);
    setIsPhotoModalOpen(true);
  };

  const handleClosePhotoModal = () => {
    setIsPhotoModalOpen(false);
  };

  const getPassportImages = () => {
    if (!selectedRequestFiles) return [];
    
    const images = [];
    if (selectedRequestFiles.passportFirstPageBase64) {
      images.push(`data:image/jpeg;base64,${selectedRequestFiles.passportFirstPageBase64}`);
    }
    if (selectedRequestFiles.passportRegistrationPageBase64) {
      images.push(`data:image/jpeg;base64,${selectedRequestFiles.passportRegistrationPageBase64}`);
    }
    return images;
  };

  const handleRotateImage = (index: number) => {
    setImageRotations(prev => ({
      ...prev,
      [index]: ((prev[index] || 0) + 90) % 360
    }));
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    // Валидация обязательных полей
    if (!passportData.series || !passportData.number || !passportData.issuedBy || 
        !passportData.issueDate || !passportData.birthDate || !passportData.birthPlace) {
      alert('Пожалуйста, заполните все поля данных паспорта');
      return;
    }

    try {
      const approveRequest = {
        registrationRequestId: selectedRequest.id,
        passportSeries: passportData.series,
        passportNumber: passportData.number,
        fullName: passportData.issuedBy,
        birthdate: new Date(passportData.birthDate),
        address: passportData.birthPlace,
        docIssueDate: new Date(passportData.issueDate)
      };

      await approveRegistrationRequest(approveRequest);
      
      // Очистка состояния после успешного подтверждения
      setSelectedRequest(null);
      setSelectedRequestFiles(null);
      setImageRotations({});
      setPassportData({
        series: '',
        number: '',
        issuedBy: '',
        issueDate: '',
        birthDate: '',
        birthPlace: '',
      });
      
      // Перезагрузка списка заявок
      await loadRequests();
      
      alert('Заявка успешно подтверждена');
    } catch (err) {
      console.error('Ошибка при подтверждении заявки:', err);
      alert('Произошла ошибка при подтверждении заявки');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    if (!rejectionComment.trim()) {
      alert('Пожалуйста, укажите причину отказа');
      return;
    }

    try {
      const rejectRequest = {
        registrationRequestId: selectedRequest.id,
        rejectReason: rejectionComment
      };

      await rejectRegistrationRequest(rejectRequest);
      
      // Очистка состояния после успешного отклонения
      setSelectedRequest(null);
      setSelectedRequestFiles(null);
      setImageRotations({});
      setRejectionComment('');
      
      // Перезагрузка списка заявок
      await loadRequests();
      
      alert('Заявка успешно отклонена');
    } catch (err) {
      console.error('Ошибка при отклонении заявки:', err);
      alert('Произошла ошибка при отклонении заявки');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const passportImages = getPassportImages();

  return (
    <PageLayout>
      <TitleField>
        <CustomTitle>Модерация заявок на регистрацию</CustomTitle>
      </TitleField>

      <Container>
        <RequestsList>
          <ListHeader>
            <CountInfoTitle 
              total={requestsData?.totalCount || 0} 
            />
          </ListHeader>

          {isLoading && <LoadingMessage>Загрузка...</LoadingMessage>}
          {error && <ErrorMessage>Ошибка: {error}</ErrorMessage>}
          
          {!isLoading && !error && requestsData?.items.map(request => (
            <RequestCard 
              key={request.id}
              isSelected={selectedRequest?.id === request.id}
              onClick={() => handleSelectRequest(request)}
            >
              <UserInfo>
                <UserDetails>
                  <div>Телефон: {request.phone}</div>
                  <div>Дата заявки: {formatDate(request.createdDate.toString())}</div>
                </UserDetails>
              </UserInfo>
            </RequestCard>
          ))}

          {!isLoading && !error && requestsData && requestsData.totalCount > 0 && (
            <PaginationLayout>
              <Pagination
                total={requestsData.totalCount}
                current={currentPage}
                onChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
              />
            </PaginationLayout>
          )}
        </RequestsList>

        <ReviewPanel>
          {selectedRequest ? (
            <>
              <MediaSection>
                {selectedRequestFiles ? (
                  <>
                    <MediaGroup>
                      <MediaLabel>Видео верификация</MediaLabel>
                      <VideoContainer>
                        <Video 
                          src={`data:video/mp4;base64,${selectedRequestFiles.videoBase64}`}
                          controls
                          preload="metadata"
                        />
                        <MediaLabel style={{marginLeft: "10px"}}>Код подтверждения: {selectedRequest.registrationPhrase}</MediaLabel>
                      </VideoContainer>
                    </MediaGroup>

                    <PassportReviewSection>
                      <PassportImagesContainer>
                        <MediaGroup>
                          <MediaLabel>Фотографии паспорта</MediaLabel>
                          <MediaContainer>
                            <MediaItem>
                              <MediaHeader>
                                <MediaTitle>Основная страница</MediaTitle>
                                <RotateButton onClick={() => handleRotateImage(0)}>
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4.077 3C6.88767 5.202 8.48267 7.15733 8.862 8.866C9.24133 10.5753 9.29867 12.202 9.034 13.746H4L12.214 21L20 13.747H15.216C15.192 10.889 14.12 8.46 12 6.46C9.88 4.46 7.239 3.30667 4.077 3Z" stroke="#50555C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                  </svg>
                                </RotateButton>
                              </MediaHeader>
                              <ImagePreviewWrapper>
                                <RotatableImage 
                                  src={`data:image/jpeg;base64,${selectedRequestFiles.passportFirstPageBase64}`}
                                  alt="Основная страница паспорта"
                                  rotation={imageRotations[0] || 0}
                                  onClick={() => handleOpenPhotoModal(0)}
                                  onError={(e) => {
                                    console.error('Ошибка загрузки изображения паспорта');
                                  }}
                                />
                              </ImagePreviewWrapper>
                            </MediaItem>
                            <MediaItem>
                              <MediaHeader>
                                <MediaTitle>Страница с регистрацией</MediaTitle>
                                <RotateButton onClick={() => handleRotateImage(1)}>
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4.077 3C6.88767 5.202 8.48267 7.15733 8.862 8.866C9.24133 10.5753 9.29867 12.202 9.034 13.746H4L12.214 21L20 13.747H15.216C15.192 10.889 14.12 8.46 12 6.46C9.88 4.46 7.239 3.30667 4.077 3Z" stroke="#50555C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                  </svg>
                                </RotateButton>
                              </MediaHeader>
                              <ImagePreviewWrapper>
                                <RotatableImage 
                                  src={`data:image/jpeg;base64,${selectedRequestFiles.passportRegistrationPageBase64}`}
                                  alt="Страница с регистрацией"
                                  rotation={imageRotations[1] || 0}
                                  onClick={() => handleOpenPhotoModal(1)}
                                  onError={(e) => {
                                    console.error('Ошибка загрузки изображения регистрации');
                                  }}
                                />
                              </ImagePreviewWrapper>
                            </MediaItem>
                          </MediaContainer>
                        </MediaGroup>
                      </PassportImagesContainer>

                      <ScrollablePassportDataSection>
                        <SectionTitle>Данные с паспорта</SectionTitle>
                        <FormGrid>
                          <FormField>
                            <Label>Серия</Label>
                            <CustomInput
                              inputType="text"
                              placeholder="0000"
                              value={passportData.series}
                              onChange={(e) => setPassportData(prev => ({...prev, series: e.target.value}))}
                              maxLength={4}
                            />
                          </FormField>
                          <FormField>
                            <Label>Номер</Label>
                            <CustomInput
                              inputType="text"
                              placeholder="000000"
                              value={passportData.number}
                              onChange={(e) => setPassportData(prev => ({...prev, number: e.target.value}))}
                              maxLength={6}
                            />
                          </FormField>
                          <FormField>
                            <Label>Дата выдачи</Label>
                            <CustomInput
                              inputType="date"
                              value={passportData.issueDate}
                              onChange={(e) => setPassportData(prev => ({...prev, issueDate: e.target.value}))}
                            />
                          </FormField>
                          <FormField>
                            <Label>ФИО</Label>
                            <CustomInput
                              inputType="text"
                              placeholder="ФИО"
                              value={passportData.issuedBy}
                              onChange={(e) => setPassportData(prev => ({...prev, issuedBy: e.target.value}))}
                            />
                          </FormField>
                          <FormField>
                            <Label>Дата рождения</Label>
                            <CustomInput
                              inputType="date"
                              value={passportData.birthDate}
                              onChange={(e) => setPassportData(prev => ({...prev, birthDate: e.target.value}))}
                            />
                          </FormField>
                          <FormField fullWidth>
                            <Label>Адрес регистрации</Label>
                            <CustomInput
                              inputType="text"
                              placeholder="Город, страна"
                              value={passportData.birthPlace}
                              onChange={(e) => setPassportData(prev => ({...prev, birthPlace: e.target.value}))}
                            />
                          </FormField>
                        </FormGrid>
                      </ScrollablePassportDataSection>
                    </PassportReviewSection>
                  </>
                ) : (
                  <LoadingMessage>Загрузка файлов заявки...</LoadingMessage>
                )}
              </MediaSection>

              <ActionSection>
                <RejectionSection>
                  <Label>Комментарий при отклонении</Label>
                  <CustomInput
                    style={{ maxWidth: "100%" }}
                    placeholder="Укажите причину отказа..."
                    value={rejectionComment}
                    onChange={(e) => setRejectionComment(e.target.value)}
                  />
                </RejectionSection>

                <ActionButtons>
                  <GrayButton 
                    onClick={handleReject}
                    disabled={!rejectionComment.trim()}
                  >
                    Отклонить
                  </GrayButton>
                  <DarkCyanButton 
                    onClick={handleApprove}
                    disabled={!passportData.series || !passportData.number || !passportData.issuedBy || 
                             !passportData.issueDate || !passportData.birthDate || !passportData.birthPlace}
                  >
                    Подтвердить регистрацию
                  </DarkCyanButton>
                </ActionButtons>
              </ActionSection>
            </>
          ) : (
            <EmptyState>
              <EmptyStateIcon>📋</EmptyStateIcon>
              <EmptyStateText>Выберите заявку для проверки</EmptyStateText>
            </EmptyState>
          )}
        </ReviewPanel>
      </Container>

      {isPhotoModalOpen && passportImages.length > 0 && (
        <PhotoViewerModal
          images={passportImages}
          initialIndex={currentPhotoIndex}
          onClose={handleClosePhotoModal}
        />
      )}
    </PageLayout>
  );
};

// Стили остаются без изменений...
const Container = styled.div`
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 24px;
  height: calc(100vh - 200px);
`;

const RequestsList = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ListHeader = styled.div`
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
`;

const RequestCard = styled.div<{ isSelected: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  margin-bottom: 12px;
  border: 2px solid ${props => props.isSelected ? 'rgba(0, 125, 136, 1)' : '#e5e7eb'};
  border-radius: 8px;
  background: ${props => props.isSelected ? 'white' : 'white'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(0, 125, 136, 1);
    background: #f8fafc;
  }
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserDetails = styled.div`
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;

  div {
    margin-bottom: 4px;
  }
`;

const ReviewPanel = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const MediaSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MediaGroup = styled.div`
  margin-bottom: 24px;
  margin-top: 0;
`;

const MediaLabel = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #374151;
  text-align: left;
  margin-top: 0;
`;

const PassportReviewSection = styled.div`
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 24px;
  height: 900px; 
  align-items: start;
`;

const PassportImagesContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const MediaContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MediaItem = styled.div`
  text-align: center;
`;

const MediaHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 0 8px;
`;

const MediaTitle = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const RotateButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f3f4f6;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ScrollablePassportDataSection = styled.div`
  padding: 20px;
  border-radius: 8px;
  height: auto;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const ImagePreviewWrapper = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 8px;
`;

const RotatableImage = styled.img<{ rotation: number }>`
  width: 100%;
  object-fit: contain;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  transform: rotate(${props => props.rotation}deg);

  &:hover {
    border-color: rgba(0, 125, 136, 1);
    transform: rotate(${props => props.rotation}deg) scale(1.02);
  }
`;

const VideoContainer = styled.div`
  max-width: 600px;
  display: flex;
  flex-direction: row;
`;

const Video = styled.video`
  width: 100%;
  max-height: 400px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #000;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1f2937;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
`;

const FormField = styled.div<{ fullWidth?: boolean }>`
  grid-column: ${props => props.fullWidth ? '1 / -1' : 'auto'};
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
`;

const ActionSection = styled.div`
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
`;

const RejectionSection = styled.div`
  margin-bottom: 20px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #6b7280;
`;

const EmptyStateIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const EmptyStateText = styled.div`
  font-size: 16px;
  text-align: center;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #ef4444;
`;

export default RegistrationRequestPage;