/**
 * Demo seed — مساحة الأستاذ صالح حسين («جوكر اللغة العربية»)
 * plus the full Path-2 loop on the first course:
 * enter → server timer → submit → next lesson → teacher grading.
 *
 * Usage (Postgres must be migrated first):
 *   cd apps/api
 *   $env:DATABASE_URL=$env:MIGRATION_DATABASE_URL  # superuser bypasses RLS for seeding
 *   npx prisma migrate deploy
 *   pnpm seed:path2
 *
 * Env overrides:
 *   DEMO_TEACHER_PASSWORD  teacher login password (default in docs/DEMO.md)
 *   DEMO_STUDENT_PASSWORD  student login password (default in docs/DEMO.md)
 *   DEMO_YOUTUBE_ID        YouTube video id for the lesson player (default: placeholder)
 *   PROD_TENANT_DOMAINS    comma-separated cloud hosts, e.g.
 *                          "sanad-edtech.vercel.app,api-sanad.railway.app"
 *
 * The script ensures EVERY piece independently (no early exit): it is safe
 * to re-run after partial runs or after seeds from older file versions —
 * missing users, enrollment, lessons, questions, assignment, entitlements
 * and domains are all backfilled without duplicating existing rows.
 * (Old math-demo rows from earlier versions are not deleted; start from a
 * fresh database if you want a clean slate.)
 */
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const TENANT_SLUG = "sanad-demo";
const TENANT_NAME = "الأستاذ صالح حسين";

const TEACHER_PHONE = "01000000001";
const STUDENT_PHONE = "01000000002";
const TEACHER_NAME = "صالح حسين";
const STUDENT_NAME = "طالب الديمو";
// Demo credentials (documented in docs/DEMO.md). Re-runs rotate the hash to
// this password; env override wins on cloud deploys.
const TEACHER_PASSWORD =
  process.env.DEMO_TEACHER_PASSWORD ?? "Joker-Arabic#2026";
const STUDENT_PASSWORD = process.env.DEMO_STUDENT_PASSWORD ?? "Student123!";

/** The three prep-grade Arabic courses of the space. */
const COURSES = [
  {
    slug: "arabic-1-prep",
    title: "اللغة العربية — الأول الإعدادي",
    description:
      "تأسيس قوي من أقسام الكلمة للجملة والمفعول المطلق — بأمثلة من الامتحانات وتدريبات مصححة.",
  },
  {
    slug: "arabic-2-prep",
    title: "اللغة العربية — الثاني الإعدادي",
    description:
      "توسّع في النحو والصرف مع تحليل النصوص وتذوقها، وتدريب على صيغ أسئلة الامتحان.",
  },
  {
    slug: "arabic-3-prep",
    title: "اللغة العربية — الثالث الإعدادي",
    description:
      "مراجعة مركّزة ومهارات إجابة: من القاعدة إلى الدرجة — مع تدريب مستمر قبل الشهادة.",
  },
] as const;

async function main() {
  const tenant =
    (await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } })) ??
    (await prisma.tenant.create({
      data: { name: TENANT_NAME, slug: TENANT_SLUG, status: "ACTIVE" },
    }));

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { name: TENANT_NAME, status: "ACTIVE" },
  });

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

  // Re-runs refresh name + password so credential rotation is one command.
  const teacher = await prisma.user.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: TEACHER_PHONE } },
    update: { name: TEACHER_NAME, passwordHash: teacherPasswordHash },
    create: {
      tenantId: tenant.id,
      role: "TEACHER",
      name: TEACHER_NAME,
      phone: TEACHER_PHONE,
      passwordHash: teacherPasswordHash,
      status: "ACTIVE",
    },
  });

  const student = await prisma.user.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: STUDENT_PHONE } },
    update: { passwordHash: studentPasswordHash },
    create: {
      tenantId: tenant.id,
      role: "STUDENT",
      name: STUDENT_NAME,
      phone: STUDENT_PHONE,
      passwordHash: studentPasswordHash,
      status: "ACTIVE",
    },
  });

  const youTubeId = process.env.DEMO_YOUTUBE_ID ?? "dQw4w9WgXcQ";

  async function ensureCourse(def: (typeof COURSES)[number]) {
    const existing = await prisma.course.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug: def.slug } },
    });
    if (existing) {
      return prisma.course.update({
        where: { id: existing.id },
        data: {
          title: def.title,
          description: def.description,
          teacherId: teacher.id,
          status: "PUBLISHED",
          publishedAt: existing.publishedAt ?? new Date(),
        },
      });
    }
    return prisma.course.create({
      data: {
        tenantId: tenant.id,
        title: def.title,
        slug: def.slug,
        description: def.description,
        language: "ar",
        price: "0",
        currency: "EGP",
        status: "PUBLISHED",
        publishedAt: new Date(),
        teacherId: teacher.id,
      },
    });
  }

  async function ensureSection(courseId: string, title: string) {
    const existing = await prisma.section.findFirst({
      where: { tenantId: tenant.id, courseId, orderIndex: 0 },
    });
    if (existing) return existing;
    return prisma.section.create({
      data: { tenantId: tenant.id, courseId, title, orderIndex: 0 },
    });
  }

  async function ensureLessonBySlug(
    sectionId: string,
    slug: string,
    data: Record<string, any>,
  ) {
    const found = await prisma.lesson.findFirst({
      where: { tenantId: tenant.id, slug },
    });
    if (found) return found;
    // `any` keeps Prisma's XOR create-input union from choking on the spread.
    const payload: any = { tenantId: tenant.id, sectionId, slug, ...data };
    return prisma.lesson.create({ data: payload });
  }

  async function ensureVideo(lessonId: string, title: string) {
    const existingVideo = await prisma.video.findFirst({
      where: { tenantId: tenant.id, lessonId },
    });
    if (existingVideo) return;
    // Video is unique per (tenantId, providerVideoId): the demo reuses one
    // YouTube id across courses, so only the first lesson keeps the row.
    const existingProviderVideo = await prisma.video.findFirst({
      where: { tenantId: tenant.id, providerVideoId: youTubeId },
    });
    if (existingProviderVideo) return;
    await prisma.video.create({
      data: {
        tenantId: tenant.id,
        lessonId,
        title,
        provider: "youtube",
        providerVideoId: youTubeId,
        status: "READY",
        duration: 180,
        uploadedBy: teacher.id,
        publishedAt: new Date(),
      },
    });
  }

  // ---- The three courses of the space --------------------------------
  const courseRows: { id: string; slug: string }[] = [];
  for (const def of COURSES) {
    const created = await ensureCourse(def);
    courseRows.push({ id: created.id, slug: def.slug });
  }
  const course = courseRows[0];
  const otherCourses = courseRows.slice(1);

  // ---- Full Path-2 loop lives on course #1 (الأول الإعدادي) ----------
  const section = await ensureSection(
    course.id,
    "الوحدة 1: من الكلمة إلى الجملة",
  );
  const sectionId = section.id;

  const lesson1 = await ensureLessonBySlug(sectionId, "ar-lesson-intro", {
    type: "VIDEO",
    title: "الحصة الأولى: أقسام الكلمة",
    description:
      "شاهد الشرح ثم ادخل الاختبار — دخول الاختبار يفتح الدرس التالي.",
    duration: 720,
    orderIndex: 0,
    status: "PUBLISHED",
    publishedAt: new Date(),
    lockStatus: "UNLOCKED",
  });

  await ensureVideo(lesson1.id, "شرح: أقسام الكلمة (YouTube UNLISTED)");

  const examLesson = await ensureLessonBySlug(sectionId, "ar-exam-nahw", {
    type: "EXAM",
    title: "اختبار: المهارات النحوية",
    description: "اختبار الديمو — اختيار + صح/خطأ + مقالي يقيمه SANAD.",
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
        title: "اختبار: المهارات النحوية",
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
          text: "ما إعراب كلمة (اجتهادًا) في جملة: «اجتهد الطالب اجتهادًا كبيرًا»؟",
          points: 1,
          position: 0,
          options: [
            { id: "a", text: "فاعل" },
            { id: "b", text: "مفعول مطلق" },
            { id: "c", text: "مفعول به" },
            { id: "d", text: "حال" },
          ],
          correctAnswer: { correctOptionId: "b" },
        },
        {
          tenantId: tenant.id,
          examId: exam.id,
          type: "TRUE_FALSE",
          text: "المفعول المطلق مصدر منصوب، ويُبيَّن نوعه إذا وُصف.",
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
          text: "استخرج المفعول المطلق من الجملة وبيّن نوعه مع السبب: «اجتهد الطالب اجتهادًا كبيرًا».",
          points: 2,
          position: 2,
        },
      ],
    });
  }

  // Entering the exam unlocks this lesson (ENTER_EXAM progression).
  const nextLesson = await ensureLessonBySlug(sectionId, "ar-lesson-next", {
    type: "VIDEO",
    title:
      "المفعول به: الفرق بينه وبين المفعول المطلق (تُفتح بعد دخول الاختبار)",
    orderIndex: 2,
    status: "PUBLISHED",
    publishedAt: new Date(),
    lockStatus: "LOCKED",
    unlockType: "ENTER_EXAM",
    unlockTargetId: exam.id,
    examId: exam.id,
  });

  // Assignment lesson so /student/assignments/[id] is demoable.
  const assignmentLesson = await ensureLessonBySlug(
    sectionId,
    "ar-assignment-analysis",
    {
      type: "ASSIGNMENT",
      title: "واجب: إعراب وتحليل",
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
        title: "واجب: إعراب وتحليل",
        description:
          "أعرب ما تحته خط، وبيّن نوع المفعول المطلق: «قرأ الطالب الدرس قراءةً متأنية».",
        instructions: "اكتب إجابتك كمتن ثم اضغط تسليم قبل انتهاء المؤقت.",
        timerMinutes: 300,
        maxAttempts: 1,
        status: "PUBLISHED",
      },
    });
  }

  // ---- Opening lessons for the other two courses (keep them browseable).
  for (const row of otherCourses) {
    const def = COURSES.find((c) => c.slug === row.slug);
    const sec = await ensureSection(row.id, "الوحدة 1: البداية");
    const opening = await ensureLessonBySlug(sec.id, `${row.slug}-opening`, {
      type: "VIDEO",
      title: "الحصة الافتتاحية: خطة العام",
      description: "نظرة سريعة على خطة الكورس وطريقة المذاكرة.",
      duration: 600,
      orderIndex: 0,
      status: "PUBLISHED",
      publishedAt: new Date(),
      lockStatus: "UNLOCKED",
    });
    await ensureVideo(
      opening.id,
      `شرح: خطة العام — ${def?.title ?? row.slug} (YouTube UNLISTED)`,
    );
  }

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
  console.log("Seed ensured the Arabic teacher space (idempotent backfill):");
  console.log(
    `  teacher: ${TEACHER_PHONE} / ${TEACHER_PASSWORD}  (${TEACHER_NAME})`,
  );
  console.log(`  student: ${STUDENT_PHONE} / ${STUDENT_PASSWORD}`);
  for (const row of courseRows) {
    console.log(`  course:  ${row.slug} → ${row.id}`);
  }
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
  console.log("Space: http://localhost:3001/teachers/saleh-hussein");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
