import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../tenants/prisma.service";
import { applyTenantContext } from "../../../common/prisma/tenant-context";

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  async createSection(
    tenantId: string,
    courseId: string,
    dto: { title: string; orderIndex?: number },
  ) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId },
    });
    if (!course) throw new NotFoundException("Course not found");

    let orderIndex = dto.orderIndex;
    if (orderIndex === undefined || orderIndex === null) {
      const max = await this.prisma.section.aggregate({
        where: { courseId, tenantId },
        _max: { orderIndex: true },
      });
      orderIndex = (max._max.orderIndex ?? 0) + 1;
    } else {
      const existing = await this.prisma.section.findFirst({
        where: { courseId, tenantId, orderIndex },
      });
      if (existing)
        throw new ConflictException("orderIndex already used in this course");
    }

    return this.prisma.section.create({
      data: { tenantId, courseId, title: dto.title, orderIndex },
    });
  }

  async listSections(tenantId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId },
    });
    if (!course) throw new NotFoundException("Course not found");

    return this.prisma.section.findMany({
      where: { courseId, tenantId },
      orderBy: { orderIndex: "asc" },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            type: true,
            orderIndex: true,
            status: true,
          },
        },
      },
    });
  }

  async getSection(tenantId: string, sectionId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, tenantId },
    });
    if (!section) throw new NotFoundException("Section not found");
    return section;
  }

  async updateSection(
    tenantId: string,
    sectionId: string,
    dto: { title?: string; orderIndex?: number },
  ) {
    await this.getSection(tenantId, sectionId);
    return this.prisma.section.update({
      where: { id: sectionId },
      data: { title: dto.title, orderIndex: dto.orderIndex },
    });
  }

  async deleteSection(tenantId: string, sectionId: string) {
    await this.getSection(tenantId, sectionId);
    await this.prisma.section.delete({ where: { id: sectionId } });
    return { success: true };
  }

  async reorderSections(
    tenantId: string,
    courseId: string,
    items: { id: string; position: number }[],
  ) {
    // Verify all sections belong to this course and tenant
    const sections = await this.prisma.section.findMany({
      where: { courseId, tenantId },
    });
    const sectionIds = new Set(sections.map((s) => s.id));

    for (const item of items) {
      if (!sectionIds.has(item.id)) {
        throw new BadRequestException(
          `Section ${item.id} does not belong to this course`,
        );
      }
    }

    // Atomic reorder in one transaction, with the tenant context set for
    // RLS (interactive tx clients are not auto-wrapped by PrismaService).
    await this.prisma.$transaction(async (tx) => {
      await applyTenantContext(tx, tenantId);
      for (const item of items) {
        await tx.section.update({
          where: { id: item.id },
          data: { orderIndex: item.position },
        });
      }
    });

    return this.listSections(tenantId, courseId);
  }
}
