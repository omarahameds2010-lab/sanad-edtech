"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import ConfirmDialog from "@/app/student/components/ConfirmDialog";

export interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * One confirmation surface for every logout path (settings + student orb).
 * The copy is intentionally warm: this is a classroom platform, not a bank.
 */
export default function LogoutDialog({
  open,
  onClose,
}: LogoutDialogProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) setBusy(false);
  }, [open]);

  function confirmLogout() {
    setBusy(true);
    logout();
    router.replace("/login");
  }

  return (
    <ConfirmDialog
      open={open}
      eyebrow="تسجيل الخروج"
      title="متأكد إنك عايز تسجّل خروجك يا صحبي؟ 😊"
      body="الجلسة هتتقفل على الجهاز ده، وهتحتاج تسجّل دخول تاني عشان تكمل. أي حاجة لسه مكتوبة هتضيع."
      confirmLabel="أيوه، سجّل خروجي"
      cancelLabel="خليني أكمل"
      busy={busy}
      onConfirm={confirmLogout}
      onCancel={() => {
        if (!busy) onClose();
      }}
    />
  );
}
