import { createClient } from "@/lib/supabase/server";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Server-only: forwards the current staff member's real Supabase access
 * token to the NestJS API as a Bearer token — the exact mechanism
 * jwt-auth.guard.ts verifies (JWKS-based, ES256), not a separate admin
 * auth path. Called from Server Components/Actions only, never from the
 * browser, so there's no CORS story to build: this is a server-to-server
 * call, same origin concerns as any other Next.js data fetch.
 */
export async function apiFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new ApiError("Not signed in.", 401);
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not set.");
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    // The API's own message (Nest's ValidationPipe / thrown
    // BadRequestException/ForbiddenException text) is already the
    // admin-facing text this codebase's own docs ask for — passed
    // through, not replaced with something generic. ValidationPipe's
    // rejections come back as message: string[], not a single string.
    const body: unknown = await res.json().catch(() => null);
    const rawMessage =
      body && typeof body === "object" && "message" in body
        ? (body as { message: unknown }).message
        : undefined;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(" ")
      : rawMessage
        ? String(rawMessage)
        : `Request failed (${res.status}).`;
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as T;
}
