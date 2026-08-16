import type { AdminRole, BookingStatus, PaymentStatus } from './database.types';
import type { Booking } from './booking';

export type { AdminRole };

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminKPIs {
  totalRevenue: number;
  monthlyRevenue: number;
  occupancyRatePercent: number;
  totalBookings: number;
  pendingApprovalsCount: number;
  upcomingCheckinsCount: number;
  activeGuestsCount: number;
  confirmedBookingsCount: number;
}

export interface AuditLog {
  id: string;
  entity_type: 'booking' | 'condo' | 'extra' | 'payment_method' | 'setting';
  entity_id: string;
  action: 'create' | 'update' | 'status_change' | 'payment_proof_uploaded' | 'payment_verified' | 'payment_rejected' | 'cancel';
  actor_id?: string | null;
  actor_role: string;
  actor_ip?: string | null;
  actor_user_agent?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface BlockedDateRange {
  id: string;
  condo_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  reason: string;
  created_by?: string;
  created_at: string;
}

export interface AdminFilterOptions {
  statusFilter: BookingStatus | 'all';
  paymentFilter: PaymentStatus | 'all';
  condoFilter: string | 'all';
  searchQuery: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
}

export interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onVerify: (bookingId: string, amountPaid: number, notes?: string) => Promise<void>;
  onReject: (bookingId: string, reason: string) => Promise<void>;
}
