import React from 'react';
import { DoubleBezel } from '../ui/DoubleBezel';
import { Badge } from '../ui/Badge';
import {
  Waves,
  Wifi,
  Sparkles,
  Utensils,
  Car,
  Wine,
} from 'lucide-react';

export interface AmenityHighlight {
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  isHero?: boolean;
}

const HIGHLIGHTS: AmenityHighlight[] = [
  {
    title: 'Private Heated Plunge Pools',
    category: 'Aquatics & Wellness',
    description:
      'Indulge in year-round thermal relaxation with temperature-controlled ozone filtration overlooking the majestic Taal Volcano caldera.',
    icon: <Waves className="w-6 h-6 text-[#E5C483] stroke-[1.5]" />,
    isHero: true,
  },
  {
    title: 'Ultra-Fast Starlink Satellite WiFi',
    category: 'Connectivity',
    description:
      'Uncapped 300+ Mbps priority bandwidth ensuring seamless 4K video conferencing and streaming.',
    icon: <Wifi className="w-5 h-5 text-emerald-400 stroke-[1.5]" />,
  },
  {
    title: 'Dedicated Butler & Concierge',
    category: 'White-Glove Hospitality',
    description:
      'From luggage handling to in-suite champagne service, your personal butler attends to every detail.',
    icon: <Sparkles className="w-5 h-5 text-[#E5C483] stroke-[1.5]" />,
  },
  {
    title: 'Chef-Curated In-Suite Dining',
    category: 'Gastronomy',
    description:
      'Private 4-course degustation dinners and teakwood floating villa breakfast baskets prepared daily.',
    icon: <Utensils className="w-5 h-5 text-[#E5C483] stroke-[1.5]" />,
  },
  {
    title: 'VIP Chauffeur & EV Superchargers',
    category: 'Transportation',
    description:
      'Mercedes-Benz V-Class airport transfers and private on-site Level 2 Tesla/Type 2 EV charging.',
    icon: <Car className="w-5 h-5 text-emerald-400 stroke-[1.5]" />,
  },
  {
    title: 'Sub-Zero & Italian Marble Kitchens',
    category: 'Interior Craft',
    description:
      'Bespoke Calacatta marble counters, Nespresso Atelier coffee bar, and dual-zone sommelier wine coolers.',
    icon: <Wine className="w-5 h-5 text-[#E5C483] stroke-[1.5]" />,
  },
];

export const AmenitiesList: React.FC = () => {
  return (
    <section className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge variant="gold" size="sm" dot>
            Resort Privileges
          </Badge>
          <h2 className="font-serif text-3xl sm:text-5xl text-slate-100 font-medium tracking-tight">
            Crafted for Extraordinary Living
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-sans leading-relaxed">
            Every residence seamlessly marries the intimacy of a private home with the world-class
            amenities of a 5-star highland sanctuary.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HIGHLIGHTS.map((item, idx) => (
            <DoubleBezel
              key={idx}
              glow={item.isHero}
              className={item.isHero ? 'md:col-span-2' : 'md:col-span-1'}
              innerClassName="p-6 sm:p-8 flex flex-col justify-between h-full"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center shadow-inner">
                    {item.icon}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-slate-400">
                    {item.category}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold text-slate-100">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 font-sans leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {item.isHero && (
                <div className="mt-6 pt-4 border-t border-white/8 flex items-center gap-2 text-xs text-[#E5C483]">
                  <Sparkles className="w-4 h-4" />
                  <span>Available across all Tagaytay Summit Residences</span>
                </div>
              )}
            </DoubleBezel>
          ))}
        </div>
      </div>
    </section>
  );
};
