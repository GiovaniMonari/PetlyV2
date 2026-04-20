import { Search, CalendarCheck, MessageSquareHeart, CreditCard } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    { icon: Search, title: 'Busque', description: 'Encontre cuidadores perto de você' },
    { icon: CalendarCheck, title: 'Agende', description: 'Escolha datas e detalhes' },
    { icon: MessageSquareHeart, title: 'Comunique', description: 'Fale com o cuidador' },
    { icon: CreditCard, title: 'Pague', description: 'Pagamento seguro' },
  ];

  return (
    <section className="bg-gray-50 py-20 md:py-24 border-t border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-[#2E86AB] rounded-full"></div>
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Processo</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Como funciona</h2>
          <p className="text-lg text-gray-600 font-medium">Simples, seguro e com tudo que você precisa</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="group">
                <div className="w-16 h-16 bg-[#FF6B35] rounded-xl flex items-center justify-center text-white mb-5 group-hover:shadow-lg transition-all">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
