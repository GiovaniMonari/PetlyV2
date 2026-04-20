'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PawPrint, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  onBeCaregiverClick?: () => void;
  onAuthClick?: () => void;
}

const Navbar = ({ onBeCaregiverClick, onAuthClick }: NavbarProps) => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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

            <button
              onClick={onBeCaregiverClick}
              className="text-sm font-medium text-gray-300 hover:text-[#FF6B35] transition-colors"
            >
              Ser um Cuidador
            </button>

            <button
              onClick={onAuthClick}
              className="px-6 py-2 bg-[#FF6B35] text-white text-sm font-semibold rounded-lg hover:bg-[#E55A2B] active:scale-95 transition-all shadow-sm"
            >
              Entrar
            </button>
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
          <Link
            href="/cuidadores"
            onClick={() => setMobileOpen(false)}
            className={`py-2 text-sm font-medium transition-colors ${
              pathname === '/cuidadores' ? 'text-[#FF6B35]' : 'text-gray-300 hover:text-white'
            }`}
          >
            Encontrar Cuidador
          </Link>
          <button
            onClick={() => { setMobileOpen(false); onBeCaregiverClick?.(); }}
            className="py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors text-left"
          >
            Ser um Cuidador
          </button>
          <button
            onClick={() => { setMobileOpen(false); onAuthClick?.(); }}
            className="w-full py-2 bg-[#FF6B35] text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Entrar
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;