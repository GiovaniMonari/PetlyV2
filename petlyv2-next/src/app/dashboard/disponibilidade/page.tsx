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
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  X
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  apiGetProfile,
  apiUpdateProfile,
  isAuthenticated,
  setUser as setLocalUser,
} from '@/utils/api';

const HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function DisponibilidadePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Availability state: array of { service: string, availableDays: string[], serviceHours: string[] }
  const [availability, setAvailability] = useState<any[]>([]);
  const [activeService, setActiveService] = useState<string | null>(null);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

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
        setAvailability(profileData.availability || []);
        
        if (profileData.services && profileData.services.length > 0) {
          setActiveService(profileData.services[0].type || profileData.services[0].name);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    try {
      const payload = {
        availability: availability
      };

      const updated = await apiUpdateProfile(profile._id, payload);
      setProfile(updated);
      setLocalUser(updated);
      setAvailability(updated.availability || []);

      setSuccessMsg('Disponibilidade atualizada com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error updating availability:', err);
      alert('Erro ao salvar a disponibilidade.');
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentAvailability = () => {
    return availability.find(a => a.service === activeService) || {
      service: activeService,
      availableDays: [],
      serviceHours: ['08:00', '12:00', '18:00']
    };
  };

  const toggleDay = (dateStr: string) => {
    if (!activeService) return;

    setAvailability(prev => {
      const existingIndex = prev.findIndex(a => a.service === activeService);
      if (existingIndex > -1) {
        const updated = [...prev];
        const current = { ...updated[existingIndex] };
        const days = current.availableDays || [];
        
        if (days.includes(dateStr)) {
          current.availableDays = days.filter((d: string) => d !== dateStr);
        } else {
          current.availableDays = [...days, dateStr];
        }
        
        updated[existingIndex] = current;
        return updated;
      } else {
        return [...prev, {
          service: activeService,
          availableDays: [dateStr],
          serviceHours: ['08:00', '12:00', '18:00']
        }];
      }
    });
  };

  const toggleHour = (hour: string) => {
    if (!activeService) return;

    setAvailability(prev => {
      const existingIndex = prev.findIndex(a => a.service === activeService);
      if (existingIndex > -1) {
        const updated = [...prev];
        const current = { ...updated[existingIndex] };
        const hours = current.serviceHours || [];
        
        if (hours.includes(hour)) {
          current.serviceHours = hours.filter((h: string) => h !== hour);
        } else {
          current.serviceHours = [...hours, hour].sort();
        }
        
        updated[existingIndex] = current;
        return updated;
      } else {
        return [...prev, {
          service: activeService,
          availableDays: [],
          serviceHours: [hour]
        }];
      }
    });
  };

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty slots for days of previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 md:h-20 border border-white/5 bg-transparent"></div>);
    }

    const currentAvail = getCurrentAvailability();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isSelected = currentAvail.availableDays.includes(dateStr);
      const isPast = date < today;

      days.push(
        <button
          key={day}
          disabled={isPast}
          onClick={() => toggleDay(dateStr)}
          className={`h-12 md:h-20 border border-white/5 flex flex-col items-center justify-center relative transition-all group ${
            isSelected 
              ? 'bg-[#06A77D]/20 text-[#06A77D] border-[#06A77D]/30 z-10' 
              : isPast ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          <span className="text-sm font-bold">{day}</span>
          {isSelected && <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-[#06A77D]"></div>}
        </button>
      );
    }

    return days;
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

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
                <Link href="/dashboard/disponibilidade" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FF6B35] text-white font-medium text-sm shadow-lg shadow-[#FF6B35]/20">
                  <CalendarIcon className="w-4 h-4" /> Disponibilidade
                </Link>
                <Link href="/dashboard/capacidade" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium text-sm transition-colors">
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
                <h1 className="text-2xl font-bold text-white mb-1">Disponibilidade Mensal</h1>
                <p className="text-gray-400 text-sm">Selecione os dias e horários disponíveis para cada serviço.</p>
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

            {profile.services?.length === 0 ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 p-6 rounded-3xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">Nenhum serviço configurado</h3>
                  <p className="text-sm opacity-80">Você precisa configurar pelo menos um serviço em "Serviços & Preços" antes de definir sua disponibilidade.</p>
                  <Link href="/dashboard/servicos" className="text-yellow-500 font-bold text-sm underline mt-2 block">Configurar Serviços</Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Service Selector Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {profile.services.map((service: any) => {
                    const serviceType = service.type || service.name;
                    const isActive = activeService === serviceType;
                    return (
                      <button
                        key={serviceType}
                        onClick={() => setActiveService(serviceType)}
                        className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${
                          isActive 
                            ? 'bg-white text-black border-white' 
                            : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {service.name || serviceType}
                      </button>
                    );
                  })}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Calendar Section */}
                  <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-white font-bold flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-[#FF6B35]" />
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                      </h2>
                      <div className="flex gap-2">
                        <button onClick={prevMonth} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={nextMonth} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-px mb-2">
                      {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-gray-500 py-2">{d}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-px border border-white/10 rounded-2xl overflow-hidden bg-white/5">
                      {renderCalendar()}
                    </div>

                    <div className="mt-6 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#06A77D]"></div>
                        <span className="text-xs text-gray-400">Disponível</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-white/10 border border-white/20"></div>
                        <span className="text-xs text-gray-400">Indisponível</span>
                      </div>
                    </div>
                  </div>

                  {/* Hours Section */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                    <div>
                      <h2 className="text-white font-bold flex items-center gap-2 mb-1">
                        <Clock className="w-5 h-5 text-[#FF6B35]" />
                        Horários de Atendimento
                      </h2>
                      <p className="text-xs text-gray-500">Defina os horários em que você atende nos dias selecionados.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {HOURS.map(hour => {
                        const isSelected = getCurrentAvailability().serviceHours.includes(hour);
                        return (
                          <button
                            key={hour}
                            onClick={() => toggleHour(hour)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                              isSelected
                                ? 'bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30'
                                : 'bg-black/30 text-gray-500 border-white/5 hover:border-white/20'
                            }`}
                          >
                            {hour}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <div className="bg-[#06A77D]/10 rounded-2xl p-4 border border-[#06A77D]/20">
                        <h4 className="text-[#06A77D] text-xs font-bold uppercase mb-2">Resumo</h4>
                        <p className="text-white text-sm font-medium">
                          {getCurrentAvailability().availableDays.length} dias selecionados
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {getCurrentAvailability().serviceHours.length} horários definidos
                        </p>
                      </div>
                    </div>
                  </div>
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
