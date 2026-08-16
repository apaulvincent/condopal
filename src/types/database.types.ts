export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CondoStatus = 'active' | 'maintenance' | 'hidden' | 'archived';
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled' | 'rejected' | 'expired';
export type PaymentStatus = 'unpaid' | 'pending_payment' | 'proof_submitted' | 'partial_paid' | 'verified' | 'fully_paid' | 'rejected' | 'refunded' | 'cancelled';
export type ExtraPriceType = 'per_stay' | 'per_night' | 'per_guest' | 'per_guest_per_night';
export type PaymentMethodType = 'gcash' | 'maya' | 'bank_transfer' | 'credit_card' | 'cash_on_arrival';
export type AdminRole = 'superadmin' | 'admin' | 'manager' | 'staff';

export interface Database {
  public: {
    Tables: {
      condos: {
        Row: {
          id: string;
          slug: string;
          name: string;
          tagline: string | null;
          description: string;
          location: string;
          images: Json; // Array of {url: string, caption?: string}
          cover_image: string | null;
          max_guests: number;
          bedrooms: number;
          bathrooms: number;
          beds_description: string | null;
          floor_area_sqm: number | null;
          base_price: number;
          weekend_price: number;
          cleaning_fee: number;
          reservation_fee_rate: number;
          security_deposit: number;
          status: CondoStatus;
          amenities: Json; // string[]
          house_rules: Json; // string[]
          check_in_time: string;
          check_out_time: string;
          min_stay_nights: number;
          max_stay_nights: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          tagline?: string | null;
          description: string;
          location?: string;
          images?: Json;
          cover_image?: string | null;
          max_guests: number;
          bedrooms?: number;
          bathrooms?: number;
          beds_description?: string | null;
          floor_area_sqm?: number | null;
          base_price: number;
          weekend_price: number;
          cleaning_fee?: number;
          reservation_fee_rate?: number;
          security_deposit?: number;
          status?: CondoStatus;
          amenities?: Json;
          house_rules?: Json;
          check_in_time?: string;
          check_out_time?: string;
          min_stay_nights?: number;
          max_stay_nights?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          tagline?: string | null;
          description?: string;
          location?: string;
          images?: Json;
          cover_image?: string | null;
          max_guests?: number;
          bedrooms?: number;
          bathrooms?: number;
          beds_description?: string | null;
          floor_area_sqm?: number | null;
          base_price?: number;
          weekend_price?: number;
          cleaning_fee?: number;
          reservation_fee_rate?: number;
          security_deposit?: number;
          status?: CondoStatus;
          amenities?: Json;
          house_rules?: Json;
          check_in_time?: string;
          check_out_time?: string;
          min_stay_nights?: number;
          max_stay_nights?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      extras: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          price_type: ExtraPriceType;
          icon: string | null;
          category: string;
          max_quantity: number;
          enabled: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          price_type?: ExtraPriceType;
          icon?: string | null;
          category?: string;
          max_quantity?: number;
          enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          price_type?: ExtraPriceType;
          icon?: string | null;
          category?: string;
          max_quantity?: number;
          enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_methods: {
        Row: {
          id: string;
          name: string;
          type: PaymentMethodType;
          account_name: string;
          account_number: string;
          qr_code_url: string | null;
          instructions: string;
          is_reservation_fee_eligible: boolean;
          enabled: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: PaymentMethodType;
          account_name: string;
          account_number: string;
          qr_code_url?: string | null;
          instructions: string;
          is_reservation_fee_eligible?: boolean;
          enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: PaymentMethodType;
          account_name?: string;
          account_number?: string;
          qr_code_url?: string | null;
          instructions?: string;
          is_reservation_fee_eligible?: boolean;
          enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: AdminRole;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: AdminRole;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: AdminRole;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          booking_code: string;
          condo_id: string;
          guest_name: string;
          guest_email: string;
          guest_phone: string;
          guest_notes: string | null;
          check_in: string; // YYYY-MM-DD
          check_out: string; // YYYY-MM-DD
          stay_range?: unknown; // DATERANGE in PostgreSQL
          num_adults: number;
          num_children: number;
          num_infants: number;
          total_guests?: number;
          nights_count?: number;
          selected_extras: Json;
          nightly_breakdown: Json;
          base_total: number;
          cleaning_fee: number;
          extras_total: number;
          security_deposit: number;
          discount_amount: number;
          tax_amount: number;
          service_charge: number;
          total_amount: number;
          reservation_fee_required: number;
          reservation_fee_paid: number;
          balance_due: number;
          payment_method_id: string | null;
          payment_status: PaymentStatus;
          booking_status: BookingStatus;
          payment_proof_url: string | null;
          payment_reference_number: string | null;
          payment_submitted_at: string | null;
          admin_notes: string | null;
          rejection_reason: string | null;
          verified_at: string | null;
          verified_by: string | null;
          access_token: string;
          hold_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_code: string;
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
          selected_extras?: Json;
          nightly_breakdown?: Json;
          base_total: number;
          cleaning_fee?: number;
          extras_total?: number;
          security_deposit?: number;
          discount_amount?: number;
          tax_amount?: number;
          service_charge?: number;
          total_amount: number;
          reservation_fee_required: number;
          reservation_fee_paid?: number;
          balance_due: number;
          payment_method_id?: string | null;
          payment_status?: PaymentStatus;
          booking_status?: BookingStatus;
          payment_proof_url?: string | null;
          payment_reference_number?: string | null;
          payment_submitted_at?: string | null;
          admin_notes?: string | null;
          rejection_reason?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          access_token?: string;
          hold_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_code?: string;
          condo_id?: string;
          guest_name?: string;
          guest_email?: string;
          guest_phone?: string;
          guest_notes?: string | null;
          check_in?: string;
          check_out?: string;
          num_adults?: number;
          num_children?: number;
          num_infants?: number;
          selected_extras?: Json;
          nightly_breakdown?: Json;
          base_total?: number;
          cleaning_fee?: number;
          extras_total?: number;
          security_deposit?: number;
          discount_amount?: number;
          tax_amount?: number;
          service_charge?: number;
          total_amount?: number;
          reservation_fee_required?: number;
          reservation_fee_paid?: number;
          balance_due?: number;
          payment_method_id?: string | null;
          payment_status?: PaymentStatus;
          booking_status?: BookingStatus;
          payment_proof_url?: string | null;
          payment_reference_number?: string | null;
          payment_submitted_at?: string | null;
          admin_notes?: string | null;
          rejection_reason?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          access_token?: string;
          hold_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      app_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          actor_id: string | null;
          actor_role: string;
          actor_ip: string | null;
          actor_user_agent: string | null;
          old_values: Json | null;
          new_values: Json | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          action: string;
          actor_id?: string | null;
          actor_role?: string;
          actor_ip?: string | null;
          actor_user_agent?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          action?: string;
          actor_id?: string | null;
          actor_role?: string;
          actor_ip?: string | null;
          actor_user_agent?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
    Functions: {
      create_booking_atomic: {
        Args: {
          p_condo_id: string;
          p_guest_name: string;
          p_guest_email: string;
          p_guest_phone: string;
          p_guest_notes?: string | null;
          p_check_in: string;
          p_check_out: string;
          p_num_adults: number;
          p_num_children?: number;
          p_num_infants?: number;
          p_selected_extras?: Json;
          p_payment_method_id?: string | null;
          p_client_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: Json;
      };
      check_condo_availability: {
        Args: {
          p_condo_id: string;
          p_start_date: string;
          p_end_date: string;
        };
        Returns: Json;
      };
      submit_payment_proof: {
        Args: {
          p_booking_code: string;
          p_access_token: string;
          p_payment_method_id?: string | null;
          p_payment_reference_number: string;
          p_payment_proof_url: string;
          p_client_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: Json;
      };
      verify_booking_payment: {
        Args: {
          p_booking_id: string;
          p_amount_paid: number;
          p_admin_notes?: string | null;
        };
        Returns: Json;
      };
    };
  };
}
