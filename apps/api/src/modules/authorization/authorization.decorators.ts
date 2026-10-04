import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthorizationGuard, RequirePermissionOptions } from './authorization.guard';

export const AUTHZ_OPTIONS_KEY = 'authz:options';

export function RequirePermission(options: RequirePermissionOptions) {
  return applyDecorators(
    SetMetadata(AUTHZ_OPTIONS_KEY, options),
    UseGuards(JwtAuthGuard, AuthorizationGuard),
  );
}

// Convenience decorators for common permissions
export const CanWatchLesson = (lessonIdParam = 'lessonId') =>
  RequirePermission({ action: 'watch', resourceType: 'lesson', resourceIdParam: lessonIdParam });

export const CanAttemptExam = (examIdParam = 'examId') =>
  RequirePermission({ action: 'attempt', resourceType: 'exam', resourceIdParam: examIdParam });

export const CanSubmitAttempt = (attemptIdParam = 'attemptId') =>
  RequirePermission({ action: 'submit', resourceType: 'attempt', resourceIdParam: attemptIdParam });

export const CanManageCourse = (courseIdParam = 'courseId') =>
  RequirePermission({ action: 'manage', resourceType: 'course', resourceIdParam: courseIdParam });

export const CanCreateCourse = () =>
  RequirePermission({ action: 'create', resourceType: 'course' });

export const CanReadCourse = (courseIdParam = 'courseId') =>
  RequirePermission({ action: 'read', resourceType: 'course', resourceIdParam: courseIdParam });

export const CanUpdateCourse = (courseIdParam = 'courseId') =>
  RequirePermission({ action: 'update', resourceType: 'course', resourceIdParam: courseIdParam });

export const CanDeleteCourse = (courseIdParam = 'courseId') =>
  RequirePermission({ action: 'delete', resourceType: 'course', resourceIdParam: courseIdParam });

export const CanPublishCourse = (courseIdParam = 'courseId') =>
  RequirePermission({ action: 'publish', resourceType: 'course', resourceIdParam: courseIdParam });

export const CanManageLesson = (lessonIdParam = 'lessonId') =>
  RequirePermission({ action: 'manage', resourceType: 'lesson', resourceIdParam: lessonIdParam });

export const CanCreateLesson = (courseIdParam = 'courseId') =>
  RequirePermission({ action: 'create', resourceType: 'lesson', resourceIdParam: courseIdParam });

export const CanReadLesson = (lessonIdParam = 'lessonId') =>
  RequirePermission({ action: 'read', resourceType: 'lesson', resourceIdParam: lessonIdParam });

export const CanManageExam = (examIdParam = 'examId') =>
  RequirePermission({ action: 'manage', resourceType: 'exam', resourceIdParam: examIdParam });

export const CanGradeAttempt = (attemptIdParam = 'attemptId') =>
  RequirePermission({ action: 'grade', resourceType: 'attempt', resourceIdParam: attemptIdParam });

export const CanReadAttempt = (attemptIdParam = 'attemptId') =>
  RequirePermission({ action: 'read', resourceType: 'attempt', resourceIdParam: attemptIdParam });

export const CanManageEnrollment = (enrollmentIdParam = 'enrollmentId') =>
  RequirePermission({ action: 'manage', resourceType: 'enrollment', resourceIdParam: enrollmentIdParam });

export const CanEnroll = (courseIdParam = 'courseId') =>
  RequirePermission({ action: 'enroll', resourceType: 'enrollment', resourceIdParam: courseIdParam });

export const CanReadEnrollment = (enrollmentIdParam = 'enrollmentId') =>
  RequirePermission({ action: 'read', resourceType: 'enrollment', resourceIdParam: enrollmentIdParam });

export const CanManageUser = (userIdParam = 'userId') =>
  RequirePermission({ action: 'manage', resourceType: 'user', resourceIdParam: userIdParam });

export const CanReadUser = (userIdParam = 'userId') =>
  RequirePermission({ action: 'read', resourceType: 'user', resourceIdParam: userIdParam });

export const CanUpdateUser = (userIdParam = 'userId') =>
  RequirePermission({ action: 'update', resourceType: 'user', resourceIdParam: userIdParam });

export const CanManageVoucher = (voucherIdParam = 'voucherId') =>
  RequirePermission({ action: 'manage', resourceType: 'voucher', resourceIdParam: voucherIdParam });

export const CanCreateVoucher = () =>
  RequirePermission({ action: 'create', resourceType: 'voucher' });

export const CanReadAnalytics = () =>
  RequirePermission({ action: 'read', resourceType: 'analytics' });

export const CanExportAnalytics = () =>
  RequirePermission({ action: 'export', resourceType: 'analytics' });

export const CanManageTenantSettings = () =>
  RequirePermission({ action: 'manage', resourceType: 'settings' });

export const CanReadTenantSettings = () =>
  RequirePermission({ action: 'read', resourceType: 'settings' });

export const CanManageCertificate = (certificateIdParam = 'certificateId') =>
  RequirePermission({ action: 'manage', resourceType: 'certificate', resourceIdParam: certificateIdParam });

export const CanCreateCertificate = (courseIdParam = 'courseId') =>
  RequirePermission({ action: 'create', resourceType: 'certificate', resourceIdParam: courseIdParam });

export const CanReadCertificate = (certificateIdParam = 'certificateId') =>
  RequirePermission({ action: 'read', resourceType: 'certificate', resourceIdParam: certificateIdParam });

export const CanManageAssignment = (assignmentIdParam = 'assignmentId') =>
  RequirePermission({ action: 'manage', resourceType: 'assignment', resourceIdParam: assignmentIdParam });

export const CanSubmitAssignment = (assignmentIdParam = 'assignmentId') =>
  RequirePermission({ action: 'submit', resourceType: 'assignment', resourceIdParam: assignmentIdParam });

export const CanManageQuestion = (questionIdParam = 'questionId') =>
  RequirePermission({ action: 'manage', resourceType: 'question', resourceIdParam: questionIdParam });

export const CanReadQuestionBank = () =>
  RequirePermission({ action: 'read', resourceType: 'questionBank' });

export const CanManageQuestionBank = () =>
  RequirePermission({ action: 'manage', resourceType: 'questionBank' });

export const CanManageVideo = (videoIdParam = 'videoId') =>
  RequirePermission({ action: 'manage', resourceType: 'video', resourceIdParam: videoIdParam });

export const CanWatchVideo = (videoIdParam = 'videoId') =>
  RequirePermission({ action: 'watch', resourceType: 'video', resourceIdParam: videoIdParam });

export const CanManageLiveSession = (sessionIdParam = 'sessionId') =>
  RequirePermission({ action: 'manage', resourceType: 'liveSession', resourceIdParam: sessionIdParam });

export const CanJoinLiveSession = (sessionIdParam = 'sessionId') =>
  RequirePermission({ action: 'join', resourceType: 'liveSession', resourceIdParam: sessionIdParam });

export const CanModerateCommunity = () =>
  RequirePermission({ action: 'moderate', resourceType: 'community' });

export const CanCreateNotification = () =>
  RequirePermission({ action: 'create', resourceType: 'notification' });