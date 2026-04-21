import React, { useState } from 'react';
import styled from 'styled-components';
import type { ChatMessage, InteractiveButton } from '../api/types/whatsapp';

interface MessageContentProps {
  message: ChatMessage;
}

const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
  const [imageError, setImageError] = useState(false);

  // Текстовое сообщение
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

  // ИСПРАВЛЕНО: Изображение - прямой доступ к полям, без .media
  if (message.image) {
    const image = message.image;
    return (
      <MediaContainer>
        {image.caption && <Caption>{image.caption}</Caption>}
        {!imageError && image.link ? (
          <Image 
            src={image.link} 
            alt={image.caption || 'Image'}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <MediaPlaceholder>
            <span>🖼️</span>
            <span>Не удалось загрузить изображение</span>
            {image.fileName && <small>{image.fileName}</small>}
          </MediaPlaceholder>
        )}
        {image.fileSize > 0 && (
          <FileInfo>{formatFileSize(image.fileSize)}</FileInfo>
        )}
      </MediaContainer>
    );
  }

  // ИСПРАВЛЕНО: Видео - прямой доступ к полям, без .media
  if (message.video) {
    const video = message.video;
    return (
      <MediaContainer>
        {video.caption && <Caption>{video.caption}</Caption>}
        {video.link ? (
          <Video controls>
            <source src={video.link} type={video.mimeType} />
            Ваш браузер не поддерживает видео
          </Video>
        ) : (
          <MediaPlaceholder>
            <span>🎥</span>
            <span>Видео недоступно</span>
          </MediaPlaceholder>
        )}
        {video.seconds > 0 && <VideoDuration>{formatDuration(video.seconds)}</VideoDuration>}
        {video.fileSize > 0 && (
          <FileInfo>{formatFileSize(video.fileSize)}</FileInfo>
        )}
      </MediaContainer>
    );
  }

  // Аудио
  if (message.audio) {
    return (
      <MediaContainer>
        <Audio controls>
          <source src={message.audio.link} type={message.audio.mimeType} />
          Ваш браузер не поддерживает аудио
        </Audio>
        <AudioInfo>
          {message.audio.seconds > 0 && (
            <span>⏱️ {formatDuration(message.audio.seconds)}</span>
          )}
          {message.audio.fileName && (
            <span>📄 {message.audio.fileName}</span>
          )}
        </AudioInfo>
      </MediaContainer>
    );
  }

  // Голосовое сообщение
  if (message.voice) {
    return (
      <MediaContainer>
        <Audio controls>
          <source src={message.voice.link} type={message.voice.mimeType} />
          Ваш браузер не поддерживает аудио
        </Audio>
        <VoiceInfo>
          <span>🎙️ Голосовое сообщение</span>
          {message.voice.seconds > 0 && (
            <span>{formatDuration(message.voice.seconds)}</span>
          )}
        </VoiceInfo>
      </MediaContainer>
    );
  }

  // ИСПРАВЛЕНО: Документ - прямой доступ к полям, без .media
  if (message.document) {
    const doc = message.document;
    const fileIcon = getFileIcon(doc.mimeType);
    const displayName = doc.fileName || 'Документ';
    return (
      <DocumentContainer 
        onClick={() => doc.link && window.open(doc.link, '_blank')}
      >
        <DocumentIcon>{fileIcon}</DocumentIcon>
        <DocumentInfo>
          <DocumentName>{displayName}</DocumentName>
          <DocumentMeta>
            {doc.fileSize > 0 && formatFileSize(doc.fileSize)}
            {doc.pageCount > 0 && ` • ${doc.pageCount} стр.`}
          </DocumentMeta>
        </DocumentInfo>
        <DownloadIcon>📥</DownloadIcon>
      </DocumentContainer>
    );
  }

  // Стикер
  if (message.sticker) {
    return (
      <StickerContainer>
        <StickerImage 
          src={message.sticker.link} 
          alt="Sticker"
          loading="lazy"
        />
        {message.sticker.animated && <AnimatedBadge>GIF</AnimatedBadge>}
      </StickerContainer>
    );
  }

  // Локация
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

  // Контакт
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

  // Опрос
  if (message.poll) {
    const totalVotes = message.poll.results.reduce((sum, r) => sum + r.count, 0);
    return (
      <PollContainer>
        <PollTitle>{message.poll.title}</PollTitle>
        {message.poll.results.map((result) => (
          <PollOption key={result.id}>
            <PollOptionText>{result.name}</PollOptionText>
            <PollBar width={totalVotes > 0 ? (result.count / totalVotes) * 100 : 0}>
              <PollCount>{result.count}</PollCount>
            </PollBar>
          </PollOption>
        ))}
        <PollTotal>Всего голосов: {totalVotes}</PollTotal>
      </PollContainer>
    );
  }

  // Реакции
  if (message.reactions.length > 0) {
    return (
      <ReactionsContainer>
        {message.reactions.map((reaction) => (
          <Reaction key={reaction.id}>
            {reaction.emoji} {reaction.count}
          </Reaction>
        ))}
      </ReactionsContainer>
    );
  }

  // Fallback
  return (
    <MessageText>
      {message.displayText || '[Неизвестный тип сообщения]'}
    </MessageText>
  );

  // Вспомогательные функции
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

  function getFileIcon(mimeType: string): string {
    if (!mimeType) return '📄';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('word')) return '📘';
    if (mimeType.includes('excel')) return '📗';
    if (mimeType.includes('zip')) return '📦';
    return '📄';
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

// Стили (остаются без изменений)
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
`;

const DocumentMeta = styled.div`
  font-size: 10px;
  color: #666;
`;

const DownloadIcon = styled.div`
  font-size: 20px;
`;

const StickerContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const StickerImage = styled.img`
  max-width: 128px;
  max-height: 128px;
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

export default MessageContent;