'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdminEvent } from '@marvira/shared-types';

type PlaceWithQuestion = AdminEvent['places'][number];

interface PublishReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  places: PlaceWithQuestion[];
  onConfirmPublish: () => void;
  onConfirmSchedule: (scheduledPublishAtUtc: string) => void;
}

function localDatetimeToUtcIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, mo, d, h, mi] = match;
  const local = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    0,
    0,
  );
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

export function PublishReviewDialog({
  open,
  onOpenChange,
  places,
  onConfirmPublish,
  onConfirmSchedule,
}: PublishReviewDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [mode, setMode] = useState<'now' | 'schedule'>('now');
  const [localWhen, setLocalWhen] = useState('');
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const sorted = [...places].sort((a, b) => a.orderIndex - b.orderIndex);

  const reset = () => {
    setConfirmed(false);
    setMode('now');
    setLocalWhen('');
    setScheduleError(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) reset();
        onOpenChange(next);
      }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review answers before publish</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Confirm each stored answer looks correct. Players must match these
          exactly (after trim and case).
        </p>
        <ul className="max-h-[40vh] space-y-3 overflow-y-auto text-sm">
          {sorted.map((place, index) => (
            <li
              key={place.id}
              className="rounded-md border border-border p-3 space-y-1">
              <p className="font-medium">
                {index + 1}. {place.title}
              </p>
              <p className="text-muted-foreground">
                {place.question?.question ?? '— no question —'}
              </p>
              <p>
                <span className="text-muted-foreground">Answer: </span>
                <span className="font-mono">{place.question?.answer ?? '—'}</span>
              </p>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === 'now' ? 'default' : 'outline'}
            onClick={() => setMode('now')}>
            Publish now
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'schedule' ? 'default' : 'outline'}
            onClick={() => setMode('schedule')}>
            Schedule
          </Button>
        </div>
        {mode === 'schedule' ? (
          <div className="space-y-2">
            <Label htmlFor="scheduleLocal">Go live (your local time)</Label>
            <Input
              id="scheduleLocal"
              type="datetime-local"
              value={localWhen}
              onChange={e => setLocalWhen(e.target.value)}
            />
            {scheduleError ? (
              <p className="text-sm text-destructive">{scheduleError}</p>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-start gap-2 pt-2">
          <input
            type="checkbox"
            id="publishReviewConfirmed"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <Label htmlFor="publishReviewConfirmed" className="font-normal">
            I reviewed every question and answer above.
          </Label>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!confirmed}
            onClick={() => {
              if (mode === 'now') {
                onConfirmPublish();
                return;
              }
              const utc = localDatetimeToUtcIso(localWhen);
              if (!utc) {
                setScheduleError('Pick a valid date and time');
                return;
              }
              if (new Date(utc).getTime() <= Date.now()) {
                setScheduleError('Must be a future time');
                return;
              }
              setScheduleError(null);
              onConfirmSchedule(utc);
            }}>
            {mode === 'now' ? 'Publish now' : 'Schedule publish'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
