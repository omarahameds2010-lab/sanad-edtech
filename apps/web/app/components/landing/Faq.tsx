"use client";

import { useState } from "react";
import { Reveal } from "./interactive";
import { useLang } from "./i18n";

export default function Faq() {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" aria-label="FAQ" style={{ scrollMarginTop: 80 }}>
      <div className="lp-container lp-section">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(240px, 5fr) 7fr",
            gap: "clamp(24px, 5vw, 64px)",
            alignItems: "start",
          }}
          className="lp-faq-split"
        >
          <div style={{ position: "sticky", top: 96 }}>
            <Reveal>
              <p className="lp-eyebrow">{t.faq.eyebrow}</p>
              <h2 className="lp-h2" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
                {t.faq.title}
              </h2>
              <p
                style={{
                  display: "inline-block",
                  marginTop: 20,
                  background: "var(--color-action-soft)",
                  border: "1px solid var(--color-action)",
                  color: "var(--color-action-strong)",
                  borderRadius: 999,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  lineHeight: 1.8,
                }}
              >
                {t.faq.contact}
              </p>
            </Reveal>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {t.faq.list.map((f, i) => {
              const isOpen = open === i;
              return (
                <Reveal key={f.q} delay={Math.min(i * 40, 200)}>
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.4)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: "1px solid var(--paper-200)",
                      borderRadius: "var(--radius-lg)",
                      boxShadow: isOpen
                        ? "0 16px 32px -12px rgba(11, 13, 16, 0.18)"
                        : "0 2px 8px -2px rgba(11, 13, 16, 0.06)",
                      transform: isOpen ? "translateY(-2px)" : "none",
                      transition: "box-shadow 300ms ease, transform 300ms ease, background 300ms ease",
                    }}
                  >
                    <button
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : i)}
                      style={{
                        width: "100%",
                        textAlign: "start",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "18px 22px",
                        fontWeight: 700,
                        fontSize: 16,
                        color: "var(--ink-700)",
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          color: isOpen ? "var(--color-action-strong)" : "var(--ink-300)",
                          fontWeight: 800,
                          fontSize: 20,
                          lineHeight: 1,
                          transition: "transform 300ms cubic-bezier(.2,0,0,1), color 300ms ease",
                          transform: isOpen ? "rotate(45deg)" : "none",
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      >
                        +
                      </span>
                      {f.q}
                    </button>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateRows: isOpen ? "1fr" : "0fr",
                        opacity: isOpen ? 1 : 0,
                        transition:
                          "grid-template-rows 380ms cubic-bezier(.2,0,0,1), opacity 300ms ease",
                      }}
                    >
                      <div style={{ overflow: "hidden" }}>
                        <p
                          style={{
                            margin: 0,
                            padding: "0 22px 20px",
                            paddingInlineStart: 54,
                            color: "var(--text-muted)",
                            lineHeight: 1.9,
                          }}
                        >
                          {f.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
