<div align="center">

# @lp/design-system

### The visual foundation for the Multi-Tenant Learning Platform.

**One learning universe. Many learning identities.**

[![Repository](https://img.shields.io/badge/Repository-sanad--edtech-111827?style=for-the-badge&logo=github)](https://github.com/omarahameds2010-lab/sanad-edtech)
[![Architecture](https://img.shields.io/badge/Architecture-Multi--Tenant-7c3aed?style=for-the-badge)](https://github.com/omarahameds2010-lab/sanad-edtech/blob/master/docs/ARCHITECTURE.md)
[![RTL](https://img.shields.io/badge/RTL-First-0f766e?style=for-the-badge)](./)
[![Motion](https://img.shields.io/badge/Motion-System-111827?style=for-the-badge)](./)
[![Design Tokens](https://img.shields.io/badge/Design-Tokens-d4a373?style=for-the-badge)](./tokens.css)
[![Accessibility](https://img.shields.io/badge/Accessibility-First-2563eb?style=for-the-badge)](./)

</div>

---

## ✦ What is `@lp/design-system`?

`@lp/design-system` is the shared visual foundation of the SANAD Multi-Tenant LMS.

It defines the visual language shared across the platform:

- Design tokens
- Semantic theming
- Typography
- Spacing
- Motion
- RTL foundations
- Accessibility behavior
- Tenant-adaptive styling

The package exists to solve a specific architectural problem:

> **How can one platform support many teachers, subjects, and learning identities without becoming a collection of disconnected products?**

The answer is a controlled visual system:
* The platform stays recognizable.
* The learning identity changes.

---

## ◈ Design Philosophy

```text
                         MASTER PLATFORM
                                │
                                ▼
                     ┌─────────────────────┐
                     │   Semantic Tokens   │
                     └──────────┬──────────┘
                                │
                 ┌──────────────┼──────────────┐
                 │              │              │
                 ▼              ▼              ▼
             Teacher A      Teacher B      Teacher C
             Subject X      Subject Y      Subject Z
                 │              │              │
                 └──────────────┼──────────────┘
                                │
                                ▼
                         Shared Components
The design system is built around one central principle:

Tenants adapt the system. They do not redefine the system.

◇ The 80 / 20 Identity Model
The platform intentionally separates platform identity from learning identity.

Plaintext
┌─────────────────────────────────────────────────────┐
│                                                     │
│         80% — MASTER PLATFORM DNA                   │
│                                                     │
│ Typography · Grid · Spacing · Components            │
│ Motion · Interaction · Geometry · Accessibility     │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│         20% — TENANT / SUBJECT IDENTITY             │
│                                                     │
│ Accent · Motif · Subject language · Teacher brand   │
│                                                     │
└─────────────────────────────────────────────────────┘
This creates a system where:

A mathematics tenant can feel mathematical.

An Arabic tenant can feel editorial.

A physics tenant can feel scientific.

A teacher can have a recognizable learning space.

...while the entire product still feels like one platform.

⟡ Identity Architecture
The platform follows a three-layer identity model:

Master Platform DNA: The shared language across the ecosystem (typography, layout, spacing, components, accessibility).

Subject Identity: The educational character of the space (accent, motif, visual rhythm).

Teacher Identity: Teacher branding, logo, imagery, and personalized workspace.

◎ Token Architecture
The token system is the foundation of the package:

Raw / Adaptive Layer: Values that change per tenant (--tenant-accent, --tenant-motif-opacity).

Semantic Layer: Values consumed by components (--color-action, --bg-surface, --text-primary).

Component Layer: Styles dependent strictly on semantic tokens.

◇ Tenant Theming
Tenant customization is intentionally restricted to the adaptive layer.

CSS
:root[data-subject="physics"] {
  --tenant-accent: #6ea8ff;
  --tenant-motif-opacity: 0.2;
}

:root[data-subject="arabic"] {
  --tenant-accent: #d4a373;
  --tenant-motif-opacity: 0.15;
}
The component remains unchanged:

CSS
.teacher-card {
  border: 1px solid var(--border-subtle);
}

.teacher-card .cta {
  color: var(--color-action);
  transition: background-color var(--motion-fast) var(--ease-standard);
}
✦ Motion System & Budgets
Motion = Feedback + Hierarchy + Continuity

Level	Duration	Role
Instant	80ms	Immediate state response
Fast	140ms	Micro-interactions
Standard	220ms	Common transitions
Medium	320ms	Component/state transitions
Slow	450ms	Larger transitions
◌ Motion Budgets
Product Area	Motion Budget
Marketing / Landing	High
Teacher Dashboard	Medium
Course Builder	Medium
Student Dashboard	Low–Medium
Learning	Low
Exam	Very Low
Payment	Low
Auth / Security	Very Low
⇄ RTL First
RTL is a first-class direction. Prefer logical CSS properties:

margin-inline-start بدلاً من margin-left

padding-inline بدلاً من padding-left/right

inset-inline-start بدلاً من left

⌘ Component Contract
Components consume tokens: Never hardcode colors.

Components do not know tenants: Avoid if (tenant === 'physics').

Components remain accessible: Support keyboard, focus states, and reduced-motion.

Components support RTL: No direction assumptions in code.

🚫 Design-System Boundaries
This package owns the visual foundation. It does not own business logic.

Never place here:

API clients / Axios

Database logic / Prisma models

Authentication & Authorization

BullMQ workers

AI orchestration / SANAD Integration

The system stays the same. The learning identity changes.

One platform. Many teachers. Many subjects. One design language.
