'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Loader2,
  Clock,
  CheckCircle2,
  PawPrint,
  XCircle,
  MapPin,
  PlayCircle,
  AlertCircle,
  DollarSign,
  Activity,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardSidebar from '@/components/DashboardSidebar';
import {
  apiGetProfile,
  apiGetMyBookings,
  isAuthenticated,
  apiConfirmBooking,
  apiCancelBooking,
  apiStartBooking,
  apiCompleteBooking,
  setUser as setLocalUser,
  setUser,
  apiGetMyCaregiverProfile,
  getUser,
} from '@/utils/api';

// ─── Helpers ────────────────────────────────────────────────

function formatBookingDate(dateStr: string, timeStr?: string): string {
  if (!dateStr) return '';
  try {
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = datePart.split('-').map(Number);
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date(year, month - 1, day, hours, minutes);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch {
    return 'Data inválida';
  }
}

function parseDateOnly(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function isBookingExpired(endDate?: string): boolean {
  const end = parseDateOnly(endDate);
  if (!end) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end < today;
}

function isTodayInBookingRange(startDate?: string, endDate?: string): boolean {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate || startDate);
  if (!start || !end) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today >= start && today <= end;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  confirmed: {
    label: 'Confirmada',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    dot: 'bg-emerald-400',
  },
  in_progress: {
    label: 'Em andamento',
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
    dot: 'bg-cyan-400',
  },
  pending: {
    label: 'Pendente',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    dot: 'bg-amber-400',
  },
  cancelled: {
    label: 'Cancelada',
    color: 'text-red-400 bg-red-500/10 border-red-500/25',
    dot: 'bg-red-400',
  },
  completed: {
    label: 'Concluída',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    dot: 'bg-blue-400',
  },
};

const PAYMENT_LABELS: Record<string, string> = {
  pay_on_service: 'Pagar no serviço',
  card: 'Cartão',
  pix: 'PIX',
};

// ─── Componente ─────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  // Estado do perfil e reservas
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal de confirmação com endereço
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmingBookingId, setConfirmingBookingId] = useState<string | null>(null);
  const [cep, setCep] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [modalError, setModalError] = useState('');

  // ─── Busca de CEP ─────────────────────────────────────────
  const fetchAddressFromCep = async (cepValue: string) => {
    const cleaned = cepValue.replace(/\D/g, '');
    if (cleaned.length !== 8) return;
    setIsCepLoading(true);
    setCepError('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError('CEP não encontrado.');
      } else {
        setStreetAddress(`${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`);
      }
    } catch {
      setCepError('Erro ao buscar o CEP.');
    } finally {
      setIsCepLoading(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 8);
    setCep(cleaned.length > 5 ? `${cleaned.slice(0, 5)}-${cleaned.slice(5)}` : cleaned);
    if (cleaned.length === 8) fetchAddressFromCep(cleaned);
  };

  // ─── Carregamento inicial ─────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const loadDashboardData = async () => {
      try {
        const localUser = getUser();
        const userBasic = await apiGetProfile();
        let profileData = userBasic;

        // Se for cuidador, mescla dados específicos
        if (localUser?.role === 'caregiver') {
          const caregiverProfile = await apiGetMyCaregiverProfile();
          profileData = {
            ...userBasic,            // name, email, location, avatar, etc.
            ...caregiverProfile,     // services, availability, rating, reviewsCount, etc.
            _id: userBasic._id,      // ID do usuário (importante para upload de avatar)
            role: 'caregiver',
          };
        }

        setProfile(profileData);
        setUser(profileData); // atualiza localStorage

        // Carrega as reservas
        const bookingsData = await apiGetMyBookings();
        setBookings(bookingsData || []);
      } catch (error) {
        console.error('Erro ao carregar dados do painel:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  // ─── Ações de reserva ─────────────────────────────────────
  const refreshBookings = async () => {
    const bookingsData = await apiGetMyBookings();
    setBookings(bookingsData || []);
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await apiConfirmBooking(bookingId);
      await refreshBookings();
    } catch (error) {
      alert('Erro ao aceitar: ' + (error as Error).message);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Recusar esta reserva?')) return;
    try {
      await apiCancelBooking(bookingId);
      await refreshBookings();
    } catch (error) {
      alert('Erro ao recusar: ' + (error as Error).message);
    }
  };

  const handleStartBooking = async (bookingId: string) => {
    try {
      await apiStartBooking(bookingId);
      await refreshBookings();
    } catch (error) {
      alert('Erro ao iniciar: ' + (error as Error).message);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    if (!window.confirm('Confirmar que o serviço foi finalizado?')) return;
    try {
      await apiCompleteBooking(bookingId);
      await refreshBookings();
    } catch (error) {
      alert('Erro ao finalizar: ' + (error as Error).message);
    }
  };

  // ─── Modal de confirmação (endereço) ──────────────────────
  const handleConfirmClick = (booking: any) => {
    const service = (booking.serviceType || '').toLowerCase();
    if (service === 'hospedagem' || service === 'banho e tosa' || service === 'creche') {
      setConfirmingBookingId(booking._id);
      setCep('');
      setStreetAddress('');
      setHouseNumber('');
      setAddressDetails('');
      setModalError('');
      setIsConfirmModalOpen(true);
    } else {
      handleConfirmBooking(booking._id);
    }
  };

  const handleModalConfirmSubmit = async () => {
    if (!cep.trim()) {
      setModalError('Por favor, informe o CEP.');
      return;
    }
    if (!streetAddress.trim()) {
      setModalError('Por favor, informe o endereço.');
      return;
    }
    if (!houseNumber.trim()) {
      setModalError('Por favor, informe o número.');
      return;
    }

    const fullAddress = `${streetAddress}, nº ${houseNumber}${addressDetails ? ` (${addressDetails})` : ''} - CEP: ${cep}`;

    try {
      if (!confirmingBookingId) return;
      await apiConfirmBooking(confirmingBookingId, fullAddress);
      await refreshBookings();
      setIsConfirmModalOpen(false);
    } catch (error) {
      setModalError((error as Error).message);
    }
  };

  // ─── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-[#FF6B35] border-t-transparent animate-spin mx-auto" />
            <p className="text-gray-400 text-sm font-medium">Carregando painel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // ─── Dados derivados ──────────────────────────────────────
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const activeBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'in_progress');
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const totalEarnings = completedBookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);
  const isProfileComplete = profile.services?.length > 0 && profile.availability?.length > 0;

  const filteredBookings =
    filterStatus === 'all' ? bookings : bookings.filter((b) => b.status === filterStatus);

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <DashboardSidebar
            profile={profile}
            onProfileUpdate={(updated) => {
              setProfile(updated);
              setLocalUser(updated);
            }}
          />

          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Cabeçalho de boas-vindas */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#1a0f08] via-[#150d06] to-[#0a0a0a] border border-[#FF6B35]/20 p-7 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B35]/10 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
              <div className="relative">
                <p className="text-[#FF6B35] text-xs font-bold uppercase tracking-widest mb-1">
                  Painel do Cuidador
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  Olá, {profile.name.split(' ')[0]}!
                </h1>
                <p className="text-gray-400 text-sm">
                  {pendingBookings.length > 0
                    ? `Você tem ${pendingBookings.length} solicitação${pendingBookings.length > 1 ? 'ões' : ''} aguardando resposta.`
                    : 'Nenhuma nova solicitação no momento. Seu perfil está ativo.'}
                </p>
              </div>
            </div>

            {/* Alerta de perfil incompleto */}
            {!isProfileComplete && (
              <div className="flex items-start gap-4 bg-amber-500/8 border border-amber-500/25 rounded-2xl p-5">
                <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-amber-400 font-bold mb-1">
                    Perfil incompleto — não aparece nas buscas
                  </h3>
                  <p className="text-amber-400/70 text-sm mb-3">
                    Configure seus serviços e dias disponíveis para receber reservas.
                  </p>
                  <Link
                    href="/dashboard/servicos"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-amber-950 font-bold text-sm rounded-xl hover:bg-amber-400 transition-colors"
                  >
                    Configurar agora <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Pendentes', value: pendingBookings.length, icon: Clock, color: '#F59E0B' },
                { label: 'Ativas', value: activeBookings.length, icon: Activity, color: '#06A77D' },
                { label: 'Concluídas', value: completedBookings.length, icon: CheckCircle2, color: '#3B82F6' },
                { label: 'Ganhos Totais', value: `R$ ${totalEarnings.toFixed(0)}`, icon: DollarSign, color: '#FF6B35' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="relative bg-white/4 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-2xl p-5 overflow-hidden transition-all duration-300 group cursor-default"
                >
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Seção de reservas */}
            <div className="space-y-4">
              {/* Cabeçalho + filtros */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <h2 className="text-lg font-bold text-white">Solicitações de Reserva</h2>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'all', label: 'Todas' },
                    { value: 'pending', label: 'Pendentes' },
                    { value: 'confirmed', label: 'Confirmadas' },
                    { value: 'in_progress', label: 'Em andamento' },
                    { value: 'completed', label: 'Concluídas' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilterStatus(opt.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        filterStatus === opt.value
                          ? 'bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/20'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/8'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de reservas */}
              {filteredBookings.length === 0 ? (
                <div className="bg-white/4 border border-white/8 rounded-3xl p-14 text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Nenhuma reserva encontrada</h3>
                  <p className="text-gray-500 text-sm max-w-sm">
                    {filterStatus === 'all'
                      ? 'Quando tutores solicitarem seus serviços, as reservas aparecerão aqui.'
                      : `Não há reservas com status "${STATUS_CONFIG[filterStatus]?.label || filterStatus}".`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map((booking) => {
                    const canStartToday = isTodayInBookingRange(booking.startDate, booking.endDate);
                    const status = STATUS_CONFIG[booking.status] || {
                      label: booking.status,
                      color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
                      dot: 'bg-gray-400',
                    };

                    return (
                      <div
                        key={booking._id}
                        className="relative bg-white/4 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-2xl overflow-hidden transition-all duration-300 group"
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.dot}`} />

                        <div className="pl-5 pr-5 py-5 flex flex-col sm:flex-row gap-5">
                          {/* Informações */}
                          <div className="flex-1 min-w-0 space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${status.color}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                {status.label}
                              </span>
                              <span className="text-gray-500 text-xs font-medium flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(booking.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                  Período
                                </p>
                                <div className="text-sm text-white font-medium bg-black/30 px-3 py-2 rounded-xl border border-white/5">
                                  {formatBookingDate(booking.startDate, booking.startTime)}
                                  <span className="text-gray-600 mx-2">→</span>
                                  {formatBookingDate(booking.endDate, booking.endTime)}
                                </div>
                              </div>

                              <div>
                                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                  Serviço
                                </p>
                                <div className="text-sm text-white font-medium bg-black/30 px-3 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                                  <PawPrint className="w-3.5 h-3.5 text-[#FF6B35] flex-shrink-0" />
                                  <span className="truncate">{booking.serviceType}</span>
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                  Pet do Tutor
                                </p>
                                <div className="text-sm text-white font-medium bg-black/30 px-3 py-2 rounded-xl border border-white/5 flex items-center gap-2 flex-wrap">
                                  <PawPrint className="w-3.5 h-3.5 text-[#FF6B35] flex-shrink-0" />
                                  {booking.petId ? (
                                    <>
                                      <strong>{booking.petId.name}</strong>
                                      {booking.petId.breed && (
                                        <span className="text-gray-400 text-xs">({booking.petId.breed})</span>
                                      )}
                                      {booking.petId.age !== undefined && (
                                        <span className="text-xs px-1.5 py-0.5 rounded-lg bg-white/5 text-gray-400">
                                          {booking.petId.age} {booking.petId.age === 1 ? 'ano' : 'anos'}
                                        </span>
                                      )}
                                      {booking.petId.size && (
                                        <span className="text-xs px-1.5 py-0.5 rounded-lg bg-white/5 text-gray-400">
                                          {booking.petId.size === 'small'
                                            ? 'Pequeno'
                                            : booking.petId.size === 'medium'
                                            ? 'Médio'
                                            : 'Grande'}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-gray-500 text-xs">Pet não informado</span>
                                  )}

                                </div>
                              </div>
                            </div>

                            <div className='sm:col-span-2'>
                              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                Tutor
                              </p>
                              <div className="text-white font-medium bg-black/40 px-3 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                                  {booking.tutorId?.avatar ? (
                                    <Image
                                      src={booking.tutorId.avatar}
                                      alt={booking.tutorId.name}
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 rounded-full object-cover shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                      <span className="text-sm font-bold text-gray-400 uppercase">
                                        {booking.tutorId?.name?.charAt(0)}
                                      </span>
                                    </div>
                                  )}
                                  <span>{booking.tutorId?.name || 'Tutor não informado'}</span>
                                </div>
                              </div>
                          </div>

                          {/* Preço e ações */}
                          <div className="sm:w-52 bg-black/25 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                            <div>
                              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                                Total ({booking.totalDays} {booking.totalDays === 1 ? 'dia' : 'dias'})
                              </p>
                              <p className="text-2xl font-bold text-white mb-1">
                                R$ {(booking.totalPrice || 0).toFixed(0)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {PAYMENT_LABELS[booking.paymentMethod] ||
                                  booking.paymentMethod ||
                                  'Não informado'}
                              </p>
                            </div>

                            <div className="mt-4 space-y-2">
                              {booking.status === 'pending' && (
                                  <>
                                    {isBookingExpired(booking.endDate) ? (
                                      <div className="w-full py-2.5 bg-white/5 border border-white/8 text-gray-500 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed">
                                        <XCircle className="w-4 h-4" />
                                        Reserva expirada
                                      </div>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleConfirmClick(booking)}
                                          className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                                        >
                                          <CheckCircle2 className="w-4 h-4" /> Aceitar
                                        </button>
                                        <button
                                          onClick={() => handleCancelBooking(booking._id)}
                                          className="w-full py-2.5 bg-red-500/8 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                                        >
                                          <XCircle className="w-4 h-4" /> Recusar
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}

                              {booking.status === 'confirmed' && (
                                <button
                                  onClick={() => handleStartBooking(booking._id)}
                                  disabled={!canStartToday}
                                  title={
                                    canStartToday
                                      ? 'Iniciar serviço'
                                      : 'Disponível apenas no dia agendado'
                                  }
                                  className={`w-full py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                    canStartToday
                                      ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                                      : 'bg-white/5 text-gray-500 border border-white/8 cursor-not-allowed'
                                  }`}
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  {canStartToday ? 'Iniciar serviço' : 'Iniciar no dia agendado'}
                                </button>
                              )}

                              {booking.status === 'in_progress' && (
                                <button
                                  onClick={() => handleCompleteBooking(booking._id)}
                                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Finalizar serviço
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal de confirmação de endereço */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div>
                <h3 className="text-white font-bold">Confirmar Endereço</h3>
                <p className="text-xs text-gray-500">Compartilhado com o tutor após confirmação</p>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="ml-auto text-gray-500 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">CEP</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cep}
                    onChange={handleCepChange}
                    placeholder="00000-000"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50 transition-all"
                  />
                  {isCepLoading && (
                    <Loader2 className="w-4 h-4 text-[#FF6B35] animate-spin absolute right-3 top-3" />
                  )}
                </div>
                {cepError && <p className="text-red-400 text-xs mt-1">{cepError}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Endereço</label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Rua, Bairro, Cidade - UF"
                  disabled={isCepLoading}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50 transition-all disabled:opacity-50"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Número</label>
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="123"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50 transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    Complemento (opcional)
                  </label>
                  <input
                    type="text"
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder="Apto 42, Bloco B"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50 transition-all"
                  />
                </div>
              </div>
            </div>

            {modalError && (
              <div className="mt-4 px-3 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium">
                {modalError}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleModalConfirmSubmit}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}