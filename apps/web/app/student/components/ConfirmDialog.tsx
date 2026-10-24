"use client";

import { useEffect } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  eyebrow?: string;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Identity-styled confirm dialog (dark glass) for irreversible submits.
 * Escape and backdrop clicks cancel; the confirm button reports busy state.
 */
export default function ConfirmDialog({
  open,
  eyebrow = "تأكيد",
  title,
  body,
  confirmLabel,
  cancelLabel = "رجوع",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="sc-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="sc-modal">
        <p className="sc-eyebrow" style={{ margin: 0 }}>
          {eyebrow}
        </p>
        <h3
          className="sc-title"
          style={{ fontSize: 26, marginTop: "var(--space-3)" }}
        >
          {title}
        </h3>
        <p
          className="sc-meta"
          style={{
            marginTop: "var(--space-3)",
            fontSize: 14.5,
            lineHeight: 1.9,
            color: "var(--sc-instructions, rgba(244, 244, 246, 0.78))",
          }}
        >
          {body}
        </p>
        <div className="sc-nav-row">
          <button
            type="button"
            className="sc-btn sc-btn-primary"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "لحظة واحدة…" : confirmLabel}
          </button>
          <button
            type="button"
            className="sc-btn sc-btn-ghost"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
