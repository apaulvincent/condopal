import React, { useState } from 'react';
import type { Extra, ExtraPriceType } from '../../types/booking';
import { DoubleBezel } from '../ui/DoubleBezel';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../lib/utils';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Save,
  Check,
} from 'lucide-react';

export interface ExtrasSettingsProps {
  extras: Extra[];
  onSaveExtras?: (updatedExtras: Extra[]) => void;
}

export const ExtrasSettings: React.FC<ExtrasSettingsProps> = ({
  extras,
  onSaveExtras,
}) => {
  const [extrasList, setExtrasList] = useState<Extra[]>(extras);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleToggleEnabled = (extraId: string) => {
    const updated = extrasList.map((e) =>
      e.id === extraId ? { ...e, is_enabled: !e.is_enabled } : e
    );
    setExtrasList(updated);
    if (onSaveExtras) onSaveExtras(updated);
  };

  const handleEdit = (extra: Extra) => {
    setEditingExtra({ ...extra });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExtra) return;

    let updated: Extra[];
    if (extrasList.some((e) => e.id === editingExtra.id)) {
      updated = extrasList.map((e) => (e.id === editingExtra.id ? editingExtra : e));
    } else {
      updated = [...extrasList, editingExtra];
    }

    setExtrasList(updated);
    if (onSaveExtras) onSaveExtras(updated);
    setEditingExtra(null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddNew = () => {
    const newExtra: Extra = {
      id: `ext-${Date.now()}`,
      name: 'New Custom Add-on',
      slug: `custom-${Date.now()}`,
      description: 'Describe the luxury experience and inclusions.',
      price: 1500,
      price_type: 'per_stay',
      icon: 'Sparkles',
      category: 'services',
      max_quantity: 1,
      is_enabled: true,
      sort_order: extrasList.length + 1,
    };
    setEditingExtra(newExtra);
  };

  const handleDelete = (id: string) => {
    const updated = extrasList.filter((e) => e.id !== id);
    setExtrasList(updated);
    if (onSaveExtras) onSaveExtras(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DoubleBezel glow innerClassName="p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#E5C483]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#E5C483] font-medium block">
                Add-on Services
              </span>
              <h3 className="font-serif text-2xl font-semibold text-slate-100">
                Curated Extras & Experiences Manager
              </h3>
            </div>
          </div>

          <Button
            size="sm"
            variant="gold"
            onClick={handleAddNew}
            icon={<Plus className="w-3.5 h-3.5 text-slate-950 stroke-[2]" />}
          >
            Create Add-on
          </Button>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Add-on configuration updated successfully!</span>
          </div>
        )}

        {/* Extras Table */}
        <div className="rounded-2xl border border-white/10 bg-[#0A0F1A]/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Service Name</th>
                  <th className="py-3.5 px-4 font-semibold">Pricing Model</th>
                  <th className="py-3.5 px-4 font-semibold">Price</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 text-slate-200">
                {extrasList.map((extra) => (
                  <tr key={extra.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{extra.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-sm">
                        {extra.description}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="glass" size="xs">
                        {extra.price_type.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-serif font-bold text-slate-100 tabular-nums">
                      {formatCurrency(extra.price)}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleEnabled(extra.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                          extra.is_enabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-500 border border-white/10'
                        }`}
                      >
                        {extra.is_enabled ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(extra)}
                          className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(extra.id)}
                          className="w-7 h-7 rounded-full bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 flex items-center justify-center transition-all cursor-pointer"
                          title="Delete Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit / Add Modal Form */}
        {editingExtra && (
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-[#D4AF37]/30 space-y-4">
            <h4 className="font-serif text-lg font-semibold text-slate-100">
              Edit Add-on Service: {editingExtra.name}
            </h4>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Service Name"
                  value={editingExtra.name}
                  onChange={(e) =>
                    setEditingExtra({ ...editingExtra, name: e.target.value })
                  }
                  required
                />

                <Input
                  label="Price (₱)"
                  type="number"
                  value={editingExtra.price}
                  onChange={(e) =>
                    setEditingExtra({
                      ...editingExtra,
                      price: Number(e.target.value),
                    })
                  }
                  required
                />

                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] font-medium text-slate-400 mb-1.5">
                    Pricing Model
                  </label>
                  <select
                    value={editingExtra.price_type}
                    onChange={(e) =>
                      setEditingExtra({
                        ...editingExtra,
                        price_type: e.target.value as ExtraPriceType,
                      })
                    }
                    className="w-full bg-[#0A0F1A] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-slate-100 outline-none"
                  >
                    <option value="per_stay">Per Stay (One-time charge)</option>
                    <option value="per_night">Per Night</option>
                    <option value="per_guest">Per Guest</option>
                    <option value="per_guest_per_night">Per Guest / Night</option>
                  </select>
                </div>

                <Input
                  label="Max Quantity Available"
                  type="number"
                  value={editingExtra.max_quantity}
                  onChange={(e) =>
                    setEditingExtra({
                      ...editingExtra,
                      max_quantity: Number(e.target.value),
                    })
                  }
                  required
                />

                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-[0.15em] font-medium text-slate-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={editingExtra.description}
                    onChange={(e) =>
                      setEditingExtra({
                        ...editingExtra,
                        description: e.target.value,
                      })
                    }
                    className="w-full bg-[#0A0F1A] border border-white/10 rounded-2xl p-3 text-xs text-slate-100 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="glass"
                  onClick={() => setEditingExtra(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="gold"
                  icon={<Save className="w-3.5 h-3.5 text-slate-950 stroke-[2]" />}
                >
                  Save Add-on
                </Button>
              </div>
            </form>
          </div>
        )}
      </DoubleBezel>
    </div>
  );
};
