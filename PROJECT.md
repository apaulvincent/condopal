# Project: CondoPal (Luxury Condo & Resort Booking SPA)

## Architecture
CondoPal is a modern, mobile-first, luxury condo/resort accommodation booking Single Page Application (SPA) designed with a $150k agency aesthetic. It connects guests looking for luxury stays with property managers via a high-performance frontend and Supabase PostgreSQL backend.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             CondoPal SPA                                 │
│  (React 18/19 + TypeScript + Vite + Tailwind CSS v4 + Radix UI / shadcn) │
├───────────────────────────────────┬──────────────────────────────────────┤
│           Guest Experience        │          Admin Management Hub        │
│  - Luxury Condo Showcase          │  - Real-time Analytics & KPIs        │
│  - 5-Step Mobile Booking Flow     │  - Booking Queue & Status Workflow   │
│  - Live Calendar & Date Picker    │  - Proof of Payment Lightbox Viewer  │
│  - Deterministic Pricing Preview  │  - Property / Condo Editor & Photos  │
│  - Dynamic Payment QR & Details   │  - Seasonal Pricing & Date Blocker   │
│  - Boarding-Pass Voucher / QR     │  - Add-ons & Payment Channel Config  │
├───────────────────────────────────┴──────────────────────────────────────┤
│                         Core Shared Engines                              │
│  - Deterministic Pricing Engine (Day-by-day rates, seasons, extras, tax) │
│  - Date & Availability Engine (UTC midnight parsing, zero timezone bugs) │
│  - Storage & Draft State Sync (URL SearchParams + LocalStorage recovery) │
├──────────────────────────────────────────────────────────────────────────┤
│                       Supabase Backend & Security                        │
│  - PostgreSQL 15+ with `btree_gist` Exclusion Constraints (Zero Double-Book)│
│  - Atomic Booking RPC (`create_booking_atomic` with `SELECT FOR UPDATE`) │
│  - Row Level Security (Public reads, Token-based guest access, Admin RBAC)│
│  - Database Types (TypeScript Strict, Zero `any`)                        │
└──────────────────────────────────────────────────────────────────────────┘
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | PostgreSQL Schema & DDL | 7 core tables (`condos`, `extras`, `payment_methods`, `admin_profiles`, `bookings`, `app_settings`, `audit_logs`) with full constraints and indices | M1 | Survey DB |
| F2 | Zero Double-Booking Kernel Lock | PostgreSQL `btree_gist` exclusion constraint preventing overlapping date ranges on identical condo units | M1 | Survey DB |
| F3 | Atomic Booking RPC | `create_booking_atomic` transactional PL/pgSQL function with row locking, capacity checks, and authoritative server-side price validation | M1 | Survey DB |
| F4 | Granular RLS Policies | Row Level Security policies for guest access via 24-byte hex token, public active condo browsing, and admin RBAC | M1 | Survey DB |
| F5 | Database Types & Client | Strictly typed TypeScript Supabase definitions with zero `any` and mock in-memory client for offline testing | M1 | Survey DB |
| F6 | $150k Luxury Design System | Tailwind CSS v4 design tokens, Obsidian & Sand palette, Cormorant/Playfair typography, double-bezel cards, button-in-button micro-interactions | M2 | Survey Design |
| F7 | Deterministic Pricing Engine | Pure functional calculation for base rates, weekend surcharges, seasonal rates, 4 extra pricing models, cleaning fees, downpayments | M2 | Survey Design |
| F8 | Date & Time Utilities | UTC midnight ISO date parsing, timezone drift prevention, leap year handling, stay duration validation | M2 | Survey Design |
| F9 | App Shell & Navigation | Luxury header, floating island navigation, mobile sticky bottom action bar, theme container, and responsive layout (360px+) | M2 | Survey Frontend |
| F10 | Condo Showcase & Details | High-resolution image gallery, amenity badges, price breakdown preview, and direct booking CTA | M2 | Survey Frontend |
| F11 | Multi-Step Booking Wizard | 5-step interactive guest flow (Info -> Dates -> Guests -> Extras -> Payment) with draft state persistence & recovery | M3 | Survey Frontend |
| F12 | Interactive Date Range Picker | Dual-month / mobile swipeable calendar with live blocked-date markers, min-stay constraints, and live night counter | M3 | Survey Frontend |
| F13 | Capacity & Guest Stepper | Adults, children, infants steppers with maximum occupancy validation and extra-guest policy calculations | M3 | Survey Frontend |
| F14 | Addons & Extras Configurator | Real-time extras selector with live itemized bill recalculation (per stay, per night, per guest) | M3 | Survey Frontend |
| F15 | Payment Options & Proof Uploader | Dynamic GCash/Maya/Bank QR codes, 1-click copy account details, payment reference input, and drag-and-drop proof upload | M3 | Survey Frontend |
| F16 | Boarding-Pass Voucher & QR | Luxury confirmation screen with dynamic SVG QR code, 1-click copy booking code, countdown timer, check-in guide, and print CSS | M3 | Survey Frontend |
| F17 | Admin Authentication & Guard | Protected admin route gate, admin login modal/view, session persistence, and RBAC check | M4 | Survey Frontend |
| F18 | Admin Analytics & KPI Hub | Real-time metrics for Total Revenue, Occupancy Rate, Pending Approvals, and Upcoming Check-ins | M4 | Survey Frontend |
| F19 | Bookings Queue & Verification | Filterable booking table, status workflow (pending/confirmed/rejected), and proof of payment inspection lightbox (zoom/rotate/verify/reject) | M4 | Survey Frontend |
| F20 | Condo Inventory & Date Blocker | Property manager to edit rates, descriptions, amenities, photos, and manually block/unblock dates on an interactive calendar | M4 | Survey Frontend |
| F21 | Extras & Payment Settings | Admin managers for add-on extras pricing and payment method details (GCash, Maya, Bank Transfer accounts) | M4 | Survey Frontend |
| F22 | E2E Test Suite (Tiers 1-4) | Comprehensive Vitest suite with 100% pass across date math, pricing engine, boundary edge cases, combinations, and concurrency | M5 | Survey Test |
| F23 | Adversarial Coverage Hardening (Tier 5) | Adversarial test cases and stress testing under race condition simulations with zero audit integrity violations | M5 | Survey Test |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Database, RPC, RLS & Schema Foundation | Features F1, F2, F3, F4, F5: Supabase SQL migrations, exclusion constraints, atomic RPCs, RLS, TypeScript database types, and Supabase client | None | DONE |
| M2 | Core Engines, Design System & App Shell | Features F6, F7, F8, F9, F10: Vite + React 18/19 + Tailwind v4 + Lucide setup, luxury design tokens, double-bezel cards, pricing engine, date utils, condo showcase | M1 | DONE |
| M3 | Mobile-First Guest Booking Flow & Voucher | Features F11, F12, F13, F14, F15, F16: 5-step booking wizard, live calendar, capacity validation, extras picker, payment proof upload, confirmation voucher | M2 | DONE |
| M4 | Admin Management Hub & Operations Console | Features F17, F18, F19, F20, F21: Admin auth, KPI dashboard, booking review & lightbox verification, condo inventory manager, calendar date blocker, extras/payment settings | M2, M3 | DONE |
| M5 | E2E Verification & Adversarial Hardening | Features F22, F23: 100% pass of Tiers 1-4 E2E test suite followed by Tier 5 adversarial stress testing and forensic audit | M1, M2, M3, M4 | DONE |

## Interface Contracts

### 1. Database & Pricing Models (`src/types/database.types.ts` & `src/types/booking.ts`)
```typescript
export type ExtraPriceType = 'per_stay' | 'per_night' | 'per_guest' | 'per_guest_per_night';
export type PaymentStatus = 'pending_payment' | 'proof_submitted' | 'verified' | 'rejected' | 'refunded';
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface Condo {
  id: string;
  slug: string;
  name: string;
  description: string;
  images: string[];
  max_guests: number;
  base_price_per_night: number;
  weekend_price_per_night?: number;
  cleaning_fee: number;
  reservation_fee_rate: number; // e.g. 0.20 (20%)
  min_stay_nights: number;
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  area_sqm: number;
  floor: number;
  is_active: boolean;
}

export interface Extra {
  id: string;
  name: string;
  description: string;
  price: number;
  price_type: ExtraPriceType;
  icon: string;
  is_enabled: boolean;
  max_quantity?: number;
}

export interface SelectedExtra {
  extra_id: string;
  quantity: number;
}

export interface PriceBreakdown {
  nights: number;
  base_lodging_total: number;
  weekend_surcharge_total: number;
  seasonal_surcharge_total: number;
  length_of_stay_discount: number;
  lodging_subtotal: number;
  cleaning_fee: number;
  extras_total: number;
  itemized_extras: Array<{
    extra_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  service_charge: number;
  tax_amount: number;
  total_amount: number;
  reservation_fee_amount: number;
  remaining_balance_amount: number;
  nightly_rates: Array<{
    date: string;
    rate: number;
    is_weekend: boolean;
  }>;
}

export interface Booking {
  id: string;
  booking_code: string;
  access_token: string;
  condo_id: string;
  condo?: Condo;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  num_adults: number;
  num_children: number;
  num_infants: number;
  selected_extras: SelectedExtra[];
  special_requests?: string;
  pricing_breakdown: PriceBreakdown;
  total_amount: number;
  reservation_fee: number;
  payment_method_id: string;
  payment_reference_number?: string;
  payment_proof_url?: string;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}
```

### 2. Pricing Engine Contract (`src/lib/pricingEngine.ts`)
```typescript
export interface PricingEngineInput {
  condo: Condo;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  numAdults: number;
  numChildren: number;
  selectedExtras: SelectedExtra[];
  allExtras: Extra[];
  seasonalRules?: Array<{
    startDate: string;
    endDate: string;
    multiplier: number;
  }>;
}

export function calculateBookingPrice(input: PricingEngineInput): PriceBreakdown;
export function validateDateRange(checkIn: string, checkOut: string, minStayNights: number): { valid: boolean; error?: string; nights: number };
export function validateCapacity(condo: Condo, adults: number, children: number): { valid: boolean; error?: string };
```

### 3. Supabase RPC Contract (`supabase/migrations/*`)
```sql
-- Atomic Booking RPC
CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_condo_id UUID,
  p_guest_name TEXT,
  p_guest_email TEXT,
  p_guest_phone TEXT,
  p_check_in DATE,
  p_check_out DATE,
  p_num_adults INT,
  p_num_children INT,
  p_num_infants INT,
  p_selected_extras JSONB,
  p_special_requests TEXT,
  p_payment_method_id UUID,
  p_expected_total NUMERIC,
  p_expected_reservation_fee NUMERIC
) RETURNS JSONB;
```

## Code Layout
```
d:/Development/condopal/
├── .agents/                      # Agent orchestration metadata only
├── index.html                    # SPA HTML entry point
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript strict configuration
├── vite.config.ts                # Vite build and test configuration
├── tailwind.config.ts            # Tailwind CSS v4 luxury theme tokens
├── public/                       # Static public assets, luxury condo mock photos
│   └── images/
├── supabase/
│   └── migrations/               # PostgreSQL schema DDL, RLS, and RPC migrations
│       ├── 001_initial_schema.sql
│       ├── 002_exclusion_constraint.sql
│       ├── 003_atomic_booking_rpc.sql
│       └── 004_rls_policies_seed.sql
├── src/
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Main router and shell
│   ├── index.css                 # Tailwind v4 directives & luxury double-bezel utilities
│   ├── types/
│   │   ├── database.types.ts     # Supabase database types (Zero any)
│   │   ├── booking.ts            # Domain types, steps, pricing breakdown
│   │   └── admin.ts              # Admin dashboard types
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client singleton
│   │   ├── supabaseMock.ts       # In-memory mock client with exclusion checks for tests
│   │   ├── pricingEngine.ts      # Deterministic pricing engine
│   │   ├── dateUtils.ts          # UTC midnight date helpers & formatters
│   │   └── seedData.ts           # Turnkey luxury condos, extras, and payment methods
│   ├── context/
│   │   ├── BookingContext.tsx    # Multi-step booking state + URL/LocalStorage sync
│   │   └── AdminAuthContext.tsx  # Admin authentication state
│   ├── components/
│   │   ├── ui/                   # Luxury double-bezel cards, button-in-button, badges, modal
│   │   ├── layout/               # Header, Footer, Floating Island Nav, Sticky Mobile Bar
│   │   ├── showcase/             # Condo hero, gallery, amenities, unit cards
│   │   ├── booking/              # 5-step booking flow components
│   │   │   ├── Step1GuestInfo.tsx
│   │   │   ├── Step2DatePicker.tsx
│   │   │   ├── Step3GuestDetails.tsx
│   │   │   ├── Step4Extras.tsx
│   │   │   ├── Step5Payment.tsx
│   │   │   └── BookingSummaryCard.tsx
│   │   ├── voucher/              # Printable Boarding-Pass voucher with dynamic SVG QR
│   │   └── admin/                # Admin Hub components
│   │       ├── AdminKPIs.tsx
│   │       ├── BookingsTable.tsx
│   │       ├── PaymentProofLightbox.tsx
│   │       ├── CondoManager.tsx
│   │       ├── DateBlockerCalendar.tsx
│   │       └── ExtrasSettings.tsx
│   └── views/
│       ├── ShowcaseView.tsx      # Main luxury landing & unit showcase
│       ├── BookingView.tsx       # 5-step booking wizard view
│       ├── ConfirmationView.tsx  # Live confirmation voucher & lookup
│       ├── LookupView.tsx        # Guest booking finder by code/email
│       ├── AdminLoginView.tsx    # Admin login modal/page
│       └── AdminDashboardView.tsx# Full admin control hub
└── tests/                        # 4-Tier Vitest test suites
    ├── setup.ts                  # Test harness setup
    ├── tier1_feature_coverage.test.ts
    ├── tier2_boundary_corner.test.ts
    ├── tier3_combinations.test.ts
    └── tier4_real_world_concurrency.test.ts
```
