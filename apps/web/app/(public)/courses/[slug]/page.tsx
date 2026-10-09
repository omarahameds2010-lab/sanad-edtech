"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type CourseStructure } from "@/app/lib/api";

const typeLabels: Record<string, string> = {
  VIDEO: "فيديو",
  PDF: "ملف",
  QUIZ: "اختبار قصير",
  LIVE: "بث مباشر",
  ASSIGNMENT: "واجب",
  EXAM: "اختبار",
  RESOURCE: "مورد",
};

function formatPrice(price: number | string, currency: string): string {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return "مجاني";
  return `${n.toFixed(2)} ${currency}`;
}

export default function PublicCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { token } = useAuth();
  const router = useRouter();
  const [slug, setSlug] = useState<string | null>(null);
  const [data, setData] = useState<CourseStructure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    api
      .getCourseStructureBySlug(slug)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof ApiError ? e.message : "تعذر تحميل الكورس");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleEnroll() {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!data) return;
    setEnrolling(true);
    setNotice(null);
    try {
      await api.enrollCourse(token, data.course.id);
      router.push("/student/courses");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setNotice("أنت مسجل في هذا الكورس بالفعل.");
      } else {
        setNotice(e instanceof ApiError ? e.message : "تعذر التسجيل في الكورس");
      }
    } finally {
      setEnrolling(false);
    }
  }

  if (error) {
    return (
      <div className="card">
        <p style={{ color: "#ef4444" }}>{error}</p>
        <p style={{ marginTop: 8 }}>
          <Link href="/courses">العودة إلى الكورسات</Link>
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <p>جاري تحميل الكورس…</p>
      </div>
    );
  }

  const lessonCount = data.sections.reduce((n, s) => n + s.lessons.length, 0);

  return (
    <div style={{ maxWidth: 860 }}>
      <nav style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "var(--space-sm)" }}>
        <Link href="/courses">الكورسات</Link> › {data.course.title}
      </nav>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: "var(--space-lg)",
          alignItems: "start",
        }}
      >
        <div>
          <h1 style={{ marginBottom: 8 }}>{data.course.title}</h1>
          {data.course.shortDescription && (
            <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-md)" }}>
              {data.course.shortDescription}
            </p>
          )}
          {data.course.description && (
            <p style={{ marginBottom: "var(--space-lg)", fontSize: 14 }}>
              {data.course.description}
            </p>
          )}

          <h2 style={{ fontSize: 16, marginBottom: "var(--space-sm)" }}>
            المحتوى ({lessonCount} {lessonCount === 1 ? "درس" : "دروس"})
          </h2>
          {data.sections.map((section) => (
            <section key={section.id} style={{ marginBottom: "var(--space-md)" }}>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>{section.title}</h3>
              <div style={{ display: "grid", gap: 6 }}>
                {section.lessons.map((lesson, i) => (
                  <div
                    key={lesson.id}
                    className="card"
                    style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px" }}
                  >
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 14 }}>{lesson.title}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {typeLabels[lesson.type] ?? lesson.type}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="card" style={{ position: "sticky", top: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
            {formatPrice(data.course.price, data.course.currency)}
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "var(--space-md)" }}>
            {data.course.teacher.name
              ? `المدرس: ${data.course.teacher.name}`
              : ""}
          </p>
          {notice && (
            <p style={{ fontSize: 13, marginBottom: "var(--space-sm)" }}>{notice}</p>
          )}
          <button
            onClick={() => void handleEnroll()}
            disabled={enrolling}
            style={{ width: "100%" }}
          >
            {enrolling ? "جاري التسجيل…" : token ? "سجّل الآن" : "سجّل الدخول للتسجيل"}
          </button>
        </aside>
      </div>
    </div>
  );
}
