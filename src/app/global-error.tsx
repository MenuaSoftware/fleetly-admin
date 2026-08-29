"use client";

// Next.js auto-generates a fallback for this route when it's missing, and
// that auto-generated version fails to prerender on this Next 16 canary
// (TypeError: Cannot read properties of null (reading 'useContext'),
// confirmed pre-existing on main before this file existed — not caused by
// app code). Defining a real one replaces the broken auto-generated one.
// global-error replaces the root layout entirely, so it needs its own
// <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-wash px-6 text-center">
        <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
        <p className="max-w-sm text-sm text-ink-2">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
