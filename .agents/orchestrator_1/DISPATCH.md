## 2026-08-16T04:58:23Z

Mission:
Build CondoPal, a modern mobile-first condo/resort accommodation booking SPA featuring a complete booking flow with real-time pricing, availability validation, admin management, Supabase database + RLS, high-end visual design, and comprehensive Vitest test suite.

Key Requirements:
1. R1: Mobile-first multi-step booking flow (Guest Info, Dates, Guest Details, Extras, Payment Options) with real-time pricing calculation (including reservation fees) and Supabase RPC/transactional logic strictly preventing double-booking.
2. R2: Admin dashboard & management to manage condos, pricing, extras, payment methods, settings, and verify/reject bookings & submitted payments.
3. R3: High-end visual design following the $150k agency aesthetic in C:\Users\User\.gemini\config\skills\soft-skill\SKILL.md (Tailwind CSS v4, shadcn/ui, custom cubic-bezier transitions, haptic depth, double-bezel cards, cinematic spatial rhythm, flawless mobile 360px+ responsiveness).
4. R4: Database & Auth foundation: Supabase PostgreSQL schema with RLS for guests, authenticated users, and admins. Strictly typed TypeScript with generated types and zero `any`.
5. Testing: Vitest unit and integration tests for date logic, capacity validation, pricing engine, concurrent booking prevention, and smoke test flow.
