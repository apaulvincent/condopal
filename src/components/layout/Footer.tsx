import React from 'react';
import { Badge } from '../ui/Badge';
import { ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative border-t border-white/10 bg-[#06090E] pt-20 pb-28 md:pb-16 text-slate-400 overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-[#D4AF37]/5 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Brand & Philosophy */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] flex items-center justify-center shadow-md shadow-[#D4AF37]/20">
                <span className="font-serif font-bold text-slate-950 text-sm">CP</span>
              </div>
              <span className="font-serif text-xl font-semibold text-slate-100 tracking-wide">
                CondoPal
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md font-sans">
              Curated luxury condominium & resort accommodation in Tagaytay Highlands. Experience
              bespoke private butler services, heated infinity plunge pools, and uninterrupted
              panoramic vistas above the clouds.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="gold" size="xs">
                Verified Residences
              </Badge>
              <Badge variant="emerald" size="xs">
                Zero Double-Booking Guarantee
              </Badge>
              <Badge variant="slate" size="xs">
                24/7 VIP Concierge
              </Badge>
            </div>
          </div>

          {/* Column 2: Exclusive Suites */}
          <div className="space-y-3">
            <h4 className="font-serif text-slate-100 text-sm tracking-wider uppercase">
              Curated Residences
            </h4>
            <ul className="space-y-2 text-xs font-sans">
              <li className="hover:text-[#E5C483] transition-colors cursor-pointer">
                Azure Sky Penthouse (Taal Ridge)
              </li>
              <li className="hover:text-[#E5C483] transition-colors cursor-pointer">
                Serenity Garden Suite (Lagoon)
              </li>
              <li className="hover:text-[#E5C483] transition-colors cursor-pointer">
                Luxe Horizon Loft (Sunset Tower)
              </li>
              <li className="hover:text-[#E5C483] transition-colors cursor-pointer">
                Private Villa Residences (Inquire)
              </li>
            </ul>
          </div>

          {/* Column 3: Concierge & Contact */}
          <div className="space-y-3">
            <h4 className="font-serif text-slate-100 text-sm tracking-wider uppercase">
              Direct Concierge
            </h4>
            <ul className="space-y-2.5 text-xs font-sans">
              <li className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-[#E5C483] stroke-[1.5]" />
                <span>+63 (917) 888-9999</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-[#E5C483] stroke-[1.5]" />
                <span>concierge@condopal.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-[#E5C483] stroke-[1.5]" />
                <span>Tagaytay Highlands, Cavite, PH</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Security Note */}
        <div className="pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400 stroke-[1.5]" />
            <span>256-Bit Encrypted Payment • Real-Time Database Concurrency Lock</span>
          </div>
          <p className="text-slate-500 font-sans">
            © {new Date().getFullYear()} CondoPal Luxury Properties. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
