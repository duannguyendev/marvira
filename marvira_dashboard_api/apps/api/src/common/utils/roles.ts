import { UserRole } from '@prisma/client';

/** Roles that may access the admin dashboard and content-management APIs. */
export function isDashboardRole(role: string): boolean {
  return role === UserRole.ADMIN || role === UserRole.STAFF;
}

/** Full platform admin (user status + role changes, anticheat, etc.). */
export function isAdminRole(role: string): boolean {
  return role === UserRole.ADMIN;
}
