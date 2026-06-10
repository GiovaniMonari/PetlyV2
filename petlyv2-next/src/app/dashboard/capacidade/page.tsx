'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Loader2,
  PawPrint,
  Dog,
  Cat,
  Bird,
  Minus,
  Plus,
  Rat,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardSidebar from '@/components/DashboardSidebar';
import {
  apiGetCaregiverPetTypes,
  apiGetProfile,
  apiUpdateProfile,
  isAuthenticated,
  setUser as setLocalUser,
} from '@/utils/api';

const DOG_SIZE_OPTIONS = [
  { value: 'small', label: 'Pequeno', range: 'até 10 kg' },
  { value: 'medium', label: 'Médio', range: '10–25 kg' },
  { value: 'large', label: 'Grande', range: 'acima de 25 kg' },
];

const PET_LABELS: Record<string, string> = {
  dog: 'Cães', cat: 'Gatos', bird: 'Pássaros', other: 'Outros',
};

const PET_ICONS: Record<string, any> = {
  dog: Dog, cat: Cat, bird: Bird, other: Rat,
};

const PET_COLORS: Record<string, string> = {
  dog: '#FF6B35', cat: '#A23B72', bird: '#2E86AB', other: '#06A77D',
};

export default function CapacidadePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [petTypeOptions, setPetTypeOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [editForm, setEditForm] = useState<any>({ petQuantities: [] });

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    const fetchData = async () => {
      try {
        const [profileData, caregiverPetTypes] = await Promise.all([apiGetProfile(), apiGetCaregiverPetTypes()]);
        if (profileData.role !== 'caregiver') { router.push('/'); return; }
        setPetTypeOptions((caregiverPetTypes as any) || []);
        setProfile(profileData);
        setEditForm({ petQuantities: profileData.petsQuantity || [] });
      } catch { /* noop */ } finally { setIsLoading(false); }
    };
    fetchData();
  }, [router]);

  const handlePetTypeChange = (petType: string, isChecked: boolean) => {
    setEditForm((prev: any) => {
      if (isChecked) {
        return { ...prev, petQuantities: [...prev.petQuantities, { type: petType, quantity: 1, ...(petType === 'dog' ? { sizes: ['small'] } : {}) }] };
      }
      return { ...prev, petQuantities: prev.petQuantities.filter((p: any) => p.type !== petType) };
    });
  };

  const handlePetQuantityChange = (petType: string, delta: number) => {
    setEditForm((prev: any) => ({
      ...prev,
      petQuantities: prev.petQuantities.map((p: any) =>
        p.type === petType ? { ...p, quantity: Math.max(1, Math.min(20, (p.quantity || 1) + delta)) } : p
      ),
    }));
  };

  const handleDogSizeChange = (size: string, isChecked: boolean) => {
    setEditForm((prev: any) => ({
      ...prev,
      petQuantities: prev.petQuantities.map((p: any) => {
        if (p.type !== 'dog') return p;
        const currentSizes = Array.isArray(p.sizes) ? [...p.sizes] : [];
        if (isChecked) return { ...p, sizes: Array.from(new Set([...currentSizes, size])) };
        return { ...p, sizes: currentSizes.filter((s) => s !== size) };
      }),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    try {
      const updated = await apiUpdateProfile(profile._id, { petQuantities: editForm.petQuantities });
      setProfile(updated);
      setLocalUser(updated);
      setEditForm({ petQuantities: updated.petsQuantity || [] });
      setSuccessMsg('Capacidade atualizada com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch { alert('Erro ao salvar.'); }
    finally { setIsSaving(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-4 border-[#FF6B35] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <DashboardSidebar profile={profile} onProfileUpdate={(u) => { setProfile(u); setLocalUser(u); }} />

          <div className="flex-1 min-w-0 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Capacidade de Pets</h1>
                <p className="text-gray-500 text-sm">Defina quais animais você aceita e quantos por vez.</p>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-shrink-0 bg-gradient-to-r from-[#FF6B35] to-[#E55A2B] hover:from-[#E55A2B] hover:to-[#CF4A1D] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#FF6B35]/20 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Salvar
              </button>
            </div>

            {successMsg && (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-4 py-3 rounded-2xl text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {successMsg}
              </div>
            )}

            {/* Pet type cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {petTypeOptions.map((petType: any) => {
                const typeValue = typeof petType === 'string' ? petType : petType.name || petType.type;
                const isSelected = editForm.petQuantities?.some((p: any) => p.type === typeValue);
                const petData = editForm.petQuantities?.find((p: any) => p.type === typeValue);
                const Icon = PET_ICONS[typeValue] || PawPrint;
                const color = PET_COLORS[typeValue] || '#FF6B35';
                const label = PET_LABELS[typeValue] || typeValue;

                return (
                  <div
                    key={typeValue}
                    className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                      isSelected
                        ? 'border-white/20 bg-white/5'
                        : 'border-white/8 bg-white/3 hover:border-white/15'
                    }`}
                    style={isSelected ? { boxShadow: `0 0 0 1px ${color}20, inset 0 0 40px ${color}08` } : {}}
                  >
                    {/* Card header */}
                    <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => handlePetTypeChange(typeValue, !isSelected)}>
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}20` }}
                      >
                        <Icon className="w-7 h-7" style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-base">{label}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isSelected ? `${petData?.quantity || 1} pet${(petData?.quantity || 1) > 1 ? 's' : ''} por vez` : 'Clique para ativar'}
                        </p>
                      </div>
                      {/* Toggle */}
                      <div
                        className="w-12 h-6 rounded-full relative transition-all duration-300 flex-shrink-0"
                        style={{ backgroundColor: isSelected ? color : 'rgba(255,255,255,0.1)' }}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${isSelected ? 'right-1' : 'left-1'}`}
                        />
                      </div>
                    </div>

                    {/* Quantity + dog sizes (only when selected) */}
                    {isSelected && (
                      <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                        {/* Quantity stepper */}
                        <div>
                          <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Limite por atendimento</p>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handlePetQuantityChange(typeValue, -1)}
                              disabled={(petData?.quantity || 1) <= 1}
                              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <div className="text-center">
                              <span className="text-3xl font-bold text-white">{petData?.quantity || 1}</span>
                              <p className="text-xs text-gray-500 mt-0.5">{(petData?.quantity || 1) === 1 ? 'pet' : 'pets'}</p>
                            </div>
                            <button
                              onClick={() => handlePetQuantityChange(typeValue, 1)}
                              disabled={(petData?.quantity || 1) >= 20}
                              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Dog sizes */}
                        {typeValue === 'dog' && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Porte aceito</p>
                            <div className="grid grid-cols-3 gap-2">
                              {DOG_SIZE_OPTIONS.map((sizeOption) => {
                                const checked = petData?.sizes?.includes(sizeOption.value);
                                return (
                                  <label
                                    key={sizeOption.value}
                                    className={`flex flex-col items-center gap-1 px-2 py-3 rounded-2xl border cursor-pointer transition-all ${
                                      checked
                                        ? 'bg-[#FF6B35]/15 border-[#FF6B35]/30 text-[#FF6B35]'
                                        : 'bg-black/20 border-white/8 text-gray-500 hover:border-white/20 hover:text-gray-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => handleDogSizeChange(sizeOption.value, e.target.checked)}
                                      className="sr-only"
                                    />
                                    <span className="text-xs font-bold">{sizeOption.label}</span>
                                    <span className="text-[10px] opacity-70">{sizeOption.range}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            {editForm.petQuantities.length > 0 && (
              <div className="bg-white/4 border border-white/8 rounded-3xl p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Resumo de Capacidade</p>
                <div className="flex flex-wrap gap-3">
                  {editForm.petQuantities.map((p: any) => {
                    const Icon = PET_ICONS[p.type] || PawPrint;
                    const color = PET_COLORS[p.type] || '#FF6B35';
                    const label = PET_LABELS[p.type] || p.type;
                    return (
                      <div key={p.type} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/30 border border-white/8">
                        <Icon className="w-4 h-4" style={{ color }} />
                        <span className="text-sm font-semibold text-white">{label}</span>
                        <span className="text-xs text-gray-500">×{p.quantity}</span>
                        {p.type === 'dog' && p.sizes?.length > 0 && (
                          <span className="text-xs text-gray-600">
                            ({p.sizes.map((s: string) => s === 'small' ? 'P' : s === 'medium' ? 'M' : 'G').join('/')})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
