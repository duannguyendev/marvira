'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { UserRole } from '@marvira/shared-types';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email'),
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface AddUserDialogProps {
  isAdmin: boolean;
  onCreated: () => void;
}

export function AddUserDialog({ isAdmin, onCreated }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const roleOptions = isAdmin
    ? [UserRole.USER, UserRole.STAFF, UserRole.ADMIN]
    : [UserRole.USER, UserRole.STAFF];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
      role: UserRole.USER,
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateUserForm) => api.post('/admin/users', values),
    onSuccess: () => {
      toast.success('User created');
      reset({ email: '', name: '', password: '', role: UserRole.USER });
      setOpen(false);
      onCreated();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create user'),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset({ email: '', name: '', password: '', role: UserRole.USER });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button">
          <Plus className="h-4 w-4" />
          Add user
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Create a local account with email and password.
            {!isAdmin && ' Staff cannot create Admin accounts.'}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => createMutation.mutate(values))}
        >
          <div className="space-y-2">
            <Label htmlFor="create-user-name">Name</Label>
            <Input id="create-user-name" placeholder="Jane Doe" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-user-email">Email</Label>
            <Input
              id="create-user-email"
              type="email"
              placeholder="user@example.com"
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-user-password">Password</Label>
            <Input
              id="create-user-password"
              type="password"
              placeholder="At least 6 characters"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-user-role">Role</Label>
            <select
              id="create-user-role"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('role')}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create user'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
