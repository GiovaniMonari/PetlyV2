'use client';

import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import FilterBar from '@/components/FilterBar';
import CaregiverCard from '@/components/CaregiverCard';
import Footer from '@/components/Footer';
import BecomeCaregiverModal from '@/components/BecomeCaregiverModal';
import HowItWorks from '@/components/HowItWorks';
import { caregivers } from '@/data/caregivers';
import { Search, Heart, ShieldCheck, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import FilterCards from '@/components/FilterBar';

export default function HomePage() {
  const [selectedType, setSelectedType] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [isBecomeCaregiverModalOpen, setIsBecomeCaregiverModalOpen] = useState(false);

  const filteredCaregivers = useMemo(() => {
    return caregivers.filter(caregiver => {
      const matchesType = selectedType === 'all' || caregiver.type === selectedType;
      const matchesLocation = caregiver.location.toLowerCase().includes(locationFilter.toLowerCase());
      return matchesType && matchesLocation;
    });
  }, [selectedType, locationFilter]);

  const handleSearchClick = () => {
    const section = document.getElementById('caregivers-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Navbar
        onSearchClick={handleSearchClick}
        onAuthClick={() => alert('Em breve: Sistema de login')}
        onBeCaregiverClick={() => setIsBecomeCaregiverModalOpen(true)}
      />

      <main>
        <Hero onSearch={setLocationFilter} />

        <HowItWorks />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Encontre o cuidador perfeito para seu pet por categoria
          </h3>
        </div>
      
        <div id="caregivers-section">
          <FilterCards
            selectedType={selectedType}
            onTypeChange={setSelectedType}
          />

          <section className="py-20 bg-gray-50/50 min-h-[600px]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                    Cuidadores encontrados
                  </h2>
                  <p className="text-gray-500 font-medium">
                    {filteredCaregivers.length} cuidadores disponíveis na sua região
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm text-sm font-bold text-gray-600">
                  <Search className="w-4 h-4 text-indigo-400" />
                  Ordenado por: Relevância
                </div>
              </div>

              {filteredCaregivers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCaregivers.map(caregiver => (
                    <CaregiverCard key={caregiver.id} caregiver={caregiver} />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="bg-white p-6 rounded-full shadow-lg mb-6">
                    <Search className="w-12 h-12 text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum cuidador encontrado</h3>
                  <p className="text-gray-500 max-w-md">
                    Não encontramos cuidadores com esses filtros. Tente remover alguns filtros ou buscar em outra cidade.
                  </p>
                  <button
                    onClick={() => { setSelectedType('all'); setLocationFilter(''); }}
                    className="mt-8 text-indigo-600 font-bold hover:underline"
                  >
                    Limpar todos os filtros
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <section className="py-24 bg-indigo-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 border-8 border-white rounded-full" />
            <div className="absolute bottom-10 right-10 w-96 h-96 border-8 border-white rounded-full" />
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
              Torne-se um cuidador e transforme sua paixão em renda.
            </h2>
            <p className="text-xl text-indigo-100 mb-12 font-medium">
              Milhares de tutores estão buscando por cuidadores carinhosos como você agora mesmo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setIsBecomeCaregiverModalOpen(true)}
                className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-lg hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/20"
              >
                Cadastrar agora gratuitamente
              </button>
              <button className="bg-indigo-500/50 backdrop-blur-sm text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-indigo-500/70 transition-all border border-indigo-400">
                Saiba como funciona
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BecomeCaregiverModal
        isOpen={isBecomeCaregiverModalOpen}
        onClose={() => setIsBecomeCaregiverModalOpen(false)}
      />
    </>
  );
}
