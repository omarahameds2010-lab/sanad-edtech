/**
 * Pure checkout helpers.
 *
 * The page is a client component, but keeping the money conversion and the
 * Arabic error mapping here means they can be unit-tested without a DOM.
 */

/** Convert an EGP price (major units) to the integer piastre amount the API expects. */
export function priceToMinor(price: number | string): number {
  const value = Number(price);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

export function isPaidPrice(price: number | string): boolean {
  return priceToMinor(price) > 0;
}

/**
 * One key per checkout attempt. Reusing it across retries lets the payment
 * orchestrator resume the same intent instead of charging twice.
 */
export function createCheckoutKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const VOUCHER_MESSAGES: Record<string, string> = {
  VOUCHER_NOT_FOUND: "الكود غير صحيح. راجع الكود وجرب تاني.",
  VOUCHER_DISABLED: "الكود موقوف حاليًا. كلّم المدرّس.",
  VOUCHER_EXPIRED: "الكود انتهت صلاحيته.",
  VOUCHER_EXHAUSTED: "الكود استنفد عدد مرات الاستخدام.",
  VOUCHER_COURSE_MISMATCH: "الكود مش مخصص للكورس ده.",
  ALREADY_REDEEMED: "الكود مستخدم بالفعل على حسابك.",
  VOUCHER_REJECTED: "تعذر التحقق من الكود. راجع بياناته وجرب تاني.",
};

/** Map API status/code to copy a student can act on, never a raw English error. */
export function checkoutErrorMessage(
  status: number,
  code?: string,
  message?: string,
): string {
  if (code && VOUCHER_MESSAGES[code]) return VOUCHER_MESSAGES[code];
  if (status === 402) {
    return "الكورس ده مدفوع. لازم كود شراء صالح عشان تفتحه.";
  }
  if (status === 401) {
    return "الجلسة انتهت. سجّل الدخول تاني وارجع للدفع.";
  }
  if (status === 403) {
    return "الحساب ده مش مسموح له بالشراء. جرّب بحساب طالب.";
  }
  return message?.trim() || "تعذر إتمام الدفع. حاول تاني بعد شوية.";
}
