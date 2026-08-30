/**
 * A short two-note chime for an arriving notification.
 *
 * Synthesised with the Web Audio API rather than shipped as an audio
 * file: it is two sine tones, so a binary asset would be a needless
 * download and one more thing to keep in the repo. It also means the
 * sound can't fail to load.
 *
 * Browsers block audio until the user has interacted with the page, so
 * the first call on a freshly-loaded tab may be refused. That is
 * correct behaviour and not worth fighting — the toast still appears,
 * and by the time a dispatcher has clicked anything the chime works.
 * Every failure path is swallowed: a missing or suspended AudioContext
 * must never break the notification itself.
 */

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!context) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    }
    return context;
  } catch {
    return null;
  }
}

function tone(ctx: AudioContext, frequency: number, startAt: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;

  // Ramped rather than switched on and off — an abrupt gain change on a
  // sine wave produces an audible click at both ends.
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(0.09, startAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration);
}

export function playNotificationChime(): void {
  const ctx = getContext();
  if (!ctx) return;
  try {
    // Autoplay policy parks the context until a gesture has happened.
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    // A rising fifth (E6 → B6): short, clearly an alert, not alarming.
    tone(ctx, 1318.5, now, 0.16);
    tone(ctx, 1975.5, now + 0.09, 0.2);
  } catch {
    // Nothing here is important enough to surface to the user.
  }
}
