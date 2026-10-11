import Image from "next/image";

const courses = [
  {
    id: "c1",
    title: "الفيزياء للمرحلة الثانوية",
    slug: "physics-secondary",
    status: "PUBLISHED",
    thumbnail: "https://picsum.photos/seed/physics/400/225",
    students: 1240,
    completion: 68,
    revenue: 18400,
    lastUpdated: "2026-10-01",
  },
  {
    id: "c2",
    title: "الرياضيات - جبر وهندسة",
    slug: "math-algebra-geometry",
    status: "DRAFT",
    thumbnail: "https://picsum.photos/seed/math/400/225",
    students: 0,
    completion: 0,
    revenue: 0,
    lastUpdated: "2026-10-05",
  },
  {
    id: "c3",
    title: "اللغة العربية - نحو وبلاغة",
    slug: "arabic-grammar",
    status: "PUBLISHED",
    thumbnail: "https://picsum.photos/seed/arabic/400/225",
    students: 980,
    completion: 72,
    revenue: 12600,
    lastUpdated: "2026-09-28",
  },
];

const statusLabels: Record<string, string> = {
  PUBLISHED: "منشور",
  DRAFT: "مسودة",
  UNPUBLISHED: "غير منشور",
  ARCHIVED: "مؤرشف",
};

const statusColors: Record<string, string> = {
  PUBLISHED: "var(--color-action)",
  DRAFT: "var(--text-muted)",
  UNPUBLISHED: "#f59e0b",
  ARCHIVED: "#6b7280",
};

export default function CoursesPage() {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-lg)",
        }}
      >
        <h1>الكورسات</h1>
        <a href="/teacher/courses/new">
          <button>+ كورس جديد</button>
        </a>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                textAlign: "right",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <th style={{ padding: "var(--space-md)" }}>الكورس</th>
              <th style={{ padding: "var(--space-md)" }}>الحالة</th>
              <th style={{ padding: "var(--space-md)" }}>الطلاب</th>
              <th style={{ padding: "var(--space-md)" }}>الإكمال</th>
              <th style={{ padding: "var(--space-md)" }}>الإيرادات</th>
              <th style={{ padding: "var(--space-md)" }}>آخر تحديث</th>
              <th style={{ padding: "var(--space-md)" }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr
                key={course.id}
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <td style={{ padding: "var(--space-md)" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-md)",
                    }}
                  >
                    <Image
                      src={course.thumbnail}
                      alt={course.title}
                      width={64}
                      height={36}
                      style={{
                        borderRadius: "var(--radius-control)",
                        objectFit: "cover",
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>{course.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {course.slug}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "var(--space-md)" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 10px",
                      borderRadius: "999px",
                      fontSize: 12,
                      fontWeight: 600,
                      background: `${statusColors[course.status]}20`,
                      color: statusColors[course.status],
                    }}
                  >
                    {statusLabels[course.status]}
                  </span>
                </td>
                <td style={{ padding: "var(--space-md)" }}>
                  {course.students.toLocaleString("ar-EG")}
                </td>
                <td style={{ padding: "var(--space-md)" }}>
                  {course.completion}%
                </td>
                <td style={{ padding: "var(--space-md)" }}>
                  {course.revenue > 0
                    ? `${course.revenue.toLocaleString("ar-EG")} ج.م`
                    : "—"}
                </td>
                <td
                  style={{
                    padding: "var(--space-md)",
                    color: "var(--text-muted)",
                    fontSize: 13,
                  }}
                >
                  {course.lastUpdated}
                </td>
                <td style={{ padding: "var(--space-md)" }}>
                  <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                    <a
                      href={`/teacher/courses/${course.id}`}
                      style={{ fontWeight: 600 }}
                    >
                      تحرير
                    </a>
                    <a
                      href={`/teacher/courses/${course.id}/preview`}
                      style={{ color: "var(--text-muted)" }}
                    >
                      معاينة
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
