import React, { useState } from 'react';
import type { PaymentMethod } from '../../types/booking';
import { DoubleBezel } from '../ui/DoubleBezel';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  CreditCard,
  QrCode,
  Edit2,
  Save,
  Check,
} from 'lucide-react';

export interface PaymentMethodsSettingsProps {
  paymentMethods: PaymentMethod[];
  onSavePaymentMethods?: (methods: PaymentMethod[]) => void;
}

export const PaymentMethodsSettings: React.FC<PaymentMethodsSettingsProps> = ({
  paymentMethods,
  onSavePaymentMethods,
}) => {
  const [methodsList, setMethodsList] = useState<PaymentMethod[]>(paymentMethods);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleToggleEnabled = (id: string) => {
    const updated = methodsList.map((m) =>
      m.id === id ? { ...m, is_enabled: !m.is_enabled } : m
    );
    setMethodsList(updated);
    if (onSavePaymentMethods) onSavePaymentMethods(updated);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod({ ...method });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod) return;

    let updated: PaymentMethod[];
    if (methodsList.some((m) => m.id === editingMethod.id)) {
      updated = methodsList.map((m) =>
        m.id === editingMethod.id ? editingMethod : m
      );
    } else {
      updated = [...methodsList, editingMethod];
    }

    setMethodsList(updated);
    if (onSavePaymentMethods) onSavePaymentMethods(updated);
    setEditingMethod(null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DoubleBezel glow innerClassName="p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#E5C483]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#E5C483] font-medium block">
                Payment Gateways
              </span>
              <h3 className="font-serif text-2xl font-semibold text-slate-100">
                Payment Methods & QR Settings
              </h3>
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Payment channels updated successfully!</span>
          </div>
        )}

        {/* Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methodsList.map((m) => (
            <div
              key={m.id}
              className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                m.is_enabled
                  ? 'bg-white/[0.03] border-white/10'
                  : 'bg-white/[0.01] border-white/5 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-base font-bold text-slate-100">
                      {m.name}
                    </span>
                    <Badge variant="glass" size="xs">
                      {m.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleEnabled(m.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      m.is_enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500 border border-white/10'
                    }`}
                  >
                    {m.is_enabled ? 'Active' : 'Disabled'}
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider block">
                      Account Name:
                    </span>
                    <span className="font-medium text-slate-200">{m.account_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider block">
                      Account / Mobile:
                    </span>
                    <span className="font-mono font-bold text-[#E5C483] tracking-wider">
                      {m.account_number}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                    {m.instructions}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" />
                  {m.qr_code_url ? 'Custom QR Active' : 'Default QR'}
                </span>
                <Button
                  size="sm"
                  variant="glass"
                  onClick={() => handleEdit(m)}
                  icon={<Edit2 className="w-3 h-3" />}
                >
                  Edit Details
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Modal / Form */}
        {editingMethod && (
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-[#D4AF37]/30 space-y-4">
            <h4 className="font-serif text-lg font-semibold text-slate-100">
              Edit Payment Gateway: {editingMethod.name}
            </h4>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Channel Display Name"
                  value={editingMethod.name}
                  onChange={(e) =>
                    setEditingMethod({ ...editingMethod, name: e.target.value })
                  }
                  required
                />

                <Input
                  label="Account Name"
                  value={editingMethod.account_name}
                  onChange={(e) =>
                    setEditingMethod({
                      ...editingMethod,
                      account_name: e.target.value,
                    })
                  }
                  required
                />

                <Input
                  label="Account / Phone Number"
                  value={editingMethod.account_number}
                  onChange={(e) =>
                    setEditingMethod({
                      ...editingMethod,
                      account_number: e.target.value,
                    })
                  }
                  required
                />

                <Input
                  label="QR Code Image URL"
                  placeholder="https://..."
                  value={editingMethod.qr_code_url || ''}
                  onChange={(e) =>
                    setEditingMethod({
                      ...editingMethod,
                      qr_code_url: e.target.value,
                    })
                  }
                />

                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-[0.15em] font-medium text-slate-400 mb-1.5">
                    Guest Payment Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={editingMethod.instructions}
                    onChange={(e) =>
                      setEditingMethod({
                        ...editingMethod,
                        instructions: e.target.value,
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
                  onClick={() => setEditingMethod(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="gold"
                  icon={<Save className="w-3.5 h-3.5 text-slate-950 stroke-[2]" />}
                >
                  Save Channel
                </Button>
              </div>
            </form>
          </div>
        )}
      </DoubleBezel>
    </div>
  );
};
