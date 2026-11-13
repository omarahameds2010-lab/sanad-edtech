import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
// Local dev convention: web on :3001, API on :3002 — same-origin /api proxy
// so login works even from a stale cached bundle that still points at the
// web port itself.
//
// Production (Vercel): API_PROXY_TARGET points at the demo tunnel/API, so
// every /api/* call stays same-origin for the browser — first-party cookies
// work (no SameSite=None, no third-party-cookie blocking) and there is no CORS.
//
// Fail-safe defaults keep a deploy alive when the env var is missing: a build
// without API_PROXY_TARGET once baked `http://localhost:3002`, and Vercel
// refuses to proxy to private hosts (X-Vercel-Error:
// DNS_HOSTNAME_RESOLVED_PRIVATE), 404-ing every /api/* call.
//
// TEMPORARY local-demo bridge: while Railway is stopped, route production
// /api/* traffic to the active tunnel. Set API_PROXY_TARGET or
// DEMO_TUNNEL_ORIGIN in Vercel to override this without a code change; remove
// this fallback after the stable tunnel is verified.
const FALLBACK_DEMO_TUNNEL_ORIGIN =
  "https://timer-surprised-governing-prize.trycloudflare.com";

/**
 * Normalize a proxy origin.
 *
 * `.trim()` alone is not enough: invisible Unicode marks (LRM/RLM/ZWSP/BOM)
 * survive trimming, are invisible in the Vercel dashboard, and silently break
 * exact-origin matching. Strip them, validate the URL, and remove trailing
 * slashes before the rewrite uses it.
 */
function normalizeOrigin(value, fallback) {
  const cleaned = String(value ?? "")
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, "")
    .trim();
  if (!/^https?:\/\/[^\s/]+/i.test(cleaned)) return fallback;
  return cleaned.replace(/\/+$/, "");
}

const envProxyTarget = normalizeOrigin(process.env.API_PROXY_TARGET, "");
const envDemoTunnel = normalizeOrigin(process.env.DEMO_TUNNEL_ORIGIN, "");

const apiProxyTarget = process.env.VERCEL
  ? envProxyTarget || envDemoTunnel || FALLBACK_DEMO_TUNNEL_ORIGIN
  : envProxyTarget || "http://localhost:3002";

// This is intentionally a non-secret URL and makes the Vercel build log show
// exactly which API the deployment will proxy to.
console.info(`[next.config] API proxy target: ${apiProxyTarget}`);

const nextConfig = {
  transpilePackages: ["@lp/design-system"],
  // Pin file tracing to the repo root: without this Next.js walks up past the
  // repo and may pick a stray lockfile in a parent directory (e.g. the user's
  // home folder), which is never what a monorepo wants.
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
