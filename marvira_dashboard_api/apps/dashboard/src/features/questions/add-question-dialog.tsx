'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { QuestionForm } from '@/features/questions/question-form';
import type { AdminQuestion } from '@marvira/shared-types';

interface AddQuestionDialogProps {
  eventId: string;
  onAdded: () => void;
  /** After create + link, assign this question to the given place */
  assignToPlaceId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm';
}

export function AddQuestionDialog({
  eventId,
  onAdded,
  assignToPlaceId,
  variant = 'outline',
  size = 'sm',
}: AddQuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const linkMutation = useMutation({
    mutationFn: async (question: AdminQuestion) => {
      await api.post(`/admin/events/${eventId}/questions`, {
        questionId: question.id,
      });
      if (assignToPlaceId) {
        await api.patch(`/places/${assignToPlaceId}`, {
          questionId: question.id,
        });
      }
      return question;
    },
    onSuccess: () => {
      toast.success(
        assignToPlaceId
          ? 'Question created and assigned to place'
          : 'Question created and linked to event',
      );
      onAdded();
      setOpen(false);
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Failed to link question to event'),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (next) setFormKey(k => k + 1);
      }}>
      <DialogTrigger asChild>
        <Button type="button" variant={variant} size={size}>
          <Plus className="h-3 w-3" />
          Add Question
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Question</DialogTitle>
          <DialogDescription>
            Create a new question and link it to this event
            {assignToPlaceId ? ', then assign it to this place' : ''}.
          </DialogDescription>
        </DialogHeader>
        <QuestionForm
          key={formKey}
          showSuccessToast={false}
          onSaved={question => linkMutation.mutate(question)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
