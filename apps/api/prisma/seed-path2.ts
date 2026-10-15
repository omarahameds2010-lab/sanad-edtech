/**
 * Path-2 demo seed: exam loop (enter → timer → submit → next lesson)
 * plus a YouTube UNLISTED video on the first lesson.
 *
 * Usage (Postgres must be migrated first):
 *   cd apps/api
 *   $env:DATABASE_URL=$env:MIGRATION_DATABASE_URL  # superuser bypasses RLS for seeding
 *   npx prisma migrate deploy
 *   pnpm seed:path2
 *
 * Env overrides:
 *   DEMO_YOUTUBE_ID       YouTube video id for the lesson player (default: placeholder)
 *   PROD_TENANT_DOMAINS   comma-separated cloud hosts, e.g.
 *                         "sanad-edtech.vercel.app,api-sanad.railway.app"
 *
 * The script ensures EVERY piece independently (no early exit): it is safe
 * to re-run after partial runs or after seeds from older file versions —
 * missing users, enrollment, lessons, questions, assignment, entitlements
 * and domains are all backfilled without duplicating existing rows.
 */
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const TENANT_SLUG = "sanad-demo";
const COURSE_SLUG = "demo-math-1";
const TEACHER_PHONE = "01000000001";
const STUDENT_PHONE = "01000000002";
const TEACHER_PASSWORD = "Teacher123!";
const STUDENT_PASSWORD = "Student123!";

async function main() {
  const tenant =
    (await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } })) ??
    (await prisma.tenant.create({
      data: { name: "Sanad Demo", slug: TENANT_SLUG, status: "ACTIVE" },
    }));

  await prisma.tenantDomain.upsert({
    where: { domain: "localhost" },
    update: { tenantId: tenant.id },
    create: { tenantId: tenant.id, domain: "localhost", isPrimary: true },
  });

  // Production domains (Vercel web + Railway API hosts). Without these,
  // Host-based tenant resolution answers 404 for every cloud request.
  const prodDomains = (process.env.PROD_TENANT_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter((d) => d.length > 0);
  for (const domain of prodDomains) {
    await prisma.tenantDomain.upsert({
      where: { domain },
      update: { tenantId: tenant.id },
      create: { tenantId: tenant.id, domain, isPrimary: false },
    });
  }

  const teacherPasswordHash = await argon2.hash(TEACHER_PASSWORD);
  const studentPasswordHash = await argon2.hash(STUDENT_PASSWORD);

  const teacher = await prisma.user.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: TEACHER_PHONE } },
    update: {},
    create: {
      tenantId: tenant.id,
      role: "TEACHER",
      name: "أستاذ الديمو",
      phone: TEACHER_PHONE,
      passwordHash: teacherPasswordHash,
      status: "ACTIVE",
    },
  });

  const student = await prisma.user.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: STUDENT_PHONE } },
    update: {},
    create: {
      tenantId: tenant.id,
      role: "STUDENT",
      name: "طالب الديمو",
      phone: STUDENT_PHONE,
      passwordHash: studentPasswordHash,
      status: "ACTIVE",
    },
  });

  let course = await prisma.course.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: COURSE_SLUG } },
  });
  if (!course) {
    course = await prisma.course.create({
      data: {
        tenantId: tenant.id,
        title: "رياضيات الديمو — جبر",
        slug: COURSE_SLUG,
        description: "كورس الديمو لمسار الامتحانات",
        language: "ar",
        price: "0",
        currency: "EGP",
        status: "PUBLISHED",
        publishedAt: new Date(),
        teacherId: teacher.id,
      },
    });
  }

  let section = await prisma.section.findFirst({
    where: { tenantId: tenant.id, courseId: course.id, orderIndex: 0 },
  });
  if (!section) {
    section = await prisma.section.create({
      data: {
        tenantId: tenant.id,
        courseId: course.id,
        title: "الوحدة 1: أساسيات الجبر",
        orderIndex: 0,
      },
    });
  }
  const sectionId = section.id;

  async function ensureLessonBySlug(slug: string, data: Record<string, any>) {
    const found = await prisma.lesson.findFirst({
      where: { tenantId: tenant.id, slug },
    });
    if (found) return found;
    // `any` keeps Prisma's XOR create-input union from choking on the spread.
    const payload: any = { tenantId: tenant.id, sectionId, ...data };
    return prisma.lesson.create({ data: payload });
  }

  const lesson1 = await ensureLessonBySlug("demo-lesson-intro", {
    type: "VIDEO",
    title: "مقدمة في المتغيرات",
    description: "شاهد الشرح ثم ادخل الاختبار",
    duration: 720,
    orderIndex: 0,
    status: "PUBLISHED",
    publishedAt: new Date(),
    lockStatus: "UNLOCKED",
  });

  const youTubeId = process.env.DEMO_YOUTUBE_ID ?? "dQw4w9WgXcQ";
  const existingVideo = await prisma.video.findFirst({
    where: { tenantId: tenant.id, lessonId: lesson1.id },
  });
  if (!existingVideo) {
    await prisma.video.create({
      data: {
        tenantId: tenant.id,
        lessonId: lesson1.id,
        title: "شرح المتغيرات (YouTube UNLISTED)",
        provider: "youtube",
        providerVideoId: youTubeId,
        status: "READY",
        duration: 180,
        uploadedBy: teacher.id,
        publishedAt: new Date(),
      },
    });
  }

  const examLesson = await ensureLessonBySlug("demo-exam-algebra", {
    type: "EXAM",
    title: "اختبار: أساسيات الجبر",
    description: "اختبار الديمو — 3 أسئلة",
    duration: 4200,
    orderIndex: 1,
    status: "PUBLISHED",
    publishedAt: new Date(),
    lockStatus: "UNLOCKED",
  });

  let exam = await prisma.exam.findFirst({
    where: { tenantId: tenant.id, lessonId: examLesson.id },
  });
  if (!exam) {
    exam = await prisma.exam.create({
      data: {
        tenantId: tenant.id,
        lessonId: examLesson.id,
        title: "اختبار: أساسيات الجبر",
        description: "MCQ + صح/خطأ + مقالي",
        instructions: "أجب عن كل الأسئلة ثم اضغط إنهاء الاختبار.",
        timerMinutes: 70,
        passingScore: 60,
        maxAttempts: 2,
        shuffleQuestions: false,
        shuffleOptions: false,
        showResults: true,
        showCorrectAnswers: false,
        status: "PUBLISHED",
      },
    });
  }

  const questionCount = await prisma.examQuestion.count({
    where: { tenantId: tenant.id, examId: exam.id },
  });
  if (questionCount === 0) {
    await prisma.examQuestion.createMany({
      data: [
        {
          tenantId: tenant.id,
          examId: exam.id,
          type: "MCQ",
          text: "ما قيمة x في المعادلة x + 5 = 12؟",
          points: 1,
          position: 0,
          options: [
            { id: "a", text: "5" },
            { id: "b", text: "7" },
            { id: "c", text: "17" },
            { id: "d", text: "60" },
          ],
          correctAnswer: { correctOptionId: "b" },
        },
        {
          tenantId: tenant.id,
          examId: exam.id,
          type: "TRUE_FALSE",
          text: "المعادلة 2x = 10 حلها x = 5.",
          points: 1,
          position: 1,
          options: [
            { id: "true", text: "صح" },
            { id: "false", text: "خطأ" },
          ],
          correctAnswer: { correctOptionId: "true" },
        },
        {
          tenantId: tenant.id,
          examId: exam.id,
          type: "ESSAY",
          text: "اشرح بكلماتك ما هو المتغير في الجبر.",
          points: 2,
          position: 2,
        },
      ],
    });
  }

  // Entering the exam unlocks this lesson (ENTER_EXAM progression).
  const nextLesson = await ensureLessonBySlug("demo-lesson-next", {
    type: "VIDEO",
    title: "المعادلات الخطية (تُفتح بعد دخول الاختبار)",
    orderIndex: 2,
    status: "PUBLISHED",
    publishedAt: new Date(),
    lockStatus: "LOCKED",
    unlockType: "ENTER_EXAM",
    unlockTargetId: exam.id,
    examId: exam.id,
  });

  const existingEnrollment = await prisma.enrollment.findFirst({
    where: { tenantId: tenant.id, userId: student.id, courseId: course.id },
  });
  if (!existingEnrollment) {
    await prisma.enrollment.create({
      data: {
        tenantId: tenant.id,
        userId: student.id,
        courseId: course.id,
        startsAt: new Date(),
        status: "ACTIVE",
        source: "seed:path2",
      },
    });
  }

  // Assignment lesson so /student/assignments/[id] is demoable.
  const assignmentLesson = await ensureLessonBySlug(
    "demo-assignment-equations",
    {
      type: "ASSIGNMENT",
      title: "واجب: حل المعادلات",
      description: "واجب الديمو — إجابة نصية",
      duration: 18000,
      orderIndex: 3,
      status: "PUBLISHED",
      publishedAt: new Date(),
      lockStatus: "UNLOCKED",
    },
  );

  let assignment = await prisma.assignment.findFirst({
    where: { tenantId: tenant.id, lessonId: assignmentLesson.id },
  });
  if (!assignment) {
    assignment = await prisma.assignment.create({
      data: {
        tenantId: tenant.id,
        lessonId: assignmentLesson.id,
        title: "واجب: حل المعادلات",
        description: "حل المعادلتين التاليتين واكتب خطواتك.",
        instructions: "اكتب إجابتك كمتن ثم اضغط تسليم قبل انتهاء المؤقت.",
        timerMinutes: 300,
        maxAttempts: 1,
        status: "PUBLISHED",
      },
    });
  }

  // Entitlements mirror grantCourseEntitlement (course + lessons + exam +
  // assignments) so guards pass without a purchase in the demo.
  const entitlementTargets = [
    { resourceType: "course", resourceId: course.id },
    { resourceType: "lesson", resourceId: lesson1.id },
    { resourceType: "lesson", resourceId: examLesson.id },
    { resourceType: "lesson", resourceId: nextLesson.id },
    { resourceType: "lesson", resourceId: assignmentLesson.id },
    { resourceType: "exam", resourceId: exam.id },
    { resourceType: "assignment", resourceId: assignment.id },
  ];
  for (const target of entitlementTargets) {
    await prisma.entitlement.upsert({
      where: {
        id: `seed-${student.id}-${target.resourceType}-${target.resourceId}`,
      },
      update: { status: "ACTIVE" },
      create: {
        id: `seed-${student.id}-${target.resourceType}-${target.resourceId}`,
        tenantId: tenant.id,
        userId: student.id,
        resourceType: target.resourceType,
        resourceId: target.resourceId,
        source: "admin_grant",
        startsAt: new Date(),
        status: "ACTIVE",
        metadata: { courseId: course.id, seed: true },
      },
    });
  }

  const finalQuestions = await prisma.examQuestion.count({
    where: { tenantId: tenant.id, examId: exam.id },
  });
  const finalEntitlements = await prisma.entitlement.count({
    where: { tenantId: tenant.id, userId: student.id },
  });
  console.log("Seed ensured Path-2 demo (idempotent backfill):");
  console.log(`  teacher: ${TEACHER_PHONE} / ${TEACHER_PASSWORD}`);
  console.log(`  student: ${STUDENT_PHONE} / ${STUDENT_PASSWORD}`);
  console.log(`  courseId: ${course.id}`);
  console.log(`  lessonId (video): ${lesson1.id}`);
  console.log(`  examId:   ${exam.id}  (lesson ${examLesson.id})`);
  console.log(`  exam questions: ${finalQuestions}`);
  console.log(
    `  assignmentId: ${assignment.id}  (lesson ${assignmentLesson.id})`,
  );
  console.log(`  nextLesson (locked): ${nextLesson.id}`);
  console.log(`  student entitlements: ${finalEntitlements}`);
  console.log(
    "Flow: login → /student/exams → enter → submit → lesson → teacher grades.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
