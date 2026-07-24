import { apiClient } from './client';
import { API_BASE_URL } from '../utils/constants';

export interface UploadResult {
  url: string;
  filename: string;
}

function isLocalImageUri(uri: string): boolean {
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('/')
  );
}

/** True when the value still needs multipart upload before save. */
export function needsImageUpload(imageUrl?: string | null): boolean {
  if (!imageUrl) {
    return false;
  }
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return false;
  }
  if (imageUrl.startsWith('/uploads/')) {
    return false;
  }
  return isLocalImageUri(imageUrl);
}

export function resolveUploadUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export const uploadsApi = {
  uploadImage: async (
    localUri: string,
    options?: { fileName?: string; mimeType?: string },
  ): Promise<UploadResult> => {
    const name = options?.fileName ?? `photo-${Date.now()}.jpg`;
    const type = options?.mimeType ?? 'image/jpeg';

    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name,
      type,
    } as unknown as Blob);

    const response = await apiClient.post<{
      success: boolean;
      data: UploadResult;
    }>('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });

    return response.data.data;
  },

  /**
   * If imageUrl is a local picker URI, upload it and return the server url.
   * Otherwise return imageUrl unchanged.
   */
  ensureRemoteImageUrl: async (
    imageUrl?: string | null,
  ): Promise<string | undefined> => {
    if (!imageUrl) {
      return undefined;
    }
    if (!needsImageUpload(imageUrl)) {
      return imageUrl;
    }
    const uploaded = await uploadsApi.uploadImage(imageUrl);
    return uploaded.url;
  },
};
