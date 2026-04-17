'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Calendar, PawPrint, Clock, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock - depois você pode puxar pelo ID
const caregiver = {
  name: 'Ana Souza',
  avatar: '/caregiver.jpg',
  price: 120,
  location: 'Campinas, SP',
};

export default function ReservaPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [service, setService] = useState('hospedagem');
  const [pets, setPets] = useState(1);

  const totalDays =
    startDate && endDate
      ? Math.max(
          1,
          Math.ceil(
            (new Date(endDate).getTime() -
              new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const total = totalDays * caregiver.price;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
        
        {/* CARD DO CUIDADOR */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="relative h-48">
            <Image
              src={caregiver.avatar}
              alt={caregiver.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-5">
            <h2 className="text-xl font-bold">{caregiver.name}</h2>
            <p className="text-gray-500 text-sm">{caregiver.location}</p>

            <div className="mt-4 text-indigo-600 font-black text-2xl">
              R$ {caregiver.price}
              <span className="text-sm text-gray-500 font-medium">/dia</span>
            </div>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="md:col-span-2 bg-white rounded-3xl shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">
            Finalizar Reserva 🐾
          </h1>

          {/* Datas */}
          <div className="mb-6">
            <label className="font-semibold flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Datas
            </label>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-xl p-3"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded-xl p-3"
              />
            </div>
          </div>

          {/* Tipo de serviço */}
          <div className="mb-6">
            <label className="font-semibold flex items-center gap-2 mb-2">
              <PawPrint className="w-4 h-4" />
              Tipo de serviço
            </label>

            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full border rounded-xl p-3"
            >
              <option value="hospedagem">Hospedagem</option>
              <option value="visita">Visita em domicílio</option>
              <option value="passeio">Passeio</option>
            </select>
          </div>

          {/* Número de pets */}
          <div className="mb-6">
            <label className="font-semibold flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              Quantidade de pets
            </label>

            <input
              type="number"
              min={1}
              value={pets}
              onChange={(e) => setPets(Number(e.target.value))}
              className="w-full border rounded-xl p-3"
            />
          </div>

          {/* RESUMO */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <h3 className="font-bold mb-2">Resumo</h3>
            <p className="text-sm text-gray-600">
              {totalDays} dias x R$ {caregiver.price}
            </p>
            <p className="text-lg font-bold text-indigo-600 mt-2">
              Total: R$ {total}
            </p>
          </div>

          {/* BOTÃO */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
          >
            <CreditCard className="w-5 h-5" />
            Confirmar Reserva
          </motion.button>
        </div>
      </div>
    </div>
  );
}