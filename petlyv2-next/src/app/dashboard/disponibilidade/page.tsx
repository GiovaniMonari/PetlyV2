'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Loader2,
  Settings,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardSidebar from '@/components/DashboardSidebar';
import {
  apiGetProfile,
  apiUpdateProfile,
  isAuthenticated,
  setUser as setLocalUser,
} from '@/utils/api';

const HOURS = [
  '07:00','08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00',
];

function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DisponibilidadePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [availability, setAvailability] = useState<any[]>([]);
  const [activeService, setActiveService] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    const fetchData = async () => {
      try {
        const profileData = await apiGetProfile();
        if (profileData.role !== 'caregiver') { router.push('/'); return; }
        setProfile(profileData);
        setAvailability(profileData.availability || []);
        if (profileData.services?.length > 0) {
          setActiveService(profileData.services[0].type || profileData.services[0].name);
        }
      } catch { /* noop */ } finally { setIsLoading(false); }
    };
    fetchData();
  }, [router]);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    try {
      const updated = await apiUpdateProfile(profile._id, { availability });
      setProfile(updated);
      setLocalUser(updated);
      setAvailability(updated.availability || []);
      setSuccessMsg('Disponibilidade atualizada!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch { alert('Erro ao salvar.'); }
    finally { setIsSaving(false); }
  };

  const getCurrentAvailability = () =>
    availability.find(a => a.service === activeService) || {
      service: activeService,
      availableDays: [],
      serviceHours: ['08:00', '12:00', '18:00'],
    };

  const toggleDay = (dateStr: string) => {
    if (!activeService) return;
    setAvailability(prev => {
      const idx = prev.findIndex(a => a.service === activeService);
      if (idx > -1) {
        const updated = [...prev];
        const current = { ...updated[idx] };
        const days = current.availableDays || [];
        current.availableDays = days.includes(dateStr) ? days.filter((d: string) => d !== dateStr) : [...days, dateStr];
        updated[idx] = current;
        return updated;
      }
      return [...prev, { service: activeService, availableDays: [dateStr], serviceHours: ['08:00', '12:00', '18:00'] }];
    });
  };

  const toggleHour = (hour: string) => {
    if (!activeService) return;
    setAvailability(prev => {
      const idx = prev.findIndex(a => a.service === activeService);
      if (idx > -1) {
        const updated = [...prev];
        const current = { ...updated[idx] };
        const hours = current.serviceHours || [];
        current.serviceHours = hours.includes(hour) ? hours.filter((h: string) => h !== hour) : [...hours, hour].sort();
        updated[idx] = current;
        return updated;
      }
      return [...prev, { service: activeService, availableDays: [], serviceHours: [hour] }];
    });
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-11 md:h-14 border border-white/5 bg-transparent rounded-lg" />);
    }

    const currentAvail = getCurrentAvailability();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateToYYYYMMDD(date);
      const isSelected = currentAvail.availableDays.includes(dateStr);
      const isPast = date < today;

      days.push(
        <button
          key={day}
          disabled={isPast}
          onClick={() => toggleDay(dateStr)}
          className={`h-11 md:h-14 rounded-xl border flex flex-col items-center justify-center relative transition-all duration-150 text-sm font-bold ${
            isSelected
              ? 'bg-[#06A77D]/20 text-[#06A77D] border-[#06A77D]/40 shadow-[inset_0_0_0_1px_rgba(6,167,125,0.3)]'
              : isPast
              ? 'opacity-20 cursor-not-allowed border-white/5 text-gray-600'
              : 'hover:bg-white/8 text-gray-400 hover:text-white border-white/5 hover:border-white/15'
          }`}
        >
          <span>{day}</span>
          {isSelected && (
            <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#06A77D]" />
          )}
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
          <div className="w-14 h-14 rounded-full border-4 border-[#FF6B35] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const currentAvail = getCurrentAvailability();

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
                <h1 className="text-2xl font-bold text-white mb-1">Disponibilidade</h1>
                <p className="text-gray-500 text-sm">Marque os dias e horários em que você atende para cada serviço.</p>
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

            {/* No services */}
            {profile.services?.length === 0 ? (
              <div className="bg-amber-500/8 border border-amber-500/25 rounded-3xl p-8 flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <Settings className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-amber-400 font-bold mb-1">Nenhum serviço configurado</h3>
                  <p className="text-amber-400/70 text-sm mb-2">Configure serviços em "Serviços & Preços" antes de definir sua disponibilidade.</p>
                  <a href="/dashboard/servicos" className="text-amber-400 font-bold text-sm underline">Ir para Serviços →</a>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Service tabs */}
                <div className="flex gap-2 flex-wrap">
                  {profile.services.map((service: any) => {
                    const serviceType = service.type || service.name;
                    const isActive = activeService === serviceType;
                    const avail = availability.find(a => a.service === serviceType);
                    const daysCount = avail?.availableDays?.length || 0;

                    return (
                      <button
                        key={serviceType}
                        onClick={() => setActiveService(serviceType)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${
                          isActive
                            ? 'bg-white text-black border-white shadow-lg'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        {service.name || serviceType}
                        {daysCount > 0 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-black/10 text-black' : 'bg-[#06A77D]/15 text-[#06A77D]'}`}>
                            {daysCount}d
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="grid lg:grid-cols-3 gap-5">
                  {/* Calendar */}
                  <div className="lg:col-span-2 bg-white/4 border border-white/8 rounded-3xl p-6 overflow-hidden">
                    {/* Month nav */}
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-white font-bold flex items-center gap-2 text-base">
                        <CalendarIcon className="w-5 h-5 text-[#FF6B35]" />
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                      </h2>
                      <div className="flex gap-2">
                        <button onClick={prevMonth} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={nextMonth} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-gray-600 py-1 uppercase tracking-wider">{d}</div>
                      ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {renderCalendar()}
                    </div>

                    {/* Legend */}
                    <div className="mt-5 flex items-center gap-5 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#06A77D]" />
                        <span className="text-xs text-gray-500">Disponível</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-lg border border-white/15 bg-white/5" />
                        <span className="text-xs text-gray-500">Indisponível</span>
                      </div>
                      <div className="ml-auto text-xs text-gray-500 font-semibold">
                        {currentAvail.availableDays.length} dia{currentAvail.availableDays.length !== 1 ? 's' : ''} selecionado{currentAvail.availableDays.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="bg-white/4 border border-white/8 rounded-3xl p-6 space-y-5">
                    <div>
                      <h2 className="text-white font-bold flex items-center gap-2 mb-1">
                        <Clock className="w-5 h-5 text-[#FF6B35]" />
                        Horários
                      </h2>
                      <p className="text-xs text-gray-500">Selecione os horários de início disponíveis nos dias marcados.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {HOURS.map(hour => {
                        const isSelected = currentAvail.serviceHours.includes(hour);
                        return (
                          <button
                            key={hour}
                            onClick={() => toggleHour(hour)}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                              isSelected
                                ? 'bg-[#FF6B35]/15 text-[#FF6B35] border-[#FF6B35]/30 shadow-[inset_0_0_0_1px_rgba(255,107,53,0.2)]'
                                : 'bg-black/20 text-gray-500 border-white/5 hover:border-white/20 hover:text-white'
                            }`}
                          >
                            {hour}
                          </button>
                        );
                      })}
                    </div>

                    {/* Summary */}
                    <div className="pt-4 border-t border-white/5">
                      <div className="bg-[#06A77D]/8 rounded-2xl p-4 border border-[#06A77D]/15">
                        <p className="text-[#06A77D] text-xs font-bold uppercase tracking-wider mb-2">Resumo</p>
                        <p className="text-white text-sm font-semibold">
                          {currentAvail.availableDays.length} {currentAvail.availableDays.length === 1 ? 'dia disponível' : 'dias disponíveis'}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {currentAvail.serviceHours.length} {currentAvail.serviceHours.length === 1 ? 'horário definido' : 'horários definidos'}
                        </p>
                        {currentAvail.serviceHours.length > 0 && (
                          <p className="text-gray-500 text-xs mt-1">
                            {currentAvail.serviceHours[0]} – {currentAvail.serviceHours[currentAvail.serviceHours.length - 1]}
                          </p>
                        )}
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
