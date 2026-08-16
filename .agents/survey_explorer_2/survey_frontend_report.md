# CondoPal — Frontend Application Architecture & Flow Specification
**Author:** Survey Explorer 2 (Frontend Architecture & Booking/Admin Flow Architect)  
**Date:** 2026-08-16  
**Status:** READY_FOR_IMPLEMENTATION  
**Target Build:** React 18/19 SPA + Vite + TypeScript + Tailwind CSS v4 + Radix UI / shadcn + Supabase

---

## 1. Executive Summary & Design Philosophy

CondoPal is engineered as a world-class, mobile-first resort and condominium accommodation booking Single Page Application (SPA). The application delivers an **editorial luxury** booking experience reminiscent of top boutique hospitality brands (Aman, One&Only, Airbnb Luxe), while providing administrators with a robust, enterprise-grade back-office operations console.

### Core Architectural Pillars
1. **$150k Agency Aesthetic:** Adheres strictly to high-end design principles — double-bezel card architectures (nested physical enclosure feel), warm editorial/charcoal palettes, custom cubic-bezier fluid dynamics (`cubic-bezier(0.32, 0.72, 0, 1)`), micro-haptic kinetic feedback, and zero generic UI slop.
2. **Zero-Friction Mobile-First Guest Booking (R1):** A 5-step wizard with real-time dynamic pricing, interactive calendar availability, multi-channel payment receipt upload, and URL/localStorage state persistence resilient against accidental refreshes.
3. **Printable & Live-Trackable Booking Card:** Boarding-pass style confirmation with instant dynamic QR code, countdown verification timers, downloadable voucher, and direct WhatsApp/calendar integration.
4. **Command-Center Admin Portal (R2):** Protected, role-gated back-office with real-time KPI overview, multi-tab booking queues, proof-of-payment inspection lightbox with zoom/rotate, date blocking matrix, seasonal pricing overrides, and extras/payment method management.
5. **Strict Type Safety & Zero-`any` Standard:** 100% typed data flows from Supabase schema to React component props, forms validated via Zod schemas.

---

## 2. Technical Stack & Component Topology

### 2.1 Technology Matrix

| Layer | Technology | Rationale & Configuration |
|---|---|---|
| **Core Framework** | React 18/19 + TypeScript (Strict) | Component-driven SPA, concurrent rendering, strict null checks, zero `any`. |
| **Build & Tooling** | Vite 6.x | Sub-second HMR, optimized ESM bundling, fast Vitest execution. |
| **Styling & Design** | Tailwind CSS v4 (`@tailwindcss/vite`) | Next-gen CSS-first engine, zero-runtime overhead, CSS variables for fluid tokens. |
| **Primitive Components** | Radix UI + shadcn/ui patterns | Headless, accessible (WAI-ARIA compliant) primitives styled with bespoke luxury tokens. |
| **Icons** | Lucide React (Ultra-light stroke: `strokeWidth={1.5}`) | Consistent, crisp, modern iconography. |
| **Date & Time Engine** | `date-fns` v3 | Modular tree-shakable date calculations, range validations, timezone safety. |
| **Form & Validation** | `react-hook-form` + `zod` | Declarative validation, performant non-rendering inputs, strictly typed schemas. |
| **State Management** | URL SearchParams + `zustand` + `localStorage` | URL-first state for step navigation and shareability, persistent draft recovery. |
| **Backend & Storage** | Supabase JS Client (`@supabase/supabase-js`) | PostgreSQL RLS, RPC transaction calls, Auth session, Storage for receipts & photos. |
| **Voucher & QR** | `qrcode.react` (SVG) + `html2canvas` / CSS Print | Scalable vector QR codes and pixel-perfect print styling. |
| **Feedback & Motion** | `sonner` (Toast) + `canvas-confetti` + Tailwind Keyframes | Tactile feedback, joyful completion celebrations, smooth layout transitions. |

---

### 2.2 Directory Structure & Module Organization

```
d:/Development/condopal/
├── src/
│   ├── assets/                     # Luxury background textures, logo SVGs, fallback images
│   ├── components/
│   │   ├── ui/                     # Radix/shadcn Double-Bezel luxury primitives
│   │   │   ├── button.tsx          # Pill buttons with nested trailing icon islands
│   │   │   ├── card.tsx            # Double-bezel outer shell + inner core container
│   │   │   ├── input.tsx           # Hairline bordered, floating label input
│   │   │   ├── calendar.tsx        # Custom range calendar with availability overlays
│   │   │   ├── dialog.tsx          # Heavy glass modal backdrop with staggered reveals
│   │   │   ├── sheet.tsx           # Mobile slide-over drawer for summary breakdown
│   │   │   ├── badge.tsx           # Microscopic pill badge with uppercase tracking
│   │   │   ├── tabs.tsx            # Fluid pill tabs with spring highlight indicator
│   │   │   ├── tooltip.tsx         # Floating contextual price & policy tooltips
│   │   │   └── toast.tsx           # Sonner luxury theme wrapper
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # Floating glass pill navbar with magnetic links
│   │   │   ├── Footer.tsx          # Editorial luxury footer with quick links & badges
│   │   │   └── AdminLayout.tsx     # Collapsible sidebar, breadcrumb, status bar & user menu
│   │   └── shared/
│   │       ├── CurrencyDisplay.tsx # Formatted currency with sub-cent support and currency toggle
│   │       ├── StatusBadge.tsx     # Color-coded booking status pill (pending, confirmed, etc.)
│   │       ├── ImageLightbox.tsx   # Receipt & gallery viewer with pan, zoom, rotate
│   │       └── LoadingSkeletons.tsx# Shimmer placeholders for smooth async transitions
│   │
│   ├── features/
│   │   ├── guest/                  # Guest-facing experience
│   │   │   ├── components/
│   │   │   │   ├── HeroSection.tsx       # Cinematic hero with showcase gallery
│   │   │   │   ├── CondoOverview.tsx     # Unit specs, amenities bento, house rules
│   │   │   │   ├── BookingWizard.tsx     # Multi-step orchestrator component
│   │   │   │   ├── Step1GuestInfo.tsx    # Personal details, contacts, special notes
│   │   │   │   ├── Step2DatePicker.tsx   # Interactive stay date selector
│   │   │   │   ├── Step3GuestDetails.tsx # Adults/children/infants capacity stepper
│   │   │   │   ├── Step4Addons.tsx       # Extras selection with live recalculation
│   │   │   │   ├── Step5Payment.tsx      # Payment method, QR viewer & proof uploader
│   │   │   │   ├── PricingSidebar.tsx    # Live sticky quote breakdown card (Desktop)
│   │   │   │   ├── StickyMobileBar.tsx   # Floating bottom action bar with expandable sheet
│   │   │   │   └── ConfirmationCard.tsx  # Boarding-pass voucher with QR & instructions
│   │   │   ├── hooks/
│   │   │   │   ├── useBookingWizard.ts   # Multi-step state, draft recovery, step validation
│   │   │   │   └── useBookingLookup.ts   # Fetch booking by code + contact check
│   │   │   └── pages/
│   │   │       ├── HomePage.tsx          # Landing & Condo showcase
│   │   │       ├── BookPage.tsx          # Dedicated booking flow route
│   │   │       ├── ConfirmationPage.tsx  # Post-submission confirmation & voucher
│   │   │       └── LookupPage.tsx        # Guest booking lookup page
│   │   │
│   │   ├── admin/                  # Admin back-office console
│   │   │   ├── components/
│   │   │   │   ├── AdminAuthGate.tsx     # Route protection & role verification
│   │   │   │   ├── DashboardMetrics.tsx  # Revenue, Occupancy, Verification queue KPI cards
│   │   │   │   ├── BookingsTable.tsx     # Filterable, sortable booking data table
│   │   │   │   ├── BookingDetailDrawer.tsx # Comprehensive booking inspector
│   │   │   │   ├── VerificationModal.tsx # Approve / Reject modal with custom guest notes
│   │   │   │   ├── CondoEditor.tsx       # Unit rates, descriptions, amenities & photos
│   │   │   │   ├── CalendarBlocker.tsx   # Interactive grid to block/unblock dates
│   │   │   │   ├── SeasonalRatesModal.tsx# Peak/promo rules configurator
│   │   │   │   ├── ExtrasManager.tsx     # Addons CRUD table & modal
│   │   │   │   └── PaymentSettings.tsx   # Bank accounts, QR codes, deposit policy
│   │   │   ├── hooks/
│   │   │   │   ├── useAdminBookings.ts   # Real-time booking queries & subscriptions
│   │   │   │   ├── useAdminMetrics.ts    # KPI aggregation & monthly revenue calculations
│   │   │   │   └── useAdminInventory.ts  # Condo, extras, pricing rules mutations
│   │   │   └── pages/
│   │   │       ├── AdminLoginPage.tsx    # Secure admin authentication
│   │   │       ├── AdminDashboardPage.tsx# High-level overview & action queues
│   │   │       ├── AdminBookingsPage.tsx # Full bookings management grid
│   │   │       ├── AdminInventoryPage.tsx# Condo details & calendar blocking
│   │   │       └── AdminSettingsPage.tsx # Pricing, Extras, Payment Channels, Policy
│   │   │
│   │   └── pricing/                # Core Pricing Engine
│   │       ├── pricingEngine.ts    # Pure functional calculation engine
│   │       ├── pricingEngine.test.ts # Vitest test suite for rate calculations
│   │       └── pricingTypes.ts     # Types for rates, seasonal multipliers, extras
│   │
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client initialization & auth helpers
│   │   ├── dateUtils.ts            # Date formatting, range checks, overlap detection
│   │   ├── formatters.ts           # Currency, phone, and booking code formatters
│   │   ├── storage.ts              # LocalStorage draft serialization & recovery
│   │   ├── validators.ts           # Zod schemas for all forms
│   │   └── utils.ts                # Tailwind clsx + twMerge helper (`cn()`)
│   │
│   ├── types/
│   │   ├── database.types.ts       # Generated Supabase PostgreSQL TypeScript types
│   │   ├── booking.types.ts        # Booking domain entities & wizard state types
│   │   ├── condo.types.ts          # Condo unit, amenities, rules & pricing types
│   │   └── admin.types.ts          # Admin metrics, audit logs & filter types
│   │
│   ├── App.tsx                     # Top-level Router configuration & Providers
│   ├── main.tsx                    # React DOM entry point
│   └── index.css                   # Tailwind CSS v4 theme, fonts, custom keyframes
```

---

## 3. Router Setup & Route Topology

The application utilizes **React Router** (or TanStack Router compatible conventions) with URL-synced wizard state and protected admin sub-trees.

```
/ (Guest Home / Showcase)
├── /book (Booking Wizard — URL params: ?step=1..5&checkIn=...&checkOut=...)
├── /confirmation/:bookingCode (Guest Voucher & Real-Time Status)
├── /lookup (Guest Self-Service Booking Search)
│
├── /admin/login (Admin Credentials Auth)
└── /admin (Admin Console — Protected by <AdminAuthGate>)
    ├── /admin (Overview & KPI Dashboard)
    ├── /admin/bookings (Bookings Queue, Filter Tabs, Verification Drawer)
    ├── /admin/inventory (Condo Profile, Photos, Amenities, Calendar Date Blocker)
    ├── /admin/pricing (Base Rates, Seasonal Overrides, Weekend Rules)
    ├── /admin/extras (Addon Services & Inventory)
    └── /admin/settings (Payment Methods, QR Uploads, Deposit Policies, House Rules)
```

### Route Guard Architecture (`AdminAuthGate.tsx`)
```tsx
// Architectural Pattern:
export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) return <AdminLoadingScreen />;
  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return <AdminLayout>{children}</AdminLayout>;
}
```

---

## 4. $150k Agency Visual Design Implementation (R3 Standard)

To meet the high-end visual requirements specified in the agency design standard, the frontend implements the following design system:

### 4.1 Color Tokens & Material Palette
* **Canvas / Foundation:** Deep OLED Charcoal (`#090D14`) for dark accents, Warm Editorial Linen/Cream (`#FAF8F5`) for primary guest background, Crisp Porcelain (`#FFFFFF`) for inner card cores.
* **Luxury Accents:** 
  * *Champagne Gold:* `#D4AF37` / `#B48C28` (Subtle badges, luxury borders, star ratings)
  * *Emerald Verdant:* `#10B981` / `#047857` (Confirmed reservations, active status, success toast)
  * *Deep Amber:* `#F59E0B` / `#B45309` (Pending receipt verification, deposit countdowns)
  * *Crimson Rose:* `#EF4444` / `#991B1B` (Blocked dates, invalid inputs, rejections)
* **Hairline Borders:** `rgba(0, 0, 0, 0.06)` in light mode, `rgba(255, 255, 255, 0.10)` in dark/frosted mode.
* **Typography:** `Plus Jakarta Sans` for clean, geometric UI text; `Playfair Display` or `Geist` for editorial luxury headings and pricing numerals (`font-feature-settings: "tnum"` for tabular figures).

### 4.2 The "Double-Bezel" (Doppelrand) Architecture
Every primary card (pricing sidebar, step container, admin metric card, voucher) utilizes nested concentric geometric enclosures:

```html
<!-- Double-Bezel Container Template -->
<div class="rounded-[2rem] p-1.5 bg-stone-200/70 dark:bg-white/10 ring-1 ring-stone-900/5 dark:ring-white/10 shadow-2xl shadow-stone-900/5 transition-all duration-500">
  <div class="rounded-[calc(2rem-0.375rem)] bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl p-6 sm:p-8 border border-white/60 dark:border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
    <!-- Component Content -->
  </div>
</div>
```

### 4.3 Nested Island Button Pattern
Primary interactive call-to-actions (e.g., "Continue to Dates", "Submit Reservation", "Approve Booking") feature an integrated trailing icon bubble:

```html
<!-- Nested Island Pill Button -->
<button class="group relative inline-flex items-center justify-between gap-4 px-7 py-3.5 rounded-full bg-stone-900 text-stone-50 font-medium tracking-wide shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
  <span>Continue to Dates</span>
  <span class="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-[1px]">
    <ArrowRight class="w-4 h-4 stroke-[1.5]" />
  </span>
</button>
```

---

## 5. Mobile-First Multi-Step Guest Booking Flow (R1 Specification)

The guest booking flow is structured into **5 sequential steps** plus a confirmation screen. The interface operates seamlessly across all viewports from 360px mobile screens to 4K ultra-wide monitors.

```
[ Step 1: Guest Info ]
         │
         ▼
[ Step 2: Interactive Calendar & Dates ]
         │
         ▼
[ Step 3: Guest & Capacity Breakdown ]
         │
         ▼
[ Step 4: Addons & Extras Configurator ]
         │
         ▼
[ Step 5: Payment Method & Proof Upload ]
         │
         ▼
[ Confirmation Screen & Printable Card ]
```

### 5.1 State Machine & Persistence Architecture
* **State Source:** React Context / Zustand store synchronized with URL Search Parameters (`?step=2&in=2026-10-24&out=2026-10-27&adults=2`).
* **Draft Recovery:** State changes automatically serialize to `localStorage.setItem('condopal_draft_v1', JSON.stringify(state))`.
* **Auto-Restore Prompt:** If a guest returns to the site within 48 hours with an unfinished draft, a luxury toast appears: *"We found your previous booking selection. Would you like to resume?"* with "Resume" and "Start Fresh" buttons.

```typescript
// Core Booking State Type Definition
export interface BookingDraftState {
  step: 1 | 2 | 3 | 4 | 5;
  condoId: string;
  // Step 1: Guest Info
  guest: {
    fullName: string;
    email: string;
    phone: string;
    specialRequests: string;
    preferredContactMethod: 'whatsapp' | 'email' | 'sms';
  };
  // Step 2: Dates
  stay: {
    checkInDate: string | null;   // YYYY-MM-DD
    checkOutDate: string | null;  // YYYY-MM-DD
    totalNights: number;
  };
  // Step 3: Guests
  occupancy: {
    adults: number;
    children: number;
    infants: number;
  };
  // Step 4: Addons
  selectedExtras: Array<{
    extraId: string;
    name: string;
    price: number;
    pricingType: 'per_stay' | 'per_night' | 'per_guest' | 'per_quantity';
    quantity: number;
  }>;
  // Step 5: Payment
  payment: {
    paymentMethodId: string;
    paymentType: 'deposit_only' | 'full_amount';
    referenceNumber: string;
    proofFile: File | null;
    proofFilePreviewUrl: string | null;
    agreedToTerms: boolean;
  };
  // Calculated Pricing Cache
  pricingSummary: PricingBreakdown | null;
}
```

---

### 5.2 Step-by-Step UI & Interaction Details

#### Step 1: Guest Information
* **Header:** Micro-pill badge `[ 01 / 05 — GUEST IDENTIFICATION ]` + Editorial Heading `"Who is staying with us?"`.
* **Form Controls:**
  * **Full Name:** Floating label input with auto-capitalization and autofocus.
  * **Email Address:** RFC 5322 validation, real-time debounce hint (e.g. suggests fixing `user@gamil.com` → `user@gmail.com`).
  * **Mobile / WhatsApp Number:** International phone prefix dropdown (+63 for Philippines, +1 for US, etc.) with number formatting.
  * **Preferred Communication Channel:** 3-way toggle pill (WhatsApp / Email / SMS) for check-in notifications.
  * **Special Requests / Notes:** Expandable luxury textarea with 500-character counter (e.g. "Late arrival at 9 PM", "Anniversary setup").
* **Validation Barrier:** `zod` schema checks name length $\ge 2$, valid email, and phone number.

#### Step 2: Interactive Date Picker & Availability Engine
* **Header:** Micro-pill badge `[ 02 / 05 — STAY SCHEDULE ]` + Editorial Heading `"Select your arrival & departure dates"`.
* **Calendar Component:**
  * Dual-month view on desktop (`md:` and above), single-month swipeable carousel on mobile.
  * **Live Availability Sync:** Fetches blocked date intervals from Supabase `condo_blocked_dates` and active `bookings` where status is `confirmed`, `pending`, or `checked_in`.
  * **Day Cell Visual Grammar:**
    * *Available:* Crisp dark typography on linen canvas.
    * *Selected (Range):* Seamless emerald/slate horizontal ribbon connecting start and end dates.
    * *Check-in / Check-out bounds:* Rounded pill caps with white typography.
    * *Blocked / Booked:* Subtle diagonal crosshatch pattern (`bg-stripes`), muted text, pointer-events disabled, tooltip explaining "Unavailable / Booked".
    * *Minimum Stay Alert:* Dynamic warning if selected range $< 2$ nights (or seasonal min stay).
  * **Dynamic Night Counter Pill:** Real-time badge above the calendar: `"✨ 3 Nights Selected (Fri, Oct 24 — Mon, Oct 27, 2026)"`.
  * **Check-in / Check-out Times:** Micro-callout: `Check-in: 2:00 PM` • `Check-out: 11:00 AM`.

#### Step 3: Guest Details & Capacity Constraints
* **Header:** Micro-pill badge `[ 03 / 05 — PARTY SIZE ]` + Editorial Heading `"Who is joining your stay?"`.
* **Capacity Meter:** Visual progress bar indicating capacity limit (e.g. `2 of 4 Max Capacity (Standard 2 Guests Included)`).
* **Steppers:**
  * **Adults (Ages 13+):** Stepper `[-] [ 2 ] [+]` (Min 1, Max Condo Limit).
  * **Children (Ages 3–12):** Stepper `[-] [ 0 ] [+]` (Counts toward max capacity).
  * **Infants (Under 3):** Stepper `[-] [ 0 ] [+]` (Free of charge, does not count against max capacity, pack-and-play crib note).
* **Extra Guest Surcharge Dynamic Notification:** If total adults + children $>$ base included guests (e.g. $> 2$), displays a live alert: *"+₱500 / night for each additional guest beyond 2"*.

#### Step 4: Addons & Extras Live Configurator
* **Header:** Micro-pill badge `[ 04 / 05 — CURATED EXPERIENCES ]` + Editorial Heading `"Enhance your retreat"`.
* **Interactive Addon Cards Grid:**
  * **Airport Shuttle / Transfer:** Round-trip or one-way private van service (Fixed ₱1,800 per stay).
  * **Resort Pool & Clubhouse Passes:** Access wristbands (₱200 per guest per day).
  * **Extra Premium Foam Bed & Linens:** Sanitized rollaway bed (₱600 per night).
  * **Guaranteed Late Check-out (2:00 PM):** Subject to schedule (₱800 per stay).
  * **BBQ & Roof Deck Grilling Kit:** Charcoal, skewers, cleaning prep (₱500 per stay).
  * **High-Speed Portable Pocket WiFi:** 50Mbps unlimited backup (₱150 per night).
* **Selection Mechanism:** Double-bezel card with toggle switch or quantity stepper. Selecting an item instantly updates the live pricing breakdown sidebar with micro-animations.

#### Step 5: Payment & Proof Submission
* **Header:** Micro-pill badge `[ 05 / 05 — RESERVATION & PAYMENT ]` + Editorial Heading `"Confirm your reservation"`.
* **Reservation Fee Breakdown Card:**
  * Nightly Rate $\times$ Nights (with breakdown of weekday vs weekend pricing)
  * Extra Guests Fee (if applicable)
  * Curated Addons Total
  * Cleaning / Turnover Fee
  * **Total Stay Amount:** e.g., ₱12,500.00
  * **Reservation Deposit Required (30% or 50%):** e.g., ₱3,750.00 *(Secures your booking immediately)*
  * **Balance Payable upon Check-in:** e.g., ₱8,750.00 *(Cash, GCash, or Card at front desk)*
* **Payment Method Selector:**
  * Fluid segmented tabs: **GCash** | **Maya** | **BDO Bank Transfer** | **BPI Bank Transfer** | **UnionBank**.
* **Dynamic Payment Channel Details Panel:**
  * High-res QR code image with download button.
  * Account Name: `CondoPal Hospitality Inc.`
  * Account Number / Mobile: `0917-890-1234` with 1-click **"Copy Number"** button with haptic toast confirmation.
  * Instructions: *"Please scan the QR code or transfer the reservation fee of ₱3,750.00, then upload your transfer receipt/screenshot below."*
* **Proof of Payment Uploader:**
  * Drag-and-drop file zone + "Take Photo / Browse" button for mobile cameras.
  * Supported formats: JPEG, PNG, WEBP, PDF (Max 5MB).
  * Client-side preview with image thumbnail, file size check, and "Remove/Replace" button.
* **Payment Reference Number Input:**
  * Mandatory field for GCash Ref # (13 digits) or Bank Trace Number with inline format validation.
* **Terms & Cancellation Policy Checkbox:**
  * "I agree to the House Rules, 48-hour free cancellation policy, and security deposit terms." (With clickable modal view).
* **Submit Action:**
  * Full-width double-bezel primary button: **"Complete Booking & Submit Receipt"**.
  * Prevents double-clicks (disables on submit), displays an animated spinner with step progression (*"Securing calendar dates..."* $\rightarrow$ *"Uploading payment proof..."* $\rightarrow$ *"Booking Confirmed!"*).

---

### 5.3 Live Pricing Engine Specification

The pricing engine operates as a deterministic, pure TypeScript calculation module (`src/features/pricing/pricingEngine.ts`):

$$\text{Total Stay} = \sum_{d \in \text{Dates}} \text{Rate}(d) + (\text{ExtraGuests} \times \text{ExtraGuestFee} \times N) + \text{AddonsTotal} + \text{CleaningFee}$$

$$\text{Deposit Required} = \text{Total Stay} \times \text{DepositPercentage} \quad (\text{or Fixed Deposit Amount})$$

$$\text{Balance Due at Check-in} = \text{Total Stay} - \text{Deposit Required}$$

```typescript
export interface PricingCalculationParams {
  checkInDate: Date;
  checkOutDate: Date;
  baseRateWeekday: number;
  baseRateWeekend: number;
  seasonalRules: Array<{ startDate: Date; endDate: Date; rateMultiplier?: number; fixedRate?: number }>;
  adults: number;
  children: number;
  baseGuestsIncluded: number;
  extraGuestFeePerNight: number;
  cleaningFee: number;
  depositPercentage: number; // e.g. 0.30 for 30%
  selectedExtras: Array<{ price: number; pricingType: string; quantity: number }>;
}

export interface PricingBreakdown {
  nightlyBreakdown: Array<{ date: string; rate: number; isWeekend: boolean; seasonName?: string }>;
  nightsCount: number;
  baseRoomSubtotal: number;
  extraGuestSubtotal: number;
  extrasSubtotal: number;
  cleaningFee: number;
  totalStayAmount: number;
  depositRequired: number;
  balanceDueAtCheckIn: number;
}
```

---

### 5.4 Confirmation & Voucher Screen Experience

Upon successful booking submission, the guest is routed to `/confirmation/:bookingCode` with a celebration burst of confetti (`canvas-confetti`).

```
┌─────────────────────────────────────────────────────────────┐
│                    CONDOPAL LUXURY VOUCHER                  │
│                     Booking Reference: CP-2026-8F92A        │
├──────────────────────────────┬──────────────────────────────┤
│ GUEST: Maria Santos          │ STATUS: [ 🟡 Verification ]  │
│ DATES: Oct 24 – Oct 27, 2026 │ PAID DEPOSIT: ₱3,750.00      │
│ UNIT: Oceanview Suite 14B    │ BALANCE AT CHECK-IN: ₱8,750  │
├──────────────────────────────┴──────────────────────────────┤
│ [ QR CODE ]   Scan to verify reservation / present at lobby │
├─────────────────────────────────────────────────────────────┤
│ 📍 LOBBY ADDRESS & CHECK-IN INSTRUCTIONS:                   │
│ • Tower 2 Concierge, Azure Urban Resort Residences          │
│ • Check-in Time: 2:00 PM • Keycard Lockbox PIN: 8492        │
│ • High-Speed WiFi SSID: CondoPal_14B (Pass: AzurePal2026)   │
├─────────────────────────────────────────────────────────────┤
│ [ 🖨️ Print Voucher ]  [ 📅 Add to Apple/Google ]  [ 💬 Host ]│
└─────────────────────────────────────────────────────────────┘
```

* **Boarding-Pass Layout:** Clean editorial luxury aesthetic with perforated ticket line styling.
* **Live Status Badge:**
  * `🟡 Pending Verification` — "Our concierge is verifying your payment receipt (typically within 1–2 hours)."
  * `🟢 Confirmed & Locked` — "Payment verified! Your unit is secured."
  * `🔴 Action Required` — "Receipt could not be verified. Please re-upload or contact support."
* **Interactive Features:**
  * **QR Code Generator:** Live SVG QR code containing the secure verification URL.
  * **1-Click Copy Booking Code:** Copies reference code with haptic toast notification.
  * **Apple / Google Calendar Integration:** Generates `.ics` calendar file with check-in, check-out, and address.
  * **Print / PDF Generator:** Optimized CSS `@media print` layout that prints a crisp physical voucher without web navigation chrome.
  * **Direct WhatsApp Concierge:** Opens WhatsApp chat with pre-populated message: *"Hi CondoPal Concierge, I have a question regarding my booking CP-2026-8F92A."*

---

## 6. Admin Management Dashboard (R2 Specification)

The Admin Portal is a comprehensive, desktop-first and tablet-responsive management suite for property managers and resort hosts.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  CONDOPAL ADMIN CONSOLE                           [ 🔔 3 ]  [ Alex Host ▾ ] │
├───────────────┬──────────────────────────────────────────────────────────────┤
│  📊 Overview  │  MONTH REVENUE    OCCUPANCY RATE   PENDING QUEUE   UPCOMING  │
│  📋 Bookings  │    ₱248,500.00         84.2%        3 Bookings     6 Guests  │
│  🏢 Inventory ├──────────────────────────────────────────────────────────────┤
│  📅 Calendar  │  VERIFICATION ACTION QUEUE (NEEDS REVIEW)                    │
│  ✨ Extras    │  • CP-2026-8F92A (Maria Santos) - ₱3,750 via GCash [Inspect] │
│  💳 Payments  │  • CP-2026-9C14B (John Doe)     - ₱4,500 via BDO   [Inspect] │
│  ⚙️ Settings  │                                                              │
└───────────────┴──────────────────────────────────────────────────────────────┘
```

### 6.1 Section 1: Executive KPI Overview
1. **Total Monthly Revenue:** Displays Gross Bookings vs. Cleared Funds, with percentage comparison to previous month (`+18.4% vs last month`).
2. **Occupancy Rate Gauge:** Real-time occupancy percentage calculation for current 30-day window.
3. **Pending Verification Queue Card:** High-visibility amber card displaying count of unverified booking receipts with pulsing alert dot.
4. **Upcoming Check-ins & Check-outs:** Next 48-hour guest arrival & departure schedule for housekeeping and front-desk preparation.

---

### 6.2 Section 2: Bookings Management & Verification Center
* **Filter Tabs:** `All Bookings` | `🟡 Pending Verification (3)` | `🟢 Confirmed` | `🔵 Checked In` | `⚪ Completed` | `🔴 Rejected / Cancelled`.
* **Search & Sorting:** Instant search by Guest Name, Email, Phone Number, or Booking Reference Code.
* **Data Table Columns:**
  * Booking Code (e.g. `CP-2026-8F92A`)
  * Guest Details (Avatar, Name, Email, Phone)
  * Stay Dates (Check-in $\rightarrow$ Check-out, Nights)
  * Financials (Total, Deposit Paid, Balance Due, Payment Channel)
  * Status Badge
  * Actions (`Inspect`, `Approve`, `Reject`, `Print`)

#### Verification Drawer & Proof Lightbox
Clicking on any booking opens a comprehensive side drawer / modal:
* **Guest & Booking Details:** Full breakdown of party size, selected extras, guest special notes.
* **Proof of Payment Viewer:**
  * High-resolution image viewport with **Zoom In / Out**, **Rotate $90^\circ$**, and **Open Original** controls.
  * Displayed Reference Number side-by-side with guest input for effortless cross-referencing.
* **Action Workflow:**
  * **"Approve & Confirm Booking" Button:**
    * Prompts one-click confirmation.
    * Updates booking status in Supabase to `confirmed`.
    * Triggers automated email notification with lockbox codes & check-in guidelines.
    * Locks calendar dates permanently.
  * **"Reject / Request Re-upload" Button:**
    * Opens modal with pre-configured rejection reasons:
      * *Reference Number mismatch*
      * *Image blurred or unreadable*
      * *Incorrect payment amount transferred*
      * *Payment sent to invalid account*
      * *Other (Custom explanation)*
    * Sends instant notification to guest with secure re-upload link.
  * **Lifecycle Status Modifiers:** "Mark as Checked-In", "Mark as Completed", "Process Cancellation / Refund".

---

### 6.3 Section 3: Condo & Inventory Manager
* **Condo Information Editor:**
  * Unit Title (e.g. *"Azure Oceanview Luxury Penthouse 14B"*).
  * Tagline & Editorial Description (Rich markdown support).
  * Physical Location, Building, Floor, and Door/Lockbox Number.
* **Capacity & Accommodation Rules:**
  * Max Guest Capacity (e.g. 4)
  * Base Included Guests (e.g. 2)
  * Extra Guest Surcharge (e.g. ₱500/night per guest)
  * Bedroom, Bed, and Bathroom configuration (e.g. 1 Queen, 1 Sofa Bed, 1 Bath).
* **Photo Gallery Manager:**
  * Drag-and-drop multi-image upload directly to Supabase Storage bucket (`condo-media`).
  * Drag to reorder photos (sets primary hero cover photo).
  * Image captioning and deletion.
* **Amenities & Features Checklist:**
  * Grouped checkboxes: *Entertainment & Tech* (Netflix, 100Mbps Fiber, Smart TV), *Kitchen* (Refrigerator, Microwave, Induction Cooker, Nespresso), *Resort Amenities* (Wave Pool, White Sand Beach, Gym, Spa).

---

### 6.4 Section 4: Pricing, Seasonal Rules & Calendar Date Blocker
* **Base Rates Configurator:**
  * Standard Weekday Rate (Sunday–Thursday, e.g. ₱3,200/night).
  * Weekend Rate (Friday–Saturday, e.g. ₱3,800/night).
  * Standard Cleaning Fee (e.g. ₱600 per stay).
* **Seasonal & Holiday Rules Engine:**
  * Add custom date range rules (e.g., *"Christmas & New Year Peak"* Dec 20 – Jan 5 $\rightarrow$ Fixed ₱5,500/night or $+40\%$, Min Stay 3 nights).
  * *"Summer Promo"* (April 1 – May 31 $\rightarrow$ $-15\%$).
* **Interactive Calendar Date Blocker Matrix:**
  * Interactive 12-month visual grid.
  * Hosts can **click-and-drag across dates** to toggle block status:
    * Block reason: *Host Maintenance*, *Owner Personal Use*, *External OTA Booking (Airbnb/Agoda)*.
    * Unblock dates with 1 click.

---

### 6.5 Section 5: Extras & Payment Methods Settings
* **Extras / Addons Configurator:**
  * Create, edit, and disable add-on experiences.
  * Set billing frequency (`per_stay`, `per_night`, `per_guest`, `per_quantity`).
  * Set price and inventory cap (e.g. only 2 pocket WiFis available).
* **Payment Methods Configurator:**
  * Enable / Disable payment channels (GCash, Maya, BDO, BPI, UnionBank, PayPal/Stripe).
  * Upload custom QR code images per channel.
  * Set Account Name and Account Number.
* **Deposit & Security Policies:**
  * Reservation Deposit Mode: **Percentage** (e.g. 30%, 50%) vs **Fixed Amount** (e.g. ₱1,500).
  * Payment Grace Period: Auto-cancel pending reservations if receipt is not uploaded within $X$ hours (default: 2 hours).
  * Security Deposit Amount (refundable incidental deposit upon arrival).

---

## 7. Frontend State Management & Supabase Data Contract

### 7.1 Client-Side Query & Mutation Layer

```typescript
// Example Supabase Data Access Functions

// 1. Fetch Calendar Blocked Dates
export async function getCondoAvailability(condoId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('condo_availability_view')
    .select('date, is_available, reason, price')
    .eq('condo_id', condoId)
    .gte('date', startDate)
    .lte('date', endDate);
  if (error) throw error;
  return data;
}

// 2. Submit Guest Reservation (RPC Transaction to prevent double-booking)
export async function submitGuestBooking(payload: CreateBookingPayload) {
  // Step A: Upload receipt to Supabase Storage if present
  let receiptUrl = null;
  if (payload.receiptFile) {
    const fileExt = payload.receiptFile.name.split('.').pop();
    const filePath = `receipts/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('booking-receipts')
      .upload(filePath, payload.receiptFile);
    if (uploadError) throw uploadError;
    receiptUrl = uploadData.path;
  }

  // Step B: Invoke atomic booking RPC
  const { data, error } = await supabase.rpc('create_reservation_atomic', {
    p_condo_id: payload.condoId,
    p_guest_name: payload.guestName,
    p_guest_email: payload.guestEmail,
    p_guest_phone: payload.guestPhone,
    p_check_in: payload.checkInDate,
    p_check_out: payload.checkOutDate,
    p_adults: payload.adults,
    p_children: payload.children,
    p_infants: payload.infants,
    p_selected_extras: payload.extrasJson,
    p_payment_method_id: payload.paymentMethodId,
    p_payment_ref_number: payload.paymentRefNumber,
    p_receipt_url: receiptUrl,
    p_special_requests: payload.specialRequests,
    p_total_amount: payload.totalAmount,
    p_deposit_amount: payload.depositAmount
  });

  if (error) throw error;
  return data as { booking_id: string; booking_code: string; status: string };
}
```

### 7.2 Real-time Subscriptions
To ensure instant updates across guest and admin views without manual page refreshes:
* **Admin Dashboard:** Subscribes to `supabase.channel('admin-bookings').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, handler)`.
* **Guest Calendar:** Listens for date lock events to prevent selecting dates currently being finalized by another user.

---

## 8. Mobile 360px+ Responsiveness & Haptic Polish Matrix

| Screen Size | Layout Adaptation & UX Strategy |
|---|---|
| **Mobile ($< 640\text{px}$)** | Single column fluid layout. Multi-step indicator switches to compact horizontal progress pill (`Step 2 of 5`). Date picker renders in 1-month swipe mode. Pricing breakdown lives in a collapsible bottom drawer with fixed bar showing `₱3,750 Deposit Required • [Review & Continue]`. Inputs have minimum $48\text{px}$ touch targets. |
| **Tablet ($640\text{px} - 1024\text{px}$)** | 2-column layout with 2-month side-by-side date picker. Admin sidebar switches to iconography rail with slide-over labels. |
| **Desktop ($> 1024\text{px}$)** | Asymmetric editorial bento layout. Sticky right sidebar for real-time quotation recalculations that follows scroll smoothly. Admin dashboard opens full two-tier navigation with multi-column data grids. |

---

## 9. Next Steps for Implementation (Phase 1 Execution)

1. **M1 (Database & Schema):** Implement Supabase tables (`condos`, `bookings`, `pricing_rules`, `extras`, `payment_methods`, `settings`), RLS policies, and atomic `create_reservation_atomic` RPC function.
2. **M2 (Design System & Foundations):** Initialize Vite + React + TypeScript + Tailwind CSS v4, configure luxury fonts, double-bezel primitives, and pricing engine unit tests.
3. **M3 (Guest Booking Flow R1):** Assemble the 5-step wizard, interactive calendar, live quotation drawer, receipt uploader, and confirmation boarding pass.
4. **M4 (Admin Dashboard R2):** Construct Admin auth gate, KPI metrics overview, booking verification drawer with image lightbox, condo/rate editor, and calendar blocker.
5. **M5 (Testing & Hardening):** Run complete Vitest suite across all pricing permutations, date overlaps, form validations, and mobile viewports.
