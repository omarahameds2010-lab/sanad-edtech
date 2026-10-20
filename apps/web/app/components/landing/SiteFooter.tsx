"use client";

import Link from "next/link";
import Logo from "./Logo";
import { useLang } from "./i18n";

/** The developer credit — one place, so the link never drifts. */
export const LINKEDIN_URL = "https://www.linkedin.com/in/omar-ahmed-7b97613b1/";

/**
 * The site footer.
 *
 * `compact` renders only the legal line — used under the auth screens, which
 * already carry their own brand stage, and inside the dark dashboards.
 * `theme="dark"` lightens the legal line for the graphite shells.
 *
 * The developer name is a living link: a slow emerald→indigo gradient, a
 * LinkedIn mark that wakes up on hover, and an arrow that lifts out of the
 * line. All motion is disabled under `prefers-reduced-motion`.
 */
export default function SiteFooter({
  compact = false,
  theme = "light",
}: {
  compact?: boolean;
  theme?: "light" | "dark";
}) {
  const { t, lang } = useLang();
  const isAr = lang === "ar";

  return (
    <footer
      className={`lp-footer${compact ? " lp-footer--compact" : ""}${
        theme === "dark" ? " lp-footer--dark" : ""
      }`}
    >
      <div className="lp-container lp-footer-inner">
        {!compact && (
          <div className="lp-footer-top">
            <Logo />
            <nav
              className="lp-footer-nav"
              aria-label={isAr ? "روابط الفوتر" : "Footer"}
            >
              <Link href="/courses">{t.footer.courses}</Link>
              <Link href="/teachers">{t.footer.teachers}</Link>
              <Link href="/login">{t.footer.login}</Link>
            </nav>
            <p className="lp-footer-tagline">{t.footer.tagline}</p>
          </div>
        )}

        <div className="lp-footer-legal">
          <p className="lp-footer-copy">{t.footer.rights}</p>

          <p className="lp-footer-made">
            <span className="lp-footer-sep" aria-hidden>
              {isAr ? "·" : "|"}
            </span>
            <span>{t.footer.developedBy}</span>
            <a
              className="lp-maker"
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={
                isAr
                  ? "OMAR AHMED على LinkedIn — يفتح في تبويب جديد"
                  : "OMAR AHMED on LinkedIn — opens in a new tab"
              }
            >
              <svg
                className="lp-maker-in"
                viewBox="0 0 24 24"
                width="13"
                height="13"
                aria-hidden
                focusable="false"
              >
                <path
                  fill="currentColor"
                  d="M4.98 3.5A2.49 2.49 0 0 1 2.5 6 2.49 2.49 0 0 1 0 3.5C0 2.12 1.12 1 2.5 1S4.98 2.12 4.98 3.5ZM.22 8h4.56v14H.22V8Zm8.12 0h4.37v1.91h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 7V22h-4.56v-6.2c0-1.48-.03-3.38-2.06-3.38-2.06 0-2.38 1.61-2.38 3.27V22H8.34V8Z"
                />
              </svg>
              <span className="lp-maker-name">OMAR AHMED</span>
              <span className="lp-maker-arrow" aria-hidden>
                {isAr ? "↖" : "↗"}
              </span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
