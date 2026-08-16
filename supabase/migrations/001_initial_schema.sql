-- ============================================================================
-- CONDOPAL CORE SCHEMA MIGRATION 001: Initial Schema
-- Target: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Utility Functions: Timestamp Update Trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Custom Types / Domain Enums
DO $$ BEGIN
    CREATE TYPE public.condo_status AS ENUM ('active', 'maintenance', 'hidden', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'completed', 'cancelled', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('unpaid', 'pending_payment', 'proof_submitted', 'partial_paid', 'verified', 'fully_paid', 'rejected', 'refunded', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.price_type AS ENUM ('per_stay', 'per_night', 'per_guest', 'per_guest_per_night');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_method_type AS ENUM ('gcash', 'maya', 'bank_transfer', 'credit_card', 'cash_on_arrival');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.admin_role AS ENUM ('superadmin', 'admin', 'manager', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 4. CONDOS / UNITS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.condos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Tagaytay Highlands, Cavite',
    images JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of image URLs with metadata
    cover_image TEXT,
    max_guests INTEGER NOT NULL CHECK (max_guests > 0),
    bedrooms INTEGER NOT NULL DEFAULT 1 CHECK (bedrooms >= 0),
    bathrooms NUMERIC(3,1) NOT NULL DEFAULT 1.0 CHECK (bathrooms > 0),
    beds_description TEXT,
    floor_area_sqm NUMERIC(6,2),
    base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0), -- Weekday rate (Sun-Thu)
    weekend_price NUMERIC(10,2) NOT NULL CHECK (weekend_price >= 0), -- Weekend rate (Fri-Sat)
    cleaning_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (cleaning_fee >= 0),
    reservation_fee_rate NUMERIC(5,4) NOT NULL DEFAULT 0.2000 CHECK (reservation_fee_rate BETWEEN 0.0000 AND 1.0000), -- 20% downpayment
    security_deposit NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (security_deposit >= 0),
    status public.condo_status NOT NULL DEFAULT 'active',
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb, -- ["High-Speed WiFi", "Infinity Pool", "Kitchen", ...]
    house_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    check_in_time TEXT NOT NULL DEFAULT '14:00',
    check_out_time TEXT NOT NULL DEFAULT '11:00',
    min_stay_nights INTEGER NOT NULL DEFAULT 1 CHECK (min_stay_nights >= 1),
    max_stay_nights INTEGER NOT NULL DEFAULT 30 CHECK (max_stay_nights >= min_stay_nights),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_condos_slug ON public.condos (slug);
CREATE INDEX IF NOT EXISTS idx_condos_status ON public.condos (status);

CREATE TRIGGER trg_condos_updated_at
BEFORE UPDATE ON public.condos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 5. EXTRAS / ADD-ONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.extras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    price_type public.price_type NOT NULL DEFAULT 'per_stay',
    icon TEXT, -- Lucide icon identifier (e.g. 'Utensils', 'Car', 'Sparkles')
    category TEXT NOT NULL DEFAULT 'general',
    max_quantity INTEGER NOT NULL DEFAULT 1 CHECK (max_quantity >= 1),
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_extras_enabled ON public.extras (enabled);
CREATE INDEX IF NOT EXISTS idx_extras_sort ON public.extras (sort_order);

CREATE TRIGGER trg_extras_updated_at
BEFORE UPDATE ON public.extras
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 6. PAYMENT METHODS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g. "GCash", "Maya", "BDO Unibank", "BPI"
    type public.payment_method_type NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    qr_code_url TEXT,
    instructions TEXT NOT NULL,
    is_reservation_fee_eligible BOOLEAN NOT NULL DEFAULT true,
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_enabled ON public.payment_methods (enabled);

CREATE TRIGGER trg_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 7. ADMIN PROFILES TABLE (Linked to auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role public.admin_role NOT NULL DEFAULT 'admin',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_profiles_role ON public.admin_profiles (role);

CREATE TRIGGER trg_admin_profiles_updated_at
BEFORE UPDATE ON public.admin_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper function to check if current authenticated user is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid() AND is_active = true
    );
$$;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT role::text FROM public.admin_profiles
    WHERE id = auth.uid() AND is_active = true
    LIMIT 1;
$$;

-- ============================================================================
-- 8. BOOKINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code TEXT UNIQUE NOT NULL, -- e.g. "CP-2026-89A4B"
    condo_id UUID NOT NULL REFERENCES public.condos(id) ON DELETE RESTRICT,
    
    -- Guest Personal Information
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    guest_notes TEXT,
    
    -- Stay Dates and Computed Range
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    stay_range DATERANGE GENERATED ALWAYS AS (daterange(check_in, check_out, '[)')) STORED,
    
    -- Guest Occupancy Details
    num_adults INTEGER NOT NULL CHECK (num_adults > 0),
    num_children INTEGER NOT NULL DEFAULT 0 CHECK (num_children >= 0),
    num_infants INTEGER NOT NULL DEFAULT 0 CHECK (num_infants >= 0),
    total_guests INTEGER GENERATED ALWAYS AS (num_adults + num_children) STORED,
    nights_count INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,
    
    -- Itemized Financial Snapshot
    selected_extras JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of snapshot extra items
    nightly_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of [{date: 'YYYY-MM-DD', rate: 4500, is_weekend: false}]
    base_total NUMERIC(10,2) NOT NULL CHECK (base_total >= 0),
    cleaning_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (cleaning_fee >= 0),
    extras_total NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (extras_total >= 0),
    security_deposit NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (security_deposit >= 0),
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    service_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (service_charge >= 0),
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    
    -- Reservation Fee & Balance
    reservation_fee_required NUMERIC(10,2) NOT NULL CHECK (reservation_fee_required >= 0),
    reservation_fee_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (reservation_fee_paid >= 0),
    balance_due NUMERIC(10,2) NOT NULL CHECK (balance_due >= 0),
    
    -- Payment & Booking Status
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
    booking_status public.booking_status NOT NULL DEFAULT 'pending',
    
    -- Proof of Payment & Verification
    payment_proof_url TEXT,
    payment_reference_number TEXT,
    payment_submitted_at TIMESTAMPTZ,
    admin_notes TEXT,
    rejection_reason TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
    
    -- Guest Secure Token (Cryptographic random token for guest session management)
    access_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
    hold_expires_at TIMESTAMPTZ, -- Optional expiration for unconfirmed holds
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Basic Sanity Checks
    CONSTRAINT check_dates_validity CHECK (check_out > check_in),
    CONSTRAINT check_reservation_fee_lte_total CHECK (reservation_fee_required <= total_amount)
);

CREATE INDEX IF NOT EXISTS idx_bookings_code ON public.bookings (booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_condo_id ON public.bookings (condo_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_email ON public.bookings (guest_email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (booking_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings (check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_access_token ON public.bookings (access_token);

CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 9. APP SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL, -- e.g. 'general', 'contact', 'booking_policy', 'appearance'
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID
);

CREATE TRIGGER trg_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 10. AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'booking', 'condo', 'extra', 'payment_method', 'setting'
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'status_change', 'payment_proof_uploaded', 'payment_verified', 'payment_rejected', 'cancel'
    actor_id UUID,
    actor_role TEXT NOT NULL DEFAULT 'guest',
    actor_ip TEXT,
    actor_user_agent TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
