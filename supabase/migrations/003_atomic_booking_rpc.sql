-- ============================================================================
-- CONDOPAL CORE SCHEMA MIGRATION 003: Stored Procedures & Atomic Booking RPC
-- Feature F3: Atomic Booking Transaction & Concurrency Control
-- Target: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- 1. Atomic Booking RPC Function
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
    p_num_infants INT,
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

    -- 4. Check for Overlapping Existing Bookings
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
    v_balance_due := v_total_amount;

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
        num_infants,
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
        COALESCE(p_num_infants, 0),
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
        now() + INTERVAL '2 hours'
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

-- 2. Availability Checker RPC
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

-- 3. Submit Payment Proof RPC
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
BEGIN
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE booking_code = p_booking_code AND access_token = p_access_token
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid booking reference or unauthorized access token.' USING ERRCODE = 'P0011';
    END IF;

    IF v_booking.booking_status IN ('cancelled', 'rejected', 'expired') THEN
        RAISE EXCEPTION 'Cannot submit payment for a booking with status %.', v_booking.booking_status USING ERRCODE = 'P0012';
    END IF;

    UPDATE public.bookings
    SET payment_method_id = COALESCE(p_payment_method_id, payment_method_id),
        payment_reference_number = p_payment_reference_number,
        payment_proof_url = p_payment_proof_url,
        payment_status = 'proof_submitted',
        payment_submitted_at = now(),
        updated_at = now()
    WHERE id = v_booking.id;

    INSERT INTO public.audit_logs (
        entity_type,
        entity_id,
        action,
        actor_role,
        actor_ip,
        actor_user_agent,
        old_values,
        new_values
    ) VALUES (
        'booking',
        v_booking.id::text,
        'payment_proof_uploaded',
        'guest',
        p_client_ip,
        p_user_agent,
        jsonb_build_object('payment_status', v_booking.payment_status),
        jsonb_build_object('payment_status', 'proof_submitted', 'reference', p_payment_reference_number, 'url', p_payment_proof_url)
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_code', p_booking_code,
        'payment_status', 'proof_submitted',
        'payment_submitted_at', now()
    );
END;
$$;

-- 4. Verify Booking Payment (Admin Operation)
CREATE OR REPLACE FUNCTION public.verify_booking_payment(
    p_booking_id UUID,
    p_amount_paid NUMERIC(10,2),
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_booking RECORD;
    v_new_payment_status public.payment_status;
    v_new_balance NUMERIC(10,2);
BEGIN
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.' USING ERRCODE = 'P0013';
    END IF;

    v_new_balance := GREATEST(0.00, v_booking.total_amount - (v_booking.reservation_fee_paid + p_amount_paid));
    
    IF v_new_balance = 0.00 THEN
        v_new_payment_status := 'fully_paid';
    ELSE
        v_new_payment_status := 'verified';
    END IF;

    UPDATE public.bookings
    SET reservation_fee_paid = reservation_fee_paid + p_amount_paid,
        balance_due = v_new_balance,
        payment_status = v_new_payment_status,
        booking_status = 'confirmed',
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        verified_at = now(),
        verified_by = auth.uid(),
        updated_at = now()
    WHERE id = p_booking_id;

    INSERT INTO public.audit_logs (
        entity_type,
        entity_id,
        action,
        actor_id,
        actor_role,
        old_values,
        new_values
    ) VALUES (
        'booking',
        p_booking_id::text,
        'payment_verified',
        auth.uid(),
        'admin',
        jsonb_build_object('booking_status', v_booking.booking_status, 'payment_status', v_booking.payment_status),
        jsonb_build_object('booking_status', 'confirmed', 'payment_status', v_new_payment_status, 'paid', p_amount_paid)
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'booking_status', 'confirmed',
        'payment_status', v_new_payment_status,
        'balance_due', v_new_balance
    );
END;
$$;
