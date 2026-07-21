import { resolve } from 'path';

/** Persistent uploads folder: `apps/api/uploads` (sibling of `dist/`, never inside it). */
export const UPLOADS_DIR = resolve(__dirname, '..', '..', 'uploads');
