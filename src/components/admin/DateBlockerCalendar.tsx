import React, { useState, useMemo } from 'react';
import type { Condo, Booking } from '../../types/booking';
import { DoubleBezel } from '../ui/DoubleBezel';
import {
  formatDateDisplay,
  toISODateString,
} from '../../lib/dateUtils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

export interface DateBlockerCalendarProps {
  condos: Condo[];
  bookings: Booking[];
  onToggleDateBlock?: (condoId: string, dateStr: string, isBlocked: boolean) => void;
}

export const DateBlockerCalendar: React.FC<DateBlockerCalendarProps> = ({
  condos,
  bookings,
  onToggleDateBlock,
}) => {
  const [selectedCondoId, setSelectedCondoId] = useState<string>(condos[0]?.id || '');
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [manuallyBlockedDates, setManuallyBlockedDates] = useState<Set<string>>(new Set());
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const selectedCondo = condos.find((c) => c.id === selectedCondoId) || condos[0];

  // Active bookings for this condo
  const activeBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.condo_id === selectedCondoId &&
        ['confirmed', 'pending', 'checked_in'].includes(b.booking_status)
    );
  }, [bookings, selectedCondoId]);

  const isBookedByGuest = (dateStr: string): Booking | undefined => {
    return activeBookings.find((b) => dateStr >= b.check_in && dateStr < b.check_out);
  };

  const isDateManuallyBlocked = (dateStr: string): boolean => {
    return manuallyBlockedDates.has(`${selectedCondoId}_${dateStr}`);
  };

  const handleToggleBlock = (dateStr: string) => {
    const guestBooking = isBookedByGuest(dateStr);
    if (guestBooking) {
      setActionFeedback(`Date is reserved by guest ${guestBooking.guest_name} (${guestBooking.booking_code})`);
      setTimeout(() => setActionFeedback(null), 3000);
      return;
    }

    const key = `${selectedCondoId}_${dateStr}`;
    const nextSet = new Set(manuallyBlockedDates);
    const willBlock = !nextSet.has(key);

    if (willBlock) {
      nextSet.add(key);
      setActionFeedback(`Blocked ${formatDateDisplay(dateStr, 'medium')} for maintenance`);
    } else {
      nextSet.delete(key);
      setActionFeedback(`Unblocked ${formatDateDisplay(dateStr, 'medium')}`);
    }

    setManuallyBlockedDates(nextSet);
    if (onToggleDateBlock) {
      onToggleDateBlock(selectedCondoId, dateStr, willBlock);
    }
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handlePrevMonth = () => {
    setCurrentMonthDate(
      (prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1))
    );
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(
      (prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1))
    );
  };

  const renderMonth = (monthDate: Date) => {
    const year = monthDate.getUTCFullYear();
    const month = monthDate.getUTCMonth();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const firstDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const days: Array<{ dateStr: string; dayNumber: number; isCurrentMonth: boolean }> = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ dateStr: '', dayNumber: 0, isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(Date.UTC(year, month, d));
      days.push({
        dateStr: toISODateString(dateObj),
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    return (
      <div className="flex-1 min-w-[280px]">
        <div className="text-center py-2 mb-3">
          <h4 className="font-serif text-lg font-semibold text-slate-100">
            {monthNames[month]} {year}
          </h4>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2 text-[11px] font-medium text-slate-400">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day, idx) => {
            if (!day.isCurrentMonth) {
              return <div key={`empty-${idx}`} className="h-10" />;
            }

            const guestRes = isBookedByGuest(day.dateStr);
            const isBlocked = isDateManuallyBlocked(day.dateStr);

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => handleToggleBlock(day.dateStr)}
                className={`h-10 rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all cursor-pointer relative ${
                  guestRes
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : isBlocked
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-white/[0.03] text-slate-200 border border-white/8 hover:bg-white/[0.08] hover:text-white'
                }`}
                title={
                  guestRes
                    ? `Guest Booking: ${guestRes.guest_name} (${guestRes.booking_code})`
                    : isBlocked
                    ? 'Maintenance / Owner Block (Click to Unblock)'
                    : 'Available (Click to Block)'
                }
              >
                <span>{day.dayNumber}</span>
                {guestRes && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute bottom-1" />
                )}
                {isBlocked && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 absolute bottom-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const nextMonthDate = useMemo(() => {
    return new Date(
      Date.UTC(currentMonthDate.getUTCFullYear(), currentMonthDate.getUTCMonth() + 1, 1)
    );
  }, [currentMonthDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DoubleBezel glow innerClassName="p-6 sm:p-8 space-y-6">
        {/* Header with Unit Selector & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#E5C483]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#E5C483] font-medium block">
                Operations Calendar
              </span>
              <h3 className="font-serif text-2xl font-semibold text-slate-100">
                Date Blocker & Maintenance Manager
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Unit Dropdown */}
            <select
              value={selectedCondoId}
              onChange={(e) => setSelectedCondoId(e.target.value)}
              className="bg-[#0A0F1A] border border-white/15 rounded-full px-4 py-2 text-xs text-slate-100 outline-none pr-8 cursor-pointer focus:border-[#D4AF37]"
            >
              {condos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Prev/Next Month */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-slate-200 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-slate-200 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Banner */}
        {actionFeedback && (
          <div className="p-3 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-xs text-[#F3E5AB] flex items-center gap-2 animate-in fade-in">
            <Info className="w-4 h-4 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Dual Calendar Grid */}
        <div className="flex flex-col md:flex-row gap-8 pt-2">
          {renderMonth(currentMonthDate)}
          <div className="hidden md:block w-px bg-white/10" />
          <div className="hidden md:block flex-1">
            {renderMonth(nextMonthDate)}
          </div>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-white/[0.05] border border-white/10" />
              <span>Available (Click to block)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/50 text-rose-300" />
              <span>Maintenance Block (Click to release)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50 text-amber-300" />
              <span>Guest Reservation (Protected)</span>
            </div>
          </div>

          <span className="text-[11px] text-slate-500">
            Selected suite: <strong>{selectedCondo?.name}</strong>
          </span>
        </div>
      </DoubleBezel>
    </div>
  );
};
