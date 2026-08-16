import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ArrowUpRight, Sparkles, Shield, Star, Award, Compass } from 'lucide-react';

export interface CondoHeroProps {
  onExploreClick: () => void;
  onBookClick: () => void;
}

export const CondoHero: React.FC<CondoHeroProps> = ({ onExploreClick, onBookClick }) => {
  return (
    <section className="relative min-h-[90dvh] flex items-center justify-center pt-28 pb-20 px-4 sm:px-6 overflow-hidden">
      {/* Background Ambient Imagery & Gradients */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=85"
          alt="Luxury Ridge Sanctuary"
          className="w-full h-full object-cover object-center opacity-25 scale-105 transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080B10]/80 via-[#080B10]/90 to-[#080B10]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#D4AF37]/15 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Badge variant="gold" size="sm" dot>
            Tagaytay Ridge Collection
          </Badge>
          <span className="hidden sm:inline-flex text-xs text-slate-400 font-sans tracking-wide">
            • Private Heated Plunge Pools & Butler Service
          </span>
        </div>

        {/* Hero Title with Editorial High-Contrast Serif */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-slate-100 font-medium tracking-tight leading-[1.08] max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
          Sanctuary Above <br className="hidden sm:inline" />
          <span className="italic font-light bg-gradient-to-r from-[#F3E5AB] via-[#E5C483] to-[#B89728] bg-clip-text text-transparent">
            The Clouds
          </span>
        </h1>

        {/* Hero Description */}
        <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-sans leading-relaxed font-light animate-in fade-in slide-in-from-bottom-8 duration-1000">
          Immerse yourself in architectural grandeur overlooking Taal Lake. Handcrafted penthouse
          suites, private infinity plunge pools, and seamless mobile check-in.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <Button
            size="lg"
            variant="gold"
            onClick={onBookClick}
            icon={<ArrowUpRight className="w-4 h-4 text-slate-950 stroke-[2]" />}
            className="w-full sm:w-auto shadow-[0_10px_30px_rgba(212,175,55,0.3)]"
          >
            Reserve Your Residence
          </Button>

          <Button
            size="lg"
            variant="glass"
            onClick={onExploreClick}
            icon={<Compass className="w-4 h-4 text-slate-200 stroke-[1.5]" />}
            className="w-full sm:w-auto"
          >
            Explore Residences
          </Button>
        </div>

        {/* Trust Badges Strip */}
        <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto text-left border-t border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[#E5C483]">
              <Star className="w-4 h-4 fill-current stroke-none" />
              <span className="text-xs font-semibold font-serif text-slate-100">4.98 / 5.0</span>
            </div>
            <p className="text-[11px] text-slate-400">Guest Review Rating</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-emerald-400">
              <Shield className="w-4 h-4 stroke-[1.5]" />
              <span className="text-xs font-semibold font-serif text-slate-100">Zero Overlap</span>
            </div>
            <p className="text-[11px] text-slate-400">Kernel Concurrency Lock</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[#E5C483]">
              <Sparkles className="w-4 h-4 stroke-[1.5]" />
              <span className="text-xs font-semibold font-serif text-slate-100">20% Down</span>
            </div>
            <p className="text-[11px] text-slate-400">Flexible Deposit Hold</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-slate-300">
              <Award className="w-4 h-4 stroke-[1.5]" />
              <span className="text-xs font-semibold font-serif text-slate-100">Aman-Tier</span>
            </div>
            <p className="text-[11px] text-slate-400">Bespoke Butler Service</p>
          </div>
        </div>
      </div>
    </section>
  );
};
