import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { Step1GuestInfo } from '../components/booking/Step1GuestInfo';
import { Step2DatePicker } from '../components/booking/Step2DatePicker';
import { Step3GuestDetails } from '../components/booking/Step3GuestDetails';
import { Step4Extras } from '../components/booking/Step4Extras';
import { Step5Payment } from '../components/booking/Step5Payment';
import { BookingSummaryCard } from '../components/booking/BookingSummaryCard';
import { MobileActionBar } from '../components/layout/MobileActionBar';
import { Button } from '../components/ui/Button';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export interface BookingViewProps {
  onBackToShowcase?: () => void;
  onBookingConfirmed?: (bookingCode: string) => void;
}

export const BookingView: React.FC<BookingViewProps> = ({
  onBackToShowcase,
  onBookingConfirmed,
}) => {
  const {
    currentStep,
    condo,
    pricingBreakdown,
    nightsCount,
    goToStep,
    nextStep,
    prevStep,
    canProceedToStep,
    submitBooking,
    isSubmitting,
    submitError,
    hasDraftSaved,
    restoreDraft,
    clearDraft,
  } = useBooking();

  const [validationError, setValidationError] = useState<string | null>(null);

  const stepLabels = [
    { step: 1, label: 'Guest Info' },
    { step: 2, label: 'Dates' },
    { step: 3, label: 'Guests' },
    { step: 4, label: 'Add-ons' },
    { step: 5, label: 'Payment' },
  ];

  const handleNext = () => {
    setValidationError(null);
    const success = nextStep();
    if (!success) {
      const check = canProceedToStep(((currentStep + 1) as any));
      if (!check.valid) {
        setValidationError(check.error || 'Please fill in required fields.');
      }
    }
  };

  const handleSubmit = async () => {
    setValidationError(null);
    try {
      const result = await submitBooking();
      if (result && result.bookingCode) {
        if (onBookingConfirmed) {
          onBookingConfirmed(result.bookingCode);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reservation failed.';
      setValidationError(msg);
    }
  };

  return (
    <div className="pt-28 pb-32 px-4 sm:px-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Top Header & Breadcrumb */}
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
              Reservation Wizard
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-100">
              {condo ? condo.name : 'Luxury Suite Reservation'}
            </h1>
          </div>
        </div>

        {/* Draft Notice if available */}
        {hasDraftSaved && currentStep === 1 && (
          <div className="flex items-center gap-2 p-2 rounded-full bg-white/[0.04] border border-white/10 text-xs">
            <span className="text-slate-400 pl-2">Draft recovered</span>
            <button
              type="button"
              onClick={restoreDraft}
              className="text-[#E5C483] font-semibold hover:underline cursor-pointer"
            >
              Resume
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={clearDraft}
              className="text-slate-400 hover:text-rose-400 cursor-pointer pr-2"
            >
              Discard
            </button>
          </div>
        )}
      </div>

      {/* 5-Step Progress Stepper Bar */}
      <div className="p-2 sm:p-3 rounded-full bg-[#0E1524]/80 backdrop-blur-xl border border-white/10 shadow-lg flex items-center justify-between overflow-x-auto">
        {stepLabels.map((item, idx) => {
          const isActive = currentStep === item.step;
          const isCompleted = currentStep > item.step;
          const canJump = canProceedToStep(item.step as any).valid || isCompleted;

          return (
            <React.Fragment key={item.step}>
              <button
                type="button"
                onClick={() => {
                  if (canJump) goToStep(item.step as any);
                }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] text-slate-950 font-bold shadow-md shadow-[#D4AF37]/20 scale-105'
                    : isCompleted
                    ? 'text-[#E5C483] hover:bg-white/5 cursor-pointer'
                    : canJump
                    ? 'text-slate-300 hover:text-white cursor-pointer'
                    : 'text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? 'bg-slate-950 text-[#E5C483]'
                      : isCompleted
                      ? 'bg-[#D4AF37]/20 text-[#E5C483]'
                      : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : item.step}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
              {idx < stepLabels.length - 1 && (
                <div
                  className={`hidden md:block flex-1 h-px mx-1 transition-all ${
                    isCompleted ? 'bg-[#D4AF37]/40' : 'bg-white/10'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Error Alert Display */}
      {(submitError || validationError) && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Please check the following:</span>
            <span>{submitError || validationError}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Wizard Form & Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Step Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {currentStep === 1 && <Step1GuestInfo />}
          {currentStep === 2 && <Step2DatePicker />}
          {currentStep === 3 && <Step3GuestDetails />}
          {currentStep === 4 && <Step4Extras />}
          {currentStep === 5 && <Step5Payment />}

          {/* Step Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {currentStep > 1 ? (
              <Button
                variant="glass"
                size="md"
                onClick={prevStep}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Previous Step
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <Button
                variant="gold"
                size="md"
                onClick={handleNext}
                icon={<ArrowRight className="w-4 h-4 text-slate-950 stroke-[2.5]" />}
              >
                Continue to {stepLabels[currentStep]?.label || 'Next'}
              </Button>
            ) : (
              <Button
                variant="gold"
                size="lg"
                isLoading={isSubmitting}
                onClick={handleSubmit}
                icon={<CheckCircle2 className="w-5 h-5 text-slate-950 stroke-[2.5]" />}
                className="shadow-xl shadow-[#D4AF37]/30"
              >
                Complete Booking & Lock In Stay
              </Button>
            )}
          </div>
        </div>

        {/* Right Side: Sticky Itemized Quotation */}
        <div className="lg:col-span-4">
          <BookingSummaryCard />
        </div>
      </div>

      {/* Sticky Mobile Action Bar */}
      <MobileActionBar
        totalAmount={pricingBreakdown?.total_amount}
        nightsCount={nightsCount}
        onActionClick={currentStep === 5 ? handleSubmit : handleNext}
        actionText={
          currentStep === 5
            ? 'Complete Booking'
            : `Next: ${stepLabels[currentStep]?.label || 'Continue'}`
        }
        isLoading={isSubmitting}
      />
    </div>
  );
};
