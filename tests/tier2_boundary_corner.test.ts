/**
 * CondoPal Tier 2: Boundary & Corner Cases Test Suite
 * Extreme boundary conditions, leap-year temporal edge cases, invalid input rejection,
 * and Generative Property-Based Testing via fast-check.
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  calculateNights,
  validateDateRange,
  parseISODateToUTC,
  toISODateString,
  areDateRangesOverlapping,
  addDaysToDateStr,
  getNightlyDates,
} from '../src/lib/dateUtils';
import {
  calculateBookingPrice,
  validateCapacity,
  type PricingEngineInput,
} from '../src/lib/pricingEngine';
import type { Condo, Extra } from '../src/types/booking';

describe('Tier 2: Boundary & Corner Cases', () => {
  const boundaryCondo: Condo = {
    id: 'condo-bnd-001',
    slug: 'lumina-terrace',
    name: 'Lumina Terrace',
    description: 'High-altitude terrace residence',
    location: 'Tower 2, Level 30',
    images: [{ url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750' }],
    max_guests: 5,
    bedrooms: 2,
    bathrooms: 2,
    base_price_per_night: 150,
    weekend_price_per_night: 180,
    cleaning_fee: 40,
    reservation_fee_rate: 0.25, // 25% deposit
    security_deposit: 80,
    min_stay_nights: 1,
    max_stay_nights: 30,
    amenities: ['Terrace Jacuzzi', 'Fiber Internet'],
    house_rules: ['No loud music'],
    check_in_time: '14:00',
    check_out_time: '12:00',
    status: 'active',
    is_active: true,
    sort_order: 1,
  };

  const sampleExtras: Extra[] = [
    {
      id: 'ext-van',
      name: 'Airport Van',
      slug: 'airport-van',
      description: 'Van transfer',
      price: 50,
      price_type: 'per_stay',
      icon: 'Car',
      category: 'Transportation',
      max_quantity: 3,
      is_enabled: true,
      sort_order: 1,
    },
    {
      id: 'ext-breakfast',
      name: 'Buffet Breakfast',
      slug: 'buffet-breakfast',
      description: 'Daily buffet',
      price: 18,
      price_type: 'per_guest_per_night',
      icon: 'Utensils',
      category: 'Dining',
      max_quantity: 5,
      is_enabled: true,
      sort_order: 2,
    },
  ];

  // ==========================================
  // 1. BOUNDARY CONDITIONS & TEMPORAL EDGES (12 tests)
  // ==========================================

  it('BND-1: Handles single 1-night stay cleanly (minimum boundary)', () => {
    const input: PricingEngineInput = {
      condo: boundaryCondo,
      checkIn: '2026-10-01',
      checkOut: '2026-10-02',
      numAdults: 1,
      numChildren: 0,
      allExtras: sampleExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.nights).toBe(1);
    expect(res.base_lodging_total).toBe(150);
    expect(res.nightly_rates.length).toBe(1);
    expect(res.length_of_stay_discount).toBe(0);
    expect(res.total_amount).toBe(150 + 40); // 150 lodging + 40 cleaning
  });

  it('BND-2: Correctly calculates stay spanning leap year day (Feb 28 to Mar 1 in 2028: 2 nights)', () => {
    // 2028 is a leap year (Feb 29 exists)
    const nights = calculateNights('2028-02-28', '2028-03-01');
    expect(nights).toBe(2);

    const dates = getNightlyDates('2028-02-28', '2028-03-01');
    expect(dates).toEqual(['2028-02-28', '2028-02-29']);

    const input: PricingEngineInput = {
      condo: boundaryCondo,
      checkIn: '2028-02-28',
      checkOut: '2028-03-01',
      numAdults: 2,
      allExtras: sampleExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.nights).toBe(2);
    expect(res.nightly_rates.map((r) => r.date)).toEqual(['2028-02-28', '2028-02-29']);
  });

  it('BND-3: Correctly calculates stay spanning non-leap year February (Feb 28 to Mar 1 in 2027: 1 night)', () => {
    // 2027 is a common year (no Feb 29)
    const nights = calculateNights('2027-02-28', '2027-03-01');
    expect(nights).toBe(1);

    const dates = getNightlyDates('2027-02-28', '2027-03-01');
    expect(dates).toEqual(['2027-02-28']);
  });

  it('BND-4: Validates date range rejects same-day check-in/out (0 nights)', () => {
    const val = validateDateRange('2026-10-01', '2026-10-01', 1, 30);
    expect(val.valid).toBe(false);
    expect(val.error).toMatch(/Check-out date must be strictly after/i);
  });

  it('BND-5: Validates date range rejects inverted dates (check-out before check-in)', () => {
    const val = validateDateRange('2026-10-10', '2026-10-05', 1, 30);
    expect(val.valid).toBe(false);
    expect(val.error).toMatch(/Check-out date must be strictly after/i);
  });

  it('BND-6: Validates date range allows exact maxStayNights (30 nights)', () => {
    const checkIn = '2026-11-01';
    const checkOut = addDaysToDateStr(checkIn, 30); // 30 nights
    const val = validateDateRange(checkIn, checkOut, 1, 30);
    expect(val.valid).toBe(true);
    expect(val.nights).toBe(30);
  });

  it('BND-7: Validates date range rejects stays exceeding maxStayNights (31 nights)', () => {
    const checkIn = '2026-11-01';
    const checkOut = addDaysToDateStr(checkIn, 31); // 31 nights
    const val = validateDateRange(checkIn, checkOut, 1, 30);
    expect(val.valid).toBe(false);
    expect(val.error).toMatch(/Maximum stay duration is 30 nights/i);
  });

  it('BND-8: Allows exact maximum guest occupancy limit (e.g. 5 guests for max_guests=5)', () => {
    const cap = validateCapacity(boundaryCondo, 3, 2); // 3 adults + 2 children = 5
    expect(cap.valid).toBe(true);
    expect(cap.totalGuests).toBe(5);
  });

  it('BND-9: Rejects party exceeding maximum capacity by 1 (e.g. 6 guests for max_guests=5)', () => {
    const cap = validateCapacity(boundaryCondo, 3, 3); // 6 guests > 5
    expect(cap.valid).toBe(false);
    expect(cap.error).toMatch(/exceeds maximum suite capacity/i);
  });

  it('BND-10: Allows single adult with 0 children and 0 infants', () => {
    const cap = validateCapacity(boundaryCondo, 1, 0);
    expect(cap.valid).toBe(true);
    expect(cap.totalGuests).toBe(1);
  });

  it('BND-11: Extras with 0 quantity are ignored and not billed', () => {
    const input: PricingEngineInput = {
      condo: boundaryCondo,
      checkIn: '2026-10-01',
      checkOut: '2026-10-04',
      numAdults: 2,
      selectedExtras: [
        { extra_id: 'ext-van', quantity: 0 },
        { extra_id: 'ext-breakfast', quantity: 0 },
      ],
      allExtras: sampleExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.extras_total).toBe(0);
    expect(res.itemized_extras.length).toBe(0);
  });

  it('BND-12: Caps extra quantity at maximum allowed quantity (max_quantity)', () => {
    // ext-van has max_quantity = 3. Requesting 10.
    const input: PricingEngineInput = {
      condo: boundaryCondo,
      checkIn: '2026-10-01',
      checkOut: '2026-10-04',
      numAdults: 2,
      selectedExtras: [{ extra_id: 'ext-van', quantity: 10 }],
      allExtras: sampleExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.itemized_extras[0].quantity).toBe(3); // Capped at 3
    expect(res.itemized_extras[0].total_price).toBe(3 * 50); // 150
  });

  // ==========================================
  // 2. FINANCIAL SPLIT & SPECIAL RATES EDGES (6 tests)
  // ==========================================

  it('BND-13: Handles 100% deposit rate (full payment upfront)', () => {
    const fullPayCondo: Condo = {
      ...boundaryCondo,
      reservation_fee_rate: 1.0, // 100% deposit
    };

    const input: PricingEngineInput = {
      condo: fullPayCondo,
      checkIn: '2026-10-01',
      checkOut: '2026-10-03',
      numAdults: 2,
      allExtras: sampleExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.reservation_fee_amount).toBe(res.total_amount);
    expect(res.remaining_balance_amount).toBe(0);
  });

  it('BND-14: Handles low downpayment rate boundary (e.g. 5% deposit)', () => {
    const lowDepositCondo: Condo = {
      ...boundaryCondo,
      reservation_fee_rate: 0.05, // 5% deposit
    };

    const input: PricingEngineInput = {
      condo: lowDepositCondo,
      checkIn: '2026-10-05',
      checkOut: '2026-10-07', // 2 weekday nights @ $150 = $300
      numAdults: 2,
      allExtras: sampleExtras,
    };

    const res = calculateBookingPrice(input);
    // Total: 300 lodging + 40 cleaning = 340. 5% of 340 = 17.
    expect(res.reservation_fee_amount).toBe(17);
    expect(res.remaining_balance_amount).toBe(323);
    expect(res.reservation_fee_amount + res.remaining_balance_amount).toBe(res.total_amount);
  });

  it('BND-15: Handles 0 cleaning fee condo unit without math errors', () => {
    const zeroCleaningCondo: Condo = {
      ...boundaryCondo,
      cleaning_fee: 0,
    };

    const input: PricingEngineInput = {
      condo: zeroCleaningCondo,
      checkIn: '2026-10-05',
      checkOut: '2026-10-07', // 2 weekday nights (Mon, Tue) @ $150 = $300
      numAdults: 2,
      allExtras: sampleExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.cleaning_fee).toBe(0);
    expect(res.total_amount).toBe(300);
  });

  it('BND-16: Handles condo with equal base and weekend prices', () => {
    const flatPriceCondo: Condo = {
      ...boundaryCondo,
      base_price_per_night: 200,
      weekend_price_per_night: 200,
    };

    const input: PricingEngineInput = {
      condo: flatPriceCondo,
      checkIn: '2026-10-09', // Friday
      checkOut: '2026-10-12', // Monday (Fri, Sat, Sun: 3 nights)
      numAdults: 2,
      allExtras: sampleExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.weekend_surcharge_total).toBe(0);
    expect(res.base_lodging_total).toBe(600);
  });

  it('BND-17: Date string conversion returns empty string on invalid date', () => {
    expect(toISODateString('invalid-date-format')).toBe('');
    expect(toISODateString(new Date(NaN))).toBe('');
  });

  it('BND-18: Calculate nights returns 0 on invalid or missing date arguments', () => {
    expect(calculateNights('', '2026-10-15')).toBe(0);
    expect(calculateNights('2026-10-15', '')).toBe(0);
    expect(calculateNights('bad', 'dates')).toBe(0);
  });

  // ==========================================
  // 3. PROPERTY-BASED TESTING WITH FAST-CHECK (8 tests)
  // ==========================================

  it('PBT-1: Invariant: reservation_fee_amount + remaining_balance_amount ALWAYS equals total_amount', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 2000 }), // base price
        fc.integer({ min: 1, max: 28 }),    // nights
        fc.integer({ min: 1, max: 6 }),     // adults
        fc.integer({ min: 0, max: 4 }),     // children
        fc.integer({ min: 0, max: 100 }),   // reservation fee percent (0% to 100%)
        (basePrice, nights, adults, children, resFeePct) => {
          if (adults + children > 12) return true;
          const condo: Condo = {
            ...boundaryCondo,
            base_price_per_night: basePrice,
            weekend_price_per_night: Math.round(basePrice * 1.2),
            reservation_fee_rate: resFeePct / 100,
            max_guests: 12,
          };

          const checkIn = '2026-11-01';
          const checkOut = addDaysToDateStr(checkIn, nights);

          const calc = calculateBookingPrice({
            condo,
            checkIn,
            checkOut,
            numAdults: adults,
            numChildren: children,
            allExtras: sampleExtras,
          });

          // Invariant Check
          expect(calc.reservation_fee_amount + calc.remaining_balance_amount).toBe(calc.total_amount);
          expect(calc.total_amount).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('PBT-2: Invariant: Length-of-stay discount never inflates lodging cost (lodging_subtotal <= base + surcharges)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 1500 }),
        fc.integer({ min: 1, max: 30 }),
        (basePrice, nights) => {
          const condo: Condo = {
            ...boundaryCondo,
            base_price_per_night: basePrice,
            weekend_price_per_night: basePrice + 30,
          };

          const checkIn = '2026-11-01';
          const checkOut = addDaysToDateStr(checkIn, nights);

          const calc = calculateBookingPrice({
            condo,
            checkIn,
            checkOut,
            numAdults: 2,
            allExtras: sampleExtras,
          });

          const rawTotal = calc.base_lodging_total + calc.weekend_surcharge_total + calc.seasonal_surcharge_total;
          expect(calc.lodging_subtotal).toBeLessThanOrEqual(rawTotal);
          expect(calc.length_of_stay_discount).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('PBT-3: Invariant: calculateNights is strictly additive: calculateNights(A, C) == calculateNights(A, B) + calculateNights(B, C)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 15 }), // nights A -> B
        fc.integer({ min: 1, max: 15 }), // nights B -> C
        (nightsAB, nightsBC) => {
          const dateA = '2026-11-01';
          const dateB = addDaysToDateStr(dateA, nightsAB);
          const dateC = addDaysToDateStr(dateB, nightsBC);

          const nightsAC = calculateNights(dateA, dateC);
          const calculatedAB = calculateNights(dateA, dateB);
          const calculatedBC = calculateNights(dateB, dateC);

          expect(nightsAC).toBe(calculatedAB + calculatedBC);
          expect(nightsAC).toBe(nightsAB + nightsBC);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('PBT-4: Invariant: areDateRangesOverlapping is symmetric: overlap(R1, R2) == overlap(R2, R1)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // start1 offset
        fc.integer({ min: 1, max: 10 }), // duration1
        fc.integer({ min: 1, max: 10 }), // start2 offset
        fc.integer({ min: 1, max: 10 }), // duration2
        (offset1, dur1, offset2, dur2) => {
          const baseDate = '2026-11-01';
          const startA = addDaysToDateStr(baseDate, offset1);
          const endA = addDaysToDateStr(startA, dur1);
          const startB = addDaysToDateStr(baseDate, offset2);
          const endB = addDaysToDateStr(startB, dur2);

          const overlapAB = areDateRangesOverlapping(startA, endA, startB, endB);
          const overlapBA = areDateRangesOverlapping(startB, endB, startA, endA);

          expect(overlapAB).toBe(overlapBA);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('PBT-5: Invariant: Extras total monotonically increases with extra quantity', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // qty1
        fc.integer({ min: 1, max: 5 }), // qty delta
        (qty1, delta) => {
          const qty2 = qty1 + delta;
          const input1: PricingEngineInput = {
            condo: boundaryCondo,
            checkIn: '2026-11-01',
            checkOut: '2026-11-04',
            numAdults: 2,
            selectedExtras: [{ extra_id: 'ext-breakfast', quantity: qty1 }],
            allExtras: sampleExtras,
          };

          const input2: PricingEngineInput = {
            condo: boundaryCondo,
            checkIn: '2026-11-01',
            checkOut: '2026-11-04',
            numAdults: 2,
            selectedExtras: [{ extra_id: 'ext-breakfast', quantity: qty2 }],
            allExtras: sampleExtras,
          };

          const res1 = calculateBookingPrice(input1);
          const res2 = calculateBookingPrice(input2);

          expect(res2.extras_total).toBeGreaterThanOrEqual(res1.extras_total);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('PBT-6: Invariant: validateCapacity validity is strictly determined by adults >= 1 and sum <= max_guests', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }), // adults
        fc.integer({ min: 0, max: 10 }), // children
        fc.integer({ min: 1, max: 8 }),  // max guests
        (adults, children, maxGuests) => {
          const testCondoWithMax: Condo = {
            ...boundaryCondo,
            max_guests: maxGuests,
          };

          const res = validateCapacity(testCondoWithMax, adults, children);
          const expectedValid = adults >= 1 && adults + children <= maxGuests;

          expect(res.valid).toBe(expectedValid);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('PBT-7: Invariant: addDaysToDateStr is reversible: calculateNights(start, addDaysToDateStr(start, N)) === N', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 60 }),
        (days) => {
          const start = '2026-11-01';
          const end = addDaysToDateStr(start, days);
          const computed = calculateNights(start, end);
          expect(computed).toBe(days);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('PBT-8: Invariant: Nightly rates array length strictly matches calculateNights count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 25 }),
        (nights) => {
          const checkIn = '2026-11-01';
          const checkOut = addDaysToDateStr(checkIn, nights);

          const res = calculateBookingPrice({
            condo: boundaryCondo,
            checkIn,
            checkOut,
            numAdults: 2,
            allExtras: sampleExtras,
          });

          expect(res.nightly_rates.length).toBe(nights);
          expect(res.nights).toBe(nights);
        }
      ),
      { numRuns: 100 }
    );
  });
});
