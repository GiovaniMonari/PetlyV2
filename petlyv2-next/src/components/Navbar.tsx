'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PawPrint, Menu, X, LogOut, User, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getUser, logout } from '@/utils/api';

interface NavbarProps {
  onBeCaregiverClick?: () => void;
  onAuthClick?: () => void;
}

const Navbar = ({ onBeCaregiverClick, onAuthClick }: NavbarProps) => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getUser());
    
    // Listen for storage events to update user info (e.g. avatar change)
    const handleStorageChange = () => {
      setUser(getUser());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setUser(null);
    window.location.href = '/';
  };

  const isTutor = user?.role === 'tutor';

  return (
    <nav className="bg-black/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <PawPrint className="w-6 h-6 text-[#FF6B35]" />
            <span className="text-lg font-bold text-white hidden sm:inline">Petly</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {(!user || user.role !== 'caregiver') && (
              <Link
                href="/cuidadores"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/cuidadores'
                    ? 'text-[#FF6B35]'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Encontrar Cuidador
              </Link>
            )}

            {isTutor && (
              <Link
                href="/favoritos"
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname === '/favoritos'
                    ? 'text-[#FF6B35]'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${pathname === '/favoritos' ? 'fill-[#FF6B35]' : ''}`} />
                Favoritos
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/perfil" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors">
                  <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-white/10">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span>Olá, {user.name.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500/10 text-red-400 text-sm font-semibold rounded-lg hover:bg-red-500/20 active:scale-95 transition-all shadow-sm flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sair
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-6 py-2 bg-[#FF6B35] text-white text-sm font-semibold rounded-lg hover:bg-[#E55A2B] active:scale-95 transition-all shadow-sm"
              >
                Entrar
              </Link>
            )}
          </div>

          {/* Mobile burger */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen
              ? <X className="w-6 h-6 text-gray-300" />
              : <Menu className="w-6 h-6 text-gray-300" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0f0f0f] px-4 pb-4 flex flex-col gap-2">
          {(!user || user.role !== 'caregiver') && (
            <Link
              href="/cuidadores"
              onClick={() => setMobileOpen(false)}
              className={`py-2 text-sm font-medium transition-colors ${
                pathname === '/cuidadores' ? 'text-[#FF6B35]' : 'text-gray-300 hover:text-white'
              }`}
            >
              Encontrar Cuidador
            </Link>
          )}
          {isTutor && (
            <Link
              href="/favoritos"
              onClick={() => setMobileOpen(false)}
              className={`py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                pathname === '/favoritos' ? 'text-[#FF6B35]' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${pathname === '/favoritos' ? 'fill-[#FF6B35]' : ''}`} />
              Favoritos
            </Link>
          )}
            {user ? (
              <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-white/10">
                <Link href="/perfil" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm text-gray-300 px-4 py-2 hover:bg-white/5 rounded-lg transition-colors">
                  <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-white/10">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span>Olá, {user.name}</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="w-full text-left py-2 text-red-400 hover:text-red-300 font-semibold transition-colors text-sm flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sair
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center py-2 bg-[#FF6B35] text-white font-semibold rounded-lg transition-colors text-sm block"
              >
                Entrar
              </Link>
            )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;