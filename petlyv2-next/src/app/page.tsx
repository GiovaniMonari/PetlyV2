'use client';

import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import FilterBar from '@/components/FilterBar';
import CaregiverCard from '@/components/CaregiverCard';
import Footer from '@/components/Footer';
import BecomeCaregiverModal from '@/components/BecomeCaregiverModal';
import { caregivers } from '@/data/caregivers';
import FilterCards from '@/components/FilterBar';

export default function HomePage() {
  const [selectedType, setSelectedType] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [isBecomeCaregiverModalOpen, setIsBecomeCaregiverModalOpen] = useState(false);

  const filteredCaregivers = useMemo(() => {
    const normalizeLoc = (loc: string) => 
      loc.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

    return caregivers.filter(caregiver => {
      const matchesType = selectedType === 'all' || caregiver.type === selectedType;
      
      const normCLoc = normalizeLoc(caregiver.location);
      const normFilter = normalizeLoc(locationFilter);
      const matchesLocation = !normFilter || normCLoc.includes(normFilter) || normFilter.includes(normCLoc);

      return matchesType && matchesLocation;
    });
  }, [selectedType, locationFilter]);

  return (
    <>
      <Navbar
        onAuthClick={() => alert('Em breve: Sistema de login')}
        onBeCaregiverClick={() => setIsBecomeCaregiverModalOpen(true)}
      />

      <main>
        <Hero 
          onSearch={setLocationFilter}
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
                  Cuidadores disponíveis
                </h2>
                <p className="text-lg text-gray-400 font-medium">{filteredCaregivers.length} profissional{filteredCaregivers.length !== 1 ? 'ais' : ''} encontrado{filteredCaregivers.length !== 1 ? 's' : ''}</p>
              </div>

              {filteredCaregivers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCaregivers.map((caregiver) => (
                    <div key={caregiver.id}>
                      <CaregiverCard caregiver={caregiver} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                  <p className="text-gray-400 font-medium mb-6 text-lg">Nenhum cuidador com esses filtros</p>
                  <button
                    onClick={() => { setSelectedType('all'); setLocationFilter(''); }}
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
