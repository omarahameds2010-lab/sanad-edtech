import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { LessonsService } from './lessons.service';

describe('LessonsService', () => {
  let service: LessonsService;
  let prisma: any;

  const tenantId = 'tenant1';
  const userId = 'user1';

  beforeEach(() => {
    prisma = {
      section: { findFirst: jest.fn() },
      lesson: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        aggregate: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      enrollment: { findFirst: jest.fn() },
      $transaction: jest.fn((ops: any) => Promise.all(ops)),
    };
    service = new LessonsService(prisma);
  });

  describe('createLesson', () => {
    it('throws NotFoundException if section not found', async () => {
      prisma.section.findFirst.mockResolvedValue(null);
      await expect(service.createLesson(tenantId, 'sec1', { title: 'L', type: 'VIDEO' as any })).rejects.toThrow(NotFoundException);
    });

    it('creates lesson with slug and auto orderIndex', async () => {
      prisma.section.findFirst.mockResolvedValue({ id: 'sec1' });
      prisma.lesson.aggregate.mockResolvedValue({ _max: { orderIndex: 0 } });
      prisma.lesson.create.mockImplementation((args: any) => Promise.resolve({ id: 'l1', ...args.data }));

      const result = await service.createLesson(tenantId, 'sec1', { title: 'Intro Video', type: 'VIDEO' as any });

      expect(prisma.lesson.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orderIndex: 1, slug: expect.stringContaining('intro-video') }),
        }),
      );
      expect(result.slug).toContain('intro-video');
    });
  });

  describe('publishLesson', () => {
    it('is idempotent when already published', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 'l1', status: 'PUBLISHED' });
      const result = await service.publishLesson(tenantId, 'l1');
      expect(result.status).toBe('PUBLISHED');
      expect(prisma.lesson.update).not.toHaveBeenCalled();
    });

    it('publishes a draft lesson', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 'l1', status: 'DRAFT' });
      prisma.lesson.update.mockResolvedValue({ id: 'l1', status: 'PUBLISHED' });
      const result = await service.publishLesson(tenantId, 'l1');
      expect(result.status).toBe('PUBLISHED');
    });
  });

  describe('getStudentLesson', () => {
    it('throws NotFoundException when lesson does not exist', async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);
      await expect(service.getStudentLesson(tenantId, userId, 'l1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when not enrolled and not free', async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        id: 'l1', isFree: false, section: { courseId: 'c1' }, assignment: null, exam: null,
        lockStatus: 'UNLOCKED', unlockType: 'NONE',
      });
      prisma.enrollment.findFirst.mockResolvedValue(null);
      await expect(service.getStudentLesson(tenantId, userId, 'l1')).rejects.toThrow(ForbiddenException);
    });

    it('returns lesson access state for enrolled student', async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        id: 'l1', title: 'L1', type: 'VIDEO', isFree: false, section: { courseId: 'c1' },
        assignment: null, exam: null, lockStatus: 'LOCKED', unlockType: 'ENTER_ASSIGNMENT',
        description: null, duration: 600, orderIndex: 1, status: 'PUBLISHED',
      });
      prisma.enrollment.findFirst.mockResolvedValue({ id: 'e1' });

      const result = await service.getStudentLesson(tenantId, userId, 'l1');

      expect(result.access.isLocked).toBe(true);
      expect(result.access.unlockType).toBe('ENTER_ASSIGNMENT');
      expect(result.lesson.title).toBe('L1');
    });

    it('allows access to free lesson without enrollment', async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        id: 'l1', title: 'Preview', type: 'VIDEO', isFree: true, section: { courseId: 'c1' },
        assignment: null, exam: null, lockStatus: 'UNLOCKED', unlockType: 'NONE',
        description: null, duration: 300, orderIndex: 1, status: 'PUBLISHED',
      });
      prisma.enrollment.findFirst.mockResolvedValue(null);

      const result = await service.getStudentLesson(tenantId, userId, 'l1');
      expect(result.lesson.title).toBe('Preview');
    });
  });

  describe('reorderLessons', () => {
    it('throws when lesson does not belong to section', async () => {
      prisma.lesson.findMany.mockResolvedValue([{ id: 'l1' }]);
      await expect(service.reorderLessons(tenantId, 'sec1', [{ id: 'l_other', position: 1 }])).rejects.toThrow();
    });
  });
});
