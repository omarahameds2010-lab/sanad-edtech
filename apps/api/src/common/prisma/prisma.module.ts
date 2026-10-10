import { Global, Module } from "@nestjs/common";
import { PrismaService } from "../../modules/tenants/prisma.service";

/**
 * Single shared PrismaService for the whole application.
 *
 * PrismaService MUST be provided here only. Registering it in feature
 * modules creates one connection pool per module, which exhausts the
 * database (and trips hosted-proxy throttles) at boot.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
