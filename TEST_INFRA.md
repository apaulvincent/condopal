# E2E Test Infra: CondoPal

## Test Philosophy
- **Requirement-Driven & Opaque-Box**: Tests are derived from `ORIGINAL_REQUEST.md`, user stories, business rules, and security invariant requirements. No dependency on internal React component private state.
- **Methodology**: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing (including Concurrency Race Conditions and Concurrency Lock Verification).
- **Fast & Deterministic**: Powered by Vitest + jsdom + testing-library + fast-check generative testing + in-memory transactional mock engine replicating PostgreSQL exclusion constraints.

## Feature Inventory
| # | Feature | Source | Tier 1 (Unit) | Tier 2 (Boundary) | Tier 3 (Combinations) | Tier 4 (Workloads) |
|---|---------|--------|:-------------:|:-----------------:|:--------------------:|:------------------:|
| F1-F5 | Database & Concurrency | ORIGINAL_REQUEST §1, §4 | ✓ (5 tests) | ✓ (5 tests) | ✓ (3 tests) | ✓ (3 tests) |
| F6-F10 | Design Tokens & Layout | ORIGINAL_REQUEST §3 | ✓ (5 tests) | ✓ (5 tests) | ✓ (2 tests) | ✓ (2 tests) |
| F7-F8 | Pricing Engine & Date Math | ORIGINAL_REQUEST §1 | ✓ (8 tests) | ✓ (8 tests) | ✓ (5 tests) | ✓ (3 tests) |
| F11-F16| Guest Booking Flow & Voucher | ORIGINAL_REQUEST §1, §3 | ✓ (6 tests) | ✓ (5 tests) | ✓ (4 tests) | ✓ (3 tests) |
| F17-F21| Admin Hub & Verification | ORIGINAL_REQUEST §2 | ✓ (5 tests) | ✓ (5 tests) | ✓ (3 tests) | ✓ (3 tests) |

## Test Architecture
- **Runner**: Vitest (`npx vitest run`)
- **Environment**: Node / jsdom with strict TypeScript execution.
- **Mock Store**: `src/lib/supabaseMock.ts` implements transactional in-memory store enforcing `EXCLUDE USING gist (condo_id WITH =, daterange(check_in, check_out, '[)') WITH &&)` and PL/pgSQL atomic RPC simulation.
- **Location**: `tests/` directory:
  - `tests/setup.ts`: Global test harness & matchers
  - `tests/tier1_feature_coverage.test.ts`: Isolated unit & functional coverage
  - `tests/tier2_boundary_corner.test.ts`: Boundary values, leap years, fast-check property testing
  - `tests/tier3_combinations.test.ts`: Combinatorial pricing, seasonal rules, multi-guest addons
  - `tests/tier4_real_world_concurrency.test.ts`: Concurrent booking race conditions, complete guest booking to admin verification lifecycle

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Concurrent Booking Race Condition | F2, F3, F5, F11, F12: Two concurrent guests submit overlapping dates for Azure Sky Penthouse at the exact same millisecond. Exactly 1 succeeds and receives confirmation; the other is rejected with `ERR_OVERLAPPING_BOOKING` without corrupting state. | High |
| 2 | End-to-End Guest Booking Lifecycle | F7, F8, F11, F12, F13, F14, F15, F16: Guest selects Luxe Horizon Loft, picks 4 nights (including weekend), adds 2 adults + 1 child, selects Airport Shuttle + Pool Pass, receives itemized price with 20% deposit, submits with GCash reference, views boarding-pass voucher with dynamic QR. | High |
| 3 | Admin Review, Lightbox & Verification Flow | F17, F18, F19, F20, F21: Admin logs in, reviews pending booking queue, inspects uploaded GCash payment proof in lightbox, approves payment, verifies status transition to `confirmed` and `verified`, updates condo calendar. | Medium |
| 4 | Length-of-Stay Discount & Peak Season Interaction | F7, F8, F14: 8-night holiday booking across Christmas/New Year with 12% stay discount, cleaning fee, and 3 distinct extra pricing models. | Medium |
| 5 | Guest Booking Lookup & Status Recovery | F4, F16, F17: Guest looks up existing reservation via `booking_code` + `guest_email` and recovers voucher with real-time countdown to check-in. | Low |

## Coverage Thresholds
- Tier 1: ≥25 test cases across all core features
- Tier 2: ≥25 test cases with property-based invariants and extreme boundary inputs
- Tier 3: ≥15 test cases covering pairwise and complex pricing/flow combinations
- Tier 4: ≥5 realistic end-to-end and race condition simulations
- **Total Minimum Target**: ≥70 test cases with 100% pass rate.
