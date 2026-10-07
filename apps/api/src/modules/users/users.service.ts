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
