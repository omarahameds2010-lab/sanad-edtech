# SANAD — Demo Script

> **Current script, 25 October 2026.** It uses only verified flows and current numbers.
> It replaces the older 5:00 script that claimed unverified RAG benchmarks and a 393-test total.
> Live demo: <https://sanad-edtech.vercel.app> · State: [`CURRENT-STATE.md`](CURRENT-STATE.md)

## Format

- Target length: **3:00** (expand to 5:00 with the optional payments/AI sections).
- Language: Arabic voice-over, English technical terms where natural.
- Screen: 1440px browser, 100% zoom, RTL.
- Do not show terminal logs with secrets, database URLs, or provider keys.

---

## 0:00–0:20 — Hook

**Screen:** teacher space → student curriculum.

**Voice-over:**

> منصة واحدة… مساحات كثيرة لكل معلم.
> مش كورس واحد. نظام تعليمي كامل: منهج، دروس، واجبات، امتحانات، تصحيح، وتقدم لكل طالب.
> وكل ده من كود واحد، بهوية كل معلم.

**On screen:** `One core. Many teacher spaces.`

---

## 0:20–0:45 — The teacher

**Screen:** `/login` as teacher → `/teacher/courses` → open a course.

**Voice-over:**

> المعلم بيدخل مساحته، يلاقي كورساته المنشورة، ويبني الأقسام والدروس.
> كل درس ممكن يكون فيديو، واجب، أو امتحان.
> والنشر مش مجرد زرار — المحتوى المنشور بيتثبت، ومحاولات الطلاب القديمة تفضل مربوطة بالنسخة اللي حلوها.

**Action:** open a section, a lesson, and the publish workspace. Do not edit live content during the demo.

---

## 0:45–1:20 — The student curriculum

**Screen:** log out → login as student → `/student/courses` → open the Arabic course.

**Voice-over:**

> الطالب بيشوف المنهج، مش صفحة كروت.
> أقسام، دروس، ومهام واضحة: فيديو، واجب، امتحان.
> الأرقام اللي على الشاشة — التقدم، المتاح، المتبقي — كلها جاية من الـAPI.
> مفيش رقم مكتوب باليد.

**Action:** point to the progress count and task chips. Open a task link.

---

## 1:20–1:50 — The lesson and the gate

**Screen:** lesson workspace with video, then the lesson whose video is gated.

**Voice-over:**

> مساحة الدرس مبنية حول المهمة نفسها.
> فيديو؟ المشغل والشرح.
> امتحان؟ الملخص والمؤقت.
> واجب؟ التعليمات والمؤقت.
>
> والقفل هنا حقيقي في العرض:
> الطالب لازم يدخل الواجب الأول، وبعدها الامتحان، وبعدها الدرس التالي يتفتح.
> القاعدة الحالية: `ENTER_ASSIGNMENT` يفتح الامتحان، و`ENTER_EXAM` يفتح الدرس التالي.

**Caveat (only if asked):** the lock is advisory in student API content views; server-side content withholding is still a gap.

---

## 1:50–2:20 — Timers and submission

**Screen:** assignment brief/timer → exam runner.

**Voice-over:**

> المؤقت مش في المتصفح.
> السيرفر هو اللي بيحدد `startedAt` و`expiresAt`.
> إعادة تحميل الصفحة أو إغلاق المتصفح لا تعيد ضبط الوقت.
> الواجب افتراضيًا 300 دقيقة، والامتحان 70 دقيقة.
>
> الطالب يسلّم، والإجابات بتتسجل. الامتحان ما بيعرضش الإجابات الصحيحة.

---

## 2:20–2:45 — Grading

**Screen:** teacher grading queue → student result.

**Voice-over:**

> المعلم يفتح طابور التصحيح، يراجع، يحط الدرجة والملاحظات.
> الطالب يرجع يلاقي نتيجة حقيقية وملاحظات المعلم.
>
> مفيش “تصحيح وهمي” ولا هايلايتز ملفقة. الدرجة والملاحظات محفوظة فعلًا.
> ولحد دلوقتي، أدلة المراجعة على مستوى الكلمة مش متخزنة — دي فجوة معروفة.

---

## 2:45–3:00 — Theme, session, close

**Screen:** toggle theme → reload → mobile width.

**Voice-over:**

> الوضع الداكن افتراضي، وفيه وضع فاتح “مخطوطة أكاديمية”.
> الثيم بيتحفظ، والجلسة بتترجع بعد إعادة التحميل من غير ما التوكن يتخزن في المتصفح.
>
> دي SANAD: منصة واحدة، مساحات كثيرة، وتجربة تعليمية كاملة.
> والأرقام؟ **311 اختبار API، 137 اختبار ويب، وبناء 4/4.**
> مش أرقام على السلايد — دي نتائج التشغيل.

**On screen:** live URLs + `311/311`, `137/137`, `4/4`.

---

## Optional 0:30 — Payments

**Screen:** docs or code, not a fake checkout.

**Voice-over:**

> حلقة الدفع مبنية على `Order → PaymentIntent → Provider → Ledger → Entitlement`.
> التوقيع بيتحقق قبل أي تغيير، والـidempotency بتمنع التكرار، والاسترداد بيرجع القيود ويشيل الاستحقاق في نفس المعاملة.
>
> Paymob وFawry والقسائم موجودين. لكن عرض “عملية حقيقية” محتاج Sandbox فعلي — وده لسه خطوة قادمة.

Do not claim every provider is live.

---

## Optional 0:20 — AI

**Screen:** result card or code reference.

**Voice-over:**

> فيه تكامل مع خدمة SANAD للتقييم عبر `evaluate-ai`.
> الخدمة خارجية، وبتتظبط بـ`SANAD_BASE_URL` و`SANAD_API_KEY`.
>
> لكن مفيش هنا ادعاء بـQdrant أو BM25 أو 38.8ms أو 393 إنجاز.
> اللي مش متحقق، مش بنقوله.

---

## Production notes

- Run the pre-flight health check first.
- Use the seeded demo accounts; do not create accounts live.
- Pre-open tabs: teacher dashboard, student curriculum, assignment, exam, grading.
- Keep a backup screenshot of the curriculum and lesson pages in case the network drops.
- Never show `.env`, Railway variables, database URLs, or provider keys.
- If a flow fails, state the observed error and stop; do not improvise.

## Fact sheet

| Claim | Status |
| --- | --- |
| 3 published Arabic courses | Seeded in `sanad-demo` |
| 311 API tests | Verified 25 Oct 2026 |
| 137 web tests | Verified 25 Oct 2026 |
| Build 4/4 | Verified 25 Oct 2026 |
| RLS enforced in production | **No** — runtime still owner/superuser |
| Outbox delivered | **No** — no dispatcher |
| Video webhook | **No** — no route |
| Paymob/Fawry sandbox charge | **Not yet verified** |
| 38.8ms / Recall@5 / 393 achievements | **Not in this repository; do not claim** |
