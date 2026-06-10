'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Briefcase,
  Settings,
  Calendar,
  PawPrint,
  Star,
  User,
  LogOut,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import ProfilePhotoUpload from './ProfilePhotoUpload';
import { logout } from '@/utils/api';

interface DashboardSidebarProps {
  profile: any;
  onProfileUpdate?: (updatedProfile: any) => void;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Painel Geral', icon: Briefcase },
  { href: '/dashboard/servicos', label: 'Serviços & Preços', icon: Settings },
  { href: '/dashboard/disponibilidade', label: 'Disponibilidade', icon: Calendar },
  { href: '/dashboard/capacidade', label: 'Capacidade de Pets', icon: PawPrint },
  { href: '/dashboard/avaliacoes', label: 'Avaliações', icon: Star },
  { href: '/perfil', label: 'Meu Perfil', icon: User },
];

export default function DashboardSidebar({ profile, onProfileUpdate }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside className="md:w-72 flex-shrink-0">
      {/* Profile Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 mb-4 shadow-2xl">
        {/* Glow background */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-[#FF6B35]/10 blur-[60px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="relative p-6">
          {/* Avatar */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <ProfilePhotoUpload
                currentAvatar={profile.avatar}
                userName={profile.name}
                onUploadSuccess={(newAvatarUrl) => {
                  const updatedProfile = { ...profile, avatar: newAvatarUrl };
                  if (onProfileUpdate) onProfileUpdate(updatedProfile);
                  localStorage.setItem('petly_user', JSON.stringify(updatedProfile));
                  window.dispatchEvent(new Event('storage'));
                }}
              />
            </div>
            <h3 className="text-white font-bold text-base leading-tight mb-1">{profile.name}</h3>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs text-[#06A77D] font-semibold bg-[#06A77D]/10 border border-[#06A77D]/20 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Cuidador Verificado
              </span>
            </div>
            {profile.location && (
              <p className="text-xs text-gray-500 mt-2">{profile.location}</p>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-2xl bg-black/30 border border-white/5">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400" />
                <span className="text-sm font-bold text-white">{(profile.rating ?? 0).toFixed(1)}</span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">Avaliação</p>
            </div>
            <div className="text-center border-l border-white/10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#FF6B35]" />
                <span className="text-sm font-bold text-white">{profile.reviewsCount ?? 0}</span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">Reviews</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF6B35] to-[#E55A2B] text-white shadow-lg shadow-[#FF6B35]/25'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#FF6B35]'} transition-colors`} />
                  <span>{label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-500/8 hover:bg-red-500/15 border border-red-500/15 hover:border-red-500/30 text-red-400 hover:text-red-300 font-semibold text-sm transition-all duration-200"
          >
            <LogOut className="w-4 h-4" /> Sair da conta
          </button>
        </div>
      </div>

      {/* Quick tip card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#FF6B35]/15 to-[#06A77D]/10 border border-[#FF6B35]/20 p-5">
        <p className="text-xs font-bold text-[#FF6B35] uppercase tracking-wider mb-1">Dica do dia</p>
        <p className="text-xs text-gray-300 leading-relaxed">
          Perfis com foto e bio completa recebem <strong className="text-white">3x mais</strong> solicitações de tutores.
        </p>
      </div>
    </aside>
  );
}
