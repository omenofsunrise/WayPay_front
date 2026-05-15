import { describe, it, expect } from 'vitest';
import {
  sanitizeBase64,
  looksLikeBase64,
  normalizeMimeType,
  toDataUrl,
} from './mediaUrl';

describe('sanitizeBase64', () => {
  it('strips whitespace and newlines that some serializers add every 76 chars', () => {
    const messy = 'iVBORw0KGgo\nAAAANS\r\nUhEUg AAAAQ';
    expect(sanitizeBase64(messy)).toBe('iVBORw0KGgoAAAANSUhEUgAAAAQ');
  });

  it('returns the same string when already clean', () => {
    expect(sanitizeBase64('iVBORw0KGgo=')).toBe('iVBORw0KGgo=');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeBase64('')).toBe('');
  });
});

describe('looksLikeBase64', () => {
  it('accepts a typical base64 payload', () => {
    expect(looksLikeBase64('iVBORw0KGgoAAAANSUhEUgAAAAEA==')).toBe(true);
  });

  it('rejects plain garbage', () => {
    expect(looksLikeBase64('hello world!')).toBe(false);
  });

  it('rejects a string containing data: prefix', () => {
    expect(looksLikeBase64('data:image/png;base64,iVBOR')).toBe(false);
  });
});

describe('normalizeMimeType', () => {
  it('defaults to application/octet-stream when empty', () => {
    expect(normalizeMimeType('')).toBe('application/octet-stream');
    expect(normalizeMimeType(undefined)).toBe('application/octet-stream');
    expect(normalizeMimeType(null)).toBe('application/octet-stream');
    expect(normalizeMimeType('   ')).toBe('application/octet-stream');
  });

  it('rewrites image/jpg to image/jpeg (browsers do not recognise jpg)', () => {
    expect(normalizeMimeType('image/jpg')).toBe('image/jpeg');
    expect(normalizeMimeType('IMAGE/JPG')).toBe('image/jpeg');
  });

  it('passes through valid mime types in lowercase', () => {
    expect(normalizeMimeType('image/png')).toBe('image/png');
    expect(normalizeMimeType('Application/PDF')).toBe('application/pdf');
  });
});

describe('toDataUrl', () => {
  it('returns null for empty/nullish input', () => {
    expect(toDataUrl(undefined)).toBeNull();
    expect(toDataUrl(null)).toBeNull();
    expect(toDataUrl('')).toBeNull();
  });

  it('passes through existing data: URLs unchanged', () => {
    const existing = 'data:image/png;base64,iVBOR';
    expect(toDataUrl(existing)).toBe(existing);
  });

  it('passes through http(s) and blob URLs unchanged', () => {
    expect(toDataUrl('https://example.com/x.jpg')).toBe('https://example.com/x.jpg');
    expect(toDataUrl('http://example.com/x.jpg')).toBe('http://example.com/x.jpg');
    expect(toDataUrl('blob:https://app/abc')).toBe('blob:https://app/abc');
  });

  it('builds a data URL from clean base64 and mimeType', () => {
    expect(toDataUrl('iVBORw0KGgo=', 'image/png'))
      .toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('sanitises whitespace before assembling the data URL', () => {
    expect(toDataUrl('iVBORw0\nKGgo=', 'image/png'))
      .toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('defaults mimeType to application/octet-stream', () => {
    expect(toDataUrl('iVBOR', undefined)).toBe('data:application/octet-stream;base64,iVBOR');
  });

  it('rewrites image/jpg to image/jpeg', () => {
    expect(toDataUrl('aaaa', 'image/jpg')).toBe('data:image/jpeg;base64,aaaa');
  });

  it('returns null when base64 contains invalid characters (likely not base64 at all)', () => {
    expect(toDataUrl('hello world!', 'image/png')).toBeNull();
  });
});
