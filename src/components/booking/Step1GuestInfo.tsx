import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { DoubleBezel } from '../ui/DoubleBezel';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { User, Mail, Phone, MessageSquare, Sparkles } from 'lucide-react';

export const Step1GuestInfo: React.FC = () => {
  const {
    guestName,
    guestEmail,
    guestPhone,
    guestNotes,
    contactPreference,
    setGuestInfo,
  } = useBooking();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DoubleBezel glow innerClassName="p-6 sm:p-8 space-y-6">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="gold" size="xs">
                Step 01 / 05
              </Badge>
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-medium">
                Guest Identification
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-100">
              Who is staying with us?
            </h2>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-[#E5C483] font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Direct VIP Concierge
            </span>
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <Input
              label="Full Legal Name"
              placeholder="e.g. Maria Clara Santos"
              value={guestName}
              onChange={(e) => setGuestInfo({ guestName: e.target.value })}
              leftIcon={<User className="w-4 h-4" />}
              helperText="As it appears on your government-issued ID for resort check-in."
              required
            />
          </div>

          {/* Email Address */}
          <div>
            <Input
              type="email"
              label="Email Address"
              placeholder="e.g. maria.santos@luxury.ph"
              value={guestEmail}
              onChange={(e) => setGuestInfo({ guestEmail: e.target.value })}
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Booking voucher & PIN codes will be sent here."
              required
            />
          </div>

          {/* Mobile / WhatsApp Number */}
          <div>
            <Input
              type="tel"
              label="Mobile / WhatsApp Number"
              placeholder="e.g. +63 917 123 4567"
              value={guestPhone}
              onChange={(e) => setGuestInfo({ guestPhone: e.target.value })}
              leftIcon={<Phone className="w-4 h-4" />}
              helperText="For rapid arrival coordination & concierge messaging."
              required
            />
          </div>
        </div>

        {/* Communication Preference */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="block text-xs uppercase tracking-[0.15em] font-medium text-slate-400">
            Preferred Communication Channel
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { id: 'whatsapp', label: 'WhatsApp', desc: 'Fastest updates' },
              { id: 'email', label: 'Email', desc: 'Official voucher' },
              { id: 'sms', label: 'SMS / Text', desc: 'Direct alerts' },
            ].map((channel) => {
              const isSelected = contactPreference === channel.id;
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() =>
                    setGuestInfo({
                      contactPreference: channel.id as 'whatsapp' | 'email' | 'sms',
                    })
                  }
                  className={`p-3 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-[#E5C483]' : 'text-slate-200'
                      }`}
                    >
                      {channel.label}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#E5C483] animate-pulse" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{channel.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Special Requests */}
        <div className="space-y-1.5 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="block text-xs uppercase tracking-[0.15em] font-medium text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#E5C483]" />
              Special Requests & Notes (Optional)
            </label>
            <span className="text-[10px] text-slate-500">
              {guestNotes.length} / 500 characters
            </span>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-1 border border-white/10 focus-within:border-[#D4AF37]/60 transition-all duration-300">
            <textarea
              rows={3}
              maxLength={500}
              placeholder="e.g. Late arrival around 8:00 PM, celebrating our wedding anniversary, request extra fluffy towels..."
              value={guestNotes}
              onChange={(e) => setGuestInfo({ guestNotes: e.target.value })}
              className="w-full bg-[#0A0F1A]/80 rounded-[calc(1rem-0.25rem)] p-3 text-sm text-slate-100 placeholder-slate-500 outline-none resize-none"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Special requests are subject to availability upon arrival. Our team will do our utmost to accommodate your desires.
          </p>
        </div>
      </DoubleBezel>
    </div>
  );
};
