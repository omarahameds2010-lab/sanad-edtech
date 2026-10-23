"use client";

import { useEffect, useState } from "react";

interface SubmissionTheaterProps {
  startedAt: number;
  elapsedMs: number | null;
  done: boolean;
}

const STAGES = [
  {
    label: "عزل الطلب داخل نطاق الطالب",
    detail: "tenant scope · server-side",
  },
  {
    label: "تثبيت الإجابة في قاعدة البيانات",
    detail: "assignment_submissions",
  },
  {
    label: "فتح مسار المراجعة",
    detail: "server-side lifecycle",
  },
] as const;

export default function SubmissionTheater({
  startedAt,
  elapsedMs,
  done,
}: SubmissionTheaterProps) {
  const [clock, setClock] = useState(() => performance.now());

  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => setClock(performance.now()), 80);
    return () => window.clearInterval(timer);
  }, [done]);

  const elapsed = Math.max(0, elapsedMs ?? clock - startedAt);
  const time =
    elapsed >= 1000
      ? `${(elapsed / 1000).toFixed(2)} ث`
      : `${Math.round(elapsed)} ms`;

  return (
    <div
      className="at-theater"
      data-done={done ? "true" : "false"}
      role="status"
      aria-live="polite"
      aria-label={done ? "تم استلام التسليم" : "جاري تسليم الواجب"}
    >
      <div className="at-theater-mesh" aria-hidden />
      <div className="at-theater-card">
        <div className="at-theater-head">
          <span className="at-theater-seal" aria-hidden>
            <span />
          </span>
          <div>
            <span className="at-theater-eyebrow">
              {done ? "تم استلام الطلب" : "الطلب قيد المعالجة"}
            </span>
            <h2>{done ? "الإجابة وصلت بأمان" : "بنسجّل إجابتك الآن…"}</h2>
          </div>
          <span className="at-theater-clock" dir="ltr">
            {time}
          </span>
        </div>

        <div className="at-theater-track" aria-hidden>
          <span className="at-theater-scan" />
        </div>

        <ul className="at-theater-stages">
          {STAGES.map((stage, index) => (
            <li
              key={stage.label}
              className="at-theater-stage"
              data-stage={done ? "done" : index === 0 ? "active" : "queued"}
            >
              <span className="at-theater-node" aria-hidden>
                {done ? "✓" : index + 1}
              </span>
              <span className="at-theater-stage-copy">
                <strong>{stage.label}</strong>
                <span dir="ltr">{stage.detail}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="at-theater-foot">
          {done
            ? "تم تثبيت التسليم. المراجعة الرسمية مسؤولية المعلم."
            : "بنحافظ على الطلب داخل نطاقك الآمن — من غير ما تسيب الصفحة."}
        </p>
        <p className="at-theater-time-note">
          الزمن المعروض هو زمن الطلب الفعلي، مش رقم تجميلي.
        </p>
      </div>
    </div>
  );
}
