<div align="center">

# @lp/design-system

### The visual foundation for the Multi-Tenant Learning Platform.

**One learning universe. Many learning identities.**

[![Repository](https://img.shields.io/badge/Repository-sanad--edtech-111827?style=for-the-badge&logo=github)](https://github.com/omarahameds2010-lab/sanad-edtech)
[![Architecture]([https://img.shields.io/badge/Architecture-Multi--Tenant-7c3aed?style=for-the-badge)](../../)
[![RTL](https://img.shields.io/badge/RTL-First-0f766e?style=for-the-badge)](../../)
[![Motion](https://img.shields.io/badge/Motion-System-111827?style=for-the-badge)](../../)
[![Design Tokens](https://img.shields.io/badge/Design-Tokens-d4a373?style=for-the-badge)](./tokens.css)
[![Accessibility](https://img.shields.io/badge/Accessibility-First-2563eb?style=for-the-badge)](../../)

</div>

---

## ✦ What is `@lp/design-system`?

`@lp/design-system` is the shared visual foundation of the SANAD Multi-Tenant LMS.

It defines the visual language shared across the platform:

- design tokens
- semantic theming
- typography
- spacing
- motion
- RTL foundations
- accessibility behavior
- tenant-adaptive styling

The package exists to solve a specific architectural problem:

> **How can one platform support many teachers, subjects, and learning identities without becoming a collection of disconnected products?**

The answer is a controlled visual system.

The platform stays recognizable.

The learning identity changes.

---

# ◈ Design Philosophy

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
                                ▼
                        Shared Components

The design system is built around one central principle:

Tenants adapt the system. They do not redefine the system.

◇ The 80 / 20 Identity Model

The platform intentionally separates platform identity from learning identity.

┌─────────────────────────────────────────────────────┐
│                                                     │
│        80% — MASTER PLATFORM DNA                    │
│                                                     │
│ Typography · Grid · Spacing · Components             │
│ Motion · Interaction · Geometry · Accessibility      │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│        20% — TENANT / SUBJECT IDENTITY              │
│                                                     │
│ Accent · Motif · Subject language · Teacher brand   │
│                                                     │
└─────────────────────────────────────────────────────┘

This creates a system where:

a mathematics tenant can feel mathematical
an Arabic tenant can feel editorial
a physics tenant can feel scientific
a teacher can have a recognizable learning space

while the entire product still feels like one platform.

⟡ Identity Architecture

The platform follows a three-layer identity model:

MASTER PLATFORM
       ↓
SUBJECT IDENTITY
       ↓
TEACHER IDENTITY

Conceptually:

Master Platform DNA

The shared language across the ecosystem:

typography
layout and grid
spacing
component geometry
iconography
interaction patterns
motion language
accessibility behavior
Subject Identity

The educational character of the space:

accent
motif
visual rhythm
subject-specific patterns
Teacher Identity

The final layer:

teacher branding
logo
imagery
personalized learning space
◎ Token Architecture

The token system is the foundation of the package.

Raw / Adaptive Layer

Values that may change by tenant:

--tenant-accent
--tenant-motif-opacity
Semantic Layer

Values that components actually consume:

--color-action
--bg-base
--bg-surface
--text-primary
--text-muted
--border-subtle
Component Layer

Components depend on semantic meaning:

.teacher-card {
  border: 1px solid var(--border-subtle);
}

.teacher-card .cta {
  color: var(--color-action);
}

This means components do not need to know:

"Am I inside Physics?"

"Am I inside Arabic?"

"Am I inside Teacher A?"

They simply consume the design language.

---

# ◇ Tenant Theming

Tenant customization is intentionally restricted to the adaptive layer.

Example:

```css
:root[data-subject="physics"] {
  --tenant-accent: #6ea8ff;
  --tenant-motif-opacity: 0.2;
}

:root[data-subject="arabic"] {
  --tenant-accent: #d4a373;
  --tenant-motif-opacity: 0.15;
}

The component remains unchanged:

.teacher-card {
  border: 1px solid var(--border-subtle);
}

.teacher-card .cta {
  color: var(--color-action);
  transition:
    background-color var(--motion-fast)
    var(--ease-standard);
}
Result
Same Component
      +
Different Tenant Tokens
      ↓
Different Learning Identity

No duplicated component implementations.

No tenant-specific component forks.

No visual fragmentation.

✦ Motion Is Part of the Product

Motion is treated as a system, not as decoration.

The core rule is:

Motion = Feedback + Hierarchy + Continuity

The intended motion character is:

Precise · Fluid · Calm · Responsive · Intelligent · Premium

Motion Scale
Level	Duration	Role
Instant	80ms	Immediate state response
Fast	140ms	Micro-interactions
Standard	220ms	Common transitions
Medium	320ms	Component/state transitions
Slow	450ms	Larger transitions
Shared Easing
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-enter: cubic-bezier(0, 0, 0.2, 1);
--ease-exit: cubic-bezier(0.4, 0, 1, 1);
◌ Motion Budgets

Motion intensity is intentionally different across product contexts.

Product Area	Motion Budget
Marketing / Landing	█████ High
Teacher Dashboard	████ Medium
Course Builder	████ Medium
Student Dashboard	███ Low–Medium
Learning	██ Low
Exam	█ Very Low
Payment	██ Low
Auth / Security	█ Very Low

The purpose is not to maximize animation.

The purpose is to spend motion where it improves understanding.

♢ Accessibility

Accessibility is part of the component contract.

The system supports reduced motion:

@media (prefers-reduced-motion: reduce) {
  /* Replace unnecessary movement with reduced or static feedback */
}

Reduced motion should preserve:

feedback
state visibility
focus
navigation clarity
interaction meaning

while removing unnecessary movement.

⇄ RTL First

RTL is a first-class direction, not a translation layer added later.

The system supports:

<html dir="rtl">

and scoped RTL contexts.

Prefer logical CSS properties:

margin-inline-start
padding-inline
inset-inline-start
border-inline-end

instead of hard-coded:

margin-left
padding-right
left
right

Motion should also respect logical direction.

◈ Semantic Design Tokens

Shared components should consume semantic tokens instead of raw values.

Prefer
color: var(--text-primary);
background: var(--bg-surface);
border-color: var(--border-subtle);
color: var(--color-action);
Avoid
color: #d4a373;
background: #1a1c23;

unless the value is genuinely local and intentional.

Semantic tokens make the system:

themeable
tenant-aware
consistent
easier to evolve
safer to refactor
⌘ Component Contract

Shared components built with this system follow a small set of rules.

01 — Components consume tokens

Components use semantic design tokens.

They do not redefine the platform's visual language.

02 — Components do not know tenants

Avoid:

if (tenant === "physics") {
  ...
}

Tenant identity belongs to the adaptive layer.

03 — Components remain accessible

Keyboard interaction, focus behavior, semantic markup, and reduced motion are part of the contract.

04 — Components support RTL

Directional assumptions should not leak into shared component implementations.

05 — Components respect motion budgets

Animation is used when it communicates something meaningful.

⚡ Example
.teacher-card {
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);

  transition:
    background-color var(--motion-fast)
    var(--ease-standard),
    border-color var(--motion-fast)
    var(--ease-standard);
}

.teacher-card .cta {
  color: var(--color-action);
}

The component remains unchanged.

Only the semantic token values adapt.

◈ Design-System Boundaries

This package owns the visual foundation.

It does not own business logic.

Never place here
API clients
Database logic
Prisma models
Authentication
Authorization
BullMQ workers
Payment integrations
AI orchestration
SANAD integration
Tenant business rules

Those concerns belong to the appropriate application or infrastructure boundaries.

Boundary Model

The design system is a foundation, not an application layer.

◇ Package Relationship
                    @lp/design-system
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      Public UI       Student UI       Teacher UI
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                    Multi-Tenant LMS

One design system.

Multiple product surfaces.

One visual language.

⌁ Source of Truth

The primary token source is:

packages/design-system/tokens.css

Broader visual and motion rules are documented in:

docs/VISUAL_IDENTITY.md
When changing the system
Update the source of truth.
Keep semantic naming consistent.
Verify tenant overrides.
Verify RTL behavior.
Verify reduced-motion behavior.
Avoid introducing one-off visual constants without a real system reason.
◉ Design Governance

Before adding a new token, ask:

Is this a reusable system concept or a one-off component solution?

Prefer
--color-action

over:

--teacher-card-gold

Prefer:

--motion-standard

over:

--special-button-animation

The design system should model concepts, not individual screens.

♿ Accessibility Checklist

Every new shared component should consider:

 Semantic HTML
 Keyboard operation
 Visible focus
 Logical focus order
 Accessible labels
 Screen-reader behavior
 Sufficient contrast
 RTL direction
 Reduced motion
 Disabled states
 Loading states
 Error states

Accessibility is a component-quality requirement.

⚡ Performance Principles

The design system should remain lightweight and predictable.

Prefer
CSS transitions
transform
opacity
CSS variables
compositor-friendly animation
Avoid unnecessary
layout-triggering animation
heavy JavaScript animation
global event listeners
unbounded visual effects
layout-changing animation

The design system should support application performance rather than fight it.

✦ Design Language at a Glance
                    VISUAL DNA
                        │
         ┌──────────────┼──────────────┐
         │              │              │
      TYPOGRAPHY       SPACE          COLOR
         │              │              │
         └──────────────┼──────────────┘
                        │
                      MOTION
                        │
                 INTERACTION DNA
                        │
                ┌───────┴───────┐
                │               │
               LTR             RTL
                │               │
                └───────┬───────┘
                        │
                 ACCESSIBILITY
                        │
                        ▼
               TENANT ADAPTATION
◇ Why This Exists

A multi-tenant platform can easily become visually fragmented:

Tenant A → completely different UI
Tenant B → completely different UI
Tenant C → completely different UI

That is not the goal.

The goal is:

                    ONE PLATFORM
                         │
          ┌──────────────┼──────────────┐
          │              │              │
      Teacher A      Teacher B      Teacher C
          │              │              │
      Subject X      Subject Y      Subject Z
          │              │              │
          └──────────────┼──────────────┘
                         │
                 SHARED DESIGN DNA

Different learning identities.

Shared platform intelligence.

◐ Documentation

For the broader visual language, see:

docs/VISUAL_IDENTITY.md

For the implementation source of truth:

tokens.css

Status

@lp/design-system is the shared visual foundation of the SANAD Multi-Tenant LMS.

It provides a controlled system for:

consistent UI
tenant adaptation
subject identity
motion
RTL
accessibility
semantic theming

without allowing application surfaces to drift apart.

<div align="center">
The system stays the same.
The learning identity changes.
<br/>

One platform.
Many teachers.
Many subjects.
One design language.

</div> ```

One platform.
Many teachers.
Many subjects.
One design language.
