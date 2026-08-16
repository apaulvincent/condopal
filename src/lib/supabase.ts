import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import type {
  Condo,
  Extra,
  PaymentMethod,
  Booking,
  SelectedExtra,
} from '../types/booking';
import { inMemoryStore } from './supabaseMock';

// Fallback strings for environments where env is not defined
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://mock.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'mock-anon-key';

export const isUsingMock =
  typeof import.meta === 'undefined' ||
  !import.meta.env?.VITE_SUPABASE_URL ||
  import.meta.env?.VITE_SUPABASE_URL === 'https://mock.supabase.co' ||
  import.meta.env?.MODE === 'test';

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * Service API wrapper seamlessly abstracting Supabase DB / In-Memory Mock
 */
export const condoPalApi = {
  // Condo operations
  async getCondos(): Promise<Condo[]> {
    if (isUsingMock) {
      return inMemoryStore.getCondos();
    }
    const { data, error } = await supabase
      .from('condos')
      .select('*')
      .eq('status', 'active')
      .order('sort_order', { ascending: true });

    if (error || !data) {
      console.warn('Supabase fetch failed, falling back to local store:', error);
      return inMemoryStore.getCondos();
    }

    return (data as Database['public']['Tables']['condos']['Row'][]).map(mapDbCondoToDomain);
  },

  async getCondoBySlug(slug: string): Promise<Condo | null> {
    if (isUsingMock) {
      const condo = inMemoryStore.getCondoById(slug);
      return condo || null;
    }
    const { data, error } = await supabase
      .from('condos')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      const fallback = inMemoryStore.getCondoById(slug);
      return fallback || null;
    }
    return mapDbCondoToDomain(data as Database['public']['Tables']['condos']['Row']);
  },

  // Extras operations
  async getExtras(): Promise<Extra[]> {
    if (isUsingMock) {
      return inMemoryStore.getExtras();
    }
    const { data, error } = await supabase
      .from('extras')
      .select('*')
      .eq('enabled', true)
      .order('sort_order', { ascending: true });

    if (error || !data) {
      return inMemoryStore.getExtras();
    }

    return (data as Database['public']['Tables']['extras']['Row'][]).map((e) => ({
      id: e.id,
      name: e.name,
      slug: e.slug,
      description: e.description || '',
      price: e.price,
      price_type: e.price_type,
      icon: e.icon || 'Sparkles',
      category: e.category,
      max_quantity: e.max_quantity,
      is_enabled: e.enabled,
      sort_order: e.sort_order,
    }));
  },

  // Payment Methods operations
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    if (isUsingMock) {
      return inMemoryStore.getPaymentMethods();
    }
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('enabled', true)
      .order('sort_order', { ascending: true });

    if (error || !data) {
      return inMemoryStore.getPaymentMethods();
    }

    return (data as Database['public']['Tables']['payment_methods']['Row'][]).map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      account_name: p.account_name,
      account_number: p.account_number,
      qr_code_url: p.qr_code_url,
      instructions: p.instructions,
      is_reservation_fee_eligible: p.is_reservation_fee_eligible,
      is_enabled: p.enabled,
      sort_order: p.sort_order,
    }));
  },

  // Booking operations
  async getBookingByCode(bookingCode: string, tokenOrEmail?: string): Promise<Booking | null> {
    if (isUsingMock) {
      const b = inMemoryStore.getBookingByCode(bookingCode, tokenOrEmail);
      return b || null;
    }
    let query = supabase.from('bookings').select('*').eq('booking_code', bookingCode);
    if (tokenOrEmail) {
      query = query.or(`access_token.eq.${tokenOrEmail},guest_email.eq.${tokenOrEmail}`);
    }
    const { data, error } = await query.single();
    if (error || !data) {
      const fallback = inMemoryStore.getBookingByCode(bookingCode, tokenOrEmail);
      return fallback || null;
    }
    return data as unknown as Booking;
  },

  async getAllBookings(): Promise<Booking[]> {
    if (isUsingMock) {
      return inMemoryStore.getBookings();
    }
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return inMemoryStore.getBookings();
    }
    return data as unknown as Booking[];
  },

  // RPCs
  async createBookingAtomic(params: {
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
  }) {
    if (isUsingMock) {
      return inMemoryStore.createBookingAtomic(params);
    }
    const { data, error } = await supabase.rpc(
      'create_booking_atomic' as any,
      {
        p_condo_id: params.condo_id,
        p_guest_name: params.guest_name,
        p_guest_email: params.guest_email,
        p_guest_phone: params.guest_phone,
        p_guest_notes: params.guest_notes || null,
        p_check_in: params.check_in,
        p_check_out: params.check_out,
        p_num_adults: params.num_adults,
        p_num_children: params.num_children || 0,
        p_num_infants: params.num_infants || 0,
        p_selected_extras: params.selected_extras || [],
        p_payment_method_id: params.payment_method_id || null,
      } as any
    );

    if (error) throw error;
    return data;
  },

  async submitPaymentProof(params: {
    booking_code: string;
    access_token: string;
    payment_method_id?: string | null;
    payment_reference_number: string;
    payment_proof_url: string;
  }) {
    if (isUsingMock) {
      return inMemoryStore.submitPaymentProof(params);
    }
    const { data, error } = await supabase.rpc(
      'submit_payment_proof' as any,
      {
        p_booking_code: params.booking_code,
        p_access_token: params.access_token,
        p_payment_method_id: params.payment_method_id || null,
        p_payment_reference_number: params.payment_reference_number,
        p_payment_proof_url: params.payment_proof_url,
      } as any
    );
    if (error) throw error;
    return data;
  },

  async verifyBookingPayment(bookingId: string, amountPaid: number, adminNotes?: string) {
    if (isUsingMock) {
      return inMemoryStore.verifyBookingPayment(bookingId, amountPaid, adminNotes);
    }
    const { data, error } = await supabase.rpc(
      'verify_booking_payment' as any,
      {
        p_booking_id: bookingId,
        p_amount_paid: amountPaid,
        p_admin_notes: adminNotes || null,
      } as any
    );
    if (error) throw error;
    return data;
  },

  async rejectBookingPayment(bookingId: string, reason: string) {
    if (isUsingMock) {
      return inMemoryStore.rejectBookingPayment(bookingId, reason);
    }
    const { data, error } = await (supabase.from('bookings') as any)
      .update({
        payment_status: 'rejected',
        booking_status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Booking;
  },

  async checkCondoAvailability(condoId: string, startDate: string, endDate: string) {
    if (isUsingMock) {
      return inMemoryStore.checkCondoAvailability(condoId, startDate, endDate);
    }
    const { data, error } = await supabase.rpc(
      'check_condo_availability' as any,
      {
        p_condo_id: condoId,
        p_start_date: startDate,
        p_end_date: endDate,
      } as any
    );
    if (error) throw error;
    return data;
  },
};

function mapDbCondoToDomain(row: Database['public']['Tables']['condos']['Row']): Condo {
  const images = Array.isArray(row.images)
    ? (row.images as Array<{ url: string; caption?: string }>)
    : [];
  const amenities = Array.isArray(row.amenities)
    ? (row.amenities as string[])
    : [];
  const houseRules = Array.isArray(row.house_rules)
    ? (row.house_rules as string[])
    : [];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    location: row.location,
    images,
    cover_image: row.cover_image,
    max_guests: row.max_guests,
    bedrooms: row.bedrooms,
    bathrooms: Number(row.bathrooms),
    beds_description: row.beds_description,
    floor_area_sqm: row.floor_area_sqm ? Number(row.floor_area_sqm) : null,
    base_price_per_night: Number(row.base_price),
    weekend_price_per_night: Number(row.weekend_price),
    cleaning_fee: Number(row.cleaning_fee),
    reservation_fee_rate: Number(row.reservation_fee_rate),
    security_deposit: Number(row.security_deposit),
    min_stay_nights: row.min_stay_nights,
    max_stay_nights: row.max_stay_nights,
    amenities,
    house_rules: houseRules,
    check_in_time: row.check_in_time,
    check_out_time: row.check_out_time,
    status: row.status,
    is_active: row.status === 'active',
    sort_order: row.sort_order,
  };
}
