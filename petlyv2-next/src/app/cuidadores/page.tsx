'use client';

import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CaregiverCard from '@/components/CaregiverCard';
import BecomeCaregiverModal from '@/components/BecomeCaregiverModal';
import { caregivers } from '@/data/caregivers';
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

export default function CuidadoresPage() {
  const [selectedType, setSelectedType] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [priceMax, setPriceMax] = useState(200);
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = caregivers.filter((c) => {
      const matchesType = selectedType === 'all' || c.type === selectedType;
      const matchesLocation = c.location
        .toLowerCase()
        .includes(locationFilter.toLowerCase());
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

      <main className="min-h-screen bg-white">
        {/* Page header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Encontre seu cuidador
              </h1>
              <p className="text-lg text-gray-600">
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
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35] outline-none transition-all"
                />
                {locationFilter && (
                  <button
                    onClick={() => setLocationFilter('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border transition-all ${
                  showFilters || hasActiveFilters
                    ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
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
                  className="appearance-none pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 focus:ring-2 focus:ring-[#FF6B35] outline-none cursor-pointer transition-all"
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
          <div className="bg-white border-b border-gray-200">
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
                            ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
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
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#FF6B35]"
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
              <div className="bg-gray-100 p-8 rounded-2xl mb-6">
                <Search className="w-12 h-12 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Nenhum cuidador encontrado
              </h3>
              <p className="text-gray-600 max-w-md font-medium mb-6">
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

        {/* Bottom CTA */}
        <div className="bg-[#FF6B35] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Você cuida de pets com carinho?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Cadastre-se como cuidador e comece a ganhar cuidando de pets.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-[#FF6B35] px-8 py-3 rounded-lg font-bold hover:bg-gray-50 transition-all"
            >
              Ser um Cuidador
            </button>
          </div>
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