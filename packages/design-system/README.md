<div align="center">

# @lp/design-system

**Shared tokens, theme primitives, and UI components for the SANAD learning platform.**

[![Next.js](https://img.shields.io/badge/consumer-Next.js%2015-111827?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![RTL](https://img.shields.io/badge/RTL-first-0f766e?style=for-the-badge)](#rtl)
[![Tokens](https://img.shields.io/badge/tokens-CSS%20%2B%20TS-d4a373?style=for-the-badge)](./tokens.css)

[Repository](https://github.com/omarahameds2010-lab/sanad-edtech) · [Architecture](https://github.com/omarahameds2010-lab/sanad-edtech/blob/main/docs/ARCHITECTURE.md) · [Visual identity](https://github.com/omarahameds2010-lab/sanad-edtech/blob/main/docs/VISUAL_IDENTITY.md)

</div>

---

## What this package is

`@lp/design-system` is the shared visual foundation for the platform:

- CSS custom properties in [`tokens.css`](./tokens.css)
- typed token modules in `tokens/`
- theme helpers in `theme/`
- component sources in `components/`
- RTL and reduced-motion conventions

It is a workspace package (`private: true`), consumed by `apps/web`. It does not contain API clients, auth, database logic, payment logic, or workers.

## Current use in the app

`apps/web/app/layout.tsx` imports:

```ts
import '@lp/design-system/tokens.css';
import './globals.css';
```

The student-facing **Heritage Manuscript** theme is implemented in `apps/web/app/globals.css` under `html[data-theme="light"]`, because it coordinates page-level surfaces, curriculum classes (`lc-*`), command-center classes (`cc-*`, `sd-*`), and app-specific markup. The package supplies the shared base tokens; the app owns the shipped product theme.

Current shipped theme behaviour:

- dark is the default
- light mode is optional and persisted under `sanad:theme`
- the theme is applied before paint by `apps/web/app/layout.tsx`
- all light rules are scoped under `html[data-theme="light"]`

## Package exports

The root entry currently exports:

- `Button`
- `Card`
- `Tabs`
- `LangSwitch`
- theme helpers

Subpath exports are defined for `./tokens`, `./theme`, `./components`, `./tokens.css`, and `./theme.css`. Component source folders also include Avatar, Badge, DataDisplay, DataTable, Dialog, Drawer, EmptyState, FormField, icons, Input, Loading, Modal, Select, Skeleton, Stepper, Toast, Tooltip, and Wizard. Treat a component as public only when it is exported from the relevant entry point.

## Usage

```tsx
import { Button, Card } from '@lp/design-system';
import '@lp/design-system/tokens.css';
```

Use semantic tokens rather than raw hex values:

```css
.panel {
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}
```

## RTL

RTL is a first-class direction. Prefer logical CSS properties:

| Avoid | Prefer |
| --- | --- |
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| `padding-left` / `padding-right` | `padding-inline` |
| `left` / `right` | `inset-inline-start` / `inset-inline-end` |

Components must not assume LTR.

## Motion

Motion is feedback and hierarchy, not decoration.

| Level | Duration | Use |
| --- | --- | --- |
| Instant | 80ms | Immediate state response |
| Fast | 140ms | Micro-interactions |
| Standard | 220ms | Common transitions |
| Medium | 320ms | Component/state transitions |
| Slow | 450ms | Larger transitions |

Respect `prefers-reduced-motion: reduce`. Exam and payment surfaces should stay at the low end of the budget.

## Build and test

```powershell
pnpm --filter @lp/design-system build
pnpm --filter @lp/design-system typecheck
pnpm --filter @lp/design-system test
```

The root `pnpm build` includes this package and currently completes **4/4** tasks.

## Boundaries

Never place in this package:

- API clients or Prisma models
- authentication or authorization
- payment or entitlement logic
- background workers
- AI orchestration

The system stays consistent; tenant identity changes through tokens, not forks.

## Current status

| Item | Status |
| --- | --- |
| Tokens imported by web | Yes |
| Heritage Manuscript light mode | Implemented in `apps/web/app/globals.css` |
| Dark default + pre-paint restore | Yes |
| Root build | 4/4 |
| Storybook | Not shipped |
| Six subject DNA galleries | Not shipped — specification only |
