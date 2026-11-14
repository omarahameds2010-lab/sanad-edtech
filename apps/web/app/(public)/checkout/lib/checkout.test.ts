import { describe, expect, it } from "vitest";
import {
  checkoutErrorMessage,
  createCheckoutKey,
  isPaidPrice,
  priceToMinor,
} from "./checkout";

describe("priceToMinor", () => {
  it("converts EGP major units to integer piastres", () => {
    expect(priceToMinor(199)).toBe(19900);
    expect(priceToMinor("199.5")).toBe(19950);
    expect(priceToMinor("0.01")).toBe(1);
  });

  it("never returns a negative or NaN charge", () => {
    expect(priceToMinor(-10)).toBe(0);
    expect(priceToMinor("not-a-price")).toBe(0);
  });
});

describe("isPaidPrice", () => {
  it("treats zero, blank and invalid prices as free", () => {
    expect(isPaidPrice(0)).toBe(false);
    expect(isPaidPrice("0.00")).toBe(false);
    expect(isPaidPrice("")).toBe(false);
  });

  it("treats any positive price as paid", () => {
    expect(isPaidPrice("199.00")).toBe(true);
  });
});

describe("checkoutErrorMessage", () => {
  it("localizes known voucher codes", () => {
    expect(checkoutErrorMessage(400, "VOUCHER_NOT_FOUND")).toContain(
      "الكود غير صحيح",
    );
    expect(checkoutErrorMessage(400, "VOUCHER_COURSE_MISMATCH")).toContain(
      "مش مخصص",
    );
  });

  it("explains the paid-course gate and expired sessions", () => {
    expect(checkoutErrorMessage(402)).toContain("مدفوع");
    expect(checkoutErrorMessage(401)).toContain("الجلسة انتهت");
  });

  it("falls back to a human message, never an empty error", () => {
    expect(checkoutErrorMessage(500, undefined, undefined)).toContain(
      "تعذر إتمام الدفع",
    );
    expect(checkoutErrorMessage(500, undefined, "Server exploded")).toBe(
      "Server exploded",
    );
  });
});

describe("createCheckoutKey", () => {
  it("returns a non-empty unique key", () => {
    const first = createCheckoutKey();
    const second = createCheckoutKey();
    expect(first.length).toBeGreaterThan(0);
    expect(first).not.toBe(second);
  });
});
