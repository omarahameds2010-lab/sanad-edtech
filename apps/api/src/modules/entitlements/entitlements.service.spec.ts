import { EntitlementsService } from "./entitlements.service";

describe("EntitlementsService.grantCourseEntitlement", () => {
  let service: EntitlementsService;
  let prisma: any;
  let created: any[];

  beforeEach(() => {
    created = [];
    prisma = {
      lesson: { findMany: jest.fn().mockResolvedValue([{ id: "l1" }]) },
      exam: { findMany: jest.fn().mockResolvedValue([{ id: "e1" }]) },
      assignment: { findMany: jest.fn().mockResolvedValue([{ id: "a1" }]) },
      entitlement: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(({ data }: any) => {
          const row = {
            id: `ent-${data.resourceType}-${data.resourceId}`,
            ...data,
          };
          created.push(row);
          return Promise.resolve(row);
        }),
      },
    };
    service = new EntitlementsService(prisma);
  });

  it("fans out to course, lessons, exams AND assignments", async () => {
    const result = await service.grantCourseEntitlement(
      "t1",
      "u1",
      "c1",
      "admin_grant",
    );

    const types = result.map((e) => `${e.resourceType}:${e.resourceId}`);
    expect(types).toContain("course:c1");
    expect(types).toContain("lesson:l1");
    expect(types).toContain("exam:e1");
    expect(types).toContain("assignment:a1");
  });

  it("runs every read and write through the caller's transaction when one is provided", async () => {
    const tx = {
      lesson: { findMany: jest.fn().mockResolvedValue([{ id: "l1" }]) },
      exam: { findMany: jest.fn().mockResolvedValue([{ id: "e1" }]) },
      assignment: { findMany: jest.fn().mockResolvedValue([{ id: "a1" }]) },
      entitlement: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(({ data }: any) =>
          Promise.resolve({ id: `tx-${data.resourceType}`, ...data }),
        ),
      },
    };

    const result = await service.grantCourseEntitlement(
      "t1",
      "u1",
      "c1",
      "purchase",
      undefined,
      tx as any,
    );

    expect(result.map((e) => e.resourceType)).toEqual([
      "course",
      "lesson",
      "exam",
      "assignment",
    ]);
    expect(tx.entitlement.create).toHaveBeenCalledTimes(4);
    expect(prisma.entitlement.create).not.toHaveBeenCalled();
    expect(prisma.lesson.findMany).not.toHaveBeenCalled();
  });
});
