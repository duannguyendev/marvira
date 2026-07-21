import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-4xl font-bold text-forest">Marvira</p>
      <h1 className="mt-4 font-display text-2xl font-bold">Page not found</h1>
      <p className="mt-3 text-sm text-ink/65">This hunt invite or page is unavailable.</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white"
      >
        Back home
      </Link>
    </div>
  );
}
