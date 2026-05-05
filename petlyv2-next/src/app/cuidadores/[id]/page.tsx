'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  MessageSquareText,
  PawPrint,
  ShieldCheck,
  Star,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  apiCreateBooking,
  apiGetCaregiver,
  apiGetMyBookings,
  apiSubmitBookingReview,
  getUser,
  isAuthenticated,
} from '@/utils/api';

type CaregiverService = {
  name: string;
  price: number;
  duration: string;
  type: string;
};

type CaregiverProfile = {
  _id: string;
  name: string;
  role: string;
  avatar?: string;
  location?: string;
  bio?: string;
  specialties?: string[];
  petTypes?: string[];
  petsQuantity?: { type: string; quantity: number }[];
  availableDays?: string[];
  serviceHours?: string[];
  availability?: {
    service: string;
    availableDays: string[];
    serviceHours: string[];
  }[];
  services?: CaregiverService[];
  price?: number;
  rating?: number;
  reviewsCount?: number;
};

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

const PET_TYPE_LABELS: Record<string, string> = {
  dog: 'Cães',
  cat: 'Gatos',
  bird: 'Pássaros',
  other: 'Outros',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function normalizeId(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return String(value._id);
  if (typeof value === 'object' && value.id) return String(value.id);
  return '';
}

export default function CaregiverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caregiverId = params.id as string;

  const [caregiver, setCaregiver] = useState<CaregiverProfile | null>(null);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [selectedService, setSelectedService] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPetType, setSelectedPetType] = useState('dog');
  const [petsCount, setPetsCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  const [startTime, setStartTime] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const currentUser = getUser();
  const isTutor = currentUser?.role === 'tutor';
  const isOwnProfile = normalizeId(currentUser?.id) === caregiverId;

  const today = new Date().toISOString().split('T')[0];

  const services = useMemo(() => {
    if (!caregiver) return [];

    if (Array.isArray(caregiver.services) && caregiver.services.length > 0) {
      return caregiver.services.filter(
        (service) =>
          service &&
          typeof service.name === 'string' &&
          service.name.trim().length > 0,
      );
    }

    return [
      {
        name: 'Hospedagem',
        type: 'boarding',
        price: caregiver.price || 0,
        duration: 'Diária (24h)',
      },
    ];
  }, [caregiver]);

  const selectedServiceData = useMemo(
    () => services.find((service) => service.name === selectedService) || services[0],
    [services, selectedService],
  );

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');
    const diff = end.getTime() - start.getTime();

    if (Number.isNaN(diff)) return 0;
    if (diff < 0) return 0;

    // We add 1 because if you book from 10th to 10th, it's 1 day.
    // If you book from 10th to 11th, it's 2 days (or depends on service type).
    // For Petly, it seems we use "total days of care".
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
  }, [startDate, endDate]);

  const isShortService = useMemo(() => {
    if (!selectedServiceData) return false;
    const duration = (selectedServiceData.duration || '').toLowerCase();
    return duration.includes('min') || (duration.includes('h') && !duration.includes('24h') && !duration.includes('12h') && !duration.includes('diária') && !duration.includes('pernoite'));
  }, [selectedServiceData]);



  const endTimeCalculated = useMemo(() => {
    if (!startTime || !selectedServiceData) return '';
    const durationStr = (selectedServiceData.duration || '').toLowerCase();
    let minutesToAdd = 60;

    if (durationStr.includes('min')) {
      minutesToAdd = parseInt(durationStr) || 60;
    } else if (durationStr.includes('h')) {
      minutesToAdd = (parseInt(durationStr) || 1) * 60;
    }

    const [h, m] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + minutesToAdd, 0);
    
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }, [startTime, selectedServiceData]);

  const estimatedTotal = useMemo(() => {
    const pricePerUnit = selectedServiceData?.price ?? caregiver?.price ?? 0;
    if (!pricePerUnit) return 0;
    
    if (isShortService) {
      return pricePerUnit * petsCount;
    }

    if (totalDays === 0) return pricePerUnit * petsCount;
    return totalDays * pricePerUnit * petsCount;
  }, [selectedServiceData, caregiver, totalDays, isShortService, petsCount]);

  const selectedServiceType = useMemo(() => {
    return services.find(s => s.name === selectedService)?.type;
  }, [services, selectedService]);

  const availableDatesForService = useMemo(() => {
    if (!caregiver || !selectedService) return [];
    
    const serviceAvail = caregiver.availability?.find(a => 
      (selectedServiceType && a.service === selectedServiceType) || 
      (a.service === selectedService)
    );

    if (serviceAvail && Array.isArray(serviceAvail.availableDays)) {
      return serviceAvail.availableDays;
    }

    if (Array.isArray(caregiver.availableDays) && caregiver.availableDays.length > 0 && typeof caregiver.availableDays[0] === 'string') {
      return caregiver.availableDays as string[];
    }

    return [];
  }, [caregiver, selectedService, selectedServiceType]);

  const availableHoursForService = useMemo(() => {
    if (!caregiver || !selectedService) return [];
    const serviceAvail = caregiver.availability?.find(a => 
      (selectedServiceType && a.service === selectedServiceType) || 
      (a.service === selectedService)
    );
    return serviceAvail?.serviceHours || [];
  }, [caregiver, selectedService, selectedServiceType]);

  const availableDayLabels = useMemo(() => {
    if (availableDatesForService.length > 0) {
      return [`${availableDatesForService.length} datas disponíveis`];
    }

    // Fallback to legacy availableDays (numbers 0-6)
    const rawDays =
      Array.isArray(caregiver?.availableDays) && caregiver.availableDays.length > 0 && typeof caregiver.availableDays[0] === 'number'
        ? [...caregiver.availableDays as unknown as number[]].sort((a, b) => a - b)
        : [0, 1, 2, 3, 4, 5, 6];

    return rawDays
      .filter((day) => day >= 0 && day <= 6)
      .map((day) => DAYS_OF_WEEK[day]);
  }, [caregiver?.availableDays, availableDatesForService]);

  const petTypeLabels = useMemo(() => {
    if (!Array.isArray(caregiver?.petTypes) || caregiver.petTypes.length === 0) {
      return ['Todos os tipos de pet'];
    }

    return caregiver.petTypes.map((petType) => PET_TYPE_LABELS[petType] || petType);
  }, [caregiver?.petTypes]);

  const reviewableBookings = useMemo(() => {
    return myBookings.filter((booking) => {
      const bookingCaregiverId = normalizeId(booking.caregiverId);
      return (
        bookingCaregiverId === caregiverId &&
        booking.status === 'completed' &&
        !booking.review?.rating
      );
    });
  }, [myBookings, caregiverId]);

  const reviewedBookings = useMemo(() => {
    return myBookings.filter((booking) => {
      const bookingCaregiverId = normalizeId(booking.caregiverId);
      return (
        bookingCaregiverId === caregiverId &&
        booking.status === 'completed' &&
        booking.review?.rating
      );
    });
  }, [myBookings, caregiverId]);

  useEffect(() => {
    if (!selectedService && services.length > 0) {
      setSelectedService(services[0].name);
    }
  }, [services, selectedService]);

  useEffect(() => {
    if (!selectedBookingId && reviewableBookings.length > 0) {
      setSelectedBookingId(reviewableBookings[0]._id);
    }
  }, [reviewableBookings, selectedBookingId]);

  useEffect(() => {
    if (caregiver?.petsQuantity && caregiver.petsQuantity.length > 0) {
      setSelectedPetType(caregiver.petsQuantity[0].type);
    }
  }, [caregiver]);

  const fetchMyBookings = async () => {
    if (!isAuthenticated()) {
      setMyBookings([]);
      return;
    }

    try {
      const bookings = await apiGetMyBookings();
      setMyBookings(bookings || []);
    } catch {
      setMyBookings([]);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadPage = async () => {
      setIsLoading(true);
      setPageError('');

      try {
        const [caregiverData] = await Promise.all([apiGetCaregiver(caregiverId), fetchMyBookings()]);

        if (!isMounted) return;

        if (!caregiverData || caregiverData.role !== 'caregiver') {
          setPageError('Cuidador não encontrado.');
          setCaregiver(null);
          return;
        }

        setCaregiver(caregiverData);
      } catch {
        if (isMounted) {
          setPageError('Não foi possível carregar as informações do cuidador.');
          setCaregiver(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (caregiverId) {
      loadPage();
    }

    return () => {
      isMounted = false;
    };
  }, [caregiverId]);

  const refreshCaregiver = async () => {
    const updatedCaregiver = await apiGetCaregiver(caregiverId);
    setCaregiver(updatedCaregiver);
  };

  const handleCreateBooking = async () => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (!isTutor) {
      setBookingError('Somente tutores podem criar reservas.');
      return;
    }

    if (isOwnProfile) {
      setBookingError('Você não pode reservar seu próprio perfil.');
      return;
    }

    if (!selectedServiceData) {
      setBookingError('Selecione um serviço.');
      return;
    }

    if (!startDate || !endDate) {
      setBookingError('Selecione as datas da reserva.');
      return;
    }

    if (totalDays <= 0) {
      setBookingError('A data final deve ser posterior à data inicial.');
      return;
    }

    // Availability validation
    if (availableDatesForService.length > 0) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const missingDays = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (!availableDatesForService.includes(dateStr)) {
          missingDays.push(d.toLocaleDateString('pt-BR'));
        }
      }

      if (missingDays.length > 0) {
        setBookingError(`O cuidador não está disponível em: ${missingDays.slice(0, 3).map(d => d).join(', ')}${missingDays.length > 3 ? '...' : ''}`);
        return;
      }
    }

    setIsBooking(true);
    setBookingError('');
    setBookingSuccess('');

    try {
      await apiCreateBooking({
        caregiverId,
        startDate,
        endDate: isShortService ? startDate : endDate,
        serviceType: selectedServiceData.name,
        petsCount,
        petType: selectedPetType,
        notes: notes.trim() || undefined,
        startTime: isShortService ? startTime : undefined,
        endTime: isShortService ? endTimeCalculated : undefined,
      } as any);

      setBookingSuccess('Reserva criada com sucesso. Aguarde a confirmação do cuidador.');
      setNotes('');
      await fetchMyBookings();
    } catch (err: any) {
      setBookingError(err?.message || 'Não foi possível criar a reserva.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedBookingId) {
      setReviewError('Selecione uma reserva concluída para avaliar.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      await apiSubmitBookingReview(selectedBookingId, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });

      setReviewSuccess('Avaliação enviada com sucesso. Obrigado pelo feedback.');
      setReviewComment('');
      setReviewRating(5);

      await Promise.all([fetchMyBookings(), refreshCaregiver()]);
    } catch (err: any) {
      setReviewError(err?.message || 'Não foi possível enviar a avaliação.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

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

  if (!caregiver || pageError) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Ops, não encontramos este cuidador</h1>
          <p className="text-gray-400 mb-6">{pageError || 'Tente novamente em alguns instantes.'}</p>
          <Link
            href="/cuidadores"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF6B35] text-white font-semibold hover:bg-[#E55A2B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para cuidadores
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Link
          href="/cuidadores"
          className="inline-flex items-center gap-2 text-[#FF6B35] font-semibold hover:text-[#E55A2B] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para busca
        </Link>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <div className="relative h-60 bg-black/50">
              {caregiver.avatar ? (
                <Image
                  src={caregiver.avatar}
                  alt={caregiver.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-6xl font-bold text-gray-500 uppercase">
                    {caregiver.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-white">{caregiver.name}</h1>
                  <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {caregiver.location || 'Localização não informada'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#06A77D]/15 text-[#06A77D] text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verificado
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-semibold">{(caregiver.rating ?? 0).toFixed(1)}</span>
                <span className="text-gray-400">
                  ({caregiver.reviewsCount ?? 0} avaliação{(caregiver.reviewsCount ?? 0) === 1 ? '' : 'ões'})
                </span>
              </div>

              <p className="mt-4 text-sm text-gray-300 leading-relaxed">
                {caregiver.bio || 'Este cuidador ainda não adicionou uma biografia.'}
              </p>

              <div className="mt-6 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Pets atendidos</p>
                  <div className="flex flex-wrap gap-2">
                    {petTypeLabels.map((label) => (
                      <span
                        key={label}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 text-gray-200 border border-white/10"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Disponibilidade</p>
                  <div className="flex flex-wrap gap-2">
                    {availableDayLabels.map((day) => (
                      <span
                        key={day}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 text-gray-200 border border-white/10"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>

                {caregiver.specialties && caregiver.specialties.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Especialidades</p>
                    <div className="flex flex-wrap gap-2">
                      {caregiver.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-1">Nova reserva</h2>
            <p className="text-sm text-gray-400 mb-6">
              Escolha o serviço que o cuidador oferece e monte a reserva com base nesses dados.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Serviço</label>
                <select
                  value={selectedService}
                  onChange={(event) => setSelectedService(event.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50"
                >
                  {services.map((service) => (
                    <option key={service.name} value={service.name} className="bg-[#111]">
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Tipo de pet</label>
                <select
                  value={selectedPetType}
                  onChange={(event) => {
                    setSelectedPetType(event.target.value);
                    setPetsCount(1);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50"
                >
                  {caregiver.petsQuantity && caregiver.petsQuantity.length > 0 ? (
                    caregiver.petsQuantity.map((p) => (
                      <option key={p.type} value={p.type} className="bg-[#111]">
                        {PET_TYPE_LABELS[p.type] || p.type}
                      </option>
                    ))
                  ) : (
                    <option value="" className="bg-[#111]">Nenhum pet aceito</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Quantidade
                  <span className="ml-1 text-[10px] text-gray-500 font-normal">
                    (Max: {caregiver.petsQuantity?.find(p => p.type === selectedPetType)?.quantity || 1})
                  </span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={caregiver.petsQuantity?.find(p => p.type === selectedPetType)?.quantity || 1}
                  value={petsCount}
                  onChange={(event) => {
                    const max = caregiver.petsQuantity?.find(p => p.type === selectedPetType)?.quantity || 1;
                    const val = Math.min(max, Math.max(1, Number(event.target.value) || 1));
                    setPetsCount(val);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  {isShortService ? 'Data do serviço' : 'Data de início'}
                </label>
                {availableDatesForService.length > 0 ? (
                  <select
                    value={startDate}
                    onChange={(event) => {
                      setStartDate(event.target.value);
                      if (isShortService) setEndDate(event.target.value);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50"
                  >
                    <option value="" className="bg-[#111]">Selecione uma data</option>
                    {availableDatesForService
                      .filter(d => d && d >= today)
                      .sort()
                      .map(dateStr => (
                        <option key={dateStr} value={dateStr} className="bg-[#111]">
                          {(() => {
                            const d = new Date(dateStr + 'T12:00:00');
                            return isNaN(d.getTime()) ? 'Data inválida' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'short' });
                          })()}
                        </option>
                      ))
                    }
                  </select>
                ) : (
                  <input
                    type="date"
                    value={startDate}
                    min={today}
                    onChange={(event) => {
                      setStartDate(event.target.value);
                      if (isShortService) setEndDate(event.target.value);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50"
                  />
                )}
              </div>

              {!isShortService && (
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Data de término</label>
                  {availableDatesForService.length > 0 ? (
                    <select
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50"
                    >
                      <option value="" className="bg-[#111]">Selecione uma data</option>
                      {availableDatesForService
                        .filter(d => d && d >= (startDate || today))
                        .sort()
                        .map(dateStr => (
                          <option key={dateStr} value={dateStr} className="bg-[#111]">
                            {(() => {
                              const d = new Date(dateStr + 'T12:00:00');
                              return isNaN(d.getTime()) ? 'Data inválida' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'short' });
                            })()}
                          </option>
                        ))
                      }
                    </select>
                  ) : (
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || today}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50"
                    />
                  )}
                </div>
              )}

              {isShortService && (
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Horário de início</label>
                  <select
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50"
                  >
                    <option value="" className="bg-[#111]">Selecione um horário</option>
                    {availableHoursForService.map(hour => (
                      <option key={hour} value={hour} className="bg-[#111]">{hour}</option>
                    ))}
                    {availableHoursForService.length === 0 && (
                      <option value="08:00" className="bg-[#111]">08:00 (Padrão)</option>
                    )}
                  </select>
                </div>
              )}
            </div>

            {isShortService && startTime && (
              <div className="mb-5 p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                <span className="text-sm text-gray-400">Horário estimado de término:</span>
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock3 className="w-4 h-4 text-[#FF6B35]" />
                  {endTimeCalculated}
                </span>
              </div>
            )}

            {availableDatesForService.length > 0 && (
              <div className="mb-5 p-4 bg-[#FF6B35]/5 border border-[#FF6B35]/20 rounded-2xl">
                <p className="text-xs font-bold text-[#FF6B35] uppercase mb-2 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> Info: Apenas datas com disponibilidade confirmada aparecem acima.
                </p>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-semibold text-white mb-2">Observações (opcional)</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Conte detalhes importantes sobre seu pet, rotina ou cuidados especiais."
                className="w-full min-h-[100px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50 resize-y"
              />
            </div>

            <div className="bg-black/35 border border-white/10 rounded-2xl p-4 mb-5">
              <h3 className="text-sm font-bold text-white mb-3">Resumo estimado</h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-2">
                    <PawPrint className="w-4 h-4 text-[#FF6B35]" />
                    Serviço selecionado
                  </span>
                  <span className="font-semibold text-white">{selectedServiceData?.name || '-'}</span>
                </p>
                <p className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-2">
                    <Clock3 className="w-4 h-4 text-[#FF6B35]" />
                    Duração do serviço
                  </span>
                  <span className="font-semibold text-white">{selectedServiceData?.duration || '-'}</span>
                </p>
                <p className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#FF6B35]" />
                    Total de dias
                  </span>
                  <span className="font-semibold text-white">{totalDays || 1}</span>
                </p>
                <div className="h-px bg-white/10 my-2" />
                <p className="flex items-center justify-between">
                  <span className="text-gray-300">Estimativa total</span>
                  <span className="text-lg font-bold text-[#FF6B35]">{formatCurrency(estimatedTotal)}</span>
                </p>
              </div>
            </div>

            {bookingError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                {bookingError}
              </div>
            )}

            {bookingSuccess && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-[#06A77D]/10 border border-[#06A77D]/30 text-[#4DE2B1] text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {bookingSuccess}
              </div>
            )}

            <button
              onClick={handleCreateBooking}
              disabled={isBooking || !selectedServiceData}
              className="w-full py-3 rounded-xl bg-[#FF6B35] text-white font-semibold hover:bg-[#E55A2B] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isBooking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando reserva...
                </>
              ) : (
                'Confirmar reserva'
              )}
            </button>

            {!isTutor && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                Apenas contas de tutor podem criar reservas.
              </p>
            )}
          </section>
        </div>

        <section className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">Serviços e preços</h2>
          <p className="text-sm text-gray-400 mb-6">
            Valores definidos pelo cuidador e usados no cálculo estimado da reserva.
          </p>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {services.map((service) => (
              <article
                key={service.name}
                className="rounded-2xl border border-white/10 bg-black/30 p-4 hover:border-[#FF6B35]/40 transition-colors"
              >
                <p className="text-sm font-bold text-white">{service.name}</p>
                <p className="text-[#FF6B35] text-xl font-bold mt-1">{formatCurrency(service.price)}</p>
                <p className="text-xs text-gray-400 mt-2">{service.duration}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white mb-1">Avaliação pós-serviço</h2>
          <p className="text-sm text-gray-400 mb-6">
            A avaliação fica disponível somente depois que a reserva for concluída.
          </p>

          {!isAuthenticated() && (
            <div className="p-4 rounded-xl border border-white/10 bg-black/30 text-sm text-gray-300">
              Faça login como tutor para avaliar reservas concluídas.
            </div>
          )}

          {isAuthenticated() && !isTutor && (
            <div className="p-4 rounded-xl border border-white/10 bg-black/30 text-sm text-gray-300">
              A avaliação está disponível apenas para tutores que concluíram um serviço com este cuidador.
            </div>
          )}

          {isAuthenticated() && isTutor && (
            <div className="space-y-4">
              {reviewableBookings.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Reserva concluída para avaliar
                    </label>
                    <select
                      value={selectedBookingId}
                      onChange={(event) => setSelectedBookingId(event.target.value)}
                      className="w-full md:w-auto min-w-[320px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50"
                    >
                      {reviewableBookings.map((booking) => (
                        <option key={booking._id} value={booking._id} className="bg-[#111]">
                          {booking.serviceType} - concluída em{' '}
                          {new Date(booking.endDate).toLocaleDateString('pt-BR')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Nota</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() => setReviewRating(value)}
                          className="p-1"
                          type="button"
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              value <= reviewRating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Comentário (opcional)
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      placeholder="Como foi a experiência com este cuidador?"
                      className="w-full min-h-[100px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50 resize-y"
                    />
                  </div>

                  {reviewError && (
                    <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                      {reviewError}
                    </div>
                  )}

                  {reviewSuccess && (
                    <div className="px-4 py-3 rounded-xl bg-[#06A77D]/10 border border-[#06A77D]/30 text-[#4DE2B1] text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {reviewSuccess}
                    </div>
                  )}

                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#06A77D] text-white font-semibold hover:bg-[#05936e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReview ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando avaliação...
                      </>
                    ) : (
                      <>
                        <MessageSquareText className="w-4 h-4" />
                        Enviar avaliação
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-white/10 bg-black/30 text-sm text-gray-300">
                  Você ainda não tem reservas concluídas com este cuidador para avaliar.
                </div>
              )}

              {reviewedBookings.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-sm font-bold text-white mb-3">Avaliações já enviadas por você</h3>
                  <div className="space-y-3">
                    {reviewedBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="rounded-xl bg-black/30 border border-white/10 p-4 text-sm"
                      >
                        <p className="text-white font-semibold mb-1">{booking.serviceType}</p>
                        <p className="text-gray-400 mb-2">
                          Concluída em {new Date(booking.endDate).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-yellow-400 font-semibold mb-1">
                          Nota: {booking.review.rating}/5
                        </p>
                        {booking.review.comment && (
                          <p className="text-gray-300">{booking.review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
