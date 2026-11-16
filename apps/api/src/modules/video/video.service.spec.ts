import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
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

describe("VideoService.handleProviderWebhook", () => {
  let service: VideoService;
  let prisma: any;
  let provider: any;
  let registry: any;
  let audit: any;
  let outbox: any;

  const body = (payload: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(payload));

  beforeEach(() => {
    prisma = {
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      video: {
        findFirst: jest.fn(),
        update: jest.fn(({ data }: any) =>
          Promise.resolve({ id: "v1", ...data }),
        ),
      },
    };
    prisma.$transaction = jest.fn((fn: any) => fn(prisma));
    provider = { verifyWebhook: jest.fn().mockResolvedValue(true) };
    registry = { getProvider: jest.fn().mockReturnValue(provider) };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    outbox = { publish: jest.fn().mockResolvedValue(undefined) };

    service = new VideoService(
      prisma,
      {} as any,
      registry,
      {} as any,
      {} as any,
      audit,
      outbox,
    );

    prisma.video.findFirst.mockResolvedValue({
      id: "v1",
      tenantId: "t1",
      providerVideoId: "pv1",
      status: "PROCESSING",
    });
  });

  it("verifies the raw bytes and applies a finished callback", async () => {
    const raw = body({
      VideoGuid: "pv1",
      Status: 2,
      Length: 120,
      Width: 1920,
      Height: 1080,
    });

    const result = await service.handleProviderWebhook(
      "bunny-stream",
      "t1",
      raw,
      { "x-bunny-signature": "sig" },
    );

    expect(provider.verifyWebhook).toHaveBeenCalledWith(raw, {
      "x-bunny-signature": "sig",
    });
    expect(prisma.video.findFirst).toHaveBeenCalledWith({
      where: { tenantId: "t1", providerVideoId: "pv1" },
    });
    expect(prisma.video.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "v1" },
        data: expect.objectContaining({
          status: "READY",
          duration: 120,
          width: 1920,
          height: 1080,
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "VIDEO_WEBHOOK_PROCESSED" }),
    );
    expect(outbox.publish).toHaveBeenCalledWith(
      "t1",
      expect.objectContaining({ eventType: "video.processing.completed" }),
      expect.anything(),
    );
    expect(result).toMatchObject({
      received: true,
      matched: true,
      videoId: "v1",
      status: "READY",
    });
  });

  it("rejects an invalid signature before reading or writing the database", async () => {
    provider.verifyWebhook.mockResolvedValue(false);

    await expect(
      service.handleProviderWebhook(
        "bunny-stream",
        "t1",
        body({ VideoGuid: "pv1", Status: 2 }),
        { "x-bunny-signature": "wrong" },
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(prisma.video.findFirst).not.toHaveBeenCalled();
    expect(prisma.video.update).not.toHaveBeenCalled();
  });

  it("acknowledges an unknown video without writing", async () => {
    prisma.video.findFirst.mockResolvedValue(null);

    const result = await service.handleProviderWebhook(
      "bunny-stream",
      "t1",
      body({ VideoGuid: "pv-missing", Status: 2 }),
      {},
    );

    expect(result).toEqual({
      received: true,
      matched: false,
      ignored: "VIDEO_NOT_FOUND",
    });
    expect(prisma.video.update).not.toHaveBeenCalled();
  });

  it("does not move a READY video back to PROCESSING", async () => {
    prisma.video.findFirst.mockResolvedValue({
      id: "v1",
      tenantId: "t1",
      providerVideoId: "pv1",
      status: "READY",
    });

    const result = await service.handleProviderWebhook(
      "bunny-stream",
      "t1",
      body({ VideoGuid: "pv1", Status: 1 }),
      {},
    );

    expect(result).toMatchObject({ matched: true, ignored: "STALE_STATUS" });
    expect(prisma.video.update).not.toHaveBeenCalled();
  });

  it("treats a repeated same-status callback as a duplicate", async () => {
    const result = await service.handleProviderWebhook(
      "bunny-stream",
      "t1",
      body({ VideoGuid: "pv1", Status: 1 }),
      {},
    );

    expect(result).toMatchObject({ matched: true, duplicate: true });
    expect(prisma.video.update).not.toHaveBeenCalled();
    expect(outbox.publish).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and missing raw bodies", async () => {
    await expect(
      service.handleProviderWebhook(
        "bunny-stream",
        "t1",
        Buffer.from("not-json"),
        {},
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.handleProviderWebhook("bunny-stream", "t1", undefined, {}),
    ).rejects.toThrow(BadRequestException);
  });
});
