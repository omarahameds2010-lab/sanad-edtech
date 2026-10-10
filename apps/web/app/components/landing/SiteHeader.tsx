"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LanguageSwitcher, useLang } from "./i18n";
import Logo from "./Logo";

export default function SiteHeader() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/courses", label: t.header.courses },
    { href: "/teachers", label: t.header.teachers },
    { href: "/#how", label: t.header.how },
    { href: "/#sanad", label: t.header.sanad },
    { href: "/#faq", label: t.header.faq },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(250, 247, 242, 0.92)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--paper-200)",
        boxShadow: scrolled ? "0 4px 16px rgba(11, 13, 16, 0.08)" : "none",
        transition: "box-shadow 220ms ease",
      }}
    >
      <div
        className="lp-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
          position: "relative",
          gap: 12,
        }}
      >
        <Logo />
        <button
          type="button"
          className="lp-menu-btn"
          aria-expanded={open}
          aria-label={open ? t.header.menuClose : t.header.menuOpen}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "✕" : "☰"}
        </button>
        <nav
          aria-label="التنقل الرئيسي"
          className={`lp-nav-links${open ? " open" : ""}`}
        >
          {links.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                color: "var(--ink-700)",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                padding: "8px 4px",
              }}
            >
              {l.label}
            </Link>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LanguageSwitcher />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="lp-btn lp-btn-primary"
              style={{ padding: "8px 20px", fontSize: 14 }}
            >
              {t.header.login}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
