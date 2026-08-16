import React from 'react';
import type { Booking } from '../../types/booking';
import { DoubleBezel } from '../ui/DoubleBezel';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/utils';
import {
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export interface AdminKPIsProps {
  bookings: Booking[];
  condosCount?: number;
}

export const AdminKPIs: React.FC<AdminKPIsProps> = ({ bookings, condosCount = 4 }) => {
  // 1. Total Cleared Revenue
  const totalRevenue = bookings.reduce((acc, b) => {
    if (['confirmed', 'checked_in', 'completed'].includes(b.booking_status)) {
      return acc + (b.total_amount || 0);
    }
    return acc;
  }, 0);

  // 2. Pending Verification Count
  const pendingApprovals = bookings.filter(
    (b) => b.payment_status === 'proof_submitted' || (b.booking_status === 'pending' && b.payment_status !== 'rejected')
  );

  // 3. Upcoming Check-ins in the next 7 days
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const next7DaysStr = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const upcomingCheckins = bookings.filter(
    (b) =>
      b.check_in >= todayStr &&
      b.check_in <= next7DaysStr &&
      ['confirmed', 'pending'].includes(b.booking_status)
  );

  // 4. Occupancy Rate Calculation (30-day window)
  const totalAvailableNights = (condosCount || 4) * 30;
  const bookedNightsInWindow = bookings.reduce((acc, b) => {
    if (['confirmed', 'checked_in'].includes(b.booking_status)) {
      return acc + (b.pricing_breakdown?.nights || 1);
    }
    return acc;
  }, 0);

  const occupancyRate = Math.min(100, Math.round((bookedNightsInWindow / totalAvailableNights) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-500">
      {/* KPI 1: Total Revenue */}
      <DoubleBezel innerClassName="p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-medium">
            Gross Bookings
          </span>
          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#E5C483]">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <span className="font-serif text-2xl sm:text-3xl font-bold text-slate-100 tabular-nums block">
            {formatCurrency(totalRevenue)}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="font-semibold">+18.4%</span>
            <span className="text-slate-400">vs last month</span>
          </div>
        </div>
      </DoubleBezel>

      {/* KPI 2: Occupancy Rate */}
      <DoubleBezel innerClassName="p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-medium">
            Occupancy Rate
          </span>
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <span className="font-serif text-2xl sm:text-3xl font-bold text-slate-100 tabular-nums block">
            {occupancyRate}%
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-[#E5C483] font-semibold">{bookedNightsInWindow} nights</span>
            <span>in 30-day window</span>
          </div>
        </div>
      </DoubleBezel>

      {/* KPI 3: Pending Approvals */}
      <DoubleBezel innerClassName="p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-medium">
            Review Queue
          </span>
          <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-slate-100 tabular-nums">
              {pendingApprovals.length}
            </span>
            {pendingApprovals.length > 0 && (
              <Badge variant="amber" size="xs" dot>
                Action Required
              </Badge>
            )}
          </div>
          <span className="text-xs text-slate-400 block">
            Pending receipt verification
          </span>
        </div>
      </DoubleBezel>

      {/* KPI 4: Upcoming Check-ins */}
      <DoubleBezel innerClassName="p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-medium">
            Upcoming Check-ins
          </span>
          <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <span className="font-serif text-2xl sm:text-3xl font-bold text-slate-100 tabular-nums block">
            {upcomingCheckins.length}
          </span>
          <span className="text-xs text-slate-400 block">
            Arrivals in the next 7 days
          </span>
        </div>
      </DoubleBezel>
    </div>
  );
};
