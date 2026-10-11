/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@lp/design-system"],
  // Local dev convention: web on :3001, API on :3002.
  // Same-origin /api proxy so login works even from a stale cached
  // bundle that still points at the web port itself.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3002/api/:path*",
      },
    ];
  },
};

export default nextConfig;
