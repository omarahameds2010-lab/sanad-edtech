import * as React from "react";

export type LangSwitchValue = "ar" | "en";

export interface LangSwitchProps {
  /** Active language. */
  value: LangSwitchValue;
  /** Fired when the other side is chosen. */
  onChange: (value: LangSwitchValue) => void;
  /** Visible labels, e.g. { ar: 'العربية', en: 'English' }. */
  labels?: { ar: string; en: string };
  /** Precise accessible names per option (action-oriented). */
  ariaLabels?: { ar?: string; en?: string; group?: string };
  /** `md` = 40px pill, `sm` = 32px pill. */
  size?: "md" | "sm";
  /** Controlled busy state: the side showing the 8px spinner. */
  busy?: LangSwitchValue | null;
  /** Internal spinner duration when `busy` is uncontrolled (ms). */
  busyMs?: number;
  className?: string;
  style?: React.CSSProperties;
}

function Spinner() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        border: "1.5px solid rgba(11, 13, 16, 0.2)",
        borderTopColor: "var(--ink-950, #0B0D10)",
        borderRadius: 999,
        animation: "lp-langspin 700ms linear infinite",
      }}
    />
  );
}

/**
 * Glassmorphic language pill (AR | EN) with a sliding white thumb.
 * RTL/LTR-safe: the thumb rides logical inline edges, so it follows the
 * document direction automatically.
 */
export function LangSwitch({
  value,
  onChange,
  labels = { ar: "العربية", en: "English" },
  ariaLabels,
  size = "md",
  busy,
  busyMs = 320,
  className,
  style,
}: LangSwitchProps) {
  const [hover, setHover] = React.useState(false);
  const [ring, setRing] = React.useState(false);
  const [innerBusy, setInnerBusy] = React.useState<LangSwitchValue | null>(
    null,
  );
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const busySide = busy !== undefined ? busy : innerBusy;
  const isBusy = busySide !== null && busySide !== undefined;
  const sm = size === "sm";
  const pad = 3;

  function choose(next: LangSwitchValue) {
    if (next === value || isBusy) return;
    onChange(next);
    if (busy === undefined) {
      setInnerBusy(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setInnerBusy(null), busyMs);
    }
  }

  function option(v: LangSwitchValue, label: string) {
    const active = value === v;
    return (
      <button
        key={v}
        type="button"
        onClick={() => choose(v)}
        aria-pressed={active}
        aria-label={ariaLabels?.[v] ?? label}
        disabled={isBusy}
        style={{
          position: "relative",
          zIndex: 1,
          flex: "1 1 auto",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          minWidth: sm ? 56 : 66,
          minHeight: sm ? 26 : 34,
          padding: sm ? "3px 12px" : "6px 16px",
          border: "none",
          background: "none",
          borderRadius: 999,
          cursor: isBusy ? "default" : "pointer",
          fontSize: sm ? 12 : 12.5,
          fontWeight: 700,
          fontFamily: "inherit",
          lineHeight: 1,
          whiteSpace: "nowrap",
          color: active ? "var(--ink-950, #0B0D10)" : "var(--ink-400, #9AA1AC)",
          transition: "color 200ms ease",
        }}
      >
        {busySide === v ? <Spinner /> : label}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={ariaLabels?.group ?? "Language / اللغة"}
      aria-busy={isBusy}
      className={className}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={(e) => {
        const t = e.target as HTMLElement;
        if (t && typeof t.matches === "function" && t.matches(":focus-visible"))
          setRing(true);
      }}
      onBlur={() => setRing(false)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        height: sm ? 32 : 40,
        padding: pad,
        borderRadius: 999,
        border: "1px solid var(--paper-200, #E4DCCC)",
        background: hover
          ? "rgba(255, 255, 255, 0.6)"
          : "rgba(255, 255, 255, 0.4)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
        backdropFilter: "blur(12px) saturate(140%)",
        boxShadow: ring
          ? "0 0 0 2px var(--color-action, #047857)"
          : hover
            ? "0 4px 14px rgba(11, 13, 16, 0.08)"
            : "none",
        opacity: isBusy ? 0.8 : 1,
        transition:
          "background 200ms ease, box-shadow 200ms ease, opacity 200ms ease",
        ...style,
      }}
    >
      <style>{"@keyframes lp-langspin{to{transform:rotate(360deg)}}"}</style>
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: pad,
          bottom: pad,
          insetInlineStart: value === "ar" ? pad : "calc(50% + 1px)",
          inlineSize: "calc(50% - 4px)",
          borderRadius: 999,
          background: "#FFFFFF",
          boxShadow: "0 1px 3px rgba(11, 13, 16, 0.1)",
          transition: "inset-inline-start 300ms cubic-bezier(0.2, 0, 0, 1)",
        }}
      />
      {option("ar", labels.ar)}
      {option("en", labels.en)}
    </div>
  );
}
