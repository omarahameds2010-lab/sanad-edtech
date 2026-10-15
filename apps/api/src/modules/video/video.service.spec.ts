import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { VideoService } from "./video.service";

describe("VideoService.attachYouTubeVideo", () => {
  let service: VideoService;
  let prisma: any;
  let audit: any;

  beforeEach(() => {
    prisma = {
      lesson: { findFirst: jest.fn() },
      video: {
        findFirst: jest.fn(),
        create: jest.fn(({ data }: any) =>
          Promise.resolve({ id: "v1", ...data }),
        ),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new VideoService(
      prisma,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      audit,
      {} as any,
    );
    prisma.lesson.findFirst.mockResolvedValue({ id: "l1" });
    prisma.video.findFirst.mockResolvedValue(null);
  });

  it("creates a READY youtube row", async () => {
    const result = await service.attachYouTubeVideo("t1", "u1", {
      lessonId: "l1",
      title: "Intro",
      providerVideoId: "dQw4w9WgXcQ",
    });

    expect(prisma.video.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: "youtube",
          providerVideoId: "dQw4w9WgXcQ",
          status: "READY",
        }),
      }),
    );
    expect(result.id).toBe("v1");
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "VIDEO_YOUTUBE_ATTACHED" }),
    );
  });

  it("throws NotFoundException for unknown lessons", async () => {
    prisma.lesson.findFirst.mockResolvedValue(null);
    await expect(
      service.attachYouTubeVideo("t1", "u1", {
        lessonId: "nope",
        title: "x",
        providerVideoId: "dQw4w9WgXcQ",
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("rejects malformed video ids and duplicates", async () => {
    await expect(
      service.attachYouTubeVideo("t1", "u1", {
        lessonId: "l1",
        title: "x",
        providerVideoId: "not a valid id!!!",
      }),
    ).rejects.toThrow(BadRequestException);

    prisma.video.findFirst.mockResolvedValue({ id: "v0" });
    await expect(
      service.attachYouTubeVideo("t1", "u1", {
        lessonId: "l1",
        title: "x",
        providerVideoId: "dQw4w9WgXcQ",
      }),
    ).rejects.toThrow(ConflictException);
  });
});
