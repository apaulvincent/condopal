import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Booking } from '../types/booking';
import { condoPalApi } from '../lib/supabase';
import { BoardingPassVoucher } from '../components/voucher/BoardingPassVoucher';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { DoubleBezel } from '../components/ui/DoubleBezel';
import {
  Sparkles,
  ArrowLeft,
  UploadCloud,
  FileCheck,
  Check,
  AlertCircle,
} from 'lucide-react';

export interface ConfirmationViewProps {
  bookingCode: string;
  onNavigateHome?: () => void;
  onNavigateToBooking?: () => void;
}

export const ConfirmationView: React.FC<ConfirmationViewProps> = ({
  bookingCode,
  onNavigateHome,
  onNavigateToBooking,
}) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Re-upload Modal State
  const [isReuploadOpen, setIsReuploadOpen] = useState<boolean>(false);
  const [reuploadRef, setReuploadRef] = useState<string>('');
  const [reuploadProofUrl, setReuploadProofUrl] = useState<string | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState<boolean>(false);
  const [reuploadSuccess, setReuploadSuccess] = useState<boolean>(false);

  // Fetch Booking and fire celebration confetti
  useEffect(() => {
    let mounted = true;

    async function loadBooking() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await condoPalApi.getBookingByCode(bookingCode);
        if (mounted) {
          if (data) {
            setBooking(data);
            // Fire luxury gold & emerald confetti celebration
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#D4AF37', '#10B981', '#F3E5AB', '#FFFFFF'],
              });
            } catch {
              // Canvas confetti fallback
            }
          } else {
            setError(`Reservation with code ${bookingCode} could not be found.`);
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error retrieving booking voucher.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    if (bookingCode) {
      loadBooking();
    }

    return () => {
      mounted = false;
    };
  }, [bookingCode]);

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setReuploadProofUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReuploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !reuploadProofUrl) return;

    setIsSubmittingProof(true);
    try {
      await condoPalApi.submitPaymentProof({
        booking_code: booking.booking_code,
        access_token: booking.access_token,
        payment_reference_number: reuploadRef || booking.payment_reference_number || 'RESUBMITTED',
        payment_proof_url: reuploadProofUrl,
      });

      // Update local state
      setBooking((prev: Booking | null) =>
        prev
          ? {
              ...prev,
              payment_proof_url: reuploadProofUrl,
              payment_reference_number: reuploadRef || prev.payment_reference_number,
              payment_status: 'proof_submitted',
              booking_status: 'pending',
            }
          : prev
      );

      setReuploadSuccess(true);
      setTimeout(() => {
        setReuploadSuccess(false);
        setIsReuploadOpen(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingProof(false);
    }
  };

  return (
    <div className="pt-28 pb-32 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onNavigateHome && (
            <Button
              variant="glass"
              size="sm"
              onClick={onNavigateHome}
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to Home
            </Button>
          )}
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#E5C483] font-semibold block">
              Reservation Confirmed
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-100">
              Your Luxury Stay Voucher
            </h1>
          </div>
        </div>

        {onNavigateToBooking && (
          <Button
            size="sm"
            variant="gold"
            onClick={onNavigateToBooking}
            icon={<Sparkles className="w-3.5 h-3.5 text-slate-950 stroke-[2]" />}
          >
            Reserve Another Stay
          </Button>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <DoubleBezel innerClassName="p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mx-auto" />
          <h3 className="font-serif text-xl text-slate-200">
            Generating your VIP Boarding Pass...
          </h3>
          <p className="text-xs text-slate-400">Locking calendar dates and compiling PIN codes.</p>
        </DoubleBezel>
      )}

      {/* Error View */}
      {error && !isLoading && (
        <DoubleBezel innerClassName="p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl text-slate-100">Voucher Lookup Notice</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">{error}</p>
          {onNavigateHome && (
            <Button variant="gold" size="md" onClick={onNavigateHome}>
              Return to Showcase
            </Button>
          )}
        </DoubleBezel>
      )}

      {/* Boarding Pass Voucher Component */}
      {booking && !isLoading && (
        <BoardingPassVoucher
          booking={booking}
          onReuploadProof={() => setIsReuploadOpen(true)}
        />
      )}

      {/* Proof Re-upload Modal */}
      <Modal
        isOpen={isReuploadOpen}
        onClose={() => setIsReuploadOpen(false)}
        title="Re-upload Proof of Payment"
        subtitle={`Booking Reference: ${booking?.booking_code}`}
      >
        <form onSubmit={handleReuploadSubmit} className="space-y-4 pt-2">
          {reuploadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Receipt submitted successfully for review!</span>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-[0.15em] font-medium text-slate-400 mb-1">
              Payment Reference Number
            </label>
            <input
              type="text"
              placeholder="e.g. 100294829103"
              value={reuploadRef}
              onChange={(e) => setReuploadRef(e.target.value)}
              className="w-full bg-[#0A0F1A] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-[0.15em] font-medium text-slate-400">
              Attach Clear Screenshot
            </label>
            {reuploadProofUrl ? (
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-200">New receipt selected</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReuploadProofUrl(null)}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <label className="p-6 rounded-2xl border-2 border-dashed border-white/15 hover:border-white/30 text-center flex flex-col items-center justify-center gap-2 cursor-pointer bg-white/[0.02] transition-colors block">
                <UploadCloud className="w-6 h-6 text-[#E5C483]" />
                <span className="text-xs text-slate-300">Click or drag receipt screenshot here</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <Button
              type="button"
              size="sm"
              variant="glass"
              onClick={() => setIsReuploadOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="gold"
              isLoading={isSubmittingProof}
              disabled={!reuploadProofUrl}
            >
              Submit Proof
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
