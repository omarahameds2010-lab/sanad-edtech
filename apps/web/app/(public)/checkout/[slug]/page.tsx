"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type CourseStructure } from "@/app/lib/api";
import {
  checkoutErrorMessage,
  createCheckoutKey,
  isPaidPrice,
  priceToMinor,
} from "../lib/checkout";

/* ------------------------------------------------------------------
   Checkout — the paid-course door.
   Paper & ink like the public course stage, but one job: verify a
   voucher server-side, then let the payment flow grant the enrollment.
   ------------------------------------------------------------------ */

function IconShield() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l7 3v5.5c0 4.2-2.8 7.6-7 9.5-4.2-1.9-7-5.3-7-9.5V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.2l2.6 2.6L16 9.4" />
    </svg>
  );
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { token, ready } = useAuth();
  const router = useRouter();

  const [slug, setSlug] = useState<string | null>(null);
  const [data, setData] = useState<CourseStructure | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [attemptKey, setAttemptKey] = useState(() => createCheckoutKey());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setData(null);
    setLoadError(null);
    api
      .getCourseStructureBySlug(slug)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(
            error instanceof ApiError
              ? error.message
              : "تعذر تحميل بيانات الكورس",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug, reloadKey]);

  // Route guard: wait for the refresh-cookie restore before deciding.
  useEffect(() => {
    if (!ready) return;
    if (!token) router.replace("/login");
  }, [ready, token, router]);

  // If this student already owns the course, never ask for a voucher.
  useEffect(() => {
    if (!token || !data) return;
    let cancelled = false;
    api
      .getMyEnrollments(token)
      .then((list) => {
        if (
          !cancelled &&
          Array.isArray(list) &&
          list.some(
            (item) =>
              item.course?.id === data.course.id && item.status === "ACTIVE",
          )
        ) {
          setAlreadyEnrolled(true);
        }
      })
      .catch(() => {
        // A failed convenience check must not block checkout.
      });
    return () => {
      cancelled = true;
    };
  }, [token, data]);

  const lessonCount = useMemo(
    () =>
      data ? data.sections.reduce((n, s) => n + s.lessons.length, 0) : 0,
    [data],
  );

  const priceNum = data ? Number(data.course.price) : 0;
  const paid = data ? isPaidPrice(data.course.price) : false;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !data || submitting || success || alreadyEnrolled) return;

    const code = voucherCode.trim();
    if (!code) {
      setFormError("اكتب كود الشراء الأول.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      let currentOrderId = orderId;
      if (!currentOrderId) {
        const created = await api.createOrder(token, {
          items: [
            {
              resourceType: "course",
              resourceId: data.course.id,
              name: data.course.title,
              quantity: 1,
              unitPriceMinor: priceToMinor(data.course.price),
              metadata: { courseSlug: data.course.slug },
            },
          ],
          currency: data.course.currency,
          metadata: { source: "web-checkout", courseSlug: data.course.slug },
        });
        currentOrderId = created.order.orderId;
        setOrderId(currentOrderId);
      }

      const result = await api.createPaymentIntent(token, {
        orderId: currentOrderId,
        paymentMethod: "VOUCHER",
        metadata: {
          voucherCode: code,
          courseId: data.course.id,
          courseSlug: data.course.slug,
        },
        // Stable for retries: the orchestrator resumes this intent rather
        // than starting a second redemption.
        idempotencyKey: attemptKey,
      });

      if (!result.paymentIntent.success) {
        setFormError(
          checkoutErrorMessage(
            400,
            result.paymentIntent.errorCode,
            result.paymentIntent.errorMessage,
          ),
        );
        return;
      }

      setSuccess(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(
          checkoutErrorMessage(error.status, error.code, error.message),
        );
      } else {
        setFormError("تعذر إتمام الدفع. حاول تاني بعد شوية.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function retryFromScratch() {
    setOrderId(null);
    setAttemptKey(createCheckoutKey());
    setFormError(null);
  }

  if (loadError) {
    return (
      <div className="stage-root">
        <div className="stage-shell">
          <nav className="stage-crumbs">
            <Link href="/courses">الكورسات</Link>
            <span className="sep">←</span>
            <span>إتمام الاشتراك</span>
          </nav>
          <div className="stage-error">
            <p className="stage-error-title">تعذر تحميل الكورس</p>
            <p className="stage-error-sub">{loadError}</p>
            <button
              type="button"
              className="stage-btn"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              إعادة المحاولة
            </button>
            <div>
              <Link className="stage-btn-ghost" href="/courses">
                أو ارجع لكل الكورسات ←
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="stage-root">
        <div className="stage-shell">
          <div className="stage-crumbs">
            <span className="stage-sk" style={{ width: 220, height: 14 }} />
          </div>
          <div className="checkout-grid">
            <section>
              <div
                className="stage-sk stage-sk-line"
                style={{ width: 190, height: 13 }}
              />
              <div
                className="stage-sk"
                style={{
                  height: 52,
                  width: "64%",
                  margin: "18px 0",
                  borderRadius: 14,
                }}
              />
              <div className="stage-sk checkout-sk-card" />
            </section>
            <aside className="stage-sk checkout-sk-summary" />
          </div>
        </div>
      </div>
    );
  }

  const course = data.course;
  const courseHref = `/courses/${course.slug}`;
  const startHref = `/student/courses/${course.id}`;

  function renderSuccess() {
    return (
      <div className="checkout-state checkout-state-success" role="status">
        <span className="checkout-state-icon">
          <IconCheck />
        </span>
        <h1>تم تفعيل الكورس</h1>
        <p>
          الكود اتحقق على السيرفر، والاشتراك اتسجل باسمك. تقدر تبدأ من
          دلوقتي.
        </p>
        <Link className="stage-cta checkout-state-cta" href={startHref}>
          ابدأ الكورس
        </Link>
        <Link className="stage-btn-ghost" href="/student/courses">
          أو ارجع لكورساتي ←
        </Link>
      </div>
    );
  }

  function renderAlreadyEnrolled() {
    return (
      <div className="checkout-state" role="status">
        <span className="checkout-state-icon">
          <IconCheck />
        </span>
        <h1>أنت مسجل في الكورس بالفعل</h1>
        <p>مش محتاج كود تاني — الكورس مفتوح على حسابك.</p>
        <Link className="stage-cta checkout-state-cta" href={startHref}>
          افتح الكورس
        </Link>
        <Link className="stage-btn-ghost" href="/student/courses">
          أو ارجع لكورساتي ←
        </Link>
      </div>
    );
  }

  function renderFree() {
    return (
      <div className="checkout-state">
        <h1>الكورس ده مجاني</h1>
        <p>مفيش دفع مطلوب — سجّل من صفحة الكورس مباشرة.</p>
        <Link className="stage-cta checkout-state-cta" href={courseHref}>
          صفحة الكورس
        </Link>
      </div>
    );
  }

  return (
    <div className="stage-root">
      <div className="stage-ghost-wrap">
        <div className="stage-ghost" aria-hidden="true">
          ع
        </div>
      </div>

      <div className="stage-shell">
        <nav className="stage-crumbs stage-rise stage-rise-1">
          <Link href="/courses">الكورسات</Link>
          <span className="sep">←</span>
          <Link href={courseHref}>{course.title}</Link>
          <span className="sep">←</span>
          <span>إتمام الاشتراك</span>
        </nav>

        {success ? (
          renderSuccess()
        ) : !ready ? (
          <div className="checkout-state checkout-wait">
            <p>بنجهّز جلستك…</p>
          </div>
        ) : !token ? (
          <div className="checkout-state">
            <h1>سجّل الدخول الأول</h1>
            <p>عشان نربط الكورس بحسابك، لازم تكون داخل بحساب طالب.</p>
            <Link className="stage-cta checkout-state-cta" href="/login">
              تسجيل الدخول
            </Link>
          </div>
        ) : alreadyEnrolled ? (
          renderAlreadyEnrolled()
        ) : !paid ? (
          renderFree()
        ) : (
          <div className="checkout-grid stage-rise stage-rise-1">
            <section className="checkout-main">
              <p className="stage-eyebrow">خطوة واحدة ويفتح الكورس</p>
              <h1 className="checkout-title">إتمام الاشتراك</h1>
              <p className="checkout-sub">
                عندك كود شراء من المدرّس؟ اكتبه هنا. الكود بيتحقق على
                السيرفر، وبعدها الاشتراك بيتسجل في حسابك تلقائيًا.
              </p>

              <form className="checkout-card" onSubmit={handleSubmit}>
                <label className="checkout-label" htmlFor="voucher-code">
                  كود الشراء
                </label>
                <div className="checkout-input-wrap">
                  <input
                    id="voucher-code"
                    className="checkout-input"
                    type="text"
                    inputMode="text"
                    autoComplete="one-time-code"
                    dir="ltr"
                    placeholder="SANAD-XXXX-XXXX"
                    value={voucherCode}
                    onChange={(event) => {
                      setVoucherCode(event.target.value);
                      if (formError) setFormError(null);
                    }}
                    disabled={submitting}
                  />
                  <span className="checkout-input-icon" aria-hidden="true">
                    <IconShield />
                  </span>
                </div>

                {formError && (
                  <div className="checkout-error" role="alert">
                    <span>{formError}</span>
                    {orderId && (
                      <button
                        type="button"
                        className="checkout-error-reset"
                        onClick={retryFromScratch}
                      >
                        ابدأ محاولة جديدة
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="stage-cta checkout-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span
                      className="stage-spin"
                      aria-label="بنراجع الكود…"
                    />
                  ) : (
                    "تأكيد الشراء وفتح الكورس"
                  )}
                </button>

                <p className="checkout-fineprint">
                  بالضغط على الزر، الكود بيتحقق ويتسجل الاشتراك في نفس
                  المعاملة. لو الكود مش صالح، مش هيتفتح الكورس.
                </p>
              </form>
            </section>

            <aside className="checkout-summary">
              <div className="checkout-summary-card">
                <p className="checkout-summary-eyebrow">ملخص الاشتراك</p>
                <h2 className="checkout-summary-title">{course.title}</h2>
                {course.teacher?.name && (
                  <p className="checkout-summary-teacher">
                    المدرّس: {course.teacher.name}
                  </p>
                )}

                <div className="checkout-summary-rows">
                  <div className="checkout-summary-row">
                    <span>المحتوى</span>
                    <span>{lessonCount} درس</span>
                  </div>
                  <div className="checkout-summary-row">
                    <span>الوصول</span>
                    <span>مدى الحياة</span>
                  </div>
                  <div className="checkout-summary-row checkout-total-row">
                    <span>الإجمالي</span>
                    <span className="checkout-total">
                      {Number.isFinite(priceNum)
                        ? priceNum.toFixed(2)
                        : "0.00"}{" "}
                      <small>{course.currency}</small>
                    </span>
                  </div>
                </div>

                <p className="checkout-summary-note">
                  <span className="checkout-summary-note-icon">
                    <IconShield />
                  </span>
                  الدفع مؤمّن — الكود مش بيتخزن في المتصفح، والتحقق بيحصل
                  على السيرفر.
                </p>

                <Link className="checkout-back" href={courseHref}>
                  ← راجع تفاصيل الكورس
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
