import { clientIp } from "./client-ip";

describe("clientIp", () => {
  it("prefers the first X-Forwarded-For address", () => {
    expect(
      clientIp({
        ip: "10.0.0.5",
        headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.5" },
      }),
    ).toBe("203.0.113.7");
  });

  it("handles the array form of X-Forwarded-For", () => {
    expect(
      clientIp({
        headers: { "x-forwarded-for": ["198.51.100.4, 10.0.0.5"] },
      }),
    ).toBe("198.51.100.4");
  });

  it("falls back to X-Real-IP", () => {
    expect(
      clientIp({
        headers: { "x-real-ip": "192.0.2.9" },
      }),
    ).toBe("192.0.2.9");
  });

  it("falls back to the socket address", () => {
    expect(clientIp({ ip: "127.0.0.1", headers: {} })).toBe("127.0.0.1");
  });

  it("returns a stable key when no address is available", () => {
    expect(clientIp({ headers: {} })).toBe("unknown");
  });
});
