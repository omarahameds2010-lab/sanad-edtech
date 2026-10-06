import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../tenants/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async enroll(tenantId: string, userId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId },
    });

    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'PUBLISHED') {
      throw new BadRequestException('Course is not available for enrollment');
    }

    const existing = await this.prisma.enrollment.findFirst({
      where: { tenantId, userId, courseId, status: 'ACTIVE' },
    });

    if (existing) {
      throw new ConflictException('Already enrolled in this course');
    }

    return this.prisma.enrollment.create({
      data: {
        tenantId,
        userId,
        courseId,
        status: 'ACTIVE',
        source: 'student',
        startsAt: new Date(),
      },
    });
  }

  async listEnrollments(tenantId: string, userId: string, status?: string) {
    const where: any = { tenantId, userId };
    if (status) where.status = status;

    return this.prisma.enrollment.findMany({
      where,
      include: { course: { select: { id: true, title: true, slug: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEnrollment(tenantId: string, userId: string, enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, tenantId, userId },
      include: { course: { select: { id: true, title: true, slug: true, status: true } } },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  async cancelEnrollment(tenantId: string, userId: string, enrollmentId: string) {
    const enrollment = await this.getEnrollment(tenantId, userId, enrollmentId);

    if (enrollment.status !== 'ACTIVE') {
      throw new BadRequestException('Only active enrollments can be cancelled');
    }

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'CANCELLED' },
    });
  }

  async suspendEnrollment(tenantId: string, enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({ where: { id: enrollmentId, tenantId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.status !== 'ACTIVE') throw new BadRequestException('Only active enrollments can be suspended');

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'EXPIRED' },
    });
  }

  async reactivateEnrollment(tenantId: string, enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({ where: { id: enrollmentId, tenantId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.status === 'ACTIVE') return enrollment;

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'ACTIVE' },
    });
  }
}
