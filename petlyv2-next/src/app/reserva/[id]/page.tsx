'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Calendar, PawPrint, Clock, CreditCard, ArrowLeft, CheckCircle2, Star } from 'lucide-react';
import Link from 'next/link';

// Mock - depois você pode puxar pelo ID
const caregiver = {
  name: 'Ana Souza',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
  price: 120,
  location: 'Campinas, SP',
  rating: 4.9,
  reviews: 234,
  specialties: ['Cães pequenos', 'Passeios diários', 'Medicação'],
};

export default function ReservaPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [service, setService] = useState('hospedagem');
  const [pets, setPets] = useState(1);
  const [isConfirmed, setIsConfirmed] = useState(false);

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
    <div className="min-h-screen bg-white py-8 px-4">
      {/* Header com voltar */}
      <div className="max-w-5xl mx-auto mb-6">
        <Link href="/cuidadores" className="inline-flex items-center gap-2 text-[#FF6B35] font-semibold hover:text-[#f56a2f] transition-all">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        
        {/* CARD DO CUIDADOR */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="relative h-48 bg-gray-100 overflow-hidden">
            <Image
              src={caregiver.avatar}
              alt={caregiver.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{caregiver.name}</h2>
                <p className="text-gray-600 font-medium text-sm">{caregiver.location}</p>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4 py-3 border-y border-gray-200">
              <Star className="w-4 h-4 text-[#F77F00] fill-current" />
              <span className="font-bold text-gray-900">{caregiver.rating}</span>
              <span className="text-gray-500 font-medium text-sm">({caregiver.reviews})</span>
            </div>

            {/* Especialidades */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Especialidades</p>
              <div className="flex flex-wrap gap-2">
                {caregiver.specialties.map((s, i) => (
                  <span key={i} className="bg-[#FF6B35] text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Preço */}
            <div className="bg-[#FF6B35] rounded-lg p-4 text-white text-center">
              <p className="text-sm font-semibold opacity-90">Valor por dia</p>
              <p className="text-2xl font-bold">
                R$ {caregiver.price}
              </p>
            </div>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">
            Finalizar Reserva
          </h1>

          {/* Datas */}
          <div className="mb-6">
            <label className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[#FF6B35]" />
              Escolha as datas
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Data inicial</p>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-[#FF6B35] outline-none transition-all"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Data final</p>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-[#FF6B35] outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Tipo de serviço */}
          <div className="mb-6">
            <label className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <PawPrint className="w-4 h-4 text-[#A23B72]" />
              Tipo de serviço
            </label>

            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 font-semibold text-gray-700 focus:ring-2 focus:ring-[#FF6B35] outline-none cursor-pointer bg-white transition-all"
            >
              <option value="hospedagem">Hospedagem (diária completa)</option>
              <option value="visita">Visita em domicílio</option>
              <option value="passeio">Passeio (por hora)</option>
            </select>
          </div>

          {/* Número de pets */}
          <div className="mb-6">
            <label className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#2E86AB]" />
              Quantos pets?
            </label>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPets(Math.max(1, pets - 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 text-[#FF6B35] font-bold hover:bg-gray-50 transition-all"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={10}
                value={pets}
                onChange={(e) => setPets(Math.max(1, Number(e.target.value)))}
                className="flex-1 border border-gray-300 rounded-lg p-2 text-center font-bold focus:ring-2 focus:ring-[#FF6B35] outline-none"
              />
              <button
                onClick={() => setPets(Math.min(10, pets + 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 text-[#FF6B35] font-bold hover:bg-gray-50 transition-all"
              >
                +
              </button>
            </div>
          </div>

          {/* RESUMO */}
          {totalDays > 0 && (
            <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3">Resumo da Reserva</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-gray-600 font-medium text-sm">
                  <span>{totalDays} dia{totalDays > 1 ? 's' : ''} × R$ {caregiver.price}</span>
                  <span className="font-bold text-[#FF6B35]">R$ {totalDays * caregiver.price}</span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-[#FF6B35]">
                    R$ {total}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* BOTÃO */}
          <button
            onClick={() => setIsConfirmed(true)}
            disabled={!startDate || !endDate}
            className="w-full bg-[#FF6B35] hover:bg-[#f56a2f] text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-4 h-4" />
            {startDate && endDate ? 'Confirmar Reserva' : 'Selecione as datas'}
          </button>

          {/* Segurança */}
          <div className="mt-4 flex items-center gap-2 text-center justify-center text-gray-600 font-medium text-sm">
            <CheckCircle2 className="w-4 h-4 text-[#06A77D] flex-shrink-0" />
            <span>Pagamento seguro | Garantia de qualidade</span>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {isConfirmed && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-lg">
            <div className="w-16 h-16 bg-[#06A77D] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reserva Confirmada!</h2>
            <p className="text-gray-600 font-medium mb-4 text-sm">
              Você receberá um email de confirmação em instantes.
            </p>
            <button
              onClick={() => setIsConfirmed(false)}
              className="w-full bg-[#FF6B35] hover:bg-[#f56a2f] text-white py-2 rounded-lg font-bold text-sm transition-all"
            >
              Voltar para home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}