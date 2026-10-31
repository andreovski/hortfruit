import { describe, expect, it } from 'vitest';

import { uploadthingKeyFromUrl } from './uploads';

describe('uploadthingKeyFromUrl', () => {
  it('lê a chave das URLs do UploadThing', () => {
    expect(uploadthingKeyFromUrl('https://abc123.ufs.sh/f/2e0fdb64_image.jpg')).toBe('2e0fdb64_image.jpg');
    expect(uploadthingKeyFromUrl('https://utfs.io/f/2e0fdb64_image.jpg')).toBe('2e0fdb64_image.jpg');
  });

  it('ignora ilustrações e outros endereços', () => {
    expect(uploadthingKeyFromUrl('/products/tomate.svg')).toBeNull();
    expect(uploadthingKeyFromUrl('https://example.com/f/abc')).toBeNull();
    expect(uploadthingKeyFromUrl('http://utfs.io/f/abc')).toBeNull();
    expect(uploadthingKeyFromUrl('https://evilufs.sh/f/abc')).toBeNull();
    expect(uploadthingKeyFromUrl('https://abc.ufs.sh/a/b')).toBeNull();
    expect(uploadthingKeyFromUrl(null)).toBeNull();
  });
});
