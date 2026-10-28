export type SanadBranch = {
  id: string;
  label: string;
  color: string;
};

/**
 * Teacher-facing SANAD branch selector.
 *
 * Keep this list in sync with the API's `sanad.scope.ts`: one "all"
 * entry plus the eight Arabic branches. The server remains the source
 * of truth for scope; this is presentation only. A unit test pins the
 * nine entries so a branch cannot silently disappear from the UI.
 */
export const SANAD_BRANCHES: SanadBranch[] = [
  { id: "all", label: "الكل", color: "#8b5cf6" },
  { id: "nahw", label: "النحو والإعراب", color: "#10b981" },
  { id: "sarf", label: "الصرف والإملاء", color: "#0ea5e9" },
  { id: "balagha", label: "البلاغة والنقد", color: "#f59e0b" },
  { id: "arood", label: "العروض وميزان الشعر", color: "#ec4899" },
  { id: "adab", label: "الأدب والنصوص", color: "#d946ef" },
  { id: "lugha", label: "اللغة والمفردات", color: "#6366f1" },
  { id: "quran", label: "القرآن وعلومه", color: "#14b8a6" },
  { id: "sira", label: "السيرة والتاريخ", color: "#f97316" },
];
