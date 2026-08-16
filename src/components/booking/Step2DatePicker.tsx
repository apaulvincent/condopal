import React, { useState, useEffect, useMemo } from 'react';
import { useBooking } from '../../context/BookingContext';
import { condoPalApi } from '../../lib/supabase';
import { DoubleBezel } from '../ui/DoubleBezel';
import { Badge } from '../ui/Badge';
import {
  parseISODateToUTC,
  formatDateDisplay,
  formatDateRangeDisplay,
  calculateNights,
  isWeekendNight,
  toISODateString,
} from '../../lib/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const Step2DatePicker: React.FC = () => {
  const { condo, checkIn, checkOut, setDates } = useBooking();

  // Current calendar month view in UTC (1st of month)
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    if (checkIn) {
      const d = parseISODateToUTC(checkIn);
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    }
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });

  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [blockedRanges, setBlockedRanges] = useState<
    Array<{ check_in: string; check_out: string; status: string }>
  >([]);

  // Fetch blocked dates for the condo
  useEffect(() => {
    if (!condo) return;
    let mounted = true;

    async function loadBlocked() {
      if (!condo) return;
      try {
        const now = new Date();
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
        const end = new Date(Date.UTC(now.getUTCFullYear() + 1, now.getUTCMonth(), 28));
        const result = await condoPalApi.checkCondoAvailability(
          condo.id,
          toISODateString(start),
          toISODateString(end)
        );
        if (mounted && result && result.blocked_ranges) {
          setBlockedRanges(result.blocked_ranges);
        }
      } catch (err) {
        console.warn('Error fetching condo availability:', err);
      }
    }

    loadBlocked();
    return () => {
      mounted = false;
    };
  }, [condo]);

  // Today in UTC
  const todayStr = useMemo(() => {
    const now = new Date();
    return toISODateString(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())));
  }, []);

  // Helper to check if dateStr is blocked by existing reservation
  const isDateBlocked = (dateStr: string): boolean => {
    if (dateStr < todayStr) return true;
    return blockedRanges.some((range) => {
      return dateStr >= range.check_in && dateStr < range.check_out;
    });
  };

  const handleDateClick = (dateStr: string) => {
    if (isDateBlocked(dateStr)) return;

    if (!checkIn || (checkIn && checkOut)) {
      // Start a new selection
      setDates(dateStr, null);
    } else if (checkIn && !checkOut) {
      if (dateStr <= checkIn) {
        // Selected earlier date, reset start
        setDates(dateStr, null);
      } else {
        // Check if any date in between is blocked
        const inTime = parseISODateToUTC(checkIn).getTime();
        const outTime = parseISODateToUTC(dateStr).getTime();
        let hasBlockedBetween = false;

        for (let t = inTime; t < outTime; t += 86400000) {
          const dStr = toISODateString(new Date(t));
          if (isDateBlocked(dStr)) {
            hasBlockedBetween = true;
            break;
          }
        }

        if (hasBlockedBetween) {
          // Cannot span over blocked dates, start new selection
          setDates(dateStr, null);
        } else {
          setDates(checkIn, dateStr);
        }
      }
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => {
      return new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1));
    });
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => {
      return new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1));
    });
  };

  // Generate calendar days for a given month
  const renderMonthCalendar = (monthDate: Date) => {
    const year = monthDate.getUTCFullYear();
    const month = monthDate.getUTCMonth();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const firstDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0 = Sun
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isBlocked: boolean;
      isWeekend: boolean;
      isPast: boolean;
    }> = [];

    // Empty lead slots
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        dateStr: '',
        dayNumber: 0,
        isCurrentMonth: false,
        isBlocked: true,
        isWeekend: false,
        isPast: true,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(Date.UTC(year, month, d));
      const dateStr = toISODateString(dateObj);
      const isPast = dateStr < todayStr;
      const blocked = isDateBlocked(dateStr);
      const weekend = isWeekendNight(dateStr);

      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isBlocked: blocked,
        isWeekend: weekend,
        isPast,
      });
    }

    return (
      <div className="flex-1 min-w-[280px]">
        {/* Month Header */}
        <div className="text-center py-2 mb-3">
          <h4 className="font-serif text-lg font-semibold text-slate-100">
            {monthNames[month]} {year}
          </h4>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
            <span
              key={d}
              className={`text-[11px] font-medium uppercase tracking-wider ${
                i === 5 || i === 6 ? 'text-[#E5C483]' : 'text-slate-400'
              }`}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-1.5 gap-x-1">
          {days.map((day, idx) => {
            if (!day.isCurrentMonth) {
              return <div key={`empty-${idx}`} className="h-10" />;
            }

            const isCheckIn = checkIn === day.dateStr;
            const isCheckOut = checkOut === day.dateStr;
            const isSelected = isCheckIn || isCheckOut;
            const isInRange =
              checkIn &&
              checkOut &&
              day.dateStr > checkIn &&
              day.dateStr < checkOut;
            const isHoverRange =
              checkIn &&
              !checkOut &&
              hoveredDate &&
              day.dateStr > checkIn &&
              day.dateStr <= hoveredDate &&
              !day.isBlocked;

            return (
              <div
                key={day.dateStr}
                className={`relative flex items-center justify-center h-10 ${
                  isInRange || isHoverRange ? 'bg-[#D4AF37]/15' : ''
                } ${isCheckIn && checkOut ? 'rounded-l-full' : ''} ${
                  isCheckOut ? 'rounded-r-full' : ''
                }`}
                onMouseEnter={() => setHoveredDate(day.dateStr)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                <button
                  type="button"
                  disabled={day.isBlocked}
                  onClick={() => handleDateClick(day.dateStr)}
                  className={`w-9 h-9 rounded-full flex flex-col items-center justify-center text-xs font-medium transition-all duration-300 relative ${
                    isSelected
                      ? 'bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] text-slate-950 font-bold shadow-lg shadow-[#D4AF37]/30 scale-105 z-10'
                      : day.isBlocked
                      ? 'text-slate-600 bg-white/[0.01] cursor-not-allowed line-through opacity-40'
                      : isInRange || isHoverRange
                      ? 'text-[#F3E5AB] font-semibold'
                      : day.isWeekend
                      ? 'text-slate-100 hover:bg-white/10 hover:text-[#E5C483]'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{day.dayNumber}</span>
                  {day.isWeekend && !day.isBlocked && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-[#D4AF37]/60 absolute bottom-1" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Compute second month for dual view
  const nextMonthDate = useMemo(() => {
    return new Date(
      Date.UTC(
        currentMonthDate.getUTCFullYear(),
        currentMonthDate.getUTCMonth() + 1,
        1
      )
    );
  }, [currentMonthDate]);

  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0;
  const minStayNights = condo?.min_stay_nights || 1;
  const isMinStayViolated = nights > 0 && nights < minStayNights;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DoubleBezel glow innerClassName="p-6 sm:p-8 space-y-6">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="gold" size="xs">
                Step 02 / 05
              </Badge>
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-medium">
                Stay Schedule
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-100">
              Select your arrival & departure dates
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
            </button>
            <button
              onClick={handleNextMonth}
              className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </div>

        {/* Selected Dates Status Pill Bar */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#E5C483] shrink-0">
              <Sparkles className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-[0.15em] text-slate-400 font-medium block">
                Selected Schedule
              </span>
              <p className="font-serif text-base sm:text-lg font-semibold text-slate-100">
                {checkIn && checkOut
                  ? formatDateRangeDisplay(checkIn, checkOut)
                  : checkIn
                  ? `Check-in: ${formatDateDisplay(checkIn, 'long')} • Please choose check-out date`
                  : 'Please select arrival date on the calendar'}
              </p>
            </div>
          </div>

          {checkIn && checkOut && (
            <div className="flex items-center gap-2 self-start sm:self-center">
              <Badge variant="gold" size="sm" dot>
                {nights} {nights === 1 ? 'Night' : 'Nights'}
              </Badge>
              <button
                type="button"
                onClick={() => setDates(null, null)}
                className="text-xs text-slate-400 hover:text-rose-400 underline cursor-pointer transition-colors"
              >
                Reset Dates
              </button>
            </div>
          )}
        </div>

        {/* Minimum Stay Warning */}
        {isMinStayViolated && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              This luxury suite requires a minimum stay of{' '}
              <strong>{minStayNights} nights</strong>. Please select at least{' '}
              {minStayNights} nights.
            </span>
          </div>
        )}

        {/* Calendar Months Container */}
        <div className="flex flex-col md:flex-row gap-8 pt-2">
          {renderMonthCalendar(currentMonthDate)}
          <div className="hidden md:block w-px bg-white/10" />
          <div className="hidden md:block flex-1">
            {renderMonthCalendar(nextMonthDate)}
          </div>
        </div>

        {/* Calendar Legend & Time Notice */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB]" />
              <span>Selected Stay</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50" />
              <span>Stay Range</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span>Weekend (Fri/Sat)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-white/5 opacity-40 line-through" />
              <span>Reserved / Unavailable</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-[#E5C483]" />
              <span>Check-in: <strong>{condo?.check_in_time || '2:00 PM'}</strong></span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#E5C483]" />
              <span>Check-out: <strong>{condo?.check_out_time || '11:00 AM'}</strong></span>
            </div>
          </div>
        </div>
      </DoubleBezel>
    </div>
  );
};
