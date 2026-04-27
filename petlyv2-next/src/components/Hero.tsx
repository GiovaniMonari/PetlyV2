'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Heart, Shield, Zap, CalendarCheck, MessageSquareHeart, CreditCard, MapPin, Loader2 } from 'lucide-react';
import { searchLocation } from '@/utils/location';

const Hero = ({ onSearch, onBecomeCaregiverClick }: { onSearch?: (val: string) => void; onBecomeCaregiverClick?: () => void }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length >= 3) {
        setLoading(true);
        const results = await searchLocation(query);
        setSuggestions(results);
        setLoading(false);
      } else {
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    setShowSuggestions(false);
    if (onSearch) onSearch(searchTerm);
    if (searchTerm.trim()) {
      router.push(`/cuidadores?location=${encodeURIComponent(searchTerm)}`);
    }
  };

  const steps = [
    { icon: Search, title: 'Busque', description: 'Encontre cuidadores perto de você' },
    { icon: CalendarCheck, title: 'Agende', description: 'Escolha datas e detalhes' },
    { icon: MessageSquareHeart, title: 'Comunique', description: 'Fale com o cuidador' },
    { icon: CreditCard, title: 'Pague', description: 'Pagamento seguro' },
  ];

  return (
    <div 
      className="relative overflow-hidden pt-24 md:pt-40 pb-24 md:pb-40"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1749808157576-6ff801a28db4?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.1.0)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/50"></div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          {/* Main Message */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-none">
            Seu melhor <span className="text-[#FF6B35]">amigo</span> merece o melhor
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-16 max-w-3xl mx-auto leading-relaxed font-medium">
            Conectamos você a cuidadores confiáveis. Simples, seguro e com muito amor.
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto mb-20 relative" ref={dropdownRef}>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Sua cidade"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                  if (onSearch) onSearch(e.target.value);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full px-6 py-4 rounded-xl border border-white/30 text-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent bg-white/10 backdrop-blur-md text-white placeholder-white/60 shadow-lg hover:shadow-xl transition-all"
              />
              
              {/* Dropdown de sugestões */}
              {showSuggestions && (query.length >= 3) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
                  {loading ? (
                    <div className="p-4 flex items-center justify-center text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Buscando...
                    </div>
                  ) : suggestions.length > 0 ? (
                    <ul className="max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <li key={index}>
                          <button
                            onClick={() => handleSearch(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-white/10 text-gray-200 flex items-center transition-colors"
                          >
                            <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                            {suggestion}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-gray-400 text-center">Nenhuma cidade encontrada</div>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleSearch(query)}
              className="px-10 py-4 bg-[#FF6B35] text-white font-bold rounded-xl hover:bg-[#E55A2B] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl text-lg whitespace-nowrap"
            >
              <Search className="w-5 h-5" />
              Buscar
            </button>
          </div>

          {/* How We Work - Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 md:p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/15 transition-all">
              <div className="w-14 h-14 rounded-xl bg-[#FF6B35]/20 border border-[#FF6B35]/30 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-[#FF6B35]" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Cuidado com Amor</h3>
              <p className="text-white/70 text-sm leading-relaxed">Cuidadores selecionados e verificados que tratam seu pet como família</p>
            </div>

            <div className="p-6 md:p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/15 transition-all">
              <div className="w-14 h-14 rounded-xl bg-[#2E86AB]/20 border border-[#2E86AB]/30 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-[#2E86AB]" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">100% Seguro</h3>
              <p className="text-white/70 text-sm leading-relaxed">Rastreamento em tempo real e verificação completa de cuidadores</p>
            </div>

            <div className="p-6 md:p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/15 transition-all">
              <div className="w-14 h-14 rounded-xl bg-[#06A77D]/20 border border-[#06A77D]/30 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-[#06A77D]" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Muito Fácil</h3>
              <p className="text-white/70 text-sm leading-relaxed">Encontre cuidadores, reserve e acompanhe em poucos cliques</p>
            </div>
          </div>
        </div>

        {/* CTA Section - Integrated */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-10 md:p-14 shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Você também pode ser cuidador
          </h2>
          <p className="text-white/80 mb-8 mx-auto text-lg">
            Ganhe dinheiro cuidando de pets. Total controle de seu tempo, sem experiência necessária.
          </p>
          <Link
            href="/cadastro"
            className="inline-block px-10 py-4 bg-gradient-to-r from-[#FF6B35] to-[#F77F00] text-white font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xl hover:shadow-2xl text-lg"
          >
            Começar como Cuidador
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Hero;
