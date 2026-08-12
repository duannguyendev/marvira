import { normalizeUploadImage } from './normalize-upload-image';
import sharp from 'sharp';

describe('normalizeUploadImage', () => {
  it('downscales large images to max edge 2048 and outputs jpeg', async () => {
    const input = await sharp({
      create: {
        width: 4000,
        height: 3000,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .png()
      .toBuffer();

    const result = await normalizeUploadImage(input);

    expect(result.contentType).toBe('image/jpeg');
    expect(result.extension).toBe('jpg');
    expect(Math.max(result.width, result.height)).toBe(2048);
    expect(result.buffer.length).toBeLessThan(input.length);
  });

  it('does not upscale small images', async () => {
    const input = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await normalizeUploadImage(input);

    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });
});
