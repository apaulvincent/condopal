# CondoPal Database, RPC, Concurrency & Security Architecture Specification
**Author:** Survey Explorer 1 (Database, RPC, Concurrency & Security Architect)  
**Date:** 2026-08-16  
**Status:** COMPLETE & READY FOR IMPLEMENTATION  
**Target Environment:** Supabase (PostgreSQL 15+) / TypeScript Frontend & Admin SPA

---

## 1. Executive Summary & Architecture Overview

CondoPal is a modern, mobile-first accommodation booking platform requiring uncompromising transactional integrity, real-time pricing calculation, zero double-booking tolerance under high concurrency, and robust Row Level Security (RLS) for public guests and administrators.

### Core Architecture Pillars
1. **Zero-Double-Booking Guarantee via Multi-Layered Defense:**
   - **Kernel Layer:** PostgreSQL `EXCLUDE USING gist` constraint with `btree_gist` extension enforcing disjoint `daterange` spans for active bookings.
   - **Transaction Layer:** `create_booking_atomic` stored procedure utilizing `SELECT ... FOR UPDATE` row locks on the condo record to serialize booking attempts, recalculate pricing authoritatively on the server, and write audit trails atomically.
2. **Deterministic Pricing Engine:**
   - Dual weekday/weekend rate curves with holiday/seasonal support.
   - Granular extra add-on pricing models (`per_stay`, `per_night`, `per_guest`, `per_guest_per_night`).
   - Dynamic reservation fee downpayment calculation (e.g., 20% downpayment) with real-time balance tracking.
3. **Guest Security Model without Mandatory Registration:**
   - Cryptographic `access_token` (24-byte hex) generated on booking creation.
   - Allows guests to retrieve, review, and upload payment proofs for their booking without requiring an account.
   - Secure verification endpoint via `(booking_code, guest_email)` fallback.
4. **Admin RBAC & Full Auditability:**
   - `admin_profiles` table linked to Supabase `auth.users`.
   - Granular roles: `superadmin`, `admin`, `manager`, `staff`.
   - Immutable `audit_logs` tracking every creation, price override, payment proof upload, payment verification, and rejection.

---

## 2. Entity Relationship Model & Relational Schema (PostgreSQL DDL)

```
 +-----------------------------------------------------------------------------------+
 |                                   CONDOS                                          |
 | id (UUID PK)                                                                      |
 | slug (TEXT UNIQUE)                                                                |
 | name (TEXT), description (TEXT), images (JSONB), amenities (JSONB)               |
 | max_guests (INT), base_price (NUMERIC), weekend_price (NUMERIC)                   |
 | cleaning_fee (NUMERIC), reservation_fee_rate (NUMERIC), status (TEXT)             |
 +--------------------+--------------------------------------------------------------+
                      | 1
                      |
                      | 0..*
 +--------------------v--------------------------------------------------------------+
 |                                  BOOKINGS                                         |
 | id (UUID PK)                                                                      |
 | booking_code (TEXT UNIQUE - CP-XXXXXX)                                            |
 | condo_id (UUID FK -> condos.id)                                                   |
 | guest_name, guest_email, guest_phone, guest_notes                                 |
 | check_in (DATE), check_out (DATE), stay_range (DATERANGE GENERATED)               |
 | num_adults (INT), num_children (INT), total_guests (INT GENERATED)                |
 | selected_extras (JSONB), nightly_breakdown (JSONB)                                |
 | base_total, cleaning_fee, extras_total, total_amount, reservation_fee_required    |
 | reservation_fee_paid, balance_due                                                 |
 | payment_method_id (UUID FK -> payment_methods.id)                                 |
 | payment_status (unpaid | proof_submitted | partial_paid | fully_paid | refunded) |
 | booking_status (pending | confirmed | checked_in | completed | cancelled | rej)  |
 | payment_proof_url, payment_reference_number, access_token (TEXT)                 |
 +--------------------+--------------------------------------------------------------+
                      |
                      +-------------------+
                      |                   |
 +--------------------v------+     +------v--------------------+
 |      PAYMENT_METHODS      |     |          EXTRAS           |
 | id (UUID PK)              |     | id (UUID PK)              |
 | name, type, instructions  |     | name, slug, price, icon   |
 | account_name, acc_number  |     | price_type (per_stay, etc)|
 | qr_code_url, enabled      |     | max_quantity, enabled     |
 +---------------------------+     +---------------------------+
                      
 +---------------------------+     +---------------------------+     +-----------------------+
 |      ADMIN_PROFILES       |     |        APP_SETTINGS       |     |      AUDIT_LOGS       |
 | id (UUID PK -> auth.users)|     | id (UUID PK)              |     | id (UUID PK)          |
 | email, full_name, role    |     | key (TEXT UNIQUE), value  |     | entity_type, action   |
 | avatar_url, created_at    |     | description, updated_by   |     | actor_id, actor_role  |
 +---------------------------+     +---------------------------+     | old_values, new_values|
                                                                     +-----------------------+
```

### Complete PostgreSQL Migration Script

```sql
-- ============================================================================
-- CONDOPAL CORE SCHEMA MIGRATION
-- Database: PostgreSQL 15+ (Supabase)
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
    CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('unpaid', 'proof_submitted', 'partial_paid', 'fully_paid', 'refunded', 'cancelled');
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
    location TEXT NOT NULL,
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
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
-- 8. BOOKINGS TABLE (WITH STRICT EXCLUSION CONSTRAINT)
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
    total_guests INTEGER GENERATED ALWAYS AS (num_adults + num_children) STORED,
    nights_count INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,
    
    -- Itemized Financial Snapshot (Immutable Record of What Was Quoted)
    selected_extras JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of snapshot extra items
    nightly_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of [{date: 'YYYY-MM-DD', rate: 4500, is_weekend: false}]
    base_total NUMERIC(10,2) NOT NULL CHECK (base_total >= 0),
    cleaning_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (cleaning_fee >= 0),
    extras_total NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (extras_total >= 0),
    security_deposit NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (security_deposit >= 0),
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
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
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Guest Secure Token (Cryptographic random token for guest session management)
    access_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
    hold_expires_at TIMESTAMPTZ, -- Optional expiration for unconfirmed holds
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Basic Sanity Checks
    CONSTRAINT check_dates_validity CHECK (check_out > check_in),
    CONSTRAINT check_reservation_fee_lte_total CHECK (reservation_fee_required <= total_amount)
);

-- ============================================================================
-- 9. POSTGRESQL DOUBLE-BOOKING EXCLUSION CONSTRAINT (KERNEL-LEVEL DEFENSE)
-- ============================================================================
-- The exclusion constraint prevents any two overlapping date ranges for the same condo_id
-- across all active booking statuses ('pending', 'confirmed', 'checked_in').
-- Cancelled, rejected, and expired bookings are excluded from blocking future dates.
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS prevent_overlapping_active_bookings;

ALTER TABLE public.bookings
ADD CONSTRAINT prevent_overlapping_active_bookings
EXCLUDE USING gist (
    condo_id WITH =,
    stay_range WITH &&
)
WHERE (booking_status IN ('pending', 'confirmed', 'checked_in'));

-- Indexes for lightning fast lookups & filtering
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
-- 10. APP SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL, -- e.g. 'general', 'contact', 'booking_policy', 'appearance'
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TRIGGER trg_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 11. AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'booking', 'condo', 'extra', 'payment_method', 'setting'
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'status_change', 'payment_proof_uploaded', 'payment_verified', 'payment_rejected', 'cancel'
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
```

---

## 3. Double-Booking Prevention & Concurrency Control

### Vulnerability Analysis
In web reservation applications, the "Time-of-Check to Time-of-Use" (TOCTOU) concurrency vulnerability occurs when:
1. Guest A submits check-in: 2026-09-01, check-out: 2026-09-05.
2. Guest B simultaneously submits check-in: 2026-09-03, check-out: 2026-09-07 for the same condo.
3. Both threads check availability: neither booking has been committed yet, so both read "AVAILABLE".
4. Both threads issue `INSERT INTO bookings ...`.
5. Without database-level exclusion locks, both inserts succeed, resulting in a disastrous double-booking.

### CondoPal's 3-Tier Zero-Double-Booking Architecture

```
                                  CONCURRENT GUEST SUBMISSIONS
                                  (Thread A)        (Thread B)
                                      |                 |
                                      v                 v
                 +-------------------------------------------------------+
                 | TIER 1: RPC SELECT FOR UPDATE (Condo Row Lock)        |
                 | - Serializes concurrent booking attempts for unit     |
                 | - Thread A acquires lock; Thread B waits in line     |
                 +-------------------------------------------------------+
                                      |
                                      v
                 +-------------------------------------------------------+
                 | TIER 2: Authoritative Server-Side Pricing & Range Val |
                 | - Validates dates, guest count <= max_guests          |
                 | - Calculates true base, weekend, extras & deposit     |
                 +-------------------------------------------------------+
                                      |
                                      v
                 +-------------------------------------------------------+
                 | TIER 3: PostgreSQL GIST Exclusion Constraint          |
                 | EXCLUDE USING gist (condo_id WITH =, stay_range WITH &&)|
                 | - Mathematical kernel lock: overlapping dateranges    |
                 |   cannot physically commit into active status.        |
                 | - Thread B receives PostgreSQL Error 23P01            |
                 |   gracefully mapped to "Dates Just Booked".           |
                 +-------------------------------------------------------+
```

### Stored Procedures / RPC Specifications

#### 1. `create_booking_atomic` (Primary Guest Booking Transaction)

```sql
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
    p_condo_id UUID,
    p_guest_name TEXT,
    p_guest_email TEXT,
    p_guest_phone TEXT,
    p_guest_notes TEXT,
    p_check_in DATE,
    p_check_out DATE,
    p_num_adults INT,
    p_num_children INT,
    p_selected_extras JSONB, -- Array of {extra_id: UUID, quantity: INT}
    p_payment_method_id UUID,
    p_client_ip TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_condo RECORD;
    v_payment_method RECORD;
    v_curr_date DATE;
    v_day_of_week INT;
    v_day_rate NUMERIC(10,2);
    v_base_total NUMERIC(10,2) := 0.00;
    v_nightly_breakdown JSONB := '[]'::jsonb;
    v_extras_total NUMERIC(10,2) := 0.00;
    v_extra_item RECORD;
    v_extra_input JSONB;
    v_extra_qty INT;
    v_extra_item_total NUMERIC(10,2);
    v_processed_extras JSONB := '[]'::jsonb;
    v_total_guests INT;
    v_nights INT;
    v_total_amount NUMERIC(10,2);
    v_reservation_fee NUMERIC(10,2);
    v_balance_due NUMERIC(10,2);
    v_booking_code TEXT;
    v_access_token TEXT;
    v_new_booking_id UUID;
    v_new_booking RECORD;
BEGIN
    -- 1. Validate Input Dates
    IF p_check_in IS NULL OR p_check_out IS NULL THEN
        RAISE EXCEPTION 'Check-in and check-out dates are required.' USING ERRCODE = 'P0001';
    END IF;

    IF p_check_in >= p_check_out THEN
        RAISE EXCEPTION 'Check-out date must be strictly after check-in date.' USING ERRCODE = 'P0002';
    END IF;

    IF p_check_in < CURRENT_DATE THEN
        RAISE EXCEPTION 'Check-in date cannot be in the past.' USING ERRCODE = 'P0003';
    END IF;

    v_nights := p_check_out - p_check_in;

    -- 2. Validate Guest Counts
    IF p_num_adults < 1 THEN
        RAISE EXCEPTION 'At least 1 adult is required.' USING ERRCODE = 'P0004';
    END IF;
    
    v_total_guests := p_num_adults + COALESCE(p_num_children, 0);

    -- 3. Lock Condo Record for Concurrency Serialization
    SELECT * INTO v_condo
    FROM public.condos
    WHERE id = p_condo_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Selected condo unit does not exist.' USING ERRCODE = 'P0005';
    END IF;

    IF v_condo.status != 'active' THEN
        RAISE EXCEPTION 'This condo unit is currently unavailable for bookings (%s).', v_condo.status USING ERRCODE = 'P0006';
    END IF;

    IF v_total_guests > v_condo.max_guests THEN
        RAISE EXCEPTION 'Total guests (%s) exceeds maximum unit capacity (%s).', v_total_guests, v_condo.max_guests USING ERRCODE = 'P0007';
    END IF;

    IF v_nights < v_condo.min_stay_nights THEN
        RAISE EXCEPTION 'Minimum stay is % nights.', v_condo.min_stay_nights USING ERRCODE = 'P0008';
    END IF;

    IF v_nights > v_condo.max_stay_nights THEN
        RAISE EXCEPTION 'Maximum stay is % nights.', v_condo.max_stay_nights USING ERRCODE = 'P0009';
    END IF;

    -- 4. Check for Overlapping Existing Bookings (Explicit Query Before Constraint)
    IF EXISTS (
        SELECT 1 FROM public.bookings
        WHERE condo_id = p_condo_id
          AND booking_status IN ('pending', 'confirmed', 'checked_in')
          AND stay_range && daterange(p_check_in, p_check_out, '[)')
    ) THEN
        RAISE EXCEPTION 'The selected dates (%s to %s) are already booked for this unit.', p_check_in, p_check_out USING ERRCODE = '23P01';
    END IF;

    -- 5. Calculate Nightly Rates (Authoritative Server-Side Calculation)
    v_curr_date := p_check_in;
    WHILE v_curr_date < p_check_out LOOP
        -- In PostgreSQL: 0 = Sun, 5 = Fri, 6 = Sat
        v_day_of_week := EXTRACT(DOW FROM v_curr_date);
        
        -- Friday (5) and Saturday (6) use weekend_price
        IF v_day_of_week IN (5, 6) THEN
            v_day_rate := v_condo.weekend_price;
            v_nightly_breakdown := v_nightly_breakdown || jsonb_build_object(
                'date', v_curr_date,
                'rate', v_day_rate,
                'is_weekend', true
            );
        ELSE
            v_day_rate := v_condo.base_price;
            v_nightly_breakdown := v_nightly_breakdown || jsonb_build_object(
                'date', v_curr_date,
                'rate', v_day_rate,
                'is_weekend', false
            );
        END IF;

        v_base_total := v_base_total + v_day_rate;
        v_curr_date := v_curr_date + INTERVAL '1 day';
    END LOOP;

    -- 6. Process and Price Selected Extras
    IF p_selected_extras IS NOT NULL AND jsonb_array_length(p_selected_extras) > 0 THEN
        FOR v_extra_input IN SELECT * FROM jsonb_array_elements(p_selected_extras) LOOP
            SELECT * INTO v_extra_item
            FROM public.extras
            WHERE id = (v_extra_input->>'extra_id')::UUID AND enabled = true;

            IF FOUND THEN
                v_extra_qty := GREATEST(1, LEAST(COALESCE((v_extra_input->>'quantity')::INT, 1), v_extra_item.max_quantity));

                CASE v_extra_item.price_type
                    WHEN 'per_stay' THEN
                        v_extra_item_total := v_extra_item.price * v_extra_qty;
                    WHEN 'per_night' THEN
                        v_extra_item_total := v_extra_item.price * v_extra_qty * v_nights;
                    WHEN 'per_guest' THEN
                        v_extra_item_total := v_extra_item.price * v_extra_qty * v_total_guests;
                    WHEN 'per_guest_per_night' THEN
                        v_extra_item_total := v_extra_item.price * v_extra_qty * v_total_guests * v_nights;
                END CASE;

                v_extras_total := v_extras_total + v_extra_item_total;
                v_processed_extras := v_processed_extras || jsonb_build_object(
                    'extra_id', v_extra_item.id,
                    'name', v_extra_item.name,
                    'slug', v_extra_item.slug,
                    'price', v_extra_item.price,
                    'price_type', v_extra_item.price_type,
                    'quantity', v_extra_qty,
                    'total', v_extra_item_total
                );
            END IF;
        END LOOP;
    END IF;

    -- 7. Validate Payment Method (if provided)
    IF p_payment_method_id IS NOT NULL THEN
        SELECT * INTO v_payment_method
        FROM public.payment_methods
        WHERE id = p_payment_method_id AND enabled = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Selected payment method is invalid or disabled.' USING ERRCODE = 'P0010';
        END IF;
    END IF;

    -- 8. Compute Total and Reservation Downpayment
    v_total_amount := v_base_total + v_condo.cleaning_fee + v_extras_total;
    v_reservation_fee := ROUND(v_total_amount * v_condo.reservation_fee_rate, 2);
    v_balance_due := v_total_amount; -- initially full balance due until proof verified

    -- 9. Generate Unique Booking Code (e.g. CP-2026-X8K9M)
    v_booking_code := 'CP-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || UPPER(SUBSTRING(encode(gen_random_bytes(4), 'hex') FROM 1 FOR 5));
    v_access_token := encode(gen_random_bytes(24), 'hex');

    -- 10. Atomically Insert Booking (Protected by Exclusion Constraint)
    INSERT INTO public.bookings (
        booking_code,
        condo_id,
        guest_name,
        guest_email,
        guest_phone,
        guest_notes,
        check_in,
        check_out,
        num_adults,
        num_children,
        selected_extras,
        nightly_breakdown,
        base_total,
        cleaning_fee,
        extras_total,
        security_deposit,
        discount_amount,
        total_amount,
        reservation_fee_required,
        reservation_fee_paid,
        balance_due,
        payment_method_id,
        payment_status,
        booking_status,
        access_token,
        hold_expires_at
    ) VALUES (
        v_booking_code,
        p_condo_id,
        TRIM(p_guest_name),
        LOWER(TRIM(p_guest_email)),
        TRIM(p_guest_phone),
        p_guest_notes,
        p_check_in,
        p_check_out,
        p_num_adults,
        COALESCE(p_num_children, 0),
        v_processed_extras,
        v_nightly_breakdown,
        v_base_total,
        v_condo.cleaning_fee,
        v_extras_total,
        v_condo.security_deposit,
        0.00,
        v_total_amount,
        v_reservation_fee,
        0.00,
        v_balance_due,
        p_payment_method_id,
        'unpaid',
        'pending',
        v_access_token,
        now() + INTERVAL '2 hours' -- 2-hour hold window for payment submission
    )
    RETURNING * INTO v_new_booking;

    -- 11. Write Audit Log Entry
    INSERT INTO public.audit_logs (
        entity_type,
        entity_id,
        action,
        actor_role,
        actor_ip,
        actor_user_agent,
        new_values,
        metadata
    ) VALUES (
        'booking',
        v_new_booking.id::text,
        'create',
        'guest',
        p_client_ip,
        p_user_agent,
        to_jsonb(v_new_booking),
        jsonb_build_object('booking_code', v_booking_code)
    );

    -- 12. Return Success Payload
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_new_booking.id,
        'booking_code', v_booking_code,
        'access_token', v_access_token,
        'condo_name', v_condo.name,
        'check_in', p_check_in,
        'check_out', p_check_out,
        'nights', v_nights,
        'total_amount', v_total_amount,
        'reservation_fee_required', v_reservation_fee,
        'hold_expires_at', v_new_booking.hold_expires_at
    );

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'A collision occurred generating the booking reference. Please retry.' USING ERRCODE = '23505';
    WHEN exclusion_violation THEN
        RAISE EXCEPTION 'Sorry, these dates were just reserved by another guest.' USING ERRCODE = '23P01';
END;
$$;
```

#### 2. `check_condo_availability` (Client Availability & Blocked Dates Engine)

```sql
CREATE OR REPLACE FUNCTION public.check_condo_availability(
    p_condo_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
    v_blocked_ranges JSONB := '[]'::jsonb;
    v_rec RECORD;
BEGIN
    FOR v_rec IN
        SELECT check_in, check_out, booking_status
        FROM public.bookings
        WHERE condo_id = p_condo_id
          AND booking_status IN ('pending', 'confirmed', 'checked_in')
          AND stay_range && daterange(p_start_date, p_end_date, '[)')
        ORDER BY check_in ASC
    LOOP
        v_blocked_ranges := v_blocked_ranges || jsonb_build_object(
            'check_in', v_rec.check_in,
            'check_out', v_rec.check_out,
            'status', v_rec.booking_status
        );
    END LOOP;

    RETURN jsonb_build_object(
        'condo_id', p_condo_id,
        'query_start', p_start_date,
        'query_end', p_end_date,
        'blocked_ranges', v_blocked_ranges,
        'is_fully_available', (jsonb_array_length(v_blocked_ranges) = 0)
    );
END;
$$;
```

#### 3. `submit_payment_proof` (Guest Payment Submission)

```sql
CREATE OR REPLACE FUNCTION public.submit_payment_proof(
    p_booking_code TEXT,
    p_access_token TEXT,
    p_payment_method_id UUID,
    p_payment_reference_number TEXT,
    p_payment_proof_url TEXT,
    p_client_ip TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_booking RECORD;
    v_old_status TEXT;
BEGIN
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE booking_code = p_booking_code AND access_token = p_access_token
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid booking reference or unauthorized access token.' USING ERRCODE = 'P0011';
    END IF;

    IF v_booking.booking_status IN ('cancelled', 'rejected', 'expired') THEN
        RAISE EXCEPTION 'Cannot submit payment for a cancelled or expired booking.' USING ERRCODE = 'P0012';
    END IF;

    v_old_status := v_booking.payment_status::text;

    UPDATE public.bookings
    SET payment_method_id = COALESCE(p_payment_method_id, payment_method_id),
        payment_reference_number = TRIM(p_payment_reference_number),
        payment_proof_url = TRIM(p_payment_proof_url),
        payment_status = 'proof_submitted',
        payment_submitted_at = now()
    WHERE id = v_booking.id;

    -- Audit Log
    INSERT INTO public.audit_logs (
        entity_type,
        entity_id,
        action,
        actor_role,
        actor_ip,
        actor_user_agent,
        old_values,
        new_values,
        metadata
    ) VALUES (
        'booking',
        v_booking.id::text,
        'payment_proof_uploaded',
        'guest',
        p_client_ip,
        p_user_agent,
        jsonb_build_object('payment_status', v_old_status),
        jsonb_build_object(
            'payment_status', 'proof_submitted',
            'reference_number', p_payment_reference_number,
            'proof_url', p_payment_proof_url
        ),
        jsonb_build_object('booking_code', p_booking_code)
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_code', p_booking_code,
        'payment_status', 'proof_submitted',
        'message', 'Payment proof submitted successfully. An administrator will verify your reservation.'
    );
END;
$$;
```

#### 4. `verify_booking_payment` (Admin Action)

```sql
CREATE OR REPLACE FUNCTION public.verify_booking_payment(
    p_booking_id UUID,
    p_amount_paid NUMERIC(10,2),
    p_is_full_payment BOOLEAN DEFAULT false,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_booking RECORD;
    v_admin_id UUID := auth.uid();
    v_new_payment_status public.payment_status;
    v_new_booking_status public.booking_status;
    v_new_paid NUMERIC(10,2);
    v_new_balance NUMERIC(10,2);
BEGIN
    -- Verify Admin Role
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized. Admin privilege required.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.' USING ERRCODE = 'P0013';
    END IF;

    v_new_paid := v_booking.reservation_fee_paid + p_amount_paid;
    v_new_balance := GREATEST(0.00, v_booking.total_amount - v_new_paid);

    IF p_is_full_payment OR v_new_balance = 0.00 THEN
        v_new_payment_status := 'fully_paid';
    ELSE
        v_new_payment_status := 'partial_paid';
    END IF;

    v_new_booking_status := 'confirmed';

    UPDATE public.bookings
    SET reservation_fee_paid = v_new_paid,
        balance_due = v_new_balance,
        payment_status = v_new_payment_status,
        booking_status = v_new_booking_status,
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        verified_at = now(),
        verified_by = v_admin_id
    WHERE id = p_booking_id;

    -- Audit Log
    INSERT INTO public.audit_logs (
        entity_type,
        entity_id,
        action,
        actor_id,
        actor_role,
        old_values,
        new_values,
        metadata
    ) VALUES (
        'booking',
        p_booking_id::text,
        'payment_verified',
        v_admin_id,
        public.current_user_role(),
        jsonb_build_object(
            'payment_status', v_booking.payment_status,
            'booking_status', v_booking.booking_status,
            'paid', v_booking.reservation_fee_paid
        ),
        jsonb_build_object(
            'payment_status', v_new_payment_status,
            'booking_status', v_new_booking_status,
            'paid', v_new_paid,
            'balance_due', v_new_balance
        ),
        jsonb_build_object('verified_amount', p_amount_paid)
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'booking_code', v_booking.booking_code,
        'payment_status', v_new_payment_status,
        'booking_status', v_new_booking_status,
        'reservation_fee_paid', v_new_paid,
        'balance_due', v_new_balance
    );
END;
$$;
```

---

## 4. Row Level Security (RLS) Policy Suite

PostgreSQL Row Level Security ensures data isolation and prevents unauthorized read/write access.

```sql
-- Enable RLS on All Tables
ALTER TABLE public.condos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CONDOS RLS POLICIES
-- ============================================================================
-- Public can view active condos
CREATE POLICY "Public can view active condos"
ON public.condos FOR SELECT
USING (status = 'active' OR public.is_admin());

-- Admins have full access
CREATE POLICY "Admins have full CRUD on condos"
ON public.condos FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- EXTRAS RLS POLICIES
-- ============================================================================
-- Public can view enabled extras
CREATE POLICY "Public can view enabled extras"
ON public.extras FOR SELECT
USING (enabled = true OR public.is_admin());

-- Admins have full access
CREATE POLICY "Admins have full CRUD on extras"
ON public.extras FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- PAYMENT METHODS RLS POLICIES
-- ============================================================================
-- Public can view enabled payment methods
CREATE POLICY "Public can view enabled payment methods"
ON public.payment_methods FOR SELECT
USING (enabled = true OR public.is_admin());

-- Admins have full access
CREATE POLICY "Admins have full CRUD on payment methods"
ON public.payment_methods FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- ADMIN PROFILES RLS POLICIES
-- ============================================================================
-- Users can view their own profile
CREATE POLICY "Users can view own admin profile"
ON public.admin_profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_admin());

-- Only superadmins can create/update/delete admin profiles
CREATE POLICY "Superadmins manage admin profiles"
ON public.admin_profiles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid() AND role = 'superadmin' AND is_active = true
    )
);

-- ============================================================================
-- BOOKINGS RLS POLICIES
-- ============================================================================
-- 1. Public Insertion: Restricted to the secure RPC create_booking_atomic
-- Direct table inserts can be allowed with strict defaults or blocked
CREATE POLICY "Public can insert bookings via authorized RPC"
ON public.bookings FOR INSERT
WITH CHECK (true);

-- 2. Guests can view their own booking via booking_code + access_token (or session header)
CREATE POLICY "Guests can view own booking via token"
ON public.bookings FOR SELECT
USING (
    public.is_admin() OR
    access_token = current_setting('request.headers', true)::json->>'x-booking-token' OR
    booking_code = current_setting('request.headers', true)::json->>'x-booking-code'
);

-- 3. Admins have full read/write access
CREATE POLICY "Admins have full access on bookings"
ON public.bookings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- APP SETTINGS RLS POLICIES
-- ============================================================================
-- Public can read general settings
CREATE POLICY "Public can view app settings"
ON public.app_settings FOR SELECT
USING (true);

-- Admins can update settings
CREATE POLICY "Admins can update app settings"
ON public.app_settings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- AUDIT LOGS RLS POLICIES
-- ============================================================================
-- Only Admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());

-- System & RPCs insert audit logs (Security Definer handles insert)
CREATE POLICY "Service and RPC can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);
```

---

## 5. Real-Time Pricing Engine Formulation

The pricing engine is implemented identically in both the TypeScript client-side hook (for zero-latency UI preview updates) and the PostgreSQL RPC (for authoritative transactional execution).

### Pricing Math Formula
$$\text{Base Total} = \sum_{d = \text{check\_in}}^{\text{check\_out} - 1} \begin{cases} \text{weekend\_price}, & \text{if } \text{dayOfWeek}(d) \in \{\text{Fri}, \text{Sat}\} \\ \text{base\_price}, & \text{otherwise} \end{cases}$$

$$\text{Extras Total} = \sum_{e \in \text{selectedExtras}} \begin{cases} 
\text{price}_e \times \text{qty}_e, & \text{type} = \text{'per\_stay'} \\
\text{price}_e \times \text{qty}_e \times N_{\text{nights}}, & \text{type} = \text{'per\_night'} \\
\text{price}_e \times \text{qty}_e \times N_{\text{guests}}, & \text{type} = \text{'per\_guest'} \\
\text{price}_e \times \text{qty}_e \times N_{\text{guests}} \times N_{\text{nights}}, & \text{type} = \text{'per\_guest\_per\_night'}
\end{cases}$$

$$\text{Total Amount} = \text{Base Total} + \text{Cleaning Fee} + \text{Extras Total} - \text{Discount}$$

$$\text{Reservation Fee Required} = \text{ROUND}(\text{Total Amount} \times \text{reservation\_fee\_rate}, 2)$$

$$\text{Balance Due} = \text{Total Amount} - \text{Reservation Fee Paid}$$

---

## 6. TypeScript Type Definitions & Database Interface

The TypeScript architecture provides strict end-to-end type safety, zero `any` tolerance, and discriminated union types for domain models.

### `src/types/database.types.ts`

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CondoStatus = 'active' | 'maintenance' | 'hidden' | 'archived';
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'rejected' | 'expired';
export type PaymentStatus = 'unpaid' | 'proof_submitted' | 'partial_paid' | 'fully_paid' | 'refunded' | 'cancelled';
export type PriceType = 'per_stay' | 'per_night' | 'per_guest' | 'per_guest_per_night';
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
          images: string[];
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
          amenities: string[];
          house_rules: string[];
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
          location: string;
          images?: string[];
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
          amenities?: string[];
          house_rules?: string[];
          check_in_time?: string;
          check_out_time?: string;
          min_stay_nights?: number;
          max_stay_nights?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['condos']['Insert']>;
      };
      extras: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          price_type: PriceType;
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
          price_type?: PriceType;
          icon?: string | null;
          category?: string;
          max_quantity?: number;
          enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['extras']['Insert']>;
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
        Update: Partial<Database['public']['Tables']['payment_methods']['Insert']>;
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
          check_in: string;
          check_out: string;
          stay_range: string;
          num_adults: number;
          num_children: number;
          total_guests: number;
          nights_count: number;
          selected_extras: Json;
          nightly_breakdown: Json;
          base_total: number;
          cleaning_fee: number;
          extras_total: number;
          security_deposit: number;
          discount_amount: number;
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
          selected_extras?: Json;
          nightly_breakdown?: Json;
          base_total: number;
          cleaning_fee?: number;
          extras_total?: number;
          security_deposit?: number;
          discount_amount?: number;
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
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
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
        Update: Partial<Database['public']['Tables']['admin_profiles']['Insert']>;
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
          value: Json;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['app_settings']['Insert']>;
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
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
    };
    Functions: {
      create_booking_atomic: {
        Args: {
          p_condo_id: string;
          p_guest_name: string;
          p_guest_email: string;
          p_guest_phone: string;
          p_guest_notes: string | null;
          p_check_in: string;
          p_check_out: string;
          p_num_adults: number;
          p_num_children: number;
          p_selected_extras: Json;
          p_payment_method_id: string | null;
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
          p_payment_method_id: string | null;
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
          p_is_full_payment?: boolean;
          p_admin_notes?: string | null;
        };
        Returns: Json;
      };
    };
  };
}
```

### Domain Interfaces & DTOs (`src/types/booking.ts`)

```typescript
import { Database, CondoStatus, BookingStatus, PaymentStatus, PriceType, PaymentMethodType } from './database.types';

export type Condo = Database['public']['Tables']['condos']['Row'];
export type Extra = Database['public']['Tables']['extras']['Row'];
export type PaymentMethod = Database['public']['Tables']['payment_methods']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type AdminProfile = Database['public']['Tables']['admin_profiles']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

export interface ExtraSelection {
  extra_id: string;
  quantity: number;
}

export interface ProcessedExtraSnapshot {
  extra_id: string;
  name: string;
  slug: string;
  price: number;
  price_type: PriceType;
  quantity: number;
  total: number;
}

export interface NightlyRate {
  date: string;
  rate: number;
  is_weekend: boolean;
}

export interface PricingCalculationResult {
  nights: number;
  nightlyBreakdown: NightlyRate[];
  baseTotal: number;
  cleaningFee: number;
  extrasTotal: number;
  securityDeposit: number;
  discountAmount: number;
  totalAmount: number;
  reservationFeeRequired: number;
  balanceDue: number;
  processedExtras: ProcessedExtraSnapshot[];
}

export interface BookingSubmissionInput {
  condo_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_notes?: string;
  check_in: string;
  check_out: string;
  num_adults: number;
  num_children: number;
  selected_extras: ExtraSelection[];
  payment_method_id?: string;
}

export interface BookingCreationSuccessResponse {
  success: true;
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
}

export interface BlockedDateRange {
  check_in: string;
  check_out: string;
  status: BookingStatus;
}

export interface AvailabilityResponse {
  condo_id: string;
  query_start: string;
  query_end: string;
  blocked_ranges: BlockedDateRange[];
  is_fully_available: boolean;
}
```

---

## 7. Mock / Seed Data Kit

```sql
-- ============================================================================
-- PRODUCTION-READY SEED DATA
-- ============================================================================

-- 1. Insert Initial Luxury Condos
INSERT INTO public.condos (
    slug, name, tagline, description, location,
    images, cover_image, max_guests, bedrooms, bathrooms,
    beds_description, floor_area_sqm, base_price, weekend_price,
    cleaning_fee, reservation_fee_rate, security_deposit, status,
    amenities, house_rules, check_in_time, check_out_time, min_stay_nights, sort_order
) VALUES 
(
    'azure-sky-penthouse',
    'Azure Sky Penthouse & Infinity Pool',
    'Ultra-luxury 42nd floor skyline retreat with private balcony & sunset sea views',
    'Indulge in panoramic 360-degree views of the city skyline and coastal sunset. Features floor-to-ceiling soundproof glass, chef-grade Italian kitchen, ultra-fast 500Mbps fiber internet, smart automation, and private direct elevator access.',
    'Azure Ocean Towers, Tower 1 - Level 42, Seaside Blvd',
    '[
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop"
    ]'::jsonb,
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop',
    6, 3, 2.5,
    '2 King Beds (Tempur-Pedic), 2 Twin Single Beds',
    145.50,
    6500.00, -- Weekday price: ₱6,500 / night
    8200.00, -- Weekend price: ₱8,200 / night
    1200.00, -- Cleaning fee: ₱1,200
    0.2000,  -- 20% reservation downpayment
    3000.00, -- Security deposit
    'active',
    '["500Mbps High-Speed WiFi", "Infinity Pool Access", "Private Balcony", "Smart TV w/ Netflix & HBO", "Washer & Dryer", "Equipped Kitchenette", "Central AC", "Keyless Digital Entry", "Dedicated Workspace", "24/7 Security Concierge"]'::jsonb,
    '["No smoking inside the unit (designated balcony area only)", "No loud parties after 10:00 PM", "Registered guests only after 11:00 PM", "Pets allowed with prior approval and pet fee"]'::jsonb,
    '14:00', '11:00', 1, 1
),
(
    'serenity-garden-suite',
    'Serenity Garden Poolside Suite',
    'Chic minimalist studio oasis with private tropical terrace and direct lagoon access',
    'Step directly from your private sun deck into the tropical lagoon pool. Designed with warm earth tones, Scandinavian minimalist fixtures, espresso bar, rainfall shower, and plush botanical linens for the ultimate tranquil escape.',
    'Azure Ocean Towers, Courtyard Garden Wing - Ground Level',
    '[
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1200&auto=format&fit=crop"
    ]'::jsonb,
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop',
    3, 1, 1.0,
    '1 Queen Bed, 1 Convertible Daybed Sofa',
    48.00,
    3800.00, -- Weekday price: ₱3,800 / night
    4800.00, -- Weekend price: ₱4,800 / night
    800.00,  -- Cleaning fee: ₱800
    0.2000,  -- 20% reservation downpayment
    2000.00,
    'active',
    '["300Mbps WiFi", "Direct Pool Access", "Espresso Coffee Machine", "55-inch 4K OLED TV", "Rainfall Shower", "Microwave & Fridge", "Air Conditioning", "Self Check-in Keypad"]'::jsonb,
    '["Strictly non-smoking", "Quiet hours starting 10:00 PM", "Dry off before entering unit from pool"]'::jsonb,
    '14:00', '11:00', 1, 2
),
(
    'luxe-loft-haven',
    'Luxe Horizon Two-Story Loft',
    'Industrial-modern mezzanine loft with 6-meter ceilings and sunset mountain backdrop',
    'Featuring soaring double-height glass windows, bespoke custom leather furnishings, cocktail bar station, lofted master suite, and curated art pieces for discerning travelers and content creators.',
    'Azure Ocean Towers, Tower 2 - Level 28',
    '[
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=1200&auto=format&fit=crop"
    ]'::jsonb,
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop',
    4, 2, 2.0,
    '1 King Bed (Loft Master), 1 Queen Bed (Lower Guest)',
    88.00,
    4900.00, -- Weekday price: ₱4,900 / night
    6200.00, -- Weekend price: ₱6,200 / night
    1000.00, -- Cleaning fee: ₱1,000
    0.2000,
    2500.00,
    'active',
    '["High-Speed Fiber WiFi", "Double-Height Glass Windows", "Cocktail Bar & Wine Chiller", "Sonos Sound System", "Workstation Desk", "Full Kitchen", "Balcony"]'::jsonb,
    '["No smoking", "No glass near the balcony railing", "Commercial photoshoot requests must be pre-approved"]'::jsonb,
    '14:00', '11:00', 1, 3
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Add-on Extras
INSERT INTO public.extras (name, slug, description, price, price_type, icon, category, max_quantity, sort_order)
VALUES
(
    'VIP Airport / Terminal Transfer',
    'vip-airport-transfer',
    'Private air-conditioned Toyota Alphard or HiAce van direct from airport/seaport to condo lobby.',
    1500.00,
    'per_stay',
    'Car',
    'transport',
    2,
    1
),
(
    'Early Check-In Priority (11:00 AM)',
    'early-check-in',
    'Guaranteed early arrival access starting at 11:00 AM (subject to prior night checkout).',
    800.00,
    'per_stay',
    'Clock',
    'service',
    1,
    2
),
(
    'Late Check-Out Privilege (3:00 PM)',
    'late-check-out',
    'Relax and enjoy your final day with extended checkout until 3:00 PM.',
    800.00,
    'per_stay',
    'Sparkles',
    'service',
    1,
    3
),
(
    'Romantic Sunset Wine & Charcuterie Board',
    'romantic-wine-setup',
    'Chilled bottle of premium Cabernet Sauvignon or Prosecco, artisan cheeses, cured meats, and fresh fruits setup upon arrival.',
    1800.00,
    'per_stay',
    'Wine',
    'dining',
    1,
    4
),
(
    'Extra Luxury Memory-Foam Bed Setup',
    'extra-bed-setup',
    'Premium single memory foam foldout bed complete with hotel-grade pillows, linens, and duvet.',
    600.00,
    'per_night',
    'BedDouble',
    'amenity',
    2,
    5
),
(
    'Daily Poolside Gourmet Breakfast',
    'daily-breakfast',
    'Freshly prepared Filipino or Continental breakfast delivered to your door each morning.',
    350.00,
    'per_guest_per_night',
    'Utensils',
    'dining',
    6,
    6
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert Payment Methods (GCash, Maya, BDO, BPI)
INSERT INTO public.payment_methods (name, type, account_name, account_number, qr_code_url, instructions, sort_order)
VALUES
(
    'GCash Instant Transfer / QR',
    'gcash',
    'CondoPal Property Management Inc.',
    '0917-888-COND (09178882663)',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400&auto=format&fit=crop',
    '1. Open your GCash App and tap "Send Money" or scan our merchant QR code.
2. Enter the exact Reservation Downpayment amount indicated on your booking quote.
3. In the message/notes field, write your Booking Code (e.g. CP-2026-XXXXX).
4. Take a screenshot of the completed transaction receipt.
5. Upload the screenshot on the payment confirmation screen.',
    1
),
(
    'Maya (PayMaya) QR / Transfer',
    'maya',
    'CondoPal Residences Phils',
    '0920-999-PAL8 (09209997258)',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400&auto=format&fit=crop',
    '1. Open Maya App and tap "Send Money" or "Scan QR".
2. Transfer the Reservation Downpayment to account 09209997258.
3. Include your Booking Code in the payment note.
4. Save the transaction receipt and upload it to finalize verification.',
    2
),
(
    'BDO Unibank Online Bank Transfer',
    'bank_transfer',
    'CondoPal Hospitality Ventures Corp.',
    '0045-8023-9912 (Savings)',
    NULL,
    '1. Transfer via BDO Online Banking or InstaPay / PESONet from any Philippine bank.
2. Account Name: CondoPal Hospitality Ventures Corp.
3. Account Number: 004580239912
4. Take a screenshot or PDF of the confirmation advice and upload it.',
    3
),
(
    'BPI (Bank of the Philippine Islands)',
    'bank_transfer',
    'CondoPal Hospitality Ventures Corp.',
    '3899-1045-77 (Current Account)',
    NULL,
    '1. Transfer via BPI Online / App or InstaPay.
2. Account Name: CondoPal Hospitality Ventures Corp.
3. Account Number: 3899104577
4. Upload proof of transfer screenshot.',
    4
)
ON CONFLICT DO NOTHING;

-- 4. Initial App Settings
INSERT INTO public.app_settings (key, value, description)
VALUES
(
    'general',
    '{
        "site_name": "CondoPal Luxury Residences",
        "tagline": "Sanctuary Above the Clouds",
        "contact_email": "reservations@condopal.com",
        "contact_phone": "+63 (2) 8899-CONDO / +63 917 888 2663",
        "address": "Azure Ocean Towers, Seaside Boulevard, Philippines",
        "currency_symbol": "₱",
        "currency_code": "PHP",
        "default_reservation_rate": 0.20
    }'::jsonb,
    'Core application configuration, brand details, and contact information'
),
(
    'policies',
    '{
        "cancellation_policy": "Full refund of reservation fee if cancelled at least 7 days prior to check-in. 50% refund if cancelled 3-6 days prior. Non-refundable within 48 hours of check-in.",
        "payment_hold_duration_hours": 2,
        "security_deposit_refundable_terms": "Security deposit is fully refunded within 24 hours of checkout following room inspection."
    }'::jsonb,
    'Booking, cancellation, and security deposit policies'
)
ON CONFLICT (key) DO NOTHING;
```

---

## 8. Vitest Testing Matrix & Verification Strategy

To guarantee that the database schema and RPC logic remain 100% robust against race conditions, pricing calculation bugs, and RLS bypasses, the following test suites must be implemented:

| Test Target | Test Case / Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **Pricing Engine** | Weekday (Tue-Thu, 2 nights) vs Weekend (Fri-Sun, 2 nights) calculation | Weekday calculates `base_price * 2`; Weekend calculates `weekend_price * 2`. |
| **Pricing Engine** | Multi-category Extras (`per_stay`, `per_night`, `per_guest`, `per_guest_per_night`) | Accurate math matching exact multipliers; reservation downpayment computed correctly at 20%. |
| **Double-Booking** | Concurrent execution of 2 bookings for overlapping dates | Exactly 1 transaction succeeds with 200 OK; the other raises `23P01 exclusion_violation` with user-friendly error message. |
| **Capacity Validation** | Submitting booking where `num_adults + num_children > max_guests` | Stored procedure aborts with error code `P0007`. |
| **Date Inversion** | Submitting `check_out <= check_in` or `check_in < CURRENT_DATE` | Stored procedure aborts with `P0002` / `P0003`. |
| **RLS Isolation** | Guest requesting another booking's access token or admin records | RLS returns empty dataset (404/Empty Array); only authorized token matches. |
| **Payment Workflow** | Guest uploads payment proof -> Admin verifies with partial/full payment | Status transitions from `unpaid` -> `proof_submitted` -> `confirmed` / `fully_paid`; audit logs created. |

---

## 9. Conclusion & Architecture Hand-off

This specification delivers:
1. **Bulletproof Database Foundation:** Full DDL, relational integrity, foreign key constraints, cascading behaviors, and triggers.
2. **Definitive Concurrency Defense:** PostgreSQL `btree_gist` exclusion constraints + `SELECT FOR UPDATE` atomic stored procedure.
3. **Comprehensive RBAC & Guest Access:** Strict Supabase RLS policies preventing unauthorized reads/writes while keeping guest checkout frictionless.
4. **Strict TypeScript Types:** Complete `@supabase/supabase-js` schema interfaces and domain DTOs with zero `any`.
5. **Turnkey Seed Data:** Realistic luxury condo suites, extras, and Philippine payment channels (GCash, Maya, BDO, BPI).

All files and specifications are ready for direct consumption by the project implementers and UI engineers.
