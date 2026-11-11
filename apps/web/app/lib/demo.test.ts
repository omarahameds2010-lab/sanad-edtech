import { describe, expect, it } from "vitest";
import { DEMO_ACCOUNTS, DEMO_FILM_URL, DEMO_QR_SRC, DEMO_ROUTE } from "./demo";

const EGYPTIAN_PHONE = /^01[0125][0-9]{8}$/;

describe("demo access", () => {
  it("ships valid Egyptian phone numbers for both seeded roles", () => {
    expect(DEMO_ACCOUNTS.student.phone).toMatch(EGYPTIAN_PHONE);
    expect(DEMO_ACCOUNTS.teacher.phone).toMatch(EGYPTIAN_PHONE);
  });

  it("keeps distinct student and teacher accounts", () => {
    expect(DEMO_ACCOUNTS.student.phone).not.toBe(DEMO_ACCOUNTS.teacher.phone);
  });

  it("points at the founder film and the local QR asset", () => {
    expect(DEMO_FILM_URL).toContain("drive.google.com");
    expect(DEMO_ROUTE).toBe("/demo");
    expect(DEMO_QR_SRC).toBe("/demo-qr.png");
  });
});
