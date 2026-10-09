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
          const row = { id: `ent-${data.resourceType}-${data.resourceId}`, ...data };
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
});
