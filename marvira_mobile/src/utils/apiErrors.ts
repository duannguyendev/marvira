import { ApiError } from '../types';

export function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const apiError = error as ApiError;
  if (apiError.status === 404) {
    return true;
  }

  const message = (apiError.message ?? '').toLowerCase();
  return message.includes('not found');
}
