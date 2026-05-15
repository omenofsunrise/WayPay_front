import { useState, useEffect } from 'react';
import apiClient from '../client';
import { toDataUrl } from '../utils/mediaUrl';

// NOTE: link-priority temporarily disabled — backend doesn't reliably send `link`
// yet and we need to verify the base64/id pipeline first.
// Re-enable by setting USE_LINK_PRIORITY = true once backend stabilises.
const USE_LINK_PRIORITY = false;

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

const fetchMediaById = (id: string): Promise<string | null> => {
  const cached = mediaCache.get(id);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(id);
  if (pending) return pending;

  const promise = apiClient
    .get<MediaApiResponse>('/WhatsApp/media-by-id', { params: { mediaId: id } })
    .then((response) => {
      const body = response.data;
      const info = {
        id,
        keys: body && typeof body === 'object' ? Object.keys(body) : typeof body,
        mimeType: body?.mimeType,
        dataType: typeof body?.data,
        dataLength: typeof body?.data === 'string' ? body.data.length : undefined,
        dataHead: typeof body?.data === 'string' ? body.data.slice(0, 60) : body?.data,
        fileSize: body?.fileSize,
      };
      // stringified so Chrome doesn't collapse to "Object"
      console.log('[useMediaLoader] media-by-id response', JSON.stringify(info));

      if (!body?.data) return null;
      const src = toDataUrl(body.data, body.mimeType);
      console.log('[useMediaLoader] built src for', id, JSON.stringify({
        ok: !!src,
        srcHead: src?.slice(0, 80),
      }));
      if (!src) return null;
      mediaCache.set(id, src);
      return src;
    })
    .catch((err) => {
      console.error('[useMediaLoader] failed to load media', id, err);
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
    if (USE_LINK_PRIORITY && media.link) {
      return { src: media.link, isLoading: false, hasError: false };
    }
    if (media.data) {
      const src = toDataUrl(media.data, media.mimeType);
      return src
        ? { src, isLoading: false, hasError: false }
        : { src: null, isLoading: false, hasError: true };
    }
    if (media.id && mediaCache.has(media.id)) {
      return { src: mediaCache.get(media.id)!, isLoading: false, hasError: false };
    }
    if (media.id) return { src: null, isLoading: true, hasError: false };
    if (!USE_LINK_PRIORITY && media.link) {
      return { src: media.link, isLoading: false, hasError: false };
    }
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

    if (USE_LINK_PRIORITY && media.link) {
      setState({ src: media.link, isLoading: false, hasError: false });
      return;
    }

    if (media.data) {
      const src = toDataUrl(media.data, media.mimeType);
      setState(src
        ? { src, isLoading: false, hasError: false }
        : { src: null, isLoading: false, hasError: true });
      return;
    }

    if (!media.id) {
      if (media.link) {
        setState({ src: media.link, isLoading: false, hasError: false });
      } else {
        setState({ src: null, isLoading: false, hasError: false });
      }
      return;
    }

    const cached = mediaCache.get(media.id);
    if (cached) {
      setState({ src: cached, isLoading: false, hasError: false });
      return;
    }

    setState({ src: null, isLoading: true, hasError: false });

    fetchMediaById(media.id).then((src) => {
      if (cancelled) return;
      if (src) {
        setState({ src, isLoading: false, hasError: false });
      } else if (!USE_LINK_PRIORITY && media.link) {
        setState({ src: media.link, isLoading: false, hasError: false });
      } else {
        setState({ src: null, isLoading: false, hasError: true });
      }
    });

    return () => { cancelled = true; };
  }, [media?.id, media?.link, media?.data, media?.mimeType, reloadKey]);

  const retry = () => {
    if (media?.id) {
      mediaCache.delete(media.id);
      inflight.delete(media.id);
    }
    setReloadKey((k) => k + 1);
  };

  return { ...state, retry };
};
