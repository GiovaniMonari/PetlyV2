'use client';

import Image from 'next/image';
import { Star, MapPin, CheckCircle2, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CaregiverCard = ({ caregiver }: { caregiver: any }) => {
  const router = useRouter();

  const openCaregiverPage = () => {
    router.push(`/cuidadores/${caregiver.id}`);
  };
  
  return (
    <div
      onClick={openCaregiverPage}
      className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden transition-all hover:shadow-xl hover:shadow-[#FF6B35]/10 hover:border-[#FF6B35]/50 cursor-pointer group flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden bg-black/40 flex items-center justify-center">
        {caregiver.avatar ? (
          <Image
            src={caregiver.avatar}
            alt={caregiver.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
            <span className="text-gray-500 font-bold text-4xl uppercase">{caregiver.name.charAt(0)}</span>
          </div>
        )}
        
        {/* Rating Badge */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-semibold text-white border border-white/20 flex items-center gap-1 shadow-lg">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          {caregiver.rating}
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4 flex flex-col flex-1">
        
        {/* Name and Location */}
        <h3 className="text-base font-bold text-white mb-1">
          {caregiver.name}
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <MapPin className="w-3 h-3" />
          {caregiver.location}
        </div>

        {/* Bio */}
        <p className="text-xs text-gray-400 line-clamp-2 mb-3 flex-1">
          {caregiver.bio}
        </p>

        {/* Specialties */}
        <div className="mb-4 flex flex-wrap gap-1">
          {caregiver.specialties.slice(0, 2).map((s: string, idx: number) => (
            <span key={idx} className="bg-white/10 text-gray-300 text-xs font-semibold px-2 py-1 rounded border border-white/5">
              {s}
            </span>
          ))}
        </div>

        {/* Price and Button */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div>
            <p className="text-xs text-gray-400 font-medium">A partir de</p>
            <p className="text-base font-bold text-white">
              R$ {(
                Number(caregiver.minPrice) || 
                Number(caregiver.price) || 
                Number(caregiver.services?.[0]?.price) || 
                0
              ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={(event) => {
              event.stopPropagation();
              openCaregiverPage();
            }}
            className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#E55A2B] active:scale-95 transition-all shadow-sm"
          >
            Ver perfil
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaregiverCard;
