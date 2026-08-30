"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Camera, Loader2, Route as RouteIcon, ShieldCheck, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "error";

const PROOF = [
  { icon: RouteIcon, label: "Every trip", detail: "Odometer, timestamps, route" },
  { icon: Camera, label: "Photographic evidence", detail: "Four angles on every close" },
  { icon: TriangleAlert, label: "Damage register", detail: "Follows the vehicle, not the trip" },
];

/**
 * The signed-out screen: a split between an atmospheric brand panel and
 * the form.
 *
 * This is the one surface in the product with room for atmosphere — the
 * dashboard behind it is deliberately dense and practical
 * (product-brief.md §18: "practical rather than visually complex"), so
 * the sign-in page is where the brand gets to speak. The left panel
 * states what Fleetly actually records rather than showing decoration
 * for its own sake; a dispatcher signing in at 6am should see the thing
 * they are accountable for.
 *
 * The panel is hidden below `lg`, where it would push the form off the
 * fold on a phone — the form is the job, everything else is framing.
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduced = useReducedMotion();
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

  const loading = status === "loading";

  return (
    <main className="flex min-h-screen bg-shell p-0 md:p-3">
      <div className="flex w-full overflow-hidden rounded-none border-line bg-wash md:rounded-3xl md:border md:shadow-lg">
        {/* Brand panel */}
        <section className="relative hidden w-[46%] shrink-0 overflow-hidden bg-[#0d0d13] lg:flex lg:flex-col">
          {/* Aurora field. Three blobs on long, offset loops so the
              motion never visibly repeats; blurred far past their own
              size so they read as light rather than as shapes. */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -left-20 h-[26rem] w-[26rem] animate-aurora rounded-full bg-brand/35 blur-[90px]" />
            <div
              className="absolute top-1/3 -right-24 h-[24rem] w-[24rem] animate-aurora rounded-full bg-viz-2/30 blur-[90px]"
              style={{ animationDelay: "-6s", animationDuration: "22s" }}
            />
            <div
              className="absolute -bottom-28 left-1/4 h-[22rem] w-[22rem] animate-aurora rounded-full bg-viz-3/25 blur-[90px]"
              style={{ animationDelay: "-12s", animationDuration: "26s" }}
            />
          </div>

          <div className="relative flex h-full flex-col justify-between p-10 xl:p-12">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-display text-base font-bold text-brand-ink shadow-[0_2px_16px_-2px_rgb(var(--brand-glow)/0.8)]">
                F
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-white">Fleetly</span>
            </motion.div>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="max-w-md font-display text-[2.6rem] leading-[1.08] font-semibold text-white xl:text-5xl">
                Every vehicle,
                <br />
                accounted for.
              </h1>
              <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-white/60">
                Fleet check-in and damage register. Who took which vehicle, in what condition, and
                what came back different.
              </p>
            </motion.div>

            <motion.ul
              initial={reduced ? false : "hidden"}
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } }}
              className="flex flex-col gap-3"
            >
              {PROOF.map(({ icon: Icon, label, detail }) => (
                <motion.li
                  key={label}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
                  }}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white">{label}</span>
                    <span className="mt-0.5 block text-xs text-white/50">{detail}</span>
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </section>

        {/* Form */}
        <section className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          {/* A trace of the same light on the form side, so the two
              halves belong to one page rather than being bolted together. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
            {/* Faint and pushed well off-canvas: at full strength a blob
                this size on a phone reads as a pink smudge across the
                top third rather than as ambient light. */}
            <div className="absolute -top-52 left-1/2 h-80 w-80 -translate-x-1/2 animate-aurora rounded-full bg-brand/10 blur-[80px]" />
            <div
              className="absolute -bottom-56 -right-24 h-72 w-72 animate-aurora rounded-full bg-viz-2/8 blur-[80px]"
              style={{ animationDelay: "-9s" }}
            />
          </div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm"
          >
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-display text-base font-bold text-brand-ink shadow-[0_2px_12px_-2px_rgb(var(--brand-glow)/0.6)]">
                F
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-ink">Fleetly</span>
            </div>

            <h2 className="font-display text-2xl font-semibold text-ink">Sign in</h2>
            <p className="mt-1 mb-7 text-sm text-ink-3">Dispatcher and admin access.</p>

            <form onSubmit={handleSubmit} noValidate>
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
                  disabled={loading}
                  className="w-full rounded-xl border border-line-2 bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none disabled:bg-sunken disabled:text-ink-3"
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
                  disabled={loading}
                  className="w-full rounded-xl border border-line-2 bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none disabled:bg-sunken disabled:text-ink-3"
                  placeholder="••••••••"
                />
              </div>

              {status === "error" && errorMessage && (
                <motion.div
                  initial={reduced ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="mb-4 rounded-xl border border-bad/20 bg-bad-bg px-3.5 py-2.5 text-sm text-bad"
                >
                  {errorMessage}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_2px_14px_-2px_rgb(var(--brand-glow)/0.55)] transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-ink-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              Access is scoped to your subcontractor.
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
