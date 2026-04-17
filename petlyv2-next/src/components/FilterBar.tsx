'use client';

import { Dog, Cat, Bird, MoreHorizontal, MapPin } from 'lucide-react';

const FilterBar = ({
  selectedType,
  onTypeChange,
  location,
  onLocationChange,
}: {
  selectedType: string;
  onTypeChange: (type: string) => void;
  location: string;
  onLocationChange: (val: string) => void;
}) => {
  const types = [
    { id: 'all', label: 'Todos', icon: MoreHorizontal },
    { id: 'dog', label: 'Cães', icon: Dog },
    { id: 'cat', label: 'Gatos', icon: Cat },
    { id: 'bird', label: 'Pássaros', icon: Bird },
    { id: 'other', label: 'Outros', icon: MoreHorizontal },
  ];

  return (
    <div className="bg-white border-b border-gray-100 py-6 sticky top-16 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {types.map((type) => {
              const Icon = type.icon;
              const isActive = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => onTypeChange(type.id)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-all whitespace-nowrap border-2 ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-64">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                placeholder="Filtrar por cidade..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
