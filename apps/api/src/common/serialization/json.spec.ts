import { patchBigIntSerialization, stableStringify } from "./json";

describe("json helpers (BigInt safety — bundle A)", () => {
  beforeAll(() => {
    patchBigIntSerialization();
  });

  it("serializes BigInt values as decimal strings", () => {
    expect(JSON.stringify({ totalMinor: 29900n })).toBe(
      '{"totalMinor":"29900"}',
    );
  });

  it("patching is idempotent", () => {
    const first = (BigInt.prototype as any).toJSON;
    patchBigIntSerialization();
    expect((BigInt.prototype as any).toJSON).toBe(first);
  });

  it("stableStringify sorts object keys and handles nested BigInt", () => {
    const a = stableStringify({ b: 2n, a: { d: [1n, "x"], c: null } });
    const b = stableStringify({ a: { c: null, d: [1n, "x"] }, b: 2n });
    expect(a).toBe(b);
    expect(a).toContain('"2"');
    expect(a).toContain('"1"');
  });

  it("stableStringify output stays valid JSON (round-trips)", () => {
    const out = stableStringify({ amountMinor: 1000n, nested: { z: 1 } });
    expect(JSON.parse(out)).toEqual({
      amountMinor: "1000",
      nested: { z: 1 },
    });
  });

  it("stableStringify skips undefined object values like JSON.stringify", () => {
    expect(stableStringify({ a: undefined, b: 1 })).toBe('{"b":1}');
  });
});
