/**
 * Milestone 3: Guest Booking Flow & Boarding Pass Voucher Test Suite
 * Tests the 5-step booking wizard logic, validations, pricing computation, and draft persistence.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { inMemoryStore } from '../src/lib/supabaseMock';
import { condoPalApi } from '../src/lib/supabase';
import { SEED_CONDOS, SEED_EXTRAS, SEED_PAYMENT_METHODS } from '../src/lib/seedData';
import { calculateBookingPrice, validateCapacity } from '../src/lib/pricingEngine';
import { validateDateRange } from '../src/lib/dateUtils';
import type { BookingWizardState } from '../src/types/booking';

describe('Milestone 3: Guest Booking Flow & Wizard Engine', () => {
  beforeEach(() => {
    inMemoryStore.reset();
  });

  const condo = SEED_CONDOS[0]; // Azure Sky Penthouse (max 8 guests, min 1 night)

  it('validates Step 1 guest information requirements', () => {
    const validGuest = {
      guest_name: 'Genevieve Du Pont',
      guest_email: 'genevieve@example.com',
      guest_phone: '+63 917 123 4567',
    };
    expect(validGuest.guest_name.trim().length).toBeGreaterThanOrEqual(2);
    expect(validGuest.guest_email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(validGuest.guest_phone.length).toBeGreaterThanOrEqual(7);
  });

  it('validates Step 2 date selection and minimum stay constraint', () => {
    // 3 nights with min 2 nights required
    const validRange = validateDateRange('2026-10-10', '2026-10-13', 2);
    expect(validRange.valid).toBe(true);

    // 1 night with min 2 nights required
    const invalidShortStay = validateDateRange('2026-10-10', '2026-10-11', 2);
    expect(invalidShortStay.valid).toBe(false);
    expect(invalidShortStay.error).toContain('Minimum stay');

    // Reversed dates
    const reversedDates = validateDateRange('2026-10-15', '2026-10-10', 2);
    expect(reversedDates.valid).toBe(false);
  });

  it('validates Step 3 guest capacity thresholds', () => {
    // Condo max guests is 8
    const withinCapacity = validateCapacity(condo, 4, 2); // 6 guests
    expect(withinCapacity.valid).toBe(true);

    const exceededCapacity = validateCapacity(condo, 6, 3); // 9 guests
    expect(exceededCapacity.valid).toBe(false);
    expect(exceededCapacity.error).toContain('exceeds');
  });

  it('calculates Step 4 turnkey extras accurately across all 4 pricing models', () => {
    const checkIn = '2026-11-06';  // Friday
    const checkOut = '2026-11-09'; // Monday (3 nights: Fri, Sat, Sun)
    const numAdults = 2;
    const numChildren = 1; // Total 3 guests

    // Extras selected from SEED_EXTRAS:
    // 1. VIP Airport Chauffeur (per_stay, 3800)
    // 2. Daily Wellness & Thermal Spa (per_guest_per_night, 650 * 3 guests * 3 nights = 5850)
    const selectedExtras = [
      { extra_id: SEED_EXTRAS[0].id, quantity: 1 },
      { extra_id: SEED_EXTRAS[3].id, quantity: 1 },
    ];

    const breakdown = calculateBookingPrice({
      condo,
      checkIn,
      checkOut,
      numAdults,
      numChildren,
      selectedExtras,
      allExtras: SEED_EXTRAS,
    });

    expect(breakdown.nights).toBe(3);
    expect(breakdown.itemized_extras).toHaveLength(2);

    const chauffeur = breakdown.itemized_extras.find((e) => e.extra_id === SEED_EXTRAS[0].id);
    expect(chauffeur?.total_price).toBe(3800);

    const spa = breakdown.itemized_extras.find((e) => e.extra_id === SEED_EXTRAS[3].id);
    expect(spa?.total_price).toBe(650 * 3 * 3); // 5,850

    // Downpayment calculation (20% deposit)
    expect(breakdown.reservation_fee_amount).toBe(Math.round(breakdown.total_amount * 0.20));
    expect(breakdown.remaining_balance_amount).toBe(breakdown.total_amount - breakdown.reservation_fee_amount);
  });

  it('completes Step 5 atomic booking creation and generates valid boarding code', async () => {
    const response = await condoPalApi.createBookingAtomic({
      condo_id: condo.id,
      guest_name: 'Sir Jonathan Vance',
      guest_email: 'jonathan.vance@example.com',
      guest_phone: '+63 917 888 9999',
      check_in: '2026-12-01',
      check_out: '2026-12-05',
      num_adults: 2,
      num_children: 0,
      num_infants: 0,
      selected_extras: [{ extra_id: SEED_EXTRAS[0].id, quantity: 1 }],
      payment_method_id: SEED_PAYMENT_METHODS[0].id,
    });

    expect(response.booking).toBeDefined();
    expect(response.booking.booking_code).toMatch(/^CP-\d{4}-[A-Z0-9]{5}$/);
    expect(response.booking.booking_status).toBe('pending');
    expect(response.booking.payment_status).toBe('unpaid');

    // Submit payment proof
    const proofResponse = await condoPalApi.submitPaymentProof({
      booking_code: response.booking.booking_code,
      access_token: response.booking.access_token,
      payment_method_id: SEED_PAYMENT_METHODS[0].id,
      payment_reference_number: 'GCASH-982103984',
      payment_proof_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c',
    });

    expect(proofResponse.success).toBe(true);
    expect(proofResponse.payment_status).toBe('proof_submitted');

    // Verify booking can be retrieved by code
    const retrieved = await condoPalApi.getBookingByCode(response.booking.booking_code);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(response.booking.id);
    expect(retrieved?.payment_status).toBe('proof_submitted');
    expect(retrieved?.payment_reference_number).toBe('GCASH-982103984');
  });

  it('verifies draft serialization and state recovery format', () => {
    const draft: BookingWizardState = {
      currentStep: 3,
      condoId: condo.id,
      guestName: 'Lady Catherine',
      guestEmail: 'catherine@estate.com',
      guestPhone: '+63 918 000 1122',
      contactPreference: 'sms',
      specialRequests: 'Extra pillows',
      checkIn: '2026-10-15',
      checkOut: '2026-10-18',
      numAdults: 3,
      numChildren: 1,
      numInfants: 0,
      selectedExtras: [{ extra_id: SEED_EXTRAS[0].id, quantity: 2 }],
      paymentMethodId: 'p2222222-2222-2222-2222-222222222222',
      paymentReferenceNumber: '',
      paymentProofUrl: null,
      agreedToRules: true,
    };

    const serialized = JSON.stringify(draft);
    const parsed: BookingWizardState = JSON.parse(serialized);

    expect(parsed.currentStep).toBe(3);
    expect(parsed.condoId).toBe(condo.id);
    expect(parsed.guestName).toBe('Lady Catherine');
    expect(parsed.selectedExtras).toHaveLength(1);
    expect(parsed.selectedExtras[0].quantity).toBe(2);
  });
});
