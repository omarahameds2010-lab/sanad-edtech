import { ForbiddenException } from "@nestjs/common";
import { ExecutionContext } from "@nestjs/common";
import { CsrfOriginGuard } from "./csrf-origin.guard";

const guard = new CsrfOriginGuard();

function context(
  headers: Record<string, string | undefined>,
): ExecutionContext {
  const request = { method: "POST", path: "/api/auth/refresh", headers };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function rejection(
  headers: Record<string, string | undefined>,
): ForbiddenException {
  try {
    guard.canActivate(context(headers));
  } catch (err) {
    return err as ForbiddenException;
  }
  throw new Error("expected the guard to reject, but it allowed the request");
}

function originHeader(value: string | undefined) {
  return value === undefined ? {} : { origin: value };
}

function refererHeader(value: string | undefined) {
  return value === undefined ? {} : { referer: value };
}

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  // The platform's real front-end port.
  process.env.ALLOWED_ORIGINS = "http://localhost:3001,https://sanad.app";
  process.env.NODE_ENV = "test";
});

afterAll(() => {
  process.env = originalEnv;
});

describe("CsrfOriginGuard — safe-method exemption", () => {
  it("exempts GET, HEAD and OPTIONS regardless of origin", () => {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      const request = {
        method,
        path: "/api/v1/exams",
        headers: { origin: "https://evil.example" },
      };
      const ctx = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    }
  });

  it("does not exempt PUT, PATCH or DELETE", () => {
    for (const method of ["PUT", "PATCH", "DELETE"]) {
      expect(() =>
        guard.canActivate(
          context({ ...originHeader("https://evil.example"), method } as never),
        ),
      ).toThrow(ForbiddenException);
    }
  });
});

describe("CsrfOriginGuard — Origin verification", () => {
  it("allows the real front-end port", () => {
    expect(
      guard.canActivate(context(originHeader("http://localhost:3001"))),
    ).toBe(true);
  });

  it("allows an allow-listed production origin", () => {
    expect(guard.canActivate(context(originHeader("https://sanad.app")))).toBe(
      true,
    );
  });

  it("blocks an attacker origin", () => {
    const err = rejection(originHeader("https://evil.example"));
    expect(err.getStatus()).toBe(403);
    expect(err.getResponse()).toMatchObject({ code: "ORIGIN_REJECTED" });
  });

  it("blocks a lookalike that merely embeds an allowed origin", () => {
    expect(() =>
      guard.canActivate(
        context(originHeader("https://sanad.app.evil.example")),
      ),
    ).toThrow(ForbiddenException);
  });

  it("blocks an allowed host served from a different port", () => {
    expect(() =>
      guard.canActivate(context(originHeader("http://localhost:9999"))),
    ).toThrow(ForbiddenException);
  });
});

describe("CsrfOriginGuard — Referer fallback", () => {
  it("uses Referer when Origin is absent, and strips the path", () => {
    expect(
      guard.canActivate(
        context(refererHeader("http://localhost:3001/login?next=/api")),
      ),
    ).toBe(true);
  });

  it("blocks a disallowed Referer", () => {
    expect(() =>
      guard.canActivate(
        context(refererHeader("https://evil.example/form.html")),
      ),
    ).toThrow(ForbiddenException);
  });

  it("prefers Origin over Referer when both are present", () => {
    // Origin is trustworthy; a forged Referer must not be able to vouch for it.
    expect(() =>
      guard.canActivate(
        context({
          origin: "https://evil.example",
          referer: "http://localhost:3001/whatever",
        }),
      ),
    ).toThrow(ForbiddenException);

    expect(
      guard.canActivate(
        context({
          origin: "http://localhost:3001",
          referer: "https://evil.example/whatever",
        }),
      ),
    ).toBe(true);
  });

  it("ignores an unparseable Referer instead of crashing", () => {
    expect(() =>
      guard.canActivate(context(refererHeader("not-a-url"))),
    ).toThrow(ForbiddenException);
  });
});

describe("CsrfOriginGuard — non-browser callers", () => {
  it("allows a request with neither Origin nor Referer", () => {
    // curl / server-to-server: no browser, therefore no browser CSRF.
    expect(guard.canActivate(context({}))).toBe(true);
  });
});

describe("CsrfOriginGuard — exemptions", () => {
  it("exempts provider webhooks (HMAC-authenticated, not cookie-authenticated)", () => {
    const request = {
      method: "POST",
      path: "/api/payments/webhooks/paymob",
      headers: { origin: "https://paymob.com" },
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("exempts health endpoints", () => {
    const request = { method: "GET", path: "/api/health", headers: {} };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("does NOT exempt a non-webhook payments path", () => {
    const request = {
      method: "POST",
      path: "/api/payments/intents",
      headers: { origin: "https://evil.example" },
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});

describe("CsrfOriginGuard.allowedOrigins", () => {
  it("honours an explicit ALLOWED_ORIGINS list", () => {
    process.env.ALLOWED_ORIGINS = "https://a.example, https://b.example ";
    expect(CsrfOriginGuard.allowedOrigins()).toEqual([
      "https://a.example",
      "https://b.example",
    ]);
  });

  it("defaults to the real front-end ports when nothing is configured", () => {
    delete process.env.ALLOWED_ORIGINS;
    process.env.NODE_ENV = "development";
    expect(CsrfOriginGuard.allowedOrigins()).toEqual([
      "http://localhost:3001",
      "http://localhost:3000",
    ]);
  });

  it("fails closed in production when nothing is configured", () => {
    delete process.env.ALLOWED_ORIGINS;
    process.env.NODE_ENV = "production";
    expect(CsrfOriginGuard.allowedOrigins()).toEqual([]);
    // ...which means every credentialed cross-origin request is rejected.
    expect(() =>
      guard.canActivate(context(originHeader("http://localhost:3001"))),
    ).toThrow(ForbiddenException);
  });

  it("ignores empty entries from a trailing comma", () => {
    process.env.ALLOWED_ORIGINS = "https://a.example,,https://b.example,";
    expect(CsrfOriginGuard.allowedOrigins()).toEqual([
      "https://a.example",
      "https://b.example",
    ]);
  });
});
