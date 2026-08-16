import React, { useState } from 'react';
import type { Booking } from '../types/booking';
import { condoPalApi } from '../lib/supabase';
import { BoardingPassVoucher } from '../components/voucher/BoardingPassVoucher';
import { DoubleBezel } from '../components/ui/DoubleBezel';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Search,
  Key,
  Mail,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

export interface LookupViewProps {
  onBackToShowcase?: () => void;
}

export const LookupView: React.FC<LookupViewProps> = ({ onBackToShowcase }) => {
  const [bookingCode, setBookingCode] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [foundBooking, setFoundBooking] = useState<Booking | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCode.trim()) {
      setSearchError('Please enter your Booking Reference Code.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const data = await condoPalApi.getBookingByCode(
        bookingCode.trim(),
        guestEmail.trim() || undefined
      );

      if (data) {
        setFoundBooking(data);
      } else {
        setSearchError(
          `No reservation found matching "${bookingCode}". Please verify your reference code or email address.`
        );
      }
    } catch (err: unknown) {
      setSearchError(
        err instanceof Error ? err.message : 'Error locating reservation.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleDemoFill = (code: string, email: string) => {
    setBookingCode(code);
    setGuestEmail(email);
  };

  return (
    <div className="pt-28 pb-32 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToShowcase && (
            <Button
              variant="glass"
              size="sm"
              onClick={onBackToShowcase}
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Suites
            </Button>
          )}
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#E5C483] font-semibold block">
              Guest Portal
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-100">
              Find & Manage Your Reservation
            </h1>
          </div>
        </div>

        <Badge variant="emerald" size="sm" dot>
          Live Status & Pass Recovery
        </Badge>
      </div>

      {/* Search Box if no booking loaded yet */}
      {!foundBooking && (
        <DoubleBezel glow innerClassName="p-6 sm:p-10 space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center mx-auto text-[#E5C483]">
              <Search className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-slate-100">
              Reservation Lookup
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Enter your Booking Code (from confirmation SMS or email) and registered email.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <Input
              label="Booking Reference Code"
              placeholder="e.g. CP-2026-98K1A"
              value={bookingCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBookingCode(e.target.value.toUpperCase())}
              leftIcon={<Key className="w-4 h-4" />}
              className="uppercase tracking-widest font-mono font-bold text-base"
              required
            />

            <Input
              type="email"
              label="Guest Email Address (Optional for verification)"
              placeholder="e.g. alex.montgomery@example.com"
              value={guestEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuestEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            {searchError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              variant="gold"
              isLoading={isSearching}
              icon={<Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />}
              className="w-full justify-center shadow-lg shadow-[#D4AF37]/20"
            >
              Locate Reservation
            </Button>
          </form>

          {/* Demo Quick-Fill Links */}
          <div className="pt-4 border-t border-white/10 text-center space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
              Quick Demo Reservations:
            </span>
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={() =>
                  handleDemoFill('CP-2026-98K1A', 'alex.montgomery@example.com')
                }
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[#E5C483] border border-white/10 transition-colors cursor-pointer"
              >
                CP-2026-98K1A (Confirmed)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDemoFill('CP-2026-72F9B', 'beatrice.tan@example.com')
                }
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 transition-colors cursor-pointer"
              >
                CP-2026-72F9B (Under Review)
              </button>
            </div>
          </div>
        </DoubleBezel>
      )}

      {/* Found Booking Display */}
      {foundBooking && (
        <div className="space-y-4 animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setFoundBooking(null);
                setBookingCode('');
                setGuestEmail('');
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Search Another Booking</span>
            </button>
            <Badge variant="gold" size="xs">
              Match Found
            </Badge>
          </div>

          <BoardingPassVoucher booking={foundBooking} />
        </div>
      )}
    </div>
  );
};
