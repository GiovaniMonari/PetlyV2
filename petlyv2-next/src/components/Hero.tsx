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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
