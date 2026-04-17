'use client';

import Image from 'next/image';
import { Search, MapPin, Heart, ShieldCheck, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero = ({ onSearch }: { onSearch: (val: string) => void }) => {
  return (
    <div className="relative overflow-hidden bg-white pt-16 pb-32">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 -z-10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              O amor que seu <span className="text-indigo-600">pet merece</span>, quando você não pode estar lá.
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg">
              Conectamos tutores preocupados com cuidadores apaixonados e verificados. Hospedagem, passeios e carinho garantido.
            </p>

            <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 max-w-2xl border border-gray-100">
              <div className="flex-1 flex items-center px-4 gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Qual cidade você está?"
                  className="w-full py-3 outline-none text-gray-700"
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                <MapPin className="w-5 h-5" />
                Buscar
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>Cuidadores Verificados</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Suporte 24/7</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Heart className="w-4 h-4 text-red-500" />
                <span>Seguro Veterinário</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:block relative"
          >
            <Image
              src="https://images.unsplash.com/photo-1749808157576-6ff801a28db4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Cachorro feliz sendo acariciado"
              width={800}
              height={600}
              className="rounded-3xl shadow-2xl"
              priority
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <ShieldCheck className="text-green-600 w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">100% Seguro</p>
                  <p className="text-xs text-gray-500">Pagamento Garantido</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
