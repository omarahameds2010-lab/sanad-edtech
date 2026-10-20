"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/app/components/landing/i18n";
import { useAuth } from "@/app/lib/auth";
import {
  ApiError,
  api,
  buildFullName,
  isValidEgyptianPhone,
  landingForRole,
} from "@/app/lib/api";
import { Magnetic } from "@/app/components/landing/interactive";
import SiteFooter from "@/app/components/landing/SiteFooter";

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

const TEACHER_HALO = "0 24px 60px -24px rgba(79, 70, 229, 0.40)";
const STUDENT_HALO = "0 24px 60px -24px rgba(4, 120, 87, 0.35)";

export default function SignupPage() {
  const { t } = useLang();
  const { applySession } = useAuth();
  const router = useRouter();
  const S = t.signup;

  const [step, setStep] = useState<0 | 1>(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [par, setPar] = useState({ x: 0, y: 0 });

  function handleBrandMove(e: React.MouseEvent<HTMLElement>) {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setPar({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  }

  function goNext() {
    setError(null);
    if (buildFullName(firstName, lastName) === "") {
      setError(S.requiredNames);
      return;
    }
    setStep(1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEgyptianPhone(phone)) {
      setError(S.invalidPhone);
      return;
    }
    if (password.length < 8) {
      setError(S.shortPassword);
      return;
    }
    setPending(true);
    try {
      const result = await api.register({
        name: buildFullName(firstName, lastName),
        phone: phone.trim(),
        password,
        role,
      });
      applySession(result);
      router.push(landingForRole(result.user.role));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 409
            ? S.duplicate
            : err.status === 400
              ? S.invalid
              : err.message
          : S.offline,
      );
    } finally {
      setPending(false);
    }
  }

  const isTeacher = role === "TEACHER";

  return (
    <>
      <main className="lp-signup-split">
      {/* 45% — brand theater */}
      <section
        aria-label="Sanad"
        onMouseMove={handleBrandMove}
        onMouseLeave={() => setPar({ x: 0, y: 0 })}
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
        <div
          style={{
            transform: `translate3d(${par.x * 8}px, ${par.y * 6}px, 0)`,
            transition: "transform 250ms ease-out",
          }}
        >
          <Link
            href="/"
            style={{ fontWeight: 800, fontSize: 26, color: "#F4F4F6", textDecoration: "none", marginBottom: 32, display: "inline-block" }}
          >
            سند<span style={{ color: "#34D399" }}>.</span>
          </Link>
        </div>
        <div
          aria-hidden
          style={{
            fontSize: 120,
            fontWeight: 800,
            lineHeight: 1,
            opacity: 0.1,
            userSelect: "none",
            transform: `translate3d(${par.x * 22}px, ${par.y * 16}px, 0)`,
            transition: "transform 250ms ease-out",
          }}
        >
          ع
        </div>
        {S.brandLines.map((line, i) => (
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

      {/* 55% — aero-glass vault */}
      <section
        aria-label={S.title}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(24px, 5vw, 64px)",
          background: "var(--bg-reading)",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            background: "rgba(255, 255, 255, 0.72)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            boxShadow: `0 20px 50px -20px rgba(11, 13, 16, 0.18), ${isTeacher ? TEACHER_HALO : STUDENT_HALO}`,
            borderRadius: 32,
            padding: "clamp(24px, 4vw, 36px)",
            transition: "box-shadow 400ms ease",
          }}
        >
          <h1 style={{ margin: "0 0 8px", fontSize: 28, color: "var(--ink-950)" }}>
            {S.title}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 8px", lineHeight: 1.8 }}>
            {S.subtitle}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 4px" }}>
            {S.step} {step + 1} {S.of} 2
          </p>

          {/* Quantum progress thread — 2px, 50% → 100% */}
          <div
            role="progressbar"
            aria-valuenow={step === 0 ? 50 : 100}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              height: 2,
              borderRadius: 2,
              background: "var(--paper-200)",
              marginBottom: 24,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: step === 0 ? "50%" : "100%",
                background: "var(--tenant-accent)",
                boxShadow: "0 0 8px 1px rgba(4, 120, 87, 0.45)",
                transition: "width 450ms cubic-bezier(.34, 1.3, .64, 1)",
              }}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateAreas: '"pane"',
                alignItems: "start",
              }}
            >
              {/* Step 1 — names + context-aware role morph */}
              <div
                aria-hidden={step !== 0}
                style={{
                  gridArea: "pane",
                  opacity: step === 0 ? 1 : 0,
                  transform: step === 0 ? "none" : "translateX(24px)",
                  transition: "opacity 300ms ease, transform 300ms cubic-bezier(.2, 0, 0, 1)",
                  pointerEvents: step === 0 ? "auto" : "none",
                }}
              >
                <div
                  role="group"
                  aria-label={S.role}
                  style={{
                    position: "relative",
                    display: "flex",
                    gap: 0,
                    padding: 4,
                    marginBottom: 16,
                    borderRadius: 999,
                    border: "1px solid var(--paper-200)",
                    background: "rgba(250, 247, 242, 0.55)",
                  }}
                >
                  {/* sliding glass indicator */}
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: 4,
                      bottom: 4,
                      insetInlineStart: isTeacher ? "calc(50% + 0px)" : "4px",
                      width: "calc(50% - 4px)",
                      borderRadius: 999,
                      background: isTeacher ? "#4F46E5" : "var(--tenant-accent)",
                      transition: "inset-inline-start 300ms cubic-bezier(.34, 1.2, .64, 1), background 300ms ease",
                    }}
                  />
                  {(["STUDENT", "TEACHER"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      aria-pressed={role === r}
                      style={{
                        flex: 1,
                        position: "relative",
                        zIndex: 1,
                        padding: "10px",
                        borderRadius: 999,
                        border: "none",
                        background: "transparent",
                        fontWeight: 800,
                        cursor: "pointer",
                        color: role === r ? "#ffffff" : "var(--ink-700)",
                        transition: "color 250ms ease",
                      }}
                    >
                      {r === "STUDENT" ? S.roleStudent : S.roleTeacher}
                    </button>
                  ))}
                </div>

                <div className="lp-float" style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder=" "
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                  <label>{S.firstName}</label>
                </div>

                <div className="lp-float" style={{ marginBottom: 24 }}>
                  <input
                    type="text"
                    placeholder=" "
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                  <label>{S.lastName}</label>
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  style={{
                    width: "100%",
                    background: "var(--tenant-accent)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 999,
                    padding: "14px 24px",
                    fontWeight: 800,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  {S.next}
                </button>
              </div>

              {/* Step 2 — phone + password */}
              <div
                aria-hidden={step !== 1}
                style={{
                  gridArea: "pane",
                  opacity: step === 1 ? 1 : 0,
                  transform: step === 1 ? "none" : "translateX(-24px)",
                  transition: "opacity 300ms ease, transform 300ms cubic-bezier(.2, 0, 0, 1)",
                  pointerEvents: step === 1 ? "auto" : "none",
                }}
              >
                <div className="lp-float" style={{ marginBottom: 16 }}>
                  <input
                    type="tel"
                    dir="ltr"
                    placeholder=" "
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="username"
                  />
                  <label>{S.phone}</label>
                </div>

                <div className="lp-float" style={{ marginBottom: 24, display: "block" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{ paddingInlineEnd: 48 }}
                  />
                  <label>{S.password}</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? S.hide : S.show}
                    aria-pressed={showPassword}
                    style={{
                      position: "absolute",
                      insetInlineEnd: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
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
                        {S.pending}
                      </span>
                    ) : (
                      S.submit
                    )}
                  </button>
                </Magnetic>

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep(0);
                  }}
                  style={{
                    width: "100%",
                    marginTop: 8,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    fontSize: 14,
                  }}
                >
                  {S.back}
                </button>
              </div>
            </div>
          </form>

          {step === 0 && error && (
            <p
              role="alert"
              style={{
                color: "#991b1b",
                background: "#fee2e2",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                margin: "16px 0 0",
              }}
            >
              {error}
            </p>
          )}

          <p style={{ marginTop: 20, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
            {S.haveAccount}{" "}
            <Link href="/login" style={{ fontWeight: 700 }}>
              {S.loginLink}
            </Link>
          </p>
        </div>
      </section>
      </main>
      <SiteFooter compact />
    </>
  );
}
