"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { LangSwitch } from "@lp/design-system";
import { dict, type Dict, type Lang } from "./dict";

interface LangCtx {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: Dict;
  setLang: (l: Lang) => void;
  /** True for a beat right after a language change (drives the pill spinner). */
  switching: boolean;
}

const Ctx = createContext<LangCtx>({
  lang: "ar",
  dir: "rtl",
  t: dict.ar,
  setLang: () => {},
  switching: false,
});

export function useLang() {
  return useContext(Ctx);
}

export function LangProvider({ children }: { children: any }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [switching, setSwitching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("sanad-lang");
      if (saved === "ar" || saved === "en") setLangState(saved);
    } catch {
      /* storage unavailable — stay Arabic */
    }
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

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
    if (l === lang) return;
    setSwitching(true);
    setLangState(l);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSwitching(false), 360);
  }

  const ProviderComponent = Ctx.Provider as any;

  return (
    <ProviderComponent value={{ lang, dir, t: dict[lang], setLang, switching }}>
      <div key={lang} className="lp-lang-enter">
        {children}
      </div>
    </ProviderComponent>
  );
}

/** Glassmorphic pill (design-system component) wired to the lang context. */
export function LanguageSwitcher() {
  const { lang, switching, setLang } = useLang();

  return (
    <LangSwitch
      value={lang}
      onChange={setLang}
      busy={switching ? lang : null}
      labels={{ ar: "العربية", en: "English" }}
      ariaLabels={
        lang === "ar"
          ? {
              en: "تبديل اللغة إلى الإنجليزية",
              group: "تبديل اللغة / Language",
            }
          : {
              ar: "Switch to Arabic",
              group: "Language / تبديل اللغة",
            }
      }
    />
  );
}
