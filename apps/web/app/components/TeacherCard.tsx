import Link from "next/link";

interface TeacherCardProps {
  slug: string;
  subject: string;
  teacherName: string;
  focusAreas: string;
  courseCount: number;
  motif: "orbit" | "grid" | "ink";
  tagline?: string;
  studentCount?: number;
}

const motifStyles: Record<TeacherCardProps["motif"], string> = {
  orbit:
    "radial-gradient(circle at 30% 30%, var(--tenant-accent) 0, transparent 60%)",
  grid: "linear-gradient(var(--tenant-accent) 1px, transparent 1px), linear-gradient(90deg, var(--tenant-accent) 1px, transparent 1px)",
  ink: "repeating-linear-gradient(45deg, var(--tenant-accent) 0 2px, transparent 2px 12px)",
};

export default function TeacherCard({
  slug,
  subject,
  teacherName,
  focusAreas,
  courseCount,
  motif,
  tagline,
  studentCount,
}: TeacherCardProps) {
  return (
    <article className="ts-teacher-card lp-lift">
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: motifStyles[motif],
          backgroundSize: motif === "grid" ? "24px 24px" : undefined,
          opacity: "var(--tenant-motif-opacity, 0.08)",
        }}
      />
      <div style={{ position: "relative" }}>
        <span
          style={{
            display: "inline-block",
            borderRadius: 999,
            padding: "5px 14px",
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--color-action-strong)",
            background: "var(--color-action-soft)",
          }}
        >
          {subject}
        </span>
        <h2 style={{ margin: "14px 0 2px", fontSize: 22 }}>{teacherName}</h2>
        {tagline && (
          <p
            style={{
              margin: 0,
              color: "var(--color-action-strong)",
              fontWeight: 700,
              fontSize: 14.5,
            }}
          >
            {tagline}
          </p>
        )}
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: 14,
            lineHeight: 1.8,
            margin: "10px 0 0",
          }}
        >
          {focusAreas}
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 12 }}>
          {courseCount} كورسات
          {studentCount !== undefined
            ? ` · ${studentCount.toLocaleString("ar-EG")} طالب`
            : " · التسجيل مفتوح"}
        </p>
        <Link
          href={`/teachers/${slug}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 18,
            fontWeight: 700,
          }}
        >
          دخول المساحة <span aria-hidden>←</span>
        </Link>
      </div>
    </article>
  );
}
