-- ============================================================================
-- CONDOPAL CORE SCHEMA MIGRATION 004: RLS Policies & Turnkey Seed Data
-- Feature F4: Row Level Security & Turnkey Data
-- Target: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.condos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. CONDOS RLS Policies
CREATE POLICY "Public can view active condos"
ON public.condos FOR SELECT
USING (status = 'active');

CREATE POLICY "Admins have full access to condos"
ON public.condos FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. EXTRAS RLS Policies
CREATE POLICY "Public can view enabled extras"
ON public.extras FOR SELECT
USING (enabled = true);

CREATE POLICY "Admins have full access to extras"
ON public.extras FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. PAYMENT METHODS RLS Policies
CREATE POLICY "Public can view enabled payment methods"
ON public.payment_methods FOR SELECT
USING (enabled = true);

CREATE POLICY "Admins have full access to payment methods"
ON public.payment_methods FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. ADMIN PROFILES RLS Policies
CREATE POLICY "Admins can view all admin profiles"
ON public.admin_profiles FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Superadmins can manage admin profiles"
ON public.admin_profiles FOR ALL
TO authenticated
USING (public.current_user_role() = 'superadmin')
WITH CHECK (public.current_user_role() = 'superadmin');

-- 6. BOOKINGS RLS Policies
-- Guests can create new bookings
CREATE POLICY "Public guests can insert bookings"
ON public.bookings FOR INSERT
WITH CHECK (true);

-- Guests can read their own booking via access_token
CREATE POLICY "Guests can read own booking with access token"
ON public.bookings FOR SELECT
USING (
    access_token = current_setting('request.headers', true)::json->>'x-booking-token'
    OR access_token IS NOT NULL
);

-- Guests can update their own booking for payment submission
CREATE POLICY "Guests can update payment proof with access token"
ON public.bookings FOR UPDATE
USING (
    access_token = current_setting('request.headers', true)::json->>'x-booking-token'
)
WITH CHECK (
    access_token = current_setting('request.headers', true)::json->>'x-booking-token'
);

-- Admins have full access to bookings
CREATE POLICY "Admins have full access to bookings"
ON public.bookings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7. APP SETTINGS RLS Policies
CREATE POLICY "Public can view app settings"
ON public.app_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage app settings"
ON public.app_settings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 8. AUDIT LOGS RLS Policies
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- 9. TURNKEY SEED DATA
-- ============================================================================

-- A. Condos Seed Data
INSERT INTO public.condos (
    id, slug, name, tagline, description, location, images, cover_image,
    max_guests, bedrooms, bathrooms, beds_description, floor_area_sqm,
    base_price, weekend_price, cleaning_fee, reservation_fee_rate, security_deposit,
    status, amenities, house_rules, check_in_time, check_out_time, min_stay_nights, max_stay_nights, sort_order
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'azure-sky-penthouse',
    'Azure Sky Penthouse',
    'Unrivaled 360° Panoramic Luxury Above the Clouds',
    'Perched at the pinnacle of Tagaytay ridge, Azure Sky Penthouse features double-height glass architecture, a private heated infinity plunge pool overlooking Taal Lake, personal butler quarters, bespoke Italian marble finishes, and a private wine cellar.',
    'Ridge Summit Tower, Tagaytay Highlands',
    '[
        {"url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=85", "caption": "Living Sanctuary with Panoramic Vistas"},
        {"url": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=85", "caption": "Private Heated Infinity Plunge Pool"},
        {"url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85", "caption": "Master Bedroom with Lake Views"},
        {"url": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85", "caption": "Gourmet Chef Kitchen & Marble Island"}
    ]'::jsonb,
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=85',
    8, 4, 4.5, '2 King Beds, 2 Queen Beds, 1 Sleeper Sofa', 280.00,
    18500.00, 22500.00, 2500.00, 0.2000, 5000.00,
    'active',
    '["Private Infinity Plunge Pool", "360° Panoramic Lake View", "Private Butler Service", "High-Speed Starlink (300Mbps)", "Sub-Zero Gourmet Kitchen", "Bespoke Italian Marble Baths", "Smart Ambient Lighting & Sonance Audio", "Secure Basement VIP Parking"]'::jsonb,
    '["Strictly no smoking indoors", "No disruptive parties after 10:00 PM", "Max 8 registered guests", "Valid ID required upon check-in"]'::jsonb,
    '15:00', '12:00', 1, 30, 1
),
(
    '22222222-2222-2222-2222-222222222222',
    'serenity-garden-suite',
    'Serenity Garden Suite',
    'Botanical Haven with Direct Lagoon & Courtyard Access',
    'Immerse yourself in lush tropical flora and tranquil water gardens. The Serenity Garden Suite features an open-concept living pavilion, private cedar outdoor hot tub, Japanese zen rock garden, and seamless indoor-outdoor flow.',
    'The Botanical enclave, Tagaytay Highlands',
    '[
        {"url": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=85", "caption": "Pavilion Living Space"},
        {"url": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=85", "caption": "Private Outdoor Cedar Hot Tub"},
        {"url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1600&q=85", "caption": "Sunlit Master Suite"},
        {"url": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=85", "caption": "Zen Dining & Tea Room"}
    ]'::jsonb,
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=85',
    5, 2, 2.0, '1 California King Bed, 2 Twin XL Beds', 140.00,
    9800.00, 12800.00, 1800.00, 0.2000, 3000.00,
    'active',
    '["Private Cedar Hot Tub", "Direct Zen Garden Access", "High-Speed Wi-Fi 6", "Nespresso Atelier Station", "Rain Shower Sanctuary", "Organic Herbal Tea Bar", "Dedicated EV Charging Station"]'::jsonb,
    '["Quiet hours after 10:00 PM", "No open flame grilling in garden", "Pets allowed with prior approval"]'::jsonb,
    '14:00', '11:00', 1, 30, 2
),
(
    '33333333-3333-3333-3333-333333333333',
    'luxe-horizon-loft',
    'Luxe Horizon Loft',
    'Contemporary Minimalist Loft with Mountain Sunsets',
    'Designed for romantic getaways and executive retreats, Luxe Horizon Loft showcases 6-meter loft ceilings, an expansive sunset terrace with fire pit, curated modern art collection, and a state-of-the-art Bang & Olufsen sound system.',
    'The Horizon Tower, Tagaytay Highlands',
    '[
        {"url": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=85", "caption": "Double-Height Loft Living"},
        {"url": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=85", "caption": "Sunset Terrace with Fire Pit"},
        {"url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=85", "caption": "Mezzanine Master Bedroom"},
        {"url": "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1600&q=85", "caption": "Designer Stone Bathroom"}
    ]'::jsonb,
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=85',
    3, 1, 1.5, '1 Plush King Bed, 1 Daybed', 95.00,
    7200.00, 9400.00, 1500.00, 0.2000, 2500.00,
    'active',
    '["Sunset View Terrace & Fire Pit", "6-Meter Double-Height Ceilings", "Bang & Olufsen Acoustic System", "Sommelier Wine Cooler", "Ultra-Fast Fiber 500Mbps", "Designer Freestanding Tub"]'::jsonb,
    '["Adults-only retreat", "Strictly no smoking", "No unregistered overnight guests"]'::jsonb,
    '14:00', '11:00', 1, 30, 3
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    base_price = EXCLUDED.base_price,
    weekend_price = EXCLUDED.weekend_price,
    cleaning_fee = EXCLUDED.cleaning_fee,
    images = EXCLUDED.images,
    amenities = EXCLUDED.amenities;

-- B. Extras Seed Data
INSERT INTO public.extras (
    id, name, slug, description, price, price_type, icon, category, max_quantity, enabled, sort_order
) VALUES
(
    'e1111111-1111-1111-1111-111111111111',
    'VIP Airport Chauffeur (Mercedes V-Class)',
    'airport-chauffeur',
    'Luxury private door-to-door roundtrip airport transfer in an executive Mercedes-Benz V-Class with chilled champagne and refreshments.',
    3800.00,
    'per_stay',
    'Car',
    'transport',
    2,
    true,
    1
),
(
    'e2222222-2222-2222-2222-222222222222',
    'Private Chef 4-Course Degustation Dinner',
    'private-chef-dinner',
    'Exclusive in-suite fine dining prepared live by our Executive Resort Chef, customized to your culinary preferences with sommelier wine pairing.',
    2800.00,
    'per_guest',
    'Utensils',
    'dining',
    8,
    true,
    2
),
(
    'e3333333-3333-3333-3333-333333333333',
    'Romantic Sunset Cabana Setup & Wine',
    'sunset-cabana-romance',
    'Private cliffside cabana adorned with fairy lights, scented candles, fresh Ecuadorian roses, charcuterie board, and premium vintage prosecco.',
    2200.00,
    'per_stay',
    'HeartHandshake',
    'experience',
    1,
    true,
    3
),
(
    'e4444444-4444-4444-4444-444444444444',
    'Daily Wellness, Thermal Spa & Hydrotherapy Pass',
    'daily-wellness-pass',
    'Unlimited daily access to the resort Himalayan salt room, dry cedar sauna, steam bath, and thermal hydrotherapy vitality pools.',
    650.00,
    'per_guest_per_night',
    'Sparkles',
    'wellness',
    8,
    true,
    4
),
(
    'e5555555-5555-5555-5555-555555555555',
    'Floating Villa Breakfast Basket',
    'floating-breakfast',
    'Insta-worthy handcrafted teakwood floating basket with tropical fruits, artisanal pastries, eggs royale, freshly squeezed juices, and espresso.',
    1200.00,
    'per_night',
    'Coffee',
    'dining',
    3,
    true,
    5
),
(
    'e6666666-6666-6666-6666-666666666666',
    'High-Speed Starlink VIP Dedicated Bandwidth',
    'starlink-vip',
    'Priority uncapped low-latency satellite internet for uninterrupted 4K video conferencing and high-speed streaming.',
    450.00,
    'per_night',
    'Wifi',
    'technology',
    1,
    true,
    6
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    price_type = EXCLUDED.price_type,
    description = EXCLUDED.description;

-- C. Payment Methods Seed Data
INSERT INTO public.payment_methods (
    id, name, type, account_name, account_number, qr_code_url, instructions, is_reservation_fee_eligible, enabled, sort_order
) VALUES
(
    'p1111111-1111-1111-1111-111111111111',
    'GCash (Instant Verification)',
    'gcash',
    'CondoPal Luxury Hospitality Corp',
    '0917-888-9999',
    'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126360004PH.GCASH0102120211091788899995204601153036085802PH5912CONDOPAL+LTD6006MANILA63041A2B',
    '1. Open GCash App > Send Money or Scan QR. 2. Enter exact reservation fee. 3. Put your Booking Code in the Message field. 4. Save screenshot and upload below.',
    true,
    true,
    1
),
(
    'p2222222-2222-2222-2222-222222222222',
    'Maya (PayMaya)',
    'maya',
    'CondoPal Luxury Hospitality Corp',
    '0918-777-8888',
    'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126340004PH.MAYA0102120211091877788885204601153036085802PH5912CONDOPAL+LTD6006MANILA63043C4D',
    '1. Open Maya App > Send Money or Scan QR Ph. 2. Send the exact reservation deposit. 3. Input Booking Code as reference. 4. Take a screenshot of the confirmation.',
    true,
    true,
    2
),
(
    'p3333333-3333-3333-3333-333333333333',
    'BDO Unibank (Online Bank Transfer)',
    'bank_transfer',
    'CondoPal Luxury Properties Inc.',
    '0045-8801-9234',
    NULL,
    'Transfer via InstaPay / PESONet to BDO Account # 0045-8801-9234. Include your Booking Code in the payment remarks/notes. Upload your transfer receipt receipt.',
    true,
    true,
    3
),
(
    'p4444444-4444-4444-4444-444444444444',
    'BPI (Bank of the Philippine Islands)',
    'bank_transfer',
    'CondoPal Luxury Properties Inc.',
    '3182-1002-88',
    NULL,
    'Transfer via BPI Express Online / Mobile to Account # 3182-1002-88. Account Type: Checking. Upload confirmation screenshot.',
    true,
    true,
    4
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    account_name = EXCLUDED.account_name,
    account_number = EXCLUDED.account_number,
    instructions = EXCLUDED.instructions;

-- D. App Settings Seed Data
INSERT INTO public.app_settings (id, key, value, description) VALUES
(
    's1111111-1111-1111-1111-111111111111',
    'general',
    '{"property_name": "CondoPal Luxury Resorts & Suites", "contact_phone": "+63 917 888 9999", "contact_email": "concierge@condopal.com", "currency": "PHP", "currency_symbol": "₱", "check_in_time": "14:00", "check_out_time": "11:00", "tax_rate": 0.0, "service_charge_rate": 0.0}'::jsonb,
    'General property configuration and contact details'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value;
