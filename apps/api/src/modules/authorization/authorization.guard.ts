import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import {
  AuthorizationService,
  AuthorizationError,
} from "./authorization.service";
import { PolicyEngine, Action, ResourceType } from "./policy-engine";

export interface RequirePermissionOptions {
  action: Action;
  resourceType: ResourceType;
  resourceIdParam?: string; // Parameter name in route for resource ID
  resourceResolver?: (request: any) => Promise<any>; // Custom function to resolve resource
}

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private authService: AuthorizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get options from route metadata
    const options = this.getOptions(context);

    if (!options) {
      return true; // No authorization required
    }

    try {
      // Build authorization context
      const authContext = await this.authService.buildContext(request);

      // Resolve resource if needed
      let resource: any = undefined;
      if (options.resourceIdParam) {
        resource = { id: request.params[options.resourceIdParam] };
      }
      if (options.resourceResolver) {
        resource = {
          ...resource,
          ...(await options.resourceResolver(request)),
        };
      }

      // Check permission
      await this.authService.canOrThrow(
        authContext,
        options.action,
        options.resourceType,
        resource,
      );

      return true;
    } catch (error) {
      if (error instanceof AuthorizationError) {
        throw new ForbiddenException({
          message: error.message,
          code: error.code,
          conditions: error.conditions,
        });
      }
      throw error;
    }
  }

  private getOptions(
    context: ExecutionContext,
  ): RequirePermissionOptions | null {
    const handler = context.getHandler();
    const controller = context.getClass();

    // Check handler metadata first, then controller metadata
    const handlerOptions = Reflect.getMetadata("authz:options", handler);
    const controllerOptions = Reflect.getMetadata("authz:options", controller);

    return handlerOptions || controllerOptions || null;
  }
}

export function RequirePermission(options: RequirePermissionOptions) {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    if (propertyKey && descriptor) {
      // Method decorator
      Reflect.defineMetadata("authz:options", options, descriptor.value);
    } else {
      // Class decorator
      Reflect.defineMetadata("authz:options", options, target);
    }
    return descriptor || target;
  };
}
