"use client";

import { Reveal } from "./interactive";
import { useLang } from "./i18n";

export default function HowItWorks() {
  const { t } = useLang();
  const steps = t.how.steps;
  return (
    <section id="how" aria-label="How it works" style={{ scrollMarginTop: 80 }}>
      <div className="lp-container lp-section">
        <Reveal>
          <p className="lp-eyebrow">{t.how.eyebrow}</p>
          <h2 className="lp-h2">{t.how.title}</h2>
        </Reveal>
        <ol
          style={{
            listStyle: "none",
            margin: "32px 0 0",
            padding: 0,
            display: "grid",
            gap: 0,
            maxWidth: 760,
          }}
        >
          {steps.map((step, i) => (
            <Reveal key={step.index} delay={i * 60}>
              <li
                style={{
                  display: "flex",
                  gap: 20,
                  paddingBottom: 28,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "var(--ink-950)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {step.index}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      aria-hidden
                      style={{
                        width: 2,
                        flex: 1,
                        minHeight: 32,
                        background: "var(--paper-200)",
                        marginTop: 8,
                      }}
                    />
                  )}
                </div>
                <div style={{ paddingTop: 4 }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: 19, color: "var(--ink-950)" }}>
                    {step.title}
                  </h3>
                  <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.9 }}>
                    {step.body}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
        <Reveal>
          <aside
            style={{
              marginTop: 8,
              background: "var(--color-action-soft)",
              border: "1px solid var(--color-action)",
              borderRadius: "var(--radius-lg)",
              padding: "20px 24px",
              maxWidth: 760,
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "var(--color-action-strong)" }}>
              {t.how.noteTitle}
            </h3>
            <p style={{ margin: 0, color: "var(--ink-700)", lineHeight: 1.9 }}>
              {t.how.noteBody}
            </p>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
