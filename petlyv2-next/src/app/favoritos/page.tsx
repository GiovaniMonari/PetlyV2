'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CaregiverCard from '@/components/CaregiverCard';
import BecomeCaregiverModal from '@/components/BecomeCaregiverModal';
import { apiGetFavoriteCaregivers, getUser, isAuthenticated } from '@/utils/api';
import { Heart, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const user = getUser();
    if (user?.role !== 'tutor') {
      router.push('/');
      return;
    }

    const fetchFavorites = async () => {
      setIsLoading(true);
      try {
        const data = await apiGetFavoriteCaregivers();
        setFavorites(data || []);
      } catch (err) {
        console.error('Erro ao buscar favoritos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [router]);

  return (
    <>
      <Navbar
        onBeCaregiverClick={() => setIsModalOpen(true)}
      />

      <main className="min-h-screen bg-transparent">
        {/* Page header */}
        <div className="border-b border-white/10 relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#FF6B35]/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/cuidadores" className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-4">
                  Meus Favoritos
                </h1>
                <p className="text-lg text-gray-400">
                  {isLoading ? 'Carregando seus favoritos...' : `${favorites.length} cuidador${favorites.length !== 1 ? 'es' : ''} salvo${favorites.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : favorites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((caregiver) => (
                <div key={caregiver._id || caregiver.id}>
                  <CaregiverCard caregiver={{...caregiver, id: caregiver._id || caregiver.id}} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center text-center">
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm p-8 rounded-2xl mb-6 shadow-xl">
                <Heart className="w-12 h-12 text-gray-500 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Sua lista está vazia
              </h3>
              <p className="text-gray-400 max-w-md font-medium mb-6">
                Você ainda não favoritou nenhum cuidador. Explore os perfis e salve os seus preferidos!
              </p>
              <Link
                href="/cuidadores"
                className="px-6 py-2 bg-[#FF6B35] text-white font-semibold rounded-lg hover:bg-[#E55A2B] transition-all"
              >
                Explorar Cuidadores
              </Link>
            </div>
          )}
        </div> 
      </main>

      <Footer />
      <BecomeCaregiverModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
