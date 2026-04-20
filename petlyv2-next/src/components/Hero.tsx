'use client';

import { Search, Heart, Shield, Zap, CalendarCheck, MessageSquareHeart, CreditCard } from 'lucide-react';

const Hero = ({ onSearch, onBecomeCaregiverClick }: { onSearch: (val: string) => void; onBecomeCaregiverClick?: () => void }) => {
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto mb-20">
            <input
              type="text"
              placeholder="Sua cidade"
              onChange={(e) => onSearch(e.target.value)}
              className="flex-1 px-6 py-4 rounded-xl border border-white/30 text-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent bg-white/10 backdrop-blur-md text-white placeholder-white/60 shadow-lg hover:shadow-xl transition-all"
            />
            <button
              onClick={() => {
                const section = document.getElementById('caregivers-section');
                if (section) {
                  section.scrollIntoView({ behavior: 'smooth' });
                }
              }}
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
          <button
            onClick={onBecomeCaregiverClick}
            className="px-10 py-4 bg-gradient-to-r from-[#FF6B35] to-[#F77F00] text-white font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xl hover:shadow-2xl text-lg"
          >
            Começar como Cuidador
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
