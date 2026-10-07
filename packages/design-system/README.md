# @lp/design-system

> The visual foundation for the Multi-Tenant Learning Platform.

`@lp/design-system` is the shared design-system foundation for the SANAD Multi-Tenant LMS.

It provides the platform's visual language through shared tokens, semantic theming, motion rules, RTL foundations, accessibility behavior, and tenant-adaptive styling.

The goal is simple:

> **One learning universe. Many learning identities.**

The design system keeps the platform visually coherent across teachers, subjects, and tenants while allowing each learning space to develop its own identity without changing the underlying component system.

---

## Philosophy

The design system separates the platform into two visual layers:

### Master Platform DNA

The shared visual language that keeps the entire platform recognizable:

- Typography
- Layout and grid
- Spacing
- Component geometry
- Interaction patterns
- Motion language
- Iconography
- Accessibility behavior

### Tenant Adaptive Layer

The controlled layer that allows teachers, institutions, and subjects to express their own identity:

- Accent color
- Subject motif
- Motif intensity
- Theme-level visual adjustments

The rule is intentionally strict:

> **Tenants adapt the system. They do not redefine the system.**

Shared components consume semantic tokens and remain unaware of which tenant or subject is active.

---

## Design Architecture

```text
                    MASTER PLATFORM
                           │
              ┌────────────┴────────────┐
              │                         │
        Design System              Interaction DNA
              │                         │
              └────────────┬────────────┘
                           │
                  Semantic Tokens
                           │
            ┌──────────────┼──────────────┐
            │              │              │
        Teacher A      Teacher B      Teacher C
            │              │              │
        Subject X      Subject Y      Subject Z
            │              │              │
            └──────────────┴──────────────┘
                           │
                    Shared Components

The intended hierarchy is:

Master Platform
    ↓
Semantic Design Tokens
    ↓
Shared Components
    ↓
Tenant Adaptive Tokens

A shared component should never contain tenant-specific business or visual logic such as:

if (tenant === "physics") {
  ...
}

Instead, components consume semantic tokens:

.teacher-card {
  border: 1px solid var(--border-subtle);
}

.teacher-card .cta {
  color: var(--color-action);
  transition:
    background-color var(--motion-fast)
    var(--ease-standard);
}
What's Included

The package provides the shared foundation for:

Design tokens
Color tokens
Motion tokens
Spacing tokens
Typography tokens
Semantic tokens
Tenant adaptive tokens
RTL baseline
Reduced-motion support

The primary token source is:

tokens.css

This file is the single source of truth for shared visual values.

Token Architecture

Tokens are exposed through CSS custom properties.

The design system separates adaptive values from semantic usage.

For example:

:root {
  --tenant-accent: #d4a373;

  --color-action: var(--tenant-accent);
  --text-primary: #f4f4f6;
  --text-muted: #8c909e;

  --motion-fast: 140ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}

Components consume semantic tokens rather than tenant-specific values:

.button {
  color: var(--color-action);

  transition:
    background-color var(--motion-fast)
    var(--ease-standard);
}

This keeps component implementation stable even when tenant identity changes.

Tenant Theming

Tenant customization is intentionally limited to an adaptive layer.

Example:

:root[data-subject="physics"] {
  --tenant-accent: #6ea8ff;
  --tenant-motif-opacity: 0.2;
}

:root[data-subject="arabic"] {
  --tenant-accent: #d4a373;
  --tenant-motif-opacity: 0.15;
}

Shared components remain unaware of the tenant:

.teacher-card {
  border: 1px solid var(--border-subtle);
}

.teacher-card .cta {
  color: var(--color-action);

  transition:
    background-color var(--motion-fast)
    var(--ease-standard);
}

The same component can therefore exist across many teacher and subject spaces without separate implementations.

Visual Identity Model

The platform follows a three-layer identity model:

MASTER PLATFORM
       ↓
SUBJECT IDENTITY
       ↓
TEACHER IDENTITY

The visual system follows an intentional 80/20 balance:

80% = Master Platform DNA
20% = Tenant / Subject Identity

The master platform remains recognizable even when the tenant accent, subject motif, or teacher branding changes.

This keeps a multi-tenant platform coherent instead of turning it into a collection of unrelated products.

Motion System

Motion is part of the product identity, not decoration.

The guiding principle is:

Motion = Feedback + Hierarchy + Continuity

The motion language is intended to feel:

Precise
Fluid
Intelligent
Calm
Responsive
Premium
Motion Levels
Level	Typical Range	Purpose
Instant	80ms	Immediate state response
Fast	140ms	Micro-interactions
Standard	220ms	Common UI transitions
Medium	320ms	Component/state transitions
Slow	450ms	Larger transitions

Shared easing:

--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-enter: cubic-bezier(0, 0, 0.2, 1);
--ease-exit: cubic-bezier(0.4, 0, 1, 1);
Motion Budgets

Different areas of the product use different motion budgets.

Area	Budget
Marketing / Landing	High
Teacher Dashboard	Medium
Course Builder	Medium
Student Dashboard	Low–Medium
Learning	Low
Exam	Very Low
Payment	Low
Auth / Security	Low–Very Low

Motion should reinforce hierarchy and feedback rather than compete with learning content or increase unnecessary visual noise.

Reduced Motion

Accessibility is part of the design-system contract.

The system respects:

@media (prefers-reduced-motion: reduce) {
  /* Reduce or replace unnecessary movement */
}

Reduced motion should preserve:

Feedback
State visibility
Focus
Navigation clarity
Interaction meaning

while reducing unnecessary movement.

RTL First

RTL is a baseline capability of the platform.

The design system supports:

<html dir="rtl">

and scoped RTL contexts where needed.

Components should prefer logical CSS properties:

margin-inline-start
padding-inline
inset-inline-start
border-inline-end

rather than hard-coded left/right assumptions.

Motion should also respect logical direction.

Semantic Tokens

Shared components should consume semantic tokens instead of raw visual values.

Prefer:

color: var(--text-primary);
background: var(--bg-surface);
border-color: var(--border-subtle);
color: var(--color-action);

Avoid unnecessary component-level hardcoding:

color: #d4a373;
background: #1a1c23;

Semantic tokens make the system:

Themeable
Tenant-aware
Consistent
Easier to evolve
Safer to refactor
Component Contract

Shared components built on top of this package should follow a consistent contract.

Components consume tokens

Components should consume the system's semantic design language rather than redefine it.

Components do not know tenants

Tenant-specific identity belongs in the adaptive token layer.

Components remain accessible

Keyboard interaction, focus behavior, semantics, and reduced motion are part of component quality.

Components support RTL

Avoid directional assumptions in layout and interaction.

Components respect motion budgets

Not every interaction requires animation.

Example
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

The component remains unchanged while tenant-level identity is provided through semantic token overrides.

Design-System Boundaries

This package owns the visual foundation of the platform.

It is intentionally not a business-logic package.

Do not place here:

API clients
Database logic
Prisma models
Authentication
Authorization
BullMQ workers
Payment integrations
AI orchestration
SANAD service integration
Tenant business rules

Those concerns belong to their respective application and infrastructure boundaries.

Package Relationship

Conceptually:

                    @lp/design-system
                           │
          ┌────────────────┼────────────────┐
          │                │                │
      Public UI       Student UI       Teacher UI
          │                │                │
          └────────────────┼────────────────┘
                           │
                  Multi-Tenant LMS

The design system is a shared visual foundation, not an application layer.

Global Design Principles
One Learning Universe

Every tenant should feel like part of the same platform.

Many Learning Identities

Teachers and subjects can express distinct identities without breaking the platform's visual language.

Consistency Over Customization

Customization exists within clear system boundaries.

Meaning Over Decoration

Visual differences should communicate hierarchy, state, subject, or identity.

Motion With Purpose

Animation should communicate feedback, continuity, or hierarchy.

Accessibility By Default

Accessibility is part of the component contract, not a final cleanup step.

RTL As a First-Class Direction

Arabic is not treated as a secondary rendering mode of an LTR-first system.

Source of Truth

The design-system source of truth is:

packages/design-system/tokens.css

Broader visual and motion rules are documented in:

docs/VISUAL_IDENTITY.md

When introducing or changing a token:

Update the source of truth.
Keep semantic naming consistent.
Check tenant override behavior.
Verify RTL behavior where applicable.
Verify reduced-motion behavior where applicable.
Avoid introducing one-off component constants without a clear system reason.
Design Governance

Before adding a new token, ask:

Does this represent a real reusable system concept, or is it solving a one-off component problem?

Prefer:

--color-action

over:

--teacher-card-gold

Prefer:

--motion-standard

over:

--special-button-animation

The design system should represent reusable concepts rather than individual screens.

Accessibility Checklist

Any new shared component should consider:

Semantic HTML
Keyboard operation
Visible focus
Focus order
Accessible labels
Screen-reader behavior
Sufficient contrast
RTL direction
Reduced motion
Disabled/loading states
Error states

Accessibility failures should be treated as component-quality issues.

Performance Principles

The design system should remain lightweight and predictable.

Prefer:

CSS transitions
transform
opacity
CSS variables
Compositor-friendly animation

Avoid unnecessary:

Layout-triggering animations
Heavy JavaScript animation
Global event listeners
Unbounded visual effects
Animation that changes layout unnecessarily

The design system should support the application's performance budget rather than fight it.

Documentation

The broader visual identity and motion standards are documented in:

docs/VISUAL_IDENTITY.md

This package provides the reusable implementation foundation for those standards.

Status

@lp/design-system is the shared visual foundation for the Multi-Tenant LMS.

It establishes the platform's visual and motion language while preserving tenant-level identity through controlled semantic token overrides.

Core Principle

The system stays the same. The learning identity changes.

One platform.
Many teachers.
Many subjects.
One design language.
