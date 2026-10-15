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
 *   DEMO_YOUTUBE_ID  YouTube video id for the lesson player (default: placeholder)
 *
 * The script is idempotent: if the demo course already exists it prints
 * the existing ids and exits without duplicating.
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
  // Example: PROD_TENANT_DOMAINS="sanad-edtech.vercel.app,api-sanad.railway.app"
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
  if (course) {
    const exam = await prisma.exam.findFirst({
      where: { tenantId: tenant.id, lesson: { section: { courseId: course.id } } },
      include: { lesson: true },
    });
    console.log("Demo course already exists — reusing:");
    console.log(`  courseId: ${course.id}`);
    console.log(`  examId:   ${exam?.id ?? "(none)"}`);
    console.log(`  lessonId: ${exam?.lessonId ?? "(none)"}`);
    return;
  }

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

  const section = await prisma.section.create({
    data: {
      tenantId: tenant.id,
      courseId: course.id,
      title: "الوحدة 1: أساسيات الجبر",
      orderIndex: 0,
    },
  });

  const lesson1 = await prisma.lesson.create({
    data: {
      tenantId: tenant.id,
      sectionId: section.id,
      type: "VIDEO",
      title: "مقدمة في المتغيرات",
      slug: "demo-lesson-intro",
      description: "شاهد الشرح ثم ادخل الاختبار",
      duration: 720,
      orderIndex: 0,
      status: "PUBLISHED",
      publishedAt: new Date(),
      lockStatus: "UNLOCKED",
    },
  });

  const youTubeId = process.env.DEMO_YOUTUBE_ID ?? "dQw4w9WgXcQ";
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

  const examLesson = await prisma.lesson.create({
    data: {
      tenantId: tenant.id,
      sectionId: section.id,
      type: "EXAM",
      title: "اختبار: أساسيات الجبر",
      slug: "demo-exam-algebra",
      description: "اختبار الديمو — 3 أسئلة",
      duration: 4200,
      orderIndex: 1,
      status: "PUBLISHED",
      publishedAt: new Date(),
      lockStatus: "UNLOCKED",
    },
  });

  const exam = await prisma.exam.create({
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
      questions: {
        create: [
          {
            tenantId: tenant.id,
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
            type: "ESSAY",
            text: "اشرح بكلماتك ما هو المتغير في الجبر.",
            points: 2,
            position: 2,
          },
        ],
      },
    },
  });

  // Entering the exam unlocks this lesson (ENTER_EXAM progression).
  const nextLesson = await prisma.lesson.create({
    data: {
      tenantId: tenant.id,
      sectionId: section.id,
      type: "VIDEO",
      title: "المعادلات الخطية (تُفتح بعد دخول الاختبار)",
      slug: "demo-lesson-next",
      orderIndex: 2,
      status: "PUBLISHED",
      publishedAt: new Date(),
      lockStatus: "LOCKED",
      unlockType: "ENTER_EXAM",
      unlockTargetId: exam.id,
      examId: exam.id,
    },
  });

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

  // Assignment lesson so /student/assignments/[id] is demoable.
  const assignmentLesson = await prisma.lesson.create({
    data: {
      tenantId: tenant.id,
      sectionId: section.id,
      type: "ASSIGNMENT",
      title: "واجب: حل المعادلات",
      slug: "demo-assignment-equations",
      description: "واجب الديمو — إجابة نصية",
      duration: 18000,
      orderIndex: 3,
      status: "PUBLISHED",
      publishedAt: new Date(),
      lockStatus: "UNLOCKED",
    },
  });

  const assignment = await prisma.assignment.create({
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
        // No unique constraint on (user, type, id) — guard by lookup.
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

  console.log("Seeded Path-2 demo:");
  console.log(`  teacher: ${TEACHER_PHONE} / ${TEACHER_PASSWORD}`);
  console.log(`  student: ${STUDENT_PHONE} / ${STUDENT_PASSWORD}`);
  console.log(`  courseId: ${course.id}`);
  console.log(`  lessonId (video): ${lesson1.id}`);
  console.log(`  examId:   ${exam.id}  (lesson ${examLesson.id})`);
  console.log(`  assignmentId: ${assignment.id}  (lesson ${assignmentLesson.id})`);
  console.log(`  nextLesson (locked): ${nextLesson.id}`);
  console.log("Flow: login → /student/exams → enter → submit → lesson → teacher grades.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
