import "reflect-metadata";
import { RequestMethod } from "@nestjs/common";
import {
  METHOD_METADATA,
  PATH_METADATA,
} from "@nestjs/common/constants";
import { AuthController } from "./modules/auth/auth.controller";
import { StudentLessonsController } from "./modules/courses/courses.controller";
import { ExamsController } from "./modules/courses/exams/exams.controller";
import { ProgressionController } from "./modules/courses/progression/progression.controller";

/**
 * Locks the public HTTP contract of the Path-2 loop
 * (login → exam view/enter/timer/submit → lesson → grading).
 *
 * The web client (apps/web/app/lib/api.ts) calls these exact paths;
 * any drift on either side breaks this spec. Global prefix "api"
 * is applied in main.ts via setGlobalPrefix.
 */
const GLOBAL_PREFIX = "api";

function controllerPath(target: object): string {
  return Reflect.getMetadata(PATH_METADATA, target) ?? "";
}

function routeOf(
  target: object,
  methodName: string,
): { httpMethod: RequestMethod; path: string } {
  const fn = (target as any).prototype[methodName];
  return {
    httpMethod: Reflect.getMetadata(METHOD_METADATA, fn),
    path: Reflect.getMetadata(PATH_METADATA, fn) ?? "",
  };
}

function expectRoute(
  controller: object,
  methodName: string,
  httpMethod: RequestMethod,
  path: string,
) {
  const route = routeOf(controller, methodName);
  const joined = `/${GLOBAL_PREFIX}/${controllerPath(controller)}/${route.path}`;
  const full = joined.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
  expect(route.httpMethod).toBe(httpMethod);
  expect(full).toBe(path);
}

describe("Path-2 HTTP contract", () => {
  it("exposes login", () => {
    expectRoute(AuthController, "login", RequestMethod.POST, "/api/auth/login");
  });

  it("exposes the student exam flow", () => {
    expectRoute(ExamsController, "list", RequestMethod.GET, "/api/v1/exams");
    expectRoute(ExamsController, "get", RequestMethod.GET, "/api/v1/exams/:examId");
    expectRoute(
      ExamsController,
      "studentView",
      RequestMethod.GET,
      "/api/v1/exams/:examId/view",
    );
    expectRoute(
      ExamsController,
      "enter",
      RequestMethod.POST,
      "/api/v1/exams/:examId/enter",
    );
    expectRoute(
      ExamsController,
      "timer",
      RequestMethod.GET,
      "/api/v1/exams/:examId/timer",
    );
    expectRoute(
      ExamsController,
      "myAttempts",
      RequestMethod.GET,
      "/api/v1/exams/:examId/attempts/me",
    );
    expectRoute(
      ExamsController,
      "submit",
      RequestMethod.POST,
      "/api/v1/exams/:examId/submit",
    );
  });

  it("exposes the teacher grading flow", () => {
    expectRoute(
      ExamsController,
      "gradingQueue",
      RequestMethod.GET,
      "/api/v1/exams/:examId/attempts/grading",
    );
    expectRoute(
      ExamsController,
      "grade",
      RequestMethod.POST,
      "/api/v1/exams/attempts/:attemptId/grade",
    );
  });

  it("exposes progression and student lessons", () => {
    expectRoute(
      ProgressionController,
      "studentProgression",
      RequestMethod.GET,
      "/api/v1/progression/courses/:courseId",
    );
    expectRoute(
      ProgressionController,
      "nextLesson",
      RequestMethod.GET,
      "/api/v1/progression/lessons/:lessonId/next",
    );
    expectRoute(
      StudentLessonsController,
      "getLesson",
      RequestMethod.GET,
      "/api/v1/student/lessons/:lessonId",
    );
  });
});
