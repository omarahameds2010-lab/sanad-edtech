# SANAD Demo — Judge Card

> **The only link you need:** **https://sanad-edtech.vercel.app/demo**
>
> No signup. No phone number. Pick **student** or **teacher** and start.

---

## The 90-second path

| Step | Who     | What to click                                              | What it proves                                                 |
| ---- | ------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| 01   | Student | **ادخل كطالب تجريبي**                                      | A real command center: progress, courses, deadlines, activity. |
| 02   | Student | Open the Arabic course → lesson                            | Lessons, assignments, and exams share one server-driven path.  |
| 03   | Student | Enter the exam → answer → submit                           | The timer is server-authoritative; the result is real.         |
| 04   | Teacher | Go back to `/demo` → **ادخل كمعلم تجريبي** → grading queue | The teacher reviews the same attempt and saves the grade.      |

The seed already contains the student, teacher, course, lesson, assignment, exam, and a student attempt. The two demo buttons log in with those seeded accounts.

---

## Manual credentials

Use these only on `/login` if a demo button is unavailable:

| Role    | Phone         | Password            |
| ------- | ------------- | ------------------- |
| Student | `01000000002` | `Student123!`       |
| Teacher | `01000000001` | `Joker-Arabic#2026` |

These are **demo-only** accounts. Never reuse them for a real tenant or real student.

The web app reads optional build-time overrides:

```text
NEXT_PUBLIC_DEMO_STUDENT_PHONE
NEXT_PUBLIC_DEMO_STUDENT_PASSWORD
NEXT_PUBLIC_DEMO_TEACHER_PHONE
NEXT_PUBLIC_DEMO_TEACHER_PASSWORD
```

If they are unset, the seeded defaults above are used.

---

## Reset before a walkthrough

The seed is idempotent and rebuilds the demo tenant without duplicating the core rows:

```powershell
# From the repo root, with the production/demo DB env loaded
pnpm demo:reset
```

If you want the "data is reset every 24 hours" promise to be automatic, create a
daily Railway cron service that runs the same command at 02:00. Until that cron is
configured, the banner says the data **can be reset** before each walkthrough.

---

## Fallback film

If the API is asleep or the live link is unavailable, use the founder's five-minute cut:

**https://drive.google.com/file/d/1j_6TDQVtOVDRyEcU1q0Jbt2ZMC5-zzIW/view?usp=sharing**

The README Product Tour also has the three film cards and 14 production screenshots.

---

## Submission / first-slide checklist

- [ ] Put **https://sanad-edtech.vercel.app/demo** on the first slide.
- [ ] Put the QR code (`docs/assets/readme/demo-qr.png`) next to it.
- [ ] Write the 4-step path above under the QR.
- [ ] Open `/demo` 10 minutes before judging and click both demo buttons once (pre-warm).
- [ ] Keep the founder film link visible as the fallback.
- [ ] Do **not** send judges to `/signup` first; signup requires an Egyptian phone number and a new teacher account starts empty.
