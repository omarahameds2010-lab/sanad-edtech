/** Prep grades of the Arabic space (values stored in course.grade). */
export const PREP_GRADES = [
  { key: "prep-1", label: "الأول الإعدادي" },
  { key: "prep-2", label: "الثاني الإعدادي" },
  { key: "prep-3", label: "الثالث الإعدادي" },
] as const;

export type PrepGradeKey = (typeof PREP_GRADES)[number]["key"];

export function isPrepGrade(key: string): key is PrepGradeKey {
  return PREP_GRADES.some((g) => g.key === key);
}

export function gradeLabel(key: string | null | undefined): string {
  return PREP_GRADES.find((g) => g.key === key)?.label ?? "غير مصنف على صف";
}

export const LESSON_TYPE_LABELS: Record<string, string> = {
  VIDEO: "درس فيديو",
  PDF: "ملف PDF",
  QUIZ: "كويز",
  LIVE: "بث مباشر",
  ASSIGNMENT: "واجب",
  EXAM: "امتحان",
  RESOURCE: "مورد",
};

export const LESSON_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  PROCESSING: "قيد المعالجة",
  READY: "جاهز",
  PUBLISHED: "منشور",
  ARCHIVED: "مؤرشف",
};

export const COURSE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  UNPUBLISHED: "غير منشور",
  ARCHIVED: "مؤرشف",
};

/** Tip shown under the grade pages: exams/assignments live inside lessons. */
export const PUBLISH_TIP =
  "الامتحان والواجب بيتضافوا جوه درس: أضف درس من نوع «امتحان» أو «واجب» من مساحة الكورس، وبعد الرفع والنشر الطالب يشوفه في صفحته.";
