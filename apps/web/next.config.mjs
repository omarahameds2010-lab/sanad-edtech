import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
// Local dev convention: web on :3001, API on :3002 — same-origin /api proxy
// so login works even from a stale cached bundle that still points at the
// web port itself.
//
// Production (Vercel): API_PROXY_TARGET points at the Railway API, so every
// /api/* call stays same-origin for the browser — first-party cookies work
// (no SameSite=None, no third-party-cookie blocking) and there is no CORS.
const apiProxyTarget = (
  process.env.API_PROXY_TARGET ?? "http://localhost:3002"
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
