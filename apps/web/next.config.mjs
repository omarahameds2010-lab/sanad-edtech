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
