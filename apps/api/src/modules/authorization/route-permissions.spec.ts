import { AUTHZ_OPTIONS_KEY } from "./authorization.decorators";
import { ExamsController } from "../courses/exams/exams.controller";
import { AssignmentsController } from "../courses/assignments/assignments.controller";
import {
  TeacherLessonsController,
} from "../courses/courses.controller";
import { LessonsController } from "../courses/lessons/lessons.controller";

function permission(handler: Function) {
  return Reflect.getMetadata(AUTHZ_OPTIONS_KEY, handler);
}

/**
 * These routes return authoring data (answer keys, every student's attempts,
 * or linked assessment rows for a locked lesson). A student `read` grant must
 * never open them; they stay behind the teacher/admin `update` action.
 */
describe("authoring route permissions", () => {
  it.each([
    ["exams.get", ExamsController.prototype.get, "exam", "examId"],
    [
      "assignments.get",
      AssignmentsController.prototype.get,
      "assignment",
      "assignmentId",
    ],
    [
      "teacherLessons.getLesson",
      TeacherLessonsController.prototype.getLesson,
      "lesson",
      "id",
    ],
    [
      "teacherLessons.listLessons",
      TeacherLessonsController.prototype.listLessons,
      "lesson",
      undefined,
    ],
    [
      "legacyLessons.get",
      LessonsController.prototype.get,
      "lesson",
      "lessonId",
    ],
    [
      "legacyLessons.list",
      LessonsController.prototype.list,
      "lesson",
      "sectionId",
    ],
  ])(
    "%s requires update, not read",
    (_name, handler, resourceType, resourceIdParam) => {
      expect(permission(handler)).toMatchObject({
        action: "update",
        resourceType,
        ...(resourceIdParam ? { resourceIdParam } : {}),
      });
    },
  );

  it("keeps the scoped student exam view readable", () => {
    expect(permission(ExamsController.prototype.studentView)).toMatchObject({
      action: "read",
      resourceType: "exam",
    });
  });

  it("keeps the scoped student assignment view readable", () => {
    expect(
      permission(AssignmentsController.prototype.studentView),
    ).toMatchObject({
      action: "read",
      resourceType: "assignment",
    });
  });
});
