import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { DoubleBezel } from '../ui/DoubleBezel';
import { formatCurrency } from '../../lib/utils';
import { formatDateDisplay } from '../../lib/dateUtils';
import {
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Tag,
} from 'lucide-react';

export const BookingSummaryCard: React.FC = () => {
  const { condo, checkIn, checkOut, numAdults, numChildren, pricingBreakdown } =
    useBooking();

  const [isMobileExpanded, setIsMobileExpanded] = useState<boolean>(false);

  if (!condo) return null;

  const totalGuests = numAdults + numChildren;

  return (
    <>
      {/* Desktop Sticky Card */}
      <div className="hidden lg:block sticky top-24 space-y-4">
        <DoubleBezel innerClassName="p-6 space-y-6">
          {/* Condo Summary Header */}
          <div className="flex gap-4 items-start border-b border-white/10 pb-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shrink-0">
              <img
                src={
                  condo.cover_image ||
                  condo.images[0]?.url ||
                  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80'
                }
                alt={condo.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#E5C483] font-medium block truncate">
                {condo.location}
              </span>
              <h3 className="font-serif text-lg font-semibold text-slate-100 truncate">
                {condo.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {condo.bedrooms} Bed • {condo.bathrooms} Bath • {condo.floor_area_sqm || 45} sqm
              </p>
            </div>
          </div>

          {/* Stay & Party Schedule Mini-Badges */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8 flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[#E5C483] shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Dates</span>
                <span className="text-xs font-semibold text-slate-200 block truncate">
                  {checkIn && checkOut
                    ? `${formatDateDisplay(checkIn, 'short')} - ${formatDateDisplay(checkOut, 'short')}`
                    : 'Select Dates'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8 flex items-center gap-2.5">
              <Users className="w-4 h-4 text-[#E5C483] shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Guests</span>
                <span className="text-xs font-semibold text-slate-200 block truncate">
                  {totalGuests} Guest{totalGuests !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Price Breakdown */}
          {pricingBreakdown ? (
            <div className="space-y-3 pt-2 border-t border-white/10 text-xs text-slate-300">
              {/* Base Lodging */}
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <span>Lodging ({pricingBreakdown.nights} nights)</span>
                </span>
                <span className="font-serif font-medium text-slate-200 tabular-nums">
                  {formatCurrency(pricingBreakdown.base_lodging_total)}
                </span>
              </div>

              {/* Length of Stay Discount if applicable */}
              {pricingBreakdown.length_of_stay_discount > 0 && (
                <div className="flex justify-between items-center text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Long Stay Savings ({pricingBreakdown.length_of_stay_discount_percent}%)</span>
                  </span>
                  <span className="font-serif font-medium tabular-nums">
                    - {formatCurrency(pricingBreakdown.length_of_stay_discount)}
                  </span>
                </div>
              )}

              {/* Cleaning Fee */}
              {pricingBreakdown.cleaning_fee > 0 && (
                <div className="flex justify-between items-center">
                  <span>Cleaning & Sanitation Fee</span>
                  <span className="font-serif font-medium text-slate-200 tabular-nums">
                    {formatCurrency(pricingBreakdown.cleaning_fee)}
                  </span>
                </div>
              )}

              {/* Extras Itemized List */}
              {pricingBreakdown.itemized_extras.map((extra) => (
                <div key={extra.extra_id} className="flex justify-between items-center text-slate-300">
                  <span className="truncate pr-2">
                    {extra.name} {extra.quantity > 1 ? `(×${extra.quantity})` : ''}
                  </span>
                  <span className="font-serif font-medium text-slate-200 tabular-nums shrink-0">
                    {formatCurrency(extra.total_price)}
                  </span>
                </div>
              ))}

              {/* Service Charge & Taxes */}
              <div className="flex justify-between items-center text-slate-400">
                <span>Resort Service Charge (10%)</span>
                <span className="font-serif tabular-nums">
                  {formatCurrency(pricingBreakdown.service_charge)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>Government Tax / VAT (12%)</span>
                <span className="font-serif tabular-nums">
                  {formatCurrency(pricingBreakdown.tax_amount)}
                </span>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                <span className="font-serif text-sm font-semibold text-slate-100">
                  Total Stay
                </span>
                <span className="font-serif text-2xl font-bold text-slate-100 tabular-nums">
                  {formatCurrency(pricingBreakdown.total_amount)}
                </span>
              </div>

              {/* 20% Deposit Due Now */}
              <div className="p-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#E5C483] font-semibold block">
                    Deposit Due Now (20%)
                  </span>
                  <span className="text-[11px] text-slate-400">Secures reservation</span>
                </div>
                <span className="font-serif text-lg font-bold text-[#F3E5AB] tabular-nums">
                  {formatCurrency(pricingBreakdown.reservation_fee_amount)}
                </span>
              </div>

              {/* Balance Due at Check-in */}
              <div className="flex justify-between items-center text-slate-400 text-[11px] px-1">
                <span>Balance payable upon arrival:</span>
                <span className="font-serif font-medium text-slate-200 tabular-nums">
                  {formatCurrency(pricingBreakdown.remaining_balance_amount)}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-slate-500">
              Select stay dates to calculate live itemized rates.
            </div>
          )}

          {/* Guarantee Badge */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero Double-Booking Guarantee</span>
          </div>
        </DoubleBezel>
      </div>

      {/* Mobile Collapsible Bottom Sheet / Summary Toggle */}
      <div className="lg:hidden">
        {/* Floating Trigger Bar if collapsed */}
        {pricingBreakdown && !isMobileExpanded && (
          <div className="fixed bottom-20 inset-x-4 max-w-lg mx-auto z-30">
            <button
              type="button"
              onClick={() => setIsMobileExpanded(true)}
              className="w-full px-4 py-2.5 rounded-full bg-[#0E1524]/95 backdrop-blur-xl border border-[#D4AF37]/40 shadow-xl flex items-center justify-between text-xs text-slate-200 transition-all cursor-pointer hover:border-[#D4AF37]"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#E5C483]" />
                <span className="font-medium">
                  {pricingBreakdown.nights} Nights • Total: <strong>{formatCurrency(pricingBreakdown.total_amount)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1 text-[#E5C483] font-semibold">
                <span>View Breakdown</span>
                <ChevronUp className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Mobile Slide-Up Modal Drawer */}
        {isMobileExpanded && pricingBreakdown && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#0C121E] border-t border-white/15 rounded-t-[2rem] p-6 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-slate-100">
                    Pricing Breakdown
                  </h3>
                  <p className="text-xs text-slate-400">{condo.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileExpanded(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-200"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Lodging ({pricingBreakdown.nights} nights)</span>
                  <span className="font-serif font-medium text-slate-100 tabular-nums">
                    {formatCurrency(pricingBreakdown.base_lodging_total)}
                  </span>
                </div>

                {pricingBreakdown.length_of_stay_discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Stay Discount</span>
                    <span className="font-serif font-medium tabular-nums">
                      - {formatCurrency(pricingBreakdown.length_of_stay_discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Cleaning Fee</span>
                  <span className="font-serif font-medium text-slate-100 tabular-nums">
                    {formatCurrency(pricingBreakdown.cleaning_fee)}
                  </span>
                </div>

                {pricingBreakdown.itemized_extras.map((extra) => (
                  <div key={extra.extra_id} className="flex justify-between">
                    <span>{extra.name}</span>
                    <span className="font-serif font-medium text-slate-100 tabular-nums">
                      {formatCurrency(extra.total_price)}
                    </span>
                  </div>
                ))}

                <div className="flex justify-between text-slate-400">
                  <span>Service Charge (10%)</span>
                  <span className="font-serif tabular-nums">
                    {formatCurrency(pricingBreakdown.service_charge)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Taxes / VAT (12%)</span>
                  <span className="font-serif tabular-nums">
                    {formatCurrency(pricingBreakdown.tax_amount)}
                  </span>
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                  <span className="font-serif text-base font-bold text-slate-100">
                    Grand Total
                  </span>
                  <span className="font-serif text-2xl font-bold text-slate-100 tabular-nums">
                    {formatCurrency(pricingBreakdown.total_amount)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex justify-between items-center">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#E5C483] font-bold block">
                      Deposit Due Now (20%)
                    </span>
                    <span className="text-[10px] text-slate-300">Locks in your dates</span>
                  </div>
                  <span className="font-serif text-xl font-bold text-[#F3E5AB] tabular-nums">
                    {formatCurrency(pricingBreakdown.reservation_fee_amount)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileExpanded(false)}
                className="w-full py-3 rounded-full bg-white/10 text-white font-medium text-xs tracking-wider uppercase transition-colors hover:bg-white/20"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
