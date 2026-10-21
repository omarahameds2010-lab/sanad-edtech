"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import {
  api,
  ApiError,
  type EnrollmentItem,
  type UserProfile,
} from "@/app/lib/api";
import LogoutButton from "@/app/components/LogoutButton";

const roleLabels: Record<string, string> = {
  STUDENT: "طالب",
  TEACHER: "مدرس",
  ADMIN: "مشرف",
};

function PassportCard({ profile }: { profile: UserProfile }) {
  const ref = useRef<HTMLElement>(null);
  const [sealLit, setSealLit] = useState(false);
  const initial = (profile.name?.trim()?.[0] ?? "ط").toUpperCase();

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg)`;
  }

  function onLeave() {
    const el = ref.current;
    if (el)
      el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    setSealLit(false);
  }

  return (
    <article
      ref={ref}
      aria-label="بطاقة الهوية التعليمية"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseEnter={() => setSealLit(true)}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 24,
        padding: "clamp(24px, 4vw, 36px)",
        background:
          "linear-gradient(150deg, rgba(20,23,28,0.97) 0%, rgba(11,13,16,0.99) 55%, rgba(4,60,46,0.35) 130%)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#F4F4F6",
        transition: "transform 200ms ease-out",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          insetInlineEnd: -70,
          top: -70,
          width: 230,
          height: 230,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(4,120,87,0.28) 0%, transparent 65%)",
          filter: "blur(30px)",
          opacity: sealLit ? 1 : 0.55,
          transition: "opacity 400ms ease",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          gap: 24,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 38,
            fontWeight: 800,
            color: "#F4F4F6",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.16)",
            boxShadow: "0 0 0 4px rgba(4,120,87,0.15)",
          }}
        >
          {initial}
        </div>
        <div style={{ flex: "1 1 220px" }}>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 13,
              color: "#34D399",
              fontWeight: 700,
            }}
          >
            جواز سند التعليمي
          </p>
          <h2 style={{ margin: "0 0 4px", fontSize: 28, color: "#F4F4F6" }}>
            {profile.name}
          </h2>
          <p style={{ margin: 0, color: "#A7ADBA", fontSize: 14 }}>
            {roleLabels[profile.role] ?? profile.role}
          </p>
          <p
            aria-live="polite"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 14,
              fontSize: 13,
              fontWeight: 700,
              color: sealLit ? "#34D399" : "#A7ADBA",
              background: sealLit
                ? "rgba(52,211,153,0.12)"
                : "rgba(255,255,255,0.05)",
              border: `1px solid ${sealLit ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 999,
              padding: "6px 14px",
              transition: "all 300ms ease",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#34D399",
                boxShadow: "0 0 8px 2px rgba(52,211,153,0.6)",
                animation: "lp-dot-pulse 2.6s ease-in-out infinite",
              }}
            />
            جلسة نشطة الآن
          </p>
        </div>
      </div>
    </article>
  );
}

export default function StudentProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([api.getProfile(token), api.getMyEnrollments(token)])
      .then(([p, e]) => {
        setProfile(p);
        setEnrollments(e);
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "تعذر تحميل الملف الشخصي"),
      );
  }, [token]);

  if (!token) {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <p style={{ margin: "0 0 16px" }}>سجّل الدخول أولًا.</p>
        <Link href="/login" className="lp-btn lp-btn-primary">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  if (error)
    return (
      <div className="card" style={{ padding: 32 }}>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    );
  if (!profile || !enrollments) {
    return (
      <div className="card" style={{ padding: 32 }}>
        <p style={{ margin: 0 }}>جاري تحميل ملفك…</p>
      </div>
    );
  }

  const active = enrollments.filter((e) => e.status === "ACTIVE");

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <p className="lp-eyebrow" style={{ marginBottom: 8 }}>
          حسابي
        </p>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(26px, 4vw, 36px)",
            color: "var(--ink-950)",
          }}
        >
          الملف الشخصي
        </h1>
      </header>

      <PassportCard profile={profile} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 16,
        }}
      >
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "var(--color-action-strong)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {active.length}
          </div>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            كورسات نشطة
          </p>
        </div>
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "var(--color-action-strong)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {enrollments.length}
          </div>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            إجمالي التسجيلات
          </p>
        </div>
      </div>

      <section aria-label="كورساتي" style={{ marginTop: 20 }}>
        <h2
          style={{ margin: "0 0 12px", fontSize: 20, color: "var(--ink-950)" }}
        >
          كورساتي
        </h2>
        {enrollments.length === 0 ? (
          <div className="card" style={{ padding: 24 }}>
            <p style={{ margin: "0 0 12px", color: "var(--text-muted)" }}>
              لست مسجلًا في أي كورس بعد.
            </p>
            <Link href="/courses" className="lp-btn lp-btn-secondary">
              تصفح الكورسات
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {enrollments.map((en) => (
              <Link
                key={en.id}
                href={`/student/courses/${en.course.id}`}
                className="card lp-lift"
                style={{ display: "block", padding: 20 }}
              >
                <h3 style={{ margin: "0 0 4px", color: "var(--ink-950)" }}>
                  {en.course.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "var(--text-muted)",
                  }}
                >
                  مسجل منذ: {new Date(en.startsAt).toLocaleDateString("ar-EG")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section
        className="card"
        style={{
          marginTop: 20,
          padding: 20,
          borderColor: "rgba(220, 38, 38, 0.18)",
        }}
      >
        <h2
          style={{
            margin: "0 0 var(--space-sm)",
            fontSize: 18,
            color: "var(--ink-950)",
          }}
        >
          تسجيل الخروج
        </h2>
        <p
          style={{
            margin: "0 0 var(--space-md)",
            color: "var(--text-muted)",
            fontSize: 14,
            lineHeight: 1.8,
          }}
        >
          مسجّل دخول كـ{" "}
          <strong style={{ color: "var(--ink-950)" }}>{profile.name}</strong>
          {"."} لو خلصت، اقفل الجلسة بأمان.
        </p>
        <LogoutButton />
      </section>
    </div>
  );
}
