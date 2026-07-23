'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Pencil, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { QuestionForm } from '@/features/questions/question-form';
import { resolveImageUrl } from '@/lib/resolve-image-url';
import { AddQuestionDialog } from '@/features/questions/add-question-dialog';
import type {
  PaginatedResponse,
  PlaceWithQuestion,
  QuestionListItem,
} from '@marvira/shared-types';

interface PlaceQuestionEditorProps {
  eventId: string;
  place: PlaceWithQuestion;
  onUpdated: () => void;
}

export function PlaceQuestionEditor({
  eventId,
  place,
  onUpdated,
}: PlaceQuestionEditorProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const { data: allQuestions } = useQuery({
    queryKey: ['admin-questions-picker'],
    queryFn: () =>
      api.get<PaginatedResponse<QuestionListItem>>(
        '/admin/questions?pageSize=200',
      ),
  });

  const assignMutation = useMutation({
    mutationFn: async (questionId: string) => {
      try {
        await api.post(`/admin/events/${eventId}/questions`, { questionId });
      } catch {
        // already linked to event
      }
      await api.patch(`/places/${place.id}`, { questionId });
    },
    onSuccess: () => {
      toast.success('Question assigned to place');
      onUpdated();
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Failed to assign question'),
  });

  const clearMutation = useMutation({
    mutationFn: () => api.patch(`/places/${place.id}`, { questionId: null }),
    onSuccess: () => {
      toast.success('Question removed from place');
      onUpdated();
    },
  });

  const q = place.question;

  if (q) {
    return (
      <div className="space-y-3 rounded-lg border bg-muted/20 p-4 sm:col-span-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Label className="text-base">Question</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Players answer this at this stop (unlock order is enforced in the
              mobile app only).
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Dialog
              open={editOpen}
              onOpenChange={next => {
                setEditOpen(next);
                if (next) setFormKey(k => k + 1);
              }}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Question</DialogTitle>
                  <DialogDescription>
                    Update this place&apos;s question.
                  </DialogDescription>
                </DialogHeader>
                <QuestionForm
                  key={formKey}
                  question={q}
                  onSaved={() => {
                    onUpdated();
                    setEditOpen(false);
                  }}
                  onCancel={() => setEditOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={clearMutation.isPending}
              onClick={() => {
                if (confirm('Remove question from this place?'))
                  clearMutation.mutate();
              }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <p className="text-sm font-medium">{q.question}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
            {q.type.replace(/_/g, ' ')}
          </span>
          <span>{q.points} pts</span>
          <span>Answer: {q.answer}</span>
        </div>
        {q.type === 'IMAGE' && q.imageUrl && (
          <img
            src={resolveImageUrl(q.imageUrl)}
            alt="Question"
            className="h-24 w-auto rounded border object-contain"
          />
        )}
        {q.explanation && (
          <p className="text-xs text-muted-foreground">
            Explanation: {q.explanation}
          </p>
        )}
        <Button variant="link" className="h-auto p-0 text-xs" asChild>
          <Link href={`/dashboard/questions/${q.id}`}>
            Open in Questions library
          </Link>
        </Button>
      </div>
    );
  }

  const bank = allQuestions?.items ?? [];

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-4 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label className="text-base">Question</Label>
          <p className="text-xs text-muted-foreground">
            Each place has one question for players to answer.
          </p>
        </div>
        <AddQuestionDialog
          eventId={eventId}
          assignToPlaceId={place.id}
          onAdded={onUpdated}
        />
      </div>

      {bank.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Or pick from question library
          </Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue=""
            onChange={e => {
              if (e.target.value) assignMutation.mutate(e.target.value);
              e.target.value = '';
            }}
            disabled={assignMutation.isPending}>
            <option value="">Select existing question…</option>
            {bank.map(item => (
              <option key={item.id} value={item.id}>
                {item.question.slice(0, 100)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
