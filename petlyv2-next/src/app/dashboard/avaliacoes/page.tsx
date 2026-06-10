'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Calendar, Loader2, AlertCircle, TrendingUp, Award, MessageSquare } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardSidebar from '@/components/DashboardSidebar';
import {
  apiGetProfile,
  apiGetCaregiverReviews,
  isAuthenticated,
  setUser as setLocalUser,
} from '@/utils/api';

interface Review {
  rating: number;
  comment?: string;
  createdAt?: string;
  tutorName?: string;
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/10'}
        />
      ))}
    </div>
  );
}

function formatDate(dateStr: string | Date): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return 'Data inválida'; }
}

function RatingBar({ rating, count, total }: { rating: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 w-16 justify-end">
        <span className="text-xs font-semibold text-gray-400">{rating}</span>
        <Star size={10} className="fill-yellow-400 text-yellow-400" />
      </div>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
    </div>
  );
}

export default function AvaliacoesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0 });

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const profileData = await apiGetProfile();
        if (profileData.role !== 'caregiver') { router.push('/'); return; }
        setProfile(profileData);

        const caregiverId = profileData._id || profileData.id;
        if (!caregiverId) { setError('ID do cuidador não encontrado'); setIsLoading(false); return; }

        const reviewsData = await apiGetCaregiverReviews(caregiverId);
        const reviewsList: Review[] = Array.isArray(reviewsData) ? reviewsData : [];
        setReviews(reviewsList);

        if (reviewsList.length > 0) {
          const avg = reviewsList.reduce((sum, r) => sum + r.rating, 0) / reviewsList.length;
          setStats({ totalReviews: reviewsList.length, averageRating: Math.round(avg * 10) / 10 });
        }
      } catch { setError('Erro ao carregar avaliações. Tente novamente.'); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, [router]);

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

  // Rating breakdown
  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: reviews.filter(rv => rv.rating === r).length,
  }));

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <DashboardSidebar profile={profile} onProfileUpdate={(u) => { setProfile(u); setLocalUser(u); }} />

          <div className="flex-1 min-w-0 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Avaliações Recebidas</h1>
              <p className="text-gray-500 text-sm">O que os tutores estão dizendo sobre o seu atendimento.</p>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-2xl text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            {/* Stats */}
            {reviews.length > 0 && (
              <div className="grid sm:grid-cols-3 gap-4">
                {/* Big average */}
                <div className="sm:col-span-1 relative bg-gradient-to-br from-[#1a1004] to-[#0a0a0a] border border-yellow-500/20 rounded-3xl p-6 overflow-hidden text-center">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                  <div className="relative">
                    <Award className="w-7 h-7 text-yellow-400 mx-auto mb-3" />
                    <div className="text-5xl font-bold text-white mb-1">{stats.averageRating}</div>
                    <div className="flex justify-center mb-2">
                      <StarRating rating={Math.round(stats.averageRating)} size={18} />
                    </div>
                    <p className="text-xs text-gray-500">de 5.0 possível</p>
                  </div>
                </div>

                {/* Total + breakdown */}
                <div className="sm:col-span-2 bg-white/4 border border-white/8 rounded-3xl p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-[#FF6B35]" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{stats.totalReviews}</div>
                      <p className="text-xs text-gray-500">avaliação{stats.totalReviews !== 1 ? 'ões' : ''} no total</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {ratingCounts.map(({ rating, count }) => (
                      <RatingBar key={rating} rating={rating} count={count} total={stats.totalReviews} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews list */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Todas as avaliações</h2>
                {reviews.map((review, index) => (
                  <div
                    key={index}
                    className="bg-white/4 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-3xl p-6 transition-all duration-200 space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6B35]/20 to-[#A23B72]/20 border border-white/10 flex items-center justify-center text-white font-bold text-sm uppercase">
                          {review.tutorName ? review.tutorName.charAt(0) : 'T'}
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm">{review.tutorName || 'Tutor'}</h4>
                          <span className="text-gray-500 text-xs">Tutor verificado</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-1">
                        <StarRating rating={review.rating} />
                        <span className="text-xs text-gray-500">{review.rating}/5</span>
                      </div>
                    </div>

                    {/* Comment */}
                    {review.comment ? (
                      <div className="flex gap-3">
                        <MessageSquare className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-300 text-sm leading-relaxed">"{review.comment}"</p>
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm italic pl-7">Sem comentário escrito.</p>
                    )}

                    {/* Date */}
                    {review.createdAt && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 pt-1 border-t border-white/5">
                        <Calendar size={12} />
                        <span>Avaliado em {formatDate(review.createdAt)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : !error ? (
              <div className="bg-white/4 border border-white/8 rounded-3xl p-14 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-3xl bg-yellow-500/8 border border-yellow-500/15 flex items-center justify-center mb-5">
                  <Star className="w-9 h-9 text-yellow-500/40" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Nenhuma avaliação ainda</h3>
                <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
                  As avaliações que os tutores deixarem após os serviços concluídos aparecerão aqui.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
