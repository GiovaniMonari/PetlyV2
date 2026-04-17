import { Search, CalendarCheck, MessageSquareHeart, CreditCard } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      title: 'Busque Cuidadores',
      description: 'Encontre cuidadores avaliados e apaixonados por pets perto de você.',
    },
    {
      icon: CalendarCheck,
      title: 'Agende a Reserva',
      description: 'Escolha as datas e combine os detalhes diretamente com o cuidador.',
    },
    {
      icon: MessageSquareHeart,
      title: 'Receba Fotos',
      description: 'Acompanhe a rotina do seu pet com fotos e atualizações em tempo real.',
    },
    {
      icon: CreditCard,
      title: 'Pagamento Seguro',
      description: 'Pague com total segurança e tenha suporte veterinário incluso.',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
            Como funciona o PetCare Connect
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto font-medium">
            Tudo o que você precisa para viajar tranquilo e seu pet ficar feliz e seguro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-indigo-50 rounded-[32px] flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-500 rotate-12 group-hover:rotate-0">
                    <Icon className="w-10 h-10 text-indigo-600 group-hover:text-white transition-colors duration-500" />
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[120%] w-[100%] border-t-2 border-dashed border-gray-100" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
