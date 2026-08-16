# Orchestration Plan: CondoPal

## Phase 0: Survey & Scoping
- Spawn 3 Explorers/Spec Miners in parallel to examine workspace, existing assets/dependencies if any, define requirements, database/RPC schema, design system, and test harness requirements.
- Aggregate survey findings into `PROJECT.md` (Feature Inventory, Architecture, Milestones, Interface Contracts) and `TEST_INFRA.md`.

## Phase 1: Dual Track Execution
### Track A: Implementation Track
- **M1: Database & RPC Foundation**: Supabase PostgreSQL schema, migrations, tables (`condos`, `bookings`, `pricing_rules`, `extras`, `payment_methods`, `settings`, `audit_logs`), RLS policies, double-booking prevention RPC (`book_condo` / date overlap transaction with advisory locks/exclusion constraints), TypeScript type definitions generator/types.
- **M2: Core Engine & Design System Setup**: Vite + React + TypeScript + Tailwind CSS v4 + Lucide + Radix/shadcn primitives setup, $150k agency design system foundations (luxury color palette, typography, micro-interactions, double-bezel cards, haptic feedback, responsive containers), Pricing Engine (stay calculation, reservation fees, weekend/seasonal rates, extras calculation).
- **M3: Mobile-First Guest Booking Flow (R1 & R3)**: Step 1 (Guest Info/Authentication option), Step 2 (Interactive Date Picker with real-time availability/stay restrictions), Step 3 (Guest details & capacity validation), Step 4 (Addon/Extras selection with live pricing updates), Step 5 (Payment options/receipt upload & confirmation with booking code/summary).
- **M4: Admin Management & Dashboard (R2)**: Protected Admin route, booking queue (pending/confirmed/rejected), payment verification/receipt viewer, condo inventory & availability manager, pricing & extras editor, payment methods settings.

### Track B: E2E Testing Track
- Setup Vitest test runner and harness.
- Create Tier 1 (Feature Coverage), Tier 2 (Boundary & Corner Cases), Tier 3 (Cross-Feature Combinations), Tier 4 (Real-World Application Scenarios).
- Publish `TEST_READY.md`.

## Phase 2: Final Verification & Hardening
- M5: Pass 100% E2E test suite (Tiers 1-4).
- Phase 2: Adversarial Coverage Hardening (Tier 5) with Challengers and Forensic Auditor.
- Complete final handoff and report to Sentinel.
