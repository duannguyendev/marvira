import Link from 'next/link';
import type { ReactNode } from 'react';

/** Minimal shell for account actions (password reset) — brand-first, no admin vibe. */
export function AuthPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-forest/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-lg items-center px-5">
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-tight text-ink">
            Marvira
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md rounded-2xl border border-forest/15 bg-white/80 p-6 shadow-sm md:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">
            {description}
          </p>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
