import React, { useState } from 'react';
import type { CondoImage } from '../../types/booking';
import { Modal } from '../ui/Modal';
import { Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';

export interface CondoGalleryProps {
  images: CondoImage[];
  title?: string;
}

export const CondoGallery: React.FC<CondoGalleryProps> = ({ images, title = 'Residence Gallery' }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length);
    }
  };

  return (
    <div className="space-y-4">
      {/* Primary Asymmetrical Mosaic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Featured Photo (Large Spanning 2 Cols) */}
        <div
          onClick={() => setSelectedIndex(0)}
          className="md:col-span-2 relative rounded-3xl overflow-hidden aspect-[16/10] bg-slate-900 border border-white/10 group cursor-pointer"
        >
          <img
            src={images[0].url}
            alt={images[0].caption || title}
            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <span className="font-serif text-sm text-slate-100 font-medium">
              {images[0].caption || 'Main Sanctuary View'}
            </span>
            <span className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
              <Maximize2 className="w-4 h-4 stroke-[1.5]" />
            </span>
          </div>
        </div>

        {/* Stacked Secondary Photos */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
          {images.slice(1, 3).map((img, idx) => (
            <div
              key={idx + 1}
              onClick={() => setSelectedIndex(idx + 1)}
              className="relative rounded-3xl overflow-hidden aspect-[16/10] bg-slate-900 border border-white/10 group cursor-pointer"
            >
              <img
                src={img.url}
                alt={img.caption || `Gallery photo ${idx + 2}`}
                className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-50 group-hover:opacity-80 transition-opacity" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-xs font-sans text-slate-200 truncate">
                  {img.caption || `Photo ${idx + 2}`}
                </span>
                <span className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                  <Maximize2 className="w-3 h-3 stroke-[1.5]" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <Modal
          isOpen={selectedIndex !== null}
          onClose={() => setSelectedIndex(null)}
          maxWidth="4xl"
          title={images[selectedIndex]?.caption || title}
          subtitle={`Image ${selectedIndex + 1} of ${images.length}`}
        >
          <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-black">
            <img
              src={images[selectedIndex]?.url}
              alt={images[selectedIndex]?.caption || title}
              className="w-full h-full object-contain"
            />
            {/* Nav Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 flex items-center justify-center text-white transition-all"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2]" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 flex items-center justify-center text-white transition-all"
                >
                  <ChevronRight className="w-5 h-5 stroke-[2]" />
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
