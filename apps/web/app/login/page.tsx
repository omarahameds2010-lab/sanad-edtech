"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { ApiError } from "@/app/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(phone.trim(), password);
      // Role is in context after login; route optimistically to student home.
      // Role-aware landing is resolved on the dashboard via /api/auth/me.
      router.push("/student");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 401
            ? "بيانات الدخول غير صحيحة"
            : err.message
          : "تعذر الاتصال بالخادم",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-lg)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ width: "100%", maxWidth: 400 }}
      >
        <h1 style={{ marginBottom: "var(--space-sm)" }}>تسجيل الدخول</h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: 14,
            marginBottom: "var(--space-lg)",
          }}
        >
          ادخل برقم الموبايل وكلمة السر الخاصة بحسابك
        </p>

        <label style={{ display: "block", marginBottom: "var(--space-md)" }}>
          <span style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            رقم الموبايل
          </span>
          <input
            type="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "var(--space-lg)" }}>
          <span style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            كلمة السر
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </label>

        {error && (
          <p style={{ color: "#ef4444", fontSize: 13, marginBottom: "var(--space-md)" }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} style={{ width: "100%" }}>
          {pending ? "جاري الدخول…" : "دخول"}
        </button>
      </form>
    </main>
  );
}
