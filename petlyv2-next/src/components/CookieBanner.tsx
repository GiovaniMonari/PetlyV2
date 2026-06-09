'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCookie, setCookie } from '@/utils/cookies';

const COOKIE_NAME = 'petly_cookie_consent';

export default function CookieBanner() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setAccepted(Boolean(getCookie(COOKIE_NAME)));
  }, []);

  const handleAccept = () => {
    setCookie(COOKIE_NAME, 'accepted', 365);
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(95vw,1100px)] -translate-x-1/2 rounded-3xl border border-white/10 bg-[#090909]/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-300 font-medium">Usamos cookies para melhorar sua experiência, lembrar preferências e entregar funcionalidades essenciais da plataforma.</p>
          <p className="mt-2 text-xs text-gray-500">Leia nossa <Link href="/termos" className="text-[#FF6B35] hover:text-[#E55A2B]">Política de Termos</Link> e <Link href="/privacidade" className="text-[#FF6B35] hover:text-[#E55A2B]">Política de Privacidade</Link>.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/cookies" className="text-sm text-white/80 hover:text-white transition-colors">
            Saiba mais sobre cookies
          </Link>
          <button
            type="button"
            onClick={handleAccept}
            className="inline-flex items-center justify-center rounded-full bg-[#FF6B35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E55A2B]"
          >
            Aceitar cookies
          </button>
        </div>
      </div>
    </div>
  );
}
