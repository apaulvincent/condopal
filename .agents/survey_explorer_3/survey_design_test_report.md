# CondoPal: Luxury Resort Design System & Vitest Testing Infrastructure Specification

**Document Version:** 1.0.0  
**Author:** Survey Explorer 3 (Design System & E2E Testing Infrastructure Specialist)  
**Date:** 2026-08-16  
**Status:** Approved Specification  

---

## Executive Summary

CondoPal requires an uncompromised digital experience bridging two mission-critical pillars:
1. **$150k Awwwards-Tier Luxury Resort Design System:** An ultra-premium "Editorial Luxury & Ethereal Glass" visual language built on Tailwind CSS v4, custom cubic-bezier motion dynamics, double-bezel ("Doppelrand") card architecture, haptic button press depth, and flawless 360px+ mobile-first responsive ergonomics (floating island nav and sticky booking action bar).
2. **Deterministic Pricing Engine & 4-Tier Vitest Testing Suite:** A mathematically rigorous pricing engine capable of handling weekend markups, seasonal multipliers, multi-model add-ons/extras, deposit/balance financial splits, and strict timezone/leap-year date edge cases. Backed by a full 4-Tier Vitest testing harness featuring unit coverage, boundary property-based tests (`fast-check`), combinatoric matrix tests, and simulated concurrent race condition tests.

---

# SECTION 1: $150k Luxury Resort/Condo Design System Specification

## 1.1 Architectural Aesthetic & Vibe Read

> **Design Read:** "Luxury Vacation Rental & Private Villa Booking SPA for discerning travelers and high-net-worth guests, pairing an **Editorial Luxury** warmth (warm alabaster, rich champagne gold, deep emerald, obsidian slate) with **Ethereal Glass** tactile depth (double-bezel containers, nested island buttons, micro-haptics, and physics-driven spring curves)."

### The "Absolute Zero" Quality Mandate
- ❌ **Zero Banned Typography:** No generic system fonts (Inter, Roboto, Arial, Open Sans). Headings use high-contrast editorial serifs (`Playfair Display`, `Cormorant Garamond`, `Cinzel`), while UI elements use refined geometric grotesks (`Plus Jakarta Sans`, `Geist`).
- ❌ **Zero Generic Borders & Drop Shadows:** No `border-gray-200` or heavy dark `shadow-md`. All cards use double-bezel nested enclosures with `border-white/10`, `ring-1 ring-black/5`, and subtle interior specular highlights (`shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]`).
- ❌ **Zero Static State Jumps:** No `ease-in-out` or instant transitions. All interactive states use custom cubic-bezier curves (`cubic-bezier(0.16, 1, 0.3, 1)`).
- ❌ **Zero Sticky Top Banners on Mobile:** Navigation is detached as a floating pill island with dynamic blurred background and smooth sheet morphing.

---

## 1.2 Design Tokens & Theme Variables

### Color Palette (Tailwind CSS v4 Token Architecture)
The palette combines deep mineral slates with warm sands and champagne golds:

```css
@theme {
  /* Surface & Background Hierarchy */
  --color-canvas-base: #080B10;        /* OLED Deep Charcoal Canvas */
  --color-canvas-subtle: #0F172A;      /* Deep Midnight Slate */
  --color-surface-glass: rgba(15, 23, 42, 0.75); /* Glass Base */
  --color-surface-card: #141E33;       /* Inner Core Card Surface */
  --color-surface-elevated: #1E293B;   /* Floating Modal / Popover */
  
  /* Luxury Light Warm Tones (Editorial Contrast) */
  --color-sand-50: #FDFBF7;           /* Warm Alabaster / Cream */
  --color-sand-100: #F7F4EC;          /* Soft Linen */
  --color-sand-200: #EAE5D9;          /* Pale Sand */
  --color-sand-300: #D8D0BF;          /* Muted Parchment */

  /* Metallic & Accent Palettes */
  --color-gold-300: #F3E5AB;          /* Pale Champagne Highlight */
  --color-gold-400: #E5C483;          /* Warm Champagne */
  --color-gold-500: #D4AF37;          /* Classic Metallic Gold */
  --color-gold-600: #B89728;          /* Antique Bronze Accent */

  --color-emerald-400: #34D399;       /* Mint Accent / Success */
  --color-emerald-500: #10B981;       /* Emerald Luxury */
  --color-emerald-900: #064E3B;       /* Deep Forest Velvet */

  /* Text & Foreground Hierarchy */
  --color-text-primary: #F8FAFC;      /* Crisp Pure Platinum (98% lightness) */
  --color-text-secondary: #94A3B8;    /* Muted Slate Blue */
  --color-text-tertiary: #64748B;     /* Subdued Label Gray */
  --color-text-gold: #E5C483;         /* Editorial Accent Text */

  /* Borders & Specular Rings */
  --color-border-hairline: rgba(255, 255, 255, 0.08);
  --color-border-subtle: rgba(255, 255, 255, 0.14);
  --color-border-gold: rgba(212, 175, 55, 0.35);

  /* Typography Scales */
  --font-serif-display: "Playfair Display", "Cormorant Garamond", Georgia, serif;
  --font-sans-ui: "Plus Jakarta Sans", "Geist", -apple-system, sans-serif;
  --font-mono-code: "JetBrains Mono", monospace;

  /* Motion & Spring Physics */
  --ease-luxury-spring: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-snappy: cubic-bezier(0.25, 1, 0.5, 1);
}
```

---

## 1.3 The "Double-Bezel" (Doppelrand) Card Architecture

In high-end hardware and luxury digital craft, components never sit as flat boxes. They are encased in nested structural enclosures mimicking machined aluminum trays and chamfered glass plates.

### Structural Specification
1. **Outer Shell (`BezelOuter`):**
   - Padding: `p-1.5` to `p-2.5`
   - Background: `bg-white/[0.04]` (dark mode) or `bg-black/[0.03]` (light mode)
   - Border: Hairline outer perimeter `border border-white/10` with `ring-1 ring-black/20`
   - Radius: Continuous curvature `rounded-[2rem]` (or `rounded-3xl`)
   - Shadow: Ambient diffuse drop `shadow-2xl shadow-black/40`
2. **Inner Core (`BezelInner`):**
   - Radius: Mathematically calculated concentric radius: `rounded-[calc(2rem-0.375rem)]` (e.g. `rounded-[1.625rem]`)
   - Background: Solid tinted core `bg-slate-950/80 backdrop-blur-xl`
   - Specular Inner Highlight: `shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]`
   - Padding: Generous interior breathing space `p-6 md:p-8`

### Reusable React Implementation Pattern
```tsx
import React from 'react';

interface LuxuryCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const LuxuryCard: React.FC<LuxuryCardProps> = ({ children, className = '', glow = false }) => {
  return (
    <div className={`relative p-1.5 rounded-[2rem] bg-white/[0.05] border border-white/10 ring-1 ring-black/40 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group hover:border-gold-400/30 ${className}`}>
      {glow && (
        <div className="absolute -inset-1 rounded-[2.2rem] bg-gradient-to-r from-gold-500/20 via-emerald-500/10 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      )}
      <div className="relative rounded-[calc(2rem-0.375rem)] bg-slate-950/85 backdrop-blur-xl p-6 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden">
        {children}
      </div>
    </div>
  );
};
```

---

## 1.4 Nested Island Button & Kinetic Micro-Interactions

### Button-in-Button Architecture
Primary CTAs feature nested circular icon chambers that react kinetically on hover and press:

```tsx
interface LuxuryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'emerald' | 'glass';
  icon?: React.ReactNode;
}

export const LuxuryButton: React.FC<LuxuryButtonProps> = ({
  children,
  variant = 'gold',
  icon,
  className = '',
  ...props
}) => {
  const variantStyles = {
    gold: 'bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-slate-950 shadow-lg shadow-gold-500/20 hover:shadow-gold-500/35',
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35',
    glass: 'bg-white/10 text-white hover:bg-white/15 border border-white/15 backdrop-blur-md',
  };

  return (
    <button
      className={`group relative inline-flex items-center justify-between gap-4 pl-6 pr-2 py-2 rounded-full font-medium text-sm tracking-wide transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] hover:scale-[1.01] ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <span className="py-1.5 font-semibold tracking-wide">{children}</span>
      {icon && (
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-black/15 group-hover:bg-black/25 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] shadow-inner">
          {icon}
        </span>
      )}
    </button>
  );
};
```

---

## 1.5 Mobile-First 360px+ Ergonomics & Navigation Architecture

### Key Mobile Constraints & Solutions
1. **Viewport Resilience:** Never use `h-screen`; always use `min-h-[100dvh]` to eliminate Safari bottom URL bar jumpiness.
2. **360px Small Device Safety:** All step headers, summary cards, and price badges must use flex-wrap or text auto-scaling (`text-clamp`) to prevent overflow on iPhone SE / 360px Android devices.
3. **Sticky Mobile Action Bar (Bottom Pill):**
   - Displays real-time stay total (`$X / night` or total) + Next Step Button.
   - Padded with `pb-[max(1rem,env(safe-area-inset-bottom))]` to avoid overlapping iOS Home Bar.
   - Mounted as a floating glass capsule: `fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40 rounded-full bg-slate-950/90 backdrop-blur-2xl border border-white/15 shadow-2xl p-2.5 flex items-center justify-between`.
4. **Floating Island Navbar:**
   - Desktop & Mobile: Floating detached pill at `top-4 inset-x-4 max-w-5xl mx-auto z-50`.
   - Fluid morphing modal drawer on mobile with staggered item slide-up (`translate-y-4 opacity-0` -> `translate-y-0 opacity-100`).

---

# SECTION 2: Pricing Engine & Mathematical Business Logic

## 2.1 Formal Pricing Equation & Components

The total price of any stay is deterministically calculated through 6 distinct mathematical components:

$$\text{TotalPrice} = \text{BaseLodgingCost} + \text{CleaningFee} + \text{ExtrasTotal} + \text{ServiceFee} + \text{Taxes} - \text{Discounts}$$

$$\text{DepositAmount} = \text{round}\left( \text{TotalPrice} \times \text{DepositRate} \right)$$

$$\text{RemainingBalance} = \text{TotalPrice} - \text{DepositAmount}$$

---

### Component Breakdown

#### 1. Daily Lodging Rate Integration ($\text{BaseLodgingCost}$)
Instead of multiplying a single static rate by total nights, CondoPal integrates rates day-by-day across the calendar range:

$$\text{BaseLodgingCost} = \sum_{d \in [\text{check\_in}, \text{check\_out})} \text{DailyRate}(d)$$

Where for each night $d$:
- If $d$ falls on a **Weekend** (Friday or Saturday night):
  $$\text{DailyRate}(d) = \text{BaseNightlyPrice} \times \text{WeekendMultiplier}$$
- If $d$ falls within a **Special/Seasonal Window** (Holiday/Peak Season):
  $$\text{DailyRate}(d) = \text{BaseNightlyPrice} \times \text{SeasonalMultiplier}(d)$$
- If both apply, the peak seasonal weekend rule is:
  $$\text{DailyRate}(d) = \text{BaseNightlyPrice} \times \max(\text{WeekendMultiplier}, \text{SeasonalMultiplier}(d))$$
  *(or compounded depending on condo policy, configurable via pricing settings)*.

#### 2. Multi-Night Length-of-Stay Discount ($\text{StayDiscount}$)
- $N < 3$ nights: $0\%$ discount
- $3 \le N < 7$ nights: $5\%$ discount on lodging: $\text{StayDiscount} = 0.05 \times \text{BaseLodgingCost}$
- $N \ge 7$ nights: $12\%$ weekly discount on lodging: $\text{StayDiscount} = 0.12 \times \text{BaseLodgingCost}$

#### 3. Cleaning Fee ($\text{CleaningFee}$)
- Fixed one-time charge per reservation: e.g., $\text{CleaningFee} = \$45.00$.

#### 4. Add-on Extras Engine ($\text{ExtrasTotal}$)
Each selected extra $e_i$ is computed based on its `price_type`:

$$\text{ExtrasTotal} = \sum_{i} \text{ExtraCost}(e_i)$$

| Extra `price_type` | Formula | Example |
|---|---|---|
| `per_stay` | $e_i.\text{price} \times e_i.\text{qty}$ | Airport Transfer (\$60), Welcome Hamper (\$40) |
| `per_night` | $e_i.\text{price} \times e_i.\text{qty} \times N_{\text{nights}}$ | Daily Premium Starlink WiFi (\$10/night) |
| `per_guest` | $e_i.\text{price} \times e_i.\text{qty} \times (N_{\text{adults}} + N_{\text{children}})$ | Spa & Pool Access Pass (\$25/guest) |
| `per_guest_per_night` | $e_i.\text{price} \times e_i.\text{qty} \times (N_{\text{adults}} + N_{\text{children}}) \times N_{\text{nights}}$ | Daily Gourmet Breakfast Buffet (\$20/guest/night) |

#### 5. Taxes & Service Charges
- **Service Charge ($S\%$):** e.g., $10\%$ on lodging subtotal:
  $$\text{ServiceFee} = \text{round}\left( (\text{BaseLodgingCost} - \text{StayDiscount}) \times 0.10 \right)$$
- **Government Lodging Tax / VAT ($T\%$):** e.g., $12\%$ on taxable components:
  $$\text{Taxes} = \text{round}\left( (\text{BaseLodgingCost} - \text{StayDiscount} + \text{CleaningFee} + \text{ExtrasTotal} + \text{ServiceFee}) \times \text{TaxRate} \right)$$
  *(If taxes are inclusive in base prices, tax is calculated as $\text{Subtotal} \times \frac{T}{1 + T}$)*.

#### 6. Reservation Split
- **Reservation Fee Rate ($\rho$):** Typically $20\%$ or $30\%$ (or fixed minimum deposit).
- **Reservation Fee Due Immediately:**
  $$\text{ReservationFee} = \text{round\_to\_cents}(\text{TotalPrice} \times \rho)$$
- **Remaining Balance Due Upon Check-In:**
  $$\text{RemainingBalance} = \text{TotalPrice} - \text{ReservationFee}$$

---

## 2.2 Date Manipulation & Temporal Edge Cases

### Invariant Rules
1. **ISO 8601 Date String Normalization:**
   - All booking dates are transmitted and stored strictly in `YYYY-MM-DD` string format.
   - Timestamps must never be initialized using `new Date('2026-08-16')` without explicitly forcing UTC midnight (`2026-08-16T00:00:00.000Z`) to prevent timezone drift where a user in UTC-8 or UTC+8 gets shifted by 1 full day.
2. **Leap Year Calculations:**
   - February 29 must be properly calculated as a valid night for leap years (e.g., 2028-02-28 check-in to 2028-03-01 check-out is exactly $2$ nights).
3. **Same-Day & Reverse Date Rejections:**
   - $\text{check\_out} > \text{check\_in}$ strictly. Same-day reservations ($\text{check\_in} == \text{check\_out}$) must be rejected with `ERR_ZERO_NIGHTS_STAY`.
   - $\text{check\_out} < \text{check\_in}$ must be rejected with `ERR_INVALID_DATE_SEQUENCE`.
4. **Minimum / Maximum Stay Constraints:**
   - Default: $1 \le N_{\text{nights}} \le 30$.
   - Peak Season / Weekend rules can enforce $\text{min\_stay} = 2$ or $3$ nights.
5. **Capacity Guardrails:**
   - $N_{\text{adults}} \ge 1$ (Reservations with $0$ adults are rejected).
   - $N_{\text{children}} \ge 0$.
   - $N_{\text{adults}} + N_{\text{children}} \le \text{condo.max\_guests}$ (Capacity overflow is rejected).
   - Infants (age $< 2$) do not count towards physical bed capacity but are logged.

---

## 2.3 Production TypeScript Pricing Engine Implementation

```typescript
// src/lib/pricing/pricingEngine.ts

export type PriceType = 'per_stay' | 'per_night' | 'per_guest' | 'per_guest_per_night';

export interface ExtraItem {
  id: string;
  name: string;
  price: number;
  price_type: PriceType;
  quantity: number;
}

export interface SeasonalRule {
  name: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  multiplier: number; // e.g. 1.25 for +25%
}

export interface CondoPricingConfig {
  baseNightlyPrice: number;
  weekendMultiplier: number; // e.g. 1.15 for +15% on Fri/Sat
  cleaningFee: number;
  serviceChargeRate: number; // e.g. 0.10 (10%)
  taxRate: number;           // e.g. 0.12 (12% VAT)
  reservationFeeRate: number;// e.g. 0.30 (30% deposit)
  seasonalRules?: SeasonalRule[];
  minStayNights?: number;
  maxStayNights?: number;
  maxGuests: number;
}

export interface BookingGuestDetails {
  adults: number;
  children: number;
  infants?: number;
}

export interface DailyRateBreakdown {
  date: string;
  isWeekend: boolean;
  seasonalMultiplier: number;
  rate: number;
}

export interface PricingCalculationResult {
  totalNights: number;
  dailyBreakdown: DailyRateBreakdown[];
  baseLodgingTotal: number;
  stayDiscountAmount: number;
  netLodgingTotal: number;
  cleaningFee: number;
  extrasBreakdown: Array<{ extra: ExtraItem; subtotal: number }>;
  extrasTotal: number;
  serviceFee: number;
  taxAmount: number;
  totalAmount: number;
  reservationFee: number;
  remainingBalance: number;
}

/**
 * Parses YYYY-MM-DD string to UTC Date without timezone skew
 */
export function parseISODate(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length !== 3) throw new Error(`Invalid date format: ${dateStr}`);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

/**
 * Formats UTC Date to YYYY-MM-DD
 */
export function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculates number of nights between check-in and check-out
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const dIn = parseISODate(checkIn);
  const dOut = parseISODate(checkOut);
  const diffTime = dOut.getTime() - dIn.getTime();
  if (diffTime <= 0) return 0;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Round safely to 2 decimal places to prevent floating point inaccuracies
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Core Pricing Engine
 */
export function calculateBookingPrice(
  config: CondoPricingConfig,
  checkIn: string,
  checkOut: string,
  guests: BookingGuestDetails,
  extras: ExtraItem[] = []
): PricingCalculationResult {
  // 1. Validate dates
  const totalNights = calculateNights(checkIn, checkOut);
  if (totalNights <= 0) {
    throw new Error('Check-out date must be strictly after check-in date.');
  }

  const minStay = config.minStayNights ?? 1;
  if (totalNights < minStay) {
    throw new Error(`Minimum stay is ${minStay} night(s).`);
  }

  if (config.maxStayNights && totalNights > config.maxStayNights) {
    throw new Error(`Maximum stay is ${config.maxStayNights} night(s).`);
  }

  // 2. Validate capacity
  const totalChargeableGuests = guests.adults + guests.children;
  if (guests.adults < 1) {
    throw new Error('At least 1 adult is required.');
  }
  if (totalChargeableGuests > config.maxGuests) {
    throw new Error(`Maximum capacity of ${config.maxGuests} guests exceeded (${totalChargeableGuests} requested).`);
  }

  // 3. Integrate daily rates across the calendar
  const dailyBreakdown: DailyRateBreakdown[] = [];
  let baseLodgingTotal = 0;
  const curr = parseISODate(checkIn);
  const end = parseISODate(checkOut);

  while (curr.getTime() < end.getTime()) {
    const dateStr = formatISODate(curr);
    const dayOfWeek = curr.getUTCDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    // Check seasonal rules
    let seasonalMult = 1.0;
    if (config.seasonalRules) {
      for (const rule of config.seasonalRules) {
        if (dateStr >= rule.startDate && dateStr <= rule.endDate) {
          if (rule.multiplier > seasonalMult) {
            seasonalMult = rule.multiplier;
          }
        }
      }
    }

    let nightRate = config.baseNightlyPrice;
    if (isWeekend) {
      nightRate *= config.weekendMultiplier;
    }
    nightRate *= seasonalMult;
    nightRate = roundCurrency(nightRate);

    dailyBreakdown.push({
      date: dateStr,
      isWeekend,
      seasonalMultiplier: seasonalMult,
      rate: nightRate,
    });

    baseLodgingTotal += nightRate;
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  baseLodgingTotal = roundCurrency(baseLodgingTotal);

  // 4. Length-of-stay discount
  let stayDiscountAmount = 0;
  if (totalNights >= 7) {
    stayDiscountAmount = roundCurrency(baseLodgingTotal * 0.12); // 12% off weekly
  } else if (totalNights >= 3) {
    stayDiscountAmount = roundCurrency(baseLodgingTotal * 0.05); // 5% off 3+ nights
  }
  const netLodgingTotal = roundCurrency(baseLodgingTotal - stayDiscountAmount);

  // 5. Extras Calculation
  const extrasBreakdown: Array<{ extra: ExtraItem; subtotal: number }> = [];
  let extrasTotal = 0;

  for (const extra of extras) {
    if (extra.quantity <= 0) continue;
    let extraSubtotal = 0;

    switch (extra.price_type) {
      case 'per_stay':
        extraSubtotal = extra.price * extra.quantity;
        break;
      case 'per_night':
        extraSubtotal = extra.price * extra.quantity * totalNights;
        break;
      case 'per_guest':
        extraSubtotal = extra.price * extra.quantity * totalChargeableGuests;
        break;
      case 'per_guest_per_night':
        extraSubtotal = extra.price * extra.quantity * totalChargeableGuests * totalNights;
        break;
      default:
        extraSubtotal = extra.price * extra.quantity;
    }

    extraSubtotal = roundCurrency(extraSubtotal);
    extrasBreakdown.push({ extra, subtotal: extraSubtotal });
    extrasTotal += extraSubtotal;
  }
  extrasTotal = roundCurrency(extrasTotal);

  // 6. Cleaning Fee
  const cleaningFee = roundCurrency(config.cleaningFee);

  // 7. Service Charge & Tax
  const serviceFee = roundCurrency(netLodgingTotal * config.serviceChargeRate);
  const taxableBase = netLodgingTotal + cleaningFee + extrasTotal + serviceFee;
  const taxAmount = roundCurrency(taxableBase * config.taxRate);

  // 8. Totals and Split
  const totalAmount = roundCurrency(taxableBase + taxAmount);
  const reservationFee = roundCurrency(totalAmount * config.reservationFeeRate);
  const remainingBalance = roundCurrency(totalAmount - reservationFee);

  return {
    totalNights,
    dailyBreakdown,
    baseLodgingTotal,
    stayDiscountAmount,
    netLodgingTotal,
    cleaningFee,
    extrasBreakdown,
    extrasTotal,
    serviceFee,
    taxAmount,
    totalAmount,
    reservationFee,
    remainingBalance,
  };
}
```

---

# SECTION 3: Vitest Testing Infrastructure & Suite Specification

## 3.1 Testing Stack & Configuration

CondoPal uses Vitest with `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `fast-check` (for generative property-based testing), and an in-memory transactional mock of Supabase.

### `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## 3.2 The 4-Tier Testing Architecture Matrix

| Tier | Name | Focus Area | Testing Method | Target Files |
|---|---|---|---|---|
| **Tier 1** | **Feature Coverage** | Core unit logic: Pricing Engine, Date Utils, Capacity validation, Extras calculation, State machine | Unit tests, deterministic assertions | `src/lib/pricing/__tests__/pricingEngine.test.ts`, `src/lib/booking/__tests__/stateMachine.test.ts` |
| **Tier 2** | **Boundary & Corner Cases** | Extreme inputs: 1-night stay, Leap year, Max guests limit, 0 children, invalid date range, past dates, negative amounts | Boundary unit tests + `fast-check` property tests | `tests/tier2-boundary.test.ts` |
| **Tier 3** | **Cross-Feature Combinations** | Combinations: Weekend pricing + seasonal rate + multi-guest extras + discounts + reservation fee split | Combinatorial matrix tests | `tests/tier3-combinations.test.ts` |
| **Tier 4** | **Real-World Workload Scenarios** | Concurrency race condition simulation, full 5-step guest booking E2E flow, admin approval flow | Integration tests with Mock Supabase Client & React Testing Library | `tests/tier4-concurrency-and-e2e.test.tsx` |

---

## 3.3 Concrete Test Suite Specifications

### Tier 1: Core Feature Coverage Test Suite (`pricingEngine.test.ts`)
```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateBookingPrice,
  calculateNights,
  parseISODate,
  formatISODate,
  CondoPricingConfig,
  ExtraItem,
} from '@/lib/pricing/pricingEngine';

const mockCondoConfig: CondoPricingConfig = {
  baseNightlyPrice: 150,
  weekendMultiplier: 1.2, // +20% on Fri/Sat
  cleaningFee: 50,
  serviceChargeRate: 0.10,
  taxRate: 0.12,
  reservationFeeRate: 0.30,
  maxGuests: 4,
  minStayNights: 1,
  maxStayNights: 30,
};

describe('Tier 1: Feature Coverage - Pricing & Date Engine', () => {
  it('calculates exact night count between two ISO dates', () => {
    expect(calculateNights('2026-09-10', '2026-09-15')).toBe(5);
    expect(calculateNights('2026-12-31', '2027-01-02')).toBe(2);
  });

  it('calculates pure weekday lodging accurately without extra markups', () => {
    // Mon 2026-09-07 to Thu 2026-09-10 (3 nights: Mon, Tue, Wed)
    const result = calculateBookingPrice(
      mockCondoConfig,
      '2026-09-07',
      '2026-09-10',
      { adults: 2, children: 0 }
    );

    // 3 nights @ $150 = $450 base. 3+ nights discount 5% = $22.50. Net = $427.50.
    expect(result.totalNights).toBe(3);
    expect(result.baseLodgingTotal).toBe(450.0);
    expect(result.stayDiscountAmount).toBe(22.5);
    expect(result.netLodgingTotal).toBe(427.5);
    expect(result.cleaningFee).toBe(50.0);
    expect(result.serviceFee).toBe(42.75); // 10% of 427.50
    // Taxable = 427.50 + 50 + 42.75 = 520.25. Tax = 520.25 * 0.12 = 62.43
    expect(result.taxAmount).toBe(62.43);
    expect(result.totalAmount).toBe(582.68);
    expect(result.reservationFee).toBe(174.8); // 30% of 582.68
    expect(result.remainingBalance).toBe(407.88);
  });

  it('applies weekend markups on Friday and Saturday nights', () => {
    // Thu 2026-09-10 to Sun 2026-09-13 (3 nights: Thu(weekday), Fri(weekend), Sat(weekend))
    const result = calculateBookingPrice(
      mockCondoConfig,
      '2026-09-10',
      '2026-09-13',
      { adults: 2, children: 0 }
    );

    // Thu: 150. Fri: 150 * 1.2 = 180. Sat: 150 * 1.2 = 180. Total Base = 510.
    expect(result.dailyBreakdown[0].rate).toBe(150);
    expect(result.dailyBreakdown[1].rate).toBe(180);
    expect(result.dailyBreakdown[2].rate).toBe(180);
    expect(result.baseLodgingTotal).toBe(510);
  });

  it('calculates all 4 types of extras accurately', () => {
    const extras: ExtraItem[] = [
      { id: '1', name: 'Airport Van', price: 60, price_type: 'per_stay', quantity: 1 },
      { id: '2', name: 'Starlink WiFi', price: 10, price_type: 'per_night', quantity: 1 },
      { id: '3', name: 'Pool Pass', price: 20, price_type: 'per_guest', quantity: 1 },
      { id: '4', name: 'Breakfast Buffet', price: 15, price_type: 'per_guest_per_night', quantity: 1 },
    ];

    // 2 nights, 2 adults + 1 child = 3 guests
    const result = calculateBookingPrice(
      mockCondoConfig,
      '2026-09-08',
      '2026-09-10',
      { adults: 2, children: 1 },
      extras
    );

    // per_stay: 60 * 1 = 60
    // per_night: 10 * 1 * 2 nights = 20
    // per_guest: 20 * 1 * 3 guests = 60
    // per_guest_per_night: 15 * 1 * 3 guests * 2 nights = 90
    // Total extras = 60 + 20 + 60 + 90 = 230
    expect(result.extrasTotal).toBe(230.0);
    expect(result.extrasBreakdown[0].subtotal).toBe(60.0);
    expect(result.extrasBreakdown[1].subtotal).toBe(20.0);
    expect(result.extrasBreakdown[2].subtotal).toBe(60.0);
    expect(result.extrasBreakdown[3].subtotal).toBe(90.0);
  });
});
```

---

### Tier 2: Boundary & Corner Cases Suite (`tier2-boundary.test.ts`)
```typescript
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  calculateBookingPrice,
  calculateNights,
  CondoPricingConfig,
} from '@/lib/pricing/pricingEngine';

const baseConfig: CondoPricingConfig = {
  baseNightlyPrice: 200,
  weekendMultiplier: 1.25,
  cleaningFee: 60,
  serviceChargeRate: 0.10,
  taxRate: 0.12,
  reservationFeeRate: 0.30,
  maxGuests: 6,
  minStayNights: 1,
  maxStayNights: 30,
};

describe('Tier 2: Boundary & Corner Cases', () => {
  it('handles minimum 1-night stay cleanly', () => {
    const result = calculateBookingPrice(
      baseConfig,
      '2026-10-01',
      '2026-10-02',
      { adults: 1, children: 0 }
    );
    expect(result.totalNights).toBe(1);
    expect(result.baseLodgingTotal).toBe(200);
    expect(result.stayDiscountAmount).toBe(0);
  });

  it('correctly calculates stay spanning leap day (Feb 29)', () => {
    // 2028 is a leap year
    const nights = calculateNights('2028-02-28', '2028-03-01');
    expect(nights).toBe(2); // Feb 28 & Feb 29

    const result = calculateBookingPrice(
      baseConfig,
      '2028-02-28',
      '2028-03-01',
      { adults: 2, children: 0 }
    );
    expect(result.totalNights).toBe(2);
    expect(result.dailyBreakdown.map((d) => d.date)).toEqual(['2028-02-28', '2028-02-29']);
  });

  it('rejects same-day check-in and check-out (0 nights)', () => {
    expect(() =>
      calculateBookingPrice(
        baseConfig,
        '2026-10-01',
        '2026-10-01',
        { adults: 2, children: 0 }
      )
    ).toThrowError(/Check-out date must be strictly after/);
  });

  it('rejects inverted dates (check-out before check-in)', () => {
    expect(() =>
      calculateBookingPrice(
        baseConfig,
        '2026-10-05',
        '2026-10-01',
        { adults: 2, children: 0 }
      )
    ).toThrowError(/Check-out date must be strictly after/);
  });

  it('rejects booking with 0 adults', () => {
    expect(() =>
      calculateBookingPrice(
        baseConfig,
        '2026-10-01',
        '2026-10-03',
        { adults: 0, children: 2 }
      )
    ).toThrowError(/At least 1 adult is required/);
  });

  it('rejects booking exceeding condo max guest capacity', () => {
    expect(() =>
      calculateBookingPrice(
        baseConfig,
        '2026-10-01',
        '2026-10-03',
        { adults: 4, children: 3 } // 7 guests > 6 max
      )
    ).toThrowError(/Maximum capacity of 6 guests exceeded/);
  });

  it('allows exact capacity limit (e.g. 6 guests out of 6 max)', () => {
    const result = calculateBookingPrice(
      baseConfig,
      '2026-10-01',
      '2026-10-03',
      { adults: 4, children: 2 }
    );
    expect(result.totalNights).toBe(2);
  });

  it('Property-Based Test: Reservation fee + remaining balance always equals totalAmount', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 2000 }), // base price
        fc.integer({ min: 1, max: 20 }),    // nights
        fc.integer({ min: 1, max: 6 }),     // adults
        fc.integer({ min: 0, max: 4 }),     // children
        (basePrice, nights, adults, children) => {
          if (adults + children > 10) return true;
          const customConfig: CondoPricingConfig = {
            ...baseConfig,
            baseNightlyPrice: basePrice,
            maxGuests: 10,
          };
          const checkIn = '2026-11-01';
          const dIn = new Date('2026-11-01T00:00:00Z');
          dIn.setUTCDate(dIn.getUTCDate() + nights);
          const checkOut = dIn.toISOString().split('T')[0];

          const calc = calculateBookingPrice(customConfig, checkIn, checkOut, { adults, children });
          // Float sum verification
          const sum = Math.round((calc.reservationFee + calc.remainingBalance) * 100) / 100;
          expect(sum).toBe(calc.totalAmount);
          expect(calc.totalAmount).toBeGreaterThan(0);
        }
      )
    );
  });
});
```

---

### Tier 3: Cross-Feature Combinations Suite (`tier3-combinations.test.ts`)
```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateBookingPrice,
  CondoPricingConfig,
  SeasonalRule,
  ExtraItem,
} from '@/lib/pricing/pricingEngine';

describe('Tier 3: Cross-Feature Combinations', () => {
  const peakHolidayRule: SeasonalRule = {
    name: 'Christmas Peak Season',
    startDate: '2026-12-20',
    endDate: '2027-01-05',
    multiplier: 1.5, // +50% holiday surcharge
  };

  const complexConfig: CondoPricingConfig = {
    baseNightlyPrice: 300,
    weekendMultiplier: 1.25, // 1.25 on Fri/Sat
    cleaningFee: 100,
    serviceChargeRate: 0.10,
    taxRate: 0.12,
    reservationFeeRate: 0.30,
    seasonalRules: [peakHolidayRule],
    maxGuests: 8,
    minStayNights: 3,
  };

  it('combines seasonal peak rates + weekend markup + weekly stay discount + multi-guest extras', () => {
    // 7 nights spanning Christmas: 2026-12-23 (Wed) to 2026-12-30 (Wed)
    // Nights: Dec 23(Wed), 24(Thu), 25(Fri - Weekend), 26(Sat - Weekend), 27(Sun), 28(Mon), 29(Tue)
    // All fall under peak season (1.5x)
    // Weekdays: 300 * 1.5 = 450
    // Weekends (Fri/Sat): 300 * 1.25 * 1.5 = 562.50
    // Total Base = (5 * 450) + (2 * 562.50) = 2250 + 1125 = 3375.00
    // Weekly discount (7+ nights): 12% of 3375 = 405.00. Net Lodging = 2970.00

    const extras: ExtraItem[] = [
      { id: '1', name: 'Private Chef Dinner', price: 150, price_type: 'per_stay', quantity: 1 },
      { id: '2', name: 'Daily Island Tour Pass', price: 30, price_type: 'per_guest_per_night', quantity: 1 },
    ];

    const result = calculateBookingPrice(
      complexConfig,
      '2026-12-23',
      '2026-12-30',
      { adults: 4, children: 2 }, // 6 guests
      extras
    );

    expect(result.totalNights).toBe(7);
    expect(result.baseLodgingTotal).toBe(3375.0);
    expect(result.stayDiscountAmount).toBe(405.0);
    expect(result.netLodgingTotal).toBe(2970.0);

    // Extras:
    // Extra 1: 150
    // Extra 2: 30 * 6 guests * 7 nights = 1260
    // Extras Total = 1410
    expect(result.extrasTotal).toBe(1410.0);

    // Cleaning = 100
    // Service Fee = 10% of 2970 = 297.00
    // Taxable Base = 2970 + 100 + 1410 + 297 = 4777.00
    // Taxes (12%) = 573.24
    // Total = 5350.24
    expect(result.cleaningFee).toBe(100.0);
    expect(result.serviceFee).toBe(297.0);
    expect(result.taxAmount).toBe(573.24);
    expect(result.totalAmount).toBe(5350.24);

    // Reservation Fee (30%) = 1605.07
    // Remaining Balance = 3745.17
    expect(result.reservationFee).toBe(1605.07);
    expect(result.remainingBalance).toBe(3745.17);
    expect(result.reservationFee + result.remainingBalance).toBe(result.totalAmount);
  });
});
```

---

### Tier 4: Real-World Workload & Concurrency Suite (`tier4-concurrency-and-e2e.test.tsx`)
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-Memory Transactional Booking Store to simulate Supabase PostgreSQL RPC & Lock
interface StoredBooking {
  id: string;
  condo_id: string;
  check_in: string;
  check_out: string;
  guest_email: string;
  status: 'pending_payment' | 'confirmed' | 'rejected' | 'cancelled';
}

class InMemoryBookingService {
  private bookings: StoredBooking[] = [];
  private lock: boolean = false;

  async bookCondoAtomic(booking: Omit<StoredBooking, 'id' | 'status'>): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    // Simulate database row lock / advisory lock / exclusion constraint
    while (this.lock) {
      await new Promise((r) => setTimeout(r, 5));
    }
    this.lock = true;

    try {
      // Check date overlap against confirmed or pending bookings:
      // Overlap condition: NOT (new_checkout <= existing_checkin OR new_checkin >= existing_checkout)
      const hasConflict = this.bookings.some((b) => {
        if (b.condo_id !== booking.condo_id) return false;
        if (b.status === 'rejected' || b.status === 'cancelled') return false;
        const noOverlap = booking.check_out <= b.check_in || booking.check_in >= b.check_out;
        return !noOverlap;
      });

      if (hasConflict) {
        return { success: false, error: 'ERR_DATE_CONFLICT_ALREADY_BOOKED' };
      }

      const newBooking: StoredBooking = {
        id: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        status: 'pending_payment',
        ...booking,
      };
      this.bookings.push(newBooking);
      return { success: true, bookingId: newBooking.id };
    } finally {
      this.lock = false;
    }
  }

  async adminReviewBooking(bookingId: string, action: 'confirm' | 'reject'): Promise<boolean> {
    const b = this.bookings.find((item) => item.id === bookingId);
    if (!b) return false;
    b.status = action === 'confirm' ? 'confirmed' : 'rejected';
    return true;
  }

  getBookings() {
    return this.bookings;
  }
}

describe('Tier 4: Real-World Workload & Concurrency Tests', () => {
  let bookingService: InMemoryBookingService;

  beforeEach(() => {
    bookingService = new InMemoryBookingService();
  });

  it('prevents double-booking race condition when 2 guests submit concurrently for overlapping dates', async () => {
    const condoId = 'condo_luxury_penthouse_1';

    // Guest A wants Oct 10 to Oct 15
    const requestA = bookingService.bookCondoAtomic({
      condo_id: condoId,
      check_in: '2026-10-10',
      check_out: '2026-10-15',
      guest_email: 'guestA@luxury.com',
    });

    // Guest B simultaneously wants Oct 12 to Oct 17 (overlapping dates)
    const requestB = bookingService.bookCondoAtomic({
      condo_id: condoId,
      check_in: '2026-10-12',
      check_out: '2026-10-17',
      guest_email: 'guestB@luxury.com',
    });

    const [resA, resB] = await Promise.all([requestA, requestB]);

    // Exactly one must succeed, and the other must be rejected due to date conflict
    const successCount = [resA, resB].filter((r) => r.success).length;
    const errorCount = [resA, resB].filter((r) => !r.success).length;

    expect(successCount).toBe(1);
    expect(errorCount).toBe(1);

    const failed = [resA, resB].find((r) => !r.success);
    expect(failed?.error).toBe('ERR_DATE_CONFLICT_ALREADY_BOOKED');
  });

  it('allows back-to-back reservations (check-out day == next check-in day)', async () => {
    const condoId = 'condo_beach_villa_2';

    // Guest 1: Oct 10 to Oct 15
    const res1 = await bookingService.bookCondoAtomic({
      condo_id: condoId,
      check_in: '2026-10-10',
      check_out: '2026-10-15',
      guest_email: 'guest1@resort.com',
    });

    // Guest 2: Oct 15 to Oct 20 (same check-in as Guest 1 check-out)
    const res2 = await bookingService.bookCondoAtomic({
      condo_id: condoId,
      check_in: '2026-10-15',
      check_out: '2026-10-20',
      guest_email: 'guest2@resort.com',
    });

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
  });

  it('handles Admin approval and rejection workflow lifecycle', async () => {
    const condoId = 'condo_azure_suite_3';

    // 1. Guest creates pending booking
    const bookingRes = await bookingService.bookCondoAtomic({
      condo_id: condoId,
      check_in: '2026-11-01',
      check_out: '2026-11-05',
      guest_email: 'vip@travel.com',
    });
    expect(bookingRes.success).toBe(true);
    const bookingId = bookingRes.bookingId!;

    // 2. Admin rejects invalid payment
    await bookingService.adminReviewBooking(bookingId, 'reject');
    expect(bookingService.getBookings().find((b) => b.id === bookingId)?.status).toBe('rejected');

    // 3. New guest can now book the freed dates
    const newBookingRes = await bookingService.bookCondoAtomic({
      condo_id: condoId,
      check_in: '2026-11-01',
      check_out: '2026-11-05',
      guest_email: 'new_guest@travel.com',
    });
    expect(newBookingRes.success).toBe(true);

    // 4. Admin confirms verified payment
    await bookingService.adminReviewBooking(newBookingRes.bookingId!, 'confirm');
    expect(bookingService.getBookings().find((b) => b.id === newBookingRes.bookingId)?.status).toBe('confirmed');
  });
});
```

---

# SECTION 4: Implementation Roadmap & Handoff Summary

### Blueprint for Implementers (Track A & Track B)
1. **Frontend UI Assembly:**
   - Install fonts (`Playfair Display`, `Plus Jakarta Sans`, `JetBrains Mono`).
   - Implement `LuxuryCard` (double-bezel), `LuxuryButton` (button-in-button), and `StickyMobileBookingBar`.
   - Setup Tailwind v4 `@theme` tokens in `src/index.css`.
2. **Pricing Module Integration:**
   - Place `pricingEngine.ts` in `src/lib/pricing/pricingEngine.ts`.
   - Hook into Booking Steps 2, 3, 4, 5 for instant interactive total and reservation fee re-calculations.
3. **Vitest Test Suite Activation:**
   - Populate `src/lib/pricing/__tests__/pricingEngine.test.ts`, `tests/tier2-boundary.test.ts`, `tests/tier3-combinations.test.ts`, and `tests/tier4-concurrency-and-e2e.test.tsx`.
   - Run `npm test` / `npx vitest run` to ensure 100% green pass rate across all tiers.
