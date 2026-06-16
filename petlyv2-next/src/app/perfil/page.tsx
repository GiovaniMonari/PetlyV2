'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, MapPin, Mail, Shield, Clock, Calendar, LogOut, Edit2, Settings,
  PawPrint, ArrowLeft, Loader2, CheckCircle2, Camera, ImageIcon,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  apiGetProfile,
  apiGetMyBookings,
  isAuthenticated,
  logout,
  apiUpdateProfile,
  setUser as setLocalUser,
  apiUploadAvatar,
  pollAvatarReady,
  setUser,
  getUser,
  apiUpdateMyCaregiverProfile,
  apiGetMyCaregiverProfile,
} from '@/utils/api';
import { useDebounce } from '@/hooks/useDebounce';
import { searchLocation } from '@/utils/location';

// -----------------------------------------------------------
// Tipos e constantes para upload de avatar
// -----------------------------------------------------------
type AvatarUploadStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface AvatarState {
  status: AvatarUploadStatus;
  previewUrl: string | null;
}

// -----------------------------------------------------------
// Hook para upload de avatar do perfil
// -----------------------------------------------------------
function useProfileAvatarUpload() {
  const [avatarState, setAvatarState] = useState<AvatarState>({
    status: 'idle',
    previewUrl: null,
  });
  const blobUrlRef = useRef<string | null>(null);

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => revokeBlob();
  }, [revokeBlob]);

  const uploadAvatar = useCallback(
    async (userId: string, file: File, currentAvatar?: string) => {
      revokeBlob();
      const blobUrl = URL.createObjectURL(file);
      blobUrlRef.current = blobUrl;
      setAvatarState({ status: 'uploading', previewUrl: blobUrl });

      try {
        await apiUploadAvatar(userId, file);
        setAvatarState({ status: 'processing', previewUrl: blobUrl });

        const newUrl = await pollAvatarReady(currentAvatar, {
          intervalMs: 3000,
          timeoutMs: 60000,
        });

        if (newUrl) {
          revokeBlob();
          setAvatarState({ status: 'done', previewUrl: newUrl });
          return newUrl;
        } else {
          setAvatarState((prev) => ({ ...prev, status: 'done' }));
        }
      } catch (err: any) {
        revokeBlob();
        setAvatarState({ status: 'error', previewUrl: null });
        throw err;
      }
    },
    [revokeBlob]
  );

  return { avatarState, uploadAvatar };
}

// -----------------------------------------------------------
// Overlay de progresso no avatar (durante upload)
// -----------------------------------------------------------
function AvatarStatusOverlay({ status }: { status: AvatarUploadStatus }) {
  if (status === 'idle' || status === 'done' || status === 'error') return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] rounded-full z-10">
      {(status === 'uploading' || status === 'processing') && (
        <>
          <Loader2 className="w-8 h-8 text-white animate-spin mb-1" />
          <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
            {status === 'uploading' ? 'Enviando...' : 'Processando...'}
          </span>
        </>
      )}
    </div>
  );
}

// -----------------------------------------------------------
// Helpers de data
// -----------------------------------------------------------
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
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }
  } catch {
    return 'Data inválida';
  }
}

// -----------------------------------------------------------
// Componente principal
// -----------------------------------------------------------
export default function PerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'reservas' | 'config'>('info');

  const isCaregiver = profile?.role === 'caregiver';

  // Edição inline
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Autocomplete de localização
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedEditLocation = useDebounce(editForm.location, 500);
  const isDebouncing =
    editForm.location &&
    editForm.location !== debouncedEditLocation &&
    editForm.location.length > 2;
  const showLoading = isSearching || isDebouncing;

  // Avatar (hook)
  const { avatarState, uploadAvatar } = useProfileAvatarUpload();

  const AVAILABLE_SERVICES = ['Hospedagem', 'Visita em domicílio', 'Passeio'];
  const DAYS_OF_WEEK = [
    { id: 0, label: 'Domingo' },
    { id: 1, label: 'Segunda' },
    { id: 2, label: 'Terça' },
    { id: 3, label: 'Quarta' },
    { id: 4, label: 'Quinta' },
    { id: 5, label: 'Sexta' },
    { id: 6, label: 'Sábado' },
  ];

  // ----------- Efeitos iniciais -----------
  // No useEffect inicial
useEffect(() => {
  if (!isAuthenticated()) {
    router.push('/login');
    return;
  }

  const fetchProfileData = async () => {
    try {
      const localUser = getUser();
      let profileData;

      // 1. Sempre busca os dados básicos do usuário (nome, email, location, avatar)
      const userBasic = await apiGetProfile();

      if (localUser?.role === 'caregiver') {
        // 2. Busca dados específicos do cuidador (serviços, disponibilidade etc.)
        const caregiverProfile = await apiGetMyCaregiverProfile();

        // 3. Mescla: prioridade para caregiverProfile, mas userBasic garante campos essenciais
        profileData = {
          ...userBasic,                 // name, email, location, avatar, etc.
          ...caregiverProfile,          // services, availability, rating, etc.
          _id: userBasic._id,          // ID do usuário (importante para upload de avatar)
          role: 'caregiver',
        };
      } else {
        profileData = userBasic;
      }

      setProfile(profileData);
      setUser(profileData); // atualiza localStorage com dados completos

      if (profileData.role !== 'caregiver') {
        const bookingsData = await apiGetMyBookings();
        setBookings(bookingsData || []);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchProfileData();
}, [router]);

const handleSaveProfile = async () => {
  setIsSaving(true);
  try {
    const payload: any = {
      name: editForm.name,
      location: editForm.location,
    };

    let updated;

    if (profile.role === 'caregiver') {
      payload.services = editForm.services;
      payload.availableDays = editForm.availableDays;
      updated = await apiUpdateMyCaregiverProfile(payload);
    } else {
      updated = await apiUpdateProfile(profile._id, payload);
    }

    // Atualiza estado local e localStorage
    setProfile(updated);
    setUser(updated); // Garante que Navbar veja mudanças em nome/location/avatar

    setIsEditing(false);
  } catch (err) {
    console.error('Error updating profile:', err);
    alert('Erro ao atualizar o perfil.');
  } finally {
    setIsSaving(false);
  }
};

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedEditLocation.length > 2 && showSuggestions) {
        setIsSearching(true);
        const results = await searchLocation(debouncedEditLocation);
        setSuggestions(results);
        setIsSearching(false);
      } else {
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [debouncedEditLocation, showSuggestions]);

  // ----------- Handlers de edição -----------
  const startEditing = () => {
    setEditForm({
      name: profile.name || '',
      location: profile.location || '',
      services: profile.services || [],
      availableDays: profile.availableDays || [0, 1, 2, 3, 4, 5, 6],
    });
    setIsEditing(true);
  };

  const handleServiceChange = (serviceName: string, isChecked: boolean) => {
    if (isChecked) {
      setEditForm({
        ...editForm,
        services: [...editForm.services, { name: serviceName, price: 0, duration: '60 min' }],
      });
    } else {
      setEditForm({
        ...editForm,
        services: editForm.services.filter((s: any) => s.name !== serviceName),
      });
    }
  };

  const handleServicePriceChange = (serviceName: string, price: number) => {
    setEditForm({
      ...editForm,
      services: editForm.services.map((s: any) =>
        s.name === serviceName ? { ...s, price } : s
      ),
    });
  };

  const handleServiceDurationChange = (serviceName: string, duration: string) => {
    setEditForm({
      ...editForm,
      services: editForm.services.map((s: any) =>
        s.name === serviceName ? { ...s, duration } : s
      ),
    });
  };

  const handleDayChange = (dayId: number) => {
    const isSelected = editForm.availableDays.includes(dayId);
    if (isSelected) {
      setEditForm({
        ...editForm,
        availableDays: editForm.availableDays.filter((d: number) => d !== dayId),
      });
    } else {
      setEditForm({
        ...editForm,
        availableDays: [...editForm.availableDays, dayId].sort(),
      });
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // ----------- Avatar -----------
  const displayAvatar = avatarState.previewUrl ?? profile?.avatar ?? null;

  const openFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && profile) {
        if (!file.type.startsWith('image/')) {
          alert('Por favor, selecione uma imagem válida.');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert('A imagem deve ter no máximo 5MB.');
          return;
        }
        try {
          const userId = profile.userId?._id || profile.userId || profile._id;
          const newAvatarUrl = await uploadAvatar(userId, file, profile.avatar);
          if (newAvatarUrl) {
            // 1. Atualiza o estado local do perfil
            const updatedProfile = { ...profile, avatar: newAvatarUrl };
            setProfile(updatedProfile);

            // 2. Atualiza o localStorage (objeto do usuário)
            const currentUser = getUser(); // função do api.ts
            if (currentUser) {
              const updatedUser = { ...currentUser, avatar: newAvatarUrl };
              setUser(updatedUser); // função do api.ts que salva em localStorage
            }

            // 3. Emite evento para a Navbar
            window.dispatchEvent(new Event('userAvatarChanged'));
          }
        } catch (err: any) {
          alert(err?.message || 'Erro ao atualizar foto.');
        }
      }
    };
    input.click();
  };

  // ----------- Helpers de reservas -----------
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
      case 'pay_on_service': return 'Pagar na hora do serviço';
      case 'card': return 'Cartão';
      case 'pix': return 'PIX';
      default: return method || 'Não informado';
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  // ----------- Loading -----------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-[#FF6B35] animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) return null;

  // ----------- Render -----------
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header/Banner Profile */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-gray-900 to-black border border-white/10 p-8 md:p-12 mb-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF6B35]/10 blur-[120px] rounded-full pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar com botão de câmera aparecendo no hover */}
            <div className="flex-shrink-0 relative">
              <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-white/10 group">
                {displayAvatar ? (
                  <Image
                    src={displayAvatar}
                    alt={profile.name}
                    fill
                    className="object-cover"
                    unoptimized={displayAvatar.startsWith('blob:')}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-14 h-14 text-white/40" />
                  </div>
                )}

                {/* Overlay de progresso (uploading/processing) */}
                <AvatarStatusOverlay status={avatarState.status} />

                {/* Overlay escuro + ícone de câmera no hover */}
                {avatarState.status !== 'uploading' && avatarState.status !== 'processing' && (
                  <button
                    onClick={openFilePicker}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full cursor-pointer"
                    title="Alterar foto de perfil"
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <Camera className="w-7 h-7 text-white drop-shadow-lg" />
                      <span className="text-xs font-semibold text-white/90 drop-shadow-md">
                        Alterar foto
                      </span>
                    </div>
                  </button>
                )}
              </div>
              {profile.role === 'caregiver' && (
                <div className="absolute top-0 right-0 w-7 h-7 bg-[#06A77D] rounded-full border-2 border-gray-900 flex items-center justify-center z-20">
                  <Shield className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            {/* Nome, email, localização */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  {profile.name}
                </h1>
                <span
                  className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full border w-fit mx-auto md:mx-0 ${
                    profile.role === 'caregiver'
                      ? 'bg-[#06A77D]/10 text-[#06A77D] border-[#06A77D]/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}
                >
                  {profile.role === 'caregiver' ? 'CUIDADOR PARCEIRO' : 'TUTOR DE PET'}
                </span>
              </div>
              <div className="flex flex-col md:flex-row gap-3 md:gap-6 text-gray-400 text-sm font-medium">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  {profile.email}
                </div>
                {profile.location && (
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Membro desde{' '}
                  {new Date(profile.createdAt).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-gray-300 hover:text-red-400 rounded-xl transition-all flex items-center gap-2 text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'info'
                ? 'bg-[#FF6B35] text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <User className="w-4 h-4" />
            Informações
          </button>

          {profile.role !== 'caregiver' && (
            <button
              onClick={() => setActiveTab('reservas')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'reservas'
                  ? 'bg-[#FF6B35] text-white shadow-lg'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Minhas Reservas
              {bookings.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-black/30 rounded-full text-xs">
                  {bookings.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('config')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'config'
                ? 'bg-[#FF6B35] text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Settings className="w-4 h-4" />
            Configurações
          </button>
        </div>

        {/* Tab Content */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* INFORMAÇÕES TAB */}
            {activeTab === 'info' && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Dados Pessoais</h2>
                  {!isEditing ? (
                    <button
                      onClick={startEditing}
                      className="text-[#FF6B35] hover:text-[#E55A2B] text-sm font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-gray-400 hover:text-white text-sm font-semibold transition-colors"
                        disabled={isSaving}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Salvar
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500">Nome completo</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full text-white font-medium bg-black/40 px-4 py-3 rounded-xl border border-[#FF6B35]/50 focus:outline-none"
                      />
                    ) : (
                      <p className="text-white font-medium bg-black/30 px-4 py-3 rounded-xl border border-white/5">
                        {profile.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-500">
                      E-mail <span className="text-xs text-gray-600">(não editável)</span>
                    </span>
                    <p className="text-gray-400 font-medium bg-black/30 px-4 py-3 rounded-xl border border-white/5 cursor-not-allowed">
                      {profile.email}
                    </p>
                  </div>
                  {profile.cpf && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-500">
                        CPF <span className="text-xs text-gray-600">(não editável)</span>
                      </span>
                      <p className="text-gray-400 font-medium bg-black/30 px-4 py-3 rounded-xl border border-white/5 cursor-not-allowed">
                        {profile.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1 relative">
                    <span className="text-sm font-medium text-gray-500">Localização Base</span>
                    {isEditing ? (
                      <input
                        type="text"
                        name="location"
                        value={editForm.location}
                        onChange={(e) => {
                          setEditForm({ ...editForm, location: e.target.value });
                          setShowSuggestions(true);
                        }}
                        onBlur={(e) => {
                          setTimeout(() => setShowSuggestions(false), 200);
                          handleBlur(e);
                        }}
                        className="w-full text-white font-medium bg-black/40 px-4 py-3 rounded-xl border border-[#FF6B35]/50 focus:outline-none"
                        placeholder="Sua cidade / Estado"
                      />
                    ) : (
                      <p className="text-white font-medium bg-black/30 px-4 py-3 rounded-xl border border-white/5">
                        {profile.location || 'Ainda não informada'}
                      </p>
                    )}
                    {showSuggestions && (suggestions.length > 0 || isSearching) && (
                      <div className="absolute z-50 w-full mt-2 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                        {showLoading ? (
                          <div className="px-4 py-3 text-sm text-gray-400">Buscando...</div>
                        ) : (
                          suggestions.map((sug, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setEditForm((prev: any) => ({ ...prev, location: sug }));
                                setShowSuggestions(false);
                              }}
                              className={`px-4 py-3 text-sm text-gray-300 hover:bg-white/10 cursor-pointer transition-colors ${
                                idx !== suggestions.length - 1 ? 'border-b border-white/5' : ''
                              }`}
                            >
                              {sug}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* RESERVAS TAB (tutores) */}
            {activeTab === 'reservas' && profile.role !== 'caregiver' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-white">Histórico de Reservas</h2>
                </div>
                {bookings.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Nenhuma reserva encontrada</h3>
                    <p className="text-gray-400 mb-6 max-w-md">
                      Você ainda não tem reservas ativas. Que tal encontrar um cuidador agora mesmo?
                    </p>
                    <Link
                      href="/cuidadores"
                      className="px-6 py-3 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#E55A2B] transition-colors"
                    >
                      Buscar Cuidadores
                    </Link>
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors rounded-2xl p-5 flex flex-col sm:flex-row gap-5 relative overflow-hidden group"
                    >
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1 ${
                          booking.status === 'confirmed'
                            ? 'bg-green-500'
                            : booking.status === 'in_progress'
                            ? 'bg-cyan-500'
                            : booking.status === 'pending'
                            ? 'bg-yellow-500'
                            : booking.status === 'cancelled'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {getStatusText(booking.status)}
                          </span>
                          <span className="text-gray-400 text-sm font-medium flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {new Date(booking.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Período</span>
                            <div className="text-white font-medium bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                              {formatBookingDate(booking.startDate, booking.startTime)}
                              <span className="text-gray-500 mx-2">até</span>
                              {formatBookingDate(booking.endDate, booking.endTime)}
                            </div>
                          </div>
                          <div className="sm:col-span-2 md:col-span-1">
                            <div>
                              <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Serviço</span>
                              <div className="text-white font-medium bg-black/40 px-3 py-2 rounded-lg border border-white/5 flex items-center gap-2 capitalize">
                                <PawPrint className="w-4 h-4 text-[#FF6B35]" />
                                {booking.serviceType} ({booking.petId?.name || 'Pet não informado'})
                              </div>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Cuidador</span>
                              <div className="text-white font-medium bg-black/40 px-3 py-2 rounded-lg border border-white/5 flex items-center gap-2 capitalize">
                                <PawPrint className="w-4 h-4 text-[#FF6B35]" />
                                {booking.caregiverId?.name || 'Cuidador não informado'}
                              </div>
                            </div>
                          </div>
                          <div className="sm:col-span-2 md:col-span-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Local de Atendimento</span>
                            <div className="text-white font-medium bg-black/40 px-3 py-2 rounded-lg border border-white/5 flex flex-col gap-0.5 min-h-[42px]">
                              {(() => {
                                const serviceTypeLower = (booking.serviceType || '').toLowerCase();
                                const isAtCaregiverAddress =
                                  serviceTypeLower === 'hospedagem' ||
                                  serviceTypeLower.includes('hospedagem') ||
                                  serviceTypeLower === 'banho e tosa' ||
                                  serviceTypeLower === 'creche';
                                if (isAtCaregiverAddress) {
                                  return (
                                    <>
                                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Na casa do cuidador</span>
                                      {booking.status === 'pending' ? (
                                        <span className="text-xs text-yellow-500/90 font-medium italic">
                                          Endereço liberado após confirmação
                                        </span>
                                      ) : booking.location ? (
                                        <span className="text-xs text-white font-semibold break-all">{booking.location}</span>
                                      ) : (
                                        <span className="text-xs text-gray-500 italic">Endereço não informado</span>
                                      )}
                                    </>
                                  );
                                } else {
                                  return (
                                    <>
                                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Na residência do tutor</span>
                                      {booking.location ? (
                                        <span className="text-xs text-white font-semibold break-all">{booking.location}</span>
                                      ) : (
                                        <span className="text-xs text-gray-500 italic">Endereço não informado</span>
                                      )}
                                    </>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="sm:w-48 bg-black/30 rounded-xl border border-white/5 p-4 flex flex-col justify-center sm:text-right">
                        <span className="text-xs font-medium text-gray-500 block mb-1">
                          Valor Total ({booking.totalDays} dias)
                        </span>
                        <span className="text-2xl font-bold text-white">R$ {booking.totalPrice}</span>
                        <div className="text-xs text-gray-400 mt-2">
                          Pagamento:{' '}
                          <span className="text-white font-medium">{getPaymentMethodText(booking.paymentMethod)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* CONFIGURAÇÕES TAB */}
            {activeTab === 'config' && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-white mb-6">Configurações de Conta</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                    <div>
                      <h4 className="text-white font-medium">Notificações por Email</h4>
                      <p className="text-sm text-gray-500 mt-1">Receba alertas sobre novas reservas e mensagens</p>
                    </div>
                    <div className="w-12 h-6 bg-[#FF6B35] rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                    <div>
                      <h4 className="text-white font-medium">Alterar Senha</h4>
                      <p className="text-sm text-gray-500 mt-1">Atualize sua senha de acesso</p>
                    </div>
                    <button className="px-4 py-2 bg-white/10 text-white text-sm font-semibold rounded-lg hover:bg-white/20 transition-colors">
                      <Link href="/forget-password">Alterar</Link>
                    </button>
                  </div>
                  <div className="mt-8 pt-8 border-t border-red-500/20">
                    <h4 className="text-red-400 font-bold mb-2">Zona de Perigo</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Ao excluir sua conta, todos os seus dados e histórico de reservas serão permanentemente apagados.
                    </p>
                    <button className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold rounded-lg hover:bg-red-500 hover:text-white transition-all">
                      Excluir Conta Permanentemente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#FF6B35] to-[#E55A2B] rounded-3xl p-6 shadow-xl relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              <PawPrint className="w-8 h-8 text-white/80 mb-4" />
              <h3 className="text-xl font-bold mb-2">
                {profile.role === 'caregiver' ? 'Aumente seus ganhos' : 'Precisa de ajuda?'}
              </h3>
              <p className="text-white/80 text-sm font-medium mb-6">
                {profile.role === 'caregiver'
                  ? 'Mantenha seu perfil atualizado com fotos e preços competitivos para atrair mais tutores.'
                  : 'Nossa equipe de suporte está disponível 24/7 para ajudar você e seu pet.'}
              </p>
              <button className="w-full py-3 bg-white text-[#FF6B35] font-bold rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">
                {profile.role === 'caregiver' ? 'Dicas para Cuidadores' : 'Falar com Suporte'}
              </button>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
              <h3 className="font-bold text-white mb-4">Atalhos</h3>
              <div className="space-y-2">
                {profile.role === 'tutor' && (
                  <Link
                    href="/cuidadores"
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group"
                  >
                    <span className="font-medium text-sm">Buscar novos cuidadores</span>
                    <ArrowLeft className="w-4 h-4 transform rotate-180 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-[#FF6B35]" />
                  </Link>
                )}
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group">
                  <span className="font-medium text-sm">Central de Ajuda</span>
                  <ArrowLeft className="w-4 h-4 transform rotate-180 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-[#FF6B35]" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group">
                  <span className="font-medium text-sm">Termos de Uso</span>
                  <ArrowLeft className="w-4 h-4 transform rotate-180 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-[#FF6B35]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}