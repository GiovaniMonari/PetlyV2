import { Bird, Cat, Dog, MoreHorizontal, Rat } from "lucide-react";

const FilterCards = ({
  selectedType,
  onTypeChange,
}: {
  selectedType: string;
  onTypeChange: (type: string) => void;
}) => {
  const types = [
    { id: 'all', label: 'Todos', icon: MoreHorizontal },
    { id: 'dog', label: 'Cães', icon: Dog },
    { id: 'cat', label: 'Gatos', icon: Cat },
    { id: 'bird', label: 'Pássaros', icon: Bird },
    { id: 'other', label: 'Outros', icon: Rat },
  ];

  return (
    <section className="py-10 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-5 bg-[#A23B72] rounded-full"></div>
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Filtrar por tipo de pet</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {types.map((type) => {
            const Icon = type.icon;
            const isActive = selectedType === type.id;

            return (
              <button
                key={type.id}
                onClick={() => onTypeChange(type.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  isActive
                    ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-md'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#FF6B35] hover:shadow-sm'
                }`}
              >
                <Icon className="w-6 h-6 mb-2" />
                <span className="text-sm font-semibold">
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FilterCards;