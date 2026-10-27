import { ForbiddenException } from "@nestjs/common";
import { assertLessonAccessible } from "./lesson-access";

describe("assertLessonAccessible", () => {
  const prisma = {
    studentLessonUnlock: { findFirst: jest.fn() },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows an unlocked lesson without querying grants", async () => {
    await expect(
      assertLessonAccessible(prisma, "tenant1", "user1", {
        id: "lesson1",
        lockStatus: "UNLOCKED",
      }),
    ).resolves.toBeUndefined();

    expect(prisma.studentLessonUnlock.findFirst).not.toHaveBeenCalled();
  });

  it("rejects a locked lesson without a per-student grant", async () => {
    prisma.studentLessonUnlock.findFirst.mockResolvedValue(null);

    await expect(
      assertLessonAccessible(prisma, "tenant1", "user1", {
        id: "lesson1",
        lockStatus: "LOCKED",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows a locked lesson once the student has a grant", async () => {
    prisma.studentLessonUnlock.findFirst.mockResolvedValue({ id: "grant1" });

    await expect(
      assertLessonAccessible(prisma, "tenant1", "user1", {
        id: "lesson1",
        lockStatus: "LOCKED",
      }),
    ).resolves.toBeUndefined();
  });
});
