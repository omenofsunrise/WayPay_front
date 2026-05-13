import { useState, useCallback } from 'react';
import apiClient from '../client';

interface MediaData {
  data: string;
  mimeType: string;
  fileSize: number;
}

export const useMediaLoader = () => {
  const [loadingMedia, setLoadingMedia] = useState<Set<string>>(new Set());

  const loadMedia = useCallback(async (mediaId: string): Promise<MediaData | null> => {
    if (loadingMedia.has(mediaId)) {
      return null;
    }

    setLoadingMedia(prev => new Set(prev).add(mediaId));

    try {
      const response = await apiClient.get<MediaData>(`/WhatsApp/media-by-id`, {
        params: { mediaId }
      });
      
      const mediaData: MediaData = {
        data: response.data.data || '',
        mimeType: response.data.mimeType || 'application/octet-stream',
        fileSize: response.data.fileSize
      };
      
      return mediaData;
    } catch (error) {
      console.error('Failed to load media:', error);
      return null;
    } finally {
      setLoadingMedia(prev => {
        const newSet = new Set(prev);
        newSet.delete(mediaId);
        return newSet;
      });
    }
  }, [loadingMedia]);

  return { loadMedia, loadingMedia };
};