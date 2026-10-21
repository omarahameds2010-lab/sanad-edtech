"use client";

import { useState } from "react";
import LogoutDialog from "./LogoutDialog";

export default function LogoutButton({
  className = "lp-btn lp-btn-danger lp-btn-block",
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <svg
          aria-hidden
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
        تسجيل الخروج
      </button>
      <LogoutDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
