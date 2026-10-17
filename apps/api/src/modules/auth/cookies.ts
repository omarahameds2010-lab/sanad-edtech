/**
 * Session cookie policy — the single source of truth.
 *
 * Every auth cookie the platform ever sets is defined here. Nothing else in
 * the codebase is allowed to hand-roll cookie flags; a policy change is a
 * one-file change plus tests.
 *
 * Threat model this file implements:
 *
 *   XSS         → `httpOnly: true`. JavaScript in the page cannot read the
 *                 cookie, so an injected script cannot exfiltrate a session.
 *
 *   CSRF        → `sameSite: "strict"` (primary) + Origin validation on every
 *                 unsafe method (see origin.middleware.ts). Strict alone is
 *                 defeated the moment someone relaxes it — e.g. to make an
 *                 off-site payment redirect survive — so the Origin check is
 *                 what actually keeps CSRF closed.
 *
 *   Wire sniff  → `secure: true`. The cookie is only ever transmitted over
 *                 TLS. Browsers treat http://localhost as a secure context,
 *                 so local development keeps working with Secure enabled.
 *
 *   Theft       → 15-minute access token + 7-day absolute rotating refresh
 *                 token + reuse detection that revokes the whole family.
 */

import { Response, Request } from "express";
import type { CookieOptions } from "express";

export const COOKIE_NAMES = {
  /** Access token. Short-lived (15m). Readable by the server only. */
  access: "lp_access",
  /** Refresh token. Rotating, 7-day absolute. Readable by the server only. */
  refresh: "lp_refresh",
} as const;

/** Access token lifetime. Mirrors JWT_EXPIRES_IN's default in auth.module.ts. */
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;

/** Refresh token absolute lifetime — one full study week, never extended. */
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * Secure flag.
 *
 * Defaults to true. The ONLY way to disable it is an explicit
 * `COOKIE_SECURE=false` — needed only when exercising the API over plain
 * HTTP from a non-localhost host (e.g. a LAN phone test). Production must
 * never set it.
 */
export function cookieSecure(): boolean {
  return process.env.COOKIE_SECURE !== "false";
}

/**
 * SameSite policy.
 *
 * "strict" is the default and is what the platform spec mandates: a request
 * arriving from another site never carries the session cookie.
 *
 * "lax" is the escape hatch, and ONE real flow in this product needs it: a
 * student paying through Paymob/Fawry is redirected off-site and back again.
 * That return is a top-level cross-site navigation, and Strict would strip
 * the cookie — silently logging the student out right after they paid. Lax
 * still refuses the cookie on every cross-site non-GET request, and the
 * Origin guard covers the rest.
 */
export function cookieSameSite(): "strict" | "lax" | "none" {
  const value = (process.env.COOKIE_SAMESITE ?? "strict").toLowerCase();
  return value === "lax" || value === "none" ? value : "strict";
}

function assertSanePolicy(sameSite: string, secure: boolean): void {
  if (sameSite === "none" && !secure) {
    throw new Error(
      "Invalid cookie policy: sameSite=none requires secure=true. " +
        "Set COOKIE_SECURE=true or COOKIE_SAMESITE=strict.",
    );
  }
}

/**
 * The cookie attribute set applied to both session cookies.
 *
 * `path: "/api"` scopes sending to the API surface only — the cookie is never
 * attached to requests for images, fonts, static assets or HTML navigations,
 * which shrinks the exposure window considerably.
 */
function cookieOptions(maxAgeSeconds: number): CookieOptions {
  const sameSite = cookieSameSite();
  const secure = cookieSecure();
  assertSanePolicy(sameSite, secure);

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/api",
    maxAge: maxAgeSeconds * 1000,
  };
}

export function accessCookieOptions(): CookieOptions {
  return cookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS);
}

export function refreshCookieOptions(): CookieOptions {
  return cookieOptions(REFRESH_TOKEN_MAX_AGE_SECONDS);
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Emit the session cookies on a response. Called on login, register and every
 * successful rotation — one request, one atomic policy application.
 */
export function setAuthCookies(res: Response, tokens: AuthTokens): void {
  res.cookie(COOKIE_NAMES.access, tokens.accessToken, accessCookieOptions());
  res.cookie(COOKIE_NAMES.refresh, tokens.refreshToken, refreshCookieOptions());
}

/**
 * Clear the session cookies.
 *
 * `clearCookie` must repeat the same path/secure/sameSite attributes the
 * cookie was set with, or the browser keeps the original and the "logout"
 * silently does nothing.
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie(COOKIE_NAMES.access, accessCookieOptions());
  res.clearCookie(COOKIE_NAMES.refresh, refreshCookieOptions());
}

/** Read the refresh token from the request cookie jar. Never from the body. */
export function readRefreshToken(req: Request): string | null {
  const jar = (req as Request & { cookies?: Record<string, string> }).cookies;
  const value = jar?.[COOKIE_NAMES.refresh];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Read the access token from the request cookie jar. */
export function readAccessToken(req: Request): string | null {
  const jar = (req as Request & { cookies?: Record<string, string> }).cookies;
  const value = jar?.[COOKIE_NAMES.access];
  return typeof value === "string" && value.length > 0 ? value : null;
}
