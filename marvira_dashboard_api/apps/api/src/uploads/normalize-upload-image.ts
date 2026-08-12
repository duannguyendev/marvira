import sharp from 'sharp';

/**
 * Longest edge for event covers / question images.
 * ~2048px keeps full-width cards sharp on retina tablets (≈1024pt @2x)
 * without storing multi‑MB camera originals.
 */
export const UPLOAD_IMAGE_MAX_EDGE = 2048;

/** JPEG quality — visually close to original for photos, much smaller files. */
export const UPLOAD_IMAGE_JPEG_QUALITY = 82;

export interface NormalizedUploadImage {
  buffer: Buffer;
  contentType: 'image/jpeg';
  extension: 'jpg';
  width: number;
  height: number;
}

/**
 * Orient, resize (no upscale), and re-encode uploads as JPEG for consistent CDN size.
 */
export async function normalizeUploadImage(
  input: Buffer,
): Promise<NormalizedUploadImage> {
  const image = sharp(input, { failOn: 'none' }).rotate();

  const resized = image.resize({
    width: UPLOAD_IMAGE_MAX_EDGE,
    height: UPLOAD_IMAGE_MAX_EDGE,
    fit: 'inside',
    withoutEnlargement: true,
  });

  const { data, info } = await resized
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({
      quality: UPLOAD_IMAGE_JPEG_QUALITY,
      mozjpeg: true,
    })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    contentType: 'image/jpeg',
    extension: 'jpg',
    width: info.width,
    height: info.height,
  };
}
