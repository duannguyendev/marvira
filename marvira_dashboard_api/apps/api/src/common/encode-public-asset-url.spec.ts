import { encodePublicAssetUrl } from './encode-public-asset-url';

describe('encodePublicAssetUrl', () => {
  it('encodes commas and parentheses in https CDN paths', () => {
    const input =
      'https://cdn.marvira.com/uploads/uuid-Thap_Po_Sah_Inu_temple_Vietnam,_entrance_with_a_Cham_pilgrim_(25716485038).jpg';
    expect(encodePublicAssetUrl(input)).toBe(
      'https://cdn.marvira.com/uploads/uuid-Thap_Po_Sah_Inu_temple_Vietnam%2C_entrance_with_a_Cham_pilgrim_%2825716485038%29.jpg',
    );
  });

  it('is idempotent for already-encoded URLs', () => {
    const encoded =
      'https://cdn.marvira.com/uploads/uuid-Vietnam%2C_entrance_%28257%29.jpg';
    expect(encodePublicAssetUrl(encoded)).toBe(encoded);
  });

  it('encodes relative upload paths', () => {
    expect(encodePublicAssetUrl('/uploads/a,b(c).jpg')).toBe(
      '/uploads/a%2Cb%28c%29.jpg',
    );
  });

  it('passes through nullish values', () => {
    expect(encodePublicAssetUrl(null)).toBeNull();
    expect(encodePublicAssetUrl(undefined)).toBeUndefined();
    expect(encodePublicAssetUrl('')).toBe('');
  });
});
