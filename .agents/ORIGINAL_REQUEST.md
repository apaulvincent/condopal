# Original User Request

## Initial Request — 2026-08-16T04:58:07Z

CondoPal is a modern, mobile-first condo/resort accommodation booking SPA featuring a complete booking flow with real-time pricing, availability validation, and admin management.

Working directory: d:/Development/condopal
Integrity mode: development

## Requirements

### R1. Implement the Booking Experience (Mobile-First)
Build a multi-step booking flow (Guest Info, Dates, Guest Details, Extras, Payment Options) that accurately calculates pricing (including reservation fees) and strictly prevents double-booking using Supabase RPC/transactional logic.

### R2. Implement Admin Dashboard & Management
Build an admin dashboard to manage condos, pricing, extras, payment methods, settings, and verify/reject bookings and submitted payments.

### R3. Apply High-End Visual Design
The frontend must follow a premium "$150k agency" aesthetic. You must follow the principles outlined in the `high-end-visual-design` skill (`C:\Users\User\.gemini\config\skills\soft-skill\SKILL.md`). Utilize Tailwind CSS v4, shadcn/ui, and custom cubic-bezier transitions with haptic depth, double-bezel cards, and cinematic spatial rhythm.

### R4. Database & Auth Foundation
Configure a Supabase PostgreSQL schema with proper Row Level Security (RLS) for guests, authenticated users, and admins. Ensure generated TypeScript types are used consistently.

## Acceptance Criteria

### Technical & Functional
- [ ] The global smoke test passes: A user can browse, book, and receive a reference, and an admin can confirm the payment.
- [ ] Double-booking is strictly prevented (verified via concurrent booking tests).
- [ ] No floating-point errors in price calculations.

### Design & Accessibility
- [ ] The UI utilizes a premium typography and spacing scale, with nested enclosures (double-bezel) for major cards, avoiding basic templates.
- [ ] Forms, calendars, and guest counters are fully keyboard and screen-reader accessible.
- [ ] The application operates flawlessly on mobile (360px+), collapsing asymmetric layouts elegantly.

### Code Quality
- [ ] TypeScript is strictly typed with no `any`.
- [ ] Vitest unit tests pass for date logic, capacity validation, and the pricing engine.
