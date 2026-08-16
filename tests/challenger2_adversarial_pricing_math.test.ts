/**
 * CHALLENGER 2: ADVERSARIAL PRICING & FINANCIAL MATH STRESS HARNESS
 *
 * Empirical verification suite testing:
 * 1. Extreme Date Boundaries (Leap years 2028, 2032, 2100 vs 2400, multi-year stays, year-end transitions, inverted dates)
 * 2. Financial Invariants (Floating-point precision rounding, cents/centavos consistency, downpayment balance conservation)
 * 3. Capacity & Extras Edge Cases (0 adults, negative children/adults, overflow guests, 0/negative/capped/disabled extras)
 * 4. Generative Stress Testing (1,500+ randomized fuzz iterations verifying mathematical invariants)
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  calculateNights,
  validateDateRange,
  parseISODateToUTC,
  toISODateString,
  isWeekendNight,
  getNightlyDates,
  areDateRangesOverlapping,
  isDateWithinRange,
  addDaysToDateStr,
  formatDateDisplay,
  formatDateRangeDisplay,
} from '../src/lib/dateUtils';
import {
  calculateBookingPrice,
  validateCapacity,
  getLengthOfStayDiscountPercent,
  type PricingEngineInput,
} from '../src/lib/pricingEngine';
import type { Condo, Extra, SelectedExtra, SeasonalRule } from '../src/types/booking';

describe('Challenger 2: Adversarial Pricing & Financial Math Verification', () => {
  const testCondo: Condo = {
    id: 'test-condo-adv-001',
    slug: 'sapphire-adversarial-penthouse',
    name: 'Sapphire Adversarial Penthouse',
    description: 'Adversarial mathematical stress suite test subject',
    location: 'Tower A',
    images: [{ url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750' }],
    max_guests: 6,
    bedrooms: 3,
    bathrooms: 3,
    base_price_per_night: 2750, // PHP currency integer base rate
    weekend_price_per_night: 3500, // PHP currency integer weekend rate
    cleaning_fee: 1250,
    reservation_fee_rate: 0.20, // 20%
    security_deposit: 5000,
    min_stay_nights: 1,
    max_stay_nights: 365,
    amenities: ['Jacuzzi', 'WiFi'],
    house_rules: ['Strictly no smoking'],
    check_in_time: '14:00',
    check_out_time: '11:00',
    status: 'active',
    is_active: true,
    sort_order: 1,
  };

  const sampleExtras: Extra[] = [
    {
      id: 'ext-stay-1',
      name: 'Airport Transfer Shuttle',
      slug: 'airport-shuttle',
      description: 'Per-stay flat fee',
      price: 1500,
      price_type: 'per_stay',
      icon: 'Car',
      category: 'Transfer',
      max_quantity: 2,
      is_enabled: true,
      sort_order: 1,
    },
    {
      id: 'ext-night-1',
      name: 'Dedicated Butler Service',
      slug: 'butler-service',
      description: 'Per-night fee',
      price: 850,
      price_type: 'per_night',
      icon: 'UserCheck',
      category: 'Service',
      max_quantity: 1,
      is_enabled: true,
      sort_order: 2,
    },
    {
      id: 'ext-guest-1',
      name: 'Resort Spa Pass',
      slug: 'spa-pass',
      description: 'Per-guest fee',
      price: 450,
      price_type: 'per_guest',
      icon: 'Sparkles',
      category: 'Wellness',
      max_quantity: 6,
      is_enabled: true,
      sort_order: 3,
    },
    {
      id: 'ext-guest-night-1',
      name: 'Executive Breakfast Buffet',
      slug: 'breakfast-buffet',
      description: 'Per-guest per-night fee',
      price: 320,
      price_type: 'per_guest_per_night',
      icon: 'Utensils',
      category: 'Dining',
      max_quantity: 6,
      is_enabled: true,
      sort_order: 4,
    },
    {
      id: 'ext-disabled-1',
      name: 'Discontinued Helipad Tour',
      slug: 'helipad-tour',
      description: 'Disabled extra',
      price: 10000,
      price_type: 'per_stay',
      icon: 'Plane',
      category: 'Tour',
      max_quantity: 1,
      is_enabled: false,
      sort_order: 5,
    },
  ];

  // ==========================================================================
  // SECTION 1: EXTREME DATE BOUNDARIES & LEAP YEAR CALENDAR MATHEMATICS
  // ==========================================================================
  describe('1. Extreme Date Boundaries & Leap Year Calendar Math', () => {
    it('DATE-ADV-01: Leap Year 2028 (Divisible by 4) — Feb 28 to Mar 1 has 2 nights including Feb 29', () => {
      const checkIn = '2028-02-28';
      const checkOut = '2028-03-01';
      const nights = calculateNights(checkIn, checkOut);
      const nightlyDates = getNightlyDates(checkIn, checkOut);

      expect(nights).toBe(2);
      expect(nightlyDates).toEqual(['2028-02-28', '2028-02-29']);
      expect(isWeekendNight('2028-02-28')).toBe(false); // Monday
      expect(isWeekendNight('2028-02-29')).toBe(false); // Tuesday
    });

    it('DATE-ADV-02: Leap Year 2032 (Divisible by 4) — Feb 28 to Mar 02 has 3 nights', () => {
      const checkIn = '2032-02-28';
      const checkOut = '2032-03-02';
      const nights = calculateNights(checkIn, checkOut);
      const nightlyDates = getNightlyDates(checkIn, checkOut);

      expect(nights).toBe(3);
      expect(nightlyDates).toEqual(['2032-02-28', '2032-02-29', '2032-03-01']);
      expect(isWeekendNight('2032-02-28')).toBe(true); // Saturday (UTC Day 6)
      expect(isWeekendNight('2032-02-29')).toBe(false); // Sunday
      expect(isWeekendNight('2032-03-01')).toBe(false); // Monday
    });

    it('DATE-ADV-03: Century Non-Leap Year 2100 (Divisible by 100 but NOT 400) — Feb 28 to Mar 1 has ONLY 1 night', () => {
      // In Gregorian calendar, 2100 is NOT a leap year (no Feb 29)
      const checkIn = '2100-02-28';
      const checkOut = '2100-03-01';
      const nights = calculateNights(checkIn, checkOut);
      const nightlyDates = getNightlyDates(checkIn, checkOut);

      expect(nights).toBe(1);
      expect(nightlyDates).toEqual(['2100-02-28']);
    });

    it('DATE-ADV-04: Quad-Century Leap Year 2400 (Divisible by 400) — Feb 28 to Mar 1 HAS 2 nights with Feb 29', () => {
      // In Gregorian calendar, 2400 IS a leap year (Feb 29 exists)
      const checkIn = '2400-02-28';
      const checkOut = '2400-03-01';
      const nights = calculateNights(checkIn, checkOut);
      const nightlyDates = getNightlyDates(checkIn, checkOut);

      expect(nights).toBe(2);
      expect(nightlyDates).toEqual(['2400-02-28', '2400-02-29']);
    });

    it('DATE-ADV-05: Year Transition (Dec 31 to Jan 1 across various years)', () => {
      const transitions = [
        { in: '2026-12-31', out: '2027-01-01', expectedNights: 1, expectedDates: ['2026-12-31'] },
        { in: '2027-12-30', out: '2028-01-02', expectedNights: 3, expectedDates: ['2027-12-30', '2027-12-31', '2028-01-01'] },
        { in: '2099-12-31', out: '2100-01-01', expectedNights: 1, expectedDates: ['2099-12-31'] },
        { in: '2399-12-31', out: '2400-01-01', expectedNights: 1, expectedDates: ['2399-12-31'] },
      ];

      for (const t of transitions) {
        expect(calculateNights(t.in, t.out)).toBe(t.expectedNights);
        expect(getNightlyDates(t.in, t.out)).toEqual(t.expectedDates);
      }
    });

    it('DATE-ADV-06: Multi-Year Continuous Extended Stay (365 Nights in Common Year)', () => {
      // 2026-01-01 to 2027-01-01 = 365 nights
      const nights = calculateNights('2026-01-01', '2027-01-01');
      expect(nights).toBe(365);

      const dates = getNightlyDates('2026-01-01', '2027-01-01');
      expect(dates.length).toBe(365);
      expect(dates[0]).toBe('2026-01-01');
      expect(dates[364]).toBe('2026-12-31');
    });

    it('DATE-ADV-07: Multi-Year Extended Stay Spanning Leap Year (2028-01-01 to 2029-01-01 = 366 Nights)', () => {
      const nights = calculateNights('2028-01-01', '2029-01-01');
      expect(nights).toBe(366);

      const dates = getNightlyDates('2028-01-01', '2029-01-01');
      expect(dates.length).toBe(366);
      expect(dates.includes('2028-02-29')).toBe(true);
    });

    it('DATE-ADV-08: Inverted & Negative Date Ranges Return 0 Nights and are Rejected', () => {
      const invertedPairs = [
        { in: '2026-10-10', out: '2026-10-09' },
        { in: '2028-03-01', out: '2028-02-28' },
        { in: '2027-01-01', out: '2026-01-01' },
      ];

      for (const pair of invertedPairs) {
        expect(calculateNights(pair.in, pair.out)).toBe(0);
        expect(getNightlyDates(pair.in, pair.out)).toEqual([]);
        const val = validateDateRange(pair.in, pair.out);
        expect(val.valid).toBe(false);
        expect(val.error).toMatch(/strictly after/i);
      }
    });

    it('DATE-ADV-09: Identical Check-In and Check-Out (Same-Day / 0 Nights)', () => {
      const checkIn = '2026-10-15';
      const checkOut = '2026-10-15';
      expect(calculateNights(checkIn, checkOut)).toBe(0);
      expect(getNightlyDates(checkIn, checkOut)).toEqual([]);

      const val = validateDateRange(checkIn, checkOut);
      expect(val.valid).toBe(false);
      expect(val.error).toMatch(/strictly after/i);

      // Pricing engine returns 0 nights and base cleaning fee fallback without throwing
      const price = calculateBookingPrice({
        condo: testCondo,
        checkIn,
        checkOut,
        numAdults: 2,
      });
      expect(price.nights).toBe(0);
      expect(price.lodging_subtotal).toBe(0);
      expect(price.nightly_rates).toEqual([]);
    });

    it('DATE-ADV-10: Empty, Malformed and Invalid Non-ISO Date Strings', () => {
      expect(calculateNights('', '2026-10-20')).toBe(0);
      expect(calculateNights('2026-10-15', '')).toBe(0);
      expect(calculateNights('invalid', 'dates')).toBe(0);
      expect(getNightlyDates('', '2026-10-20')).toEqual([]);
    });

    it('DATE-ADV-11: Date Range Overlap Edge Checks (Boundary Adjacent vs True Overlap)', () => {
      // Range A: [2026-10-01, 2026-10-05) -> nights 1, 2, 3, 4
      // Range B: [2026-10-05, 2026-10-10) -> nights 5, 6, 7, 8, 9
      // These are adjacent (guest A checks out at 11am on 5th, guest B checks in at 2pm on 5th)
      expect(areDateRangesOverlapping('2026-10-01', '2026-10-05', '2026-10-05', '2026-10-10')).toBe(false);
      expect(areDateRangesOverlapping('2026-10-05', '2026-10-10', '2026-10-01', '2026-10-05')).toBe(false);

      // Range C: [2026-10-04, 2026-10-06) -> overlaps on night of 4th
      expect(areDateRangesOverlapping('2026-10-01', '2026-10-05', '2026-10-04', '2026-10-06')).toBe(true);

      // Range D completely engulfing Range A
      expect(areDateRangesOverlapping('2026-09-01', '2026-11-01', '2026-10-01', '2026-10-05')).toBe(true);
    });
  });

  // ==========================================================================
  // SECTION 2: FINANCIAL INVARIANTS & FLOATING POINT PRECISION ROUNDING
  // ==========================================================================
  describe('2. Financial Invariants & Precision Rounding', () => {
    it('FIN-ADV-01: Invariant 1: subtotal === lodging_subtotal + cleaning_fee + extras_total', () => {
      const input: PricingEngineInput = {
        condo: testCondo,
        checkIn: '2026-10-05', // Mon
        checkOut: '2026-10-09', // Fri (4 weekday nights)
        numAdults: 2,
        numChildren: 1,
        selectedExtras: [
          { extra_id: 'ext-stay-1', quantity: 1 },
          { extra_id: 'ext-night-1', quantity: 1 },
          { extra_id: 'ext-guest-1', quantity: 3 },
          { extra_id: 'ext-guest-night-1', quantity: 3 },
        ],
        allExtras: sampleExtras,
      };

      const breakdown = calculateBookingPrice(input);
      const expectedSubtotal = breakdown.lodging_subtotal + breakdown.cleaning_fee + breakdown.extras_total;

      expect(breakdown.subtotal).toBe(expectedSubtotal);
    });

    it('FIN-ADV-02: Invariant 2: lodging_subtotal === sum(nightly_rates) - length_of_stay_discount', () => {
      const input: PricingEngineInput = {
        condo: testCondo,
        checkIn: '2026-10-01',
        checkOut: '2026-10-15', // 14 nights -> 15% discount
        numAdults: 2,
        allExtras: sampleExtras,
      };

      const breakdown = calculateBookingPrice(input);
      const rawLodgingSum = breakdown.nightly_rates.reduce((sum, r) => sum + r.rate, 0);

      expect(breakdown.base_lodging_total + breakdown.weekend_surcharge_total + breakdown.seasonal_surcharge_total).toBe(rawLodgingSum);
      expect(breakdown.lodging_subtotal).toBe(rawLodgingSum - breakdown.length_of_stay_discount);
    });

    it('FIN-ADV-03: Invariant 3: EXACT DOWNPAYMENT CONSERVATION (reservation_fee + remaining_balance === total_amount)', () => {
      // Test across fractional reservation rates (e.g. 5%, 10%, 15%, 20%, 25%, 33.33%, 50%, 75%, 100%)
      const rates = [0.05, 0.10, 0.15, 0.20, 0.25, 0.3333, 0.50, 0.75, 1.00];

      for (const rate of rates) {
        const condoWithRate: Condo = { ...testCondo, reservation_fee_rate: rate };
        const breakdown = calculateBookingPrice({
          condo: condoWithRate,
          checkIn: '2026-10-05',
          checkOut: '2026-10-12', // 7 nights
          numAdults: 3,
          selectedExtras: [{ extra_id: 'ext-stay-1', quantity: 1 }],
          allExtras: sampleExtras,
          taxRate: 0.12,
          serviceChargeRate: 0.10,
        });

        // Exact match with zero penny drift
        expect(breakdown.reservation_fee_amount + breakdown.remaining_balance_amount).toBe(breakdown.total_amount);
        expect(breakdown.reservation_fee_amount).toBeGreaterThanOrEqual(0);
        expect(breakdown.remaining_balance_amount).toBeGreaterThanOrEqual(0);
      }
    });

    it('FIN-ADV-04: Invariant 4: total_amount === subtotal + service_charge + tax_amount', () => {
      const input: PricingEngineInput = {
        condo: testCondo,
        checkIn: '2026-10-09', // Fri
        checkOut: '2026-10-12', // Mon (3 nights: Fri, Sat, Sun)
        numAdults: 4,
        selectedExtras: [
          { extra_id: 'ext-stay-1', quantity: 2 },
          { extra_id: 'ext-guest-night-1', quantity: 4 },
        ],
        allExtras: sampleExtras,
        taxRate: 0.12, // 12% VAT
        serviceChargeRate: 0.10, // 10% Service charge
      };

      const res = calculateBookingPrice(input);
      expect(res.total_amount).toBe(res.subtotal + res.service_charge + res.tax_amount);
    });

    it('FIN-ADV-05: Non-terminating Seasonal Multiplier Does Not Produce NaN or Infinite Values', () => {
      const weirdSeason: SeasonalRule = {
        name: 'Flash Promo Season',
        startDate: '2026-10-01',
        endDate: '2026-10-20',
        multiplier: 1.173928, // Non-terminating multiplier
      };

      const breakdown = calculateBookingPrice({
        condo: testCondo,
        checkIn: '2026-10-08',
        checkOut: '2026-10-12', // 4 nights
        numAdults: 2,
        seasonalRules: [weirdSeason],
        taxRate: 0.12,
        serviceChargeRate: 0.0825,
      });

      expect(Number.isNaN(breakdown.total_amount)).toBe(false);
      expect(Number.isFinite(breakdown.total_amount)).toBe(true);
      expect(breakdown.reservation_fee_amount + breakdown.remaining_balance_amount).toBe(breakdown.total_amount);
    });

    it('FIN-ADV-06: 100% Discount Scenario — Lodging Subtotal Becomes 0 Without Breaking Totals', () => {
      const breakdown = calculateBookingPrice({
        condo: testCondo,
        checkIn: '2026-10-05',
        checkOut: '2026-10-08',
        numAdults: 2,
        customDiscountPercent: 1.00, // 100% discount on lodging
        allExtras: sampleExtras,
      });

      expect(breakdown.lodging_subtotal).toBe(0);
      expect(breakdown.subtotal).toBe(breakdown.cleaning_fee); // Only cleaning fee remains
      expect(breakdown.total_amount).toBe(breakdown.cleaning_fee);
      expect(breakdown.reservation_fee_amount + breakdown.remaining_balance_amount).toBe(breakdown.total_amount);
    });
  });

  // ==========================================================================
  // SECTION 3: CAPACITY & EXTRAS EDGE CASES
  // ==========================================================================
  describe('3. Capacity & Extras Edge Cases', () => {
    it('CAP-ADV-01: Zero Adults is Strictly Rejected by validateCapacity', () => {
      const res = validateCapacity(testCondo, 0, 2);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/At least 1 adult/i);
    });

    it('CAP-ADV-02: Negative Adults is Strictly Rejected by validateCapacity', () => {
      const res1 = validateCapacity(testCondo, -1, 2);
      expect(res1.valid).toBe(false);
      expect(res1.error).toMatch(/At least 1 adult/i);

      const res2 = validateCapacity(testCondo, -100, 0);
      expect(res2.valid).toBe(false);
    });

    it('CAP-ADV-03: Exceeding Maximum Guests is Strictly Rejected', () => {
      // testCondo max_guests = 6
      const res1 = validateCapacity(testCondo, 7, 0);
      expect(res1.valid).toBe(false);
      expect(res1.error).toMatch(/exceeds maximum suite capacity/i);

      const res2 = validateCapacity(testCondo, 4, 3); // 7 guests > 6
      expect(res2.valid).toBe(false);
    });

    it('CAP-ADV-04: Exact Boundary Party Size is Allowed (Adults + Children === max_guests)', () => {
      const res = validateCapacity(testCondo, 2, 4); // 6 guests === 6
      expect(res.valid).toBe(true);
      expect(res.totalGuests).toBe(6);
    });

    it('CAP-ADV-05: 0-Quantity Extras Produce 0 Total and Are Omitted from Itemized Bill', () => {
      const input: PricingEngineInput = {
        condo: testCondo,
        checkIn: '2026-10-05',
        checkOut: '2026-10-07',
        numAdults: 2,
        selectedExtras: [
          { extra_id: 'ext-stay-1', quantity: 0 },
          { extra_id: 'ext-night-1', quantity: 0 },
          { extra_id: 'ext-guest-1', quantity: 0 },
          { extra_id: 'ext-guest-night-1', quantity: 0 },
        ],
        allExtras: sampleExtras,
      };

      const breakdown = calculateBookingPrice(input);
      expect(breakdown.extras_total).toBe(0);
      expect(breakdown.itemized_extras.length).toBe(0);
    });

    it('CAP-ADV-06: Negative Quantity Extras Are Ignored and Do Not Subtract Money', () => {
      const input: PricingEngineInput = {
        condo: testCondo,
        checkIn: '2026-10-05',
        checkOut: '2026-10-07',
        numAdults: 2,
        selectedExtras: [
          { extra_id: 'ext-stay-1', quantity: -5 },
          { extra_id: 'ext-night-1', quantity: -10 },
        ],
        allExtras: sampleExtras,
      };

      const breakdown = calculateBookingPrice(input);
      expect(breakdown.extras_total).toBe(0);
      expect(breakdown.itemized_extras.length).toBe(0);
    });

    it('CAP-ADV-07: Extra Quantities Exceeding max_quantity Are Automatically Clamped', () => {
      // ext-stay-1 max_quantity = 2
      // ext-night-1 max_quantity = 1
      const input: PricingEngineInput = {
        condo: testCondo,
        checkIn: '2026-10-05',
        checkOut: '2026-10-07', // 2 nights
        numAdults: 2,
        selectedExtras: [
          { extra_id: 'ext-stay-1', quantity: 99 },
          { extra_id: 'ext-night-1', quantity: 50 },
        ],
        allExtras: sampleExtras,
      };

      const breakdown = calculateBookingPrice(input);
      const stayItem = breakdown.itemized_extras.find((e) => e.extra_id === 'ext-stay-1');
      const nightItem = breakdown.itemized_extras.find((e) => e.extra_id === 'ext-night-1');

      expect(stayItem?.quantity).toBe(2);
      expect(stayItem?.total_price).toBe(2 * 1500);

      expect(nightItem?.quantity).toBe(1);
      expect(nightItem?.total_price).toBe(1 * 850 * 2); // 1 qty * 850 * 2 nights
    });

    it('CAP-ADV-08: Disabled Extras in Selection Are Ignored and Not Billed', () => {
      const input: PricingEngineInput = {
        condo: testCondo,
        checkIn: '2026-10-05',
        checkOut: '2026-10-07',
        numAdults: 2,
        selectedExtras: [
          { extra_id: 'ext-disabled-1', quantity: 1 }, // Disabled $10,000 extra
          { extra_id: 'ext-stay-1', quantity: 1 },     // Enabled $1,500 extra
        ],
        allExtras: sampleExtras,
      };

      const breakdown = calculateBookingPrice(input);
      expect(breakdown.extras_total).toBe(1500);
      expect(breakdown.itemized_extras.length).toBe(1);
      expect(breakdown.itemized_extras.some((e) => e.extra_id === 'ext-disabled-1')).toBe(false);
    });

    it('CAP-ADV-09: Non-Existent Extra IDs in Payload are Safely Filtered Out', () => {
      const input: PricingEngineInput = {
        condo: testCondo,
        checkIn: '2026-10-05',
        checkOut: '2026-10-07',
        numAdults: 2,
        selectedExtras: [
          { extra_id: 'non-existent-uuid-9999', quantity: 5 },
          { extra_id: 'another-bogus-extra', quantity: 10 },
        ],
        allExtras: sampleExtras,
      };

      const breakdown = calculateBookingPrice(input);
      expect(breakdown.extras_total).toBe(0);
      expect(breakdown.itemized_extras).toEqual([]);
    });

    it('CAP-ADV-10: All 4 Pricing Models under 1 Guest vs Max Guests', () => {
      // 1 Guest, 3 Nights
      const breakdown1 = calculateBookingPrice({
        condo: testCondo,
        checkIn: '2026-10-05',
        checkOut: '2026-10-08', // 3 nights
        numAdults: 1,
        numChildren: 0,
        selectedExtras: [
          { extra_id: 'ext-stay-1', quantity: 1 },        // 1500
          { extra_id: 'ext-night-1', quantity: 1 },       // 850 * 3 = 2550
          { extra_id: 'ext-guest-1', quantity: 1 },       // 450 * 1 guest = 450
          { extra_id: 'ext-guest-night-1', quantity: 1 }, // 320 * 1 guest * 3 nights = 960
        ],
        allExtras: sampleExtras,
      });

      expect(breakdown1.extras_total).toBe(1500 + 2550 + 450 + 960);

      // 6 Guests (3 adults + 3 children), 3 Nights
      const breakdown6 = calculateBookingPrice({
        condo: testCondo,
        checkIn: '2026-10-05',
        checkOut: '2026-10-08', // 3 nights
        numAdults: 3,
        numChildren: 3,
        selectedExtras: [
          { extra_id: 'ext-stay-1', quantity: 1 },        // 1500
          { extra_id: 'ext-night-1', quantity: 1 },       // 850 * 3 = 2550
          { extra_id: 'ext-guest-1', quantity: 1 },       // 450 * 6 guests = 2700
          { extra_id: 'ext-guest-night-1', quantity: 1 }, // 320 * 6 guests * 3 nights = 5760
        ],
        allExtras: sampleExtras,
      });

      expect(breakdown6.extras_total).toBe(1500 + 2550 + 2700 + 5760);
    });
  });

  // ==========================================================================
  // SECTION 4: GENERATIVE ADVERSARIAL PROPERTY-BASED TESTING (1,000+ RUNS)
  // ==========================================================================
  describe('4. Generative Adversarial Property-Based Invariant Verification', () => {
    it('PBT-ADV-01: Massive Randomized Stress Fuzzing (1000 Runs) — Invariant Conservation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 50000 }),   // base price
          fc.integer({ min: 0, max: 15000 }),    // weekend markup
          fc.integer({ min: 0, max: 5000 }),     // cleaning fee
          fc.integer({ min: 1, max: 60 }),       // stay nights
          fc.integer({ min: 1, max: 10 }),       // adults
          fc.integer({ min: 0, max: 8 }),        // children
          fc.integer({ min: 1, max: 100 }),      // reservation fee pct (1% to 100%)
          fc.integer({ min: 0, max: 30 }),       // tax pct (0% to 30%)
          fc.integer({ min: 0, max: 20 }),       // service charge pct (0% to 20%)
          (base, markup, cleaning, nights, adults, children, resPct, taxPct, scPct) => {
            const dynamicCondo: Condo = {
              ...testCondo,
              base_price_per_night: base,
              weekend_price_per_night: base + markup,
              cleaning_fee: cleaning,
              reservation_fee_rate: resPct / 100,
              max_guests: 20,
            };

            const checkIn = '2026-11-01';
            const checkOut = addDaysToDateStr(checkIn, nights);

            const res = calculateBookingPrice({
              condo: dynamicCondo,
              checkIn,
              checkOut,
              numAdults: adults,
              numChildren: children,
              allExtras: sampleExtras,
              taxRate: taxPct / 100,
              serviceChargeRate: scPct / 100,
            });

            // Universal Invariant 1: Total matches subtotal + taxes + service charges
            expect(res.total_amount).toBe(res.subtotal + res.service_charge + res.tax_amount);

            // Universal Invariant 2: Reservation Downpayment + Balance EXACTLY equals Total
            expect(res.reservation_fee_amount + res.remaining_balance_amount).toBe(res.total_amount);

            // Universal Invariant 3: Subtotal matches lodging + cleaning + extras
            expect(res.subtotal).toBe(res.lodging_subtotal + res.cleaning_fee + res.extras_total);

            // Universal Invariant 4: Lodging subtotal matches sum of nightly rates minus length of stay discount
            const sumNightly = res.nightly_rates.reduce((sum, n) => sum + n.rate, 0);
            expect(res.lodging_subtotal).toBe(sumNightly - res.length_of_stay_discount);

            // Universal Invariant 5: No negative amounts or NaN
            expect(res.total_amount).toBeGreaterThanOrEqual(0);
            expect(res.reservation_fee_amount).toBeGreaterThanOrEqual(0);
            expect(res.remaining_balance_amount).toBeGreaterThanOrEqual(0);
            expect(Number.isNaN(res.total_amount)).toBe(false);
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('PBT-ADV-02: Multi-Year Date Additivity and Leap Year Symmetry over 500 Random Iterations', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2026, max: 2040 }), // Year
          fc.integer({ min: 1, max: 12 }),      // Month
          fc.integer({ min: 1, max: 28 }),      // Day
          fc.integer({ min: 1, max: 120 }),     // Duration in days
          (year, month, day, duration) => {
            const startStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const endStr = addDaysToDateStr(startStr, duration);

            const computedNights = calculateNights(startStr, endStr);
            expect(computedNights).toBe(duration);

            const nightlyDates = getNightlyDates(startStr, endStr);
            expect(nightlyDates.length).toBe(duration);
            expect(nightlyDates[0]).toBe(startStr);
          }
        ),
        { numRuns: 500 }
      );
    });
  });
});
