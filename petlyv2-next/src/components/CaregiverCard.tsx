'use client';

import Image from 'next/image';
import { Star, MapPin, CheckCircle2, ChevronRight } from 'lucide-react';
import { Caregiver } from '@/data/caregivers';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const CaregiverCard = ({ caregiver }: { caregiver: Caregiver }) => {
  const router = useRouter();

  const handleBooking = () => {
    router.push(`/reserva/${caregiver.id}`);
  };
  
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden transition-all hover:shadow-2xl cursor-pointer group flex flex-col h-full"
    >
      <div className="relative h-56">
        <Image
          src={caregiver.avatar}
          alt={caregiver.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700 flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          {caregiver.rating} ({caregiver.reviews})
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {caregiver.name}
          </h3>
          <div className="text-right">
            <span className="text-sm font-semibold text-gray-500">R$</span>
            <span className="text-2xl font-black text-indigo-600">{caregiver.price}</span>
            <span className="text-sm font-semibold text-gray-500">/dia</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
          <MapPin className="w-4 h-4 text-indigo-400" />
          {caregiver.location}
        </div>

        <div className="mb-6 flex-1">
          <p className="text-sm text-gray-600 line-clamp-2 italic mb-4">&quot;{caregiver.bio}&quot;</p>
          <div className="flex flex-wrap gap-2">
            {caregiver.specialties.slice(0, 2).map((s, idx) => (
              <span
                key={idx}
                className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                {s}
              </span>
            ))}
            {caregiver.specialties.length > 2 && (
              <span className="bg-gray-50 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-md">
                +{caregiver.specialties.length - 2} mais
              </span>
            )}
          </div>
        </div>

        <button 
        onClick={handleBooking}
        className="w-full bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white">
          Reservar Agora
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default CaregiverCard;
