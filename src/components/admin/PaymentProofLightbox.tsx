import React, { useState } from 'react';
import type { Booking } from '../../types/booking';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { formatDateRangeDisplay } from '../../lib/dateUtils';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  User,
  Calendar,
  CreditCard,
  FileImage,
} from 'lucide-react';

export interface PaymentProofLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onVerify: (bookingId: string, amount: number, notes?: string) => Promise<void>;
  onReject: (bookingId: string, reason: string) => Promise<void>;
}

export const PaymentProofLightbox: React.FC<PaymentProofLightboxProps> = ({
  isOpen,
  onClose,
  booking,
  onVerify,
  onReject,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>(
    'Reference number does not match banking records.'
  );
  const [showRejectForm, setShowRejectForm] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!booking) return null;

  const handleZoomIn = () => setZoom((z) => Math.min(3, z + 0.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, z - 0.25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleCopyRef = (refNum: string) => {
    navigator.clipboard.writeText(refNum);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const depositAmount = booking.reservation_fee || Math.round(booking.total_amount * 0.2);
      await onVerify(booking.id, depositAmount, adminNotes);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    setIsProcessing(true);
    try {
      await onReject(booking.id, rejectionReason);
      setShowRejectForm(false);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={`Payment Verification • ${booking.booking_code}`}
      subtitle={`${booking.condo?.name || 'Condo Suite'} • Guest: ${booking.guest_name}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left Side: Proof Viewer with Zoom & Rotate Controls */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="relative h-[380px] sm:h-[420px] rounded-2xl bg-[#060910] border border-white/10 overflow-hidden flex items-center justify-center p-4">
            {booking.payment_proof_url ? (
              <img
                src={booking.payment_proof_url}
                alt="Payment proof screenshot"
                className="max-h-full max-w-full object-contain transition-transform duration-300"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              />
            ) : (
              <div className="text-center text-slate-500 space-y-2">
                <FileImage className="w-12 h-12 mx-auto stroke-[1.2]" />
                <p className="text-xs">No image receipt attached.</p>
              </div>
            )}

            {/* Float Controls */}
            {booking.payment_proof_url && (
              <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 px-4 pointer-events-auto">
                <div className="bg-[#080B10]/90 backdrop-blur-xl border border-white/15 rounded-full p-1 flex items-center gap-1 shadow-2xl">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono font-semibold text-slate-300 px-1">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white ml-1 cursor-pointer"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                    title="Reset"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cross-Reference & Approval Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4 text-xs">
            {/* Reference Checker Box */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
                  Guest Reference #
                </span>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="font-mono text-base font-bold text-[#E5C483] tracking-wider truncate">
                    {booking.payment_reference_number || 'None provided'}
                  </span>
                  {booking.payment_reference_number && (
                    <button
                      type="button"
                      onClick={() => handleCopyRef(booking.payment_reference_number!)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-slate-200 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedRef ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Payment Method:</span>
                  <span className="font-semibold text-slate-200">
                    {booking.payment_method?.name || 'GCash / Bank'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Deposit Required:</span>
                  <span className="font-semibold text-[#E5C483] tabular-nums">
                    {formatCurrency(booking.reservation_fee)}
                  </span>
                </div>
              </div>
            </div>

            {/* Guest Summary Details */}
            <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 text-slate-300">
                <User className="w-3.5 h-3.5 text-[#E5C483]" />
                <span className="font-medium">{booking.guest_name}</span>
                <span className="text-slate-500">({booking.guest_phone})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-[#E5C483]" />
                <span>{formatDateRangeDisplay(booking.check_in, booking.check_out)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CreditCard className="w-3.5 h-3.5 text-[#E5C483]" />
                <span>Total Stay: {formatCurrency(booking.total_amount)}</span>
              </div>
            </div>

            {/* Rejection Form or Admin Notes Input */}
            {showRejectForm ? (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2.5">
                <label className="block text-[11px] font-semibold text-rose-300">
                  Select Rejection Reason
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-[#0A0F1A] border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
                >
                  <option value="Reference number does not match banking records.">
                    Reference number mismatch
                  </option>
                  <option value="Image blurred or unreadable. Please upload a clear receipt.">
                    Blurred / Unreadable image
                  </option>
                  <option value="Insufficient payment amount received.">
                    Incorrect transfer amount
                  </option>
                  <option value="Payment transferred to incorrect account.">
                    Invalid payment destination
                  </option>
                </select>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="glass"
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 justify-center"
                  >
                    Cancel
                  </Button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleRejectConfirm}
                    className="flex-1 py-2 px-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Admin Internal Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified via GCash App ref 9821, clear."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full bg-[#0A0F1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-[#D4AF37]"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!showRejectForm && (
            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <Button
                size="md"
                variant="glass"
                onClick={() => setShowRejectForm(true)}
                icon={<XCircle className="w-4 h-4 text-rose-400" />}
                className="flex-1 justify-center hover:border-rose-500/50 hover:text-rose-300"
              >
                Reject Proof
              </Button>
              <Button
                size="md"
                variant="emerald"
                isLoading={isProcessing}
                onClick={handleApprove}
                icon={<CheckCircle2 className="w-4 h-4" />}
                className="flex-1 justify-center"
              >
                Approve Payment
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
