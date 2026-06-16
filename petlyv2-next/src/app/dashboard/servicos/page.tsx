'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
  Scissors,
  Home,
  Footprints,
  Dumbbell,
  School,
  Plus,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardSidebar from '@/components/DashboardSidebar';
import {
  apiGetProfile,
  apiGetMyCaregiverProfile,
  apiUpdateMyCaregiverProfile,
  CaregiverServiceTypeOption,
  ServiceType,
  isAuthenticated,
  setUser as setLocalUser,
} from '@/utils/api';

const SERVICE_ICONS: Record<string, any> = {
  [ServiceType.BOARDING]: Home,
  [ServiceType.WALK]: Footprints,
  [ServiceType.DAYCARE]: School,
  [ServiceType.GROOMING]: Scissors,
  [ServiceType.TRAINING]: Dumbbell,
};

const DEFAULT_SERVICE_TYPES: CaregiverServiceTypeOption[] = [
  { type: ServiceType.WALK, name: 'Passeio', description: 'Passeios diários', durations: ['30min', '60min'] },
  { type: ServiceType.BOARDING, name: 'Hospedagem', description: 'Hospedagem 24h', durations: ['24h'] },
  { type: ServiceType.DAYCARE, name: 'Creche', description: 'Creche durante o dia', durations: ['12h'] },
  { type: ServiceType.GROOMING, name: 'Banho e Tosa', description: 'Serviços de higiene', durations: ['60min', '90min'] },
  { type: ServiceType.TRAINING, name: 'Adestramento', description: 'Treinamento comportamental', durations: ['60min'] },
];

export default function ServicosPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [serviceOptions, setServiceOptions] = useState<CaregiverServiceTypeOption[]>(DEFAULT_SERVICE_TYPES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [editForm, setEditForm] = useState<any>({ bio: '', services: [] });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const userBasic = await apiGetProfile();

        if (userBasic.role !== 'caregiver') {
          router.push('/');
          return;
        }

        // Tentar buscar tipos de serviço do backend – se falhar, usa DEFAULT_SERVICE_TYPES
        try {
          const { apiGetCaregiverServiceTypes } = await import('@/utils/api');
          const backendTypes = await apiGetCaregiverServiceTypes();
          if (backendTypes && backendTypes.length > 0) {
            setServiceOptions(backendTypes);
          }
        } catch (serviceErr) {
          console.warn('Usando tipos de serviço padrão (fallback).');
        }

        // Mesclar perfil do cuidador com fallback
        let mergedProfile = { ...userBasic, services: [], bio: '', availability: [] };
        try {
          const caregiverProfile = await apiGetMyCaregiverProfile();
          mergedProfile = {
            ...userBasic,
            ...caregiverProfile,
            _id: userBasic._id,
            role: 'caregiver',
          };
        } catch (caregiverErr: any) {
          if (caregiverErr?.message?.includes('401')) {
            router.push('/login');
            return;
          }
          setErrorMsg('Perfil de cuidador ainda não configurado. Preencha os dados abaixo.');
        }

        setProfile(mergedProfile);
        setLocalUser(mergedProfile);

        // Inicializar formulário
        const currentServiceOptions = serviceOptions.length ? serviceOptions : DEFAULT_SERVICE_TYPES;
        const allowedNames = new Set(currentServiceOptions.map(s => s.name));
        const filteredServices = (mergedProfile.services || [])
          .filter((s: any) => allowedNames.has(s?.name))
          .map((s: any) => {
            const opt = currentServiceOptions.find(o => o.name === s.name || o.type === s.type);
            return {
              ...s,
              type: s.type || opt?.type,
              duration: s.duration || (opt?.durations?.[0] || '60 min'),
            };
          });

        setEditForm({ bio: mergedProfile.bio || '', services: filteredServices });
      } catch (error: any) {
        if (error?.message?.includes('401') || error?.message?.includes('403')) {
          router.push('/login');
        } else {
          console.error('Erro ao carregar dados:', error);
          setErrorMsg('Não foi possível carregar seus dados. Verifique sua conexão.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Handlers (mantidos como antes)
  const handleServiceChange = (serviceOption: CaregiverServiceTypeOption, isChecked: boolean) => {
    setEditForm((prev: any) => {
      if (isChecked) {
        const defaultDuration = serviceOption.durations?.length ? serviceOption.durations[0] : '60 min';
        return {
          ...prev,
          services: [...prev.services, { type: serviceOption.type, name: serviceOption.name, price: 0, duration: defaultDuration }],
        };
      }
      return {
        ...prev,
        services: prev.services.filter((s: any) => s.type !== serviceOption.type && s.name !== serviceOption.name),
      };
    });
  };

  const handleServicePriceChange = (serviceType: string, price: number) => {
    setEditForm((prev: any) => ({
      ...prev,
      services: prev.services.map((s: any) => (s.type === serviceType || s.name === serviceType ? { ...s, price } : s)),
    }));
  };

  const handleServiceDurationChange = (serviceType: string, duration: string) => {
    setEditForm((prev: any) => ({
      ...prev,
      services: prev.services.map((s: any) => (s.type === serviceType || s.name === serviceType ? { ...s, duration } : s)),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const validServices = editForm.services.map((s: any) => ({
        type: s.type,
        name: s.name,
        price: s.price,
        duration: s.duration,
      }));

      const payload = { bio: editForm.bio, services: validServices };
      const updatedCaregiver = await apiUpdateMyCaregiverProfile(payload);

      const userBasic = await apiGetProfile();
      const mergedUpdated = { ...userBasic, ...updatedCaregiver, _id: userBasic._id, role: 'caregiver' };
      setProfile(mergedUpdated);
      setLocalUser(mergedUpdated);
      setEditForm((prev: any) => ({ ...prev, services: updatedCaregiver.services || validServices }));
      setSuccessMsg('Configurações salvas com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-white text-center px-4">
          <div>
            <AlertCircle className="w-12 h-12 text-[#FF6B35] mx-auto mb-4" />
            <p className="text-lg font-bold mb-2">Erro ao carregar perfil</p>
            <p className="text-gray-400 text-sm">{errorMsg || 'Tente recarregar a página.'}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-[#FF6B35] text-white rounded-xl font-semibold hover:bg-[#E55A2B] transition-colors">
              Tentar novamente
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <DashboardSidebar profile={profile} onProfileUpdate={(u) => { setProfile(u); setLocalUser(u); }} />
          <div className="flex-1 min-w-0 space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Serviços & Preços</h1>
                <p className="text-gray-500 text-sm">Configure o que você oferece e quanto cobra.</p>
              </div>
              <button onClick={handleSave} disabled={isSaving} className="flex-shrink-0 bg-gradient-to-r from-[#FF6B35] to-[#E55A2B] hover:from-[#E55A2B] hover:to-[#CF4A1D] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#FF6B35]/20 disabled:opacity-50">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Salvar
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-3 bg-amber-500/8 border border-amber-500/25 text-amber-400 px-4 py-3 rounded-2xl text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-4 py-3 rounded-2xl text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {successMsg}
              </div>
            )}

            {editForm.services?.length === 0 && (
              <div className="flex items-center gap-3 bg-amber-500/8 border border-amber-500/25 text-amber-400 px-4 py-3 rounded-2xl text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Selecione pelo menos um serviço para aparecer nas buscas dos tutores.
              </div>
            )}

            {/* Bio */}
            <div className="bg-white/4 border border-white/8 rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#FF6B35]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Mini Biografia</h2>
                  <p className="text-xs text-gray-500">Conte sua experiência — aparece no seu perfil público</p>
                </div>
              </div>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm((prev: any) => ({ ...prev, bio: e.target.value }))}
                placeholder="Olá! Sou apaixonado por animais e tenho 5 anos de experiência..."
                className="w-full bg-black/30 border border-white/8 hover:border-white/15 focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/30 text-white rounded-2xl p-4 min-h-[110px] outline-none transition-all resize-y text-sm placeholder:text-gray-600"
              />
            </div>

            {/* Serviços */}
            <div className="bg-white/4 border border-white/8 rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-[#FF6B35]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Serviços Oferecidos</h2>
                  <p className="text-xs text-gray-500">Ative os serviços e defina preço e duração de cada um</p>
                </div>
              </div>

              <div className="space-y-3">
                {serviceOptions.map((serviceOption) => {
                  const isSelected = editForm.services?.some((s: any) => s.type === serviceOption.type || s.name === serviceOption.name);
                  const serviceData = editForm.services?.find((s: any) => s.type === serviceOption.type || s.name === serviceOption.name);
                  const Icon = SERVICE_ICONS[serviceOption.type] || Plus;

                  return (
                    <div key={serviceOption.type} className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isSelected ? 'border-[#FF6B35]/30 bg-[#FF6B35]/5' : 'border-white/8 bg-black/20 hover:border-white/15'}`}>
                      <label className="flex items-center gap-4 p-4 cursor-pointer">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-[#FF6B35] border-[#FF6B35]' : 'border-white/20 bg-black/30'}`}>
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                          <input type="checkbox" checked={isSelected} onChange={(e) => handleServiceChange(serviceOption, e.target.checked)} className="sr-only" />
                        </div>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-[#FF6B35]/15' : 'bg-white/5'}`}>
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-[#FF6B35]' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{serviceOption.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{serviceOption.description}</p>
                        </div>
                      </label>

                      {isSelected && (
                        <div className="px-4 pb-4 flex flex-wrap items-center gap-4 border-t border-white/5 pt-3 mt-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400">R$</span>
                            <input type="number" value={serviceData?.price || 0} onChange={(e) => handleServicePriceChange(serviceOption.type, Number(e.target.value))} className="w-24 bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/30 text-white rounded-xl px-3 py-2 text-sm outline-none transition-all" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400">por</span>
                            <select value={serviceData?.duration || ''} onChange={(e) => handleServiceDurationChange(serviceOption.type, e.target.value)} className="bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#FF6B35]/50 text-white rounded-xl px-3 py-2 text-sm outline-none transition-all cursor-pointer">
                              {serviceOption.durations?.map((dur) => (<option key={dur} value={dur}>{dur}</option>))}
                              {(!serviceOption.durations || serviceOption.durations.length === 0) && (<option value="60 min">60 min</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}