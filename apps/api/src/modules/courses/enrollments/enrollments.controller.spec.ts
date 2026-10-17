import "reflect-metadata";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AuthorizationGuard } from "../../authorization/authorization.guard";
import { AUTHZ_OPTIONS_KEY } from "../../authorization/authorization.decorators";
import { EnrollmentsController } from "./enrollments.controller";
import * as coursesController from "../courses.controller";

/**
 * Regression guard for audit issue #8 (2026-10-16):
 * - the official /v1/enrollments routes must stay JWT + AuthorizationGuard
 *   protected with the documented permission metadata, and
 * - the legacy duplicate /v1/student/enrollments controller (JWT only, no
 *   permission check) must stay deleted.
 */
describe("EnrollmentsController (route guards, audit #8)", () => {
  const metadataFor = (fn: (...args: any[]) => any) => ({
    options: Reflect.getMetadata(AUTHZ_OPTIONS_KEY, fn),
    guards: Reflect.getMetadata(GUARDS_METADATA, fn),
  });

  it("protects POST courses/:courseId/enroll with enroll permission", () => {
    const { options, guards } = metadataFor(
      EnrollmentsController.prototype.enroll,
    );
    expect(guards).toEqual([JwtAuthGuard, AuthorizationGuard]);
    expect(options).toEqual({
      action: "enroll",
      resourceType: "enrollment",
      resourceIdParam: "courseId",
    });
  });

  it("protects GET me with read permission", () => {
    const { options, guards } = metadataFor(
      EnrollmentsController.prototype.myEnrollments,
    );
    expect(guards).toEqual([JwtAuthGuard, AuthorizationGuard]);
    expect(options).toEqual({ action: "read", resourceType: "enrollment" });
  });

  it("protects get/cancel with read permission scoped to :enrollmentId", () => {
    for (const fn of [
      EnrollmentsController.prototype.get,
      EnrollmentsController.prototype.cancel,
    ]) {
      const { options, guards } = metadataFor(fn);
      expect(guards).toEqual([JwtAuthGuard, AuthorizationGuard]);
      expect(options).toEqual({
        action: "read",
        resourceType: "enrollment",
        resourceIdParam: "enrollmentId",
      });
    }
  });

  it("protects suspend/reactivate with manage permission", () => {
    for (const fn of [
      EnrollmentsController.prototype.suspend,
      EnrollmentsController.prototype.reactivate,
    ]) {
      const { options, guards } = metadataFor(fn);
      expect(guards).toEqual([JwtAuthGuard, AuthorizationGuard]);
      expect(options).toEqual({
        action: "manage",
        resourceType: "enrollment",
        resourceIdParam: "enrollmentId",
      });
    }
  });

  it("keeps the legacy unguarded /v1/student/enrollments controller deleted", () => {
    expect(
      (coursesController as Record<string, unknown>)
        .StudentEnrollmentsController,
    ).toBeUndefined();
  });
});
