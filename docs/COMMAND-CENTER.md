# مركز قيادة الطالب — Student Command Center

> صفحة `/student` — أُعيد بناؤها في 17 أكتوبر 2026، ثم دخلت ضمن إعادة تصميم تجربة الطالب في 24–25 أكتوبر 2026.
> هذا المستند يوثّق مصادر كل رقم، قواعد التصميم، التفاعلات، والودجت **المؤجّلة بأمانة**.
> الحالة القاطعة: [`CURRENT-STATE.md`](CURRENT-STATE.md).

---

## 1) المبدأ الحاكم: كل رقم من السيرفر

**ممنوع أي mock أو رقم ملفق في هذه الصفحة.** أي ودجت مفيهوش داتا حقيقية على السيرفر يتأجّل ويُوثَّق هنا — لا يُقلَّد.

- كل الأرقام تُشتق من استجابات الـAPI الحية وقت فتح الصفحة.
- كل التواريخ المعروضة (`unlockedAt` / `submittedAt` / `startsAt`) مُنتَجة من السيرفر ولا تُصنَّع محليًا.
- الحالات العربية تُبنى من أعمدة حالة إنجليزية حقيقية (map ثابت، مع fallback للنص الأصلي لو القيمة غير معروفة).

## 2) الودجت ومصادر الداتا

| الودجت | يعرض إيه | مصدر الداتا (حقيقي) |
| --- | --- | --- |
| **Hero** | اسم الطالب، عدّاد الكورسات، CTA لآخر درس مفتوح | `GET /api/v1/enrollments/me` + أول اسم من `userName` |
| **Progress Orbit** | حلقة SVG بترسم نفسها + نسبة مئوية | متوسط نِسَب الفتح من `GET /api/v1/progression/courses/:courseId` (`lockStatus !== LOCKED` / الإجمالي) |
| **Stats Strip** | كورساتي · دروس مفتوحة · تسليماتي | عدّ الكورسات المسجّلة + عدّ دروس المحتوى غير المقفولة + عدّ كل `attempts` و`submissions` |
| **Resume** | «أكمل من حيث توقفت» — آخر محتوى اتفتح + سبب الفتح بالعربي + تاريخ | آخر `unlockInfo.unlockedAt` على عنصر محتوى + خريطة `unlockType` → نص عربي |
| **Agenda Rail** | المهام بحالاتها الحقيقية (جاري الآن/بانتظار التصحيح/مُصحّح/لم يبدأ) | `GET /api/v1/exams` + `GET /api/v1/assignments` + محاولاتي/تسليماتي لكل عنصر |
| **Signal Chart** | إشارة التعلم آخر ٧ أيام (تجميع يومي) + tooltips | `enrollments.startsAt` + `unlockInfo.unlockedAt` + `attempts.submittedAt` + `submissions.submittedAt` |
| **Passport Cards** | بطاقة جواز لكل كورس: نسبة الفتح + CTA | `GET /api/v1/progression/courses/:courseId` لكل كورس |
| **Badge Shelf** | أوسمة بعضها مكسوب (بتاريخ حقيقي) وبعضها مقفول **بتقدّم حقيقي** | «أول تسليم» · «مفتاح المسار» · «ناجح» · streak · «خمس تسليمات» |
| **Feedback Card** | آخر ملاحظة مدرس حقيقية (تظهر فقط لو `feedback` موجود) | `GET /api/v1/assignments/:assignmentId/submissions/me` |
| **Chain Simulator** | محاكاة توضيحية لشفافية التوقيت | تفاعلية تعليمية — ليست داتا |

## 3) التفاعلات

- **Focus Mode**: زر في الدوك → `window.dispatchEvent(new CustomEvent("sanad:focus", { detail }))` → كلاس `cc-bento--focus` يخفت كل الكروت عدا `.cc-keep`. يخرج تلقائيًا عند مغادرة الصفحة.
- **⌘K / Ctrl+K**: كبسولة في الدوك تفتح Command Palette. إجراءات الطالب: لوحتي/كورساتي/واجباتي/اختباراتي/كتالوج الكورسات.
- **التنقل**: كل تنقّل داخل منطقة الطالب يمر بـ`router.push` (SPA). الجلسة لم تعد تفقد على full reload: `AuthProvider` يستعيدها من refresh cookie ثم `GET /users/me`، ويعرض الصفحة بعد `ready`.
- **الثيم**: زر Moon/Sun في الدوك يبدّل بين الداكن والفاتح، ويُحفظ في `localStorage` تحت `sanad:theme`، ويُطبَّق قبل أول رسم.
- **حالات**: Skeletons أثناء التحميل · Empty state (كتاب مفتوح + «اختر كورسك الأول»).
- **حماية عدّادات**: `useCountUp` وعدّاد الحلقة يستقرّان فورًا لو التاب مخفي (`document.hidden`).

## 4) قواعد التصميم

- الخلفية الداكنة `ink-950` + شبكة 2.8% + دائرتان زمرديتان `blur(110px)` بـdrift بطيء (متوقف باحترام `prefers-reduced-motion`).
- الكروت: `rgba(255,255,255,0.03)` + `blur(20px)` + حد أبيض 8% + راديوس 32 + gap 24.
- الزمردي فقط (`--color-action` وما حولها) — **ممنوع أزرق أو تدرجات عشوائية**.
- ممنوع نص أصغر من 11px، أهداف اللمس ≥40px، أرقام `tnum`، بلا bounce، بلا alert.
- **الوضع الفاتح**: “Heritage Manuscript” — ورق دافئ `#F7F4EB/#F4EFE3`، حبر داكن، زمردي `#047857/#065F46`، وحدود رقيقة. كل قواعد الفاتح scoped تحت `html[data-theme="light"]`.
- الثيم ليس محصورًا في `/student`؛ الدوك والثيم يغطيان مساحة الطالب، والوضع الداكن هو الافتراضي.
- كل التنسيق في `apps/web/app/globals.css` تحت بلوكات `.cc-*` و`.sd-*` و`.lc-*`.

## 5) خريطة الملفات

| الملف | الدور |
| --- | --- |
| `apps/web/app/student/page.tsx` | تركيب الـbento + الجلب والتجميع (`Promise.allSettled`) |
| `apps/web/app/student/components/command-center/widgets.tsx` | كل الودجت |
| `apps/web/app/lib/dashboard.ts` (+ `dashboard.test.ts`) | رياضيات الداشبورد النقية — 26 اختبار وحدة |
| `apps/web/app/student/components/StudentDock.tsx` | الدوك (ثيم داكن/فاتح، مؤشر متحرك، ⌘K، زر التركيز) |
| `apps/web/app/hooks/useCommandPalette.tsx` | لوحة الأوامر |
| `apps/web/app/student/StudentCommandRegistrar.tsx` | أوامر الطالب داخل اللوحة |
| `apps/web/app/lib/theme-provider.tsx` + `theme.ts` | الثيم والـbootstrap قبل الرسم |
| `apps/web/app/lib/auth.tsx` | استعادة الجلسة بعد full reload |
| `apps/api/.../progression.service.ts` | مصدر `unlockInfo.unlockedAt` |

## 6) مؤجّل بأمانة (بدل التلفيق)

| الودجت المقترح | سبب التأجيل | البديل الحالي |
| --- | --- | --- |
| AI Insights widget | نتائج `evaluate-ai` غير محفوظة على التسليم | Feedback Card للمدرس البشري |
| Mastery Radar | لا درجات لكل محور مهارة | Progress Orbit + Passports |
| Daily Goal ring | لا تتبع وقت مشاهدة لكل طالب | Signal Chart (نشاط فعلي) |
| مواعيد نهائية حقيقية | لا حقول `deadline`/`availableUntil` في الـAPI | Agenda بالحالات الحقيقية |

## 7) التحقق (28 أكتوبر 2026)

- **vitest 147/147** على مستوى الويب، منها **26** لرياضيات الداشبورد + `tsc --noEmit` صفر + `pnpm build` **4/4**.
- فحص حي على API حقيقي: الأرقام طابقة للجرد، وResume يعرض `unlockedAt` الحقيقي، والأجندة تعكس الحالة الفعلية.
- Tooltip الشارت، Focus Mode، ⌘K (فتح/إغلاق بـEscape)، تبديل الثيم، واستعادة الجلسة بعد reload — كلها مُختبرة حيًّا.
- ملاحظة تشغيلية للمصوّرين: لو التاب مخفي وقت التحميل، العدّادات تستقر فورًا — افتح الصفحة والنافذة ظاهرة قبل التصوير.

## 8) ما لا يجوز ادعاؤه

- لا تقل إن كل الأرقام “لحظية”؛ هي من آخر استجابة API عند فتح الصفحة.
- لا تقل إن الـAI يصحح تلقائيًا ويعتمد عليه؛ التصحيح البشري هو المصدر المعروض.
- لا تقل إن قفل الدرس يمنع المحتوى على مستوى الـAPI؛ القفل حاليًا في العرض.
