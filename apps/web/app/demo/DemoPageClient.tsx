"use client";

import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/app/components/landing/SiteHeader";
import DemoAccess from "@/app/components/demo/DemoAccess";
import { useLang } from "@/app/components/landing/i18n";
import { DEMO_ACCOUNTS, DEMO_FILM_URL, DEMO_QR_SRC } from "@/app/lib/demo";

function CredentialRow({
  label,
  phone,
  password,
  phoneLabel,
  passwordLabel,
}: {
  label: string;
  phone: string;
  password: string;
  phoneLabel: string;
  passwordLabel: string;
}) {
  return (
    <div className="lp-demo-credential">
      <strong>{label}</strong>
      <span>
        {phoneLabel}: <code dir="ltr">{phone}</code>
      </span>
      <span>
        {passwordLabel}: <code dir="ltr">{password}</code>
      </span>
    </div>
  );
}

export default function DemoPageClient() {
  const { t } = useLang();
  const D = t.demo;

  return (
    <>
      <SiteHeader />
      <main>
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            background: "var(--ink-950)",
            color: "#F4F4F6",
          }}
        >
          <div
            aria-hidden
            className="lp-blob"
            style={{
              width: 380,
              height: 380,
              background: "#047857",
              top: -140,
              insetInlineEnd: -100,
            }}
          />
          <div
            aria-hidden
            className="lp-blob"
            style={{
              width: 300,
              height: 300,
              background: "#4F46E5",
              bottom: -140,
              insetInlineStart: "18%",
              animationDelay: "2.4s",
            }}
          />
          <div
            className="lp-container"
            style={{
              position: "relative",
              paddingTop: "clamp(48px, 7vw, 80px)",
              paddingBottom: "clamp(48px, 7vw, 80px)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 18,
              }}
            >
              <span className="lp-demo-badge">{D.badge}</span>
              <span className="lp-demo-badge is-muted">90s</span>
            </div>
            <h1
              className="text-display"
              style={{ margin: "0 0 16px", maxWidth: 820 }}
            >
              {D.title}
            </h1>
            <p
              style={{
                margin: 0,
                maxWidth: 680,
                fontSize: 17,
                lineHeight: 1.9,
                color: "rgba(244, 244, 246, 0.64)",
              }}
            >
              {D.lead}
            </p>

            <div className="lp-demo-hero-card">
              <DemoAccess />
            </div>

            <p
              style={{
                margin: "18px 0 0",
                fontSize: 13,
                color: "rgba(244, 244, 246, 0.48)",
              }}
            >
              <a
                href={DEMO_FILM_URL}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#6EE7B7", fontWeight: 700 }}
              >
                {D.film} ↗
              </a>{" "}
              — {D.filmHint}
            </p>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-container">
            <p className="lp-eyebrow">{D.pathEyebrow}</p>
            <h2 className="lp-h2">{D.pathTitle}</h2>
            <p className="lp-lead" style={{ marginBottom: 28 }}>
              {D.pathLead}
            </p>
            <div className="lp-demo-steps">
              {D.steps.map((step, index) => (
                <article key={step.title} className="lp-demo-step">
                  <span className="lp-demo-step-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          style={{
            background: "var(--paper-100)",
            padding: "clamp(40px, 6vw, 64px) 0",
          }}
        >
          <div className="lp-container lp-demo-credentials">
            <div>
              <p className="lp-eyebrow">{D.credentialsEyebrow}</p>
              <h2 className="lp-h2">{D.credentialsTitle}</h2>
              <p className="lp-lead">{D.credentialsLead}</p>
              <div className="lp-demo-credential-list">
                <CredentialRow
                  label={D.student}
                  phone={DEMO_ACCOUNTS.student.phone}
                  password={DEMO_ACCOUNTS.student.password}
                  phoneLabel={D.phone}
                  passwordLabel={D.password}
                />
                <CredentialRow
                  label={D.teacher}
                  phone={DEMO_ACCOUNTS.teacher.phone}
                  password={DEMO_ACCOUNTS.teacher.password}
                  phoneLabel={D.phone}
                  passwordLabel={D.password}
                />
              </div>
              <p className="lp-demo-reset">{D.reset}</p>
            </div>

            <aside className="lp-demo-qr">
              <Image
                src={DEMO_QR_SRC}
                alt={D.qrTitle}
                width={420}
                height={420}
                className="lp-demo-qr-img"
                priority
              />
              <h3>{D.qrTitle}</h3>
              <p>{D.qrHint}</p>
            </aside>
          </div>
        </section>

        <section style={{ padding: "36px 0" }}>
          <div
            className="lp-container"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            <Link href="/" style={{ fontWeight: 700 }}>
              {D.backHome}
            </Link>
            <span>SANAD · Demo mode</span>
          </div>
        </section>
      </main>
    </>
  );
}
