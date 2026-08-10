'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getPublicApiUrl } from '@marvira/shared-utils';
import { AuthPageShell } from '@/components/auth-page-shell';

const API_URL = getPublicApiUrl();

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'done' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    if (!token) {
      setStatus('error');
      setErrorMessage('This reset link is invalid or missing a token.');
      return;
    }
    if (password.length < 6) {
      setStatus('error');
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('error');
      setErrorMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const msg =
          typeof result?.message === 'string'
            ? result.message
            : Array.isArray(result?.message)
              ? result.message.join(', ')
              : 'Reset failed';
        throw new Error(msg);
      }

      setStatus('done');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Reset failed',
      );
    }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-sm text-ink/70">
        <p>This reset link is invalid or missing a token.</p>
        <Link
          href="/forgot-password"
          className="inline-block font-medium text-canopy underline-offset-4 hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="space-y-4 text-sm text-ink/70">
        <p className="font-medium text-ink">
          Password updated. Open the Marvira app and sign in with your email.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/download"
            className="inline-flex justify-center rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-canopy">
            Get the app
          </Link>
          <Link
            href="/"
            className="inline-flex justify-center rounded-lg border border-forest/20 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-mist">
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink">New password</span>
        <input
          required
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full rounded-lg border border-forest/20 bg-white px-3 py-2 text-ink outline-none ring-canopy/30 focus:ring-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink">
          Confirm password
        </span>
        <input
          required
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
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
        {status === 'loading' ? 'Updating…' : 'Update password'}
      </button>
      <p className="text-center text-sm text-ink/60">
        <Link
          href="/forgot-password"
          className="font-medium text-canopy underline-offset-4 hover:underline">
          Request a new link
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthPageShell
      title="Reset password"
      description="Choose a new password for your Marvira account.">
      <Suspense
        fallback={
          <p className="text-sm text-ink/60">Loading…</p>
        }>
        <ResetPasswordForm />
      </Suspense>
    </AuthPageShell>
  );
}
