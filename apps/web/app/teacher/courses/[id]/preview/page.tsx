"use client";

import Image from "next/image";
import Link from "next/link";

const course = {
  title: "الرياضيات - جبر وهندسة",
  description:
    "كورس شامل يغطي الجبر والهندسة للمرحلة الثانوية. يتضمن 14 درسًا مقسّمة على 3 وحدات، مع تمارين واختبارات تفاعلية.",
  teacher: "مهندس خالد",
  thumbnail: "https://picsum.photos/seed/math/800/450",
  price: "500 ج.م",
  students: 0,
  sections: [
    {
      title: "الوحدة 1: أساسيات الجبر",
      lessons: [
        {
          id: "l1",
          title: "مقدمة في المتغيرات",
          type: "VID",
          duration: "12:00",
          isPreview: true,
        },
        { id: "l2", title: "المعادلات الخطية", type: "VID", duration: "15:00" },
        { id: "l3", title: "ورقة عمل: المتغيرات", type: "PDF", size: "1.2 MB" },
        {
          id: "l4",
          title: "واجب: حل المعادلات",
          type: "ASSIGN",
          tries: "300 دقيقة",
        },
      ],
    },
    {
      title: "الوحدة 2: الدوال والتركيب",
      lessons: [
        { id: "l5", title: "مفهوم الدالة", type: "VID", duration: "17:00" },
        { id: "l6", title: "الدوال الخطية", type: "VID", duration: "14:00" },
        {
          id: "l7",
          title: "تمارين: الدوال",
          type: "ASSIGN",
          tries: "300 دقيقة",
        },
      ],
    },
    {
      title: "الوحدة 3: الهندسة التحليلية",
      lessons: [
        {
          id: "l8",
          title: "الإحداثيات والمستقيمات",
          type: "VID",
          duration: "16:00",
        },
        {
          id: "l9",
          title: "المسافات ومنتصف القطعة",
          type: "VID",
          duration: "13:00",
        },
        {
          id: "l10",
          title: "اختبار: الهندسة التحليلية",
          type: "EXAM",
          duration: "70 دقيقة",
        },
      ],
    },
  ],
};

const typeBadge: Record<string, string> = {
  VID: "#3b82f6",
  PDF: "#10b981",
  ASSIGN: "#f59e0b",
  EXAM: "#ef4444",
};

export default function CoursePreviewPage() {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 16px",
          background: "#3b82f6",
          color: "white",
          marginBottom: "var(--space-md)",
          borderRadius: "var(--radius-control)",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <span>وضع المعاينة — هذا الدرس سيراه الطالب كما هو</span>
        <Link
          href="/teacher/courses/c2"
          style={{ color: "white", textDecoration: "underline" }}
        >
          العودة للكورس
        </Link>
      </div>

      <div
        style={{
          height: 320,
          borderRadius: "var(--radius-card)",
          overflow: "hidden",
          position: "relative",
          marginBottom: "var(--space-lg)",
        }}
      >
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "var(--space-lg)",
            right: "var(--space-lg)",
            color: "white",
          }}
        >
          <h1 style={{ color: "white", margin: 0 }}>{course.title}</h1>
          <p style={{ marginTop: 4, opacity: 0.9 }}>بواسطة {course.teacher}</p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "var(--space-lg)",
          maxWidth: 1200,
        }}
      >
        <div>
          <h2>عن الكورس</h2>
          <p style={{ color: "var(--text-muted)" }}>{course.description}</p>

          <h2 style={{ marginTop: "var(--space-lg)" }}>المحتوى الدراسي</h2>
          {course.sections.map((section, i) => (
            <div
              key={i}
              className="card"
              style={{ marginBottom: "var(--space-sm)" }}
            >
              <h3 style={{ margin: "0 0 var(--space-md)" }}>{section.title}</h3>
              <div style={{ display: "grid", gap: "var(--space-xs)" }}>
                {section.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-sm)",
                      padding: "var(--space-sm)",
                      borderRadius: "var(--radius-control)",
                      background: "var(--bg-surface)",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: typeBadge[lesson.type],
                        background: `${typeBadge[lesson.type]}20`,
                      }}
                    >
                      {lesson.type}
                    </span>
                    <span style={{ flex: 1, fontSize: 14 }}>
                      {lesson.title}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {lesson.duration ||
                        lesson.size ||
                        (lesson as any).tries ||
                        ""}
                    </span>
                    {(lesson as any).isPreview && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--color-action)",
                          fontWeight: 600,
                        }}
                      >
                        معاينة مجانية
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside>
          <div
            className="card"
            style={{ position: "sticky", top: "var(--space-md)" }}
          >
            <h3 style={{ marginBottom: "var(--space-md)" }}>{course.price}</h3>
            <button style={{ width: "100%", marginBottom: "var(--space-sm)" }}>
              اشترك الآن
            </button>
            <button
              style={{
                width: "100%",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              أضف للمفضلة
            </button>
            <div
              style={{
                marginTop: "var(--space-md)",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              <p>📚 14 دروس</p>
              <p>📄 8 موارد</p>
              <p>📝 واجيبن واختبار</p>
              <p>⏱ حوالي 3 ساعات تدريب</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
