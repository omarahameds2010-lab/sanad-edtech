import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  let service: ProgressService;
  let prisma: any;

  const tenantId = 'tenant1';
  const userId = 'user1';

  beforeEach(() => {
    prisma = {
      lesson: { findFirst: jest.fn(), findMany: jest.fn() },
      enrollment: { findFirst: jest.fn() },
      lessonProgress: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
    };
    service = new ProgressService(prisma);
  });

  describe('updateProgress', () => {
    it('throws BadRequestException on negative position', async () => {
      await expect(
        service.updateProgress(tenantId, userId, 'l1', { positionSeconds: -5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('caps position at lesson duration', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 'l1', isFree: false, duration: 600, section: { courseId: 'c1' } });
      prisma.enrollment.findFirst.mockResolvedValue({ id: 'e1' });
      prisma.lessonProgress.findUnique.mockResolvedValue(null);
      prisma.lessonProgress.upsert.mockImplementation((args: any) =>
        Promise.resolve({ lessonId: 'l1', watchedSeconds: args.create.watchedSeconds, lastPosition: args.create.lastPosition, completedAt: null }),
      );

      const result = await service.updateProgress(tenantId, userId, 'l1', { positionSeconds: 999 });

      expect(prisma.lessonProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ lastPosition: 600 }),
          update: expect.objectContaining({ lastPosition: 600 }),
        }),
      );
      expect(result.lastPosition).toBe(600);
    });

    it('never decreases watchedSeconds (monotonic)', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 'l1', isFree: false, duration: 600, section: { courseId: 'c1' } });
      prisma.enrollment.findFirst.mockResolvedValue({ id: 'e1' });
      prisma.lessonProgress.findUnique.mockResolvedValue({ watchedSeconds: 120 });
      prisma.lessonProgress.upsert.mockImplementation((args: any) =>
        Promise.resolve({ lessonId: 'l1', watchedSeconds: args.update.watchedSeconds, lastPosition: args.update.lastPosition, completedAt: null }),
      );

      const result = await service.updateProgress(tenantId, userId, 'l1', { positionSeconds: 50, watchedSeconds: 30 });

      expect(prisma.lessonProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ watchedSeconds: 120 }),
        }),
      );
      expect(result.watchedSeconds).toBe(120);
    });

    it('throws ForbiddenException when not enrolled', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 'l1', isFree: false, section: { courseId: 'c1' } });
      prisma.enrollment.findFirst.mockResolvedValue(null);
      await expect(service.updateProgress(tenantId, userId, 'l1', { positionSeconds: 10 })).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when lesson missing', async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);
      await expect(service.updateProgress(tenantId, userId, 'l1', { positionSeconds: 10 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCourseProgress', () => {
    it('computes progressPercent from completed lessons', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({ id: 'e1' });
      prisma.lesson.findMany.mockResolvedValue([{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }, { id: 'l4' }]);
      prisma.lessonProgress.findMany.mockResolvedValue([
        { lessonId: 'l1', watchedSeconds: 100, completedAt: new Date(), updatedAt: new Date() },
        { lessonId: 'l2', watchedSeconds: 200, completedAt: new Date(), updatedAt: new Date() },
        { lessonId: 'l3', watchedSeconds: 50, completedAt: null, updatedAt: new Date() },
      ]);

      const result = await service.getCourseProgress(tenantId, userId, 'c1');

      expect(result.totalLessons).toBe(4);
      expect(result.completedLessons).toBe(2);
      expect(result.progressPercent).toBe(50);
      expect(result.totalWatchedSeconds).toBe(350);
      expect(result.completed).toBe(false);
    });

    it('returns 0 percent when no lessons', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({ id: 'e1' });
      prisma.lesson.findMany.mockResolvedValue([]);
      prisma.lessonProgress.findMany.mockResolvedValue([]);

      const result = await service.getCourseProgress(tenantId, userId, 'c1');
      expect(result.progressPercent).toBe(0);
    });
  });

  describe('completeLesson', () => {
    it('marks lesson completed and returns completed true', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 'l1', isFree: true, section: { courseId: 'c1' } });
      prisma.lessonProgress.upsert.mockResolvedValue({ lessonId: 'l1', watchedSeconds: 300, lastPosition: 600, completedAt: new Date() });

      const result = await service.completeLesson(tenantId, userId, 'l1');
      expect(result.completed).toBe(true);
      expect(prisma.lessonProgress.upsert).toHaveBeenCalled();
    });
  });

  describe('getLessonProgress', () => {
    it('returns zero-state when no progress yet', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 'l1', isFree: true, section: { courseId: 'c1' } });
      prisma.lessonProgress.findUnique.mockResolvedValue(null);

      const result = await service.getLessonProgress(tenantId, userId, 'l1');
      expect(result).toEqual({ lessonId: 'l1', watchedSeconds: 0, lastPosition: null, completed: false, completedAt: null });
    });
  });
});
