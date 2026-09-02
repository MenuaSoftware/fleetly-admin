import QRCode from "qrcode";

/**
 * The QR payload format shared with fleetly-mobile, which scans these
 * codes (see its own src/lib/qr-payload.ts for the parsing half — the
 * same two prefixes, hand-mirrored the way this project mirrors API
 * types across repos rather than sharing a package).
 *
 *   fleetly:badge:<raw badge token>
 *   fleetly:vehicle:<vehicle uuid>
 *
 * Namespaced rather than bare so the app can tell a driver they've
 * scanned the wrong sticker instead of failing confusingly later.
 * Changing a prefix here is a breaking change for every code already
 * printed and stuck to a real van — treat these two strings as a wire
 * format, not an implementation detail.
 */

export function badgeQrPayload(rawToken: string): string {
  return `fleetly:badge:${rawToken}`;
}

export function vehicleQrPayload(vehicleId: string): string {
  return `fleetly:vehicle:${vehicleId}`;
}

/**
 * Rendered as an inline SVG string rather than a data-URI PNG: it stays
 * sharp at whatever size it's printed (the whole point — these get
 * stuck to a van door or a badge and scanned from a distance), and it
 * costs no client JS, since every caller here is a Server Component or
 * a Server Action.
 *
 * Error correction level M, not the default: these are printed and
 * live on physical objects that get dirty and scuffed, so some
 * redundancy is worth the density. `margin` is the quiet zone in
 * modules — scanners need it, don't set it to 0.
 */
export async function renderQrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
  });
}
