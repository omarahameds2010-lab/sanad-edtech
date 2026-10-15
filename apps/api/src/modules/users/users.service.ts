import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../tenants/prisma.service";
import * as argon2 from "argon2";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByPhoneAndTenant(phone: string, tenantId: string) {
    return this.prisma.user.findUnique({
      where: {
        tenantId_phone: {
          tenantId,
          phone,
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Students enrolled in the requesting teacher's courses.
   * Single query via the enrollment relation — no N+1.
   */
  async listStudentsForTeacher(tenantId: string, teacherId: string) {
    const students = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: "STUDENT",
        enrollments: {
          some: { course: { teacherId } },
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        grade: true,
        status: true,
        enrollments: {
          select: {
            status: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { name: "asc" },
      take: 100,
    });
    return students;
  }

  /**
   * Teacher-facing student file: safe profile fields plus enrollments,
   * exam attempts and assignment submissions (latest 20 each).
   * Always scoped by tenantId — never trust the id param alone.
   */
  async getStudentDetail(tenantId: string, studentId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: studentId, tenantId },
      select: {
        id: true,
        name: true,
        role: true,
        grade: true,
        status: true,
      },
    });
    if (!user) {
      throw new NotFoundException("Student not found");
    }

    const [enrollments, examAttempts, submissions] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { tenantId, userId: studentId },
        include: { course: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.examAttempt.findMany({
        where: { tenantId, studentId },
        include: { exam: { select: { id: true, title: true } } },
        orderBy: { submittedAt: "desc" },
        take: 20,
      }),
      this.prisma.assignmentSubmission.findMany({
        where: { tenantId, studentId },
        include: { assignment: { select: { id: true, title: true } } },
        orderBy: { submittedAt: "desc" },
        take: 20,
      }),
    ]);

    return { user, enrollments, examAttempts, submissions };
  }

  async create(data: {
    tenantId: string;
    role: "STUDENT" | "TEACHER" | "ADMIN" | "PARENT" | "SUPER_ADMIN";
    name: string;
    phone: string;
    email?: string;
    password: string;
    grade?: string;
  }) {
    const existingUser = await this.findByPhoneAndTenant(
      data.phone,
      data.tenantId,
    );

    if (existingUser) {
      throw new ConflictException("User with this phone already exists");
    }

    const passwordHash = await argon2.hash(data.password);

    return this.prisma.user.create({
      data: {
        tenantId: data.tenantId,
        role: data.role,
        name: data.name,
        phone: data.phone,
        email: data.email,
        passwordHash,
        grade: data.grade,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
