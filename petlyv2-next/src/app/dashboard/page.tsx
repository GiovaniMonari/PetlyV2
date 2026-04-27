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
  PawPrint
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiGetProfile, apiGetMyBookings, isAuthenticated, logout } from '@/utils/api';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'completed': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Concluída';
      default: return status;
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
  const activeBookings = bookings.filter(b => b.status === 'confirmed');
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
                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FF6B35] text-white font-medium text-sm shadow-lg shadow-[#FF6B35]/20">
                  <Briefcase className="w-4 h-4" /> Painel Geral
                </Link>
                <Link href="/dashboard/servicos" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium text-sm transition-colors">
                  <Settings className="w-4 h-4" /> Serviços & Preços
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
                  bookings.slice(0, 5).map((booking) => (
                    <div key={booking._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${booking.status === 'confirmed' ? 'bg-green-500' : booking.status === 'pending' ? 'bg-yellow-500' : booking.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'}`}></div>

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
                              {new Date(booking.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} 
                              <span className="text-gray-500 mx-2">até</span> 
                              {new Date(booking.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
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
                      </div>

                      <div className="sm:w-48 bg-black/30 rounded-xl border border-white/5 p-4 flex flex-col justify-center text-center sm:text-right">
                        <span className="text-xs font-medium text-gray-500 block mb-1">Valor Total ({booking.totalDays} dias)</span>
                        <span className="text-2xl font-bold text-white">R$ {booking.totalPrice}</span>
                        
                        {booking.status === 'pending' && (
                          <div className="flex flex-col gap-2 mt-3">
                            <button className="w-full py-2 bg-[#06A77D] text-white text-sm font-semibold rounded-lg hover:bg-[#05936e] transition-colors flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Aceitar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
