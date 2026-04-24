'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CaregiverCard from '@/components/CaregiverCard';
import BecomeCaregiverModal from '@/components/BecomeCaregiverModal';
import { caregivers } from '@/data/caregivers';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  Dog,
  Cat,
  Bird,
  MoreHorizontal,
  MapPin,
  X,
  ChevronDown,
  Rat,
} from 'lucide-react';

const PET_TYPES = [
  { id: 'all', label: 'Todos', icon: MoreHorizontal },
  { id: 'dog', label: 'Cães', icon: Dog },
  { id: 'cat', label: 'Gatos', icon: Cat },
  { id: 'bird', label: 'Pássaros', icon: Bird },
  { id: 'other', label: 'Outros', icon: Rat },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'rating', label: 'Melhor avaliação' },
];

function CuidadoresPageContent() {
  const searchParams = useSearchParams();
  const initialLocation = searchParams.get('location') || '';

  const [selectedType, setSelectedType] = useState('all');
  const [locationFilter, setLocationFilter] = useState(initialLocation);
  const [sortBy, setSortBy] = useState('relevance');

  useEffect(() => {
    const loc = searchParams.get('location');
    if (loc !== null) {
      setLocationFilter(loc);
    }
  }, [searchParams]);
  const [priceMax, setPriceMax] = useState(200);
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalizeLoc = (loc: string) => 
      loc.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

    let list = caregivers.filter((c) => {
      const matchesType = selectedType === 'all' || c.type === selectedType;
      
      const normCLoc = normalizeLoc(c.location);
      const normFilter = normalizeLoc(locationFilter);
      const matchesLocation = !normFilter || normCLoc.includes(normFilter) || normFilter.includes(normCLoc);

      const matchesPrice = c.price <= priceMax;
      return matchesType && matchesLocation && matchesPrice;
    });

    if (sortBy === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);

    return list;
  }, [selectedType, locationFilter, sortBy, priceMax]);

  const hasActiveFilters =
    selectedType !== 'all' || locationFilter !== '' || priceMax < 200;

  const clearFilters = () => {
    setSelectedType('all');
    setLocationFilter('');
    setPriceMax(200);
  };

  return (
    <>
      <Navbar
        onAuthClick={() => alert('Em breve: Sistema de login')}
        onBeCaregiverClick={() => setIsModalOpen(true)}
      />

      <main className="min-h-screen bg-transparent">
        {/* Page header */}
        <div className="border-b border-white/10 relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#2E86AB]/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Encontre seu cuidador
              </h1>
              <p className="text-lg text-gray-400">
                {filtered.length} profissional{filtered.length !== 1 ? 'ais' : ''} disponível{filtered.length !== 1 ? 'eis' : ''}
              </p>
            </div>

            {/* Search bar and Filters */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Buscar por cidade..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition-all backdrop-blur-sm shadow-sm"
                />
                {locationFilter && (
                  <button
                    onClick={() => setLocationFilter('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-white" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border transition-all ${
                  showFilters || hasActiveFilters
                    ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-[0_0_15px_rgba(255,107,53,0.3)]'
                    : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30 hover:bg-white/10 backdrop-blur-sm'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
              </button>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-sm font-semibold text-gray-300 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none cursor-pointer transition-all shadow-sm"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Expandable filter panel */}
        {showFilters && (
          <div className="bg-black/30 border-b border-white/10 backdrop-blur-md relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6 items-start lg:items-end">
              {/* Pet type */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Tipo de pet
                </p>
                <div className="flex gap-2 flex-wrap">
                  {PET_TYPES.map((type) => {
                    const Icon = type.icon;
                    const active = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border transition-all ${
                          active
                            ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-[0_0_15px_rgba(255,107,53,0.3)]'
                            : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price range */}
              <div className="flex-1 min-w-48">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Preço máximo: <span className="text-[#FF6B35]">R$ {priceMax}/dia</span>
                </p>
                <input
                  type="range"
                  min={20}
                  max={200}
                  step={5}
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#FF6B35]"
                />
                <div className="flex justify-between text-xs font-semibold text-gray-500 mt-2">
                  <span>R$ 20</span>
                  <span>R$ 200</span>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-sm text-white bg-[#A23B72] hover:bg-[#952a65] font-semibold px-5 py-2 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Cards grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((caregiver) => (
                <div key={caregiver.id}>
                  <CaregiverCard caregiver={caregiver} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center text-center">
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm p-8 rounded-2xl mb-6 shadow-xl">
                <Search className="w-12 h-12 text-gray-500 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Nenhum cuidador encontrado
              </h3>
              <p className="text-gray-400 max-w-md font-medium mb-6">
                Não encontramos cuidadores que correspondem aos seus filtros. Tente ajustar os critérios de busca.
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-[#FF6B35] text-white font-semibold rounded-lg hover:bg-[#E55A2B] transition-all"
              >
                Limpar filtros
              </button>
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

export default function CuidadoresPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">Carregando...</div>}>
      <CuidadoresPageContent />
    </Suspense>
  );
}