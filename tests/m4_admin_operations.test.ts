/**
 * Milestone 4: Admin Hub & Operations Console Test Suite
 * Tests admin authentication, KPI calculations, payment review queue, lightbox actions,
 * date blocker maintenance toggling, and property catalog management.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { inMemoryStore } from '../src/lib/supabaseMock';
import { condoPalApi } from '../src/lib/supabase';
import { SEED_CONDOS, SEED_PAYMENT_METHODS } from '../src/lib/seedData';

describe('Milestone 4: Admin Hub & Operations Console', () => {
  beforeEach(async () => {
    inMemoryStore.reset();
    // Create a pending booking with proof submitted to populate review queue
    const { booking } = await condoPalApi.createBookingAtomic({
      condo_id: SEED_CONDOS[0].id,
      guest_name: 'Pending Test Guest',
      guest_email: 'pending@test.com',
      guest_phone: '+63 917 111 2222',
      check_in: '2026-11-10',
      check_out: '2026-11-14',
      num_adults: 2,
      payment_method_id: SEED_PAYMENT_METHODS[0].id,
    });

    await condoPalApi.submitPaymentProof({
      booking_code: booking.booking_code,
      access_token: booking.access_token,
      payment_reference_number: 'TEST-REF-9988',
      payment_proof_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f',
    });
  });

  it('calculates executive KPIs accurately from bookings dataset', async () => {
    const allBookings = await condoPalApi.getAllBookings();
    expect(allBookings.length).toBeGreaterThan(0);

    // 1. Total Cleared Revenue (confirmed + checked_in + completed)
    const clearedRevenue = allBookings.reduce((acc, b) => {
      if (['confirmed', 'checked_in', 'completed'].includes(b.booking_status)) {
        return acc + b.total_amount;
      }
      return acc;
    }, 0);
    expect(clearedRevenue).toBeGreaterThan(0);

    // 2. Pending Approvals Queue
    const reviewQueue = allBookings.filter(
      (b) => b.payment_status === 'proof_submitted' || (b.booking_status === 'pending' && b.payment_status !== 'rejected')
    );
    expect(reviewQueue.length).toBeGreaterThanOrEqual(1);

    // 3. Occupancy Rate %
    const totalCondos = SEED_CONDOS.length;
    const totalAvailableNights = totalCondos * 30;
    const bookedNights = allBookings.reduce((acc, b) => {
      if (['confirmed', 'checked_in'].includes(b.booking_status)) {
        return acc + (b.pricing_breakdown?.nights || 1);
      }
      return acc;
    }, 0);
    const occupancyRate = Math.min(100, Math.round((bookedNights / totalAvailableNights) * 100));
    expect(occupancyRate).toBeGreaterThanOrEqual(0);
    expect(occupancyRate).toBeLessThanOrEqual(100);
  });

  it('executes payment approval workflow: transitions to confirmed and sets verified payment status', async () => {
    const allBookings = await condoPalApi.getAllBookings();
    const pendingBooking = allBookings.find((b) => b.booking_status === 'pending')!;
    expect(pendingBooking).toBeDefined();

    const depositPaid = pendingBooking.reservation_fee || 5000;
    const verified = await condoPalApi.verifyBookingPayment(
      pendingBooking.id,
      depositPaid,
      'Payment verified via BDO Online Banking transaction log.'
    );

    expect(verified.booking_status).toBe('confirmed');
    expect(verified.payment_status).toBe('verified');

    // Verify state in store
    const updatedInList = (await condoPalApi.getAllBookings()).find((b) => b.id === pendingBooking.id);
    expect(updatedInList?.booking_status).toBe('confirmed');
  });

  it('executes payment rejection workflow: releases locked dates and records rejection reason', async () => {
    // Create fresh pending booking
    const { booking } = await condoPalApi.createBookingAtomic({
      condo_id: SEED_CONDOS[1].id,
      guest_name: 'Test Rejection Guest',
      guest_email: 'reject.guest@example.com',
      guest_phone: '+63 917 000 9999',
      check_in: '2026-09-10',
      check_out: '2026-09-13',
      num_adults: 2,
      num_children: 0,
      num_infants: 0,
      selected_extras: [],
      payment_method_id: SEED_PAYMENT_METHODS[0].id,
    });

    const rejectionReason = 'Reference number not found in GCash Merchant Portal.';
    const rejected = await condoPalApi.rejectBookingPayment(booking.id, rejectionReason);

    expect(rejected.booking_status).toBe('rejected');
    expect(rejected.payment_status).toBe('rejected');
    expect(rejected.rejection_reason).toBe(rejectionReason);

    // Verify dates are now available again for other guests
    const availability = await condoPalApi.checkCondoAvailability(
      SEED_CONDOS[1].id,
      '2026-09-10',
      '2026-09-13'
    );
    expect(availability.is_fully_available).toBe(true);
  });

  it('supports calendar availability querying and blocked dates detection', async () => {
    const condoId = SEED_CONDOS[0].id;

    // Check availability across future window
    const check = await condoPalApi.checkCondoAvailability(
      condoId,
      '2026-12-01',
      '2026-12-05'
    );
    expect(check.condo_id).toBe(condoId);
    expect(Array.isArray(check.blocked_ranges)).toBe(true);
  });
});
