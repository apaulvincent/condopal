import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { DoubleBezel } from '../ui/DoubleBezel';
import { Badge } from '../ui/Badge';
import { Users, Plus, Minus, Info, ShieldCheck, AlertTriangle } from 'lucide-react';

export const Step3GuestDetails: React.FC = () => {
  const { condo, numAdults, numChildren, numInfants, setGuests } = useBooking();

  const maxGuests = condo?.max_guests || 4;
  const totalChargeable = numAdults + numChildren;
  const isAtMaxCapacity = totalChargeable >= maxGuests;
  const isExceeded = totalChargeable > maxGuests;

  const handleAdultsChange = (delta: number) => {
    const next = numAdults + delta;
    if (next < 1) return;
    if (next + numChildren > maxGuests) return;
    setGuests(next, numChildren, numInfants);
  };

  const handleChildrenChange = (delta: number) => {
    const next = numChildren + delta;
    if (next < 0) return;
    if (numAdults + next > maxGuests) return;
    setGuests(numAdults, next, numInfants);
  };

  const handleInfantsChange = (delta: number) => {
    const next = numInfants + delta;
    if (next < 0 || next > 4) return;
    setGuests(numAdults, numChildren, next);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DoubleBezel glow innerClassName="p-6 sm:p-8 space-y-6">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="gold" size="xs">
                Step 03 / 05
              </Badge>
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-medium">
                Party Size
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-100">
              Who is joining your stay?
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isExceeded ? 'rose' : isAtMaxCapacity ? 'amber' : 'emerald'}
              size="sm"
              dot
            >
              {totalChargeable} of {maxGuests} Max Capacity
            </Badge>
          </div>
        </div>

        {/* Capacity Visual Progress Meter */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#E5C483]" />
              Suite Capacity Limit
            </span>
            <span className="text-slate-400">
              {maxGuests - totalChargeable > 0
                ? `${maxGuests - totalChargeable} guest slot${maxGuests - totalChargeable > 1 ? 's' : ''} available`
                : 'Maximum occupancy reached'}
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/10">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isExceeded
                  ? 'bg-rose-500'
                  : isAtMaxCapacity
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-emerald-500 to-[#D4AF37]'
              }`}
              style={{
                width: `${Math.min(100, (totalChargeable / maxGuests) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Warning if exceeded */}
        {isExceeded && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Party size exceeds maximum capacity of {maxGuests} guests for this suite.
            </span>
          </div>
        )}

        {/* Stepper Rows */}
        <div className="divide-y divide-white/10">
          {/* Adults */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="font-serif text-base sm:text-lg font-medium text-slate-100">
                Adults
              </h4>
              <p className="text-xs text-slate-400">Ages 13 and above</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={numAdults <= 1}
                onClick={() => handleAdultsChange(-1)}
                className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:hover:bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed"
                aria-label="Decrease Adults"
              >
                <Minus className="w-4 h-4 stroke-[2]" />
              </button>
              <span className="w-8 text-center font-serif text-lg font-bold text-slate-100 tabular-nums">
                {numAdults}
              </span>
              <button
                type="button"
                disabled={isAtMaxCapacity}
                onClick={() => handleAdultsChange(1)}
                className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:hover:bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed"
                aria-label="Increase Adults"
              >
                <Plus className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          </div>

          {/* Children */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="font-serif text-base sm:text-lg font-medium text-slate-100">
                Children
              </h4>
              <p className="text-xs text-slate-400">Ages 3 to 12 years</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={numChildren <= 0}
                onClick={() => handleChildrenChange(-1)}
                className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:hover:bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed"
                aria-label="Decrease Children"
              >
                <Minus className="w-4 h-4 stroke-[2]" />
              </button>
              <span className="w-8 text-center font-serif text-lg font-bold text-slate-100 tabular-nums">
                {numChildren}
              </span>
              <button
                type="button"
                disabled={isAtMaxCapacity}
                onClick={() => handleChildrenChange(1)}
                className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:hover:bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed"
                aria-label="Increase Children"
              >
                <Plus className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          </div>

          {/* Infants */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-serif text-base sm:text-lg font-medium text-slate-100">
                  Infants
                </h4>
                <Badge variant="glass" size="xs">
                  Free
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Under 3 years (Pack & Play crib provided upon request)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={numInfants <= 0}
                onClick={() => handleInfantsChange(-1)}
                className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:hover:bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed"
                aria-label="Decrease Infants"
              >
                <Minus className="w-4 h-4 stroke-[2]" />
              </button>
              <span className="w-8 text-center font-serif text-lg font-bold text-slate-100 tabular-nums">
                {numInfants}
              </span>
              <button
                type="button"
                disabled={numInfants >= 4}
                onClick={() => handleInfantsChange(1)}
                className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:hover:bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed"
                aria-label="Increase Infants"
              >
                <Plus className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          </div>
        </div>

        {/* Resort Guest Policies Footer */}
        <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              All guests must present a valid government ID or passport at the concierge upon arrival.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-[#E5C483] shrink-0 mt-0.5" />
            <span>
              Infants do not count against maximum bed capacity. Complimentary baby crib is sanitized before check-in.
            </span>
          </div>
        </div>
      </DoubleBezel>
    </div>
  );
};
