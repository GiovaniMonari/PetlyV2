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
  AlertCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiGetProfile, apiUpdateProfile, isAuthenticated, setUser as setLocalUser } from '@/utils/api';

const AVAILABLE_SERVICES = [
  'Hospedagem', 
  'Visita em domicílio', 
  'Passeio',
  'Banho',
  'Tosa',
  'Dog Walking',
  'Cat Sitting'
];

const DAYS_OF_WEEK = [
  { id: 0, label: 'Domingo' },
  { id: 1, label: 'Segunda' },
  { id: 2, label: 'Terça' },
  { id: 3, label: 'Quarta' },
  { id: 4, label: 'Quinta' },
  { id: 5, label: 'Sexta' },
  { id: 6, label: 'Sábado' },
];

export default function ServicosPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [editForm, setEditForm] = useState<any>({
    bio: '',
    services: [],
    availableDays: [0, 1, 2, 3, 4, 5, 6]
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const profileData = await apiGetProfile();
        
        if (profileData.role !== 'caregiver') {
          router.push('/');
          return;
        }

        setProfile(profileData);
        setEditForm({
          bio: profileData.bio || '',
          services: profileData.services || [],
          availableDays: profileData.availableDays || [0, 1, 2, 3, 4, 5, 6]
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleServiceChange = (serviceName: string, isChecked: boolean) => {
    if (isChecked) {
      setEditForm({
        ...editForm,
        services: [...editForm.services, { name: serviceName, price: 0, duration: '60 min' }]
      });
    } else {
      setEditForm({
        ...editForm,
        services: editForm.services.filter((s: any) => s.name !== serviceName)
      });
    }
  };

  const handleServicePriceChange = (serviceName: string, price: number) => {
    setEditForm({
      ...editForm,
      services: editForm.services.map((s: any) => 
        s.name === serviceName ? { ...s, price } : s
      )
    });
  };

  const handleServiceDurationChange = (serviceName: string, duration: string) => {
    setEditForm({
      ...editForm,
      services: editForm.services.map((s: any) => 
        s.name === serviceName ? { ...s, duration } : s
      )
    });
  };

  const handleDayChange = (dayId: number) => {
    const isSelected = editForm.availableDays.includes(dayId);
    if (isSelected) {
      setEditForm({
        ...editForm,
        availableDays: editForm.availableDays.filter((d: number) => d !== dayId)
      });
    } else {
      setEditForm({
        ...editForm,
        availableDays: [...editForm.availableDays, dayId].sort()
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    try {
      const payload = {
        bio: editForm.bio,
        services: editForm.services,
        availableDays: editForm.availableDays
      };

      const updated = await apiUpdateProfile(profile._id, payload);
      setProfile(updated);
      setLocalUser(updated);
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
                <Link href="/dashboard/servicos" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FF6B35] text-white font-medium text-sm shadow-lg shadow-[#FF6B35]/20">
                  <Settings className="w-4 h-4" /> Serviços & Preços
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
                <h1 className="text-2xl font-bold text-white mb-1">Serviços e Preços</h1>
                <p className="text-gray-400 text-sm">Configure o que você oferece e quanto cobra.</p>
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

            {editForm.services?.length === 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Selecione pelo menos um serviço para aparecer nos resultados de busca dos tutores.
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-8">
              
              {/* Bio Section */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  Resumo Profissional (Mini Biografia)
                </label>
                <p className="text-sm text-gray-400">Conte aos tutores um pouco sobre sua experiência e amor por pets.</p>
                <textarea 
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  placeholder="Olá! Sou apaixonado por animais e tenho 5 anos de experiência..."
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-4 min-h-[120px] outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50 transition-all resize-y"
                />
              </div>

              <div className="h-px bg-white/10"></div>

              {/* Services List */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  Serviços Oferecidos
                </label>
                <div className="grid gap-3">
                  {AVAILABLE_SERVICES.map(service => {
                    const isSelected = editForm.services?.some((s: any) => s.name === service);
                    const serviceData = editForm.services?.find((s: any) => s.name === service);
                    return (
                      <div key={service} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <label className="flex items-center gap-3 flex-1 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={(e) => handleServiceChange(service, e.target.checked)}
                            className="w-5 h-5 rounded border-white/10 text-[#FF6B35] focus:ring-[#FF6B35] bg-black"
                          />
                          <span className="text-white font-medium">{service}</span>
                        </label>
                        
                        {isSelected && (
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 ml-8 sm:ml-0">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-sm font-bold">R$</span>
                              <input 
                                type="number" 
                                value={serviceData?.price || 0}
                                onChange={(e) => handleServicePriceChange(service, Number(e.target.value))}
                                className="w-24 bg-black/50 border border-white/10 focus:border-[#FF6B35]/50 text-white rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#FF6B35]/50"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs uppercase font-bold tracking-wider hidden sm:inline">por</span>
                              <select
                                value={serviceData?.duration || '60 min'}
                                onChange={(e) => handleServiceDurationChange(service, e.target.value)}
                                className="bg-black/50 border border-white/10 focus:border-[#FF6B35]/50 text-white rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#FF6B35]/50 text-sm"
                              >
                                <option value="30 min">30 min</option>
                                <option value="60 min">60 min</option>
                                <option value="Diária">Diária (24h)</option>
                                <option value="Por visita">Por visita</option>
                                <option value="Por banho">Por banho</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-white/10"></div>

              {/* Days Available */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  Dias de Atendimento
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => {
                    const isSelected = editForm.availableDays?.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        onClick={() => handleDayChange(day.id)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                          isSelected 
                            ? 'bg-[#06A77D]/10 text-[#06A77D] border-[#06A77D]/30 shadow-sm' 
                            : 'bg-black/30 text-gray-400 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {day.label}
                      </button>
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
