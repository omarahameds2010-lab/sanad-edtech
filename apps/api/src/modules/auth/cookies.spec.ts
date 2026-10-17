import {
  COOKIE_NAMES,
  accessCookieOptions,
  refreshCookieOptions,
  setAuthCookies,
  clearAuthCookies,
  readRefreshToken,
  readAccessToken,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  cookieSecure,
  cookieSameSite,
} from "./cookies";

type Options = Record<string, unknown>;

function fakeResponse() {
  const cookies: Array<{ name: string; value: string; options: Options }> = [];
  const cleared: Array<{ name: string; options: Options }> = [];
  return {
    cookies,
    cleared,
    res: {
      cookie(name: string, value: string, options: Options) {
        cookies.push({ name, value, options });
      },
      clearCookie(name: string, options: Options) {
        cleared.push({ name, options });
      },
    } as never,
  };
}

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.COOKIE_SAMESITE;
  delete process.env.COOKIE_SECURE;
});

afterAll(() => {
  process.env = originalEnv;
});

describe("cookie policy defaults", () => {
  it("uses the locked cookie names", () => {
    // The spec locks the refresh cookie name to lp_refresh.
    expect(COOKIE_NAMES.access).toBe("lp_access");
    expect(COOKIE_NAMES.refresh).toBe("lp_refresh");
  });

  it("defaults to HttpOnly + Secure + SameSite=Strict", () => {
    const opts = accessCookieOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.secure).toBe(true);
    expect(opts.sameSite).toBe("strict");
  });

  it("scopes both cookies to /api so they are never sent for assets", () => {
    expect(accessCookieOptions().path).toBe("/api");
    expect(refreshCookieOptions().path).toBe("/api");
  });

  it("gives the access token 15 minutes and the refresh token 7 days", () => {
    expect(ACCESS_TOKEN_MAX_AGE_SECONDS).toBe(15 * 60);
    expect(REFRESH_TOKEN_MAX_AGE_SECONDS).toBe(7 * 24 * 60 * 60);
    expect(accessCookieOptions().maxAge).toBe(
      ACCESS_TOKEN_MAX_AGE_SECONDS * 1000,
    );
    expect(refreshCookieOptions().maxAge).toBe(
      REFRESH_TOKEN_MAX_AGE_SECONDS * 1000,
    );
  });

  it("does not set a Domain, keeping the cookie host-only", () => {
    expect(accessCookieOptions().domain).toBeUndefined();
  });
});

describe("environment overrides", () => {
  it("allows relaxing SameSite for the off-site payment redirect flow", () => {
    process.env.COOKIE_SAMESITE = "lax";
    expect(cookieSameSite()).toBe("lax");
    expect(accessCookieOptions().sameSite).toBe("lax");
  });

  it("ignores an unknown SameSite value instead of trusting it", () => {
    process.env.COOKIE_SAMESITE = "bogus";
    expect(cookieSameSite()).toBe("strict");
  });

  it("allows disabling Secure only via an explicit opt-out", () => {
    process.env.COOKIE_SECURE = "false";
    expect(cookieSecure()).toBe(false);
  });

  it("keeps Secure on when the variable is anything else", () => {
    process.env.COOKIE_SECURE = "no";
    expect(cookieSecure()).toBe(true);
  });

  it("refuses the sameSite=none + insecure combination rather than emit a cookie the browser will drop", () => {
    process.env.COOKIE_SAMESITE = "none";
    process.env.COOKIE_SECURE = "false";
    expect(() => accessCookieOptions()).toThrow(
      /sameSite=none requires secure=true/,
    );
  });
});

describe("setAuthCookies", () => {
  it("emits both cookies and nothing else", () => {
    const { res, cookies } = fakeResponse();
    setAuthCookies(res, { accessToken: "at", refreshToken: "rt" });

    expect(cookies).toHaveLength(2);
    expect(cookies.map((c) => c.name)).toEqual([
      COOKIE_NAMES.access,
      COOKIE_NAMES.refresh,
    ]);
    expect(cookies.every((c) => c.options.httpOnly === true)).toBe(true);
    // The refresh token must never be readable by page JavaScript.
    expect(cookies[1].options.httpOnly).toBe(true);
  });
});

describe("clearAuthCookies", () => {
  it("repeats the SAME attributes, or the browser keeps the original cookie", () => {
    const { res, cleared } = fakeResponse();
    clearAuthCookies(res);

    expect(cleared.map((c) => c.name)).toEqual([
      COOKIE_NAMES.access,
      COOKIE_NAMES.refresh,
    ]);
    for (const entry of cleared) {
      expect(entry.options.path).toBe("/api");
      expect(entry.options.httpOnly).toBe(true);
      expect(entry.options.secure).toBe(true);
      expect(entry.options.sameSite).toBe("strict");
    }
  });
});

describe("readers", () => {
  it("reads the refresh token out of the cookie jar only", () => {
    const req = { cookies: { [COOKIE_NAMES.refresh]: "rt" } } as never;
    expect(readRefreshToken(req)).toBe("rt");
  });

  it("reads the access token out of the cookie jar only", () => {
    const req = { cookies: { [COOKIE_NAMES.access]: "at" } } as never;
    expect(readAccessToken(req)).toBe("at");
  });

  it("returns null for a missing, empty or non-string cookie", () => {
    expect(readRefreshToken({} as never)).toBeNull();
    expect(readRefreshToken({ cookies: {} } as never)).toBeNull();
    expect(
      readRefreshToken({ cookies: { [COOKIE_NAMES.refresh]: "" } } as never),
    ).toBeNull();
    expect(
      readRefreshToken({ cookies: { [COOKIE_NAMES.refresh]: 42 } } as never),
    ).toBeNull();
  });
});
