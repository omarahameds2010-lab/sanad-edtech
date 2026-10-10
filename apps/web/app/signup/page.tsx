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

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-lg)",
        background: "var(--bg-reading)",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--paper-50)",
          color: "var(--ink-700)",
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 26, color: "var(--ink-950)" }}>
          {S.title}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 8px" }}>
          {S.subtitle}
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 4px" }}>
          {S.step} {step + 1} {S.of} 2
        </p>

        {/* 2px emerald progress: 50% → 100% */}
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
              transition: "width 350ms cubic-bezier(.2, 0, 0, 1)",
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
            {/* Step 1 — names + role */}
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
                style={{ display: "flex", gap: 8, marginBottom: 16 }}
              >
                {(["STUDENT", "TEACHER"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    aria-pressed={role === r}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: role === r ? "var(--tenant-accent)" : "transparent",
                      color: role === r ? "#ffffff" : "var(--ink-700)",
                      border: `1px solid ${role === r ? "var(--tenant-accent)" : "var(--paper-200)"}`,
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
                  style={{
                    width: "100%",
                    background: "var(--tenant-accent)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 999,
                    padding: "14px 24px",
                    fontWeight: 800,
                    fontSize: 16,
                    cursor: pending ? "wait" : "pointer",
                    opacity: pending ? 0.85 : 1,
                  }}
                >
                  {pending ? S.pending : S.submit}
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

        {/* step-1 errors surface under the form */}
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
    </main>
  );
}
