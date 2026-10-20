import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
// Local dev convention: web on :3001, API on :3002 — same-origin /api proxy
// so login works even from a stale cached bundle that still points at the
// web port itself.
//
// Production (Vercel): API_PROXY_TARGET points at the Railway API, so every
// /api/* call stays same-origin for the browser — first-party cookies work
// (no SameSite=None, no third-party-cookie blocking) and there is no CORS.
//
// Fail-safe defaults keep a deploy alive when the env var is missing: a build
// without API_PROXY_TARGET once baked `http://localhost:3002`, and Vercel
// refuses to proxy to private hosts (X-Vercel-Error:
// DNS_HOSTNAME_RESOLVED_PRIVATE), 404-ing every /api/* call.
const PRODUCTION_API_ORIGIN = "https://sanad-edtech-production.up.railway.app";
const apiProxyTarget = (
  process.env.API_PROXY_TARGET ??
  (process.env.VERCEL ? PRODUCTION_API_ORIGIN : "http://localhost:3002")
).replace(/\/+$/, "");

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
