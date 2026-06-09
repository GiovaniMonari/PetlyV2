'use client';

import Link from 'next/link';
import { Mail, Phone, ShieldCheck, MessageCircle, Globe, Share2 } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { getUser } from '@/utils/api';

const Footer = () => {
  const user = getUser();
  const isCaregiver = user?.role === 'caregiver';

  return (
    <footer className="bg-[#050505] text-white py-16 md:py-20 border-t border-white/10 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BrandLogo size="md" />
            </div>
            <p className="text-gray-400 text-sm max-w-md mb-6 leading-relaxed">
              Fique tranquilo com seu pet em boas mãos. Cuidadores qualificados sempre ao seu alcance. Cuidado seguro e responsável.
            </p>
          </div>

          {/* Explore */}
          {!isCaregiver && (
              <div>
                <h4 className="font-bold text-white mb-4 font-semibold">Explore</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                  <li>
                    <Link href="/cuidadores" className="hover:text-[#FF6B35] transition-colors font-medium">
                      Encontrar Cuidador
                    </Link>
                  </li>
                  <li>
                    <Link href="/cadastro" className="hover:text-[#FF6B35] transition-colors font-medium">
                      Ser Cuidador
                    </Link>
                  </li>
                </ul>
              </div>
            )
          }

          {/* Support */}
          <div>
            <h4 className="font-bold text-white mb-4 font-semibold">Suporte</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex items-center gap-2 font-medium hover:text-[#FF6B35] transition-colors">
                <Mail className="w-4 h-4" />
                <a href="mailto:contato@petly.com" className="inline-block">
                  contato@petly.com
                </a>
              </li>
              <li className="flex items-center gap-2 font-medium hover:text-[#FF6B35] transition-colors">
                <ShieldCheck className="w-4 h-4" />
                <span>Segurança</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-white mb-4 font-semibold">Legal</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <Link href="/termos" className="hover:text-[#FF6B35] transition-colors font-medium">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-[#FF6B35] transition-colors font-medium">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-[#FF6B35] transition-colors font-medium">
                  Cookies
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="hover:text-[#FF6B35] transition-colors font-medium">
                  Como funciona
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {isCaregiver && (
          <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[#FF6B35] font-semibold uppercase tracking-[0.2em] text-xs mb-2">
                  Área do Cuidador
                </p>
                <h3 className="text-white text-xl font-semibold">
                  Gerencie suas reservas e serviços com facilidade.
                </h3>
                <p className="text-gray-400 text-sm mt-2 max-w-2xl">
                  Acesse o painel e atualize sua disponibilidade, serviços e perfil a qualquer momento.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-[#FF6B35] hover:bg-[#FF6B35]"
                >
                  Ir para Painel
                </Link>
                <Link
                  href="/dashboard/servicos"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm font-medium text-white transition hover:border-[#FF6B35] hover:bg-[#FF6B35]"
                >
                  Meus Serviços
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Bottom */}
        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm font-medium">
            © 2026 Petly. Projeto desenvolvido por Giovani Taver Monari.
          </p>
          {isCaregiver && (
            <p className="text-gray-400 text-sm font-medium">
              Bem-vindo, cuidador! Sua jornada começa no painel.
            </p>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
