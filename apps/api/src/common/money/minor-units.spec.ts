import { BadRequestException } from "@nestjs/common";
import { toBigIntMinor } from "./minor-units";

describe("toBigIntMinor (bundle A)", () => {
  it("passes bigint through untouched", () => {
    expect(toBigIntMinor(29900n, "x")).toBe(29900n);
  });

  it("accepts safe integers — what JSON numbers really are", () => {
    expect(toBigIntMinor(29900, "x")).toBe(29900n);
  });

  it("accepts digit strings", () => {
    expect(toBigIntMinor("29900", "x")).toBe(29900n);
  });

  it("rejects floats", () => {
    expect(() => toBigIntMinor(299.5, "x")).toThrow(BadRequestException);
  });

  it("rejects garbage strings", () => {
    expect(() => toBigIntMinor("29,900", "x")).toThrow(BadRequestException);
    expect(() => toBigIntMinor("abc", "x")).toThrow(BadRequestException);
  });

  it("rejects null/undefined", () => {
    expect(() => toBigIntMinor(undefined, "x")).toThrow(BadRequestException);
    expect(() => toBigIntMinor(null, "x")).toThrow(BadRequestException);
  });
});
