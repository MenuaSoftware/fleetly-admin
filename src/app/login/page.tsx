"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "error";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      // Supabase's own message ("Invalid login credentials") is
      // already the driver-facing text this codebase's own docs ask
      // for — passed through, not replaced with something generic.
      setErrorMessage(error.message);
      return;
    }

    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-wash px-4 py-10">
      {/*
        Ambient brand light — the signed-out screen is the one surface
        with room for atmosphere, and it sets the tone before the dense
        dashboard behind it.

        Four blobs rather than two, on loops of different lengths so the
        field never visibly repeats, and blurred well past their own
        size so they read as light in the room rather than as circles.
        A soft radial vignette sits over the top: it darkens the corners
        just enough to seat the card in the middle of the frame, which
        is what stops a centred card on a flat wash looking like it is
        floating in nothing.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-120 w-120 -translate-x-1/2 animate-aurora rounded-full bg-brand/18 blur-[110px]" />
        <div
          className="absolute top-1/4 -left-32 h-96 w-96 animate-aurora rounded-full bg-viz-2/14 blur-[110px]"
          style={{ animationDelay: "-5s", animationDuration: "24s" }}
        />
        <div
          className="absolute -right-32 bottom-1/4 h-104 w-104 animate-aurora rounded-full bg-viz-3/12 blur-[110px]"
          style={{ animationDelay: "-11s", animationDuration: "28s" }}
        />
        <div
          className="absolute -bottom-44 left-1/3 h-88 w-88 animate-aurora rounded-full bg-brand/10 blur-[110px]"
          style={{ animationDelay: "-17s", animationDuration: "21s" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 35%, color-mix(in oklab, var(--wash) 70%, transparent) 100%)",
          }}
        />
      </div>

      <div className="relative w-full max-w-sm animate-slide-up">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-display text-base font-bold text-brand-ink shadow-[0_2px_12px_-2px_rgb(var(--brand-glow)/0.6)]">
            F
          </span>
          <span className="font-display text-2xl font-bold tracking-tight text-ink">Fleetly</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-line bg-paper p-8 shadow-lg"
          noValidate
        >
          <h1 className="mb-1 font-display text-xl font-semibold text-ink">Sign in</h1>
          <p className="mb-6 text-sm text-ink-3">Dispatcher and admin access.</p>

          <div className="mb-4">
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={status === "loading"}
              className="w-full rounded-xl border border-line-2 bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash disabled:text-ink-3"
              placeholder="you@subcontractor.com"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={status === "loading"}
              className="w-full rounded-xl border border-line-2 bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash disabled:text-ink-3"
              placeholder="••••••••"
            />
          </div>

          {status === "error" && errorMessage && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-bad/20 bg-bad-bg px-3.5 py-2.5 text-sm text-bad"
            >
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_2px_12px_-2px_rgb(var(--brand-glow)/0.5)] transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {status === "loading" ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
