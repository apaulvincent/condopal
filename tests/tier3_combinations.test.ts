/**
 * CondoPal Tier 3: Cross-Feature Combinations Test Suite
 * Combinatorial matrix testing crossing seasonal rates, weekend markups,
 * multi-model add-ons, length-of-stay discounts, taxes, service charges,
 * and downpayment balance splits.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateBookingPrice,
  type PricingEngineInput,
} from '../src/lib/pricingEngine';
import type { Condo, Extra, SeasonalRule } from '../src/types/booking';

describe('Tier 3: Cross-Feature Combinations', () => {
  const masterCondo: Condo = {
    id: 'condo-comb-001',
    slug: 'grand-regency-suite',
    name: 'Grand Regency Villa & Penthouse',
    description: 'Palatial multi-story luxury villa with private helipad and infinity pool',
    location: 'Exclusive Ridge Estate, Unit 01',
    images: [{ url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9' }],
    max_guests: 8,
    bedrooms: 4,
    bathrooms: 4,
    base_price_per_night: 300,
    weekend_price_per_night: 390, // +30% weekend rate
    cleaning_fee: 80,
    reservation_fee_rate: 0.30,   // 30% deposit
    security_deposit: 150,
    min_stay_nights: 2,
    max_stay_nights: 30,
    amenities: ['Private Chef Kitchen', 'Infinity Pool', 'Helipad Access', 'Dedicated Butler'],
    house_rules: ['No pets', 'No commercial filming without permit'],
    check_in_time: '15:00',
    check_out_time: '11:00',
    status: 'active',
    is_active: true,
    sort_order: 1,
  };

  const comprehensiveExtras: Extra[] = [
    {
      id: 'ex-chef',
      name: 'Private Executive Chef Dinner',
      slug: 'private-chef',
      description: '5-course bespoke degustation dinner',
      price: 250,
      price_type: 'per_stay',
      icon: 'ChefHat',
      category: 'Dining',
      max_quantity: 2,
      is_enabled: true,
      sort_order: 1,
    },
    {
      id: 'ex-yacht',
      name: 'Sunset Catamaran Yacht Charter',
      slug: 'yacht-charter',
      description: 'Private 3-hour sunset cruise',
      price: 100,
      price_type: 'per_guest',
      icon: 'Ship',
      category: 'Experiences',
      max_quantity: 8,
      is_enabled: true,
      sort_order: 2,
    },
    {
      id: 'ex-butler',
      name: 'Dedicated 24/7 Concierge Butler',
      slug: 'dedicated-butler',
      description: 'On-demand personal attendant',
      price: 60,
      price_type: 'per_night',
      icon: 'UserCheck',
      category: 'Service',
      max_quantity: 1,
      is_enabled: true,
      sort_order: 3,
    },
    {
      id: 'ex-breakfast',
      name: 'Champagne & Caviar Breakfast Buffet',
      slug: 'champagne-breakfast',
      description: 'Daily luxury morning feast',
      price: 35,
      price_type: 'per_guest_per_night',
      icon: 'Wine',
      category: 'Dining',
      max_quantity: 8,
      is_enabled: true,
      sort_order: 4,
    },
    {
      id: 'ex-disabled',
      name: 'Archived Helicopter Tour',
      slug: 'helicopter-tour',
      description: 'Service currently unavailable',
      price: 500,
      price_type: 'per_stay',
      icon: 'Plane',
      category: 'Experiences',
      max_quantity: 1,
      is_enabled: false, // Disabled
      sort_order: 5,
    },
  ];

  const peakHolidaySeason: SeasonalRule = {
    name: 'Christmas & New Year Gala',
    startDate: '2026-12-20',
    endDate: '2027-01-05',
    multiplier: 1.5, // +50% holiday surcharge
  };

  const springFestivalSeason: SeasonalRule = {
    name: 'Spring Lantern Festival',
    startDate: '2027-02-10',
    endDate: '2027-02-20',
    multiplier: 1.25, // +25%
  };

  // ==========================================
  // COMBINATIONS 1-18
  // ==========================================

  it('COMB-1: Peak holiday season + weekend rate + 4 multi-model extras + 7-night weekly discount + 30% downpayment', () => {
    // 7 nights: 2026-12-23 (Wed) to 2026-12-30 (Wed)
    // Nights: Dec 23(Wed), Dec 24(Thu), Dec 25(Fri - Weekend), Dec 26(Sat - Weekend), Dec 27(Sun), Dec 28(Mon), Dec 29(Tue)
    // All 7 nights fall in peak season (1.5x multiplier)
    // 5 weekdays: rate = round(300 * 1.5) = 450 per night -> 5 * 450 = 2250
    // 2 weekends: rate = round(390 * 1.5) = 585 per night -> 2 * 585 = 1170
    // Raw Lodging = 2250 + 1170 = 3420
    // Weekly stay discount (7 nights): 10% -> 342
    // Lodging Subtotal = 3420 - 342 = 3078

    // 4 Guests (3 adults + 1 child)
    // Extras:
    // 1. Chef: per_stay -> 250 * 1 = 250
    // 2. Yacht: per_guest -> 100 * 4 guests = 400
    // 3. Butler: per_night -> 60 * 7 nights = 420
    // 4. Breakfast: per_guest_per_night -> 35 * 4 guests * 7 nights = 980
    // Extras Total = 250 + 400 + 420 + 980 = 2050

    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2026-12-23',
      checkOut: '2026-12-30',
      numAdults: 3,
      numChildren: 1,
      selectedExtras: [
        { extra_id: 'ex-chef', quantity: 1 },
        { extra_id: 'ex-yacht', quantity: 1 },
        { extra_id: 'ex-butler', quantity: 1 },
        { extra_id: 'ex-breakfast', quantity: 1 },
      ],
      allExtras: comprehensiveExtras,
      seasonalRules: [peakHolidaySeason],
    };

    const res = calculateBookingPrice(input);

    expect(res.nights).toBe(7);
    expect(res.base_lodging_total).toBe(2100); // 7 * 300
    expect(res.weekend_surcharge_total).toBe(180); // 2 * 90
    expect(res.seasonal_surcharge_total).toBe(1140); // 5 * 150 + 2 * 195
    expect(res.length_of_stay_discount).toBe(342);
    expect(res.lodging_subtotal).toBe(3078);
    expect(res.extras_total).toBe(2050);
    expect(res.cleaning_fee).toBe(80);

    // Subtotal = 3078 + 80 + 2050 = 5208
    expect(res.subtotal).toBe(5208);
    expect(res.total_amount).toBe(5208);

    // Downpayment: 30% of 5208 = 1562.4 -> round(1562.4) = 1562
    expect(res.reservation_fee_amount).toBe(1562);
    expect(res.remaining_balance_amount).toBe(5208 - 1562); // 3646
    expect(res.reservation_fee_amount + res.remaining_balance_amount).toBe(res.total_amount);
  });

  it('COMB-2: Year-boundary transition stay (Dec 28 to Jan 04: 7 nights) across peak season', () => {
    // Spans 2026 into 2027
    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2026-12-28',
      checkOut: '2027-01-04',
      numAdults: 2,
      allExtras: comprehensiveExtras,
      seasonalRules: [peakHolidaySeason],
    };

    const res = calculateBookingPrice(input);
    expect(res.nights).toBe(7);
    expect(res.nightly_rates[0].date).toBe('2026-12-28');
    expect(res.nightly_rates[6].date).toBe('2027-01-03');
    expect(res.length_of_stay_discount_percent).toBe(0.10);
    expect(res.lodging_subtotal).toBeGreaterThan(0);
  });

  it('COMB-3: Bi-weekly residence (14 nights) with 15% discount + security deposit + 6 guests', () => {
    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2026-11-01',
      checkOut: '2026-11-15', // 14 nights
      numAdults: 4,
      numChildren: 2, // 6 guests
      selectedExtras: [{ extra_id: 'ex-yacht', quantity: 1 }], // Yacht per_guest: 100 * 6 = 600
      allExtras: comprehensiveExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.nights).toBe(14);
    expect(res.length_of_stay_discount_percent).toBe(0.15); // 15% bi-weekly
    expect(res.extras_total).toBe(600);
    expect(res.security_deposit).toBe(150);
  });

  it('COMB-4: Monthly extended stay (30 nights) with 20% discount + multi-night add-ons', () => {
    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2026-10-01',
      checkOut: '2026-10-31', // 30 nights
      numAdults: 2,
      selectedExtras: [
        { extra_id: 'ex-butler', quantity: 1 }, // 60/night * 30 = 1800
        { extra_id: 'ex-chef', quantity: 2 },   // 250/stay * 2 = 500
      ],
      allExtras: comprehensiveExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.nights).toBe(30);
    expect(res.length_of_stay_discount_percent).toBe(0.20); // 20% monthly
    expect(res.extras_total).toBe(1800 + 500); // 2300
  });

  it('COMB-5: Partial seasonal rule overlap (3 days under season, 2 days regular rate)', () => {
    // Seasonal window: 2026-10-10 to 2026-10-13 (covers Oct 10, Oct 11, Oct 12 nights under half-open [start, end))
    const partialSeason: SeasonalRule = {
      name: 'Autumn Special',
      startDate: '2026-10-10',
      endDate: '2026-10-13',
      multiplier: 1.30,
    };

    // Stay: Oct 09 to Oct 14 (5 nights: Oct 09, 10, 11, 12, 13)
    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2026-10-09',
      checkOut: '2026-10-14',
      numAdults: 2,
      seasonalRules: [partialSeason],
      allExtras: comprehensiveExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.nights).toBe(5);
    // Oct 09 (Fri): regular weekend (no season) -> rate 390
    // Oct 10 (Sat): weekend + season (1.3) -> 390 * 1.3 = 507
    // Oct 11 (Sun): weekday + season (1.3) -> 300 * 1.3 = 390
    // Oct 12 (Mon): weekday + season (1.3) -> 300 * 1.3 = 390
    // Oct 13 (Tue): regular weekday (no season) -> rate 300
    expect(res.nightly_rates[0].rate).toBe(390);
    expect(res.nightly_rates[1].rate).toBe(507);
    expect(res.nightly_rates[2].rate).toBe(390);
    expect(res.nightly_rates[3].rate).toBe(390);
    expect(res.nightly_rates[4].rate).toBe(300);
  });

  it('COMB-6: Silently ignores disabled extras selected by user without corrupting total', () => {
    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2026-10-05',
      checkOut: '2026-10-08', // 3 nights
      numAdults: 2,
      selectedExtras: [
        { extra_id: 'ex-disabled', quantity: 1 }, // Disabled $500 extra
        { extra_id: 'ex-chef', quantity: 1 },     // Enabled $250 extra
      ],
      allExtras: comprehensiveExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.extras_total).toBe(250);
    expect(res.itemized_extras.length).toBe(1);
    expect(res.itemized_extras[0].extra_id).toBe('ex-chef');
  });

  it('COMB-7: Custom promotional discount takes precedence when higher than length-of-stay discount', () => {
    // 3 nights normally gets 0% length-of-stay discount. VIP promo code provides 25%.
    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2026-10-05',
      checkOut: '2026-10-08',
      numAdults: 2,
      customDiscountPercent: 0.25, // 25% promo discount
      allExtras: comprehensiveExtras,
    };

    const res = calculateBookingPrice(input);
    // 3 weekday nights @ 300 = 900. 25% of 900 = 225 discount.
    expect(res.length_of_stay_discount_percent).toBe(0.25);
    expect(res.length_of_stay_discount).toBe(225);
    expect(res.lodging_subtotal).toBe(675);
  });

  it('COMB-8: Taxes and service charge calculated over combined lodging and extras', () => {
    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2026-10-05',
      checkOut: '2026-10-07', // 2 weekday nights @ 300 = 600
      numAdults: 2,
      selectedExtras: [{ extra_id: 'ex-chef', quantity: 1 }], // 250
      allExtras: comprehensiveExtras,
      serviceChargeRate: 0.10, // 10%
      taxRate: 0.12,          // 12%
    };

    const res = calculateBookingPrice(input);
    // Lodging: 600. Cleaning: 80. Extras: 250. Subtotal = 930.
    expect(res.subtotal).toBe(930);
    // Service charge = round(930 * 0.10) = 93.
    expect(res.service_charge).toBe(93);
    // Tax = round((930 + 93) * 0.12) = round(1023 * 0.12) = round(122.76) = 123.
    expect(res.tax_amount).toBe(123);
    // Total = 930 + 93 + 123 = 1146.
    expect(res.total_amount).toBe(1146);
  });

  it('COMB-9: Maximum party capacity (8 guests: 4 adults + 4 children) with all 4 extras models', () => {
    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2026-10-05',
      checkOut: '2026-10-07', // 2 nights
      numAdults: 4,
      numChildren: 4, // 8 guests
      selectedExtras: [
        { extra_id: 'ex-chef', quantity: 1 },      // 250 * 1 = 250 (per_stay)
        { extra_id: 'ex-yacht', quantity: 1 },     // 100 * 8 guests = 800 (per_guest)
        { extra_id: 'ex-butler', quantity: 1 },    // 60 * 2 nights = 120 (per_night)
        { extra_id: 'ex-breakfast', quantity: 1 }, // 35 * 8 guests * 2 nights = 560 (per_guest_per_night)
      ],
      allExtras: comprehensiveExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.extras_total).toBe(250 + 800 + 120 + 560); // 1730
    expect(res.itemized_extras.length).toBe(4);
  });

  it('COMB-10: 2-night weekend stay during low-season with 0 cleaning fee unit', () => {
    const zeroCleanCondo: Condo = {
      ...masterCondo,
      cleaning_fee: 0,
    };

    const input: PricingEngineInput = {
      condo: zeroCleanCondo,
      checkIn: '2026-10-09', // Friday
      checkOut: '2026-10-11', // Sunday (Fri & Sat nights: 2 weekend nights)
      numAdults: 2,
      allExtras: comprehensiveExtras,
    };

    const res = calculateBookingPrice(input);
    // 2 nights * $390 = $780
    expect(res.nights).toBe(2);
    expect(res.lodging_subtotal).toBe(780);
    expect(res.cleaning_fee).toBe(0);
    expect(res.total_amount).toBe(780);
  });

  it('COMB-11: Mid-week booking crossing month boundary with 1 adult + per_stay transfer', () => {
    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2026-10-30',
      checkOut: '2026-11-03', // 4 nights: Oct 30(Fri), Oct 31(Sat), Nov 1(Sun), Nov 2(Mon)
      numAdults: 1,
      selectedExtras: [{ extra_id: 'ex-chef', quantity: 1 }],
      allExtras: comprehensiveExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.nights).toBe(4);
    // 2 weekends @ 390 + 2 weekdays @ 300 = 780 + 600 = 1380
    expect(res.lodging_subtotal).toBe(1380);
    expect(res.extras_total).toBe(250);
  });

  it('COMB-12: All 4 extra types combined with seasonal rate under 0% tax / 0% service charge', () => {
    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2026-12-24',
      checkOut: '2026-12-26', // 2 nights (Thu, Fri) in peak season (1.5x)
      numAdults: 2,
      numChildren: 0,
      selectedExtras: [
        { extra_id: 'ex-chef', quantity: 1 },      // 250
        { extra_id: 'ex-yacht', quantity: 1 },     // 100 * 2 = 200
        { extra_id: 'ex-butler', quantity: 1 },    // 60 * 2 = 120
        { extra_id: 'ex-breakfast', quantity: 1 }, // 35 * 2 * 2 = 140
      ],
      allExtras: comprehensiveExtras,
      seasonalRules: [peakHolidaySeason],
      taxRate: 0,
      serviceChargeRate: 0,
    };

    const res = calculateBookingPrice(input);
    // Thu: 300 * 1.5 = 450. Fri: 390 * 1.5 = 585. Lodging = 1035.
    expect(res.lodging_subtotal).toBe(1035);
    expect(res.extras_total).toBe(250 + 200 + 120 + 140); // 710
    expect(res.cleaning_fee).toBe(80);
    expect(res.total_amount).toBe(1035 + 710 + 80); // 1825
    expect(res.service_charge).toBe(0);
    expect(res.tax_amount).toBe(0);
  });

  it('COMB-13: Minimum adults (1) and maximum children (7) totaling 8 guests with per_guest passes', () => {
    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2026-10-05',
      checkOut: '2026-10-08', // 3 nights
      numAdults: 1,
      numChildren: 7, // 8 guests
      selectedExtras: [{ extra_id: 'ex-yacht', quantity: 1 }], // 100 * 8 = 800
      allExtras: comprehensiveExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.extras_total).toBe(800);
    expect(res.itemized_extras[0].total_price).toBe(800);
  });

  it('COMB-14: Stay with 2 full consecutive weekends (10 nights: 4 weekend nights, 6 weekdays) under seasonal rate', () => {
    // 10 nights from Friday Nov 06 to Monday Nov 16
    // Weekend nights: Nov 06(Fri), Nov 07(Sat), Nov 13(Fri), Nov 14(Sat) = 4 weekend nights
    // Weekday nights: Nov 08, 09, 10, 11, 12, 15 = 6 weekday nights
    const novSeason: SeasonalRule = {
      name: 'November Retreat',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      multiplier: 1.10, // +10%
    };

    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2026-11-06',
      checkOut: '2026-11-16',
      numAdults: 2,
      seasonalRules: [novSeason],
      allExtras: comprehensiveExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.nights).toBe(10);
    // 6 weekdays: round(300 * 1.10) = 330 * 6 = 1980
    // 4 weekends: round(390 * 1.10) = 429 * 4 = 1716
    // Raw total = 1980 + 1716 = 3696
    // 10 nights -> 10% stay discount = 370
    // Lodging subtotal = 3696 - 370 = 3326
    expect(res.length_of_stay_discount_percent).toBe(0.10);
    expect(res.lodging_subtotal).toBe(3326);
  });

  it('COMB-15: Custom tax rate (12%) and service charge (10%) and 25% downpayment with accurate rounding', () => {
    const input: PricingEngineInput = {
      condo: { ...masterCondo, reservation_fee_rate: 0.25 },
      checkIn: '2026-10-05',
      checkOut: '2026-10-07', // 2 weekday nights @ 300 = 600
      numAdults: 2,
      allExtras: comprehensiveExtras,
      serviceChargeRate: 0.10,
      taxRate: 0.12,
    };

    const res = calculateBookingPrice(input);
    // Lodging: 600. Cleaning: 80. Subtotal: 680.
    // Service charge = round(680 * 0.10) = 68.
    // Tax = round((680 + 68) * 0.12) = round(748 * 0.12) = round(89.76) = 90.
    // Total = 680 + 68 + 90 = 838.
    expect(res.total_amount).toBe(838);
    // Reservation fee = round(838 * 0.25) = 210 (209.5 -> 210)
    expect(res.reservation_fee_amount).toBe(210);
    expect(res.remaining_balance_amount).toBe(838 - 210); // 628
    expect(res.reservation_fee_amount + res.remaining_balance_amount).toBe(res.total_amount);
  });

  it('COMB-16: Extra quantity exceeding max_quantity alongside normal extras', () => {
    // ex-butler max_quantity = 1. Requesting 5.
    // ex-chef max_quantity = 2. Requesting 2.
    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2026-10-05',
      checkOut: '2026-10-08', // 3 nights
      numAdults: 2,
      selectedExtras: [
        { extra_id: 'ex-butler', quantity: 5 }, // capped at 1 -> 60 * 3 = 180
        { extra_id: 'ex-chef', quantity: 2 },   // 250 * 2 = 500
      ],
      allExtras: comprehensiveExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.extras_total).toBe(180 + 500); // 680
    const butler = res.itemized_extras.find((e) => e.extra_id === 'ex-butler');
    expect(butler?.quantity).toBe(1);
  });

  it('COMB-17: Multiple non-overlapping seasonal rules with distinct multipliers', () => {
    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2027-02-12',
      checkOut: '2027-02-15', // 3 nights in Spring Festival (1.25x)
      numAdults: 2,
      seasonalRules: [peakHolidaySeason, springFestivalSeason],
      allExtras: comprehensiveExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.nights).toBe(3);
    // Feb 12 (Fri: weekend): 390 * 1.25 = 488 (487.5 -> 488)
    // Feb 13 (Sat: weekend): 390 * 1.25 = 488
    // Feb 14 (Sun: weekday): 300 * 1.25 = 375
    expect(res.nightly_rates[0].rate).toBe(488);
    expect(res.nightly_rates[1].rate).toBe(488);
    expect(res.nightly_rates[2].rate).toBe(375);
  });

  it('COMB-18: Length-of-stay discount preserves correct itemized calculation with 0 extras', () => {
    const input: PricingEngineInput = {
      condo: masterCondo,
      checkIn: '2026-11-02',
      checkOut: '2026-11-16', // 14 nights -> 15% discount
      numAdults: 2,
      selectedExtras: [],
      allExtras: comprehensiveExtras,
    };

    const res = calculateBookingPrice(input);
    expect(res.nights).toBe(14);
    expect(res.extras_total).toBe(0);
    expect(res.itemized_extras.length).toBe(0);
    expect(res.length_of_stay_discount_percent).toBe(0.15);
    expect(res.lodging_subtotal).toBe(res.base_lodging_total + res.weekend_surcharge_total - res.length_of_stay_discount);
  });
});
