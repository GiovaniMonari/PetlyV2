'use client';

import { PawPrint, User, Menu } from 'lucide-react';

const Navbar = ({ onSearchClick, onAuthClick, onBeCaregiverClick }: {
  onSearchClick: () => void;
  onAuthClick: () => void;
  onBeCaregiverClick: () => void;
}) => {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Petly
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={onSearchClick}
              className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
            >
              Encontrar Cuidador
            </button>
            <button
              onClick={onBeCaregiverClick}
              className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
            >
              Ser um Cuidador
            </button>
            <button
              onClick={onAuthClick}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Entrar</span>
            </button>
          </div>

          <div className="md:hidden">
            <Menu className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
