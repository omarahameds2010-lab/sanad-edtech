/** Editorial formatting helpers — Arabic/English counts, durations, prices.
 *  Everything here formats *real server numbers*; nothing invents data. */

export type FormatLang = "ar" | "en";

export type CountKind =
  "lesson" | "exam" | "video" | "minute" | "hour" | "course";

const AR_FORMS: Record<CountKind, [string, string, string, string]> = {
  lesson: ["درس واحد", "درسان", "دروس", "درسًا"],
  exam: ["اختبار واحد", "اختباران", "اختبارات", "اختبارًا"],
  video: ["فيديو واحد", "فيديوان", "فيديوهات", "فيديو"],
  minute: ["دقيقة واحدة", "دقيقتان", "دقائق", "دقيقة"],
  hour: ["ساعة واحدة", "ساعتان", "ساعات", "ساعة"],
  course: ["كورس واحد", "كورسان", "كورسات", "كورسًا"],
};

const EN_WORDS: Record<CountKind, string> = {
  lesson: "lesson",
  exam: "exam",
  video: "video",
  minute: "minute",
  hour: "hour",
  course: "course",
};

/** `countWord(3, "ar", "lesson")` → «٣ دروس». */
export function countWord(
  n: number,
  lang: FormatLang,
  kind: CountKind,
): string {
  if (lang === "en") {
    return `${n.toLocaleString("en")} ${EN_WORDS[kind]}${n === 1 ? "" : "s"}`;
  }
  const num = n.toLocaleString("ar-EG");
  const [one, two, few, many] = AR_FORMS[kind];
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${num} ${few}`;
  return `${num} ${many}`;
}

/** Compact duration from seconds — minutes under an hour, then whole hours. */
export function durationLabel(totalSeconds: number, lang: FormatLang): string {
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  if (minutes < 60) return countWord(minutes, lang, "minute");
  const hours = Math.max(1, Math.floor(minutes / 60));
  return countWord(hours, lang, "hour");
}

/** `priceLabel(120000, "EGP", "ar")` → «١٬٢٠٠٫٠٠ EGP»; null means free. */
export function priceLabel(
  price: number | string,
  currency: string,
  lang: FormatLang,
): string | null {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return null;
  const amount = n.toLocaleString(lang === "ar" ? "ar-EG" : "en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount} ${currency}`;
}

/** Book-cover numeral for a course title: ١/٢/٣ when a prep grade is found. */
export function coverNumeral(title: string): string {
  if (/الأول|first/i.test(title)) return "١";
  if (/الثاني|second/i.test(title)) return "٢";
  if (/الثالث|third/i.test(title)) return "٣";
  const first = title.trim().charAt(0);
  return first || "ع";
}
