export const sanitizeBase64 = (raw: string): string => raw.replace(/\s+/g, '');

export const looksLikeBase64 = (s: string): boolean => /^[A-Za-z0-9+/=]+$/.test(s);

export const normalizeMimeType = (raw: string | undefined | null): string => {
  const m = (raw || '').trim().toLowerCase();
  if (!m) return 'application/octet-stream';
  if (m === 'image/jpg') return 'image/jpeg';
  return m;
};

export const toDataUrl = (rawData: string | undefined | null, mimeType?: string | null): string | null => {
  if (!rawData) return null;
  if (rawData.startsWith('data:')) return rawData;
  if (rawData.startsWith('http://') || rawData.startsWith('https://') || rawData.startsWith('blob:')) {
    return rawData;
  }
  const cleaned = sanitizeBase64(rawData);
  if (!cleaned || !looksLikeBase64(cleaned)) return null;
  return `data:${normalizeMimeType(mimeType)};base64,${cleaned}`;
};
