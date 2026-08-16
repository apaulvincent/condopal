import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { DoubleBezel } from '../ui/DoubleBezel';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../lib/utils';
import {
  QrCode,
  Copy,
  Check,
  UploadCloud,
  FileCheck,
  X,
  AlertCircle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const Step5Payment: React.FC = () => {
  const {
    allPaymentMethods,
    paymentMethodId,
    paymentReferenceNumber,
    paymentProofUrl,
    agreeToHouseRules,
    pricingBreakdown,
    setPaymentDetails,
  } = useBooking();

  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const selectedMethod =
    allPaymentMethods.find((p) => p.id === paymentMethodId) ||
    allPaymentMethods[0] ||
    null;

  const handleCopyAccount = (accNumber: string) => {
    navigator.clipboard.writeText(accNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    // For browser / mock, convert to base64 Data URL so it can be previewed & stored
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPaymentDetails({ paymentProofUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DoubleBezel glow innerClassName="p-6 sm:p-8 space-y-6">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="gold" size="xs">
                Step 05 / 05
              </Badge>
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-medium">
                Reservation & Payment
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-100">
              Confirm your reservation
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="emerald" size="sm" dot>
              20% Reservation Deposit
            </Badge>
          </div>
        </div>

        {/* Deposit Calculation Summary Card */}
        {pricingBreakdown && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-white/[0.04] to-[#D4AF37]/[0.08] border border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.18em] text-[#E5C483] font-medium block mb-1">
                Reservation Fee Due Now (20%)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-slate-100 tabular-nums">
                  {formatCurrency(pricingBreakdown.reservation_fee_amount)}
                </span>
                <span className="text-xs text-slate-400">
                  of {formatCurrency(pricingBreakdown.total_amount)} Total Stay
                </span>
              </div>
            </div>
            <div className="sm:text-right border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
              <span className="text-[11px] text-slate-400 block">
                Remaining Balance at Check-in:
              </span>
              <span className="font-serif text-lg font-semibold text-slate-200 tabular-nums">
                {formatCurrency(pricingBreakdown.remaining_balance_amount)}
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">
                Payable via Cash / Card / GCash upon arrival
              </span>
            </div>
          </div>
        )}

        {/* Payment Channels Tabs */}
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-[0.15em] font-medium text-slate-400">
            Select Payment Channel
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {allPaymentMethods.map((method) => {
              const isSelected = selectedMethod?.id === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentDetails({ paymentMethodId: method.id })}
                  className={`p-3 rounded-2xl border text-center transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37]/70 shadow-[0_0_15px_rgba(212,175,55,0.2)] scale-[1.02]'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <span
                    className={`font-serif text-sm font-semibold block ${
                      isSelected ? 'text-[#E5C483]' : 'text-slate-200'
                    }`}
                  >
                    {method.name}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">
                    {method.type.replace('_', ' ')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Payment Channel Details & QR */}
        {selectedMethod && (
          <div className="p-5 rounded-2xl bg-[#080D17] border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* QR Code Column */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.04] border border-white/10">
              <div className="w-40 h-40 bg-white rounded-lg p-2 shadow-lg flex items-center justify-center relative overflow-hidden">
                {selectedMethod.qr_code_url ? (
                  <img
                    src={selectedMethod.qr_code_url}
                    alt={`${selectedMethod.name} QR Code`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-900 text-center p-2">
                    <QrCode className="w-16 h-16 stroke-[1.5] text-slate-900 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">
                      Scan {selectedMethod.name}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-[0.15em] font-medium mt-2">
                Scan to Pay
              </span>
            </div>

            {/* Account Details Column */}
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-medium">
                  Account Name
                </span>
                <p className="font-serif text-lg font-semibold text-slate-100">
                  {selectedMethod.account_name}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-medium">
                  Account / Mobile Number
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-bold text-[#E5C483] tracking-widest bg-white/[0.05] px-3.5 py-1.5 rounded-xl border border-white/10">
                    {selectedMethod.account_number}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyAccount(selectedMethod.account_number)}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedAccount ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                        <span className="text-emerald-400 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                        <span>Copy Number</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                {selectedMethod.instructions}
              </p>
            </div>
          </div>
        )}

        {/* Payment Reference Number & Proof Upload */}
        <div className="space-y-4 pt-2 border-t border-white/10">
          <div>
            <Input
              label="Transaction Reference Number"
              placeholder="e.g. 100294829103 or Trace ID"
              value={paymentReferenceNumber}
              onChange={(e) => setPaymentDetails({ paymentReferenceNumber: e.target.value })}
              helperText="Enter the reference / trace number generated by your banking or e-wallet app."
              required
            />
          </div>

          {/* Drag & Drop Proof Uploader */}
          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-[0.15em] font-medium text-slate-400">
              Upload Proof of Payment / Receipt Screenshot
            </label>

            {paymentProofUrl ? (
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-emerald-500/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                    <img
                      src={paymentProofUrl}
                      alt="Uploaded receipt"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-slate-100">
                        Payment Receipt Attached
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Ready for instant concierge verification.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentDetails({ paymentProofUrl: null })}
                  className="w-8 h-8 rounded-full bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 flex items-center justify-center text-rose-300 transition-all cursor-pointer"
                  aria-label="Remove receipt"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
                  isDragOver
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-white/15 hover:border-white/30 bg-white/[0.02]'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#E5C483]">
                  <UploadCloud className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Drag and drop your payment screenshot here
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supports JPG, PNG, WebP up to 10MB
                  </p>
                </div>
                <label className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs text-[#E5C483] font-semibold cursor-pointer transition-all">
                  Browse Files
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
              </div>
            )}
          </div>
        </div>

        {/* Terms & House Rules Agreement */}
        <div className="pt-3 border-t border-white/10">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreeToHouseRules}
              onChange={(e) => setPaymentDetails({ agreeToHouseRules: e.target.checked })}
              className="mt-1 w-4 h-4 rounded border-white/20 text-[#D4AF37] focus:ring-[#D4AF37] bg-[#0A0F1A] cursor-pointer"
            />
            <div className="text-xs text-slate-300 leading-relaxed">
              I agree to the{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsPolicyModalOpen(true);
                }}
                className="text-[#E5C483] underline hover:text-[#F3E5AB] font-medium"
              >
                House Rules & 48-Hour Cancellation Policy
              </button>
              , understand that a 20% reservation fee secures these calendar dates, and confirm all guest details are accurate.
            </div>
          </label>
        </div>
      </DoubleBezel>

      {/* House Rules & Cancellation Policy Modal */}
      <Modal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        title="House Rules & Reservation Policy"
        subtitle="CondoPal Luxury Residences • Tagaytay Highlands"
      >
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed py-2">
          <div className="space-y-2">
            <h4 className="font-serif text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#E5C483]" />
              Check-in & Check-out Schedule
            </h4>
            <p>
              Check-in begins strictly at <strong>2:00 PM</strong>. Check-out is by <strong>11:00 AM</strong> to allow our dedicated housekeeping staff ample time for thorough disinfection and turndown prep.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-[#E5C483]" />
              Cancellation & Refund Terms
            </h4>
            <p>
              Cancellations made <strong>48 hours or more</strong> prior to check-in are eligible for a 100% full refund of the reservation fee. Cancellations made within 48 hours are non-refundable but may be rescheduled subject to availability.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#E5C483]" />
              House Conduct & Quiet Hours
            </h4>
            <p>
              To maintain tranquility for all resort guests, quiet hours are observed between <strong>10:00 PM and 7:00 AM</strong>. Smoking is strictly prohibited inside the condominium suite and is restricted to designated outdoor balconies.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
