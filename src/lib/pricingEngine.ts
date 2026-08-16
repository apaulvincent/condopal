import type {
  Condo,
  Extra,
  SelectedExtra,
  ItemizedExtra,
  NightlyRate,
  PriceBreakdown,
  SeasonalRule,
} from '../types/booking';
import {
  calculateNights,
  getNightlyDates,
  isWeekendNight,
  isDateWithinRange,
} from './dateUtils';

export interface PricingEngineInput {
  condo: Condo;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  numAdults: number;
  numChildren?: number;
  selectedExtras?: SelectedExtra[];
  allExtras?: Extra[];
  seasonalRules?: SeasonalRule[];
  customDiscountPercent?: number;
  taxRate?: number;
  serviceChargeRate?: number;
}

export interface CapacityValidationResult {
  valid: boolean;
  error?: string;
  totalGuests: number;
  maxGuests: number;
}

/**
 * Validates whether guest headcount conforms to condo capacity rules.
 */
export function validateCapacity(
  condo: Condo,
  numAdults: number,
  numChildren: number = 0
): CapacityValidationResult {
  if (numAdults < 1) {
    return {
      valid: false,
      error: 'At least 1 adult guest is required.',
      totalGuests: numChildren,
      maxGuests: condo.max_guests,
    };
  }

  const totalGuests = numAdults + (numChildren || 0);

  if (totalGuests > condo.max_guests) {
    return {
      valid: false,
      error: `Selected party size (${totalGuests} guests) exceeds maximum suite capacity (${condo.max_guests} guests).`,
      totalGuests,
      maxGuests: condo.max_guests,
    };
  }

  return {
    valid: true,
    totalGuests,
    maxGuests: condo.max_guests,
  };
}

/**
 * Calculates length-of-stay discount percentage based on stay duration.
 */
export function getLengthOfStayDiscountPercent(nights: number): number {
  if (nights >= 30) return 0.20; // 20% for monthly residence
  if (nights >= 14) return 0.15; // 15% for bi-weekly stays
  if (nights >= 7) return 0.10;  // 10% for weekly stays
  return 0.00;
}

/**
 * Pure functional deterministic pricing calculation engine.
 */
export function calculateBookingPrice(input: PricingEngineInput): PriceBreakdown {
  const {
    condo,
    checkIn,
    checkOut,
    numAdults,
    numChildren = 0,
    selectedExtras = [],
    allExtras = [],
    seasonalRules = [],
    customDiscountPercent = 0,
    taxRate = 0,
    serviceChargeRate = 0,
  } = input;

  const nights = calculateNights(checkIn, checkOut);
  const totalGuests = Math.max(1, numAdults + numChildren);

  if (nights <= 0) {
    return {
      nights: 0,
      base_lodging_total: 0,
      weekend_surcharge_total: 0,
      seasonal_surcharge_total: 0,
      length_of_stay_discount: 0,
      length_of_stay_discount_percent: 0,
      lodging_subtotal: 0,
      cleaning_fee: condo.cleaning_fee || 0,
      security_deposit: condo.security_deposit || 0,
      extras_total: 0,
      itemized_extras: [],
      subtotal: condo.cleaning_fee || 0,
      service_charge: 0,
      tax_amount: 0,
      total_amount: condo.cleaning_fee || 0,
      reservation_fee_amount: 0,
      remaining_balance_amount: 0,
      nightly_rates: [],
    };
  }

  const nightlyDates = getNightlyDates(checkIn, checkOut);
  const nightlyRates: NightlyRate[] = [];

  let baseLodgingTotal = 0;
  let weekendSurchargeTotal = 0;
  let seasonalSurchargeTotal = 0;

  const basePrice = condo.base_price_per_night;
  const weekendPrice = condo.weekend_price_per_night || basePrice;
  const weekendDiff = Math.max(0, weekendPrice - basePrice);

  for (const dateStr of nightlyDates) {
    const isWeekend = isWeekendNight(dateStr);
    const regularRate = isWeekend ? weekendPrice : basePrice;

    // Check seasonal multipliers
    let activeMultiplier = 1.0;
    let activeSeasonName: string | undefined;

    for (const rule of seasonalRules) {
      if (isDateWithinRange(dateStr, rule.startDate, rule.endDate)) {
        activeMultiplier = rule.multiplier;
        activeSeasonName = rule.name;
        break;
      }
    }

    const calculatedNightRate = Math.round(regularRate * activeMultiplier);
    
    // Accumulate components
    baseLodgingTotal += basePrice;
    if (isWeekend) {
      weekendSurchargeTotal += weekendDiff;
    }
    if (activeMultiplier !== 1.0) {
      const regularNightTotal = isWeekend ? weekendPrice : basePrice;
      const seasonalDiff = Math.round(regularNightTotal * (activeMultiplier - 1.0));
      seasonalSurchargeTotal += seasonalDiff;
    }

    nightlyRates.push({
      date: dateStr,
      rate: calculatedNightRate,
      is_weekend: isWeekend,
      seasonal_multiplier: activeMultiplier !== 1.0 ? activeMultiplier : undefined,
      season_name: activeSeasonName,
    });
  }

  const rawLodgingTotal = nightlyRates.reduce((sum, item) => sum + item.rate, 0);

  // Length of stay discount
  const lengthOfStayDiscountPercent = Math.max(
    getLengthOfStayDiscountPercent(nights),
    customDiscountPercent
  );
  const lengthOfStayDiscount = Math.round(rawLodgingTotal * lengthOfStayDiscountPercent);
  const lodgingSubtotal = rawLodgingTotal - lengthOfStayDiscount;

  // Process Itemized Extras
  const itemizedExtras: ItemizedExtra[] = [];
  let extrasTotal = 0;

  const extrasLookup = new Map<string, Extra>();
  allExtras.forEach((e) => extrasLookup.set(e.id, e));

  for (const item of selectedExtras) {
    const extraDef = extrasLookup.get(item.extra_id);
    if (!extraDef || !extraDef.is_enabled || item.quantity <= 0) {
      continue;
    }

    const qty = Math.min(item.quantity, extraDef.max_quantity || 99);
    let itemTotal = 0;

    switch (extraDef.price_type) {
      case 'per_stay':
        itemTotal = extraDef.price * qty;
        break;
      case 'per_night':
        itemTotal = extraDef.price * qty * nights;
        break;
      case 'per_guest':
        itemTotal = extraDef.price * qty * totalGuests;
        break;
      case 'per_guest_per_night':
        itemTotal = extraDef.price * qty * totalGuests * nights;
        break;
    }

    extrasTotal += itemTotal;
    itemizedExtras.push({
      extra_id: extraDef.id,
      name: extraDef.name,
      slug: extraDef.slug,
      quantity: qty,
      unit_price: extraDef.price,
      price_type: extraDef.price_type,
      total_price: itemTotal,
    });
  }

  const cleaningFee = condo.cleaning_fee || 0;
  const securityDeposit = condo.security_deposit || 0;

  const subtotal = lodgingSubtotal + cleaningFee + extrasTotal;
  const serviceCharge = Math.round(subtotal * serviceChargeRate);
  const taxAmount = Math.round((subtotal + serviceCharge) * taxRate);
  const totalAmount = subtotal + serviceCharge + taxAmount;

  // Reservation Fee (Downpayment) calculation
  const reservationRate = condo.reservation_fee_rate || 0.20;
  const reservationFeeAmount = Math.round(totalAmount * reservationRate);
  const remainingBalanceAmount = totalAmount - reservationFeeAmount;

  return {
    nights,
    base_lodging_total: baseLodgingTotal,
    weekend_surcharge_total: weekendSurchargeTotal,
    seasonal_surcharge_total: seasonalSurchargeTotal,
    length_of_stay_discount: lengthOfStayDiscount,
    length_of_stay_discount_percent: lengthOfStayDiscountPercent,
    lodging_subtotal: lodgingSubtotal,
    cleaning_fee: cleaningFee,
    security_deposit: securityDeposit,
    extras_total: extrasTotal,
    itemized_extras: itemizedExtras,
    subtotal,
    service_charge: serviceCharge,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    reservation_fee_amount: reservationFeeAmount,
    remaining_balance_amount: remainingBalanceAmount,
    nightly_rates: nightlyRates,
  };
}
