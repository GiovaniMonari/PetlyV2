"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PawPrint, Search, Heart, CalendarCheck, MessageSquare, CreditCard, Star, Clock, MapPin, Bell } from 'lucide-react';
import { getUser } from '@/utils/api';

const user = getUser();

export default function ComoFuncionaPage() {
  const featuresTutor = [
    {
      icon: Search,
      title: 'Buscar cuidadores',
      desc: 'Procure por localização, tipo de serviço e avaliações para encontrar o profissional ideal.'
    },
    {
      icon: Heart,
      title: 'Favoritos',
      desc: 'Salve cuidadores que gostou para consultar e reservar mais tarde.'
    },
    {
      icon: CalendarCheck,
      title: 'Reservas e calendário',
      desc: 'Gerencie disponibilidade, confirme reservas e acompanhe suas próximas hospedagens.'
    },
    {
      icon: PawPrint,
      title: 'Perfil do pet',
      desc: 'Cadastre seus pets com informações e preferências para facilitar o atendimento.'
    },
  ];

  const featuresCaregiver = [
    {
      icon: Clock,
      title: 'Defina sua disponibilidade',
      desc: 'Configure horários, tipos de serviço e períodos disponíveis para receber pets.'
    },
    {
      icon: Star,
      title: 'Construa sua reputação',
      desc: 'Receba avaliações de tutores e aumente sua visibilidade na plataforma para conseguir mais reservas.'
    },
    {
      icon: MessageSquare,
      title: 'Comunique-se com tutores',
      desc: 'Converse diretamente com os donos dos pets para alinhar detalhes e necessidades específicas.'
    },
    {
      icon: Bell,
      title: 'Gerencie suas reservas',
      desc: 'Receba notificações, aceite ou recuse pedidos e organize sua agenda de hospedagens.'
    },
    {
      icon: MapPin,
      title: 'Destaque sua localização',
      desc: 'Apareça nas buscas por região e seja encontrado por tutores próximos a você.'
    },
    {
      icon: CreditCard,
      title: 'Receba pagamentos seguros',
      desc: 'A plataforma gerencia os pagamentos para você, garantindo segurança e praticidade.'
    },
  ];

  const features = user?.role === 'caregiver' ? featuresCaregiver : featuresTutor;

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-5rem)] bg-transparent text-gray-200">
        <div className="border-b border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#FF6B35]/6 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
            <p className="text-sm uppercase tracking-[0.3em] text-[#FF6B35]">Como funciona</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold text-white mb-4">
              {user?.role === 'caregiver' 
                ? 'Como o Petly ajuda você a crescer como cuidador'
                : 'Como o Petly conecta tutores e cuidadores'}
            </h1>
            
            {user ? (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white">Olá, {user.name?.split(' ')[0]}</h2>
                <p className="text-lg text-gray-400 max-w-3xl leading-relaxed mb-4">
                  {user.role === 'caregiver'
                    ? 'Gerencie sua disponibilidade, serviços e reservas a partir do seu painel. Aumente sua visibilidade e receba reservas com segurança.'
                    : 'Encontre cuidadores de confiança, salve favoritos e gerencie o perfil dos seus pets e reservas.'}
                </p>
                <div className="flex gap-3">
                  {user.role === 'caregiver' ? (
                    <>
                      <Link href="/dashboard" className="px-6 py-3 bg-[#06A77D] text-white font-semibold rounded-lg hover:bg-[#058b68]">Ir ao Painel</Link>
                      <Link href="/perfil" className="px-6 py-3 border border-white/10 text-white rounded-lg">Meu Perfil</Link>
                    </>
                  ) : (
                    <>
                      <Link href="/cuidadores" className="px-6 py-3 bg-[#FF6B35] text-white font-semibold rounded-lg hover:bg-[#E55A2B]">Encontrar Cuidador</Link>
                      <Link href="/my-pets" className="px-6 py-3 border border-white/10 text-white rounded-lg">Meus Pets</Link>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-lg text-gray-400 max-w-3xl leading-relaxed mb-8">
                O Petly facilita encontrar cuidadores de confiança, conversar com eles, gerenciar reservas
                e cuidar dos seus pets com segurança. Abaixo estão as principais funcionalidades da plataforma.
              </p>
            )}

            {/* Cards - só aparecem se NÃO for cuidador logado, ou se for usuário não logado */}
            {(user?.role !== 'caregiver' || !user) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {features.map((f, idx) => {
                  const Icon = f.icon;
                  return (
                    <div key={idx} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-md">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#FF6B35]/10 text-[#FF6B35] mb-4">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                      <p className="text-sm text-gray-300">{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cards específicos para cuidadores logados */}
            {user?.role === 'caregiver' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuresCaregiver.map((f, idx) => {
                  const Icon = f.icon;
                  return (
                    <div key={idx} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-md hover:border-[#06A77D]/30 transition-colors">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#06A77D]/10 text-[#06A77D] mb-4">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                      <p className="text-sm text-gray-300">{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {!user && (
              <div className="mt-12 flex flex-col sm:flex-row gap-3">
                <Link href="/cuidadores" className="px-6 py-3 bg-[#FF6B35] text-white font-semibold rounded-lg hover:bg-[#E55A2B]">
                  Encontrar Cuidador
                </Link>
                <Link href="/cadastro" className="px-6 py-3 border border-white/10 text-white rounded-lg">
                  Criar conta
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}