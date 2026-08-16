/**
 * CondoPal Tier 1: Core Feature Coverage Test Suite
 * Exhaustive unit and functional test coverage for Date Math, Pricing Engine,
 * Capacity Validation, Add-on Extras Models, Downpayment Splits, and Mock Store.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseISODateToUTC,
  toISODateString,
  calculateNights,
  isWeekendNight,
  getNightlyDates,
  areDateRangesOverlapping,
  isDateWithinRange,
  validateDateRange,
  formatDateDisplay,
  formatDateRangeDisplay,
  getTodayUTC,
  addDaysToDateStr,
} from '../src/lib/dateUtils';
import {
  calculateBookingPrice,
  validateCapacity,
  getLengthOfStayDiscountPercent,
  type PricingEngineInput,
} from '../src/lib/pricingEngine';
import { inMemoryStore } from '../src/lib/supabaseMock';
import {
  SEED_CONDOS,
  SEED_EXTRAS,
  SEED_PAYMENT_METHODS,
  SEED_BOOKINGS,
} from '../src/lib/seedData';
import type { Condo, Extra, SeasonalRule } from '../src/types/booking';

describe('Tier 1: Feature Coverage', () => {
  beforeEach(() => {
    inMemoryStore.reset();
  });

  const testCondo: Condo = {
    id: 'test-condo-001',
    slug: 'azure-sky-penthouse',
    name: 'Azure Sky Penthouse',
    description: 'Ultra-luxury penthouse suite',
    location: 'Tower 1, Level 42',
    images: [{ url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688' }],
    max_guests: 6,
    bedrooms: 3,
    bathrooms: 3,
    base_price_per_night: 200,
    weekend_price_per_night: 260,
    cleaning_fee: 50,
    reservation_fee_rate: 0.20,
    security_deposit: 100,
    min_stay_nights: 2,
    max_stay_nights: 30,
    amenities: ['Private Pool', 'Starlink WiFi', 'Panoramic Ocean View'],
    house_rules: ['No smoking', 'Quiet hours after 10 PM'],
    check_in_time: '15:00',
    check_out_time: '11:00',
    status: 'active',
    is_active: true,
    sort_order: 1,
  };

  const testExtras: Extra[] = [
    {
      id: 'ext-01',
      name: 'Airport VIP Van Transfer',
      slug: 'airport-van',
      description: 'Private luxury van transfer',
      price: 60,
      price_type: 'per_stay',
      icon: 'Car',
      category: 'Transportation',
      max_quantity: 2,
      is_enabled: true,
      sort_order: 1,
    },
    {
      id: 'ext-02',
      name: 'Starlink High-Speed WiFi',
      slug: 'starlink-wifi',
      description: 'Dedicated satellite connection',
      price: 15,
      price_type: 'per_night',
      icon: 'Wifi',
      category: 'Connectivity',
      max_quantity: 1,
      is_enabled: true,
      sort_order: 2,
    },
    {
      id: 'ext-03',
      name: 'Infinity Pool & Spa Day Pass',
      slug: 'pool-pass',
      description: 'Unlimited access to resort spa',
      price: 25,
      price_type: 'per_guest',
      icon: 'Waves',
      category: 'Wellness',
      max_quantity: 10,
      is_enabled: true,
      sort_order: 3,
    },
    {
      id: 'ext-04',
      name: 'Champagne Breakfast Buffet',
      slug: 'champagne-breakfast',
      description: 'Daily gourmet breakfast buffet',
      price: 20,
      price_type: 'per_guest_per_night',
      icon: 'UtensilsCrossed',
      category: 'Dining',
      max_quantity: 10,
      is_enabled: true,
      sort_order: 4,
    },
  ];

  // ==========================================
  // 1. DATE MATH & UTILITIES (13 tests)
  // ==========================================

  it('F8-1: parseISODateToUTC correctly creates UTC midnight date without timezone skew', () => {
    const date = parseISODateToUTC('2026-10-15');
    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(9); // 0-indexed: October is 9
    expect(date.getUTCDate()).toBe(15);
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCSeconds()).toBe(0);
  });

  it('F8-2: toISODateString formats Date and ISO string accurately to YYYY-MM-DD', () => {
    const d = new Date(Date.UTC(2026, 11, 25));
    expect(toISODateString(d)).toBe('2026-12-25');
    expect(toISODateString('2026-05-01')).toBe('2026-05-01');
  });

  it('F8-3: calculateNights computes exact night count within single month', () => {
    expect(calculateNights('2026-09-10', '2026-09-15')).toBe(5);
    expect(calculateNights('2026-09-01', '2026-09-02')).toBe(1);
  });

  it('F8-4: calculateNights computes exact night count crossing month and year boundaries', () => {
    expect(calculateNights('2026-09-28', '2026-10-04')).toBe(6);
    expect(calculateNights('2026-12-28', '2027-01-04')).toBe(7);
  });

  it('F8-5: getNightlyDates returns correct ordered sequence of ISO date strings', () => {
    const dates = getNightlyDates('2026-09-10', '2026-09-14');
    expect(dates).toEqual([
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ]);
    expect(dates.length).toBe(4);
  });

  it('F8-6: isWeekendNight identifies Friday and Saturday nights as weekend rates', () => {
    // 2026-09-11 is Friday, 2026-09-12 is Saturday
    expect(isWeekendNight('2026-09-11')).toBe(true);
    expect(isWeekendNight('2026-09-12')).toBe(true);
  });

  it('F8-7: isWeekendNight identifies Sunday through Thursday as weekday rates', () => {
    // 2026-09-13 is Sunday, 2026-09-14 is Monday, 2026-09-17 is Thursday
    expect(isWeekendNight('2026-09-13')).toBe(false);
    expect(isWeekendNight('2026-09-14')).toBe(false);
    expect(isWeekendNight('2026-09-17')).toBe(false);
  });

  it('F8-8: addDaysToDateStr increments calendar dates properly including month rollovers', () => {
    expect(addDaysToDateStr('2026-09-28', 5)).toBe('2026-10-03');
    expect(addDaysToDateStr('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('F8-9: isDateWithinRange verifies inclusion in half-open interval [start, end)', () => {
    expect(isDateWithinRange('2026-10-10', '2026-10-10', '2026-10-15')).toBe(true);
    expect(isDateWithinRange('2026-10-14', '2026-10-10', '2026-10-15')).toBe(true);
    expect(isDateWithinRange('2026-10-15', '2026-10-10', '2026-10-15')).toBe(false); // Check-out day is not a stayed night
    expect(isDateWithinRange('2026-10-09', '2026-10-10', '2026-10-15')).toBe(false);
  });

  it('F8-10: areDateRangesOverlapping correctly flags overlapping date intervals', () => {
    // A: 10-15, B: 12-18 (Overlap: 12, 13, 14)
    expect(areDateRangesOverlapping('2026-10-10', '2026-10-15', '2026-10-12', '2026-10-18')).toBe(true);
    // B inside A
    expect(areDateRangesOverlapping('2026-10-10', '2026-10-20', '2026-10-12', '2026-10-15')).toBe(true);
  });

  it('F8-11: areDateRangesOverlapping allows clean back-to-back non-overlapping bookings', () => {
    // Check-out on 15th, next check-in on 15th -> No overlap
    expect(areDateRangesOverlapping('2026-10-10', '2026-10-15', '2026-10-15', '2026-10-20')).toBe(false);
    expect(areDateRangesOverlapping('2026-10-01', '2026-10-05', '2026-10-10', '2026-10-15')).toBe(false);
  });

  it('F8-12: formatDateDisplay formats dates into editorial styles', () => {
    expect(formatDateDisplay('2026-10-15', 'short')).toBe('Oct 15');
    expect(formatDateDisplay('2026-10-15', 'medium')).toBe('Oct 15, 2026');
    expect(formatDateDisplay('2026-10-15', 'weekday')).toBe('Thu, Oct 15');
    expect(formatDateDisplay('2026-10-15', 'long')).toBe('Thursday, October 15, 2026');
  });

  it('F8-13: formatDateRangeDisplay formats human-readable stay summaries with nights', () => {
    const summary = formatDateRangeDisplay('2026-10-15', '2026-10-19');
    expect(summary).toBe('Oct 15 — Oct 19, 2026 (4 nights)');
  });

  // ==========================================
  // 2. PRICING ENGINE CORE FORMULAS (12 tests)
  // ==========================================

  it('F7-1: calculateBookingPrice calculates pure weekday lodging accurately', () => {
    // 3 weekday nights: Mon 2026-09-07, Tue 2026-09-08, Wed 2026-09-09
    const input: PricingEngineInput = {
      condo: testCondo,
      checkIn: '2026-09-07',
      checkOut: '2026-09-10',
      numAdults: 2,
      numChildren: 0,
      allExtras: testExtras,
    };

    const res = calculateBookingPrice(input);

    expect(res.nights).toBe(3);
    // 3 nights * $200 = $600 base lodging
    expect(res.base_lodging_total).toBe(600);
    expect(res.weekend_surcharge_total).toBe(0);
    expect(res.seasonal_surcharge_total).toBe(0);
    expect(res.length_of_stay_discount).toBe(0); // < 7 nights has 0 discount
    expect(res.lodging_subtotal).toBe(600);
    expect(res.cleaning_fee).toBe(50);
    expect(res.security_deposit).toBe(100);
    expect(res.subtotal).toBe(650); // 600 + 50
    expect(res.total_amount).toBe(650);
    expect(res.reservation_fee_amount).toBe(130); // 20% of 650
    expect(res.remaining_balance_amount).toBe(520); // 650 - 130
  });

  it('F7-2: calculateBookingPrice applies weekend surcharges for Friday and Saturday nights', () => {
    // 3 nights: Thu Sep 10 (weekday: 200), Fri Sep 11 (weekend: 260), Sat Sep 12 (weekend: 260)
    const input: PricingEngineInput = {
      condo: testCondo,
      checkIn: '2026-09-10',
      checkOut: '2026-09-13',
      numAdults: 2,
      allExtras: testExtras,
    };

    const res = calculateBookingPrice(input);

    expect(res.nights).toBe(3);
    expect(res.base_lodging_total).toBe(600); // 3 * 200
    expect(res.weekend_surcharge_total).toBe(120); // 2 weekend nights * 60 diff
    expect(res.lodging_subtotal).toBe(720); // 200 + 260 + 260
    expect(res.nightly_rates[0].rate).toBe(200);
    expect(res.nightly_rates[1].rate).toBe(260);
    expect(res.nightly_rates[2].rate).toBe(260);
  });

  it('F7-3: calculateBookingPrice applies seasonal multipliers correctly', () => {
    const seasonalRules: SeasonalRule[] = [
      {
        name: 'Autumn Gold Gala',
        startDate: '2026-10-01',
        endDate: '2026-10-10',
        multiplier: 1.5, // +50%
      },
    ];

    // 2 weekday nights under season: Oct 05 (Mon), Oct 06 (Tue)
    const input: PricingEngineInput = {
      condo: testCondo,
      checkIn: '2026-10-05',
      checkOut: '2026-10-07',
      numAdults: 2,
      seasonalRules,
      allExtras: testExtras,
    };

    const res = calculateBookingPrice(input);

    expect(res.nights).toBe(2);
    // Base rate: 200 * 1.5 = 300 per night. Total = 600
    expect(res.nightly_rates[0].rate).toBe(300);
    expect(res.nightly_rates[1].rate).toBe(300);
    expect(res.seasonal_surcharge_total).toBe(200); // (300 - 200) * 2
    expect(res.lodging_subtotal).toBe(600);
  });

  it('F7-4: calculateBookingPrice calculates Extra Model 1: per_stay', () => {
    const input: PricingEngineInput = {
      condo: testCondo,
      checkIn: '2026-09-07',
      checkOut: '2026-09-10', // 3 nights
      numAdults: 2,
      selectedExtras: [{ extra_id: 'ext-01', quantity: 2 }], // Airport Van $60/stay * 2 = $120
      allExtras: testExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.extras_total).toBe(120);
    expect(res.itemized_extras[0].total_price).toBe(120);
    expect(res.itemized_extras[0].price_type).toBe('per_stay');
  });

  it('F7-5: calculateBookingPrice calculates Extra Model 2: per_night', () => {
    const input: PricingEngineInput = {
      condo: testCondo,
      checkIn: '2026-09-07',
      checkOut: '2026-09-10', // 3 nights
      numAdults: 2,
      selectedExtras: [{ extra_id: 'ext-02', quantity: 1 }], // Starlink $15/night * 3 nights = $45
      allExtras: testExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.extras_total).toBe(45);
    expect(res.itemized_extras[0].total_price).toBe(45);
    expect(res.itemized_extras[0].price_type).toBe('per_night');
  });

  it('F7-6: calculateBookingPrice calculates Extra Model 3: per_guest', () => {
    const input: PricingEngineInput = {
      condo: testCondo,
      checkIn: '2026-09-07',
      checkOut: '2026-09-10', // 3 nights
      numAdults: 2,
      numChildren: 2, // Total guests = 4
      selectedExtras: [{ extra_id: 'ext-03', quantity: 1 }], // Pool Pass $25/guest * 4 guests = $100
      allExtras: testExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.extras_total).toBe(100);
    expect(res.itemized_extras[0].total_price).toBe(100);
    expect(res.itemized_extras[0].price_type).toBe('per_guest');
  });

  it('F7-7: calculateBookingPrice calculates Extra Model 4: per_guest_per_night', () => {
    const input: PricingEngineInput = {
      condo: testCondo,
      checkIn: '2026-09-07',
      checkOut: '2026-09-10', // 3 nights
      numAdults: 2,
      numChildren: 1, // Total guests = 3
      selectedExtras: [{ extra_id: 'ext-04', quantity: 1 }], // Breakfast $20 * 3 guests * 3 nights = $180
      allExtras: testExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.extras_total).toBe(180);
    expect(res.itemized_extras[0].total_price).toBe(180);
    expect(res.itemized_extras[0].price_type).toBe('per_guest_per_night');
  });

  it('F7-8: getLengthOfStayDiscountPercent applies correct tier discount rates', () => {
    expect(getLengthOfStayDiscountPercent(2)).toBe(0.00);
    expect(getLengthOfStayDiscountPercent(6)).toBe(0.00);
    expect(getLengthOfStayDiscountPercent(7)).toBe(0.10);  // 10% weekly
    expect(getLengthOfStayDiscountPercent(13)).toBe(0.10);
    expect(getLengthOfStayDiscountPercent(14)).toBe(0.15); // 15% bi-weekly
    expect(getLengthOfStayDiscountPercent(29)).toBe(0.15);
    expect(getLengthOfStayDiscountPercent(30)).toBe(0.20); // 20% monthly
  });

  it('F7-9: calculateBookingPrice calculates weekly stay discount (10% on 7+ nights)', () => {
    // 7 weekday nights: 7 * $200 = $1400. 10% discount = $140. Lodging subtotal = $1260.
    const input: PricingEngineInput = {
      condo: testCondo,
      checkIn: '2026-11-02', // Monday
      checkOut: '2026-11-09', // Monday
      numAdults: 2,
      allExtras: testExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.nights).toBe(7);
    // 5 weekday nights @ 200 + 2 weekend nights (Fri, Sat) @ 260 = 1000 + 520 = 1520
    expect(res.length_of_stay_discount_percent).toBe(0.10);
    expect(res.length_of_stay_discount).toBe(Math.round(1520 * 0.10)); // 152
    expect(res.lodging_subtotal).toBe(1520 - 152); // 1368
  });

  it('F7-10: calculateBookingPrice calculates service charge and taxes properly', () => {
    const input: PricingEngineInput = {
      condo: testCondo,
      checkIn: '2026-09-07',
      checkOut: '2026-09-09', // 2 weekday nights @ $200 = $400
      numAdults: 2,
      allExtras: testExtras,
      serviceChargeRate: 0.10, // 10%
      taxRate: 0.12,          // 12%
    };

    const res = calculateBookingPrice(input);
    // Lodging: 400. Cleaning: 50. Extras: 0. Subtotal = 450.
    expect(res.subtotal).toBe(450);
    // Service charge: 450 * 0.10 = 45.
    expect(res.service_charge).toBe(45);
    // Taxable = 450 + 45 = 495. Tax = 495 * 0.12 = 59.4 -> round(59.4) = 59.
    expect(res.tax_amount).toBe(59);
    // Total = 450 + 45 + 59 = 554.
    expect(res.total_amount).toBe(554);
    // 20% downpayment = round(554 * 0.20) = 111.
    expect(res.reservation_fee_amount).toBe(111);
    // Balance = 554 - 111 = 443.
    expect(res.remaining_balance_amount).toBe(443);
    expect(res.reservation_fee_amount + res.remaining_balance_amount).toBe(res.total_amount);
  });

  it('F7-11: calculateBookingPrice with 0 nights returns 0 lodging and cleaning fee base', () => {
    const input: PricingEngineInput = {
      condo: testCondo,
      checkIn: '2026-09-07',
      checkOut: '2026-09-07', // 0 nights
      numAdults: 2,
      allExtras: testExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.nights).toBe(0);
    expect(res.base_lodging_total).toBe(0);
    expect(res.total_amount).toBe(testCondo.cleaning_fee);
  });

  // ==========================================
  // 3. CAPACITY & VALIDATION RULES (4 tests)
  // ==========================================

  it('F13-1: validateCapacity permits valid guest count within limits', () => {
    const res = validateCapacity(testCondo, 2, 2);
    expect(res.valid).toBe(true);
    expect(res.totalGuests).toBe(4);
    expect(res.maxGuests).toBe(6);
  });

  it('F13-2: validateCapacity rejects party with 0 adults', () => {
    const res = validateCapacity(testCondo, 0, 2);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/At least 1 adult guest is required/i);
  });

  it('F13-3: validateCapacity rejects party exceeding unit max capacity', () => {
    const res = validateCapacity(testCondo, 4, 3); // 7 guests > 6 max
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/exceeds maximum suite capacity/i);
  });

  it('F12-1: validateDateRange enforces minStayNights constraint', () => {
    // Condo min stay is 2 nights. Requesting 1 night.
    const res = validateDateRange('2026-10-10', '2026-10-11', 2, 30);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/Minimum stay duration/i);
  });

  // ==========================================
  // 4. MOCK STORE & SEED INTEGRITY (4 tests)
  // ==========================================

  it('F1-1: Mock store seeds active condos correctly', () => {
    const condos = inMemoryStore.getCondos();
    expect(condos.length).toBeGreaterThanOrEqual(3);
    condos.forEach((c) => {
      expect(c.status).toBe('active');
      expect(c.is_active).toBe(true);
      expect(c.base_price_per_night).toBeGreaterThan(0);
      expect(c.max_guests).toBeGreaterThanOrEqual(1);
    });
  });

  it('F1-2: Mock store seeds enabled extras correctly', () => {
    const extras = inMemoryStore.getExtras();
    expect(extras.length).toBeGreaterThanOrEqual(4);
    const priceTypes = new Set(extras.map((e) => e.price_type));
    expect(priceTypes.has('per_stay')).toBe(true);
    expect(priceTypes.has('per_night')).toBe(true);
    expect(priceTypes.has('per_guest')).toBe(true);
    expect(priceTypes.has('per_guest_per_night')).toBe(true);
  });

  it('F1-3: Mock store retrieves seeded payment methods', () => {
    const paymentMethods = inMemoryStore.getPaymentMethods();
    expect(paymentMethods.length).toBeGreaterThanOrEqual(3);
    const gcash = paymentMethods.find((p) => p.type === 'gcash');
    expect(gcash).toBeDefined();
    expect(gcash?.account_number).toBeTruthy();
  });

  it('F1-4: Mock store retrieves booking by booking_code and access_token', () => {
    const seeded = SEED_BOOKINGS[0];
    const retrieved = inMemoryStore.getBookingByCode(seeded.booking_code, seeded.access_token);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(seeded.id);
    expect(retrieved?.guest_name).toBe(seeded.guest_name);
  });
});
