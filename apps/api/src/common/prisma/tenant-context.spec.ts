import {
  applyTenantContext,
  getTenantId,
  runWithTenantId,
} from "./tenant-context";

describe("tenant-context storage", () => {
  it("returns undefined outside any request context", () => {
    expect(getTenantId()).toBeUndefined();
  });

  it("propagates through async work started inside run()", async () => {
    await runWithTenantId("tenant-1", async () => {
      expect(getTenantId()).toBe("tenant-1");
      await Promise.resolve();
      expect(getTenantId()).toBe("tenant-1");
      await new Promise((r) => setTimeout(r, 5));
      expect(getTenantId()).toBe("tenant-1");
    });

    expect(getTenantId()).toBeUndefined();
  });

  it("supports nesting and restores the outer context", () => {
    runWithTenantId("outer", () => {
      expect(getTenantId()).toBe("outer");
      runWithTenantId("inner", () => {
        expect(getTenantId()).toBe("inner");
      });
      expect(getTenantId()).toBe("outer");
    });
  });

  it("does not leak across concurrent async flows", async () => {
    const results = await Promise.all([
      runWithTenantId("tenant-a", async () => {
        await new Promise((r) => setTimeout(r, 15));
        return getTenantId();
      }),
      runWithTenantId("tenant-b", async () => {
        await new Promise((r) => setTimeout(r, 5));
        return getTenantId();
      }),
    ]);

    expect(results).toEqual(["tenant-a", "tenant-b"]);
  });

  it("applyTenantContext sets a transaction-local config with a bound value", async () => {
    const calls: unknown[][] = [];
    const tx = {
      $executeRawUnsafe: async (...args: unknown[]) => {
        calls.push(args);
        return 1;
      },
    };

    await applyTenantContext(tx, "tenant-9");

    expect(calls).toHaveLength(1);
    expect(String(calls[0][0])).toContain("set_config('app.tenant_id'");
    expect(String(calls[0][0])).toContain("true");
    expect(calls[0][1]).toBe("tenant-9");
  });
});
