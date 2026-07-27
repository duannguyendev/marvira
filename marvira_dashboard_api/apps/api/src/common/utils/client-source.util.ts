/** Trusted dashboard/web client marker — never sent by mobile. */
export const MARVIRA_CLIENT_HEADER = 'x-marvira-client';
export const MARVIRA_CLIENT_DASHBOARD = 'dashboard';

export function isDashboardClient(
  headers: Record<string, string | string[] | undefined> | undefined,
): boolean {
  if (!headers) return false;
  const raw =
    headers[MARVIRA_CLIENT_HEADER] ??
    headers['X-Marvira-Client'] ??
    headers['x-marvira-client'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? '').toLowerCase() === MARVIRA_CLIENT_DASHBOARD;
}
