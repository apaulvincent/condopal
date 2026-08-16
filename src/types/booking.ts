import type {
  CondoStatus,
  BookingStatus,
  PaymentStatus,
  ExtraPriceType,
  PaymentMethodType,
} from './database.types';

export type {
  CondoStatus,
  BookingStatus,
  PaymentStatus,
  ExtraPriceType,
  PaymentMethodType,
};

export interface CondoImage {
  url: string;
  caption?: string;
}

export interface Condo {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  description: string;
  location: string;
  images: CondoImage[];
  cover_image?: string | null;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  beds_description?: string | null;
  floor_area_sqm?: number | null;
  base_price_per_night: number; // mapping from base_price
  weekend_price_per_night: number; // mapping from weekend_price
  cleaning_fee: number;
  reservation_fee_rate: number; // e.g. 0.20 (20%)
  security_deposit: number;
  min_stay_nights: number;
  max_stay_nights: number;
  amenities: string[];
  house_rules: string[];
  check_in_time: string;
  check_out_time: string;
  status: CondoStatus;
  is_active: boolean;
  sort_order: number;
}

export interface Extra {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  price_type: ExtraPriceType;
  icon: string;
  category: string;
  max_quantity: number;
  is_enabled: boolean;
  sort_order: number;
}

export interface SelectedExtra {
  extra_id: string;
  quantity: number;
}

export interface ItemizedExtra {
  extra_id: string;
  name: string;
  slug?: string;
  quantity: number;
  unit_price: number;
  price_type: ExtraPriceType;
  total_price: number;
}

export interface NightlyRate {
  date: string; // YYYY-MM-DD
  rate: number;
  is_weekend: boolean;
  seasonal_multiplier?: number;
  season_name?: string;
}

export interface PriceBreakdown {
  nights: number;
  base_lodging_total: number;
  weekend_surcharge_total: number;
  seasonal_surcharge_total: number;
  length_of_stay_discount: number;
  length_of_stay_discount_percent: number;
  lodging_subtotal: number;
  cleaning_fee: number;
  security_deposit: number;
  extras_total: number;
  itemized_extras: ItemizedExtra[];
  subtotal: number;
  service_charge: number;
  tax_amount: number;
  total_amount: number;
  reservation_fee_amount: number;
  remaining_balance_amount: number;
  nightly_rates: NightlyRate[];
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  account_name: string;
  account_number: string;
  qr_code_url?: string | null;
  instructions: string;
  is_reservation_fee_eligible: boolean;
  is_enabled: boolean;
  sort_order: number;
}

export interface Booking {
  id: string;
  booking_code: string;
  access_token: string;
  condo_id: string;
  condo?: Condo;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_notes?: string | null;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  num_adults: number;
  num_children: number;
  num_infants: number;
  selected_extras: SelectedExtra[];
  pricing_breakdown: PriceBreakdown;
  base_total: number;
  cleaning_fee: number;
  extras_total: number;
  security_deposit: number;
  discount_amount: number;
  total_amount: number;
  reservation_fee: number;
  reservation_fee_paid: number;
  balance_due: number;
  payment_method_id?: string | null;
  payment_method?: PaymentMethod;
  payment_reference_number?: string | null;
  payment_proof_url?: string | null;
  payment_submitted_at?: string | null;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  admin_notes?: string | null;
  rejection_reason?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  hold_expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type BookingStep = 1 | 2 | 3 | 4 | 5;

export interface BookingWizardState {
  currentStep: BookingStep;
  condoId: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestNotes: string;
  checkIn: string | null; // YYYY-MM-DD
  checkOut: string | null; // YYYY-MM-DD
  numAdults: number;
  numChildren: number;
  numInfants: number;
  selectedExtras: SelectedExtra[];
  paymentMethodId: string | null;
  paymentReferenceNumber: string;
  paymentProofUrl: string | null;
  agreeToHouseRules: boolean;
}

export interface SeasonalRule {
  id?: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  multiplier: number; // e.g. 1.25 for +25%
}
