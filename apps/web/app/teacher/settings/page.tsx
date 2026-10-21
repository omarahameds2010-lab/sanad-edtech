"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type CurrentTenant } from "@/app/lib/api";
import LogoutButton from "@/app/components/LogoutButton";

export default function TeacherSettingsPage() {
  const { token, userName } = useAuth();
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

  if (error)
    return (
      <div className="card">
        <p>{error}</p>
      </div>
    );
  if (!tenant)
    return (
      <div className="card">
        <p>جاري التحميل…</p>
      </div>
    );

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

      <div
        style={{
          marginTop: "var(--space-lg)",
          paddingTop: "var(--space-lg)",
          borderTop: "1px solid var(--paper-200)",
        }}
      >
        <h2 style={{ margin: "0 0 var(--space-sm)", fontSize: 18 }}>
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
          <strong style={{ color: "var(--ink-950)" }}>
            {userName ?? "حسابك"}
          </strong>
          {"."} لو خلصت شغلك، اقفل الجلسة بأمان.
        </p>
        <LogoutButton />
      </div>
    </div>
  );
}
