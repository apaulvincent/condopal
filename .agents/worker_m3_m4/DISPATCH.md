## 2026-08-16T05:07:01Z

You are Worker 2 for CondoPal, responsible for implementing Milestone 3 (Mobile-First Guest Booking Flow & Boarding-Pass Voucher) and Milestone 4 (Admin Management Hub & Operations Console).

Your working directory is: d:/Development/condopal/.agents/worker_m3_m4

Read ORIGINAL_REQUEST.md at d:/Development/condopal/ORIGINAL_REQUEST.md.
Read PROJECT.md at d:/Development/condopal/PROJECT.md.
Read TEST_INFRA.md at d:/Development/condopal/TEST_INFRA.md.
Read survey reports:
- d:/Development/condopal/.agents/survey_explorer_1/survey_db_report.md
- d:/Development/condopal/.agents/survey_explorer_2/survey_frontend_report.md
- d:/Development/condopal/.agents/survey_explorer_3/survey_design_test_report.md
Read the design skill at C:\Users\User\.gemini\config\skills\soft-skill\SKILL.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Assigned File Ownership:
- `src/context/BookingContext.tsx` (Complete state machine for 5-step wizard + URL SearchParams + LocalStorage draft sync & recovery)
- `src/context/AdminAuthContext.tsx` (Admin authentication state, login/logout, session persistence, demo login helper)
- `src/components/booking/Step1GuestInfo.tsx` (Full name, email, phone, contact preference, special requests)
- `src/components/booking/Step2DatePicker.tsx` (Interactive calendar, availability check against mock/supabase, blocked date markers, minimum stay night validation, dynamic night count)
- `src/components/booking/Step3GuestDetails.tsx` (Adults, children, infants steppers, max guest capacity validation, guest policy notes)
- `src/components/booking/Step4Extras.tsx` (Turnkey extras selector across all 4 pricing models: per_stay, per_night, per_guest, per_guest_per_night, with live price calculation)
- `src/components/booking/Step5Payment.tsx` (Payment method tabs for GCash, Maya, Bank Transfer; dynamic QR code & 1-click copy account details; 20% downpayment calculation; payment reference input; drag-and-drop proof uploader; atomic booking submission via `create_booking_atomic`)
- `src/components/booking/BookingSummaryCard.tsx` (Live itemized pricing breakdown card on desktop & collapsible bottom sheet on mobile)
- `src/components/voucher/BoardingPassVoucher.tsx` (Luxury boarding-pass voucher with dynamic SVG QR code, 1-click copy booking code, countdown timer to check-in, payment status badge, check-in instructions, print styling)
- `src/components/admin/AdminKPIs.tsx` (Real-time analytics: Total Revenue, Occupancy Rate %, Pending Verifications Count, Upcoming Check-ins)
- `src/components/admin/BookingsTable.tsx` (Filterable/searchable booking queue by status, unit, date range; view booking details & open lightbox)
- `src/components/admin/PaymentProofLightbox.tsx` (Modal with image zoom, rotation, reference checker, Approve payment button -> transitions to confirmed & verified, Reject payment button -> releases locked dates)
- `src/components/admin/CondoManager.tsx` (Property inventory editor to edit base price, weekend price, cleaning fee, amenities, description, and photos)
- `src/components/admin/DateBlockerCalendar.tsx` (Interactive condo calendar for admins to click dates to manually block/unblock maintenance or owner dates)
- `src/components/admin/ExtrasSettings.tsx` (Manager for add-on extras pricing and toggle enabled)
- `src/components/admin/PaymentMethodsSettings.tsx` (Editor for payment channel account details and QR codes)
- `src/views/BookingView.tsx` (Full 5-step booking flow container with progress bar, step navigation, validation, and mobile sticky summary)
- `src/views/ConfirmationView.tsx` (Live confirmation voucher page by `/confirmation/:bookingCode` with token security)
- `src/views/LookupView.tsx` (Guest booking finder by booking code + email with proof upload capability)
- `src/views/AdminLoginView.tsx` (Admin login view with demo credentials helper)
- `src/views/AdminDashboardView.tsx` (Full Admin Hub with tabbed navigation: Overview, Bookings Queue, Calendar Date Blocker, Condos, Extras & Payment Settings, Audit Logs)
- `src/App.tsx` (Update router with all views: `/`, `/book`, `/confirmation/:bookingCode`, `/lookup`, `/admin/login`, `/admin`)
