import React, { useState, useEffect } from 'react';
import type { Booking } from '../../types/booking';
import { DoubleBezel } from '../ui/DoubleBezel';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { formatDateDisplay } from '../../lib/dateUtils';
import {
  Copy,
  Check,
  Printer,
  Calendar,
  Phone,
  Key,
  Wifi,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export interface BoardingPassVoucherProps {
  booking: Booking;
  onReuploadProof?: () => void;
}

export const BoardingPassVoucher: React.FC<BoardingPassVoucherProps> = ({
  booking,
  onReuploadProof,
}) => {
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
  });

  // Calculate live countdown to check-in date at 2:00 PM
  useEffect(() => {
    const updateTimer = () => {
      const checkInDate = new Date(`${booking.check_in}T14:00:00`);
      const now = new Date();
      const diff = checkInDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0 });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdown({ days, hours, minutes });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [booking.check_in]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(booking.booking_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadICS = () => {
    const start = booking.check_in.replace(/-/g, '') + 'T140000Z';
    const end = booking.check_out.replace(/-/g, '') + 'T110000Z';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CondoPal Luxury Residences//EN',
      'BEGIN:VEVENT',
      `UID:${booking.id}@condopal.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:Stay at ${booking.condo?.name || 'CondoPal Luxury Suite'}`,
      `DESCRIPTION:Booking Reference: ${booking.booking_code}. Check-in PIN: 8492. Concierge: +63 917 890 1234`,
      `LOCATION:${booking.condo?.location || 'Tagaytay Highlands, Philippines'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CondoPal_Reservation_${booking.booking_code}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusDisplay = () => {
    if (booking.booking_status === 'confirmed') {
      return {
        variant: 'emerald' as const,
        label: 'Confirmed & Verified',
        description: 'Your reservation is locked. Present voucher upon arrival.',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      };
    }
    if (booking.payment_status === 'proof_submitted') {
      return {
        variant: 'amber' as const,
        label: 'Proof Under Review',
        description: 'Our concierge is validating your payment (typically within 1 hour).',
        icon: <Clock className="w-4 h-4 text-amber-400" />,
      };
    }
    if (booking.payment_status === 'rejected' || booking.booking_status === 'rejected') {
      return {
        variant: 'rose' as const,
        label: 'Payment Action Required',
        description: booking.rejection_reason || 'Payment verification failed. Please re-upload proof.',
        icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
      };
    }
    return {
      variant: 'gold' as const,
      label: 'Pending Deposit Payment',
      description: 'Please complete your deposit transfer to guarantee your reservation.',
      icon: <Clock className="w-4 h-4 text-[#E5C483]" />,
    };
  };

  const status = getStatusDisplay();
  const totalGuests = booking.num_adults + booking.num_children;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 print:m-0 print:p-0">
      {/* Top Status Notification Banner */}
      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#E5C483] shrink-0">
            <Sparkles className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={status.variant} size="xs" dot>
                {status.label}
              </Badge>
              <span className="text-xs font-mono text-[#E5C483]">
                {booking.booking_code}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{status.description}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            size="sm"
            variant="glass"
            onClick={handlePrint}
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Voucher
          </Button>
          <Button
            size="sm"
            variant="gold"
            onClick={handleDownloadICS}
            icon={<Calendar className="w-3.5 h-3.5 text-slate-950 stroke-[2]" />}
          >
            Add to Calendar
          </Button>
        </div>
      </div>

      {/* Main Luxury Boarding-Pass Card */}
      <DoubleBezel
        glow
        outerClassName="print:border-none print:shadow-none print:p-0"
        innerClassName="p-0 overflow-hidden bg-[#0A0F1A] border border-white/15 print:border-black/20 print:bg-white print:text-black"
      >
        {/* Ticket Header Ribbon */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#0C121E] via-[#141E33] to-[#0C121E] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:bg-stone-100 print:border-black/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#E5C483] font-bold">
                CondoPal VIP Boarding Pass
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-100 print:text-slate-900">
              {booking.condo?.name || 'Luxury Condominium Suite'}
            </h2>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#E5C483]" />
              {booking.condo?.location || 'Tagaytay Highlands, Cavite, Philippines'}
            </p>
          </div>

          <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 print:text-slate-600">
              Booking Reference
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#E5C483] tracking-widest print:text-slate-900">
                {booking.booking_code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer print:hidden"
                aria-label="Copy booking code"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Perforated Divider Bar */}
        <div className="relative py-2 bg-[#080B10] flex items-center justify-between overflow-hidden print:bg-white">
          <div className="w-6 h-6 rounded-full bg-[#080B10] -ml-3 border-r border-white/15 print:border-black/20" />
          <div className="flex-1 border-b-2 border-dashed border-white/15 print:border-black/30 mx-2" />
          <div className="w-6 h-6 rounded-full bg-[#080B10] -mr-3 border-l border-white/15 print:border-black/20" />
        </div>

        {/* Ticket Main Content Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1 & 2: Stay Information */}
          <div className="md:col-span-2 space-y-6">
            {/* Guest & Schedule Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/8 print:bg-stone-50 print:border-black/10">
              <div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-medium block">
                  Lead Guest
                </span>
                <p className="font-serif text-sm font-semibold text-slate-100 print:text-slate-900 mt-0.5">
                  {booking.guest_name}
                </p>
                <p className="text-[11px] text-slate-400 print:text-slate-600 truncate">{booking.guest_email}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-medium block">
                  Check-in Date
                </span>
                <p className="font-serif text-sm font-semibold text-slate-100 print:text-slate-900 mt-0.5">
                  {formatDateDisplay(booking.check_in, 'weekday')}
                </p>
                <p className="text-[11px] text-[#E5C483] font-medium">After 2:00 PM</p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-medium block">
                  Check-out Date
                </span>
                <p className="font-serif text-sm font-semibold text-slate-100 print:text-slate-900 mt-0.5">
                  {formatDateDisplay(booking.check_out, 'weekday')}
                </p>
                <p className="text-[11px] text-slate-400 print:text-slate-600">Before 11:00 AM</p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-medium block">
                  Duration
                </span>
                <p className="font-serif text-sm font-semibold text-slate-100 print:text-slate-900 mt-0.5">
                  {booking.pricing_breakdown?.nights || 1} Nights
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-medium block">
                  Party Size
                </span>
                <p className="font-serif text-sm font-semibold text-slate-100 print:text-slate-900 mt-0.5">
                  {totalGuests} Guests ({booking.num_adults} Ad, {booking.num_children} Ch)
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-medium block">
                  Payment Mode
                </span>
                <p className="font-serif text-sm font-semibold text-slate-100 print:text-slate-900 mt-0.5">
                  {booking.payment_method?.name || 'GCash / Bank'}
                </p>
              </div>
            </div>

            {/* Check-in Access & Secret Lockbox PIN */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-transparent border border-emerald-500/30 print:bg-stone-50 print:border-black/20 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="font-serif text-base font-semibold text-slate-100 print:text-slate-900">
                  Concierge Access & Arrival Guidelines
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 print:bg-white print:border-black/10">
                  <div className="flex items-center gap-1.5 text-[#E5C483] mb-1">
                    <Key className="w-3.5 h-3.5" />
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Lockbox PIN</span>
                  </div>
                  <span className="font-mono text-lg font-bold text-slate-100 print:text-slate-900">
                    8492
                  </span>
                  <p className="text-[10px] text-slate-400 print:text-slate-600 mt-0.5">At Suite Entrance</p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 print:bg-white print:border-black/10">
                  <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                    <Wifi className="w-3.5 h-3.5" />
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Starlink WiFi</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-100 print:text-slate-900 block truncate">
                    CondoPal_VIP_Guest
                  </span>
                  <p className="text-[10px] text-slate-400 print:text-slate-600 mt-0.5">Pass: Highlands2026</p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 print:bg-white print:border-black/10">
                  <div className="flex items-center gap-1.5 text-[#E5C483] mb-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="font-semibold uppercase tracking-wider text-[10px]">24/7 Concierge</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-100 print:text-slate-900 block">
                    +63 917 890 1234
                  </span>
                  <p className="text-[10px] text-slate-400 print:text-slate-600 mt-0.5">WhatsApp / Phone</p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-2 text-xs border-t border-white/10 pt-4 print:border-black/20">
              <div className="flex justify-between text-slate-400 print:text-slate-600">
                <span>Total Stay Amount</span>
                <span className="font-serif font-semibold text-slate-200 print:text-slate-900 tabular-nums">
                  {formatCurrency(booking.total_amount)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-400 print:text-emerald-800">
                <span>20% Reservation Deposit</span>
                <span className="font-serif font-semibold tabular-nums">
                  {formatCurrency(booking.reservation_fee)}
                </span>
              </div>
              <div className="flex justify-between text-slate-200 print:text-slate-900 font-semibold pt-1 border-t border-white/10 print:border-black/20">
                <span>Balance Payable at Check-in</span>
                <span className="font-serif text-sm font-bold text-[#E5C483] print:text-slate-900 tabular-nums">
                  {formatCurrency(booking.balance_due || booking.total_amount - booking.reservation_fee)}
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Dynamic SVG QR & Verification Code */}
          <div className="flex flex-col items-center justify-between p-6 rounded-2xl bg-white/[0.03] border border-white/10 print:bg-stone-50 print:border-black/20 text-center">
            <div className="space-y-3 w-full">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#E5C483] font-bold block">
                Digital Pass QR
              </span>

              {/* High-Resolution Standalone SVG QR Box */}
              <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center border border-white/20">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full text-slate-950 fill-current"
                  aria-label={`QR Code for ${booking.booking_code}`}
                >
                  {/* Outer Position Detection Patterns */}
                  {/* Top Left */}
                  <rect x="5" y="5" width="28" height="28" fill="none" stroke="#000" strokeWidth="4" rx="3" />
                  <rect x="11" y="11" width="16" height="16" fill="#000" rx="2" />
                  {/* Top Right */}
                  <rect x="67" y="5" width="28" height="28" fill="none" stroke="#000" strokeWidth="4" rx="3" />
                  <rect x="73" y="11" width="16" height="16" fill="#000" rx="2" />
                  {/* Bottom Left */}
                  <rect x="5" y="67" width="28" height="28" fill="none" stroke="#000" strokeWidth="4" rx="3" />
                  <rect x="11" y="73" width="16" height="16" fill="#000" rx="2" />

                  {/* Timing & Alignment Bits */}
                  <rect x="38" y="7" width="5" height="5" />
                  <rect x="48" y="7" width="5" height="5" />
                  <rect x="58" y="7" width="5" height="5" />
                  <rect x="7" y="38" width="5" height="5" />
                  <rect x="7" y="48" width="5" height="5" />
                  <rect x="7" y="58" width="5" height="5" />

                  {/* Data Matrix Elements */}
                  <rect x="38" y="20" width="5" height="5" />
                  <rect x="48" y="20" width="5" height="5" />
                  <rect x="58" y="20" width="5" height="5" />
                  <rect x="38" y="35" width="6" height="6" />
                  <rect x="50" y="35" width="6" height="6" />
                  <rect x="62" y="35" width="6" height="6" />
                  <rect x="75" y="38" width="5" height="5" />
                  <rect x="85" y="38" width="5" height="5" />
                  <rect x="75" y="48" width="5" height="5" />
                  <rect x="85" y="58" width="5" height="5" />
                  <rect x="38" y="48" width="5" height="5" />
                  <rect x="48" y="48" width="5" height="5" />
                  <rect x="58" y="48" width="5" height="5" />
                  <rect x="38" y="62" width="6" height="6" />
                  <rect x="50" y="62" width="6" height="6" />
                  <rect x="62" y="62" width="6" height="6" />
                  <rect x="75" y="72" width="5" height="5" />
                  <rect x="85" y="72" width="5" height="5" />
                  <rect x="75" y="82" width="5" height="5" />
                  <rect x="85" y="82" width="5" height="5" />
                  <rect x="42" y="78" width="6" height="6" />
                  <rect x="54" y="78" width="6" height="6" />
                  <rect x="42" y="88" width="6" height="6" />
                  <rect x="54" y="88" width="6" height="6" />
                  <rect x="62" y="88" width="5" height="5" />
                </svg>
              </div>

              <span className="text-[10px] text-slate-400 print:text-slate-600 block">
                Scan at lobby kiosk or present to concierge
              </span>
            </div>

            {/* Countdown to Check-In */}
            <div className="w-full pt-4 border-t border-white/10 print:border-black/20">
              <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 block mb-1">
                Countdown to Check-in
              </span>
              <div className="flex items-center justify-center gap-2 font-mono">
                <div className="p-2 rounded-lg bg-white/[0.05] print:bg-white min-w-[42px]">
                  <span className="text-base font-bold text-slate-100 print:text-slate-900 block">
                    {countdown.days}
                  </span>
                  <span className="text-[8px] uppercase text-slate-500">Days</span>
                </div>
                <span className="text-slate-500 font-bold">:</span>
                <div className="p-2 rounded-lg bg-white/[0.05] print:bg-white min-w-[42px]">
                  <span className="text-base font-bold text-slate-100 print:text-slate-900 block">
                    {countdown.hours}
                  </span>
                  <span className="text-[8px] uppercase text-slate-500">Hours</span>
                </div>
                <span className="text-slate-500 font-bold">:</span>
                <div className="p-2 rounded-lg bg-white/[0.05] print:bg-white min-w-[42px]">
                  <span className="text-base font-bold text-slate-100 print:text-slate-900 block">
                    {countdown.minutes}
                  </span>
                  <span className="text-[8px] uppercase text-slate-500">Mins</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Re-upload button if rejected */}
        {booking.payment_status === 'rejected' && onReuploadProof && (
          <div className="p-4 bg-rose-500/15 border-t border-rose-500/30 flex items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Payment proof was rejected: {booking.rejection_reason || 'Please upload a clearer receipt.'}</span>
            </div>
            <Button size="sm" variant="gold" onClick={onReuploadProof}>
              Re-upload Proof
            </Button>
          </div>
        )}
      </DoubleBezel>
    </div>
  );
};
