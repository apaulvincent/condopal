-- ============================================================================
-- CONDOPAL CORE SCHEMA MIGRATION 002: PostgreSQL Exclusion Constraint
-- Feature F2: Zero-Double-Booking Kernel Lock
-- Target: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- Ensure btree_gist extension is present
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Drop previous constraint if it exists to make migration idempotent
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS prevent_overlapping_active_bookings;

-- Add btree_gist exclusion constraint on condo_id with equality (=) and stay_range with overlap (&&)
-- for all active booking statuses ('pending', 'confirmed', 'checked_in')
ALTER TABLE public.bookings
ADD CONSTRAINT prevent_overlapping_active_bookings
EXCLUDE USING gist (
    condo_id WITH =,
    stay_range WITH &&
)
WHERE (booking_status IN ('pending', 'confirmed', 'checked_in'));
