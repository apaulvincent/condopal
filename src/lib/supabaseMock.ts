import type {
  Condo,
  Extra,
  PaymentMethod,
  Booking,
  SelectedExtra,
  BookingStatus,
  PaymentStatus,
} from '../types/booking';
import {
  SEED_CONDOS,
  SEED_EXTRAS,
  SEED_PAYMENT_METHODS,
  SEED_BOOKINGS,
  SEED_SETTINGS,
} from './seedData';
import {
  areDateRangesOverlapping,
  validateDateRange,
} from './dateUtils';
import { calculateBookingPrice, validateCapacity } from './pricingEngine';

export interface MockStoreState {
  condos: Condo[];
  extras: Extra[];
  payment_methods: PaymentMethod[];
  bookings: Booking[];
  admin_profiles: Array<{
    id: string;
    email: string;
    full_name: string;
    role: 'superadmin' | 'admin' | 'manager' | 'staff';
    avatar_url: string | null;
    is_active: boolean;
  }>;
  app_settings: Record<string, unknown>;
  audit_logs: Array<{
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    actor_id: string | null;
    actor_role: string;
    old_values?: unknown;
    new_values?: unknown;
    created_at: string;
  }>;
}

export class InMemorySupabaseStore {
  private state: MockStoreState;
  private lockMap: Map<string, boolean> = new Map();

  constructor() {
    this.state = {
      condos: JSON.parse(JSON.stringify(SEED_CONDOS)),
      extras: JSON.parse(JSON.stringify(SEED_EXTRAS)),
      payment_methods: JSON.parse(JSON.stringify(SEED_PAYMENT_METHODS)),
      bookings: JSON.parse(JSON.stringify(SEED_BOOKINGS)),
      admin_profiles: [
        {
          id: 'adm-00000000-0000-0000-0000-000000000001',
          email: 'admin@condopal.com',
          full_name: 'Lead Concierge Administrator',
          role: 'superadmin',
          avatar_url: null,
          is_active: true,
        },
      ],
      app_settings: { ...SEED_SETTINGS },
      audit_logs: [],
    };
  }

  public reset(): void {
    this.state = {
      condos: JSON.parse(JSON.stringify(SEED_CONDOS)),
      extras: JSON.parse(JSON.stringify(SEED_EXTRAS)),
      payment_methods: JSON.parse(JSON.stringify(SEED_PAYMENT_METHODS)),
      bookings: JSON.parse(JSON.stringify(SEED_BOOKINGS)),
      admin_profiles: [
        {
          id: 'adm-00000000-0000-0000-0000-000000000001',
          email: 'admin@condopal.com',
          full_name: 'Lead Concierge Administrator',
          role: 'superadmin',
          avatar_url: null,
          is_active: true,
        },
      ],
      app_settings: { ...SEED_SETTINGS },
      audit_logs: [],
    };
    this.lockMap.clear();
  }

  public getState(): MockStoreState {
    return this.state;
  }

  public getCondos(): Condo[] {
    return this.state.condos.filter((c) => c.status === 'active' && c.is_active);
  }

  public getCondoById(id: string): Condo | undefined {
    return this.state.condos.find((c) => c.id === id || c.slug === id);
  }

  public getExtras(): Extra[] {
    return this.state.extras.filter((e) => e.is_enabled);
  }

  public getPaymentMethods(): PaymentMethod[] {
    return this.state.payment_methods.filter((p) => p.is_enabled);
  }

  public getBookings(): Booking[] {
    return this.state.bookings;
  }

  public getBookingByCode(bookingCode: string, tokenOrEmail?: string): Booking | undefined {
    const booking = this.state.bookings.find(
      (b) => b.booking_code.toUpperCase() === bookingCode.trim().toUpperCase()
    );
    if (!booking) return undefined;

    if (tokenOrEmail) {
      const isTokenMatch = booking.access_token === tokenOrEmail;
      const isEmailMatch = booking.guest_email.toLowerCase() === tokenOrEmail.trim().toLowerCase();
      if (!isTokenMatch && !isEmailMatch) {
        return undefined;
      }
    }
    return booking;
  }

  public getBookingById(id: string): Booking | undefined {
    return this.state.bookings.find((b) => b.id === id);
  }

  /**
   * Evaluates PostgreSQL exclusion constraint prevent_overlapping_active_bookings
   * Returns true if dates are clear, false if overlapping active reservation exists.
   */
  public checkOverlapExclusion(
    condoId: string,
    checkIn: string,
    checkOut: string,
    excludeBookingId?: string
  ): boolean {
    const activeStatuses: BookingStatus[] = ['pending', 'confirmed', 'checked_in'];

    const overlapping = this.state.bookings.some((b) => {
      if (b.condo_id !== condoId) return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (!activeStatuses.includes(b.booking_status)) return false;

      return areDateRangesOverlapping(checkIn, checkOut, b.check_in, b.check_out);
    });

    return !overlapping;
  }

  /**
   * Atomic Booking RPC matching create_booking_atomic PL/pgSQL function
   */
  public async createBookingAtomic(params: {
    condo_id: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    guest_notes?: string | null;
    check_in: string;
    check_out: string;
    num_adults: number;
    num_children?: number;
    num_infants?: number;
    selected_extras?: SelectedExtra[];
    payment_method_id?: string | null;
    client_ip?: string | null;
    user_agent?: string | null;
  }): Promise<{
    success: boolean;
    booking_id: string;
    booking_code: string;
    access_token: string;
    condo_name: string;
    check_in: string;
    check_out: string;
    nights: number;
    total_amount: number;
    reservation_fee_required: number;
    hold_expires_at: string;
    booking?: Booking;
  }> {
    const condo = this.getCondoById(params.condo_id);
    if (!condo) {
      throw new Error('Selected condo unit does not exist. [ERR_CONDO_NOT_FOUND]');
    }

    if (condo.status !== 'active') {
      throw new Error(`Condo unit is unavailable for booking (${condo.status}).`);
    }

    const dateVal = validateDateRange(
      params.check_in,
      params.check_out,
      condo.min_stay_nights,
      condo.max_stay_nights
    );
    if (!dateVal.valid) {
      throw new Error(dateVal.error || 'Invalid stay dates.');
    }

    const capVal = validateCapacity(condo, params.num_adults, params.num_children || 0);
    if (!capVal.valid) {
      throw new Error(capVal.error || 'Party size exceeds unit capacity.');
    }

    // Kernel-level exclusion check
    const isClear = this.checkOverlapExclusion(condo.id, params.check_in, params.check_out);
    if (!isClear) {
      const err = new Error('The selected dates are already booked for this unit.');
      (err as unknown as { code: string }).code = '23P01';
      throw err;
    }

    // Authoritative pricing calculation
    const pricing = calculateBookingPrice({
      condo,
      checkIn: params.check_in,
      checkOut: params.check_out,
      numAdults: params.num_adults,
      numChildren: params.num_children || 0,
      selectedExtras: params.selected_extras || [],
      allExtras: this.state.extras,
    });

    const now = new Date();
    const year = now.getUTCFullYear();
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const bookingCode = `CP-${year}-${randomHex}`;
    const accessToken = `tok_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const newBookingId = `b-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const holdExpiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

    const selectedPaymentMethod = params.payment_method_id
      ? this.state.payment_methods.find((p) => p.id === params.payment_method_id)
      : undefined;

    const newBooking: Booking = {
      id: newBookingId,
      booking_code: bookingCode,
      access_token: accessToken,
      condo_id: condo.id,
      condo,
      guest_name: params.guest_name.trim(),
      guest_email: params.guest_email.trim().toLowerCase(),
      guest_phone: params.guest_phone.trim(),
      guest_notes: params.guest_notes || null,
      check_in: params.check_in,
      check_out: params.check_out,
      num_adults: params.num_adults,
      num_children: params.num_children || 0,
      num_infants: params.num_infants || 0,
      selected_extras: params.selected_extras || [],
      pricing_breakdown: pricing,
      base_total: pricing.lodging_subtotal,
      cleaning_fee: pricing.cleaning_fee,
      extras_total: pricing.extras_total,
      security_deposit: pricing.security_deposit,
      discount_amount: pricing.length_of_stay_discount,
      total_amount: pricing.total_amount,
      reservation_fee: pricing.reservation_fee_amount,
      reservation_fee_paid: 0,
      balance_due: pricing.total_amount,
      payment_method_id: params.payment_method_id || null,
      payment_method: selectedPaymentMethod,
      payment_status: 'unpaid',
      booking_status: 'pending',
      hold_expires_at: holdExpiresAt,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    this.state.bookings.unshift(newBooking);

    this.state.audit_logs.unshift({
      id: `log-${Date.now()}`,
      entity_type: 'booking',
      entity_id: newBookingId,
      action: 'create',
      actor_id: null,
      actor_role: 'guest',
      new_values: newBooking,
      created_at: now.toISOString(),
    });

    return {
      success: true,
      booking_id: newBookingId,
      booking_code: bookingCode,
      access_token: accessToken,
      condo_name: condo.name,
      check_in: params.check_in,
      check_out: params.check_out,
      nights: pricing.nights,
      total_amount: pricing.total_amount,
      reservation_fee_required: pricing.reservation_fee_amount,
      hold_expires_at: holdExpiresAt,
      booking: newBooking,
    };
  }

  /**
   * Checks condo availability and returns list of blocked date intervals
   */
  public checkCondoAvailability(
    condoId: string,
    startDate: string,
    endDate: string
  ): {
    condo_id: string;
    query_start: string;
    query_end: string;
    blocked_ranges: Array<{ check_in: string; check_out: string; status: BookingStatus }>;
    is_fully_available: boolean;
  } {
    const activeStatuses: BookingStatus[] = ['pending', 'confirmed', 'checked_in'];
    const blocked_ranges = this.state.bookings
      .filter(
        (b) =>
          b.condo_id === condoId &&
          activeStatuses.includes(b.booking_status) &&
          areDateRangesOverlapping(startDate, endDate, b.check_in, b.check_out)
      )
      .map((b) => ({
        check_in: b.check_in,
        check_out: b.check_out,
        status: b.booking_status,
      }))
      .sort((a, b) => a.check_in.localeCompare(b.check_in));

    return {
      condo_id: condoId,
      query_start: startDate,
      query_end: endDate,
      blocked_ranges,
      is_fully_available: blocked_ranges.length === 0,
    };
  }

  /**
   * Submits payment proof for a pending reservation
   */
  public async submitPaymentProof(params: {
    booking_code: string;
    access_token: string;
    payment_method_id?: string | null;
    payment_reference_number: string;
    payment_proof_url: string;
  }): Promise<{ success: boolean; booking_code: string; payment_status: PaymentStatus }> {
    const booking = this.state.bookings.find(
      (b) =>
        b.booking_code.toUpperCase() === params.booking_code.trim().toUpperCase() &&
        b.access_token === params.access_token
    );

    if (!booking) {
      throw new Error('Invalid booking reference or access token. [ERR_UNAUTHORIZED]');
    }

    if (['cancelled', 'rejected', 'expired'].includes(booking.booking_status)) {
      throw new Error(`Cannot submit payment for booking with status ${booking.booking_status}.`);
    }

    const now = new Date().toISOString();
    booking.payment_reference_number = params.payment_reference_number;
    booking.payment_proof_url = params.payment_proof_url;
    booking.payment_status = 'proof_submitted';
    booking.payment_submitted_at = now;
    booking.updated_at = now;

    if (params.payment_method_id) {
      booking.payment_method_id = params.payment_method_id;
      booking.payment_method = this.state.payment_methods.find(
        (p) => p.id === params.payment_method_id
      );
    }

    this.state.audit_logs.unshift({
      id: `log-${Date.now()}`,
      entity_type: 'booking',
      entity_id: booking.id,
      action: 'payment_proof_uploaded',
      actor_id: null,
      actor_role: 'guest',
      new_values: {
        payment_reference_number: params.payment_reference_number,
        payment_status: 'proof_submitted',
      },
      created_at: now,
    });

    return {
      success: true,
      booking_code: booking.booking_code,
      payment_status: 'proof_submitted',
    };
  }

  /**
   * Admin approves payment and confirms booking
   */
  public async verifyBookingPayment(
    bookingId: string,
    amountPaid: number,
    adminNotes?: string
  ): Promise<Booking> {
    const booking = this.state.bookings.find((b) => b.id === bookingId);
    if (!booking) {
      throw new Error('Booking not found. [ERR_NOT_FOUND]');
    }

    const now = new Date().toISOString();
    booking.reservation_fee_paid = (booking.reservation_fee_paid || 0) + amountPaid;
    booking.balance_due = Math.max(0, booking.total_amount - booking.reservation_fee_paid);

    if (booking.balance_due === 0) {
      booking.payment_status = 'fully_paid';
    } else {
      booking.payment_status = 'verified';
    }

    booking.booking_status = 'confirmed';
    if (adminNotes) {
      booking.admin_notes = adminNotes;
    }
    booking.verified_at = now;
    booking.updated_at = now;

    this.state.audit_logs.unshift({
      id: `log-${Date.now()}`,
      entity_type: 'booking',
      entity_id: booking.id,
      action: 'payment_verified',
      actor_id: 'adm-00000000-0000-0000-0000-000000000001',
      actor_role: 'admin',
      new_values: {
        booking_status: 'confirmed',
        payment_status: booking.payment_status,
        amount_paid: amountPaid,
      },
      created_at: now,
    });

    return booking;
  }

  /**
   * Admin rejects payment proof
   */
  public async rejectBookingPayment(bookingId: string, reason: string): Promise<Booking> {
    const booking = this.state.bookings.find((b) => b.id === bookingId);
    if (!booking) {
      throw new Error('Booking not found. [ERR_NOT_FOUND]');
    }

    const now = new Date().toISOString();
    booking.payment_status = 'rejected';
    booking.booking_status = 'rejected';
    booking.rejection_reason = reason;
    booking.updated_at = now;

    this.state.audit_logs.unshift({
      id: `log-${Date.now()}`,
      entity_type: 'booking',
      entity_id: booking.id,
      action: 'payment_rejected',
      actor_id: 'adm-00000000-0000-0000-0000-000000000001',
      actor_role: 'admin',
      new_values: {
        booking_status: 'rejected',
        payment_status: 'rejected',
        reason,
      },
      created_at: now,
    });

    return booking;
  }
}

// Global Singleton for in-memory testing & offline mock usage
export const inMemoryStore = new InMemorySupabaseStore();
