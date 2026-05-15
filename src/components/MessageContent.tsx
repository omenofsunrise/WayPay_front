import React from 'react';
import styled, { keyframes } from 'styled-components';
import type {
  ChatMessage,
  InteractiveButton,
  ImageContent,
  VideoContent,
  AudioContent,
  VoiceContent,
  DocumentContent,
  StickerContent,
  LocationContent,
  ContactContent,
  PollContent,
  Reaction,
} from '../api/types/whatsapp';
import { useMediaSrc } from '../api/hooks/useMediaLoader';
import { toDataUrl } from '../api/utils/mediaUrl';

interface MessageContentProps {
  message: ChatMessage;
}

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getFileIcon = (mimeType?: string, fileName?: string): string => {
  const m = (mimeType || '').toLowerCase();
  const n = (fileName || '').toLowerCase();
  if (m.includes('pdf') || n.endsWith('.pdf')) return '📕';
  if (m.includes('word') || n.endsWith('.doc') || n.endsWith('.docx')) return '📘';
  if (m.includes('excel') || m.includes('sheet') || n.endsWith('.xls') || n.endsWith('.xlsx')) return '📗';
  if (m.includes('presentation') || n.endsWith('.ppt') || n.endsWith('.pptx')) return '📙';
  if (m.includes('zip') || m.includes('rar') || m.includes('7z')) return '📦';
  if (m.startsWith('image/')) return '🖼️';
  if (m.startsWith('video/')) return '🎬';
  if (m.startsWith('audio/')) return '🎵';
  if (m.includes('text') || n.endsWith('.txt')) return '📝';
  return '📄';
};

const handleButtonClick = (button: InteractiveButton) => {
  if (button.url) {
    window.open(button.url, '_blank');
  } else if (button.phoneNumber) {
    window.location.href = `tel:${button.phoneNumber}`;
  } else if (button.copyCode) {
    navigator.clipboard.writeText(button.copyCode);
  }
};

const downloadVCard = (vcard: string, name: string) => {
  const blob = new Blob([vcard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
};

const triggerDownload = (src: string, fileName: string) => {
  const a = document.createElement('a');
  a.href = src;
  a.download = fileName;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
  if (message.text) {
    return (
      <MessageText>
        <TextBody>{message.text.body}</TextBody>
        {message.text.buttons.length > 0 && (
          <ButtonsContainer>
            {message.text.buttons.map((button, idx) => (
              <ActionButton key={idx} onClick={() => handleButtonClick(button)}>
                {button.title}
              </ActionButton>
            ))}
          </ButtonsContainer>
        )}
      </MessageText>
    );
  }

  if (message.image) return <ImageMessage image={message.image} />;
  if (message.video) return <VideoMessage video={message.video} />;
  if (message.audio) return <AudioMessage audio={message.audio} />;
  if (message.voice) return <VoiceMessage voice={message.voice} />;
  if (message.document) return <DocumentMessage document={message.document} />;
  if (message.sticker) return <StickerMessage sticker={message.sticker} />;
  if (message.location) return <LocationMessage location={message.location} />;
  if (message.contact) return <ContactMessage contact={message.contact} />;
  if (message.poll) return <PollMessage poll={message.poll} />;

  if (message.reactions.length > 0) {
    return <ReactionsRow reactions={message.reactions} />;
  }

  return <MessageText>{message.displayText || '[Неизвестный тип сообщения]'}</MessageText>;
};

const ImageMessage: React.FC<{ image: ImageContent }> = ({ image }) => {
  const { src, isLoading, hasError, retry } = useMediaSrc(image);
  const [renderError, setRenderError] = React.useState(false);
  const fallback = toDataUrl(image.preview, image.mimeType || 'image/jpeg');
  const displaySrc = src || fallback;
  const showError = (hasError && !displaySrc) || renderError;

  React.useEffect(() => { setRenderError(false); }, [src]);

  return (
    <MediaContainer>
      {displaySrc && !showError && (
        <ImageWrap onClick={() => src && window.open(src, '_blank')}>
          <ImageEl
            src={displaySrc}
            alt={image.caption || 'image'}
            loading="lazy"
            onError={() => {
              console.warn('[ImageMessage] img failed to render', JSON.stringify({
                id: image.id,
                mimeType: image.mimeType,
                srcHead: displaySrc.slice(0, 80),
                srcLength: displaySrc.length,
              }));
              setRenderError(true);
            }}
          />
          {isLoading && <ImageOverlay><Spinner /></ImageOverlay>}
        </ImageWrap>
      )}

      {!displaySrc && isLoading && (
        <MediaSkeleton>
          <Spinner />
        </MediaSkeleton>
      )}

      {showError && (
        <ErrorBox>
          <ErrorIcon>🖼️</ErrorIcon>
          <ErrorText>Не удалось загрузить изображение</ErrorText>
          <RetryButton onClick={() => { setRenderError(false); retry(); }}>Повторить</RetryButton>
        </ErrorBox>
      )}

      {image.caption && <Caption>{image.caption}</Caption>}
      {image.fileSize > 0 && <MetaLine>{formatFileSize(image.fileSize)}</MetaLine>}
    </MediaContainer>
  );
};

const VideoMessage: React.FC<{ video: VideoContent }> = ({ video }) => {
  const { src, isLoading, hasError, retry } = useMediaSrc(video);
  const [renderError, setRenderError] = React.useState(false);
  const showError = (hasError && !src) || renderError;

  React.useEffect(() => { setRenderError(false); }, [src]);

  return (
    <MediaContainer>
      {src && !showError && (
        <VideoEl
          controls
          preload="metadata"
          onError={() => {
            console.warn('[VideoMessage] video failed to render', {
              id: video.id,
              mimeType: video.mimeType,
            });
            setRenderError(true);
          }}
        >
          <source src={src} type={video.mimeType} />
          Ваш браузер не поддерживает видео
        </VideoEl>
      )}

      {!src && isLoading && (
        <MediaSkeleton>
          <Spinner />
          <SkeletonLabel>Загрузка видео…</SkeletonLabel>
        </MediaSkeleton>
      )}

      {showError && (
        <ErrorBox>
          <ErrorIcon>🎬</ErrorIcon>
          <ErrorText>Видео недоступно</ErrorText>
          <RetryButton onClick={() => { setRenderError(false); retry(); }}>Повторить</RetryButton>
        </ErrorBox>
      )}

      {video.caption && <Caption>{video.caption}</Caption>}
      <MetaRow>
        {video.seconds > 0 && <MetaLine>{formatDuration(video.seconds)}</MetaLine>}
        {video.fileSize > 0 && <MetaLine>{formatFileSize(video.fileSize)}</MetaLine>}
      </MetaRow>
    </MediaContainer>
  );
};

const AudioMessage: React.FC<{ audio: AudioContent }> = ({ audio }) => {
  const { src, isLoading, hasError, retry } = useMediaSrc(audio);

  return (
    <AudioContainer>
      <AudioIcon>🎵</AudioIcon>
      <AudioBody>
        {src && !hasError ? (
          <AudioEl controls preload="metadata">
            <source src={src} type={audio.mimeType} />
          </AudioEl>
        ) : isLoading ? (
          <AudioLoading>
            <Spinner size="small" />
            <SkeletonLabel>Загрузка аудио…</SkeletonLabel>
          </AudioLoading>
        ) : (
          <AudioError onClick={retry}>
            <ErrorText>Аудио недоступно</ErrorText>
            <RetryButton onClick={retry}>Повторить</RetryButton>
          </AudioError>
        )}
        <AudioMeta>
          {audio.fileName && <span>{audio.fileName}</span>}
          {audio.seconds > 0 && <span>· {formatDuration(audio.seconds)}</span>}
          {audio.fileSize > 0 && <span>· {formatFileSize(audio.fileSize)}</span>}
        </AudioMeta>
      </AudioBody>
    </AudioContainer>
  );
};

const VoiceMessage: React.FC<{ voice: VoiceContent }> = ({ voice }) => {
  const { src, isLoading, hasError, retry } = useMediaSrc(voice);

  return (
    <VoiceContainer>
      <VoiceIcon>🎙️</VoiceIcon>
      <VoiceBody>
        {src && !hasError ? (
          <AudioEl controls preload="metadata">
            <source src={src} type={voice.mimeType} />
          </AudioEl>
        ) : isLoading ? (
          <AudioLoading>
            <Spinner size="small" />
            <SkeletonLabel>Загрузка…</SkeletonLabel>
          </AudioLoading>
        ) : (
          <AudioError>
            <ErrorText>Голосовое недоступно</ErrorText>
            <RetryButton onClick={retry}>Повторить</RetryButton>
          </AudioError>
        )}
        <AudioMeta>
          <span>Голосовое сообщение</span>
          {voice.seconds > 0 && <span>· {formatDuration(voice.seconds)}</span>}
        </AudioMeta>
      </VoiceBody>
    </VoiceContainer>
  );
};

const DocumentMessage: React.FC<{ document: DocumentContent }> = ({ document: doc }) => {
  const { src, isLoading, hasError, retry } = useMediaSrc(doc);
  const fileName = doc.fileName || 'Документ';
  const icon = getFileIcon(doc.mimeType, doc.fileName);

  const handleClick = () => {
    if (src) {
      if (doc.link && !doc.id) {
        window.open(src, '_blank');
      } else {
        triggerDownload(src, fileName);
      }
    } else if (hasError) {
      retry();
    }
  };

  return (
    <DocumentCard onClick={handleClick} role="button">
      <DocumentIconBox>{icon}</DocumentIconBox>
      <DocumentBody>
        <DocumentName>{fileName}</DocumentName>
        <DocumentMeta>
          {doc.fileSize > 0 && <span>{formatFileSize(doc.fileSize)}</span>}
          {doc.pageCount > 0 && <span>· {doc.pageCount} стр.</span>}
          {doc.mimeType && <span>· {doc.mimeType.split('/').pop()?.toUpperCase()}</span>}
        </DocumentMeta>
        {doc.caption && <DocumentCaption>{doc.caption}</DocumentCaption>}
        {isLoading && <DocumentStatus>Загрузка…</DocumentStatus>}
        {hasError && <DocumentStatusError>Ошибка — нажмите, чтобы повторить</DocumentStatusError>}
      </DocumentBody>
      <DocumentAction>
        {isLoading ? <Spinner size="small" /> : <ActionIcon>{src ? '⬇' : '↻'}</ActionIcon>}
      </DocumentAction>
    </DocumentCard>
  );
};

const StickerMessage: React.FC<{ sticker: StickerContent }> = ({ sticker }) => {
  const { src, isLoading, hasError, retry } = useMediaSrc(sticker);
  const fallback = toDataUrl(sticker.preview, sticker.mimeType || 'image/png');
  const displaySrc = src || fallback;

  return (
    <StickerContainer>
      {displaySrc && !hasError && <StickerImage src={displaySrc} alt="Sticker" loading="lazy" />}
      {!displaySrc && isLoading && (
        <StickerPlaceholder>
          <Spinner size="small" />
        </StickerPlaceholder>
      )}
      {hasError && !displaySrc && (
        <StickerPlaceholder onClick={retry}>
          <span style={{ fontSize: '24px' }}>😊</span>
          <RetryLabel>Повторить</RetryLabel>
        </StickerPlaceholder>
      )}
      {sticker.animated && <AnimatedBadge>GIF</AnimatedBadge>}
    </StickerContainer>
  );
};

const LocationMessage: React.FC<{ location: LocationContent }> = ({ location }) => {
  const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  return (
    <LocationCard onClick={() => window.open(url, '_blank')}>
      <LocationIconBox>📍</LocationIconBox>
      <LocationBody>
        {location.name && <LocationName>{location.name}</LocationName>}
        {location.address && <LocationAddress>{location.address}</LocationAddress>}
        {!location.name && !location.address && (
          <LocationCoords>
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </LocationCoords>
        )}
        <LocationOpen>Открыть на карте →</LocationOpen>
      </LocationBody>
    </LocationCard>
  );
};

const ContactMessage: React.FC<{ contact: ContactContent }> = ({ contact }) => {
  return (
    <ContactCard>
      <ContactAvatar>👤</ContactAvatar>
      <ContactBody>
        <ContactName>{contact.name}</ContactName>
        {contact.vcard && (
          <ContactSave onClick={(e) => { e.stopPropagation(); downloadVCard(contact.vcard, contact.name); }}>
            📇 Сохранить контакт
          </ContactSave>
        )}
      </ContactBody>
    </ContactCard>
  );
};

const PollMessage: React.FC<{ poll: PollContent }> = ({ poll }) => {
  const total = poll.results?.reduce((sum, r) => sum + r.count, 0) || 0;
  return (
    <PollCard>
      <PollTitle>{poll.title}</PollTitle>
      {poll.results?.map((r) => {
        const pct = total > 0 ? (r.count / total) * 100 : 0;
        return (
          <PollOption key={r.id}>
            <PollOptionHeader>
              <PollOptionText>{r.name}</PollOptionText>
              <PollOptionCount>{r.count}</PollOptionCount>
            </PollOptionHeader>
            <PollBarTrack>
              <PollBarFill width={pct} />
            </PollBarTrack>
          </PollOption>
        );
      })}
      <PollTotal>Всего голосов: {total}</PollTotal>
    </PollCard>
  );
};

const ReactionsRow: React.FC<{ reactions: Reaction[] }> = ({ reactions }) => (
  <ReactionsContainer>
    {reactions.map((r) => (
      <ReactionPill key={r.id}>
        {r.emoji} {r.count > 1 && <ReactionCount>{r.count}</ReactionCount>}
      </ReactionPill>
    ))}
  </ReactionsContainer>
);

export default MessageContent;

const WA_GREEN = '#075E54';
const WA_GREEN_LIGHT = '#128C7E';
const META_GREY = '#8696A0';
const BG_LIGHT = '#F5F6F8';
const BG_HOVER = '#ECEEF1';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div<{ size?: 'small' | 'normal' }>`
  width: ${p => p.size === 'small' ? '18px' : '32px'};
  height: ${p => p.size === 'small' ? '18px' : '32px'};
  border: 2px solid rgba(7, 94, 84, 0.15);
  border-top-color: ${WA_GREEN};
  border-radius: 50%;
  animation: ${spin} 0.9s linear infinite;
`;

const MessageText = styled.div`
  font-size: 14px;
  line-height: 1.45;
  word-wrap: break-word;
  white-space: pre-wrap;
`;

const TextBody = styled.span`
  color: #111B21;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const ActionButton = styled.button`
  background-color: ${WA_GREEN};
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 18px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover { background-color: ${WA_GREEN_LIGHT}; }
`;

const MediaContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 320px;
`;

const ImageWrap = styled.div`
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  cursor: zoom-in;
  background: ${BG_LIGHT};
  line-height: 0;
`;

const ImageEl = styled.img`
  display: block;
  max-width: 100%;
  max-height: 320px;
  width: auto;
  height: auto;
  border-radius: 10px;
  transition: transform 0.2s ease;

  ${ImageWrap}:hover & { transform: scale(1.01); }
`;

const ImageOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.4);
`;

const VideoEl = styled.video`
  width: 100%;
  max-height: 320px;
  border-radius: 10px;
  background: #000;
`;

const MediaSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 200px;
  min-height: 140px;
  background: ${BG_LIGHT};
  border-radius: 10px;
  color: ${META_GREY};
`;

const SkeletonLabel = styled.span`
  font-size: 12px;
  color: ${META_GREY};
`;

const ErrorBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 20px;
  background: ${BG_LIGHT};
  border-radius: 10px;
  color: ${META_GREY};
`;

const ErrorIcon = styled.span`
  font-size: 28px;
`;

const ErrorText = styled.span`
  font-size: 13px;
  color: ${META_GREY};
`;

const RetryButton = styled.button`
  padding: 6px 14px;
  background: ${WA_GREEN};
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover { background: ${WA_GREEN_LIGHT}; }
`;

const Caption = styled.div`
  font-size: 13px;
  color: #111B21;
  line-height: 1.4;
  margin-top: 2px;
  word-wrap: break-word;
`;

const MetaRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const MetaLine = styled.div`
  font-size: 11px;
  color: ${META_GREY};
`;

const AudioContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: ${BG_LIGHT};
  border-radius: 12px;
  min-width: 240px;
  max-width: 320px;
`;

const AudioIcon = styled.div`
  font-size: 24px;
  flex-shrink: 0;
`;

const AudioBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

const AudioEl = styled.audio`
  width: 100%;
  height: 36px;
`;

const AudioLoading = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
`;

const AudioError = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
`;

const AudioMeta = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  font-size: 11px;
  color: ${META_GREY};
  overflow: hidden;
  text-overflow: ellipsis;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const VoiceContainer = styled(AudioContainer)`
  background: rgba(7, 94, 84, 0.06);
`;

const VoiceIcon = styled(AudioIcon)`
  color: ${WA_GREEN};
`;

const VoiceBody = styled(AudioBody)``;

const DocumentCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: ${BG_LIGHT};
  border-radius: 10px;
  cursor: pointer;
  min-width: 240px;
  max-width: 320px;
  transition: background-color 0.15s;

  &:hover { background: ${BG_HOVER}; }
`;

const DocumentIconBox = styled.div`
  font-size: 28px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  flex-shrink: 0;
`;

const DocumentBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const DocumentName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #111B21;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DocumentMeta = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  font-size: 11px;
  color: ${META_GREY};

  span { white-space: nowrap; }
`;

const DocumentCaption = styled.div`
  font-size: 12px;
  color: #54656F;
  margin-top: 4px;
`;

const DocumentStatus = styled.div`
  font-size: 11px;
  color: ${META_GREY};
  margin-top: 2px;
`;

const DocumentStatusError = styled(DocumentStatus)`
  color: #D33;
`;

const DocumentAction = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: white;
  color: ${WA_GREEN};
  flex-shrink: 0;

  ${DocumentCard}:hover & { background: ${WA_GREEN}; color: white; }
`;

const ActionIcon = styled.span`
  font-size: 14px;
  font-weight: 600;
`;

const StickerContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const StickerImage = styled.img`
  max-width: 140px;
  max-height: 140px;
  display: block;
`;

const StickerPlaceholder = styled.div`
  width: 110px;
  height: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: ${BG_LIGHT};
  border-radius: 12px;
  cursor: pointer;

  &:hover { background: ${BG_HOVER}; }
`;

const RetryLabel = styled.span`
  font-size: 11px;
  color: ${META_GREY};
`;

const AnimatedBadge = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.65);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
`;

const LocationCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: ${BG_LIGHT};
  border-radius: 10px;
  cursor: pointer;
  min-width: 220px;
  max-width: 320px;
  transition: background-color 0.15s;

  &:hover { background: ${BG_HOVER}; }
`;

const LocationIconBox = styled.div`
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  flex-shrink: 0;
`;

const LocationBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const LocationName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #111B21;
`;

const LocationAddress = styled.div`
  font-size: 12px;
  color: #54656F;
`;

const LocationCoords = styled.div`
  font-size: 12px;
  font-family: monospace;
  color: #54656F;
`;

const LocationOpen = styled.div`
  font-size: 11px;
  color: ${WA_GREEN};
  margin-top: 2px;
  font-weight: 500;
`;

const ContactCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: ${BG_LIGHT};
  border-radius: 10px;
  min-width: 220px;
  max-width: 320px;
`;

const ContactAvatar = styled.div`
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  flex-shrink: 0;
`;

const ContactBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const ContactName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #111B21;
`;

const ContactSave = styled.button`
  background: none;
  border: none;
  color: ${WA_GREEN};
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  text-align: left;
  font-weight: 500;

  &:hover { text-decoration: underline; }
`;

const PollCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: ${BG_LIGHT};
  border-radius: 10px;
  min-width: 240px;
  max-width: 320px;
`;

const PollTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #111B21;
  margin-bottom: 4px;
`;

const PollOption = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PollOptionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

const PollOptionText = styled.span`
  font-size: 12px;
  color: #111B21;
`;

const PollOptionCount = styled.span`
  font-size: 11px;
  color: ${META_GREY};
  font-weight: 500;
`;

const PollBarTrack = styled.div`
  height: 6px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 3px;
  overflow: hidden;
`;

const PollBarFill = styled.div<{ width: number }>`
  width: ${p => Math.min(p.width, 100)}%;
  height: 100%;
  background: ${WA_GREEN};
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const PollTotal = styled.div`
  font-size: 11px;
  color: ${META_GREY};
  margin-top: 4px;
  text-align: right;
`;

const ReactionsContainer = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const ReactionPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
`;

const ReactionCount = styled.span`
  font-size: 10px;
  color: ${META_GREY};
`;
