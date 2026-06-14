'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CaregiverCard from '@/components/CaregiverCard';
import Footer from '@/components/Footer';
import BecomeCaregiverModal from '@/components/BecomeCaregiverModal';
import { apiGetCaregivers, apiGetCaregiversFiltered, apiGetProfile, getUser } from '@/utils/api';
import FilterCards from '@/components/FilterBar';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('all');
  const [searchMode, setSearchMode] = useState<'all' | 'near'>('all');
  const [nearLocation, setNearLocation] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [isBecomeCaregiverModalOpen, setIsBecomeCaregiverModalOpen] = useState(false);

  const [dbCaregivers, setDbCaregivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const effectiveLocation = searchMode === 'near' ? (nearLocation || userLocation) : '';

  // Redirect caregivers to profile and optionally prefill location for tutors
  useEffect(() => {
    const user = getUser();
    if (user && user.role === 'caregiver') {
      router.push('/dashboard');
      return;
    }

    if (user?.role === 'tutor') {
      apiGetProfile()
        .then((profile) => {
          if (profile?.location) {
            setUserLocation(profile.location);
            if (searchMode === 'near' && !nearLocation) {
              setNearLocation(profile.location);
            }
          }
        })
        .catch((err) => {
          console.error('Erro ao buscar perfil do usuário:', err);
        });
    }
  }, [nearLocation, searchMode, router]);

  // Fetch from backend whenever filters change
  useEffect(() => {
    let active = true;
    const fetchCaregivers = async () => {
      setIsLoading(true);
      try {
        const data = await apiGetCaregiversFiltered({
          type: selectedType,
          location: effectiveLocation,
        });
        if (active) {
          setDbCaregivers(data || []);
        }
      } catch (err) {
        console.error('Erro ao buscar cuidadores:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchCaregivers();
    return () => { active = false; };
  }, [selectedType, effectiveLocation]);

  return (
    <>
      <Navbar
        onAuthClick={() => alert('Em breve: Sistema de login')}
        onBeCaregiverClick={() => setIsBecomeCaregiverModalOpen(true)}
      />

      <main>
        <Hero 
          onSearch={(value) => {
            setSearchMode('near');
            setNearLocation(value);
          }}
          onBecomeCaregiverClick={() => setIsBecomeCaregiverModalOpen(true)}
        />

        {/* Filter Guide Section */}
        <section className="relative py-16 md:py-20 border-b border-white/10 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF6B35]/5 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Escolha o tipo de pet ideal
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed font-medium">
              Cada pet tem necessidades únicas. Filtre por tipo para encontrar cuidadores especializados que entendem exatamente o que seu <span className="font-bold text-white">cão, gato, pássaro ou outro pet</span> precisa. Nossos profissionais estão preparados para dar a melhor experiência.
            </p>
          </div>
        </section>

        {/* Caregivers Section - Main Content */}
        <div id="caregivers-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-8">

            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-5 bg-[#A23B72] rounded-full shadow-[0_0_8px_rgba(162,59,114,0.8)]"></div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Filtrar cuidadores por localização</p>
            </div>

            <div className="flex flex-col items-center text-center gap-8">
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto justify-center">
                <button
                  type="button"
                  onClick={() => setSearchMode('all')}
                  className={`px-8 sm:px-10 py-4 sm:py-5 rounded-xl text-base sm:text-lg font-semibold transition transform hover:scale-105 active:scale-95 ${searchMode === 'all' ? 'bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/40' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                >
                  Gerais
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchMode('near');
                    if (!nearLocation && userLocation) {
                      setNearLocation(userLocation);
                    }
                  }}
                  className={`px-8 sm:px-10 py-4 sm:py-5 rounded-xl text-base sm:text-lg font-semibold transition transform hover:scale-105 active:scale-95 ${searchMode === 'near' ? 'bg-[#06A77D] text-white shadow-lg shadow-[#06A77D]/40' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                >
                  Perto de mim
                </button>
              </div>

              {/* Info Text */}
              {searchMode === 'near' && (
                <p className="text-sm sm:text-base text-gray-400 max-w-md">
                  {effectiveLocation
                    ? `Filtrando por ${effectiveLocation}`
                    : userLocation
                      ? `Sua cidade é ${userLocation}. Digite um local na busca para trocar.`
                      : 'Faça login e informe sua localização no perfil para buscar cuidadores perto de você.'}
                </p>
              )}
            </div>
          </div>

          <FilterCards
            selectedType={selectedType}
            onTypeChange={setSelectedType}
          />

          <section className="py-20 md:py-24 border-b border-white/10 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="mb-14">
                <div className="inline-flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-[#06A77D] rounded-full shadow-[0_0_10px_rgba(6,167,125,0.8)]"></div>
                  <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Profissionais</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {effectiveLocation ? 'Cuidadores perto de você' : 'Cuidadores gerais'}
                </h2>
                <p className="text-lg text-gray-400 font-medium">
                  {isLoading
                    ? 'Buscando cuidadores...'
                    : dbCaregivers.length === 1
                      ? `1 profissional encontrado${effectiveLocation ? ` em ${effectiveLocation}` : ''}`
                      : `${dbCaregivers.length} profissionais encontrados${effectiveLocation ? ` em ${effectiveLocation}` : ''}`}
                </p>
              </div>

              {isLoading ? (
                <div className="py-20 flex justify-center">
                  <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : dbCaregivers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dbCaregivers.map((caregiver) => (
                    <div key={caregiver._id || caregiver.id}>
                      <CaregiverCard caregiver={{...caregiver, id: caregiver._id || caregiver.id}} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                  <p className="text-gray-400 font-medium mb-6 text-lg">Nenhum cuidador com esses filtros</p>
                  <button
                    onClick={() => { setSelectedType('all'); setSearchMode('all'); setNearLocation(''); }}
                    className="px-6 py-3 bg-[#FF6B35] text-white font-semibold rounded-lg hover:bg-[#E55A2B] active:scale-95 transition-all shadow-md"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <BecomeCaregiverModal
        isOpen={isBecomeCaregiverModalOpen}
        onClose={() => setIsBecomeCaregiverModalOpen(false)}
      />
    </>
  );
}
