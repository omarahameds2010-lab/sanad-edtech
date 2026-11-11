"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { ApiError, landingForRole } from "@/app/lib/api";
import { useLang } from "@/app/components/landing/i18n";
import { DEMO_ACCOUNTS, DEMO_FILM_URL, type DemoRole } from "@/app/lib/demo";

function StudentIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m3 9 9-4 9 4-9 4z" />
      <path d="M7 11.5V16c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.5" />
      <path d="M21 9v5" />
    </svg>
  );
}

function TeacherIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.7-3 2.6-4.5 5.5-4.5s4.8 1.5 5.5 4.5" />
      <path d="M16 5.5h4.5v10H16z" />
      <path d="M18.2 9.5v2.2M18.2 13.8v.1" />
    </svg>
  );
}

function Spinner() {
  return <span className="lp-spinner" aria-hidden />;
}

export default function DemoAccess({
  compact = false,
  showManual = false,
}: {
  compact?: boolean;
  showManual?: boolean;
}) {
  const { login } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const D = t.demo;
  const [pending, setPending] = useState<DemoRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function enter(role: DemoRole) {
    if (pending) return;
    setError(null);
    setPending(role);
    try {
      const result = await login(
        DEMO_ACCOUNTS[role].phone,
        DEMO_ACCOUNTS[role].password,
        { demo: true },
      );
      router.push(landingForRole(result.user.role));
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401 ? D.invalid : D.offline,
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div className={`lp-demo-access${compact ? " is-compact" : ""}`}>
      <div className="lp-demo-actions">
        <button
          type="button"
          className="lp-demo-btn lp-demo-btn-student"
          onClick={() => void enter("student")}
          disabled={Boolean(pending)}
          aria-busy={pending === "student"}
        >
          <span className="lp-demo-btn-icon">
            {pending === "student" ? <Spinner /> : <StudentIcon />}
          </span>
          <span className="lp-demo-btn-copy">
            <strong>{pending === "student" ? D.pending : D.studentCta}</strong>
            <span className="lp-demo-btn-hint">{D.studentHint}</span>
          </span>
        </button>

        <button
          type="button"
          className="lp-demo-btn lp-demo-btn-teacher"
          onClick={() => void enter("teacher")}
          disabled={Boolean(pending)}
          aria-busy={pending === "teacher"}
        >
          <span className="lp-demo-btn-icon">
            {pending === "teacher" ? <Spinner /> : <TeacherIcon />}
          </span>
          <span className="lp-demo-btn-copy">
            <strong>{pending === "teacher" ? D.pending : D.teacherCta}</strong>
            <span className="lp-demo-btn-hint">{D.teacherHint}</span>
          </span>
        </button>
      </div>

      <p className="lp-demo-note">{D.noSignup}</p>

      {error && (
        <div className="lp-demo-error" role="alert">
          <span>{error}</span>
          <a href={DEMO_FILM_URL} target="_blank" rel="noreferrer">
            {D.film} ↗
          </a>
        </div>
      )}

      {showManual && (
        <details className="lp-demo-manual">
          <summary>{D.manual}</summary>
          <div className="lp-demo-manual-grid">
            <div>
              <strong>{D.student}</strong>
              <span>
                {D.phone}: <code dir="ltr">{DEMO_ACCOUNTS.student.phone}</code>
              </span>
              <span>
                {D.password}:{" "}
                <code dir="ltr">{DEMO_ACCOUNTS.student.password}</code>
              </span>
            </div>
            <div>
              <strong>{D.teacher}</strong>
              <span>
                {D.phone}: <code dir="ltr">{DEMO_ACCOUNTS.teacher.phone}</code>
              </span>
              <span>
                {D.password}:{" "}
                <code dir="ltr">{DEMO_ACCOUNTS.teacher.password}</code>
              </span>
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
