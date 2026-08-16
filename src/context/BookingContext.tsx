import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Condo,
  Extra,
  PaymentMethod,
  SelectedExtra,
  PriceBreakdown,
  BookingStep,
  BookingWizardState,
  Booking,
} from '../types/booking';
import { condoPalApi } from '../lib/supabase';
import { calculateBookingPrice, validateCapacity } from '../lib/pricingEngine';
import { validateDateRange } from '../lib/dateUtils';
import { SEED_CONDOS, SEED_EXTRAS, SEED_PAYMENT_METHODS } from '../lib/seedData';

const DRAFT_STORAGE_KEY = 'condopal_booking_draft_v1';

export interface BookingContextValue {
  // Wizard state
  currentStep: BookingStep;
  condo: Condo | null;
  allCondos: Condo[];
  allExtras: Extra[];
  allPaymentMethods: PaymentMethod[];
  isLoadingData: boolean;

  // Guest inputs
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestNotes: string;
  contactPreference: 'whatsapp' | 'email' | 'sms';
  checkIn: string | null;
  checkOut: string | null;
  numAdults: number;
  numChildren: number;
  numInfants: number;
  selectedExtras: SelectedExtra[];
  paymentMethodId: string | null;
  paymentReferenceNumber: string;
  paymentProofUrl: string | null;
  agreeToHouseRules: boolean;

  // Pricing breakdown
  pricingBreakdown: PriceBreakdown | null;
  nightsCount: number;

  // Navigation & step controls
  goToStep: (step: BookingStep) => void;
  nextStep: () => boolean;
  prevStep: () => void;
  canProceedToStep: (step: BookingStep) => { valid: boolean; error?: string };

  // Setters
  setCondo: (condo: Condo) => void;
  setCondoById: (condoId: string) => void;
  setGuestInfo: (info: {
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    guestNotes?: string;
    contactPreference?: 'whatsapp' | 'email' | 'sms';
  }) => void;
  setDates: (checkIn: string | null, checkOut: string | null) => void;
  setGuests: (adults: number, children: number, infants: number) => void;
  setExtraQuantity: (extraId: string, quantity: number) => void;
  toggleExtra: (extraId: string) => void;
  setPaymentDetails: (details: {
    paymentMethodId?: string | null;
    paymentReferenceNumber?: string;
    paymentProofUrl?: string | null;
    agreeToHouseRules?: boolean;
  }) => void;

  // Submission & draft recovery
  submitBooking: () => Promise<{ success: boolean; booking: Booking; bookingCode: string; accessToken: string }>;
  isSubmitting: boolean;
  submitError: string | null;
  hasDraftSaved: boolean;
  restoreDraft: () => void;
  clearDraft: () => void;
  resetWizard: () => void;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allCondos, setAllCondos] = useState<Condo[]>(SEED_CONDOS);
  const [allExtras, setAllExtras] = useState<Extra[]>(SEED_EXTRAS);
  const [allPaymentMethods, setAllPaymentMethods] = useState<PaymentMethod[]>(SEED_PAYMENT_METHODS);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [condo, setCondoState] = useState<Condo | null>(SEED_CONDOS[0] || null);

  // Guest inputs
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestNotes, setGuestNotes] = useState<string>('');
  const [contactPreference, setContactPreference] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');

  // Dates
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);

  // Occupancy
  const [numAdults, setNumAdults] = useState<number>(2);
  const [numChildren, setNumChildren] = useState<number>(0);
  const [numInfants, setNumInfants] = useState<number>(0);

  // Extras & Payment
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(
    SEED_PAYMENT_METHODS[0]?.id || null
  );
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState<string>('');
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [agreeToHouseRules, setAgreeToHouseRules] = useState<boolean>(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasDraftSaved, setHasDraftSaved] = useState<boolean>(false);

  // Initial Data Fetch
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [condosData, extrasData, paymentsData] = await Promise.all([
          condoPalApi.getCondos(),
          condoPalApi.getExtras(),
          condoPalApi.getPaymentMethods(),
        ]);
        if (mounted) {
          if (condosData && condosData.length > 0) {
            setAllCondos(condosData);
            if (!condo) {
              setCondoState(condosData[0]);
            }
          }
          if (extrasData && extrasData.length > 0) {
            setAllExtras(extrasData);
          }
          if (paymentsData && paymentsData.length > 0) {
            setAllPaymentMethods(paymentsData);
            if (!paymentMethodId) {
              setPaymentMethodId(paymentsData[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch live Supabase data, using seed data:', err);
      } finally {
        if (mounted) setIsLoadingData(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Check URL Search Params on mount for quick links (e.g. ?condo=azure-sky-penthouse&step=2)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const condoParam = params.get('condo') || params.get('unit');
    if (condoParam) {
      const match = allCondos.find((c) => c.slug === condoParam || c.id === condoParam);
      if (match) setCondoState(match);
    }
    const stepParam = params.get('step');
    if (stepParam) {
      const stepNum = parseInt(stepParam, 10);
      if (stepNum >= 1 && stepNum <= 5) {
        setCurrentStep(stepNum as BookingStep);
      }
    }
    const checkInParam = params.get('checkIn') || params.get('in');
    const checkOutParam = params.get('checkOut') || params.get('out');
    if (checkInParam && checkOutParam) {
      setCheckIn(checkInParam);
      setCheckOut(checkOutParam);
    }
    const adultsParam = params.get('adults');
    if (adultsParam) setNumAdults(Math.max(1, parseInt(adultsParam, 10)));
    const childrenParam = params.get('children');
    if (childrenParam) setNumChildren(Math.max(0, parseInt(childrenParam, 10)));

    // Check if draft exists in LocalStorage
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        setHasDraftSaved(true);
      }
    } catch {
      // ignore
    }
  }, [allCondos]);

  // Sync Draft to LocalStorage whenever state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!guestName && !checkIn && selectedExtras.length === 0) return;

    try {
      const draft: BookingWizardState & { contactPreference: string } = {
        currentStep,
        condoId: condo?.id || null,
        guestName,
        guestEmail,
        guestPhone,
        guestNotes,
        checkIn,
        checkOut,
        numAdults,
        numChildren,
        numInfants,
        selectedExtras,
        paymentMethodId,
        paymentReferenceNumber,
        paymentProofUrl,
        agreeToHouseRules,
        contactPreference,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setHasDraftSaved(true);
    } catch {
      // LocalStorage error fallback
    }
  }, [
    currentStep,
    condo,
    guestName,
    guestEmail,
    guestPhone,
    guestNotes,
    contactPreference,
    checkIn,
    checkOut,
    numAdults,
    numChildren,
    numInfants,
    selectedExtras,
    paymentMethodId,
    paymentReferenceNumber,
    paymentProofUrl,
    agreeToHouseRules,
  ]);

  // Live Pricing Calculation
  const pricingBreakdown = useMemo<PriceBreakdown | null>(() => {
    if (!condo || !checkIn || !checkOut) return null;
    try {
      const validation = validateDateRange(checkIn, checkOut, condo.min_stay_nights, condo.max_stay_nights);
      if (!validation.valid) return null;

      return calculateBookingPrice({
        condo,
        checkIn,
        checkOut,
        numAdults,
        numChildren,
        selectedExtras,
        allExtras,
      });
    } catch (err) {
      return null;
    }
  }, [condo, checkIn, checkOut, numAdults, numChildren, selectedExtras, allExtras]);

  const nightsCount = pricingBreakdown?.nights || 0;

  // Validation Logic per step
  const canProceedToStep = useCallback(
    (targetStep: BookingStep): { valid: boolean; error?: string } => {
      if (!condo) {
        return { valid: false, error: 'Please select a luxury condo suite first.' };
      }

      // Validating Step 1: Guest Information
      if (targetStep > 1) {
        if (!guestName.trim() || guestName.trim().length < 2) {
          return { valid: false, error: 'Please enter your full name (minimum 2 characters).' };
        }
        if (!guestEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
          return { valid: false, error: 'Please enter a valid email address for booking confirmation.' };
        }
        if (!guestPhone.trim() || guestPhone.trim().length < 7) {
          return { valid: false, error: 'Please enter a valid contact phone or WhatsApp number.' };
        }
      }

      // Validating Step 2: Dates
      if (targetStep > 2) {
        if (!checkIn || !checkOut) {
          return { valid: false, error: 'Please select your check-in and check-out dates.' };
        }
        const dateVal = validateDateRange(checkIn, checkOut, condo.min_stay_nights, condo.max_stay_nights);
        if (!dateVal.valid) {
          return { valid: false, error: dateVal.error || 'Invalid date range selected.' };
        }
      }

      // Validating Step 3: Guests
      if (targetStep > 3) {
        if (numAdults < 1) {
          return { valid: false, error: 'At least 1 adult is required for reservation.' };
        }
        const capVal = validateCapacity(condo, numAdults, numChildren);
        if (!capVal.valid) {
          return { valid: false, error: capVal.error || 'Party size exceeds suite capacity.' };
        }
      }

      // Step 4 (Extras) is optional, can proceed to step 5.

      // Validating Step 5 (Payment & Submit)
      if (targetStep === 5) {
        if (!pricingBreakdown) {
          return { valid: false, error: 'Pricing calculation is incomplete.' };
        }
      }

      return { valid: true };
    },
    [condo, guestName, guestEmail, guestPhone, checkIn, checkOut, numAdults, numChildren, pricingBreakdown]
  );

  const goToStep = (step: BookingStep) => {
    const check = canProceedToStep(step);
    if (!check.valid && step > currentStep) {
      setSubmitError(check.error || 'Please complete the required fields first.');
      return;
    }
    setSubmitError(null);
    setCurrentStep(step);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const nextStep = (): boolean => {
    const next = (currentStep + 1) as BookingStep;
    if (next > 5) return false;
    const check = canProceedToStep(next);
    if (!check.valid) {
      setSubmitError(check.error || 'Please complete the current step before proceeding.');
      return false;
    }
    setSubmitError(null);
    setCurrentStep(next);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return true;
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setSubmitError(null);
      setCurrentStep((currentStep - 1) as BookingStep);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Setters
  const setCondo = (newCondo: Condo) => {
    setCondoState(newCondo);
  };

  const setCondoById = (condoId: string) => {
    const found = allCondos.find((c) => c.id === condoId || c.slug === condoId);
    if (found) setCondoState(found);
  };

  const setGuestInfo = (info: {
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    guestNotes?: string;
    contactPreference?: 'whatsapp' | 'email' | 'sms';
  }) => {
    if (info.guestName !== undefined) setGuestName(info.guestName);
    if (info.guestEmail !== undefined) setGuestEmail(info.guestEmail);
    if (info.guestPhone !== undefined) setGuestPhone(info.guestPhone);
    if (info.guestNotes !== undefined) setGuestNotes(info.guestNotes);
    if (info.contactPreference !== undefined) setContactPreference(info.contactPreference);
  };

  const setDates = (inDate: string | null, outDate: string | null) => {
    setCheckIn(inDate);
    setCheckOut(outDate);
  };

  const setGuests = (adults: number, children: number, infants: number) => {
    setNumAdults(adults);
    setNumChildren(children);
    setNumInfants(infants);
  };

  const setExtraQuantity = (extraId: string, quantity: number) => {
    setSelectedExtras((prev) => {
      const filtered = prev.filter((item) => item.extra_id !== extraId);
      if (quantity > 0) {
        return [...filtered, { extra_id: extraId, quantity }];
      }
      return filtered;
    });
  };

  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) => {
      const exists = prev.find((item) => item.extra_id === extraId);
      if (exists) {
        return prev.filter((item) => item.extra_id !== extraId);
      }
      return [...prev, { extra_id: extraId, quantity: 1 }];
    });
  };

  const setPaymentDetails = (details: {
    paymentMethodId?: string | null;
    paymentReferenceNumber?: string;
    paymentProofUrl?: string | null;
    agreeToHouseRules?: boolean;
  }) => {
    if (details.paymentMethodId !== undefined) setPaymentMethodId(details.paymentMethodId);
    if (details.paymentReferenceNumber !== undefined)
      setPaymentReferenceNumber(details.paymentReferenceNumber);
    if (details.paymentProofUrl !== undefined) setPaymentProofUrl(details.paymentProofUrl);
    if (details.agreeToHouseRules !== undefined) setAgreeToHouseRules(details.agreeToHouseRules);
  };

  // Restore & Clear Draft
  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved);
      if (draft.condoId) {
        const found = allCondos.find((c) => c.id === draft.condoId);
        if (found) setCondoState(found);
      }
      if (draft.guestName) setGuestName(draft.guestName);
      if (draft.guestEmail) setGuestEmail(draft.guestEmail);
      if (draft.guestPhone) setGuestPhone(draft.guestPhone);
      if (draft.guestNotes) setGuestNotes(draft.guestNotes);
      if (draft.contactPreference) setContactPreference(draft.contactPreference);
      if (draft.checkIn) setCheckIn(draft.checkIn);
      if (draft.checkOut) setCheckOut(draft.checkOut);
      if (draft.numAdults) setNumAdults(draft.numAdults);
      if (draft.numChildren !== undefined) setNumChildren(draft.numChildren);
      if (draft.numInfants !== undefined) setNumInfants(draft.numInfants);
      if (draft.selectedExtras) setSelectedExtras(draft.selectedExtras);
      if (draft.paymentMethodId) setPaymentMethodId(draft.paymentMethodId);
      if (draft.paymentReferenceNumber) setPaymentReferenceNumber(draft.paymentReferenceNumber);
      if (draft.paymentProofUrl) setPaymentProofUrl(draft.paymentProofUrl);
      if (draft.agreeToHouseRules !== undefined) setAgreeToHouseRules(draft.agreeToHouseRules);
      if (draft.currentStep) setCurrentStep(draft.currentStep);
    } catch {
      // ignore
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraftSaved(false);
    } catch {
      // ignore
    }
  };

  const resetWizard = () => {
    clearDraft();
    setCurrentStep(1);
    setGuestName('');
    setGuestEmail('');
    setGuestPhone('');
    setGuestNotes('');
    setCheckIn(null);
    setCheckOut(null);
    setNumAdults(2);
    setNumChildren(0);
    setNumInfants(0);
    setSelectedExtras([]);
    setPaymentReferenceNumber('');
    setPaymentProofUrl(null);
    setAgreeToHouseRules(false);
    setSubmitError(null);
  };

  // Submit Booking
  const submitBooking = async (): Promise<{
    success: boolean;
    booking: Booking;
    bookingCode: string;
    accessToken: string;
  }> => {
    if (!condo) throw new Error('No condo suite selected.');
    if (!checkIn || !checkOut) throw new Error('Stay dates must be selected.');
    if (!agreeToHouseRules) {
      throw new Error('Please review and accept the house rules & reservation terms.');
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Execute Atomic Booking RPC
      const result = await condoPalApi.createBookingAtomic({
        condo_id: condo.id,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        guest_notes: guestNotes || null,
        check_in: checkIn,
        check_out: checkOut,
        num_adults: numAdults,
        num_children: numChildren,
        num_infants: numInfants,
        selected_extras: selectedExtras,
        payment_method_id: paymentMethodId || undefined,
      });

      if (!result.success || !result.booking) {
        throw new Error('Failed to create reservation record.');
      }

      // 2. If proof of payment and reference were provided, submit proof immediately
      if (paymentReferenceNumber && paymentProofUrl) {
        await condoPalApi.submitPaymentProof({
          booking_code: result.booking_code,
          access_token: result.access_token,
          payment_method_id: paymentMethodId || undefined,
          payment_reference_number: paymentReferenceNumber,
          payment_proof_url: paymentProofUrl,
        });
        result.booking.payment_reference_number = paymentReferenceNumber;
        result.booking.payment_proof_url = paymentProofUrl;
        result.booking.payment_status = 'proof_submitted';
      }

      // 3. Clear draft and return
      clearDraft();

      return {
        success: true,
        booking: result.booking,
        bookingCode: result.booking_code,
        accessToken: result.access_token,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during reservation.';
      setSubmitError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BookingContext.Provider
      value={{
        currentStep,
        condo,
        allCondos,
        allExtras,
        allPaymentMethods,
        isLoadingData,
        guestName,
        guestEmail,
        guestPhone,
        guestNotes,
        contactPreference,
        checkIn,
        checkOut,
        numAdults,
        numChildren,
        numInfants,
        selectedExtras,
        paymentMethodId,
        paymentReferenceNumber,
        paymentProofUrl,
        agreeToHouseRules,
        pricingBreakdown,
        nightsCount,
        goToStep,
        nextStep,
        prevStep,
        canProceedToStep,
        setCondo,
        setCondoById,
        setGuestInfo,
        setDates,
        setGuests,
        setExtraQuantity,
        toggleExtra,
        setPaymentDetails,
        submitBooking,
        isSubmitting,
        submitError,
        hasDraftSaved,
        restoreDraft,
        clearDraft,
        resetWizard,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
