'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Settings,
  User,
  LogOut,
  Briefcase,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle2,
  PawPrint,
  XCircle,
  MapPin,
  PlayCircle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload';
import {
  apiGetProfile,
  apiGetMyBookings,
  isAuthenticated,
  logout,
  apiConfirmBooking,
  apiCancelBooking,
  apiStartBooking,
  apiCompleteBooking,
} from '@/utils/api';

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
    } else {
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      });
    }
  } catch (error) {
    console.error('Error formatting booking date:', error);
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

function isTodayInBookingRange(startDate?: string, endDate?: string): boolean {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate || startDate);

  if (!start || !end) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today >= start && today <= end;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmingBookingId, setConfirmingBookingId] = useState<string | null>(null);
  const [cep, setCep] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [modalError, setModalError] = useState('');

  const fetchAddressFromCep = async (cepValue: string) => {
    const cleanedCep = cepValue.replace(/\D/g, '');
    if (cleanedCep.length !== 8) return;

    setIsCepLoading(true);
    setCepError('');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      const data = await response.json();
      if (data.erro) {
        setCepError('CEP não encontrado.');
      } else {
        setStreetAddress(`${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`);
      }
    } catch (err) {
      console.error('Error fetching CEP:', err);
      setCepError('Erro ao buscar o CEP.');
    } finally {
      setIsCepLoading(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleaned = rawVal.replace(/\D/g, '').slice(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 5) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    setCep(formatted);
    if (cleaned.length === 8) {
      fetchAddressFromCep(cleaned);
    }
  };

  const handleConfirmClick = (booking: any) => {
    const serviceTypeLower = (booking.serviceType || '').toLowerCase();
    const needsAddress =
      serviceTypeLower === 'hospedagem' ||
      serviceTypeLower === 'banho e tosa' ||
      serviceTypeLower === 'creche';

    if (needsAddress) {
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
      setModalError('Por favor, informe o endereço completo.');
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
      console.error('Error confirming booking with address:', error);
      setModalError((error as Error).message);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [profileData, bookingsData] = await Promise.all([
          apiGetProfile(),
          apiGetMyBookings()
        ]);
        
        if (profileData.role !== 'caregiver') {
          router.push('/');
          return;
        }

        setProfile(profileData);
        setBookings(bookingsData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const refreshBookings = async () => {
    const bookingsData = await apiGetMyBookings();
    setBookings(bookingsData || []);
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await apiConfirmBooking(bookingId);
      await refreshBookings();
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Erro ao aceitar a reserva: ' + (error as Error).message);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Tem certeza de que deseja recusar esta reserva?')) {
      return;
    }
    try {
      await apiCancelBooking(bookingId);
      await refreshBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Erro ao recusar a reserva: ' + (error as Error).message);
    }
  };

  const handleStartBooking = async (bookingId: string) => {
    try {
      await apiStartBooking(bookingId);
      await refreshBookings();
    } catch (error) {
      console.error('Error starting booking:', error);
      alert('Erro ao iniciar o serviço: ' + (error as Error).message);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    if (!window.confirm('Confirmar que este serviço foi finalizado?')) {
      return;
    }

    try {
      await apiCompleteBooking(bookingId);
      await refreshBookings();
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('Erro ao finalizar o serviço: ' + (error as Error).message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'in_progress': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'completed': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'in_progress': return 'Em andamento';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Concluída';
      default: return status;
    }
  };

  const getPaymentMethodText = (method?: string) => {
    switch (method) {
      case 'pay_on_service':
        return 'Pagar na hora do serviço';
      case 'card':
        return 'Cartão';
      case 'pix':
        return 'PIX';
      default:
        return method || 'Não informado';
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

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const activeBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'in_progress',
  );
  const isProfileComplete = profile.services?.length > 0 && profile.availableDays?.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Menu */}
          <div className="md:w-64 flex-shrink-0 space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                <div className="scale-75 origin-left">
                  <ProfilePhotoUpload 
                    currentAvatar={profile.avatar} 
                    userName={profile.name} 
                    onUploadSuccess={(newAvatarUrl) => {
                      const updatedProfile = { ...profile, avatar: newAvatarUrl };
                      setProfile(updatedProfile);
                      // Update user in local storage to sync across tabs/navbar
                      localStorage.setItem('petly_user', JSON.stringify(updatedProfile));
                      // Force a refresh of the Navbar if needed, though most apps use a provider
                      window.dispatchEvent(new Event('storage'));
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm line-clamp-1">{profile.name}</h3>
                  <span className="text-xs text-[#06A77D] font-medium bg-[#06A77D]/10 px-2 py-0.5 rounded-full mt-1 inline-block">Cuidador</span>
                </div>
              </div>

              <nav className="space-y-2">
                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FF6B35] text-white font-medium text-sm shadow-lg shadow-[#FF6B35]/20">
                  <Briefcase className="w-4 h-4" /> Painel Geral
                </Link>
                <Link href="/dashboard/servicos" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium text-sm transition-colors">
                  <Settings className="w-4 h-4" /> Serviços & Preços
                </Link>
                <Link href="/dashboard/disponibilidade" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium text-sm transition-colors">
                  <Calendar className="w-4 h-4" /> Disponibilidade
                </Link>
                <Link href="/dashboard/capacidade" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium text-sm transition-colors">
                  <PawPrint className="w-4 h-4" /> Capacidade de Pets
                </Link>
                <Link href="/perfil" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium text-sm transition-colors">
                  <User className="w-4 h-4" /> Meu Perfil
                </Link>
              </nav>

              <button 
                onClick={handleLogout}
                className="w-full mt-8 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white font-medium text-sm transition-all"
              >
                <LogOut className="w-4 h-4" /> Sair da conta
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            <h1 className="text-3xl font-bold text-white">Bem-vindo, {profile.name.split(' ')[0]}!</h1>

            {!isProfileComplete && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 flex items-start gap-4 animate-pulse">
                <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-yellow-500 font-bold text-lg mb-1">Seu perfil não está visível para os tutores</h3>
                  <p className="text-yellow-500/80 text-sm mb-4">Para aparecer nas buscas e receber reservas, você precisa configurar seus serviços, preços e dias disponíveis.</p>
                  <Link href="/dashboard/servicos" className="inline-block px-4 py-2 bg-yellow-500 text-yellow-950 font-bold text-sm rounded-lg hover:bg-yellow-400 transition-colors">
                    Configurar agora
                  </Link>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B35]/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                <span className="text-gray-400 text-sm font-medium mb-2 block">Reservas Pendentes</span>
                <div className="text-4xl font-bold text-white mb-1">{pendingBookings.length}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#06A77D]/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                <span className="text-gray-400 text-sm font-medium mb-2 block">Reservas Ativas</span>
                <div className="text-4xl font-bold text-white mb-1">{activeBookings.length}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                <span className="text-gray-400 text-sm font-medium mb-2 block">Ganhos do Mês</span>
                <div className="text-4xl font-bold text-white mb-1">
                  R$ {activeBookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0)}
                </div>
              </div>
            </div>

            {/* Bookings Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Solicitações Recentes</h2>
              </div>

              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Nenhuma reserva encontrada</h3>
                    <p className="text-gray-400 max-w-md">Quando tutores solicitarem seus serviços, as reservas aparecerão aqui.</p>
                  </div>
                ) : (
                  bookings.slice(0, 5).map((booking) => {
                    const canStartToday = isTodayInBookingRange(
                      booking.startDate,
                      booking.endDate,
                    );

                    return (
                      <div key={booking._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${booking.status === 'confirmed' ? 'bg-green-500' : booking.status === 'in_progress' ? 'bg-cyan-500' : booking.status === 'pending' ? 'bg-yellow-500' : booking.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'}`}></div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                          <span className="text-gray-400 text-sm font-medium flex items-center gap-1.5">
                            <Clock className="w-4 h-4" /> 
                            {new Date(booking.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Período</span>
                            <div className="text-white font-medium bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                              {formatBookingDate(booking.startDate, booking.startTime)} 
                              <span className="text-gray-500 mx-2">até</span> 
                              {formatBookingDate(booking.endDate, booking.endTime)}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Serviço</span>
                            <div className="text-white font-medium bg-black/40 px-3 py-2 rounded-lg border border-white/5 flex items-center gap-2">
                              <PawPrint className="w-4 h-4 text-[#FF6B35]" />
                              {booking.serviceType}
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Pet</span>
                          <div className="text-white font-medium bg-black/40 px-3 py-2 rounded-lg border border-white/5 flex items-center gap-2">
                            <PawPrint className="w-4 h-4 text-[#FF6B35]" />
                            {booking.petId ? (
                              <span className="flex flex-wrap items-center gap-1.5">
                                <strong className="text-white">{booking.petId.name}</strong>
                                {booking.petId.breed && <span className="text-gray-400">({booking.petId.breed})</span>}
                                {booking.petId.age !== undefined && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                                    {booking.petId.age} {booking.petId.age === 1 ? 'ano' : 'anos'}
                                  </span>
                                )}
                                {booking.petId.size && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                                    {booking.petId.size === 'small' ? 'Pequeno' : booking.petId.size === 'medium' ? 'Médio' : 'Grande'}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">Pet não informado</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="sm:w-48 bg-black/30 rounded-xl border border-white/5 p-4 flex flex-col justify-center text-center sm:text-right">
                        <span className="text-xs font-medium text-gray-500 block mb-1">Valor Total ({booking.totalDays} dias)</span>
                        <span className="text-2xl font-bold text-white">R$ {booking.totalPrice}</span>
                        <div className="text-xs text-gray-400 mt-2">Pagamento: <span className="text-white font-medium">{getPaymentMethodText(booking.paymentMethod)}</span></div>
                      
                        {booking.status === 'pending' && (
                          <div className="flex flex-col gap-2 mt-3">
                            <button
                              onClick={() => handleConfirmClick(booking)}
                              className="w-full py-2 bg-[#06A77D] text-white text-sm font-semibold rounded-lg hover:bg-[#05936e] transition-colors flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Aceitar
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              className="w-full py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-4 h-4" /> Recusar
                            </button>
                          </div>
                        )}

                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleStartBooking(booking._id)}
                            disabled={!canStartToday}
                            className={`mt-3 w-full py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                              canStartToday
                                ? 'bg-cyan-500 text-white hover:bg-cyan-400'
                                : 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                            }`}
                            title={
                              canStartToday
                                ? 'Iniciar serviço'
                                : 'Disponível apenas no dia/período agendado'
                            }
                          >
                            <PlayCircle className="w-4 h-4" />
                            {canStartToday ? 'Iniciar serviço' : 'Iniciar no dia agendado'}
                          </button>
                        )}

                        {booking.status === 'in_progress' && (
                          <button
                            onClick={() => handleCompleteBooking(booking._id)}
                            className="mt-3 w-full py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-400 transition-colors flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Finalizar serviço
                          </button>
                        )}
                      </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de confirmação com endereço */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#FF6B35]" /> Confirmar Endereço
              </h3>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Este serviço é realizado em seu endereço. Por segurança, insira os dados exatos do local. O cliente só terá acesso a este endereço completo após a confirmação da reserva.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">CEP</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cep}
                    onChange={handleCepChange}
                    placeholder="00000-000"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50"
                  />
                  {isCepLoading && (
                    <Loader2 className="w-4 h-4 text-[#FF6B35] animate-spin absolute right-3 top-2.5" />
                  )}
                </div>
                {cepError && (
                  <span className="text-[10px] text-red-400 mt-1 block">{cepError}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Endereço (rua, bairro, cidade)</label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Rua, Bairro, Cidade - UF"
                  disabled={isCepLoading}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Número</label>
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="Ex: 123"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Complemento (Apto, Bloco - Opcional)</label>
                  <input
                    type="text"
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder="Apto 42, Bloco B"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50"
                  />
                </div>
              </div>
            </div>

            {modalError && (
              <div className="mt-4 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium">
                {modalError}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-sm font-semibold transition-all"
              >
                Voltar
              </button>
              <button
                onClick={handleModalConfirmSubmit}
                className="flex-1 py-2 rounded-xl bg-[#06A77D] hover:bg-[#05936e] text-white text-sm font-semibold transition-all flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirmar e Aceitar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
