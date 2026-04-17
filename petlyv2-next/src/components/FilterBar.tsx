'use client';

import { Dog, Cat, Bird, MoreHorizontal, Rat, } from 'lucide-react';

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
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {types.map((type) => {
            const Icon = type.icon;
            const isActive = selectedType === type.id;

            return (
              <button
                key={type.id}
                onClick={() => onTypeChange(type.id)}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105'
                    : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200 hover:shadow-md'
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
    </div>
  );
};

export default FilterCards;