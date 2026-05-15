import { useState, useEffect } from 'react';
import apiClient from '../client';

interface MediaInput {
  id?: string;
  link?: string;
  data?: string;
  mimeType?: string;
}

export interface MediaState {
  src: string | null;
  isLoading: boolean;
  hasError: boolean;
}

interface MediaApiResponse {
  data: string;
  mimeType: string;
  fileSize: number;
}

const mediaCache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

const toDataUrl = (data: string, mimeType?: string): string => {
  if (data.startsWith('data:')) return data;
  return `data:${mimeType || 'application/octet-stream'};base64,${data}`;
};

const fetchMediaById = (id: string): Promise<string | null> => {
  const cached = mediaCache.get(id);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(id);
  if (pending) return pending;

  const promise = apiClient
    .get<MediaApiResponse>('/WhatsApp/media-by-id', { params: { mediaId: id } })
    .then(({ data }) => {
      if (!data?.data) return null;
      const src = toDataUrl(data.data, data.mimeType);
      mediaCache.set(id, src);
      return src;
    })
    .catch(err => {
      console.error('Failed to load media:', err);
      return null;
    })
    .finally(() => {
      inflight.delete(id);
    });

  inflight.set(id, promise);
  return promise;
};

export const useMediaSrc = (media: MediaInput | undefined | null): MediaState & { retry: () => void } => {
  const compute = (): MediaState => {
    if (!media) return { src: null, isLoading: false, hasError: false };
    if (media.link) return { src: media.link, isLoading: false, hasError: false };
    if (media.data) return { src: toDataUrl(media.data, media.mimeType), isLoading: false, hasError: false };
    if (media.id && mediaCache.has(media.id)) {
      return { src: mediaCache.get(media.id)!, isLoading: false, hasError: false };
    }
    if (media.id) return { src: null, isLoading: true, hasError: false };
    return { src: null, isLoading: false, hasError: false };
  };

  const [state, setState] = useState<MediaState>(compute);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!media) {
      setState({ src: null, isLoading: false, hasError: false });
      return;
    }

    if (media.link) {
      setState({ src: media.link, isLoading: false, hasError: false });
      return;
    }

    if (media.data) {
      setState({ src: toDataUrl(media.data, media.mimeType), isLoading: false, hasError: false });
      return;
    }

    if (!media.id) {
      setState({ src: null, isLoading: false, hasError: false });
      return;
    }

    const cached = mediaCache.get(media.id);
    if (cached) {
      setState({ src: cached, isLoading: false, hasError: false });
      return;
    }

    setState({ src: null, isLoading: true, hasError: false });

    fetchMediaById(media.id).then(src => {
      if (cancelled) return;
      setState(src
        ? { src, isLoading: false, hasError: false }
        : { src: null, isLoading: false, hasError: true });
    });

    return () => { cancelled = true; };
  }, [media?.id, media?.link, media?.data, media?.mimeType, reloadKey]);

  const retry = () => {
    if (media?.id) {
      mediaCache.delete(media.id);
      inflight.delete(media.id);
    }
    setReloadKey(k => k + 1);
  };

  return { ...state, retry };
};
