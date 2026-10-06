# @lp/design-system

Design system foundation for the Multi-Tenant LMS.

## What it is

- `tokens.css` — the single source of truth for color, motion, spacing, typography.
- All values are exposed as CSS variables under `:root`.
- `prefers-reduced-motion` is honored out of the box.
- RTL layout is the baseline (`[dir="rtl"]`).

## Tenant override model

A tenant overrides ONLY the adaptive layer. Components never know a tenant is
overriding them; they always consume semantic tokens.

```css
/* Tenant override (e.g. subject physics) */
:root[data-subject="physics"] {
  --tenant-accent: #6ea8ff;
  --tenant-motif-opacity: 0.2;
}

/* Components always use semantic tokens */
.teacher-card {
  border: 1px solid var(--border-subtle);
}
.teacher-card .cta {
  color: var(--color-action);
  transition: background-color var(--motion-fast) var(--ease-standard);
}
```

## Motion budget

| Area | Budget |
|------|--------|
| Marketing / Landing | High |
| Teacher Dashboard | Medium |
| Course Builder | Medium |
| Student Dashboard | Low–Medium |
| Learning | Low |
| Exam | Very Low |
| Payment | Low |
| Auth / Security | Low–Very Low |

Full rules: `docs/VISUAL_IDENTITY.md`.
