## 2026-08-16T04:58:40Z

You are Survey Explorer 1 (Database, RPC, Concurrency & Security Architect).
Your working directory is: d:/Development/condopal/.agents/survey_explorer_1

Read ORIGINAL_REQUEST.md at d:/Development/condopal/ORIGINAL_REQUEST.md.
Investigate and specify the complete Database & Security foundation for CondoPal:
1. Workspace check: Inspect d:/Development/condopal to see what exists currently.
2. PostgreSQL / Supabase Schema specification:
   - Condos/Units table (slug, name, description, images, max_guests, base_price, weekend_price, cleaning_fee, reservation_fee_rate, status, amenities, etc.)
   - Bookings table (booking_code, condo_id, guest_name, guest_email, guest_phone, check_in, check_out, num_adults, num_children, extras, total_amount, reservation_fee, payment_status, booking_status, payment_proof_url, etc.)
   - Extras table (name, description, price, price_type: per_stay/per_night/per_guest, icon, enabled)
   - Payment Methods table (name, type: gcash/bank_transfer/credit_card/cash, instructions, account_number, account_name, qr_code_url, enabled)
   - Admin Users & Settings table
   - Audit / Activity log table
3. Double-Booking Prevention & Concurrency:
   - Supabase RPC function `create_booking_atomic` or `book_condo` using PostgreSQL transaction, table/row locking (`SELECT FOR UPDATE`), or `btree_gist` / `tsrange` exclusion constraints ensuring strict zero-double-booking guarantee under concurrent submissions.
   - Availability checking function / queries.
4. RLS (Row Level Security) Policies:
   - Public/Guest access (can view active condos, pricing, extras, check availability, create booking, view own booking by booking_code + email/token).
   - Admin access (full CRUD on condos, pricing, extras, bookings, verify/reject payments).
5. TypeScript type definitions and client integration architecture.

Write your comprehensive findings and recommendations to d:/Development/condopal/.agents/survey_explorer_1/survey_db_report.md.
Also create handoff.md in your working directory and notify me via send_message.
