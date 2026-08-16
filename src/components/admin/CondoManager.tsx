import React, { useState } from 'react';
import type { Condo } from '../../types/booking';
import { DoubleBezel } from '../ui/DoubleBezel';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../lib/utils';
import {
  Building2,
  Save,
  Check,
  Plus,
  Trash2,
  Image as ImageIcon,
  DollarSign,
  Sparkles,
} from 'lucide-react';

export interface CondoManagerProps {
  condos: Condo[];
  onSaveCondo?: (updatedCondo: Condo) => void;
}

export const CondoManager: React.FC<CondoManagerProps> = ({
  condos,
  onSaveCondo,
}) => {
  const [selectedCondo, setSelectedCondo] = useState<Condo>(condos[0] || ({} as Condo));
  const [formData, setFormData] = useState<Condo>(condos[0] || ({} as Condo));
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [newAmenity, setNewAmenity] = useState<string>('');
  const [newImageUrl, setNewImageUrl] = useState<string>('');

  const handleSelectCondo = (condo: Condo) => {
    setSelectedCondo(condo);
    setFormData(condo);
    setSavedSuccess(false);
  };

  const handleInputChange = (field: keyof Condo, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddAmenity = () => {
    if (!newAmenity.trim()) return;
    setFormData((prev) => ({
      ...prev,
      amenities: [...prev.amenities, newAmenity.trim()],
    }));
    setNewAmenity('');
  };

  const handleRemoveAmenity = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, { url: newImageUrl.trim(), caption: 'Suite View' }],
    }));
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveCondo) {
      onSaveCondo(formData);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
      {/* Unit Selector Sidebar */}
      <div className="lg:col-span-4 space-y-3">
        <h3 className="font-serif text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#E5C483]" />
          Condo Inventory
        </h3>
        <div className="space-y-2.5">
          {condos.map((c) => {
            const isSelected = selectedCondo.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectCondo(c)}
                className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                  <img
                    src={c.cover_image || c.images[0]?.url}
                    alt={c.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-[#E5C483] font-semibold block truncate">
                    {c.location}
                  </span>
                  <h4 className="font-serif text-sm font-semibold text-slate-100 truncate">
                    {c.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="tabular-nums font-medium text-slate-200">
                      {formatCurrency(c.base_price_per_night)}/nt
                    </span>
                    <span>•</span>
                    <span>Max {c.max_guests} g</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Property Editor Form */}
      <div className="lg:col-span-8">
        <form onSubmit={handleSave}>
          <DoubleBezel glow innerClassName="p-6 sm:p-8 space-y-6">
            {/* Header & Save Action */}
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#E5C483] font-medium block">
                  Property Configuration
                </span>
                <h3 className="font-serif text-2xl font-semibold text-slate-100">
                  {formData.name}
                </h3>
              </div>
              <Button
                type="submit"
                size="sm"
                variant="gold"
                icon={savedSuccess ? <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" /> : <Save className="w-3.5 h-3.5 text-slate-950 stroke-[2]" />}
              >
                {savedSuccess ? 'Changes Saved!' : 'Save Updates'}
              </Button>
            </div>

            {/* Core Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Condo Suite Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div>
                <Input
                  label="Location Tagline"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                />
              </div>

              <div>
                <Input
                  label="Floor Area (sqm)"
                  type="number"
                  value={formData.floor_area_sqm || ''}
                  onChange={(e) => handleInputChange('floor_area_sqm', Number(e.target.value))}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-[0.15em] font-medium text-slate-400 mb-1.5">
                  Editorial Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full bg-[#0A0F1A] border border-white/10 rounded-2xl p-3.5 text-xs text-slate-100 outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>
            </div>

            {/* Pricing & Capacity Settings */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <h4 className="font-serif text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#E5C483]" />
                Rates & Capacity Limits
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input
                  label="Weekday (Sun-Thu)"
                  type="number"
                  value={formData.base_price_per_night}
                  onChange={(e) => handleInputChange('base_price_per_night', Number(e.target.value))}
                  required
                />
                <Input
                  label="Weekend (Fri-Sat)"
                  type="number"
                  value={formData.weekend_price_per_night}
                  onChange={(e) => handleInputChange('weekend_price_per_night', Number(e.target.value))}
                  required
                />
                <Input
                  label="Cleaning Fee"
                  type="number"
                  value={formData.cleaning_fee}
                  onChange={(e) => handleInputChange('cleaning_fee', Number(e.target.value))}
                  required
                />
                <Input
                  label="Max Guests"
                  type="number"
                  value={formData.max_guests}
                  onChange={(e) => handleInputChange('max_guests', Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Amenities Tag Manager */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <h4 className="font-serif text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#E5C483]" />
                Amenities & Inclusions
              </h4>
              <div className="flex flex-wrap gap-2">
                {formData.amenities.map((amenity, idx) => (
                  <Badge
                    key={idx}
                    variant="glass"
                    size="sm"
                    className="flex items-center gap-1.5 bg-white/[0.05] border-white/10"
                  >
                    <span>{amenity}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(idx)}
                      className="hover:text-rose-400 cursor-pointer"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Nespresso Machine, Smart Bidet, Bose Soundbar"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  className="flex-1 bg-[#0A0F1A] border border-white/10 rounded-full px-4 py-2 text-xs text-slate-100 outline-none focus:border-[#D4AF37]"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="glass"
                  onClick={handleAddAmenity}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Photo Gallery Manager */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <h4 className="font-serif text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#E5C483]" />
                Photo Gallery ({formData.images.length} Photos)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {formData.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group h-24 rounded-xl overflow-hidden bg-slate-900 border border-white/10"
                  >
                    <img src={img.url} alt={`Photo ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste image URL (https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 bg-[#0A0F1A] border border-white/10 rounded-full px-4 py-2 text-xs text-slate-100 outline-none focus:border-[#D4AF37]"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="glass"
                  onClick={handleAddImage}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Photo
                </Button>
              </div>
            </div>
          </DoubleBezel>
        </form>
      </div>
    </div>
  );
};
