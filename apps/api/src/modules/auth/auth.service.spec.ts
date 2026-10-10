import { BadRequestException, ConflictException } from "@nestjs/common";
import { AuthService } from "./auth.service";

describe("AuthService.register", () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;
  let prisma: any;

  beforeEach(() => {
    usersService = { create: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue("signed-token") };
    prisma = {
      session: { create: jest.fn().mockResolvedValue({ id: "s1" }) },
      device: { upsert: jest.fn() },
    };
    service = new AuthService(usersService, jwtService, prisma);
  });

  it("creates the user and returns login tokens", async () => {
    usersService.create.mockResolvedValue({
      id: "u1",
      tenantId: "t1",
      role: "STUDENT",
      name: "طالب جديد",
    });

    const result = await service.register("t1", {
      name: "طالب جديد",
      phone: "01012345678",
      password: "password123",
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "t1",
        role: "STUDENT",
        phone: "01012345678",
      }),
    );
    expect(result.accessToken).toBe("signed-token");
    expect(result.user.id).toBe("u1");
  });

  it("registers teachers when explicitly requested", async () => {
    usersService.create.mockResolvedValue({
      id: "u2",
      tenantId: "t1",
      role: "TEACHER",
      name: "مدرس",
    });

    await service.register("t1", {
      name: "مدرس",
      phone: "01112345678",
      password: "password123",
      role: "TEACHER",
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: "TEACHER" }),
    );
  });

  it("rejects privileged roles", async () => {
    await expect(
      service.register("t1", {
        name: "x",
        phone: "01012345678",
        password: "password123",
        role: "ADMIN",
      }),
    ).rejects.toThrow(BadRequestException);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it("propagates duplicate-phone conflicts", async () => {
    usersService.create.mockRejectedValue(
      new ConflictException("User with this phone already exists"),
    );

    await expect(
      service.register("t1", {
        name: "x",
        phone: "01012345678",
        password: "password123",
      }),
    ).rejects.toThrow(ConflictException);
  });
});
