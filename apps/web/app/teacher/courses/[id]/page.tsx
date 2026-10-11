import Link from "next/link";

const course = {
  id: "c2",
  title: "الرياضيات - جبر وهندسة",
  slug: "math-algebra-geometry",
  status: "DRAFT",
  description: "كورس شامل يغطي الجبر والهندسة للمرحلة الثانوية",
  thumbnail: "https://picsum.photos/seed/math/400/225",
  sections: 3,
  lessons: 14,
  resources: 8,
  assignments: 2,
  exams: 1,
  students: 0,
  completion: 0,
  revenue: 0,
  lastSaved: "2026-10-05 14:30",
  lastPublished: null,
  readiness: {
    title: true,
    description: true,
    teacherIdentity: true,
    thumbnail: true,
    sections: true,
    lessons: true,
    issues: [
      { type: "warning", message: "درس 1: فيديو قيد المعالجة" },
      { type: "warning", message: "درس 5: لا يوجد محتوى" },
      { type: "error", message: "اختبار 1: لا يحتوي على أسئلة" },
    ],
  },
};

export default function CourseOverviewPage() {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "var(--space-lg)",
          gap: "var(--space-md)",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>{course.title}</h1>
          <p style={{ color: "var(--text-muted)" }}>{course.description}</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <Link href="/teacher/courses">
            <button
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              العودة للكورسات
            </button>
          </Link>
          <Link href="/teacher/courses/c2/builder">
            <button>متابعة التحرير</button>
          </Link>
          <Link href="/teacher/courses/c2/publish">
            <button
              style={{
                background: "var(--color-action)",
                color: "var(--bg-base)",
              }}
            >
              نشر الكورس
            </button>
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--space-md)",
          marginBottom: "var(--space-lg)",
        }}
      >
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>الحالة</div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>
            <span
              style={{
                padding: "2px 10px",
                borderRadius: "999px",
                fontSize: 12,
                fontWeight: 600,
                background: "var(--text-muted)",
                color: "var(--bg-base)",
              }}
            >
              مسودة
            </span>
          </div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
            الأقسام
          </div>
          <div style={{ fontWeight: 600, marginTop: 4, fontSize: 24 }}>
            {course.sections}
          </div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>الدروس</div>
          <div style={{ fontWeight: 600, marginTop: 4, fontSize: 24 }}>
            {course.lessons}
          </div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
            الموارد
          </div>
          <div style={{ fontWeight: 600, marginTop: 4, fontSize: 24 }}>
            {course.resources}
          </div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
            الواجبات
          </div>
          <div style={{ fontWeight: 600, marginTop: 4, fontSize: 24 }}>
            {course.assignments}
          </div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
            الاختبارات
          </div>
          <div style={{ fontWeight: 600, marginTop: 4, fontSize: 24 }}>
            {course.exams}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "var(--space-md)",
        }}
      >
        <div className="card">
          <h2 style={{ marginBottom: "var(--space-md)" }}>جاهزية النشر</h2>
          <div style={{ display: "grid", gap: "var(--space-sm)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm)",
                borderRadius: "var(--radius-control)",
                background: "var(--color-action)20",
              }}
            >
              <span style={{ color: "var(--color-action)", fontSize: 18 }}>
                ✓
              </span>
              <span>عنوان الكورس</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm)",
                borderRadius: "var(--radius-control)",
                background: "var(--color-action)20",
              }}
            >
              <span style={{ color: "var(--color-action)", fontSize: 18 }}>
                ✓
              </span>
              <span>الوصف</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm)",
                borderRadius: "var(--radius-control)",
                background: "var(--color-action)20",
              }}
            >
              <span style={{ color: "var(--color-action)", fontSize: 18 }}>
                ✓
              </span>
              <span>هوية المعلم</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm)",
                borderRadius: "var(--radius-control)",
                background: "var(--color-action)20",
              }}
            >
              <span style={{ color: "var(--color-action)", fontSize: 18 }}>
                ✓
              </span>
              <span>الصورة المصغرة</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm)",
                borderRadius: "var(--radius-control)",
                background: "var(--color-action)20",
              }}
            >
              <span style={{ color: "var(--color-action)", fontSize: 18 }}>
                ✓
              </span>
              <span>الأقسام</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm)",
                borderRadius: "var(--radius-control)",
                background: "var(--color-action)20",
              }}
            >
              <span style={{ color: "var(--color-action)", fontSize: 18 }}>
                ✓
              </span>
              <span>الدروس</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm)",
                borderRadius: "var(--radius-control)",
                background: "#f59e0b20",
              }}
            >
              <span style={{ color: "#f59e0b", fontSize: 18 }}>⚠</span>
              <span>درس 1: فيديو قيد المعالجة</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm)",
                borderRadius: "var(--radius-control)",
                background: "#f59e0b20",
              }}
            >
              <span style={{ color: "#f59e0b", fontSize: 18 }}>⚠</span>
              <span>درس 5: لا يوجد محتوى</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm)",
                borderRadius: "var(--radius-control)",
                background: "#ef444420",
              }}
            >
              <span style={{ color: "#ef4444", fontSize: 18 }}>✕</span>
              <span>اختبار 1: لا يحتوي على أسئلة</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: "var(--space-md)" }}>معلومات الكورس</h2>
          <dl style={{ display: "grid", gap: "var(--space-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <dt style={{ color: "var(--text-muted)" }}>آخر حفظ</dt>
              <dd style={{ margin: 0 }}>{course.lastSaved}</dd>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <dt style={{ color: "var(--text-muted)" }}>آخر نشر</dt>
              <dd style={{ margin: 0, color: "var(--text-muted)" }}>
                {course.lastPublished ?? "—"}
              </dd>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <dt style={{ color: "var(--text-muted)" }}>الطلاب</dt>
              <dd style={{ margin: 0 }}>
                {course.students.toLocaleString("ar-EG")}
              </dd>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <dt style={{ color: "var(--text-muted)" }}>الإكمال</dt>
              <dd style={{ margin: 0 }}>{course.completion}%</dd>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <dt style={{ color: "var(--text-muted)" }}>الإيرادات</dt>
              <dd style={{ margin: 0 }}>
                {course.revenue > 0
                  ? `${course.revenue.toLocaleString("ar-EG")} ج.م`
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div
        style={{
          marginTop: "var(--space-lg)",
          display: "flex",
          gap: "var(--space-sm)",
        }}
      >
        <Link href="/teacher/courses/c2/preview">
          <button
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            معاينة الكورس
          </button>
        </Link>
        <button
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          نسخ الكورس
        </button>
        <button
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          أرشفة
        </button>
      </div>
    </>
  );
}
