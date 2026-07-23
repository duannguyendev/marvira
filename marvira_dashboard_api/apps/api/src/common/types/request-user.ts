import { User } from '@prisma/client';

export type RequestUser = Pick<
  User,
  'id' | 'email' | 'name' | 'role' | 'avatar'
>;
