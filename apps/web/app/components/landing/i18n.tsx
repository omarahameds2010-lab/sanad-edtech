"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { dict, type Dict, type Lang } from "./dict";

interface LangCtx {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: Dict;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<LangCtx>({ lang: "ar", dir: "rtl", t: dict.ar, setLang: () => {} });

export function useLang() {
  return useContext(Ctx);
}

export function LangProvider({ children }: { children: any }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("sanad-lang");
      if (saved === "ar" || saved === "en") setLangState(saved);
    } catch {
      /* storage unavailable — stay Arabic */
    }
  }, []);

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem("sanad-lang", lang);
    } catch {
      /* ignore */
    }
  }, [lang, dir]);

  function setLang(l: Lang) {
    setLangState(l);
  }

  const ProviderComponent = Ctx.Provider as any;

  return (
    <ProviderComponent value={{ lang, dir, t: dict[lang], setLang }}>
      <div key={lang} className="lp-lang-enter">
        {children}
      </div>
    </ProviderComponent>
  );
}

/** Minimal pill switcher: العربية | EN with a sliding thumb. */
export function LanguageSwitcher() {
  const { lang, dir, setLang } = useLang();
  const isAr = lang === "ar";

  const thumb: React.CSSProperties = {
    position: "absolute",
    top: 3,
    bottom: 3,
    width: "calc(50% - 5px)",
    borderRadius: 999,
    background: "var(--ink-950)",
    transition: "left 260ms cubic-bezier(.2,0,0,1), right 260ms cubic-bezier(.2,0,0,1)",
    ...(dir === "ltr"
      ? isAr
        ? { left: 4 }
        : { right: 4 }
      : isAr
        ? { right: 4 }
        : { left: 4 }),
  };

  function btn(active: boolean): React.CSSProperties {
    return {
      position: "relative",
      zIndex: 1,
      flex: 1,
      border: "none",
      background: "none",
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 700,
      padding: "7px 14px",
      borderRadius: 999,
      color: active ? "#ffffff" : "var(--ink-700)",
      transition: "color 200ms ease",
      whiteSpace: "nowrap",
    };
  }

  return (
    <div
      role="group"
      aria-label="Language / اللغة"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        borderRadius: 999,
        background: "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--paper-200)",
        padding: 2,
      }}
    >
      <span aria-hidden style={thumb} />
      <button type="button" onClick={() => setLang("ar")} aria-pressed={isAr} style={btn(isAr)}>
        العربية
      </button>
      <button type="button" onClick={() => setLang("en")} aria-pressed={!isAr} style={btn(!isAr)}>
        EN
      </button>
    </div>
  );
}
