/**
 * CondoPal Tier 4: Real-World Workloads & Concurrency Test Suite
 * End-to-end lifecycles, concurrent booking race condition prevention,
 * admin verification/rejection flows, and date blocker calendar checks.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { inMemoryStore } from '../src/lib/supabaseMock';
import type { BookingStatus, PaymentStatus } from '../src/types/booking';

describe('Tier 4: Real-World Workloads & Concurrency', () => {
  beforeEach(() => {
    inMemoryStore.reset();
  });

  // ==========================================
  // SCENARIO 1: CONCURRENT RACE CONDITION (10 GUESTS, 1 SUITE)
  // ==========================================
  it('WORKLOAD-1: Prevents double-booking race condition when 10 guests concurrently request overlapping dates', async () => {
    const condos = inMemoryStore.getCondos();
    const targetCondo = condos[0]; // Azure Sky Penthouse
    const checkIn = '2026-12-10';
    const checkOut = '2026-12-15';

    // 10 concurrent booking requests fired simultaneously via Promise.allSettled
    const bookingPromises = Array.from({ length: 10 }).map((_, idx) =>
      inMemoryStore.createBookingAtomic({
        condo_id: targetCondo.id,
        guest_name: `Concurrent Guest ${idx + 1}`,
        guest_email: `guest${idx + 1}@luxury-travel.com`,
        guest_phone: `+1-555-010${idx}`,
        check_in: checkIn,
        check_out: checkOut,
        num_adults: 2,
        num_children: 0,
      })
    );

    const results = await Promise.allSettled(bookingPromises);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Kernel lock guarantee: Exactly 1 reservation succeeds, 9 are rejected
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(9);

    // Verify rejection error code / message
    rejected.forEach((rej) => {
      if (rej.status === 'rejected') {
        expect(rej.reason.message).toMatch(/already booked/i);
      }
    });

    // Check store state integrity: Exactly 1 active booking exists for targetCondo on those dates
    const avail = inMemoryStore.checkCondoAvailability(targetCondo.id, checkIn, checkOut);
    expect(avail.blocked_ranges.length).toBe(1);
  });

  // ==========================================
  // SCENARIO 2: END-TO-END GUEST BOOKING FLOW (SELECTION -> ATOMIC RPC -> PROOF UPLOAD)
  // ==========================================
  it('WORKLOAD-2: Complete End-to-End Guest Booking Lifecycle to payment proof submission', async () => {
    const condos = inMemoryStore.getCondos();
    const condo = condos[0];
    const extras = inMemoryStore.getExtras();
    const paymentMethods = inMemoryStore.getPaymentMethods();

    const gcashMethod = paymentMethods.find((p) => p.type === 'gcash') || paymentMethods[0];
    const vanExtra = extras.find((e) => e.price_type === 'per_stay') || extras[0];

    // 1. Step 1-4: Guest inputs details and submits booking atomically
    const bookingResult = await inMemoryStore.createBookingAtomic({
      condo_id: condo.id,
      guest_name: 'Lady Eleanor Vance',
      guest_email: 'eleanor.vance@highlife.com',
      guest_phone: '+1-555-0921',
      guest_notes: 'Please arrange late check-in if possible',
      check_in: '2026-11-12',
      check_out: '2026-11-16', // 4 nights (includes Fri/Sat weekend)
      num_adults: 2,
      num_children: 1,
      num_infants: 1,
      selected_extras: [{ extra_id: vanExtra.id, quantity: 1 }],
      payment_method_id: gcashMethod.id,
    });

    expect(bookingResult.success).toBe(true);
    expect(bookingResult.booking_code).toMatch(/^CP-\d{4}-[A-Z0-9]+$/);
    expect(bookingResult.access_token).toBeTruthy();
    expect(bookingResult.nights).toBe(4);
    expect(bookingResult.total_amount).toBeGreaterThan(0);
    expect(bookingResult.reservation_fee_required).toBeGreaterThan(0);

    // Verify initial status
    const createdBooking = inMemoryStore.getBookingById(bookingResult.booking_id);
    expect(createdBooking).toBeDefined();
    expect(createdBooking?.booking_status).toBe('pending');
    expect(createdBooking?.payment_status).toBe('unpaid');

    // 2. Step 5: Guest submits GCash payment reference and screenshot receipt proof
    const proofSubmission = await inMemoryStore.submitPaymentProof({
      booking_code: bookingResult.booking_code,
      access_token: bookingResult.access_token,
      payment_method_id: gcashMethod.id,
      payment_reference_number: 'GCASH-REF-99887766',
      payment_proof_url: 'https://images.unsplash.com/photo-proof-receipt-sample.jpg',
    });

    expect(proofSubmission.success).toBe(true);
    expect(proofSubmission.payment_status).toBe('proof_submitted');

    // Verify updated booking record
    const updatedBooking = inMemoryStore.getBookingByCode(bookingResult.booking_code);
    expect(updatedBooking?.payment_status).toBe('proof_submitted');
    expect(updatedBooking?.payment_reference_number).toBe('GCASH-REF-99887766');
    expect(updatedBooking?.payment_proof_url).toBeTruthy();
  });

  // ==========================================
  // SCENARIO 3: ADMIN REVIEW, VERIFICATION & APPROVAL LIFECYCLE
  // ==========================================
  it('WORKLOAD-3: Admin review and payment verification lifecycle transitioning booking to confirmed', async () => {
    const condos = inMemoryStore.getCondos();
    const condo = condos[1] || condos[0];

    // 1. Guest creates booking
    const bookingRes = await inMemoryStore.createBookingAtomic({
      condo_id: condo.id,
      guest_name: 'Lord Arthur Pendelton',
      guest_email: 'arthur.p@estates.org',
      guest_phone: '+44-20-7946-0912',
      check_in: '2026-11-20',
      check_out: '2026-11-24',
      num_adults: 2,
    });

    // 2. Guest submits proof
    await inMemoryStore.submitPaymentProof({
      booking_code: bookingRes.booking_code,
      access_token: bookingRes.access_token,
      payment_reference_number: 'MAYA-99220011',
      payment_proof_url: 'https://proofs.condopal.com/receipt-01.png',
    });

    // 3. Admin reviews payment proof in Lightbox and approves required reservation fee
    const verifiedBooking = await inMemoryStore.verifyBookingPayment(
      bookingRes.booking_id,
      bookingRes.reservation_fee_required,
      'GCash transaction verified with bank reconciliation.'
    );

    expect(verifiedBooking.booking_status).toBe('confirmed');
    expect(verifiedBooking.payment_status).toBe('verified');
    expect(verifiedBooking.reservation_fee_paid).toBe(bookingRes.reservation_fee_required);
    expect(verifiedBooking.balance_due).toBe(bookingRes.total_amount - bookingRes.reservation_fee_required);
    expect(verifiedBooking.admin_notes).toContain('reconciliation');
    expect(verifiedBooking.verified_at).toBeTruthy();
  });

  // ==========================================
  // SCENARIO 4: ADMIN REJECTION & DATES FREED FOR SUBSEQUENT GUEST
  // ==========================================
  it('WORKLOAD-4: Admin payment rejection releases locked calendar dates for subsequent bookings', async () => {
    const condo = inMemoryStore.getCondos()[0];
    const checkIn = '2026-12-01';
    const checkOut = '2026-12-05';

    // 1. Guest A books dates
    const resA = await inMemoryStore.createBookingAtomic({
      condo_id: condo.id,
      guest_name: 'Guest A',
      guest_email: 'guestA@mail.com',
      guest_phone: '+1-555-001',
      check_in: checkIn,
      check_out: checkOut,
      num_adults: 2,
    });
    expect(resA.success).toBe(true);

    // 2. Guest B tries to book overlapping dates -> fails
    await expect(
      inMemoryStore.createBookingAtomic({
        condo_id: condo.id,
        guest_name: 'Guest B',
        guest_email: 'guestB@mail.com',
        guest_phone: '+1-555-002',
        check_in: '2026-12-03',
        check_out: '2026-12-07',
        num_adults: 2,
      })
    ).rejects.toThrow(/already booked/i);

    // 3. Admin rejects Guest A (e.g. invalid or fraudulent payment proof)
    const rejectedBooking = await inMemoryStore.rejectBookingPayment(
      resA.booking_id,
      'Invalid payment reference number not found in GCash merchant portal.'
    );
    expect(rejectedBooking.booking_status).toBe('rejected');
    expect(rejectedBooking.payment_status).toBe('rejected');

    // 4. Guest B tries to book again -> now succeeds because dates are freed
    const resB = await inMemoryStore.createBookingAtomic({
      condo_id: condo.id,
      guest_name: 'Guest B',
      guest_email: 'guestB@mail.com',
      guest_phone: '+1-555-002',
      check_in: '2026-12-03',
      check_out: '2026-12-07',
      num_adults: 2,
    });
    expect(resB.success).toBe(true);
    expect(resB.booking_code).toBeTruthy();
  });

  // ==========================================
  // SCENARIO 5: CONDO AVAILABILITY QUERY & BLOCKED DATES CALENDAR
  // ==========================================
  it('WORKLOAD-5: checkCondoAvailability accurately reflects active blocked intervals and ignores rejected bookings', async () => {
    const condo = inMemoryStore.getCondos()[0];

    // Seed 2 active bookings
    await inMemoryStore.createBookingAtomic({
      condo_id: condo.id,
      guest_name: 'Active Booking 1',
      guest_email: 'act1@mail.com',
      guest_phone: '+1-555-011',
      check_in: '2026-11-01',
      check_out: '2026-11-05',
      num_adults: 2,
    });

    const b2 = await inMemoryStore.createBookingAtomic({
      condo_id: condo.id,
      guest_name: 'Active Booking 2',
      guest_email: 'act2@mail.com',
      guest_phone: '+1-555-012',
      check_in: '2026-11-10',
      check_out: '2026-11-15',
      num_adults: 2,
    });

    // Check query spanning whole month
    const avail = inMemoryStore.checkCondoAvailability(condo.id, '2026-11-01', '2026-11-30');
    expect(avail.is_fully_available).toBe(false);
    expect(avail.blocked_ranges.length).toBe(2);

    // Reject Booking 2
    await inMemoryStore.rejectBookingPayment(b2.booking_id, 'Guest requested cancellation');

    const availAfterReject = inMemoryStore.checkCondoAvailability(condo.id, '2026-11-01', '2026-11-30');
    expect(availAfterReject.blocked_ranges.length).toBe(1);
    expect(availAfterReject.blocked_ranges[0].check_in).toBe('2026-11-01');
  });

  // ==========================================
  // SCENARIO 6: GUEST LOOKUP & ACCESS TOKEN SECURITY
  // ==========================================
  it('WORKLOAD-6: Guest booking lookup enforces access token / email verification', async () => {
    const condo = inMemoryStore.getCondos()[0];

    const booking = await inMemoryStore.createBookingAtomic({
      condo_id: condo.id,
      guest_name: 'Sir Reginald Finch',
      guest_email: 'reginald.finch@manor.co.uk',
      guest_phone: '+44-20-7946-0000',
      check_in: '2026-11-05',
      check_out: '2026-11-08',
      num_adults: 2,
    });

    // 1. Valid lookup by code + access token
    const lookupByToken = inMemoryStore.getBookingByCode(booking.booking_code, booking.access_token);
    expect(lookupByToken).toBeDefined();
    expect(lookupByToken?.id).toBe(booking.booking_id);

    // 2. Valid lookup by code + matching email
    const lookupByEmail = inMemoryStore.getBookingByCode(booking.booking_code, 'reginald.finch@manor.co.uk');
    expect(lookupByEmail).toBeDefined();

    // 3. Unauthorized lookup with wrong email/token returns undefined
    const unauthorizedLookup = inMemoryStore.getBookingByCode(booking.booking_code, 'hacker@attacker.com');
    expect(unauthorizedLookup).toBeUndefined();
  });

  // ==========================================
  // SCENARIO 7: CONCURRENT BOOKINGS ACROSS DIFFERENT CONDOS ALL SUCCEED
  // ==========================================
  it('WORKLOAD-7: Concurrent bookings on distinct condo units for identical dates all succeed in parallel', async () => {
    const condos = inMemoryStore.getCondos();
    expect(condos.length).toBeGreaterThanOrEqual(3);

    const checkIn = '2026-12-15';
    const checkOut = '2026-12-20';

    // Book distinct units concurrently
    const parallelBookings = condos.map((c, idx) =>
      inMemoryStore.createBookingAtomic({
        condo_id: c.id,
        guest_name: `Parallel Guest ${idx + 1}`,
        guest_email: `parallel${idx + 1}@travel.com`,
        guest_phone: `+1-555-090${idx}`,
        check_in: checkIn,
        check_out: checkOut,
        num_adults: 2,
      })
    );

    const results = await Promise.all(parallelBookings);

    // All should succeed since they are on distinct condos
    expect(results.length).toBe(condos.length);
    results.forEach((res) => {
      expect(res.success).toBe(true);
      expect(res.booking_code).toBeTruthy();
    });
  });
});
