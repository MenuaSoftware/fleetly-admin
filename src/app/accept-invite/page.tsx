"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "submitting" | "error" | "invalid";

/**
 * Reached from the invite email's link. GoTrue's invite flow attaches
 * the session as a URL hash fragment — never sent to the server (see
 * proxy.ts's PUBLIC_PATHS comment) — access_token/refresh_token only,
 * not a `?code=`. That's the implicit flow, not PKCE; auth-js's own
 * docs on inviteUserByEmail say PKCE isn't supported for invites at all
 * (the browser that sends the invite is rarely the one that accepts
 * it, which breaks PKCE's verifier requirement).
 *
 * @supabase/ssr's createBrowserClient hardcodes flowType: "pkce" —
 * confirmed by reading its source, not assumed — so its automatic
 * detectSessionInUrl never even looks at the hash; it only knows how to
 * consume a `?code=` query param. Left alone, this page found no
 * session for a link a raw `curl` proved really did carry a valid
 * access_token: the hash sat untouched in the URL, no cookie was ever
 * set, no error thrown either. So this page parses the hash itself and
 * calls setSession() directly — the documented workaround for exactly
 * this @supabase/ssr-plus-implicit-flow-link combination.
 */
export default function AcceptInvitePage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [status, setStatus] = useState<Status>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function establishSession() {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        // Clears the token-bearing hash from the address bar and back/
        // forward history regardless of outcome — it's already been
        // used, and a one-time credential has no business staying
        // visible in the URL.
        window.history.replaceState(null, "", window.location.pathname);
        setStatus(error ? "invalid" : "ready");
        return;
      }

      // No hash — either a stale reload of this page, or the invite
      // link redirect didn't carry tokens. Fall back to whatever
      // session (if any) is already persisted.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setStatus(session ? "ready" : "invalid");
    }
    establishSession();
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");

    if (password !== confirm) {
      setStatus("error");
      setErrorMessage("Passwords don't match.");
      return;
    }

    setStatus("submitting");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-wash px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="mb-8 text-center">
          <span className="font-sans text-2xl font-extrabold tracking-tight text-ink">
            Fleetly
          </span>
        </div>

        <div className="rounded-2xl border border-line bg-paper p-8 shadow-lg">
          {status === "checking" && (
            <p className="text-center text-sm text-ink-3">Checking your invite…</p>
          )}

          {status === "invalid" && (
            <>
              <h1 className="mb-1 text-lg font-semibold text-ink">Invite not found</h1>
              <p className="text-sm text-ink-3">
                This invite link is invalid or has expired. Ask a general admin to send you a
                new one.
              </p>
            </>
          )}

          {(status === "ready" || status === "submitting" || status === "error") && (
            <form onSubmit={handleSubmit} noValidate>
              <h1 className="mb-1 text-lg font-semibold text-ink">Set your password</h1>
              <p className="mb-6 text-sm text-ink-3">
                Choose a password for your Fleetly account.
              </p>

              <div className="mb-4">
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={status === "submitting"}
                  className="w-full rounded-xl border border-line-2 bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-wash disabled:text-ink-3"
                  placeholder="••••••••"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-ink-2">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={status === "submitting"}
                  className="w-full rounded-xl border border-line-2 bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-wash disabled:text-ink-3"
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
                disabled={status === "submitting"}
                className="flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "submitting" ? "Setting password…" : "Set password & sign in"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
