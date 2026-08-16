import React, { useState, useMemo } from 'react';
import type { Booking } from '../../types/booking';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { formatDateDisplay } from '../../lib/dateUtils';
import { PaymentProofLightbox } from './PaymentProofLightbox';
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  FileImage,
  Calendar,
  Users,
} from 'lucide-react';

export interface BookingsTableProps {
  bookings: Booking[];
  onVerifyBooking: (bookingId: string, amount: number, notes?: string) => Promise<void>;
  onRejectBooking: (bookingId: string, reason: string) => Promise<void>;
  onRefresh?: () => void;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({
  bookings,
  onVerifyBooking,
  onRejectBooking,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'checked_in' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCondoFilter, setSelectedCondoFilter] = useState<string>('all');
  const [selectedBookingForProof, setSelectedBookingForProof] = useState<Booking | null>(null);

  // Extract unique condos from bookings
  const uniqueCondos = useMemo(() => {
    const map = new Map<string, string>();
    bookings.forEach((b) => {
      if (b.condo) {
        map.set(b.condo.id, b.condo.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [bookings]);

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Tab filter
      if (activeTab === 'pending') {
        const isPending = b.payment_status === 'proof_submitted' || (b.booking_status === 'pending' && b.payment_status !== 'rejected');
        if (!isPending) return false;
      } else if (activeTab === 'confirmed') {
        if (b.booking_status !== 'confirmed') return false;
      } else if (activeTab === 'checked_in') {
        if (b.booking_status !== 'checked_in') return false;
      } else if (activeTab === 'rejected') {
        if (b.booking_status !== 'rejected' && b.payment_status !== 'rejected') return false;
      }

      // Condo filter
      if (selectedCondoFilter !== 'all' && b.condo_id !== selectedCondoFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = b.booking_code.toLowerCase().includes(q);
        const matchesName = b.guest_name.toLowerCase().includes(q);
        const matchesEmail = b.guest_email.toLowerCase().includes(q);
        const matchesPhone = b.guest_phone.toLowerCase().includes(q);
        const matchesRef = (b.payment_reference_number || '').toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesEmail && !matchesPhone && !matchesRef) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, activeTab, selectedCondoFilter, searchQuery]);

  const getStatusBadge = (b: Booking) => {
    if (b.booking_status === 'confirmed') {
      return <Badge variant="emerald" size="xs" dot>Confirmed</Badge>;
    }
    if (b.payment_status === 'proof_submitted') {
      return <Badge variant="amber" size="xs" dot>Proof Submitted</Badge>;
    }
    if (b.payment_status === 'rejected' || b.booking_status === 'rejected') {
      return <Badge variant="rose" size="xs">Rejected</Badge>;
    }
    return <Badge variant="gold" size="xs">Pending Deposit</Badge>;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/10 overflow-x-auto">
          {[
            { id: 'all', label: 'All Bookings', count: bookings.length },
            {
              id: 'pending',
              label: 'Review Queue',
              count: bookings.filter(
                (b) => b.payment_status === 'proof_submitted' || (b.booking_status === 'pending' && b.payment_status !== 'rejected')
              ).length,
            },
            {
              id: 'confirmed',
              label: 'Confirmed',
              count: bookings.filter((b) => b.booking_status === 'confirmed').length,
            },
            {
              id: 'checked_in',
              label: 'Checked In',
              count: bookings.filter((b) => b.booking_status === 'checked_in').length,
            },
            {
              id: 'rejected',
              label: 'Rejected',
              count: bookings.filter((b) => b.booking_status === 'rejected' || b.payment_status === 'rejected').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search & Condo Filter */}
        <div className="flex items-center gap-2">
          {uniqueCondos.length > 1 && (
            <div className="relative">
              <select
                value={selectedCondoFilter}
                onChange={(e) => setSelectedCondoFilter(e.target.value)}
                className="bg-[#0A0F1A] border border-white/10 rounded-full px-3.5 py-2 text-xs text-slate-200 outline-none pr-8 cursor-pointer"
              >
                <option value="all">All Suites</option>
                {uniqueCondos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, guest, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0F1A] border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      </div>

      {/* Bookings Data Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0A0F1A]/80 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-semibold">Reference</th>
                <th className="py-3.5 px-4 font-semibold">Guest</th>
                <th className="py-3.5 px-4 font-semibold">Suite & Stay</th>
                <th className="py-3.5 px-4 font-semibold">Financials</th>
                <th className="py-3.5 px-4 font-semibold">Payment Info</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 text-slate-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No reservations found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Booking Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#E5C483] whitespace-nowrap">
                      {b.booking_code}
                    </td>

                    {/* Guest Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{b.guest_name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                        {b.guest_email}
                      </div>
                      <div className="text-[10px] text-slate-500">{b.guest_phone}</div>
                    </td>

                    {/* Condo & Dates */}
                    <td className="py-3.5 px-4">
                      <div className="font-serif font-medium text-slate-100">
                        {b.condo?.name || 'Luxury Suite'}
                      </div>
                      <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-[#E5C483]" />
                        <span>
                          {formatDateDisplay(b.check_in, 'short')} — {formatDateDisplay(b.check_out, 'short')}
                        </span>
                        <span className="text-slate-500">({b.pricing_breakdown?.nights || 1}n)</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{b.num_adults + b.num_children} guests</span>
                      </div>
                    </td>

                    {/* Financials */}
                    <td className="py-3.5 px-4">
                      <div className="font-serif font-bold text-slate-100 tabular-nums">
                        {formatCurrency(b.total_amount)}
                      </div>
                      <div className="text-[11px] text-[#E5C483] tabular-nums">
                        Deposit: {formatCurrency(b.reservation_fee)}
                      </div>
                      <div className="text-[10px] text-slate-400 tabular-nums">
                        Bal: {formatCurrency(b.balance_due || b.total_amount - b.reservation_fee)}
                      </div>
                    </td>

                    {/* Payment Info */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">
                        {b.payment_method?.name || 'GCash / Bank'}
                      </div>
                      {b.payment_reference_number ? (
                        <div className="font-mono text-[11px] text-[#E5C483] truncate max-w-[120px]">
                          Ref: {b.payment_reference_number}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">No ref entered</span>
                      )}
                      {b.payment_proof_url && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <FileImage className="w-3 h-3" /> Proof attached
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(b)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="glass"
                          onClick={() => setSelectedBookingForProof(b)}
                          icon={<Eye className="w-3.5 h-3.5" />}
                          title="Inspect Receipt / Details"
                        >
                          Review
                        </Button>
                        {b.booking_status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onVerifyBooking(b.id, b.reservation_fee)}
                              className="w-7 h-7 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 flex items-center justify-center transition-all cursor-pointer"
                              title="Approve Reservation"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRejectBooking(b.id, 'Admin manual cancellation')}
                              className="w-7 h-7 rounded-full bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 flex items-center justify-center transition-all cursor-pointer"
                              title="Reject Reservation"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox / Verification Modal */}
      <PaymentProofLightbox
        isOpen={!!selectedBookingForProof}
        onClose={() => setSelectedBookingForProof(null)}
        booking={selectedBookingForProof}
        onVerify={onVerifyBooking}
        onReject={onRejectBooking}
      />
    </div>
  );
};
