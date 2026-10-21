"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import SiteFooter from "@/app/components/landing/SiteFooter";
import TeacherCommandRegistrar from "./TeacherCommandRegistrar";
import { TeacherMobileNav, TeacherSidebar } from "./components/TeacherNav";

/**
 * The teacher shell.
 *
 * A slim graphite rail anchors the right edge on desktop (RTL), collapsing to
 * an icon rail on narrower laptops and moving into a floating bottom bar on
 * phones. The old top capsule was beautiful on public pages, but a workspace
 * with nine destinations needs a quieter, always-available vertical rhythm.
 */
export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, ready } = useAuth();

  // Deny by default: no session after the restore attempt ⇒ /login. Waiting
  // for `ready` matters — a reload briefly has no in-memory token while the
  // refresh cookie is still being rotated.
  useEffect(() => {
    if (ready && !token) router.replace("/login");
  }, [ready, token, router]);

  if (!ready || !token) return null;

  return (
    <div className="tc-canvas">
      <TeacherCommandRegistrar />
      <TeacherSidebar pathname={pathname} />

      <main className="tc-inner">{children as any}</main>

      <TeacherMobileNav pathname={pathname} />
      <SiteFooter compact theme="dark" />
    </div>
  );
}
