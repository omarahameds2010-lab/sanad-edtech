"use client";

import Link from "next/link";
import { useState } from "react";
import { Reveal } from "./interactive";
import { useLang } from "./i18n";
type EvidenceStatus = "supported" | "partial" | "missing";

const statusStyle: Record<EvidenceStatus, { bg: string; fg: string }> = {
  supported: { bg: "#dcfce7", fg: "#166534" },
  partial: { bg: "#fef9c3", fg: "#854d0e" },
  missing: { bg: "#fee2e2", fg: "#991b1b" },
};

export default function SanadLab() {
  const { t, lang } = useLang();
  const lab = t.lab;
  const [sampleId, setSampleId] = useState(lab.samples[0].id);
  const [custom, setCustom] = useState("");
  const [activeCriterion, setActiveCriterion] = useState<string | null>(null);

  const sample = lab.samples.find((s) => s.id === sampleId) ?? lab.samples[0];
  const active = sample.criteria.find((c) => c.id === activeCriterion);
  const showLoginHint = custom.trim().length > 0;
  const arrow = lang === "ar" ? "←" : "→";

  return (
    <section id="sanad" aria-label="SANAD lab" style={{ scrollMarginTop: 80, background: "var(--ink-950)", color: "#F4F4F6" }}>
      <div className="lp-container lp-section">
        <Reveal>
          <p className="lp-eyebrow" style={{ color: "#34D399" }}>
            {lab.eyebrow}
          </p>
          <h2 className="lp-h2" style={{ color: "#F4F4F6" }}>
            {lab.title}
          </h2>
          <p style={{ color: "#A7ADBA", lineHeight: 1.9, maxWidth: 680, margin: "12px 0 0" }}>
            {lab.leadPrefix}
            <strong style={{ color: "#F4F4F6" }}>{lab.leadStrong}</strong>
            {lab.leadSuffix}
          </p>
        </Reveal>

        <div
          style={{
            marginTop: 32,
            background: "var(--ink-900)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "var(--radius-xl)",
            padding: 28,
          }}
        >
          <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#F4F4F6" }}>
            {lab.step1}
          </h3>
          <p
            style={{
              margin: "0 0 24px",
              padding: "16px 20px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "var(--radius-lg)",
              color: "#F4F4F6",
              lineHeight: 1.9,
            }}
          >
            {lab.question}
          </p>

          <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#F4F4F6" }}>
            {lab.step2}
          </h3>
          <div role="tablist" aria-label="Sample answers" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {lab.samples.map((s) => {
              const selected = s.id === sampleId;
              return (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setSampleId(s.id);
                    setActiveCriterion(null);
                  }}
                  style={{
                    borderRadius: 999,
                    padding: "10px 22px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: selected ? "2px solid #34D399" : "1px solid rgba(255,255,255,0.2)",
                    background: selected ? "rgba(52,211,153,0.12)" : "transparent",
                    color: "#F4F4F6",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
              marginTop: 24,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                color: "var(--ink-700)",
                borderRadius: "var(--radius-lg)",
                padding: 20,
                lineHeight: 2,
              }}
            >
              <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "var(--ink-950)" }}>
                {lab.answerTitle}
              </h4>
              <p style={{ margin: 0, fontSize: 16 }} dir="rtl" lang="ar">
                {sample.answer.map((seg) => {
                  const lit = active && active.evidenceIds.includes(seg.id);
                  const st = active ? statusStyle[active.status] : null;
                  return (
                    <span
                      key={seg.id}
                      style={{
                        background: lit && st ? st.bg : "transparent",
                        borderRadius: 6,
                        padding: lit ? "2px 4px" : undefined,
                        transition: "background 200ms ease",
                      }}
                    >
                      {seg.text}
                    </span>
                  );
                })}
              </p>
            </div>

            <div
              style={{
                background: "#ffffff",
                color: "var(--ink-700)",
                borderRadius: "var(--radius-lg)",
                padding: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 12,
                }}
              >
                <h4 style={{ margin: 0, fontSize: 15, color: "var(--ink-950)" }}>
                  {lab.scoreTitle}
                </h4>
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: "var(--color-action-strong)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {sample.total}
                  <span style={{ fontSize: 15, color: "var(--text-muted)" }}>/100</span>
                </span>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {sample.criteria.map((c) => {
                  const st = statusStyle[c.status];
                  const selected = c.id === activeCriterion;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveCriterion(selected ? null : c.id)}
                      aria-expanded={selected}
                      style={{
                        textAlign: "start",
                        cursor: "pointer",
                        borderRadius: 10,
                        padding: "10px 12px",
                        border: selected
                          ? "2px solid var(--color-action)"
                          : "1px solid var(--paper-200)",
                        background: selected ? "var(--color-action-soft)" : "#ffffff",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontWeight: 700,
                          fontSize: 14,
                          color: "var(--ink-950)",
                        }}
                      >
                        {c.title}
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                          {c.score}/{c.max}
                        </span>
                      </span>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          background: st.bg,
                          color: st.fg,
                          borderRadius: 999,
                          padding: "2px 10px",
                        }}
                      >
                        {c.statusLabel}
                      </span>
                      {selected && (
                        <span
                          style={{
                            display: "block",
                            marginTop: 8,
                            fontSize: 14,
                            color: "var(--ink-700)",
                            lineHeight: 1.8,
                          }}
                        >
                          {c.note}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "12px 0 0" }}>
                {lab.tapHint}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginTop: 20,
            }}
          >
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16 }}>
              <h4 style={{ margin: "0 0 6px", fontSize: 14, color: "#34D399" }}>{lab.gapTitle}</h4>
              <p style={{ margin: 0, fontSize: 14, color: "#A7ADBA", lineHeight: 1.8 }}>{sample.gap}</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16 }}>
              <h4 style={{ margin: "0 0 6px", fontSize: 14, color: "#34D399" }}>{lab.nextTitle}</h4>
              <p style={{ margin: 0, fontSize: 14, color: "#A7ADBA", lineHeight: 1.8 }}>{sample.next}</p>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#F4F4F6" }}>
              {lab.step3}
            </h3>
            <textarea
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              rows={3}
              placeholder={lab.placeholder}
              aria-label={lab.step3}
              style={{
                width: "100%",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.04)",
                color: "#F4F4F6",
                padding: "12px 16px",
                fontSize: 15,
                lineHeight: 1.8,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
            {showLoginHint && (
              <p style={{ marginTop: 12, color: "#F4F4F6", lineHeight: 1.9 }}>
                {lab.loginHintA}
                <Link href="/login" style={{ color: "#34D399", fontWeight: 700 }}>
                  {lab.loginHintB}
                </Link>
                {lab.loginHintC}
              </p>
            )}
          </div>

          <p style={{ marginTop: 20, fontSize: 13, color: "#A7ADBA" }}>
            {lab.disclaimer}
          </p>
        </div>
      </div>
    </section>
  );
}
