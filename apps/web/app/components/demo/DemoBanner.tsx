"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/app/lib/auth";
import { useLang } from "@/app/components/landing/i18n";

/**
 * A small, dismissible marker that only appears for one-click demo sessions.
 * It keeps judges oriented after they land inside the student/teacher shells.
 */
export default function DemoBanner({ dark = false }: { dark?: boolean }) {
  const { isDemo } = useAuth();
  const { t } = useLang();
  const [closed, setClosed] = useState(false);

  if (!isDemo || closed) return null;

  return (
    <div className={`lp-demo-banner${dark ? " is-dark" : ""}`} role="note">
      <span className="lp-demo-banner-dot" aria-hidden />
      <span>{t.demo.banner}</span>
      <Link href="/demo">{t.demo.bannerLink} ↗</Link>
      <button
        type="button"
        onClick={() => setClosed(true)}
        aria-label={t.demo.bannerClose}
        className="lp-demo-banner-close"
      >
        ×
      </button>
    </div>
  );
}
