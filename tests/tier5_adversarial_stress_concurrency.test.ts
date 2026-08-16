/**
 * CondoPal Tier 5: Adversarial Concurrency, Race Condition & Stress Verification Test Suite
 * 
 * Empirically tests:
 * 1. 20-50 simultaneous concurrent booking storms for overlapping dates on the same unit.
 * 2. Mixed overlapping vs disjoint date windows under high concurrent load.
 * 3. Multi-unit parallel concurrency without cross-unit blocking.
 * 4. Immediate lock release & re-booking post admin rejection / cancellation.
 * 5. Date blocker / maintenance status race conditions.
 * 6. Non-deterministic asynchronous microtask & network latency interleaving.
 * 7. Financial integrity invariants, audit log consistency, and zero state corruption.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { inMemoryStore } from '../src/lib/supabaseMock';
import { areDateRangesOverlapping } from '../src/lib/dateUtils';
import type { BookingStatus, PaymentStatus } from '../src/types/booking';

describe('Tier 5: Adversarial Concurrency & Stress Verification', () => {
  beforeEach(() => {
    inMemoryStore.reset();
  });

  // ==========================================================================
  // 1. 50 SIMULTANEOUS CONCURRENT REQUESTS (IDENTICAL OVERLAPPING WINDOW)
  // ==========================================================================
  it('STRESS-1: 50 simultaneous concurrent booking requests on the same unit -> exactly 1 succeeds, 49 rejected', async () => {
    const condos = inMemoryStore.getCondos();
    const targetCondo = condos[0];
    const checkIn = '2026-12-10';
    const checkOut = '2026-12-15';
    const CONCURRENT_CLIENTS = 50;

    const initialBookingsCount = inMemoryStore.getBookings().length;
    const initialLogsCount = inMemoryStore.getState().audit_logs.length;

    // Launch 50 concurrent booking attempts simultaneously
    const stormPromises = Array.from({ length: CONCURRENT_CLIENTS }, (_, idx) =>
      inMemoryStore.createBookingAtomic({
        condo_id: targetCondo.id,
        guest_name: `Stress Guest ${idx + 1}`,
        guest_email: `stress_guest_${idx + 1}@resort-vip.com`,
        guest_phone: `+1-555-${String(idx).padStart(4, '0')}`,
        check_in: checkIn,
        check_out: checkOut,
        num_adults: 2,
        num_children: 1,
      })
    );

    const outcomes = await Promise.allSettled(stormPromises);

    const successes = outcomes.filter((o): o is PromiseFulfilledResult<any> => o.status === 'fulfilled');
    const failures = outcomes.filter((o): o is PromiseRejectedResult => o.status === 'rejected');

    // Assert strict single-winner invariant
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(49);

    // Validate the winning booking
    const winner = successes[0].value;
    expect(winner.success).toBe(true);
    expect(winner.booking_code).toMatch(/^CP-2026-[A-Z0-9]+$/);
    expect(winner.access_token).toMatch(/^tok_[a-z0-9]+$/);
    expect(winner.nights).toBe(5);
    expect(winner.total_amount).toBeGreaterThan(0);
    expect(winner.reservation_fee_required).toBeGreaterThan(0);

    // Validate all 49 failures were rejected cleanly with double-booking error
    failures.forEach((fail) => {
      expect(fail.reason).toBeInstanceOf(Error);
      expect(fail.reason.message).toMatch(/already booked/i);
    });

    // Verify zero database corruption
    const currentBookings = inMemoryStore.getBookings();
    expect(currentBookings.length).toBe(initialBookingsCount + 1);

    const newBooking = inMemoryStore.getBookingById(winner.booking_id);
    expect(newBooking).toBeDefined();
    expect(newBooking?.condo_id).toBe(targetCondo.id);
    expect(newBooking?.check_in).toBe(checkIn);
    expect(newBooking?.check_out).toBe(checkOut);
    expect(newBooking?.booking_status).toBe('pending');

    // Verify audit logs integrity: exactly 1 booking create log was written
    const currentLogs = inMemoryStore.getState().audit_logs;
    expect(currentLogs.length).toBe(initialLogsCount + 1);
    expect(currentLogs[0].action).toBe('create');
    expect(currentLogs[0].entity_id).toBe(winner.booking_id);

    // Verify availability check reflects blocked dates
    const avail = inMemoryStore.checkCondoAvailability(targetCondo.id, checkIn, checkOut);
    expect(avail.is_fully_available).toBe(false);
    expect(avail.blocked_ranges.length).toBe(1);
    expect(avail.blocked_ranges[0].check_in).toBe(checkIn);
    expect(avail.blocked_ranges[0].check_out).toBe(checkOut);
  });

  // ==========================================================================
  // 2. MULTI-ROUND CONCURRENCY STORM (5 ITERATIONS OF 30 CONCURRENT REQUESTS)
  // ==========================================================================
  it('STRESS-2: 5 sequential rounds of 30 concurrent booking bursts across non-overlapping dates', async () => {
    const targetCondo = inMemoryStore.getCondos()[0];
    const rounds = [
      { checkIn: '2026-10-01', checkOut: '2026-10-05' },
      { checkIn: '2026-10-06', checkOut: '2026-10-10' },
      { checkIn: '2026-10-11', checkOut: '2026-10-15' },
      { checkIn: '2026-10-16', checkOut: '2026-10-20' },
      { checkIn: '2026-10-21', checkOut: '2026-10-25' },
    ];

    const initialBookingsCount = inMemoryStore.getBookings().length;

    for (let r = 0; r < rounds.length; r++) {
      const { checkIn, checkOut } = rounds[r];
      const promises = Array.from({ length: 30 }, (_, idx) =>
        inMemoryStore.createBookingAtomic({
          condo_id: targetCondo.id,
          guest_name: `Burst Guest R${r}-${idx}`,
          guest_email: `burst_r${r}_${idx}@concierge.luxury`,
          guest_phone: `+1-555-${r}${idx}`,
          check_in: checkIn,
          check_out: checkOut,
          num_adults: 2,
        })
      );

      const outcomes = await Promise.allSettled(promises);
      const successes = outcomes.filter((o) => o.status === 'fulfilled');
      const failures = outcomes.filter((o) => o.status === 'rejected');

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(29);
    }

    // Exactly 5 new bookings should have been added across the 5 rounds
    expect(inMemoryStore.getBookings().length).toBe(initialBookingsCount + 5);

    // Verify all 5 date ranges are now blocked
    const monthAvail = inMemoryStore.checkCondoAvailability(targetCondo.id, '2026-10-01', '2026-10-31');
    expect(monthAvail.blocked_ranges.length).toBe(5);
  });

  // ==========================================================================
  // 3. COMPLEX OVERLAPPING WAVE (50 REQUESTS SPANNING OVERLAPPING & DISJOINT DATES)
  // ==========================================================================
  it('STRESS-3: Complex 50-request concurrency wave with overlapping windows & disjoint windows', async () => {
    const targetCondo = inMemoryStore.getCondos()[0];

    // 40 requests in overlapping clusters + 10 requests in 2 disjoint separate clusters
    const requests = [
      // Cluster A (Overlapping around Nov 10-15): 40 requests
      ...Array.from({ length: 10 }, (_, i) => ({ in: '2026-11-10', out: '2026-11-15', name: `A1-${i}` })),
      ...Array.from({ length: 10 }, (_, i) => ({ in: '2026-11-12', out: '2026-11-17', name: `A2-${i}` })),
      ...Array.from({ length: 10 }, (_, i) => ({ in: '2026-11-08', out: '2026-11-12', name: `A3-${i}` })),
      ...Array.from({ length: 10 }, (_, i) => ({ in: '2026-11-14', out: '2026-11-18', name: `A4-${i}` })),
      
      // Cluster B (Disjoint Nov 01-05): 5 requests
      ...Array.from({ length: 5 }, (_, i) => ({ in: '2026-11-01', out: '2026-11-05', name: `B-${i}` })),

      // Cluster C (Disjoint Nov 22-26): 5 requests
      ...Array.from({ length: 5 }, (_, i) => ({ in: '2026-11-22', out: '2026-11-26', name: `C-${i}` })),
    ];

    expect(requests.length).toBe(50);

    // Shuffle requests to maximize race randomness
    const shuffled = [...requests].sort(() => Math.random() - 0.5);

    const promises = shuffled.map((req) =>
      inMemoryStore.createBookingAtomic({
        condo_id: targetCondo.id,
        guest_name: req.name,
        guest_email: `${req.name.toLowerCase()}@hotel.com`,
        guest_phone: '+1-555-0987',
        check_in: req.in,
        check_out: req.out,
        num_adults: 2,
      })
    );

    const outcomes = await Promise.allSettled(promises);
    const successes = outcomes.filter((o): o is PromiseFulfilledResult<any> => o.status === 'fulfilled');
    const failures = outcomes.filter((o) => o.status === 'rejected');

    // Cluster B has 1 winner, Cluster C has 1 winner.
    // In Cluster A, one request won first (e.g. A1, A2, A3, or A4). Depending on which won:
    // If A1 (10-15) won, A2 (12-17), A3 (08-12), A4 (14-18) all overlap with it.
    // If A3 (08-12) won first, A1 (10-15) overlaps, but A4 (14-18) could also win if not overlapping with A3!
    // However, all successful bookings must strictly NOT overlap with each other.
    expect(successes.length).toBeGreaterThanOrEqual(3);
    expect(failures.length).toBeGreaterThanOrEqual(40);
    expect(successes.length + failures.length).toBe(50);

    // Assert that NO two successful bookings overlap
    const successfulBookings = successes.map((s) => s.value);
    for (let i = 0; i < successfulBookings.length; i++) {
      for (let j = i + 1; j < successfulBookings.length; j++) {
        const b1 = successfulBookings[i];
        const b2 = successfulBookings[j];
        const overlap = areDateRangesOverlapping(b1.check_in, b1.check_out, b2.check_in, b2.check_out);
        expect(overlap).toBe(false);
      }
    }
  });

  // ==========================================================================
  // 4. MULTI-UNIT PARALLEL CONCURRENCY (50 REQUESTS ACROSS ALL CONDOS)
  // ==========================================================================
  it('STRESS-4: 50 concurrent requests distributed across 5 different units for identical dates', async () => {
    const condos = inMemoryStore.getCondos();
    expect(condos.length).toBeGreaterThanOrEqual(3);

    const checkIn = '2026-12-24';
    const checkOut = '2026-12-28';
    const CONCURRENT_PER_UNIT = 10;
    const TOTAL_REQUESTS = condos.length * CONCURRENT_PER_UNIT;

    const promises: Promise<any>[] = [];

    condos.forEach((condo, cIdx) => {
      for (let i = 0; i < CONCURRENT_PER_UNIT; i++) {
        promises.push(
          inMemoryStore.createBookingAtomic({
            condo_id: condo.id,
            guest_name: `Unit${cIdx}-Guest${i}`,
            guest_email: `u${cIdx}_g${i}@parallel.luxury`,
            guest_phone: `+1-555-${cIdx}${i}`,
            check_in: checkIn,
            check_out: checkOut,
            num_adults: 2,
          })
        );
      }
    });

    const outcomes = await Promise.allSettled(promises);
    const successes = outcomes.filter((o): o is PromiseFulfilledResult<any> => o.status === 'fulfilled');
    const failures = outcomes.filter((o) => o.status === 'rejected');

    // Exactly 1 winner per condo unit
    expect(successes.length).toBe(condos.length);
    expect(failures.length).toBe(TOTAL_REQUESTS - condos.length);

    // Verify every condo has exactly 1 successful booking
    const winningCondoIds = successes.map((s) => s.value.booking.condo_id);
    const uniqueWinningCondoIds = new Set(winningCondoIds);
    expect(uniqueWinningCondoIds.size).toBe(condos.length);

    condos.forEach((condo) => {
      expect(uniqueWinningCondoIds.has(condo.id)).toBe(true);
      const avail = inMemoryStore.checkCondoAvailability(condo.id, checkIn, checkOut);
      expect(avail.blocked_ranges.length).toBe(1);
    });
  });

  // ==========================================================================
  // 5. IMMEDIATE RE-BOOKING AFTER ADMIN REJECTION (CALENDAR LOCK RELEASE)
  // ==========================================================================
  it('STRESS-5: Immediate lock release and re-booking storm post admin rejection', async () => {
    const targetCondo = inMemoryStore.getCondos()[0];
    const checkIn = '2026-11-15';
    const checkOut = '2026-11-20';

    // 1. Initial guest books dates
    const initialBooking = await inMemoryStore.createBookingAtomic({
      condo_id: targetCondo.id,
      guest_name: 'Original Guest',
      guest_email: 'original@stay.com',
      guest_phone: '+1-555-1111',
      check_in: checkIn,
      check_out: checkOut,
      num_adults: 2,
    });
    expect(initialBooking.success).toBe(true);

    // 2. 20 concurrent guests try to book overlapping dates -> 100% fail
    const blockedOutcomes = await Promise.allSettled(
      Array.from({ length: 20 }, (_, idx) =>
        inMemoryStore.createBookingAtomic({
          condo_id: targetCondo.id,
          guest_name: `Blocked Guest ${idx}`,
          guest_email: `blocked_${idx}@stay.com`,
          guest_phone: '+1-555-2222',
          check_in: checkIn,
          check_out: checkOut,
          num_adults: 2,
        })
      )
    );
    expect(blockedOutcomes.filter((o) => o.status === 'rejected').length).toBe(20);

    // 3. Admin rejects initial booking due to invalid payment
    const rejectedBooking = await inMemoryStore.rejectBookingPayment(
      initialBooking.booking_id,
      'Invalid / fake payment receipt detected.'
    );
    expect(rejectedBooking.booking_status).toBe('rejected');
    expect(rejectedBooking.payment_status).toBe('rejected');

    // 4. Availability query immediately shows dates as available
    const availAfterReject = inMemoryStore.checkCondoAvailability(targetCondo.id, checkIn, checkOut);
    expect(availAfterReject.is_fully_available).toBe(true);
    expect(availAfterReject.blocked_ranges.length).toBe(0);

    // 5. 30 concurrent guests immediately rush to re-book the freed dates
    const rushOutcomes = await Promise.allSettled(
      Array.from({ length: 30 }, (_, idx) =>
        inMemoryStore.createBookingAtomic({
          condo_id: targetCondo.id,
          guest_name: `Rush Guest ${idx}`,
          guest_email: `rush_${idx}@stay.com`,
          guest_phone: '+1-555-3333',
          check_in: checkIn,
          check_out: checkOut,
          num_adults: 2,
        })
      )
    );

    const rushSuccesses = rushOutcomes.filter((o): o is PromiseFulfilledResult<any> => o.status === 'fulfilled');
    const rushFailures = rushOutcomes.filter((o) => o.status === 'rejected');

    // Exactly 1 new guest captures the freed suite
    expect(rushSuccesses.length).toBe(1);
    expect(rushFailures.length).toBe(29);

    const newWinner = rushSuccesses[0].value;
    expect(newWinner.booking_id).not.toBe(initialBooking.booking_id);
    expect(newWinner.booking_code).not.toBe(initialBooking.booking_code);

    // Audit logs verify lifecycle history
    const logs = inMemoryStore.getState().audit_logs;
    const rejectLog = logs.find((l) => l.action === 'payment_rejected' && l.entity_id === initialBooking.booking_id);
    expect(rejectLog).toBeDefined();
  });

  // ==========================================================================
  // 6. ASYNC DELAY & MICROTASK INTERLEAVING SIMULATION
  // ==========================================================================
  it('STRESS-6: Non-deterministic async microtask delays do not cause double-booking race condition', async () => {
    const targetCondo = inMemoryStore.getCondos()[1] || inMemoryStore.getCondos()[0];
    const checkIn = '2026-12-01';
    const checkOut = '2026-12-06';
    const CONCURRENT_CLIENTS = 40;

    // Simulate real-world network jitter and microtask queue interleaving
    const delayedBookingTask = async (idx: number) => {
      const delayMs = Math.floor(Math.random() * 25);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return inMemoryStore.createBookingAtomic({
        condo_id: targetCondo.id,
        guest_name: `Jitter Guest ${idx}`,
        guest_email: `jitter_${idx}@speed.com`,
        guest_phone: '+1-555-7788',
        check_in: checkIn,
        check_out: checkOut,
        num_adults: 2,
      });
    };

    const outcomes = await Promise.allSettled(
      Array.from({ length: CONCURRENT_CLIENTS }, (_, idx) => delayedBookingTask(idx))
    );

    const successes = outcomes.filter((o) => o.status === 'fulfilled');
    const failures = outcomes.filter((o) => o.status === 'rejected');

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(CONCURRENT_CLIENTS - 1);
  });

  // ==========================================================================
  // 7. DATE BLOCKER & MAINTENANCE INTEGRATION RACE CONDITIONS
  // ==========================================================================
  it('STRESS-7: Inactive / maintenance condo status blocks all 20 concurrent booking requests', async () => {
    const condo = inMemoryStore.getCondos()[0];
    const checkIn = '2026-12-15';
    const checkOut = '2026-12-18';

    // Set condo to maintenance
    condo.status = 'maintenance';

    const outcomes = await Promise.allSettled(
      Array.from({ length: 20 }, (_, idx) =>
        inMemoryStore.createBookingAtomic({
          condo_id: condo.id,
          guest_name: `Maintenance Attempt ${idx}`,
          guest_email: `maint_${idx}@fail.com`,
          guest_phone: '+1-555-9999',
          check_in: checkIn,
          check_out: checkOut,
          num_adults: 2,
        })
      )
    );

    const successes = outcomes.filter((o) => o.status === 'fulfilled');
    const failures = outcomes.filter((o): o is PromiseRejectedResult => o.status === 'rejected');

    // 0 succeeded, 20 rejected with maintenance/unavailable error
    expect(successes.length).toBe(0);
    expect(failures.length).toBe(20);
    failures.forEach((f) => {
      expect(f.reason.message).toMatch(/unavailable for booking/i);
    });

    // Re-activate condo
    condo.status = 'active';

    // Now 20 concurrent requests race -> exactly 1 succeeds
    const reactivationOutcomes = await Promise.allSettled(
      Array.from({ length: 20 }, (_, idx) =>
        inMemoryStore.createBookingAtomic({
          condo_id: condo.id,
          guest_name: `Post Maintenance Guest ${idx}`,
          guest_email: `post_maint_${idx}@win.com`,
          guest_phone: '+1-555-9999',
          check_in: checkIn,
          check_out: checkOut,
          num_adults: 2,
        })
      )
    );

    expect(reactivationOutcomes.filter((o) => o.status === 'fulfilled').length).toBe(1);
    expect(reactivationOutcomes.filter((o) => o.status === 'rejected').length).toBe(19);
  });

  // ==========================================================================
  // 8. PAYMENT PROOF SUBMISSION & ADMIN VERIFICATION IDEMPOTENCE
  // ==========================================================================
  it('STRESS-8: Payment proof submission is rejected on cancelled/rejected bookings, and admin verification is strictly consistent', async () => {
    const condo = inMemoryStore.getCondos()[0];
    const paymentMethods = inMemoryStore.getPaymentMethods();
    const gcash = paymentMethods.find((p) => p.type === 'gcash') || paymentMethods[0];

    const booking = await inMemoryStore.createBookingAtomic({
      condo_id: condo.id,
      guest_name: 'Test Payment Guest',
      guest_email: 'payment.test@suite.com',
      guest_phone: '+1-555-4444',
      check_in: '2026-11-28',
      check_out: '2026-12-02',
      num_adults: 2,
      payment_method_id: gcash.id,
    });

    // 1. Submit payment proof
    const proofRes = await inMemoryStore.submitPaymentProof({
      booking_code: booking.booking_code,
      access_token: booking.access_token,
      payment_reference_number: 'GCASH-999888',
      payment_proof_url: 'https://cdn.condopal.com/proof-001.jpg',
    });
    expect(proofRes.success).toBe(true);
    expect(proofRes.payment_status).toBe('proof_submitted');

    // 2. Reject with invalid access token -> throws unauthorized
    await expect(
      inMemoryStore.submitPaymentProof({
        booking_code: booking.booking_code,
        access_token: 'tok_invalid_hacker_token',
        payment_reference_number: 'FAKE-123',
        payment_proof_url: 'https://cdn.condopal.com/fake.jpg',
      })
    ).rejects.toThrow(/unauthorized|invalid/i);

    // 3. Admin verifies payment with exact reservation fee amount
    const verifiedBooking = await inMemoryStore.verifyBookingPayment(
      booking.booking_id,
      booking.reservation_fee_required,
      'Downpayment verified via Maya merchant console.'
    );
    expect(verifiedBooking.booking_status).toBe('confirmed');
    expect(verifiedBooking.payment_status).toBe('verified');
    expect(verifiedBooking.reservation_fee_paid).toBe(booking.reservation_fee_required);
    expect(verifiedBooking.balance_due).toBe(booking.total_amount - booking.reservation_fee_required);

    // 4. Admin verifies remaining balance payment -> status becomes fully_paid
    const remainingBalance = verifiedBooking.balance_due;
    const fullyPaidBooking = await inMemoryStore.verifyBookingPayment(
      booking.booking_id,
      remainingBalance,
      'Remaining balance settled upon check-in.'
    );
    expect(fullyPaidBooking.booking_status).toBe('confirmed');
    expect(fullyPaidBooking.payment_status).toBe('fully_paid');
    expect(fullyPaidBooking.balance_due).toBe(0);
    expect(fullyPaidBooking.reservation_fee_paid).toBe(booking.total_amount);

    // 5. Admin rejects booking -> status becomes rejected
    const rejectedBooking = await inMemoryStore.rejectBookingPayment(booking.booking_id, 'Guest requested refund');
    expect(rejectedBooking.booking_status).toBe('rejected');

    // 6. Guest attempts to submit payment proof on rejected booking -> strictly rejected
    await expect(
      inMemoryStore.submitPaymentProof({
        booking_code: booking.booking_code,
        access_token: booking.access_token,
        payment_reference_number: 'GCASH-LATE-001',
        payment_proof_url: 'https://cdn.condopal.com/late.jpg',
      })
    ).rejects.toThrow(/cannot submit payment for booking with status rejected/i);
  });

  // ==========================================================================
  // 9. FINANCIAL INVARIANT & AUDIT LOG INTEGRITY POST HIGH-CONCURRENCY
  // ==========================================================================
  it('STRESS-9: High-concurrency storm preserves financial invariants, non-negative balances, and audit trail integrity', async () => {
    const condos = inMemoryStore.getCondos();
    const extras = inMemoryStore.getExtras();

    // Create 10 different bookings with various extras across all condos
    const tasks = condos.map((condo, idx) => {
      const extraItems = extras.slice(0, 2).map((e) => ({ extra_id: e.id, quantity: 1 }));
      return inMemoryStore.createBookingAtomic({
        condo_id: condo.id,
        guest_name: `Invariant Guest ${idx}`,
        guest_email: `invariant_${idx}@audit.com`,
        guest_phone: `+1-555-888${idx}`,
        check_in: `2026-10-${String(10 + idx * 3).padStart(2, '0')}`,
        check_out: `2026-10-${String(14 + idx * 3).padStart(2, '0')}`,
        num_adults: 2,
        num_children: 1,
        selected_extras: extraItems,
      });
    });

    const results = await Promise.all(tasks);
    expect(results.length).toBe(condos.length);

    // Check all stored bookings for mathematical & state invariants
    const allBookings = inMemoryStore.getBookings();
    allBookings.forEach((b) => {
      expect(b.total_amount).toBeGreaterThan(0);
      expect(b.reservation_fee).toBeGreaterThan(0);
      expect(b.reservation_fee).toBeLessThanOrEqual(b.total_amount);
      expect(b.balance_due).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(b.total_amount)).toBe(true);
      expect(Number.isNaN(b.total_amount)).toBe(false);
      expect(b.pricing_breakdown).toBeDefined();
      expect(b.pricing_breakdown.nights).toBeGreaterThan(0);
      expect(b.access_token).toBeTruthy();
      expect(b.booking_code).toMatch(/^CP-\d{4}-[A-Z0-9]+$/);
    });

    // Check audit logs
    const auditLogs = inMemoryStore.getState().audit_logs;
    expect(auditLogs.length).toBeGreaterThanOrEqual(condos.length);
    auditLogs.forEach((log) => {
      expect(log.id).toBeTruthy();
      expect(log.entity_type).toBeTruthy();
      expect(log.action).toBeTruthy();
      expect(log.created_at).toBeTruthy();
    });
  });

  // ==========================================================================
  // 10. 100 SIMULTANEOUS OVERLAPPING BOOKING REQUESTS (EXTREME LOAD STORM)
  // ==========================================================================
  it('STRESS-10: 100 simultaneous concurrent booking requests on the same unit -> exactly 1 succeeds, 99 rejected', async () => {
    const targetCondo = inMemoryStore.getCondos()[0];
    const checkIn = '2026-12-20';
    const checkOut = '2026-12-25';
    const CLIENT_COUNT = 100;

    const initialBookingsCount = inMemoryStore.getBookings().length;

    const stormPromises = Array.from({ length: CLIENT_COUNT }, (_, idx) =>
      inMemoryStore.createBookingAtomic({
        condo_id: targetCondo.id,
        guest_name: `Storm 100 Guest ${idx + 1}`,
        guest_email: `storm100_${idx + 1}@vip.com`,
        guest_phone: `+1-555-${String(idx).padStart(4, '0')}`,
        check_in: checkIn,
        check_out: checkOut,
        num_adults: 2,
      })
    );

    const outcomes = await Promise.allSettled(stormPromises);
    const successes = outcomes.filter((o): o is PromiseFulfilledResult<any> => o.status === 'fulfilled');
    const failures = outcomes.filter((o) => o.status === 'rejected');

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(99);
    expect(inMemoryStore.getBookings().length).toBe(initialBookingsCount + 1);

    failures.forEach((f) => {
      expect(f.reason.message).toMatch(/already booked/i);
    });
  });

  // ==========================================================================
  // 11. ADJACENT CHECKOUT/CHECKIN BOUNDARY CONCURRENCY (ZERO FALSE COLLISIONS)
  // ==========================================================================
  it('STRESS-11: 30 concurrent requests targeting 3 adjacent back-to-back date intervals on the same unit', async () => {
    const targetCondo = inMemoryStore.getCondos()[0];
    // Three back-to-back adjacent windows:
    // Window 1: 2026-11-01 -> 2026-11-05
    // Window 2: 2026-11-05 -> 2026-11-10 (Checkout of W1 is Checkin of W2)
    // Window 3: 2026-11-10 -> 2026-11-15 (Checkout of W2 is Checkin of W3)
    const windows = [
      { checkIn: '2026-11-01', checkOut: '2026-11-05', tag: 'W1' },
      { checkIn: '2026-11-05', checkOut: '2026-11-10', tag: 'W2' },
      { checkIn: '2026-11-10', checkOut: '2026-11-15', tag: 'W3' },
    ];

    const promises: Promise<any>[] = [];

    windows.forEach((w) => {
      for (let i = 0; i < 10; i++) {
        promises.push(
          inMemoryStore.createBookingAtomic({
            condo_id: targetCondo.id,
            guest_name: `${w.tag}-Guest-${i}`,
            guest_email: `${w.tag.toLowerCase()}_${i}@hotel.com`,
            guest_phone: `+1-555-${i}`,
            check_in: w.checkIn,
            check_out: w.checkOut,
            num_adults: 2,
          })
        );
      }
    });

    // Shuffle promises
    const shuffled = [...promises].sort(() => Math.random() - 0.5);
    const outcomes = await Promise.allSettled(shuffled);

    const successes = outcomes.filter((o): o is PromiseFulfilledResult<any> => o.status === 'fulfilled');
    const failures = outcomes.filter((o) => o.status === 'rejected');

    // Exactly 1 winner per window (total 3 successes, 27 rejections)
    expect(successes.length).toBe(3);
    expect(failures.length).toBe(27);

    // Verify all 3 adjacent windows are successfully booked without colliding
    const bookedCheckIns = successes.map((s) => s.value.check_in).sort();
    expect(bookedCheckIns).toEqual(['2026-11-01', '2026-11-05', '2026-11-10']);

    // Check availability shows 3 contiguous blocked ranges
    const avail = inMemoryStore.checkCondoAvailability(targetCondo.id, '2026-11-01', '2026-11-15');
    expect(avail.blocked_ranges.length).toBe(3);
  });

  // ==========================================================================
  // 12. CHAOS FUZZING: 100 RANDOMIZED CONCURRENT ACTIONS (ZERO OVERLAP GUARANTEE)
  // ==========================================================================
  it('STRESS-12: Massive Chaos Fuzzing (100 concurrent random operations) guarantees zero active double-bookings', async () => {
    const condos = inMemoryStore.getCondos();

    // Generate 100 randomized booking requests across varied condos and random dates in Dec 2026
    const randomOperations = Array.from({ length: 100 }, (_, idx) => {
      const condo = condos[idx % condos.length];
      const startDay = 1 + (idx % 24);
      const stayLength = 1 + ((idx * 3) % 5); // 1 to 5 nights
      const endDay = startDay + stayLength;

      const checkIn = `2026-12-${String(startDay).padStart(2, '0')}`;
      const checkOut = `2026-12-${String(endDay).padStart(2, '0')}`;

      return inMemoryStore.createBookingAtomic({
        condo_id: condo.id,
        guest_name: `Chaos Guest ${idx}`,
        guest_email: `chaos_${idx}@fuzz.com`,
        guest_phone: `+1-555-${String(idx).padStart(4, '0')}`,
        check_in: checkIn,
        check_out: checkOut,
        num_adults: 1 + (idx % 4),
      });
    });

    const outcomes = await Promise.allSettled(randomOperations);
    const successes = outcomes.filter((o): o is PromiseFulfilledResult<any> => o.status === 'fulfilled');

    expect(successes.length).toBeGreaterThan(0);

    // CRITICAL POST-CHAOS ORACLE: Verify that in the entire store, NO TWO ACTIVE BOOKINGS ON THE SAME CONDO OVERLAP
    const activeStatuses: BookingStatus[] = ['pending', 'confirmed', 'checked_in'];
    const allBookings = inMemoryStore.getBookings().filter((b) => activeStatuses.includes(b.booking_status));

    condos.forEach((condo) => {
      const condoBookings = allBookings.filter((b) => b.condo_id === condo.id);
      for (let i = 0; i < condoBookings.length; i++) {
        for (let j = i + 1; j < condoBookings.length; j++) {
          const b1 = condoBookings[i];
          const b2 = condoBookings[j];
          const overlap = areDateRangesOverlapping(b1.check_in, b1.check_out, b2.check_in, b2.check_out);
          expect(
            overlap,
            `Double-booking detected on condo ${condo.name}: Booking ${b1.booking_code} (${b1.check_in}..${b1.check_out}) overlaps with Booking ${b2.booking_code} (${b2.check_in}..${b2.check_out})`
          ).toBe(false);
        }
      }
    });
  });
});

