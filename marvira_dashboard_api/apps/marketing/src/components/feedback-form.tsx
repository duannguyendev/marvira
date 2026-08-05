'use client';

import { FormEvent, useState } from 'react';

import { getPublicApiUrl } from '@marvira/shared-utils';

const API_URL = getPublicApiUrl();

type FeedbackCategory = 'FEEDBACK' | 'SUGGESTION' | 'BUG' | 'OTHER';

type FeedbackFormContent = {
  title: string;
  intro: string;
  nameLabel: string;
  emailLabel: string;
  categoryLabel: string;
  subjectLabel: string;
  messageLabel: string;
  submit: string;
  submitting: string;
  success: string;
  error: string;
  categories: {
    feedback: string;
    suggestion: string;
    bug: string;
    other: string;
  };
};

export function FeedbackForm({ content }: { content: FeedbackFormContent }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('FEEDBACK');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          subject: subject.trim() || undefined,
          message: message.trim(),
          source: 'WEB',
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const msg =
          typeof result?.message === 'string'
            ? result.message
            : Array.isArray(result?.message)
              ? result.message.join(', ')
              : content.error;
        throw new Error(msg);
      }

      setStatus('success');
      setName('');
      setEmail('');
      setCategory('FEEDBACK');
      setSubject('');
      setMessage('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : content.error);
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-forest/15 bg-white/70 p-8 text-center shadow-sm">
        <p className="font-display text-lg font-semibold text-ink">
          {content.success}
        </p>
        <button
          type="button"
          className="mt-4 text-sm font-medium text-canopy underline-offset-4 hover:underline"
          onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-forest/15 bg-white/70 p-6 shadow-sm md:p-8">
      <h2 className="font-display text-2xl font-bold text-ink">
        {content.title}
      </h2>
      <p className="mt-2 text-sm text-ink/70">{content.intro}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">
            {content.nameLabel}
          </span>
          <input
            required
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-lg border border-forest/20 bg-white px-3 py-2 text-ink outline-none ring-canopy/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">
            {content.emailLabel}
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg border border-forest/20 bg-white px-3 py-2 text-ink outline-none ring-canopy/30 focus:ring-2"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block font-medium text-ink">
          {content.categoryLabel}
        </span>
        <select
          value={category}
          onChange={e => setCategory(e.target.value as FeedbackCategory)}
          className="w-full rounded-lg border border-forest/20 bg-white px-3 py-2 text-ink outline-none ring-canopy/30 focus:ring-2">
          <option value="FEEDBACK">{content.categories.feedback}</option>
          <option value="SUGGESTION">{content.categories.suggestion}</option>
          <option value="BUG">{content.categories.bug}</option>
          <option value="OTHER">{content.categories.other}</option>
        </select>
      </label>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block font-medium text-ink">
          {content.subjectLabel}
        </span>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full rounded-lg border border-forest/20 bg-white px-3 py-2 text-ink outline-none ring-canopy/30 focus:ring-2"
        />
      </label>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block font-medium text-ink">
          {content.messageLabel}
        </span>
        <textarea
          required
          minLength={10}
          rows={5}
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full rounded-lg border border-forest/20 bg-white px-3 py-2 text-ink outline-none ring-canopy/30 focus:ring-2"
        />
      </label>

      {status === 'error' ? (
        <p className="mt-4 text-sm text-red-600">
          {errorMessage || content.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-canopy px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-canopy/90 disabled:opacity-60">
        {status === 'loading' ? content.submitting : content.submit}
      </button>
    </form>
  );
}
