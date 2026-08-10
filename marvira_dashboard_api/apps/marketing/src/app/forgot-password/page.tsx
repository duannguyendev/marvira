'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { getPublicApiUrl } from '@marvira/shared-utils';
import { AuthPageShell } from '@/components/auth-page-shell';

const API_URL = getPublicApiUrl();

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle',
  );
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const msg =
          typeof result?.message === 'string'
            ? result.message
            : Array.isArray(result?.message)
              ? result.message.join(', ')
              : 'Request failed';
        throw new Error(msg);
      }

      setStatus('done');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Request failed',
      );
    }
  };

  return (
    <AuthPageShell
      title="Forgot password"
      description="Enter your email and we will send a link to set or reset your Marvira password.">
      {status === 'done' ? (
        <div className="space-y-4 text-sm text-ink/70">
          <p>
            If an account exists for that email, a reset link has been sent.
            Check your inbox (and spam folder).
          </p>
          <Link
            href="/download"
            className="inline-block font-medium text-canopy underline-offset-4 hover:underline">
            Get the Marvira app
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-forest/20 bg-white px-3 py-2 text-ink outline-none ring-canopy/30 focus:ring-2"
            />
          </label>
          {status === 'error' ? (
            <p className="text-sm text-sun">{errorMessage}</p>
          ) : null}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-canopy disabled:opacity-60">
            {status === 'loading' ? 'Sending…' : 'Send reset link'}
          </button>
          <p className="text-center text-sm text-ink/60">
            <Link
              href="/"
              className="font-medium text-canopy underline-offset-4 hover:underline">
              Back to home
            </Link>
          </p>
        </form>
      )}
    </AuthPageShell>
  );
}
