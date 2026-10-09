"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type CurrentTenant } from "@/app/lib/api";

export default function TeacherSettingsPage() {
  const { token } = useAuth();
  const [tenant, setTenant] = useState<CurrentTenant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .getCurrentTenant(token)
      .then(setTenant)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "تعذر تحميل الإعدادات"),
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
  if (!tenant) return <div className="card"><p>جاري التحميل…</p></div>;

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h1 style={{ marginBottom: "var(--space-md)" }}>الإعدادات</h1>
      <div style={{ display: "grid", gap: "var(--space-sm)" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted)" }}>اسم المساحة</span>
          <strong>{tenant.name}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted)" }}>المعرّف (slug)</span>
          <span dir="ltr">{tenant.slug}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted)" }}>الحالة</span>
          <span>{tenant.status}</span>
        </div>
      </div>
    </div>
  );
}
