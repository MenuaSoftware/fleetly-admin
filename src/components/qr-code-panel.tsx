"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Copy, Printer, ScanLine } from "lucide-react";
import { EASE_OUT, springSnappy } from "@/lib/motion";

/**
 * Renders a QR the driver app scans (see fleetly-mobile's
 * lib/qr-payload.ts). The SVG is generated on the server by
 * lib/qr-payload.ts's renderQrSvg and passed in as markup — no QR
 * library reaches the client bundle, and it stays sharp at print size.
 *
 * The code is presented as a physical artifact rather than a data
 * field: it exists to be printed and stuck to a van door or a badge, so
 * it sits on a white card with a real quiet zone (scanners need the
 * light margin) regardless of the panel's own light/dark theme. A QR
 * rendered dark-on-dark is simply unscannable, so this one surface
 * deliberately does not follow the theme.
 *
 * Printing opens a dedicated window rather than driving the page's own
 * print styles: these get printed one at a time, and a full-page print
 * of the whole detail screen is never what anyone wants.
 */
export function QrCodePanel({
  svg,
  title,
  caption,
  payload,
}: {
  svg: string;
  title: string;
  caption: string;
  /** Shown as text under the code so a damaged sticker is still usable by hand. */
  payload: string;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const reduced = useReducedMotion();

  function handlePrint() {
    const win = window.open("", "_blank", "width=480,height=640");
    if (!win) {
      // Popup blocked. The on-screen code is still scannable, and the
      // payload is still readable below it — say so rather than
      // appearing to do nothing.
      setCopyState("failed");
      return;
    }
    win.document.write(
      `<!doctype html><html><head><title>${escapeHtml(title)}</title>` +
        `<style>
           body { font-family: ui-sans-serif, system-ui, sans-serif; text-align: center;
                  margin: 0; padding: 32px; color: #111; }
           svg { width: 300px; height: 300px; }
           h1 { font-size: 18px; margin: 0 0 4px; }
           p  { font-size: 13px; color: #444; margin: 0 0 16px; }
           code { font-size: 11px; word-break: break-all; color: #666; }
         </style></head><body>` +
        `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(caption)}</p>${svg}` +
        `<code>${escapeHtml(payload)}</code>` +
        `</body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  }

  async function handleCopy() {
    try {
      // Not available on an insecure origin, and can be refused by
      // permissions policy — this is a real failure mode on any deploy
      // that isn't https, not a theoretical one.
      await navigator.clipboard.writeText(payload);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 2000);
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.32, ease: EASE_OUT }}
        className="relative"
      >
        {/*
          Library-generated markup from renderQrSvg, never user input —
          the encoder emits path data only and does not echo the payload
          into the document.
        */}
        <div
          data-testid="qr-code"
          className="rounded-2xl border border-line bg-white p-4 shadow-sm [&_svg]:block [&_svg]:h-44 [&_svg]:w-44"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        {/*
          Corner ticks: reads as something meant to be aimed at and cut
          out, and visually separates the white code card from the panel
          behind it in light mode, where white-on-near-white would
          otherwise float.
        */}
        <Corner className="-top-px -left-px border-t-2 border-l-2 rounded-tl-lg" />
        <Corner className="-top-px -right-px border-t-2 border-r-2 rounded-tr-lg" />
        <Corner className="-bottom-px -left-px border-b-2 border-l-2 rounded-bl-lg" />
        <Corner className="-bottom-px -right-px border-b-2 border-r-2 rounded-br-lg" />
      </motion.div>

      <div className="flex flex-col items-center gap-1.5">
        <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <ScanLine className="h-3.5 w-3.5 text-brand" aria-hidden />
          {title}
        </p>
        <p className="max-w-xs text-center text-xs leading-relaxed text-ink-3">{caption}</p>
      </div>

      {/*
        The payload in readable form, not just inside the QR. A badge
        token exists nowhere else after this screen, and a scuffed
        vehicle sticker still has to be usable — both cases come down to
        someone reading this and typing it into the driver app by hand.
      */}
      <code className="max-w-full rounded-lg bg-wash px-2.5 py-1.5 font-mono text-[11px] leading-relaxed break-all text-ink-2 select-all">
        {payload}
      </code>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line-2 px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-200 hover:bg-wash focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden />
          Print
        </button>
        <button
          type="button"
          onClick={handleCopy}
          aria-live="polite"
          className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand transition-colors duration-200 hover:bg-brand-soft focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
        >
          <motion.span
            key={copyState}
            initial={reduced ? false : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springSnappy}
            className="inline-flex items-center gap-1.5"
          >
            {copyState === "copied" ? (
              <Check className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden />
            )}
            {copyState === "copied"
              ? "Copied"
              : copyState === "failed"
                ? "Copy failed — select it above"
                : "Copy code"}
          </motion.span>
        </button>
      </div>
    </div>
  );
}

/** One corner tick on the code card. Decorative only. */
function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-3.5 w-3.5 border-brand/50 ${className}`}
    />
  );
}

/**
 * The print window is built as a raw HTML string, so every interpolated
 * value has to be escaped — a plate or a badge token is not markup.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
