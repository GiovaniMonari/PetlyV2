'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Settings,
  User,
  Briefcase,
  CheckCircle2,
  Loader2,
  PawPrint,
  Calendar
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  apiGetCaregiverPetTypes,
  apiGetProfile,
  apiUpdateProfile,
  isAuthenticated,
  setUser as setLocalUser,
} from '@/utils/api';

export default function CapacidadePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [petTypeOptions, setPetTypeOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [editForm, setEditForm] = useState<any>({
    petQuantities: []
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [profileData, caregiverPetTypes] = await Promise.all([
          apiGetProfile(),
          apiGetCaregiverPetTypes(),
        ]);

        if (profileData.role !== 'caregiver') {
          router.push('/');
          return;
        }

        setPetTypeOptions((caregiverPetTypes as any) || []);
        setProfile(profileData);
        setEditForm({
          petQuantities: profileData.petsQuantity || []
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handlePetTypeChange = (petType: string, isChecked: boolean) => {
    setEditForm((prev: any) => {
      if (isChecked) {
        return {
          ...prev,
          petQuantities: [...prev.petQuantities, { type: petType, quantity: 1 }]
        };
      } else {
        return {
          ...prev,
          petQuantities: prev.petQuantities.filter((p: any) => p.type !== petType)
        };
      }
    });
  };

  const handlePetQuantityChange = (petType: string, quantity: number) => {
    setEditForm((prev: any) => ({
      ...prev,
      petQuantities: prev.petQuantities.map((p: any) =>
        p.type === petType ? { ...p, quantity } : p
      )
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    try {
      const payload = {
        petQuantities: editForm.petQuantities
      };

      const updated = await apiUpdateProfile(profile._id, payload);
      setProfile(updated);
      setLocalUser(updated);
      
      setEditForm((prev: any) => ({
        ...prev,
        petQuantities: updated.petsQuantity || []
      }));

      setSuccessMsg('Configurações salvas com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-[#FF6B35] animate-spin" />
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
          {/* Sidebar Menu */}
          <div className="md:w-64 flex-shrink-0 space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-gray-500 uppercase">{profile.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm line-clamp-1">{profile.name}</h3>
                  <span className="text-xs text-[#06A77D] font-medium bg-[#06A77D]/10 px-2 py-0.5 rounded-full mt-1 inline-block">Cuidador</span>
                </div>
              </div>

              <nav className="space-y-2">
                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium text-sm transition-colors">
                  <Briefcase className="w-4 h-4" /> Painel Geral
                </Link>
                <Link href="/dashboard/servicos" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium text-sm transition-colors">
                  <Settings className="w-4 h-4" /> Serviços & Preços
                </Link>
                <Link href="/dashboard/disponibilidade" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium text-sm transition-colors">
                  <Calendar className="w-4 h-4" /> Disponibilidade
                </Link>
                <Link href="/dashboard/capacidade" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FF6B35] text-white font-medium text-sm shadow-lg shadow-[#FF6B35]/20">
                  <PawPrint className="w-4 h-4" /> Capacidade de Pets
                </Link>
                <Link href="/perfil" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium text-sm transition-colors">
                  <User className="w-4 h-4" /> Meu Perfil
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Capacidade de Pets</h1>
                <p className="text-gray-400 text-sm">Defina quais pets você atende e quantos por dia.</p>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Salvar Alterações
              </button>
            </div>

            {successMsg && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> {successMsg}
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-8">
              {/* Pet Types and Limits */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  Tipos de Pets e Limite Diário
                </label>
                <p className="text-sm text-gray-400">Selecione quais pets você aceita cuidar e a quantidade máxima por dia.</p>
                
                <div className="grid gap-3">
                  {petTypeOptions.map((petType: any) => {
                    const typeValue = typeof petType === 'string' ? petType : petType.name || petType.type;
                    const isSelected = editForm.petQuantities?.some((p: any) => p.type === typeValue);
                    const petData = editForm.petQuantities?.find((p: any) => p.type === typeValue);
                    
                    const labels: Record<string, string> = {
                      dog: 'Cães',
                      cat: 'Gatos',
                      bird: 'Pássaros',
                      other: 'Outros'
                    };

                    return (
                      <div key={typeValue} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <label className="flex items-center gap-3 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handlePetTypeChange(typeValue, e.target.checked)}
                            className="w-5 h-5 rounded border-white/10 text-[#FF6B35] focus:ring-[#FF6B35] bg-black"
                          />
                          <div>
                            <span className="text-white font-medium capitalize">{labels[typeValue] || typeValue}</span>
                          </div>
                        </label>

                        {isSelected && (
                          <div className="flex items-center gap-3 ml-8 sm:ml-0">
                            <span className="text-gray-400 text-sm font-medium">Limite por dia:</span>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={petData?.quantity || 1}
                              onChange={(e) => handlePetQuantityChange(typeValue, Number(e.target.value))}
                              className="w-20 bg-black/50 border border-white/10 focus:border-[#FF6B35]/50 text-white rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#FF6B35]/50"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
