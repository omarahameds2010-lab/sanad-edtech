"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type UserProfile } from "@/app/lib/api";

const roleLabels: Record<string, string> = {
  STUDENT: "طالب",
  TEACHER: "مدرس",
  ADMIN: "مشرف",
  PARENT: "ولي أمر",
};

export default function StudentProfilePage() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .getProfile(token)
      .then(setProfile)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "تعذر تحميل الملف الشخصي"),
      );
  }, [token]);

  if (!token) {
    return (
      <div className="card">
        <p>
          سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
        </p>
      </div>
    );
  }

  if (error) return <div className="card"><p>{error}</p></div>;
  if (!profile) return <div className="card"><p>جاري التحميل…</p></div>;

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h1 style={{ marginBottom: "var(--space-md)" }}>الملف الشخصي</h1>
      <div style={{ display: "grid", gap: "var(--space-sm)", marginBottom: "var(--space-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted)" }}>الاسم</span>
          <strong>{profile.name}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted)" }}>الدور</span>
          <span>{roleLabels[profile.role] ?? profile.role}</span>
        </div>
        {profile.grade && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>الصف الدراسي</span>
            <span>{profile.grade}</span>
          </div>
        )}
      </div>
      <button
        onClick={() => {
          logout();
          router.push("/login");
        }}
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
      >
        تسجيل الخروج
      </button>
    </div>
  );
}
