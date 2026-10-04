import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../modules/tenants/prisma.service';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;
    const role = request.user?.role;

    if (tenantId) {
      // Set tenant context for this request
      // This will be used by Prisma transactions
      request.tenantContextSet = true;
    }

    return next.handle();
  }
}
