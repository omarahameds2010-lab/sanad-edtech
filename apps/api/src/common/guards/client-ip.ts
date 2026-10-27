/**
 * Best-effort client identity for rate limiting.
 *
 * Railway and Vercel terminate TLS in front of this API, so the socket address
 * is a proxy, not the caller. Prefer the first address in `X-Forwarded-For`,
 * then `X-Real-IP`, and fall back to the socket address for local development.
 *
 * This is a rate-limit key, not an authorization boundary: a caller that
 * reaches the API directly can spoof `X-Forwarded-For`. JWT checks, tenant
 * resolution, HMAC verification, and RLS remain the authoritative controls.
 */
export function clientIp(request: {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}): string {
  const forwarded = request.headers?.["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const firstForwarded =
    typeof forwardedValue === "string"
      ? forwardedValue.split(",")[0]?.trim()
      : undefined;

  if (firstForwarded) return firstForwarded;

  const realIp = request.headers?.["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) return realIp.trim();

  return request.ip || "unknown";
}
