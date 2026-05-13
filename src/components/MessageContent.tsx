import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import type { ChatMessage, InteractiveButton } from '../api/types/whatsapp';
import { useMediaLoader } from '../api/hooks/useMediaLoader';

interface MessageContentProps {
  message: ChatMessage;
}

const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
  const { loadMedia } = useMediaLoader();
  
  const [mediaData, setMediaData] = useState<Record<string, {
    data: string | null;
    isLoading: boolean;
    hasError: boolean;
  }>>({});
  
  const isMounted = useRef(true);
  const loadAttemptedRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { 
      isMounted.current = false;
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const getCurrentMedia = useCallback(() => {
    if (message.image?.id) return { id: message.image.id, type: 'image', data: message.image };
    if (message.video?.id) return { id: message.video.id, type: 'video', data: message.video };
    if (message.audio?.id) return { id: message.audio.id, type: 'audio', data: message.audio };
    if (message.voice?.id) return { id: message.voice.id, type: 'voice', data: message.voice };
    if (message.document?.id) return { id: message.document.id, type: 'document', data: message.document };
    if (message.sticker?.id) return { id: message.sticker.id, type: 'sticker', data: message.sticker };
    return null;
  }, [message.image, message.video, message.audio, message.voice, message.document, message.sticker]);

  const currentMedia = getCurrentMedia();
  const mediaKey = currentMedia?.id || '';
  const currentMediaState = mediaData[mediaKey] || { data: null, isLoading: false, hasError: false };

  const loadMediaAsync = useCallback(async (mediaId: string) => {
    if (loadAttemptedRef.current.has(mediaId)) {
      return;
    }
    
    if (!isMounted.current) return;
    
    // Проверяем текущее состояние
    if (currentMediaState.isLoading || currentMediaState.data || currentMediaState.hasError) {
      return;
    }
    
    loadAttemptedRef.current.add(mediaId);
    
    setMediaData(prev => ({
      ...prev,
      [mediaId]: { data: null, isLoading: true, hasError: false }
    }));
    
    try {
      const result = await loadMedia(mediaId);

      if (isMounted.current && result && result.data && result.data.length > 0) {
        let base64Data = result.data;
        
        if (base64Data.startsWith('data:')) {
          setMediaData(prev => ({
            ...prev,
            [mediaId]: { data: base64Data, isLoading: false, hasError: false }
          }));
        } else {
          const dataUrl = `data:${result.mimeType || 'image/jpeg'};base64,${base64Data}`;
          setMediaData(prev => ({
            ...prev,
            [mediaId]: { data: dataUrl, isLoading: false, hasError: false }
          }));

          try {
            const testString = base64Data.substring(0, 100);
            const decoded = atob(testString);
          } catch (e) {
            console.error('❌ Invalid base64 data:', e);
          }
          
          setMediaData(prev => ({
            ...prev,
            [mediaId]: { data: dataUrl, isLoading: false, hasError: false }
          }));
        }
      } else if (isMounted.current) {
        console.error('No data in response');
        setMediaData(prev => ({
          ...prev,
          [mediaId]: { data: null, isLoading: false, hasError: true }
        }));
      }

    } catch (error) {
      console.error('Error loading media:', error);
      if (isMounted.current) {
        setMediaData(prev => ({
          ...prev,
          [mediaId]: { data: null, isLoading: false, hasError: true }
        }));
      }
    }
  }, [loadMedia, currentMediaState.isLoading, currentMediaState.data, currentMediaState.hasError]);

  useEffect(() => {
    if (mediaData[mediaKey]?.data) {
      console.log(`✅ Media ${mediaKey} loaded:`, mediaData[mediaKey].data);
    }
  }, [mediaData, mediaKey]);

  useEffect(() => {
    if (!currentMedia) return;

    let inlineData: string | null = null;
    if (currentMedia.type === 'image' && message.image?.data) inlineData = message.image.data;
    else if (currentMedia.type === 'video' && message.video?.data) inlineData = message.video.data;
    else if (currentMedia.type === 'audio' && message.audio?.data) inlineData = message.audio.data;
    else if (currentMedia.type === 'voice' && message.voice?.data) inlineData = message.voice.data;
    else if (currentMedia.type === 'document' && message.document?.data) inlineData = message.document.data;
    else if (currentMedia.type === 'sticker' && message.sticker?.data) inlineData = message.sticker.data;
    
    if (inlineData) {
      setMediaData(prev => ({
        ...prev,
        [currentMedia.id]: { data: inlineData, isLoading: false, hasError: false }
      }));
      loadAttemptedRef.current.add(currentMedia.id);
      return;
    }
  }, [currentMedia, message.image?.data, message.video?.data, message.audio?.data, message.voice?.data, message.document?.data, message.sticker?.data]);

  useEffect(() => {
    if (!currentMedia) return;
    
    if (currentMediaState.data || currentMediaState.hasError || currentMediaState.isLoading) {
      return;
    }
    
    if (loadAttemptedRef.current.has(currentMedia.id)) {
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && currentMedia && !loadAttemptedRef.current.has(currentMedia.id)) {
              loadMediaAsync(currentMedia.id);
              if (observerRef.current) {
                observerRef.current.disconnect();
              }
            }
          });
        },
        { threshold: 0.1, rootMargin: '50px' }
      );
    }

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
    };
  }, [currentMedia, currentMediaState.data, currentMediaState.hasError, currentMediaState.isLoading, loadMediaAsync]);

  const handleRetry = useCallback(() => {
    if (!currentMedia) return;
    
    setMediaData(prev => ({
      ...prev,
      [currentMedia.id]: { data: null, isLoading: false, hasError: false }
    }));
    loadAttemptedRef.current.delete(currentMedia.id);
    loadMediaAsync(currentMedia.id);
  }, [currentMedia, loadMediaAsync]);

  if (message.text) {
    return (
      <MessageText>
        {message.text.body}
        {message.text.buttons.length > 0 && (
          <ButtonsContainer>
            {message.text.buttons.map((button, idx) => (
              <Button key={idx} onClick={() => handleButtonClick(button)}>
                {button.title}
              </Button>
            ))}
          </ButtonsContainer>
        )}
      </MessageText>
    );
  }

  if (message.image && currentMedia) {
    const image = message.image;
    const finalSrc = currentMediaState.data || image.link || image.preview;
    const showLoading = currentMediaState.isLoading && !currentMediaState.data && !currentMediaState.hasError;
    const showError = currentMediaState.hasError && !currentMediaState.data;
    const showImage = finalSrc && !currentMediaState.hasError;
    
    return (
      <MediaContainer ref={containerRef}>
        {image.caption && <Caption>{image.caption}</Caption>}
        
        {showLoading && (
          <MediaPlaceholder>
            <Spinner size="small" />
            <LoadingText>Загрузка изображения...</LoadingText>
          </MediaPlaceholder>
        )}
        
        {showError && (
          <MediaPlaceholder>
            <span>🖼️</span>
            <span>Не удалось загрузить изображение</span>
            {image.link && (
              <RetryLink href={image.link} target="_blank" rel="noopener noreferrer">
                Открыть оригинал
              </RetryLink>
            )}
            <RetryButton onClick={handleRetry}>
              🔄 Повторить
            </RetryButton>
          </MediaPlaceholder>
        )}
        
        {showImage && (
          <Image 
            src={finalSrc} 
            alt={image.caption || 'Image'}
            onError={() => {
              setMediaData(prev => ({
                ...prev,
                [currentMedia.id]: { ...prev[currentMedia.id], data: null, hasError: true }
              }));
            }}
            loading="lazy"
          />
        )}
        
        {image.fileSize > 0 && (
          <FileInfo>{formatFileSize(image.fileSize)}</FileInfo>
        )}
      </MediaContainer>
    );
  }

  if (message.video && currentMedia) {
    const video = message.video;
    const videoSrc = currentMediaState.data || video.link;
    const showLoading = currentMediaState.isLoading && !currentMediaState.data && !currentMediaState.hasError;
    const showError = currentMediaState.hasError && !currentMediaState.data;
    
    return (
      <MediaContainer ref={containerRef}>
        {video.caption && <Caption>{video.caption}</Caption>}
        
        {showLoading && (
          <MediaPlaceholder>
            <Spinner size="small" />
            <LoadingText>Загрузка видео...</LoadingText>
          </MediaPlaceholder>
        )}
        
        {showError && (
          <MediaPlaceholder>
            <span>🎥</span>
            <span>Видео недоступно</span>
            {video.link && (
              <RetryLink href={video.link} target="_blank" rel="noopener noreferrer">
                Открыть оригинал
              </RetryLink>
            )}
            <RetryButton onClick={handleRetry}>
              🔄 Повторить
            </RetryButton>
          </MediaPlaceholder>
        )}
        
        {videoSrc && !currentMediaState.hasError && (
          <Video controls preload="metadata">
            <source src={videoSrc} type={video.mimeType} />
            Ваш браузер не поддерживает видео
          </Video>
        )}
        
        {video.seconds > 0 && <VideoDuration>{formatDuration(video.seconds)}</VideoDuration>}
        {video.fileSize > 0 && (
          <FileInfo>{formatFileSize(video.fileSize)}</FileInfo>
        )}
      </MediaContainer>
    );
  }

  if (message.audio && currentMedia) {
    const audio = message.audio;
    const audioSrc = currentMediaState.data || audio.link;
    const showLoading = currentMediaState.isLoading && !currentMediaState.data && !currentMediaState.hasError;
    const showError = currentMediaState.hasError && !currentMediaState.data;
    
    return (
      <MediaContainer ref={containerRef}>
        {showLoading && (
          <MediaPlaceholder>
            <Spinner size="small" />
            <LoadingText>Загрузка аудио...</LoadingText>
          </MediaPlaceholder>
        )}
        
        {audioSrc && !currentMediaState.hasError && (
          <Audio controls preload="metadata">
            <source src={audioSrc} type={audio.mimeType} />
            Ваш браузер не поддерживает аудио
          </Audio>
        )}
        
        {showError && (
          <MediaPlaceholder>
            <span>🎵</span>
            <span>Аудио недоступно</span>
            <RetryButton onClick={handleRetry}>
              🔄 Повторить
            </RetryButton>
          </MediaPlaceholder>
        )}
        
        <AudioInfo>
          {audio.seconds > 0 && (
            <span>⏱️ {formatDuration(audio.seconds)}</span>
          )}
          {audio.fileName && (
            <span>📄 {audio.fileName}</span>
          )}
        </AudioInfo>
      </MediaContainer>
    );
  }

  if (message.voice && currentMedia) {
    const voice = message.voice;
    const voiceSrc = currentMediaState.data || voice.link;
    const showLoading = currentMediaState.isLoading && !currentMediaState.data && !currentMediaState.hasError;
    const showError = currentMediaState.hasError && !currentMediaState.data;
    
    return (
      <MediaContainer ref={containerRef}>
        {showLoading && (
          <MediaPlaceholder>
            <Spinner size="small" />
            <LoadingText>Загрузка голосового...</LoadingText>
          </MediaPlaceholder>
        )}
        
        {voiceSrc && !currentMediaState.hasError && (
          <Audio controls preload="metadata">
            <source src={voiceSrc} type={voice.mimeType} />
            Ваш браузер не поддерживает аудио
          </Audio>
        )}
        
        {showError && (
          <MediaPlaceholder>
            <span>🎙️</span>
            <span>Голосовое недоступно</span>
            <RetryButton onClick={handleRetry}>
              🔄 Повторить
            </RetryButton>
          </MediaPlaceholder>
        )}
        
        <VoiceInfo>
          <span>🎙️ Голосовое сообщение</span>
          {voice.seconds > 0 && (
            <span>{formatDuration(voice.seconds)}</span>
          )}
        </VoiceInfo>
      </MediaContainer>
    );
  }

  if (message.document && currentMedia) {
    const doc = message.document;
    const fileIcon = getFileIcon(doc.mimeType);
    const displayName = doc.fileName || 'Документ';
    const showLoading = currentMediaState.isLoading && !currentMediaState.data && !currentMediaState.hasError;
    
    const handleDownload = async (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (currentMediaState.data) {
        downloadFromBase64(currentMediaState.data, displayName);
      } else if (doc.link) {
        window.open(doc.link, '_blank');
      } else if (doc.id && !currentMediaState.isLoading) {
        handleRetry();
      }
    };
    
    const handleOpen = () => {
      if (doc.link && !doc.id) {
        window.open(doc.link, '_blank');
      } else if (currentMediaState.data) {
        downloadFromBase64(currentMediaState.data, displayName);
      }
    };
    
    return (
      <DocumentContainer ref={containerRef} onClick={handleOpen}>
        <DocumentIcon>{fileIcon}</DocumentIcon>
        <DocumentInfo>
          <DocumentName>{displayName}</DocumentName>
          <DocumentMeta>
            {doc.fileSize > 0 && formatFileSize(doc.fileSize)}
            {doc.pageCount > 0 && ` • ${doc.pageCount} стр.`}
          </DocumentMeta>
          {showLoading && <LoadingText small>Загрузка...</LoadingText>}
          {currentMediaState.hasError && <ErrorText>Ошибка загрузки</ErrorText>}
        </DocumentInfo>
        <DownloadIcon onClick={handleDownload}>
          {showLoading ? <Spinner size="small" /> : '📥'}
        </DownloadIcon>
      </DocumentContainer>
    );
  }

  if (message.sticker && currentMedia) {
    const sticker = message.sticker;
    const stickerSrc = currentMediaState.data || sticker.link || sticker.preview;
    const showLoading = currentMediaState.isLoading && !currentMediaState.data && !currentMediaState.hasError;
    
    return (
      <StickerContainer ref={containerRef}>
        {showLoading && (
          <StickerPlaceholder>
            <Spinner size="small" />
          </StickerPlaceholder>
        )}
        
        {stickerSrc && !currentMediaState.hasError && (
          <StickerImage 
            src={stickerSrc} 
            alt="Sticker"
            loading="lazy"
            onError={() => {
              setMediaData(prev => ({
                ...prev,
                [currentMedia.id]: { ...prev[currentMedia.id], data: null, hasError: true }
              }));
            }}
          />
        )}
        
        {currentMediaState.hasError && !currentMediaState.data && (
          <StickerPlaceholder onClick={handleRetry}>
            <span>😊</span>
            <RetryText>Повторить</RetryText>
          </StickerPlaceholder>
        )}
        
        {sticker.animated && <AnimatedBadge>GIF</AnimatedBadge>}
      </StickerContainer>
    );
  }

  if (message.location) {
    const location = message.location;
    const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    return (
      <LocationContainer onClick={() => window.open(mapsUrl, '_blank')}>
        <LocationIcon>📍</LocationIcon>
        <LocationInfo>
          {location.name && <LocationName>{location.name}</LocationName>}
          {location.address && <LocationAddress>{location.address}</LocationAddress>}
          {!location.name && !location.address && (
            <LocationCoords>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </LocationCoords>
          )}
        </LocationInfo>
      </LocationContainer>
    );
  }

  if (message.contact) {
    return (
      <ContactContainer>
        <ContactIcon>👤</ContactIcon>
        <ContactInfo>
          <ContactName>{message.contact.name}</ContactName>
          {message.contact.vcard && (
            <ContactVcard 
              onClick={(e) => {
                e.stopPropagation();
                downloadVCard(message.contact!.vcard, message.contact!.name);
              }}
            >
              📇 Сохранить контакт
            </ContactVcard>
          )}
        </ContactInfo>
      </ContactContainer>
    );
  }

  if (message.poll) {
    const totalVotes = message.poll.results?.reduce((sum, r) => sum + r.count, 0) || 0;
    return (
      <PollContainer>
        <PollTitle>{message.poll.title}</PollTitle>
        {message.poll.results?.map((result) => (
          <PollOption key={result.id}>
            <PollOptionText>{result.name}</PollOptionText>
            <PollBarContainer>
              <PollBar width={totalVotes > 0 ? (result.count / totalVotes) * 100 : 0}>
                <PollCount>{result.count}</PollCount>
              </PollBar>
            </PollBarContainer>
          </PollOption>
        ))}
        <PollTotal>Всего голосов: {totalVotes}</PollTotal>
      </PollContainer>
    );
  }

  if (message.reactions.length > 0 && !message.text && !message.image && !message.video) {
    return (
      <ReactionsContainer>
        {message.reactions.map((reaction) => (
          <Reaction key={reaction.id}>
            {reaction.emoji} {reaction.count > 1 && reaction.count}
          </Reaction>
        ))}
      </ReactionsContainer>
    );
  }

  return (
    <MessageText>
      {message.displayText || '[Неизвестный тип сообщения]'}
    </MessageText>
  );

  function handleButtonClick(button: InteractiveButton) {
    if (button.url) {
      window.open(button.url, '_blank');
    } else if (button.phoneNumber) {
      window.location.href = `tel:${button.phoneNumber}`;
    } else if (button.copyCode) {
      navigator.clipboard.writeText(button.copyCode);
      alert('Код скопирован!');
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function getFileIcon(mimeType?: string): string {
    if (!mimeType) return '📄';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📘';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📗';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎥';
    if (mimeType.includes('audio')) return '🎵';
    return '📄';
  }

  function downloadFromBase64(dataUrl: string, fileName: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function downloadVCard(vcard: string, name: string) {
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

const MessageText = styled.div`
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const Button = styled.button`
  background-color: #075E54;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 18px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: #128C7E;
  }
`;

const MediaContainer = styled.div`
  max-width: 100%;
`;

const Caption = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
`;

const Image = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

const Video = styled.video`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
`;

const Audio = styled.audio`
  width: 200px;
  height: 40px;
`;

const MediaPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background-color: #f0f0f0;
  border-radius: 8px;
  font-size: 12px;
  color: #666;
`;

const LoadingText = styled.span<{ small?: boolean }>`
  font-size: ${props => props.small ? '10px' : '12px'};
  color: #666;
`;

const FileInfo = styled.div`
  font-size: 10px;
  color: #8696A0;
  margin-top: 4px;
`;

const VideoDuration = styled.div`
  font-size: 10px;
  color: #8696A0;
  margin-top: 4px;
`;

const AudioInfo = styled.div`
  display: flex;
  gap: 8px;
  font-size: 10px;
  color: #8696A0;
  margin-top: 4px;
`;

const VoiceInfo = styled.div`
  display: flex;
  gap: 8px;
  font-size: 10px;
  color: #8696A0;
  margin-top: 4px;
`;

const DocumentContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  min-width: 200px;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const DocumentIcon = styled.div`
  font-size: 32px;
`;

const DocumentInfo = styled.div`
  flex: 1;
`;

const DocumentName = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  word-break: break-word;
`;

const DocumentMeta = styled.div`
  font-size: 10px;
  color: #666;
`;

const ErrorText = styled.div`
  font-size: 10px;
  color: #ff4444;
  margin-top: 4px;
`;

const DownloadIcon = styled.div`
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const StickerContainer = styled.div`
  position: relative;
  display: inline-block;
  cursor: pointer;
`;

const StickerImage = styled.img`
  max-width: 128px;
  max-height: 128px;
`;

const StickerPlaceholder = styled.div`
  width: 96px;
  height: 96px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background-color: #f0f0f0;
  border-radius: 12px;
  font-size: 32px;
  cursor: pointer;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const RetryText = styled.span`
  font-size: 10px;
  color: #666;
`;

const AnimatedBadge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
`;

const LocationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background-color: #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const LocationIcon = styled.div`
  font-size: 24px;
`;

const LocationInfo = styled.div`
  flex: 1;
`;

const LocationName = styled.div`
  font-size: 14px;
  font-weight: 500;
`;

const LocationAddress = styled.div`
  font-size: 12px;
  color: #666;
`;

const LocationCoords = styled.div`
  font-size: 12px;
  font-family: monospace;
`;

const ContactContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background-color: #f0f0f0;
  border-radius: 8px;
`;

const ContactIcon = styled.div`
  font-size: 32px;
`;

const ContactInfo = styled.div`
  flex: 1;
`;

const ContactName = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const ContactVcard = styled.button`
  background: none;
  border: none;
  color: #075E54;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  
  &:hover {
    text-decoration: underline;
  }
`;

const PollContainer = styled.div`
  padding: 12px;
  background-color: #f0f0f0;
  border-radius: 8px;
  min-width: 200px;
`;

const PollTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
`;

const PollOption = styled.div`
  margin-bottom: 8px;
`;

const PollOptionText = styled.div`
  font-size: 12px;
  margin-bottom: 4px;
`;

const PollBarContainer = styled.div`
  background-color: #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
`;

const PollBar = styled.div<{ width: number }>`
  background-color: #075E54;
  width: ${props => Math.min(props.width, 100)}%;
  height: 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  transition: width 0.3s ease;
`;

const PollCount = styled.span`
  color: white;
  font-size: 11px;
  font-weight: 500;
`;

const PollTotal = styled.div`
  font-size: 10px;
  color: #666;
  margin-top: 8px;
  text-align: right;
`;

const ReactionsContainer = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
`;

const Reaction = styled.span`
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 11px;
`;

const Spinner = styled.div<{ size?: 'small' | 'normal' }>`
  width: ${props => props.size === 'small' ? '20px' : '40px'};
  height: ${props => props.size === 'small' ? '20px' : '40px'};
  border: 2px solid #e0e0e0;
  border-top: 2px solid #075E54;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const RetryButton = styled.button`
  margin-top: 8px;
  padding: 4px 12px;
  background-color: #075E54;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 11px;
  cursor: pointer;
  
  &:hover {
    background-color: #128C7E;
  }
`;

const RetryLink = styled.a`
  color: #075E54;
  font-size: 12px;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

export default MessageContent;