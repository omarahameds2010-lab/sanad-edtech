import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../tenants/prisma.service';
import * as crypto from 'crypto';

export type ResourceType = 'PDF' | 'FILE' | 'LINK';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  async createResource(
    tenantId: string,
    lessonId: string,
    dto: {
      title: string;
      type: ResourceType;
      assetId?: string;
      url?: string;
      mimeType?: string;
      size?: number;
      position?: number;
      downloadable?: boolean;
    },
  ) {
    const lesson = await this.prisma.lesson.findFirst({ where: { id: lessonId, tenantId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    if ((dto.type === 'PDF' || dto.type === 'FILE') && !dto.assetId) {
      throw new BadRequestException(`assetId is required for ${dto.type} resources`);
    }
    if (dto.type === 'LINK' && !dto.url) {
      throw new BadRequestException('url is required for LINK resources');
    }

    let position = dto.position;
    if (position === undefined || position === null) {
      const max = await this.prisma.resource.aggregate({
        where: { lessonId, tenantId },
        _max: { position: true },
      });
      position = (max._max.position ?? 0) + 1;
    }

    return this.prisma.resource.create({
      data: {
        tenantId,
        lessonId,
        title: dto.title,
        type: dto.type,
        assetId: dto.assetId,
        url: dto.url,
        mimeType: dto.mimeType,
        size: dto.size ? BigInt(dto.size) : undefined,
        position,
        downloadable: dto.downloadable ?? false,
      },
    });
  }

  async listResources(tenantId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({ where: { id: lessonId, tenantId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    return this.prisma.resource.findMany({
      where: { lessonId, tenantId },
      orderBy: { position: 'asc' },
    });
  }

  async getResource(tenantId: string, resourceId: string) {
    const resource = await this.prisma.resource.findFirst({ where: { id: resourceId, tenantId } });
    if (!resource) throw new NotFoundException('Resource not found');
    return resource;
  }

  async updateResource(tenantId: string, resourceId: string, dto: any) {
    await this.getResource(tenantId, resourceId);
    return this.prisma.resource.update({
      where: { id: resourceId },
      data: {
        title: dto.title,
        position: dto.position,
        downloadable: dto.downloadable,
        url: dto.url,
      },
    });
  }

  async deleteResource(tenantId: string, resourceId: string) {
    await this.getResource(tenantId, resourceId);
    await this.prisma.resource.delete({ where: { id: resourceId } });
    return { success: true };
  }

  /**
   * Student access: enrollment required, then generate a short-lived signed URL.
   * No long-lived public URLs for private files.
   */
  async getAccessUrl(tenantId: string, userId: string, resourceId: string) {
    const resource = await this.getResource(tenantId, resourceId);

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: resource.lessonId, tenantId },
      include: { section: { select: { courseId: true } } },
    });

    if (!lesson) throw new NotFoundException('Lesson not found');

    if (!lesson.isFree) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: { tenantId, userId, courseId: lesson.section.courseId, status: 'ACTIVE' },
      });
      if (!enrollment) throw new ForbiddenException('Not enrolled in this course');
    }

    if (resource.type === 'LINK') {
      return { url: resource.url, expiresAt: null };
    }

    const ttlSeconds = 15 * 60;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const secret = process.env.STORAGE_SIGNING_SECRET ?? 'dev-storage-secret';
    const payload = `${tenantId}/${resource.assetId}/${expiresAt.getTime()}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    return {
      url: `https://storage.example.com/${tenantId}/${resource.assetId}?exp=${expiresAt.getTime()}&sig=${signature}`,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
