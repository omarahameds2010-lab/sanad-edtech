"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { Reveal } from "./interactive";
import { useLang } from "./i18n";

function GlowCard({
  accent,
  wide,
  tall,
  children,
  label,
}: {
  accent: string;
  wide?: boolean;
  tall?: boolean;
  children: React.ReactNode;
  label: string;
}) {
  function onMove(e: React.MouseEvent<HTMLElement>) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--gx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  }

  return (
    <article
      aria-label={label}
      onMouseMove={onMove}
      className={`lp-bento-card lp-lift${wide ? " lp-bento-wide" : ""}${tall ? " lp-bento-tall" : ""}`}
      style={
        {
          "--glow": `${accent}2e`,
          background: "#ffffff",
          border: "1px solid var(--paper-200)",
          borderTop: `4px solid ${accent}`,
          borderRadius: "var(--radius-lg)",
          padding: 22,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        } as CSSProperties
      }
    >
      <div aria-hidden className="lp-bento-glow" />
      <div style={{ position: "relative" }}>{children}</div>
    </article>
  );
}

function Token({ letter, accent, soft }: { letter: string; accent: string; soft: string }) {
  return (
    <div
      aria-hidden
      className="lp-token"
      style={{
        width: 56,
        height: 56,
        borderRadius: 14,
        background: soft,
        color: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        fontWeight: 800,
        marginBottom: 14,
      }}
    >
      {letter}
    </div>
  );
}

function UnveilCta({ accent, label }: { accent: string; label: string }) {
  return (
    <div className="lp-unveil">
      <div>
        <Link
          href="/courses"
          style={{ color: accent, fontWeight: 700, fontSize: 14 }}
        >
          {label}
        </Link>
      </div>
    </div>
  );
}

export default function Subjects() {
  const { t, lang } = useLang();
  const list = t.subjects.list;
  const byLetter = (ch: string) => list.find((s) => s.letter === ch) ?? list[0];
  const arabic = byLetter("ع");
  const physics = byLetter("λ");
  const squares = list.filter((s) => s !== arabic && s !== physics);
  const explore = lang === "ar" ? "استكشف كورسات المادة ←" : "Explore subject courses →";

  const [chain, setChain] = useState(0);
  const chainSteps =
    lang === "ar"
      ? ["ادخل الواجب", "يُفتح الاختبار", "ادخل الاختبار", "يُفتح الدرس التالي"]
      : ["Enter assignment", "Exam unlocks", "Enter exam", "Next lesson unlocks"];

  return (
    <section id="subjects" aria-label="Subjects" style={{ background: "var(--paper-100)", scrollMarginTop: 80 }}>
      <div className="lp-container lp-section">
        <Reveal>
          <p className="lp-eyebrow">{t.subjects.eyebrow}</p>
          <h2 className="lp-h2">{t.subjects.title}</h2>
          <p className="lp-lead">{t.subjects.lead}</p>
        </Reveal>
        <div className="lp-bento">
          <GlowCard accent={arabic.accent} wide label={arabic.name}>
            <div
              style={{
                display: "flex",
                gap: 20,
                flexWrap: "wrap",
                alignItems: "center",
                height: "100%",
              }}
            >
              <div style={{ flex: "1 1 200px" }}>
                <Token letter={arabic.letter} accent={arabic.accent} soft={arabic.accentSoft} />
                <h3 style={{ margin: "0 0 4px", fontSize: 20, color: "var(--ink-950)" }}>{arabic.name}</h3>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.8 }}>
                  {arabic.tagline}
                </p>
              </div>
              <div
                style={{
                  flex: "1 1 220px",
                  background: "var(--paper-50)",
                  border: "1px solid var(--paper-200)",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "var(--ink-700)" }}>
                  {lang === "ar"
                    ? "جرّب قاعدة التقدّم — اضغط بالترتيب"
                    : "Try the progression rule — tap in order"}
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {chainSteps.map((s, i) => {
                    const lit = i <= chain;
                    return (
                      <button
                        key={s}
                        onClick={() => setChain(chain === 3 ? 0 : i)}
                        aria-pressed={lit && i === chain}
                        style={{
                          borderRadius: 999,
                          padding: "8px 14px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          border: lit
                            ? `2px solid ${arabic.accent}`
                            : "1px solid var(--paper-200)",
                          background: lit ? arabic.accentSoft : "#ffffff",
                          color: lit ? arabic.accent : "var(--text-muted)",
                          opacity: i <= chain + 1 ? 1 : 0.45,
                          transition: "all 200ms ease",
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                  {lang === "ar"
                    ? "محاكاة شفافة للقاعدة الحقيقية — لا درجات ولا شروط خفية."
                    : "A transparent simulation of the real rule — no grades, no hidden gates."}
                </p>
              </div>
            </div>
          </GlowCard>

          <GlowCard accent={physics.accent} tall label={physics.name}>
            <div
              style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", gap: 4 }}
            >
              <Token letter={physics.letter} accent={physics.accent} soft={physics.accentSoft} />
              <h3 style={{ margin: "0 0 4px", fontSize: 19, color: "var(--ink-950)" }}>{physics.name}</h3>
              <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.9 }}>
                {physics.tagline}
              </p>
              <p
                aria-hidden
                style={{
                  margin: "16px 0 0",
                  fontSize: 64,
                  lineHeight: 1,
                  color: physics.accent,
                  opacity: 0.16,
                  fontWeight: 800,
                  userSelect: "none",
                }}
              >
                ∿
              </p>
              <UnveilCta accent={physics.accent} label={explore} />
            </div>
          </GlowCard>

          {squares.map((s, i) => (
            <Reveal key={s.name} delay={Math.min(i * 60, 240)}>
              <GlowCard accent={s.accent} label={s.name}>
                <Token letter={s.letter} accent={s.accent} soft={s.accentSoft} />
                <h3 style={{ margin: "0 0 4px", fontSize: 17, color: "var(--ink-950)" }}>{s.name}</h3>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.8 }}>
                  {s.tagline}
                </p>
                <UnveilCta accent={s.accent} label={explore} />
              </GlowCard>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div style={{ marginTop: 24 }}>
            <Link href="/courses" className="lp-btn lp-btn-secondary">
              {t.subjects.cta}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
