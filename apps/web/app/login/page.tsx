"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { ApiError, landingForRole } from "@/app/lib/api";
import { Magnetic } from "@/app/components/landing/interactive";
import { LanguageSwitcher, useLang } from "@/app/components/landing/i18n";

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <line x1="4" y1="4" x2="20" y2="20" />}
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const L = t.login;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await login(phone.trim(), password);
      router.push(landingForRole(result.user.role));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 401
            ? L.invalid
            : err.message
          : L.offline,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="lp-login-split">
      <section
        aria-label="Sanad"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "var(--ink-950)",
          color: "#F4F4F6",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "clamp(32px, 6vw, 72px)",
          minHeight: 320,
        }}
      >
        <div aria-hidden className="lp-blob" style={{ width: 280, height: 280, background: "#047857", top: -60, insetInlineEnd: -60 }} />
        <div aria-hidden className="lp-blob" style={{ width: 200, height: 200, background: "#4F46E5", bottom: -40, insetInlineStart: "30%", animationDelay: "3s" }} />
        <Link
          href="/"
          style={{ fontWeight: 800, fontSize: 26, color: "#F4F4F6", textDecoration: "none", marginBottom: 32 }}
        >
          سند<span style={{ color: "#34D399" }}>.</span>
        </Link>
        <div aria-hidden style={{ fontSize: 120, fontWeight: 800, lineHeight: 1, opacity: 0.1, userSelect: "none" }}>
          ع
        </div>
        {L.brandLines.map((line, i) => (
          <p
            key={line.strong}
            className="lp-line-rise"
            style={{ ["--lp-d" as string]: `${200 + i * 160}ms`, fontSize: 19, lineHeight: 1.9, color: "rgba(244, 244, 246, 0.55)", margin: "12px 0 0", maxWidth: 420 } as React.CSSProperties}
          >
            <strong style={{ color: "#ffffff", fontWeight: 800 }}>{line.strong}</strong>
            {line.rest}
          </p>
        ))}
      </section>

      <section
        aria-label={L.title}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(24px, 5vw, 64px)",
          background: "var(--bg-reading)",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 20, insetInlineEnd: 20 }}>
          <LanguageSwitcher />
        </div>
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            maxWidth: 400,
            background: "rgba(255, 255, 255, 0.72)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            boxShadow: "0 20px 50px -20px rgba(11, 13, 16, 0.18)",
            borderRadius: 24,
            padding: "clamp(24px, 4vw, 36px)",
          }}
        >
          <h1 style={{ margin: "0 0 8px", fontSize: 28, color: "var(--ink-950)" }}>{L.title}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 28px", lineHeight: 1.8 }}>
            {L.subtitle}
          </p>

          <div className="lp-float" style={{ marginBottom: 16 }}>
            <input
              type="tel"
              dir="ltr"
              placeholder=" "
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="username"
            />
            <label>{L.phone}</label>
          </div>

          <div className="lp-float" style={{ marginBottom: 24, display: "block" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{ paddingInlineEnd: 48 }}
            />
            <label>{L.password}</label>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? L.hide : L.show}
              aria-pressed={showPassword}
              style={{
                position: "absolute",
                insetInlineEnd: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: showPassword ? "var(--color-action-strong)" : "var(--text-muted)",
                padding: 6,
                display: "flex",
              }}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>

          {error && (
            <p
              role="alert"
              style={{
                color: "#991b1b",
                background: "#fee2e2",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                margin: "0 0 16px",
              }}
            >
              {error}
            </p>
          )}

          <Magnetic>
            <button
              type="submit"
              disabled={pending}
              className="lp-login-btn"
              style={{
                width: "100%",
                background: "linear-gradient(135deg, var(--color-action-strong) 0%, #0B3B5B 130%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 999,
                padding: "14px 24px",
                fontWeight: 800,
                fontSize: 17,
                cursor: pending ? "wait" : "pointer",
                opacity: pending ? 0.85 : 1,
                transition: "transform 180ms ease-out, filter 200ms ease",
              }}
            >
              <span aria-hidden className="lp-thread" />
              <span aria-hidden className="lp-pulse" />
              {pending ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <span className="lp-spinner" aria-hidden />
                  {L.pending}
                </span>
              ) : (
                L.submit
              )}
            </button>
          </Magnetic>
          <p style={{ marginTop: 20, fontSize: 13, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.8 }}>
            {L.signupPrompt}{" "}
            <Link href="/signup" style={{ fontWeight: 700 }}>
              {L.signupLink}
            </Link>
            <br />
            <Link href="/" style={{ fontWeight: 700 }}>
              {L.back}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
